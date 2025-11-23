#!/usr/bin/env node

/**
 * Updates ALL AnythingLLM workspaces with the latest THE_ARCHITECT_V2_PROMPT
 * This ensures all existing SOW workspaces use the correct JSON format
 */

import { readFileSync } from 'fs';

const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL || 'http://localhost:3001';
const ANYTHINGLLM_API_KEY = process.env.ANYTHINGLLM_API_KEY;

if (!ANYTHINGLLM_API_KEY) {
  console.error('❌ ANYTHINGLLM_API_KEY not set in environment');
  process.exit(1);
}

// Read and extract the prompt from the TypeScript file
function extractPromptFromFile() {
  const content = readFileSync('./frontend/lib/knowledge-base.ts', 'utf-8');
  
  // Find the THE_ARCHITECT_V2_PROMPT export
  const match = content.match(/export const THE_ARCHITECT_V2_PROMPT = `([\s\S]*?)`;/);
  
  if (!match) {
    throw new Error('Could not find THE_ARCHITECT_V2_PROMPT in knowledge-base.ts');
  }
  
  return match[1];
}

async function getAllWorkspaces() {
  const response = await fetch(`${ANYTHINGLLM_URL}/api/v1/workspaces`, {
    headers: { 'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get workspaces: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.workspaces || [];
}

async function updateWorkspacePrompt(slug, name, prompt) {
  console.log(`\n🔄 Updating workspace: ${name} (${slug})`);
  
  const response = await fetch(`${ANYTHINGLLM_URL}/api/v1/workspace/${slug}/update`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      openAiPrompt: prompt
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update ${slug}: ${error}`);
  }
  
  const result = await response.json();
  console.log(`✅ Updated workspace: ${name}`);
  return result;
}

async function main() {
  console.log('🚀 Starting workspace prompt update...');
  console.log(`📡 AnythingLLM URL: ${ANYTHINGLLM_URL}`);
  
  // Extract prompt from knowledge-base.ts
  console.log('\n📝 Extracting THE_ARCHITECT_V2_PROMPT from knowledge-base.ts...');
  const THE_ARCHITECT_V2_PROMPT = extractPromptFromFile();
  console.log(`✅ Prompt extracted: ${THE_ARCHITECT_V2_PROMPT.length} characters`);
  
  // Verify prompt has the new format
  if (!THE_ARCHITECT_V2_PROMPT.includes('role_allocation')) {
    console.error('❌ ERROR: THE_ARCHITECT_V2_PROMPT does not contain "role_allocation"');
    console.error('The prompt in knowledge-base.ts is outdated!');
    process.exit(1);
  }
  
  console.log('✅ Prompt contains "role_allocation" - format is correct');
  
  // Get all workspaces
  console.log('\n📂 Fetching all workspaces...');
  const workspaces = await getAllWorkspaces();
  console.log(`✅ Found ${workspaces.length} workspaces`);
  
  // Filter for SOW workspaces (exclude master dashboard)
  const sowWorkspaces = workspaces.filter(w => 
    w.slug !== 'sow-master-dashboard' && 
    !w.slug.includes('utility-') &&
    !w.slug.includes('test-')
  );
  
  console.log(`🎯 Found ${sowWorkspaces.length} SOW workspaces to update`);
  
  if (sowWorkspaces.length === 0) {
    console.log('ℹ️  No SOW workspaces found to update');
    return;
  }
  
  // Update each workspace
  let successCount = 0;
  let failCount = 0;
  
  for (const workspace of sowWorkspaces) {
    try {
      await updateWorkspacePrompt(workspace.slug, workspace.name, THE_ARCHITECT_V2_PROMPT);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to update ${workspace.name}:`, error.message);
      failCount++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successfully updated: ${successCount} workspaces`);
  console.log(`❌ Failed: ${failCount} workspaces`);
  console.log(`📝 Total processed: ${sowWorkspaces.length} workspaces`);
  console.log('='.repeat(80));
  
  if (failCount > 0) {
    console.log('\n⚠️  Some workspaces failed to update. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All workspaces updated successfully!');
    console.log('💡 New SOWs will now use the correct role_allocation format.');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
