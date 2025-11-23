#!/usr/bin/env node

/**
 * Test script to verify dual workspace creation
 * Tests that both generation and client workspaces are created
 */

const ANYTHINGLLM_BASE_URL = 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

const headers = {
  'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
  'Content-Type': 'application/json',
};

async function listWorkspaces() {
  const response = await fetch(`${ANYTHINGLLM_BASE_URL}/api/v1/workspaces`, {
    method: 'GET',
    headers,
  });
  const data = await response.json();
  return data.workspaces || [];
}

async function createWorkspace(name) {
  console.log(`\n🆕 Creating workspace: ${name}`);
  const response = await fetch(`${ANYTHINGLLM_BASE_URL}/api/v1/workspace/new`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create workspace: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`✅ Created workspace: ${data.workspace.slug}`);
  return data.workspace;
}

async function runTest() {
  console.log('🧪 Testing Dual Workspace Creation\n');
  console.log('=' .repeat(60));
  
  const testName = `test-${Date.now()}`;
  
  try {
    // Step 1: List existing workspaces
    console.log('\n📋 Step 1: Listing existing workspaces...');
    const beforeWorkspaces = await listWorkspaces();
    console.log(`Found ${beforeWorkspaces.length} existing workspaces`);
    
    // Step 2: Create generation workspace
    console.log('\n🏗️ Step 2: Creating generation workspace...');
    const genWorkspace = await createWorkspace(testName);
    
    // Step 3: Create client workspace
    console.log('\n🎯 Step 3: Creating client workspace...');
    const clientWorkspace = await createWorkspace(`${testName}-client`);
    
    // Step 4: Verify both exist
    console.log('\n✅ Step 4: Verifying both workspaces exist...');
    const afterWorkspaces = await listWorkspaces();
    
    const hasGen = afterWorkspaces.some(w => w.slug === testName);
    const hasClient = afterWorkspaces.some(w => w.slug === `${testName}-client`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS:');
    console.log('=' .repeat(60));
    console.log(`Generation workspace (${testName}): ${hasGen ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`Client workspace (${testName}-client): ${hasClient ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`Total workspaces: ${afterWorkspaces.length}`);
    console.log('=' .repeat(60));
    
    if (hasGen && hasClient) {
      console.log('\n🎉 SUCCESS! Both workspaces created correctly!');
      return 0;
    } else {
      console.log('\n❌ FAILED! Missing workspaces!');
      return 1;
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    return 1;
  }
}

// Run the test
runTest().then(code => process.exit(code));
