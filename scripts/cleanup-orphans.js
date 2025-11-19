/**
 * Cleanup Orphaned Data - Removes workspaces/folders that are out of sync
 * 
 * WARNING: This script will DELETE data. Always run backup first!
 * 
 * This script:
 * 1. Identifies orphaned folders (in DB but not in AnythingLLM)
 * 2. Identifies orphaned workspaces (in AnythingLLM but not in DB)
 * 3. Optionally removes them (with confirmation)
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: process.env.DB_HOST || 'ahmad_mysql-database',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'sg_sow_user',
    password: process.env.DB_PASSWORD || 'SG_sow_2025_SecurePass!',
    database: process.env.DB_NAME || 'socialgarden_sow',
};

const ANYTHINGLLM_URL = process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

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

async function deleteAnythingLLMWorkspace(slug) {
    const response = await fetch(`${ANYTHINGLLM_URL}/api/v1/workspace/${slug}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });

    return response.ok;
}

async function cleanupOrphans(dryRun = true, confirmDelete = false) {
    console.log('🧹 Starting orphan cleanup...');
    console.log(`   Mode: ${dryRun ? 'DRY RUN (no deletions)' : 'LIVE'}`);
    console.log(`   Confirm Delete: ${confirmDelete}\n`);

    let connection;
    try {
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to database\n');

        // Get all folders from database
        const [dbFolders] = await connection.execute(
            'SELECT id, name, workspace_slug, workspace_id FROM folders WHERE workspace_slug IS NOT NULL'
        );

        // Get all workspaces from AnythingLLM
        const anythingLLMWorkspaces = await listAnythingLLMWorkspaces();

        // Create maps
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

        for (const [slug, folder] of dbWorkspaceMap) {
            if (!anythingLLMWorkspaceMap.has(slug)) {
                dbOrphans.push(folder);
            }
        }

        for (const [slug, workspace] of anythingLLMWorkspaceMap) {
            if (!dbWorkspaceMap.has(slug)) {
                anythingLLMOrphans.push(workspace);
            }
        }

        console.log('📋 Orphan Analysis:');
        console.log(`   - Orphaned folders (DB only): ${dbOrphans.length}`);
        console.log(`   - Orphaned workspaces (AnythingLLM only): ${anythingLLMOrphans.length}\n`);

        if (dbOrphans.length === 0 && anythingLLMOrphans.length === 0) {
            console.log('✅ No orphans found! Everything is in sync.\n');
            return { deleted: 0 };
        }

        // Show orphans
        if (dbOrphans.length > 0) {
            console.log('⚠️  Orphaned Folders (will be deleted from DB):');
            dbOrphans.forEach(folder => {
                console.log(`   - ${folder.name} (slug: ${folder.workspace_slug}, id: ${folder.id})`);
            });
            console.log('');
        }

        if (anythingLLMOrphans.length > 0) {
            console.log('⚠️  Orphaned Workspaces (will be deleted from AnythingLLM):');
            anythingLLMOrphans.forEach(ws => {
                console.log(`   - ${ws.name} (slug: ${ws.slug}, id: ${ws.id})`);
            });
            console.log('');
        }

        // Delete orphans (if not dry run and confirmed)
        let deletedCount = 0;

        if (!dryRun && confirmDelete) {
            console.log('🗑️  Deleting orphans...\n');

            // Delete orphaned folders from database
            for (const folder of dbOrphans) {
                try {
                    // Check if folder has SOWs
                    const [sows] = await connection.execute(
                        'SELECT COUNT(*) as count FROM sows WHERE folder_id = ?',
                        [folder.id]
                    );

                    if (sows[0].count > 0) {
                        console.log(`   ⚠️  Skipping folder "${folder.name}" - has ${sows[0].count} SOW(s)`);
                        continue;
                    }

                    await connection.execute('DELETE FROM folders WHERE id = ?', [folder.id]);
                    console.log(`   ✅ Deleted folder from DB: ${folder.name}`);
                    deletedCount++;
                } catch (error) {
                    console.error(`   ❌ Failed to delete folder ${folder.id}:`, error.message);
                }
            }

            // Delete orphaned workspaces from AnythingLLM
            for (const workspace of anythingLLMOrphans) {
                try {
                    const deleted = await deleteAnythingLLMWorkspace(workspace.slug);
                    if (deleted) {
                        console.log(`   ✅ Deleted workspace from AnythingLLM: ${workspace.name}`);
                        deletedCount++;
                    } else {
                        console.log(`   ⚠️  Failed to delete workspace: ${workspace.name}`);
                    }
                } catch (error) {
                    console.error(`   ❌ Failed to delete workspace ${workspace.slug}:`, error.message);
                }
            }

            console.log(`\n✅ Cleanup completed! Deleted ${deletedCount} orphan(s).\n`);
        } else {
            console.log('ℹ️  DRY RUN: No deletions made.');
            console.log('   Run with --live --confirm to actually delete orphans.\n');
        }

        return {
            dbOrphans: dbOrphans.length,
            anythingLLMOrphans: anythingLLMOrphans.length,
            deleted: deletedCount,
        };
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
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
    const confirmDelete = process.argv.includes('--confirm');

    if (!dryRun && !confirmDelete) {
        console.error('❌ ERROR: --confirm flag required when using --live');
        console.error('   Usage: node cleanup-orphans.js [--live] [--confirm]');
        process.exit(1);
    }

    cleanupOrphans(dryRun, confirmDelete)
        .then((result) => {
            console.log('📊 Cleanup Summary:');
            console.log(`   - Orphaned folders: ${result.dbOrphans}`);
            console.log(`   - Orphaned workspaces: ${result.anythingLLMOrphans}`);
            console.log(`   - Deleted: ${result.deleted}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Cleanup failed:', error);
            process.exit(1);
        });
}

module.exports = { cleanupOrphans };

