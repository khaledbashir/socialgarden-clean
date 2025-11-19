/**
 * Sync Database with AnythingLLM - Ensures perfect mirror
 * 
 * This script:
 * 1. Lists all workspaces in AnythingLLM
 * 2. Lists all folders in database
 * 3. Identifies orphans (workspaces in DB but not in AnythingLLM, or vice versa)
 * 4. Creates missing workspaces in AnythingLLM
 * 5. Creates missing folders in database
 * 6. Reports sync status
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || 'ahmad_mysql-database',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sg_sow_user',
    password: process.env.DB_PASSWORD || 'SG_sow_2025_SecurePass!',
    database: process.env.DB_NAME || 'socialgarden_sow',
};

const ANYTHINGLLM_URL = process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

// Import AnythingLLM service (simplified version)
async function listAnythingLLMWorkspaces() {
    const response = await fetch(`${ANYTHINGLLM_URL}/api/v1/workspaces`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to list workspaces: ${response.statusText}`);
    }

    const data = await response.json();
    return data.workspaces || [];
}

async function createAnythingLLMWorkspace(name, slug) {
    const response = await fetch(`${ANYTHINGLLM_URL}/api/v1/workspace/new`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, slug }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create workspace: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.workspace;
}

async function syncDatabaseWithAnythingLLM(dryRun = true) {
    console.log('🔄 Starting Database ↔ AnythingLLM sync...');
    console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}\n`);

    let connection;
    try {
        // Connect to database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database\n');

        // Get all folders from database
        const [dbFolders] = await connection.execute(
            'SELECT id, name, workspace_slug, workspace_id, embed_id FROM folders WHERE workspace_slug IS NOT NULL'
        );
        console.log(`📊 Database: Found ${dbFolders.length} folders with workspace_slug\n`);

        // Get all workspaces from AnythingLLM
        const anythingLLMWorkspaces = await listAnythingLLMWorkspaces();
        console.log(`📊 AnythingLLM: Found ${anythingLLMWorkspaces.length} workspaces\n`);

        // Create maps for easy lookup
        const dbWorkspaceMap = new Map();
        dbFolders.forEach(folder => {
            if (folder.workspace_slug) {
                dbWorkspaceMap.set(folder.workspace_slug, folder);
            }
        });

        const anythingLLMWorkspaceMap = new Map();
        anythingLLMWorkspaces.forEach(ws => {
            anythingLLMWorkspaceMap.set(ws.slug, ws);
        });

        // Find orphans
        const dbOrphans = [];
        const anythingLLMOrphans = [];

        // Folders in DB but not in AnythingLLM
        for (const [slug, folder] of dbWorkspaceMap) {
            if (!anythingLLMWorkspaceMap.has(slug)) {
                dbOrphans.push(folder);
            }
        }

        // Workspaces in AnythingLLM but not in DB
        for (const [slug, workspace] of anythingLLMWorkspaceMap) {
            if (!dbWorkspaceMap.has(slug)) {
                anythingLLMOrphans.push(workspace);
            }
        }

        console.log('📋 Sync Analysis:');
        console.log(`   - Folders in DB but NOT in AnythingLLM: ${dbOrphans.length}`);
        console.log(`   - Workspaces in AnythingLLM but NOT in DB: ${anythingLLMOrphans.length}`);
        console.log(`   - In sync: ${dbFolders.length - dbOrphans.length}\n`);

        if (dbOrphans.length > 0) {
            console.log('⚠️  Orphaned Folders (in DB but not in AnythingLLM):');
            dbOrphans.forEach(folder => {
                console.log(`   - ${folder.name} (slug: ${folder.workspace_slug})`);
            });
            console.log('');
        }

        if (anythingLLMOrphans.length > 0) {
            console.log('⚠️  Orphaned Workspaces (in AnythingLLM but not in DB):');
            anythingLLMOrphans.forEach(ws => {
                console.log(`   - ${ws.name} (slug: ${ws.slug})`);
            });
            console.log('');
        }

        // Fix orphans (if not dry run)
        if (!dryRun) {
            console.log('🔧 Fixing orphans...\n');

            // Create missing workspaces in AnythingLLM
            for (const folder of dbOrphans) {
                try {
                    console.log(`   Creating workspace in AnythingLLM: ${folder.name} (${folder.workspace_slug})`);
                    const workspace = await createAnythingLLMWorkspace(folder.name, folder.workspace_slug);
                    console.log(`   ✅ Created: ${workspace.id}\n`);
                } catch (error) {
                    console.error(`   ❌ Failed to create workspace ${folder.workspace_slug}:`, error.message);
                }
            }

            // Create missing folders in database
            for (const workspace of anythingLLMOrphans) {
                try {
                    console.log(`   Creating folder in database: ${workspace.name} (${workspace.slug})`);
                    const folderId = require('crypto').randomUUID();
                    await connection.execute(
                        'INSERT INTO folders (id, name, workspace_slug, workspace_id, embed_id) VALUES (?, ?, ?, ?, ?)',
                        [folderId, workspace.name, workspace.slug, workspace.id, null]
                    );
                    console.log(`   ✅ Created folder: ${folderId}\n`);
                } catch (error) {
                    console.error(`   ❌ Failed to create folder for ${workspace.slug}:`, error.message);
                }
            }
        } else {
            console.log('ℹ️  DRY RUN: No changes made. Run with --live to apply changes.\n');
        }

        console.log('✅ Sync analysis completed!');

        return {
            dbFolders: dbFolders.length,
            anythingLLMWorkspaces: anythingLLMWorkspaces.length,
            dbOrphans: dbOrphans.length,
            anythingLLMOrphans: anythingLLMOrphans.length,
            inSync: dbFolders.length - dbOrphans.length,
        };
    } catch (error) {
        console.error('❌ Sync failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run if called directly
if (require.main === module) {
    const dryRun = !process.argv.includes('--live');
    syncDatabaseWithAnythingLLM(dryRun)
        .then((result) => {
            console.log('\n📊 Final Status:');
            console.log(`   - Database folders: ${result.dbFolders}`);
            console.log(`   - AnythingLLM workspaces: ${result.anythingLLMWorkspaces}`);
            console.log(`   - In sync: ${result.inSync}`);
            console.log(`   - Orphans to fix: ${result.dbOrphans + result.anythingLLMOrphans}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Sync failed:', error);
            process.exit(1);
        });
}

module.exports = { syncDatabaseWithAnythingLLM };

