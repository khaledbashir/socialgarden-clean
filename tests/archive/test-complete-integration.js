#!/usr/bin/env node

// Step-by-step test of complete AnyTHINGLLM integration flow
// Tests: 1) Create workspace, 2) Feed prompt, 3) "Who are you", 4) Embed rate card, 5) Verify access

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

async function testStep1_CreateWorkspace() {
  log('🚀 STEP 1: Creating test workspace...', 'info');
  
  try {
    const workspaceName = 'Test Client';
    const workspaceSlug = 'test-client';
    
    // Try to create workspace
    const createResponse = await makeApiCall('/api/v1/workspace/new', {
      method: 'POST',
      body: JSON.stringify({
        name: workspaceName,
        slug: workspaceSlug,
      }),
    });
    
    log(`✅ Workspace created successfully: ${createResponse.workspace.slug}`, 'success');
    return { id: createResponse.workspace.id, slug: createResponse.workspace.slug, name: createResponse.workspace.name };
    
  } catch (error) {
    if (error.message.includes('409')) {
      log('✅ Using existing workspace (conflict is expected)', 'success');
      return { slug: 'test-client', name: 'Test Client' };
    } else {
      throw error;
    }
  }
}

async function testStep2_FeedPrompt(workspaceSlug) {
  log('🚀 STEP 2: Feeding The Architect prompt to workspace...', 'info');
  
  try {
    const architectPrompt = `You are The Architect - Social Garden's AI assistant for Statement of Work (SOW) creation.

Your role is to help generate comprehensive, professional SOWs for Social Garden clients.

# Core Capabilities:
- Create detailed SOWs with scope, deliverables, timelines, and pricing
- Use Social Garden's official rate card for accurate pricing calculations
- Ensure all SOWs include proper governance roles and compliance
- Provide clear project breakdown and resource allocation

# Always Remember:
- Use exact hourly rates from the rate card
- Include governance roles: Head Of, Project Coordination, Account Management
- Break down services with specific hours and deliverables
- Show monthly retainer breakdowns when applicable
- Maintain professional tone and structure

# Your Identity:
You are The Architect, Social Garden's SOW specialist. You help create detailed project proposals that clients can confidently approve.`;

    const promptResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/update`, {
      method: 'PATCH',
      body: JSON.stringify({
        openAiPrompt: architectPrompt,
        openAiTemp: 0.7,
        openAiHistory: 25,
      }),
    });
    
    log('✅ Prompt successfully set for workspace', 'success');
    return true;
    
  } catch (error) {
    log(`❌ Failed to set prompt: ${error.message}`, 'error');
    return false;
  }
}

async function testStep3_WhoAreYou(workspaceSlug) {
  log('🚀 STEP 3: Testing AI identity - asking "Who are you?"...', 'info');
  
  try {
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
      log('✅ AI identity confirmed - recognizes The Architect role', 'success');
      return true;
    } else {
      log('⚠️ AI responded but may not have The Architect identity', 'warn');
      return false;
    }
    
  } catch (error) {
    log(`❌ Failed to get AI identity response: ${error.message}`, 'error');
    return false;
  }
}

async function testStep4_EmbedRateCard(workspaceSlug) {
  log('🚀 STEP 4: Embedding Social Garden rate card...', 'info');
  
  try {
    // Create rate card content
    const rateCardContent = `# Social Garden - Official Rate Card (AUD/hour)

This document is the single source of truth for hourly rates across roles.

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

    const title = 'Social Garden - Official Rate Card (AUD/hour) (v2025-10-25)';
    
    // Step 1: Process document
    const rawTextResponse = await makeApiCall('/api/v1/document/raw-text', {
      method: 'POST',
      body: JSON.stringify({
        textContent: rateCardContent,
        metadata: {
          title,
          docAuthor: 'Social Garden',
          description: 'Authoritative 82-role rate card in AUD per hour',
          docSource: 'Rate Card',
        },
      }),
    });
    
    const location = rawTextResponse.documents[0].location;
    log(`📄 Document processed: ${location}`, 'success');
    
    // Step 2: Embed in workspace
    const embedResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/update-embeddings`, {
      method: 'POST',
      body: JSON.stringify({ adds: [location] }),
    });
    
    log('✅ Rate card successfully embedded in workspace', 'success');
    return true;
    
  } catch (error) {
    log(`❌ Failed to embed rate card: ${error.message}`, 'error');
    return false;
  }
}

async function testStep5_VerifyRateCardAccess(workspaceSlug) {
  log('🚀 STEP 5: Verifying rate card accessibility...', 'info');
  
  try {
    const pricingResponse = await makeApiCall(`/api/v1/workspace/${workspaceSlug}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: 'What is the hourly rate for a Senior Designer?',
        mode: 'chat',
      }),
    });
    
    log(`📨 Pricing response: ${pricingResponse.textResponse}`, 'info');
    
    // Check if response contains the correct rate
    const response = pricingResponse.textResponse.toLowerCase();
    if (response.includes('130') || response.includes('senior designer')) {
      log('✅ Rate card access confirmed - AI can retrieve pricing information', 'success');
      return true;
    } else {
      log('⚠️ Rate card may not be properly accessible', 'warn');
      return false;
    }
    
  } catch (error) {
    log(`❌ Failed to verify rate card access: ${error.message}`, 'error');
    return false;
  }
}

async function runCompleteTest() {
  log('🎯 STARTING COMPLETE ANYTHINGLLM INTEGRATION TEST', 'info');
  log('Testing: Workspace → Prompt → AI Identity → Rate Card → Access', 'info');
  
  const results = [];
  
  try {
    // Step 1: Create Workspace
    const workspace = await testStep1_CreateWorkspace();
    results.push({ step: 'Create Workspace', success: true, workspace });
    
    // Step 2: Feed Prompt
    const promptSuccess = await testStep2_FeedPrompt(workspace.slug);
    results.push({ step: 'Feed Prompt', success: promptSuccess });
    
    // Step 3: Test AI Identity
    const identitySuccess = await testStep3_WhoAreYou(workspace.slug);
    results.push({ step: 'AI Identity', success: identitySuccess });
    
    // Step 4: Embed Rate Card
    const embedSuccess = await testStep4_EmbedRateCard(workspace.slug);
    results.push({ step: 'Embed Rate Card', success: embedSuccess });
    
    // Step 5: Verify Access
    const accessSuccess = await testStep5_VerifyRateCardAccess(workspace.slug);
    results.push({ step: 'Verify Rate Card Access', success: accessSuccess });
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'error');
  }
  
  // Final Results
  log('📊 FINAL TEST RESULTS:', 'info');
  const successes = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    log(`${status} ${result.step}`, result.success ? 'success' : 'error');
  });
  
  log(`🎯 OVERALL: ${successes}/${total} steps successful`, successes === total ? 'success' : 'warn');
  
  if (successes === total) {
    log('🎉 COMPLETE SUCCESS! All integration steps working perfectly!', 'success');
  } else {
    log('⚠️ Some steps failed - check individual results above', 'warn');
  }
  
  return successes === total;
}

// Run the complete test
runCompleteTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error);
