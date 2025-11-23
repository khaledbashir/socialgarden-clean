import { AnythingLLMService } from '../lib/anythingllm';

async function testAnythingLLMIntegration() {
  console.log('🧪 Starting AnythingLLM Integration Tests...');
  
  const service = new AnythingLLMService();
  
  // Test 1: Create Client Workspace
  console.log('\n📋 Test 1: Create Client Workspace');
  const clientName = 'Test Client ABC';
  const workspace = await service.getMasterSOWWorkspace(clientName);
  console.log('Workspace created:', workspace);
  
  if (!workspace?.slug) {
    throw new Error('❌ Failed to create workspace');
  }
  
  // Test 2: Embed Test SOW
  console.log('\n📋 Test 2: Embed Test SOW');
  const sowTitle = 'Test SOW Document';
  const sowContent = `
# Sample SOW for Testing
## Project Overview
This is a test SOW document.

## Services
- Service 1: $1000
- Service 2: $2000

## Timeline
6 weeks
  `.trim();
  
  const embedded = await service.embedSOWInBothWorkspaces(
    sowTitle,
    sowContent,
    clientName
  );
  
  if (!embedded) {
    throw new Error('❌ Failed to embed SOW');
  }
  
  // Test 3: Create Thread
  console.log('\n📋 Test 3: Create Thread');
  const thread = await service.createThread(workspace.slug, 'Test Thread');
  
  if (!thread?.slug) {
    throw new Error('❌ Failed to create thread');
  }
  
  // Test 4: Send Chat Message
  console.log('\n📋 Test 4: Send Chat Message');
  let messageReceived = false;
  
  await service.streamChatWithThread(
    workspace.slug,
    thread.slug,
    'What services are included in this SOW?',
    (chunk) => {
      console.log('Received chunk:', chunk);
      messageReceived = true;
    }
  );
  
  if (!messageReceived) {
    throw new Error('❌ No response received from chat');
  }
  
  // Test 5: Verify Master Dashboard
  console.log('\n📋 Test 5: Verify Master Dashboard');
  const masterDashboard = await service.getOrCreateMasterDashboard();
  
  if (!masterDashboard) {
    throw new Error('❌ Failed to get/create master dashboard');
  }
  
  // Test 6: Clean Up
  console.log('\n📋 Test 6: Clean Up');
  await service.deleteThread(workspace.slug, thread.slug);
  await service.deleteWorkspace(workspace.slug);
  
  console.log('\n✅ All tests completed successfully!');
}

// Run tests
testAnythingLLMIntegration().catch(console.error);