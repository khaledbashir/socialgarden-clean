/**
 * Backup AnythingLLM Workspaces - Preserves workspace list before cleanup
 * Run this BEFORE any cleanup operations
 */

const fs = require('fs');
const path = require('path');

const ANYTHINGLLM_URL = process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

const BACKUP_DIR = path.join(__dirname, '../backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

async function backupAnythingLLMWorkspaces() {
    try {
        console.log('📦 Starting AnythingLLM workspace backup...');
        console.log(`🔗 AnythingLLM URL: ${ANYTHINGLLM_URL}`);

        // Create backup directory
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        // List all workspaces
        const workspacesResponse = await fetch(`${ANYTHINGLLM_URL}/api/v1/workspaces`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!workspacesResponse.ok) {
            throw new Error(`Failed to fetch workspaces: ${workspacesResponse.statusText}`);
        }

        const workspacesData = await workspacesResponse.json();
        const workspaces = workspacesData.workspaces || [];

        console.log(`📊 Found ${workspaces.length} workspaces in AnythingLLM`);

        // Backup workspace list
        const backupFile = path.join(BACKUP_DIR, `anythingllm_workspaces_${TIMESTAMP}.json`);
        fs.writeFileSync(
            backupFile,
            JSON.stringify(workspaces, null, 2),
            'utf8'
        );

        console.log(`✅ Workspace backup saved to: ${backupFile}`);

        // For each workspace, backup threads
        const threadsBackup = {};
        for (const workspace of workspaces) {
            try {
                const threadsResponse = await fetch(
                    `${ANYTHINGLLM_URL}/api/v1/workspace/${workspace.slug}/threads`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (threadsResponse.ok) {
                    const threadsData = await threadsResponse.json();
                    threadsBackup[workspace.slug] = threadsData.threads || [];
                    console.log(`   📝 Workspace "${workspace.name}": ${threadsBackup[workspace.slug].length} threads`);
                }
            } catch (error) {
                console.warn(`   ⚠️ Failed to backup threads for ${workspace.slug}:`, error.message);
            }
        }

        // Save threads backup
        const threadsBackupFile = path.join(BACKUP_DIR, `anythingllm_threads_${TIMESTAMP}.json`);
        fs.writeFileSync(
            threadsBackupFile,
            JSON.stringify(threadsBackup, null, 2),
            'utf8'
        );

        console.log(`✅ Threads backup saved to: ${threadsBackupFile}`);

        console.log('\n📋 Backup Summary:');
        console.log(`   - Workspaces: ${workspaces.length}`);
        console.log(`   - Workspace backup: ${backupFile}`);
        console.log(`   - Threads backup: ${threadsBackupFile}`);

        return {
            workspaces,
            threadsBackup,
            backupFile,
            threadsBackupFile,
        };
    } catch (error) {
        console.error('❌ AnythingLLM backup failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    backupAnythingLLMWorkspaces()
        .then(() => {
            console.log('\n✅ Backup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Backup failed:', error);
            process.exit(1);
        });
}

module.exports = { backupAnythingLLMWorkspaces };

