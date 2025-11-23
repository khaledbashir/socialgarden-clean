#!/usr/bin/env node

// Test script to verify the two-step workspace creation fix works
const ANYTHINGLLM_BASE_URL = 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function makeApiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${ANYTHINGLLM_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
}

async function testTwoStepWorkspaceCreation() {
  log('🚀 TESTING TWO-STEP WORKSPACE CREATION (GitHub Issue #2840 Fix)', 'info');
  
  const workspaceName = 'Test Client Prompt Fix';
  const workspaceSlug = 'test-client-prompt-fix';
  
  try {
    // STEP 1: Create workspace without prompt settings (to avoid GitHub Issue #2840)
    log('📋 STEP 1: Creating workspace (without prompt settings)', 'info');
    
    const createResponse = await makeApiCall('/api/v1/workspace/new', {
      method: 'POST',
      body: JSON.stringify({
        name: workspaceName,
        slug: workspaceSlug,
      }),
    });
    
    log(`✅ Workspace created: ${createResponse.workspace.slug}`, 'success');
    
    // STEP 2: Update workspace with prompt settings using /update endpoint
    log('⚙️ STEP 2: Setting prompt using /update endpoint', 'info');
    
    const testPrompt = `You are The Architect - Social Garden's AI assistant for Statement of Work (SOW) creation.

Your role is to help generate comprehensive, professional SOWs for Social Garden clients.`;

    const updateResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/update`, {
      method: 'PATCH',
      body: JSON.stringify({
        openAiPrompt: testPrompt,
        openAiTemp: 0.7,
        openAiHistory: 25,
      }),
    });
    
    log(`✅ Prompt successfully set using update endpoint`, 'success');
    
    // STEP 3: Test that the prompt is actually applied
    log('🔍 STEP 3: Testing prompt application', 'info');
    
    const identityResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: 'Who are you?',
        mode: 'chat',
      }),
    });
    
    log(`📨 AI Response: ${identityResponse.textResponse}`, 'info');
    
    // Check if response indicates The Architect identity
    const response = identityResponse.textResponse.toLowerCase();
    if (response.includes('architect') || response.includes('social garden') || response.includes('sow')) {
      log('✅ SUCCESS: Prompt configuration works! AI recognizes The Architect role', 'success');
      return true;
    } else {
      log('⚠️ Prompt may not be fully applied, but update endpoint worked', 'warn');
      return false;
    }
    
  } catch (error) {
    log(`❌ Two-step workspace creation failed: ${error.message}`, 'error');
    return false;
  }
}

// Run the test
testTwoStepWorkspaceCreation().then(success => {
  if (success) {
    log('🎉 TWO-STEP WORKSPACE CREATION FIX VERIFIED!', 'success');
    log('🚀 Prompt configuration now works correctly', 'success');
  } else {
    log('❌ Fix needs adjustment', 'error');
  }
  process.exit(success ? 0 : 1);
}).catch(console.error);
