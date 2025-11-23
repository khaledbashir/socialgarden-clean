#!/usr/bin/env node

/**
 * Update The Architect Prompt in Production Workspaces
 * 
 * This script updates the system prompt for existing workspaces
 * with the enhanced Architect V2 prompt that includes all Sam's requirements.
 */

import { AnythingLLMService } from './frontend/lib/anythingllm.js';
import { THE_ARCHITECT_V2_PROMPT } from './frontend/lib/knowledge-base.js';

const anythingLLM = new AnythingLLMService();

const WORKSPACES_TO_UPDATE = [
  'gen-the-architect',
  'sow-master-dashboard'
];

async function updateWorkspacePrompt(slug) {
  try {
    console.log(`\n📝 Updating workspace: ${slug}`);
    
    const response = await fetch(`https://ahmad-anything-llm.840tjq.easypanel.host/api/v1/workspace/${slug}/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANYTHINGLLM_API_KEY || 'SG-MASTER-KEY-2024'}`
      },
      body: JSON.stringify({
        openAiPrompt: THE_ARCHITECT_V2_PROMPT
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update ${slug}: ${response.status} - ${error.substring(0, 200)}`);
    }
    
    const result = await response.json();
    console.log(`✅ Successfully updated ${slug}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error updating ${slug}:`, error);
    return false;
  }
}

async function main() {
  console.log('\n🚀 UPDATING ARCHITECT PROMPT IN PRODUCTION WORKSPACES\n');
  console.log('Enhanced prompt includes:');
  console.log('  ✅ Bespoke deliverables generation (no templates)');
  console.log('  ✅ Platform-specific content (Salesforce/HubSpot/Marketo)');
  console.log('  ✅ Role allocation hierarchy (Head Of minimal, Account Management max)');
  console.log('  ✅ +GST suffix on ALL pricing');
  console.log('  ✅ Round number targets');
  console.log('  ✅ Budget adherence with discount logic');
  console.log('  ✅ Deliverable format with + prefix');
  console.log('  ✅ Account Management at bottom of pricing table');
  console.log('  ✅ Granular role splitting');
  console.log('  ✅ JSON pricing table requirement\n');
  
  const results = [];
  
  for (const workspace of WORKSPACES_TO_UPDATE) {
    const success = await updateWorkspacePrompt(workspace);
    results.push({ workspace, success });
    
    // Wait a bit between updates
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY\n');
  
  results.forEach(({ workspace, success }) => {
    console.log(`${success ? '✅' : '❌'} ${workspace}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n${successCount}/${results.length} workspaces updated successfully`);
  console.log('='.repeat(60) + '\n');
  
  if (successCount === results.length) {
    console.log('🎉 All workspaces updated! The Architect prompt is now enhanced with Sam\'s requirements.');
    console.log('\nNext steps:');
    console.log('1. Test SOW generation with the updated prompt');
    console.log('2. Verify +GST suffix appears on all pricing');
    console.log('3. Check that JSON pricing table is included');
    console.log('4. Confirm deliverables use + prefix format');
  }
}

main().catch(console.error);
