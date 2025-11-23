#!/usr/bin/env node

// Test AnyTHINGLLM Agent Memory Approach for Rate Card Embedding
// Alternative to upload-then-embed: use conversational interface to save to long term memory

// Import our AnythingLLM service
const { anythingLLM } = await import('./frontend/lib/anythingllm.js');

const ANYTHINGLLM_BASE_URL = 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function testAgentMemoryApproach() {
  log('Testing Agent Memory Approach for Rate Card Embedding', 'info');
  
  try {
    // Step 1: Get or create workspace
    const workspaceSlug = 'test-agent-memory';
    log(`📋 Step 1: Setting up workspace: ${workspaceSlug}`, 'info');
    
    // Create workspace if needed
    let workspace;
    try {
      workspace = await anythingLLM.createOrGetClientWorkspace('Test Agent Memory');
      log(`✅ Workspace ready: ${workspace.slug}`, 'success');
    } catch (error) {
      log(`Using existing workspace: ${error.message}`, 'info');
    }
    
    // Step 2: Create a thread for the conversation
    log('📋 Step 2: Creating thread for agent conversation...', 'info');
    
    const thread = await anythingLLM.createThread(workspaceSlug, 'Rate Card Memory Test');
    if (!thread) {
      throw new Error('Failed to create thread');
    }
    
    log(`✅ Thread created: ${thread.slug}`, 'success');
    
    // Step 3: Prepare rate card content for agent memory
    log('📋 Step 3: Preparing rate card content for agent...', 'info');
    
    const rateCardContent = `# Social Garden - Official Rate Card (AUD/hour)

This document contains the complete rate card for Social Garden services.

## Core Team Roles
| Role | Rate (AUD/hr) |
|---|---:|
| Creative Director | 165.00 |
| Head Of Digital | 160.00 |
| Head Of Social | 155.00 |
| Account Director | 150.00 |
| Account Manager | 135.00 |
| Senior Designer | 130.00 |
| Designer | 115.00 |
| Project Coordinator | 125.00 |
| Frontend Developer | 140.00 |
| Backend Developer | 145.00 |
| Full Stack Developer | 155.00 |
| Digital Marketing Specialist | 125.00 |
| Content Manager | 115.00 |
| Social Media Manager | 110.00 |
| Video Producer | 130.00 |
| Copywriter | 120.00 |
| SEO Specialist | 135.00 |
| PPC Specialist | 135.00 |

## Notes
- All rates are exclusive of GST
- These rates are effective as of October 2025
- Rates may vary based on project complexity and client requirements`;

    // Step 4: Try to save to agent memory using chat message
    log('📋 Step 4: Attempting to save rate card to agent long-term memory...', 'info');
    
    // First, try a direct approach: send the rate card content as a message
    const saveMemoryMessage = `@agent Please save this rate card information to your long-term memory for future reference:

${rateCardContent}

This is Social Garden's official rate card in AUD per hour. Please acknowledge that you've stored this information for future pricing and SOW generation tasks.`;
    
    log(`📤 Sending memory storage message...`, 'info');
    
    const memoryResponse = await anythingLLM.chatWithThread(
      workspaceSlug,
      thread.slug,
      saveMemoryMessage,
      'query' // Use query mode for direct information storage
    );
    
    if (!memoryResponse) {
      throw new Error('Failed to send memory storage message');
    }
    
    log(`📨 Memory storage response received`, 'success');
    log(`Response: ${JSON.stringify(memoryResponse, null, 2)}`, 'info');
    
    // Step 5: Verify by asking about the rate card
    log('📋 Step 5: Testing if rate card is accessible in agent memory...', 'info');
    
    const verificationMessage = `What is the hourly rate for a Senior Designer according to the rate card you just stored?`;
    
    const verificationResponse = await anythingLLM.chatWithThread(
      workspaceSlug,
      thread.slug,
      verificationMessage,
      'chat' // Use chat mode for queries
    );
    
    if (!verificationResponse) {
      throw new Error('Failed to get verification response');
    }
    
    log(`📨 Verification response:`, 'info');
    log(`Response: ${JSON.stringify(verificationResponse, null, 2)}`, 'info');
    
    // Step 6: Test pricing query
    log('📋 Step 6: Testing complex pricing query...', 'info');
    
    const pricingQuery = `If I need 10 hours of Creative Director work and 20 hours of Social Media Manager work, what would be the total cost?`;
    
    const pricingResponse = await anythingLLM.chatWithThread(
      workspaceSlug,
      thread.slug,
      pricingQuery,
      'chat'
    );
    
    log(`📨 Pricing query response:`, 'info');
    log(`Response: ${JSON.stringify(pricingResponse, null, 2)}`, 'info');
    
    // Final result
    log('🎯 AGENT MEMORY APPROACH RESULT:', 'success');
    
    if (pricingResponse && pricingResponse.textResponse) {
      const responseText = pricingResponse.textResponse.toLowerCase();
      if (responseText.includes('165') && responseText.includes('110')) {
        log('✅ SUCCESS: Agent memory approach worked! Rate card information is accessible.', 'success');
        return true;
      } else {
        log('⚠️ PARTIAL: Agent responded but may not have accessed rate card data properly', 'warn');
        return false;
      }
    } else {
      log('❌ FAILED: Agent memory approach did not work as expected', 'error');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error testing agent memory approach: ${error.message}`, 'error');
    console.error(error);
    return false;
  }
}

// Alternative approach: Try using a thread message to save workspace data directly
async function testDirectWorkspaceUpdate() {
  log('🧪 Testing alternative: Direct workspace prompt update with rate card', 'info');
  
  try {
    const workspaceSlug = 'test-direct-update';
    
    // Get the current workspace prompt and enhance it with rate card info
    const currentPrompt = `You are an AI assistant with access to Social Garden's rate card information.

# Social Garden Rate Card (AUD/hour)
- Creative Director: $165/hr
- Senior Designer: $130/hr  
- Social Media Manager: $110/hr
- Account Manager: $135/hr

Use these rates for all pricing calculations.`;

    // Try to update the workspace with this enhanced prompt
    const updateResponse = await fetch(
      `${ANYTHINGLLM_BASE_URL}/api/v1/workspace/${workspaceSlug}/update`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openAiPrompt: currentPrompt,
          openAiTemp: 0.7,
          openAiHistory: 25,
        }),
      }
    );

    if (updateResponse.ok) {
      log('✅ Successfully updated workspace prompt with rate card', 'success');
      return true;
    } else {
      log(`⚠️ Failed to update workspace prompt: ${updateResponse.status}`, 'warn');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error in direct workspace update: ${error.message}`, 'error');
    return false;
  }
}

// Main execution
async function main() {
  log('🚀 Starting AnyTHINGLLM Agent Memory Tests', 'info');
  
  const agentMemoryResult = await testAgentMemoryApproach();
  const directUpdateResult = await testDirectWorkspaceUpdate();
  
  log('📊 FINAL RESULTS:', 'info');
  log(`Agent Memory Approach: ${agentMemoryResult ? 'SUCCESS' : 'FAILED'}`, agentMemoryResult ? 'success' : 'error');
  log(`Direct Workspace Update: ${directUpdateResult ? 'SUCCESS' : 'FAILED'}`, directUpdateResult ? 'success' : 'error');
  
  if (agentMemoryResult || directUpdateResult) {
    log('🎯 OVERALL: At least one approach worked!', 'success');
  } else {
    log('🎯 OVERALL: Both approaches need refinement', 'warn');
  }
  
  process.exit(agentMemoryResult || directUpdateResult ? 0 : 1);
}

main().catch(console.error);
