#!/usr/bin/env node

/**
 * AnythingLLM Complete Workflow Test Script
 * 
 * Tests the correct AnythingLLM endpoints with the proper method names
 * 1. Creating a workspace
 * 2. Setting The Architect prompt
 * 3. Embedding the rate card
 * 4. Creating a thread
 * 5. Streaming chat to generate SOW
 * 6. Validating Sam's requirements
 * 
 * Usage: cd frontend && pnpm tsx ../test-anythingllm-fixed.js
 */

import { AnythingLLMService } from './frontend/lib/anythingllm.js';

const anythingLLM = new AnythingLLMService();
const TEST_BRIEF = "Please create me a scope of work for a client to support them with a nurture program build - 5 emails and 2 landing pages for HubSpot. At approximately $25,000 cost";

function log(message, type = 'info') {
  const emoji = { info: '📋', success: '✅', error: '❌', test: '🧪', step: '▶️' };
  console.log(`${emoji[type] || '➡️'} ${message}`);
}

async function withTimeout(promise, timeoutMs, stepName) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`⏱️ TIMEOUT after ${timeoutMs}ms on: ${stepName}`));
    }, timeoutMs);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║      AnythingLLM COMPLETE WORKFLOW TEST - CORRECT ENDPOINTS     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  let workspace = null;
  let thread = null;
  let fullResponse = '';
  let chunkCount = 0;

  try {
    // --- STEP 1: CREATE WORKSPACE ---
    console.log('▶️ STEP 1: Create Workspace');
    const workspaceName = `Test-Nurture-${Date.now()}`;
    log(`Creating workspace: "${workspaceName}"...`, 'step');
    
    workspace = await withTimeout(
      anythingLLM.createOrGetClientWorkspace(workspaceName),
      20000,
      'Create Workspace'
    );
    
    if (!workspace || !workspace.slug) {
      throw new Error('Workspace creation failed');
    }
    
    log(`✅ Workspace: ${workspace.slug}`, 'success');
    
    // --- STEP 2: SET ARCHITECT PROMPT ---
    console.log('\n▶️ STEP 2: Set The Architect Prompt');
    log('Setting system prompt...', 'step');
    
    const promptSet = await withTimeout(
      anythingLLM.setWorkspacePrompt(workspace.slug, workspaceName, true),
      10000,
      'Set Prompt'
    );
    
    if (!promptSet) {
      log('⚠️ Prompt setting may have failed', 'error');
    } else {
      log('✅ Architect prompt set', 'success');
    }
    
    // --- STEP 3: EMBED RATE CARD ---
    console.log('\n▶️ STEP 3: Embed Rate Card (91 roles)');
    log('Embedding rate card document...', 'step');
    
    const rateCardEmbedded = await withTimeout(
      anythingLLM.embedRateCardDocument(workspace.slug),
      30000,
      'Embed Rate Card'
    );
    
    if (!rateCardEmbedded) {
      log('⚠️ Rate card embedding may have failed', 'error');
    } else {
      log('✅ Rate card embedded (91 roles)', 'success');
    }
    
    // --- STEP 4: CREATE THREAD ---
    console.log('\n▶️ STEP 4: Create Chat Thread');
    log('Creating thread...', 'step');
    
    thread = await withTimeout(
      anythingLLM.createThread(workspace.slug),
      10000,
      'Create Thread'
    );
    
    if (!thread || !thread.slug) {
      throw new Error('Thread creation failed');
    }
    
    log(`✅ Thread: ${thread.slug}`, 'success');
    
    // --- STEP 5: STREAM CHAT TO GENERATE SOW ---
    console.log('\n▶️ STEP 5: Stream Chat to Generate SOW');
    log(`Brief: "${TEST_BRIEF}"`, 'info');
    log('Streaming response...', 'step');
    
    const startTime = Date.now();
    console.log('📡 Streaming: ', { stream: true });
    
    await withTimeout(
      new Promise((resolve, reject) => {
        anythingLLM.streamChatWithThread(
          workspace.slug,
          thread.slug,
          TEST_BRIEF,
          (chunk) => {
            try {
              chunkCount++;
              
              // Log first chunk raw format
              if (chunkCount === 1) {
                console.log(`\n  [First chunk format]: ${chunk.substring(0, 100)}`);
              }
              
              // Try parsing as JSON
              const jsonStr = chunk.replace(/^data:\s*/, '');
              const data = JSON.parse(jsonStr);
              
              if (data.textResponse) {
                fullResponse += data.textResponse;
                if (chunkCount % 50 === 0) {
                  process.stdout.write('.');
                }
              }
            } catch (e) {
              // Silent parse error
            }
          }
        ).then(resolve).catch(reject);
      }),
      180000,
      'Stream Chat'
    );
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(''); // New line
    
    log(`✅ SOW Generated: ${fullResponse.length} chars in ${duration}s (${chunkCount} chunks)`, 'success');
    
    // --- STEP 6: VALIDATE SAM'S REQUIREMENTS ---
    console.log('\n▶️ STEP 6: Validate Sam\'s Requirements');
    
    const requirements = {
      hasGSTSuffix: /\+\s*GST/i.test(fullResponse),
      hasJSONTable: /```json|suggestedRoles/i.test(fullResponse),
      hasClosingPhrase: /This concludes the Scope of Work/i.test(fullResponse),
      hasPlusBullets: /\n\s*\+\s+/m.test(fullResponse),
      hasRoundNumbers: /\$\d+(0|5)k|\b(200|250|300|350|400)\s*hours?\b/i.test(fullResponse),
      hasAccountMgmt: /Account Management|Account Manager/i.test(fullResponse),
      hasGranularRoles: /Producer|Specialist|Senior|Junior|Head of/i.test(fullResponse),
    };
    
    const score = Object.values(requirements).filter(Boolean).length;
    const maxScore = Object.keys(requirements).length;
    
    console.log('\nRequirements Check:');
    Object.entries(requirements).forEach(([key, value]) => {
      const icon = value ? '✅' : '❌';
      const reqName = key
        .replace('has', '')
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase();
      console.log(`  ${icon} ${reqName}`);
    });
    
    console.log(`\n📊 Score: ${score}/${maxScore} requirements met`);
    
    // --- DISPLAY SAMPLE OUTPUT ---
    console.log('\n▶️ STEP 7: Sample Output (first 800 chars)');
    console.log('─'.repeat(80));
    console.log(fullResponse.substring(0, 800));
    console.log('─'.repeat(80));
    
    // --- SUMMARY ---
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    if (score === maxScore) {
      console.log('║ ✅ ALL TESTS PASSED - PRODUCTION READY                          ║');
    } else if (score >= 5) {
      console.log('║ ⚠️ PARTIAL SUCCESS - ' + score + '/' + maxScore + ' requirements met                        ║');
    } else {
      console.log('║ ❌ TEST FAILED - Not enough requirements met                  ║');
    }
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

  } catch (err) {
    log(`❌ Fatal Error: ${err.message}`, 'error');
    console.error(err);
    process.exit(1);
  }
}

main();
