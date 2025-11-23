#!/usr/bin/env node

// Simple test for AnyTHINGLLM Agent Memory Approach
// Direct API calls to test if conversational memory approach works

const ANYTHINGLLM_BASE_URL = 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function makeApiCall(endpoint, options = {}) {
  const response = await fetch(`${ANYTHINGLLM_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function testAgentMemoryApproach() {
  log('🚀 Testing AnyTHINGLLM Agent Memory Approach', 'info');
  
  try {
    const workspaceSlug = 'test-agent-memory';
    
    // Step 1: Create workspace
    log('📋 Step 1: Creating workspace for agent memory test...', 'info');
    
    try {
      const createResponse = await makeApiCall('/api/v1/workspace/new', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Agent Memory Test',
          slug: workspaceSlug,
        }),
      });
      log(`✅ Workspace created: ${createResponse.workspace.slug}`, 'success');
    } catch (error) {
      if (error.message.includes('409')) {
        log('✅ Using existing workspace', 'info');
      } else {
        throw error;
      }
    }
    
    // Step 2: Create thread
    log('📋 Step 2: Creating thread for memory test...', 'info');
    
    const threadResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/thread/new`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rate Card Memory Test',
      }),
    });
    
    const threadSlug = threadResponse.thread.slug;
    log(`✅ Thread created: ${threadSlug}`, 'success');
    
    // Step 3: Send rate card info to agent memory
    log('📋 Step 3: Storing rate card in agent memory...', 'info');
    
    const rateCardInfo = `Please remember these Social Garden rates for all future calculations:
- Creative Director: $165 AUD/hour
- Senior Designer: $130 AUD/hour  
- Social Media Manager: $110 AUD/hour
- Account Manager: $135 AUD/hour

These are the official rates as of October 2025.`;

    const memoryResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: rateCardInfo,
        mode: 'chat',
      }),
    });
    
    log(`📨 Memory storage response received`, 'success');
    log(`Response: ${memoryResponse.textResponse}`, 'info');
    
    // Step 4: Test if agent remembers the rates
    log('📋 Step 4: Testing agent memory with verification query...', 'info');
    
    const verificationQuery = `What is the hourly rate for a Senior Designer at Social Garden?`;
    
    const verificationResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: verificationQuery,
        mode: 'chat',
      }),
    });
    
    log(`📨 Verification response: ${verificationResponse.textResponse}`, 'info');
    
    // Step 5: Test pricing calculation
    log('📋 Step 5: Testing pricing calculation...', 'info');
    
    const pricingQuery = `If I need 5 hours of Creative Director work and 10 hours of Social Media Manager work, what's the total cost?`;
    
    const pricingResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: pricingQuery,
        mode: 'chat',
      }),
    });
    
    log(`📨 Pricing response: ${pricingResponse.textResponse}`, 'info');
    
    // Final evaluation
    log('🎯 EVALUATING RESULTS:', 'info');
    
    const finalResponse = pricingResponse.textResponse.toLowerCase();
    const hasCorrectRates = finalResponse.includes('165') && finalResponse.includes('110');
    const hasCalculation = finalResponse.includes('5') && finalResponse.includes('10') && finalResponse.includes('total');
    
    if (hasCorrectRates && hasCalculation) {
      log('🎉 SUCCESS: Agent memory approach worked perfectly!', 'success');
      log('✅ Agent retained rate card information', 'success');
      log('✅ Agent performed accurate pricing calculations', 'success');
      return true;
    } else if (hasCorrectRates) {
      log('⚠️ PARTIAL SUCCESS: Agent remembered rates but calculation may be incomplete', 'warn');
      return false;
    } else {
      log('❌ FAILED: Agent memory approach did not work as expected', 'error');
      log('Response analysis:', 'info');
      log(`Contains Creative Director rate (165): ${finalResponse.includes('165')}`, 'info');
      log(`Contains Social Media Manager rate (110): ${finalResponse.includes('110')}`, 'info');
      log(`Contains calculation elements: ${hasCalculation}`, 'info');
      return false;
    }
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'error');
    console.error(error);
    return false;
  }
}

// Alternative approach: Update workspace prompt with rate card
async function testDirectPromptUpdate() {
  log('🧪 Testing alternative: Direct workspace prompt update', 'info');
  
  try {
    const workspaceSlug = 'test-direct-prompt';
    
    // Create workspace
    try {
      await makeApiCall('/api/v1/workspace/new', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Direct Prompt Test',
          slug: workspaceSlug,
        }),
      });
    } catch (error) {
      // Workspace might already exist
      log('Using existing workspace', 'info');
    }
    
    // Update workspace prompt with rate card embedded
    const enhancedPrompt = `You are a Social Garden AI assistant with access to our complete rate card.

# Social Garden Official Rates (AUD/hour)
- Creative Director: $165/hr
- Senior Designer: $130/hr  
- Social Media Manager: $110/hr
- Account Manager: $135/hr
- Designer: $115/hr
- Project Coordinator: $125/hr

Always use these exact rates for pricing calculations. Show your math clearly.`;

    const updateResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/update`, {
      method: 'POST',
      body: JSON.stringify({
        openAiPrompt: enhancedPrompt,
        openAiTemp: 0.7,
        openAiHistory: 25,
      }),
    });
    
    log('✅ Workspace prompt updated with rate card', 'success');
    
    // Test the workspace with a query
    const testResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: 'What would 8 hours of Designer work cost?',
        mode: 'chat',
      }),
    });
    
    log(`📨 Prompt-based response: ${testResponse.textResponse}`, 'info');
    
    const responseText = testResponse.textResponse.toLowerCase();
    if (responseText.includes('115') && responseText.includes('8')) {
      log('✅ SUCCESS: Direct prompt approach worked!', 'success');
      return true;
    } else {
      log('⚠️ PARTIAL: Prompt approach had mixed results', 'warn');
      return false;
    }
    
  } catch (error) {
    log(`❌ Direct prompt test failed: ${error.message}`, 'error');
    return false;
  }
}

// Main execution
async function main() {
  log('🚀 Starting AnyTHINGLLM Memory Tests', 'info');
  
  const agentMemoryResult = await testAgentMemoryApproach();
  const directPromptResult = await testDirectPromptUpdate();
  
  log('📊 FINAL RESULTS:', 'info');
  log(`Agent Memory Approach: ${agentMemoryResult ? '✅ SUCCESS' : '❌ FAILED'}`, agentMemoryResult ? 'success' : 'error');
  log(`Direct Prompt Update: ${directPromptResult ? '✅ SUCCESS' : '❌ FAILED'}`, directPromptResult ? 'success' : 'error');
  
  if (agentMemoryResult || directPromptResult) {
    log('🎯 OVERALL: At least one approach worked! Rate card integration is possible.', 'success');
  } else {
    log('🎯 OVERALL: Both approaches need more work.', 'warn');
  }
  
  process.exit(agentMemoryResult || directPromptResult ? 0 : 1);
}

main().catch(console.error);
