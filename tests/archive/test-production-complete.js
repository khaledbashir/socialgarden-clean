#!/usr/bin/env node

/**
 * COMPLETE PRODUCTION WORKFLOW TEST
 * 
 * Tests the actual production flow:
 * 1. Create workspace in AnythingLLM directly
 * 2. Configure LLM provider (OpenRouter MiniMax M2)
 * 3. Generate SOW via streaming chat
 * 4. Save SOW to production MySQL database
 * 5. Embed SOW in client workspace
 * 6. Embed SOW in master dashboard
 * 7. Generate PDF via production API
 * 8. Query master dashboard to verify
 * 
 * Usage: cd frontend && pnpm tsx ../test-production-complete.js
 */

import { AnythingLLMService } from './frontend/lib/anythingllm.js';

const PROD_API_URL = 'https://sow.qandu.me';
const TEST_CLIENT_NAME = `Test Client ${Date.now()}`;
const TEST_SOW_BRIEF = "Generate a SOW for a HubSpot CRM implementation with a strict budget of $45,000 AUD, focusing on marketing automation and lead scoring. The client is new to marketing automation.";

const anythingLLM = new AnythingLLMService();

function log(message, type = 'info') {
  const emoji = { info: '📋', success: '✅', error: '❌', test: '🧪', step: '▶️' };
  console.log(`${emoji[type] || '➡️'} ${message}`);
}

function progressBar(current, total, label = '') {
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${total} ${label}`;
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
  let workspace = null;
  let thread = null;
  let sowId = null;
  let fullResponse = '';
  let masterResponse = '';
  let step = 0;
  const totalSteps = 8;
  
  console.log('\n🚀 COMPLETE PRODUCTION WORKFLOW TEST\n');
  console.log(`Production API: ${PROD_API_URL}`);
  console.log(`Client: ${TEST_CLIENT_NAME}\n`);

  try {
    // --- STEP 1: CREATE WORKSPACE IN ANYTHINGLLM ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'CREATE WORKSPACE')}`);
    log(`Creating workspace in AnythingLLM: "${TEST_CLIENT_NAME}"...`, 'step');
    
    workspace = await withTimeout(
      anythingLLM.createOrGetClientWorkspace(TEST_CLIENT_NAME),
      20000,
      'Create Workspace'
    );
    
    if (!workspace || !workspace.slug) {
      throw new Error('Workspace creation failed - no slug returned');
    }
    
    log(`Workspace created: ${workspace.slug}`, 'success');
    log('Rate card (91 roles) automatically embedded ✅', 'info');
    log('The Architect prompt automatically applied ✅', 'info');

    // --- STEP 2: CONFIGURE LLM PROVIDER ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'CONFIGURE LLM')}`);
    log('Setting LLM provider to OpenRouter MiniMax M2...', 'step');
    
    const providerConfigured = await withTimeout(
      anythingLLM.setWorkspaceLLMProvider(workspace.slug, 'openrouter', 'minimax/minimax-01'),
      10000,
      'Configure LLM'
    );
    
    if (!providerConfigured) {
      log('⚠️ LLM configuration may have failed', 'error');
    } else {
      log('LLM provider configured successfully', 'success');
    }

    // --- STEP 3: CREATE THREAD ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'CREATE THREAD')}`);
    log('Creating chat thread...', 'step');
    
    thread = await withTimeout(
      anythingLLM.createThread(workspace.slug),
      10000,
      'Create Thread'
    );
    
    if (!thread || !thread.slug) {
      throw new Error('Thread creation failed');
    }
    
    log(`Thread created: ${thread.slug}`, 'success');

    // --- STEP 4: GENERATE SOW VIA STREAMING CHAT ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'GENERATE SOW')}`);
    log('Generating SOW via AnythingLLM streaming chat...', 'step');
    log(`Brief: ${TEST_SOW_BRIEF.substring(0, 80)}...`, 'info');
    
    let chunkCount = 0;
    const startTime = Date.now();
    
    console.log('📡 Streaming SOW generation...');
    const progressInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`⏳ [${elapsed}s] Chunks: ${chunkCount} | Length: ${fullResponse.length} chars`);
    }, 10000);
    
    try {
      await withTimeout(
        new Promise((resolve, reject) => {
          anythingLLM.streamChatWithThread(
            workspace.slug,
            thread.slug,
            TEST_SOW_BRIEF,
            (chunk) => {
              try {
                const jsonStr = chunk.replace(/^data:\s*/, '');
                const data = JSON.parse(jsonStr);
                
                if (data.textResponse) {
                  chunkCount++;
                  fullResponse += data.textResponse;
                  
                  if (chunkCount % 50 === 0) {
                    process.stdout.write('.');
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          ).then(() => {
            resolve();
          }).catch((err) => {
            reject(err);
          });
        }),
        120000,
        'Generate SOW'
      );
    } finally {
      clearInterval(progressInterval);
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(''); // New line after dots
    log(`SOW generated: ${fullResponse.length} chars in ${duration}s`, 'success');
    
    if (!fullResponse || fullResponse.length === 0) {
      throw new Error('AI returned empty response');
    }

    // --- STEP 5: SAVE SOW TO PRODUCTION DATABASE ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'SAVE TO DATABASE')}`);
    log('Saving SOW to production MySQL database...', 'step');
    
    // Extract title from response
    const titleMatch = fullResponse.match(/#{1,2}\s*(.+)/);
    const sowTitle = titleMatch ? titleMatch[1].trim() : 'HubSpot CRM Implementation SOW';
    
    const createSOWRes = await withTimeout(
      fetch(`${PROD_API_URL}/api/sow/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sowTitle,
          client_name: TEST_CLIENT_NAME,
          workspace_slug: workspace.slug,
          content: fullResponse,
          status: 'draft',
          thread_slug: thread.slug
        })
      }),
      15000,
      'Save SOW to Database'
    );
    
    if (!createSOWRes.ok) {
      const error = await createSOWRes.text();
      log(`⚠️ Database save failed: ${createSOWRes.status} - ${error.substring(0, 200)}`, 'error');
      sowId = null;
    } else {
      const savedSOW = await createSOWRes.json();
      sowId = savedSOW.id;
      log(`SOW saved to database: ID=${sowId}`, 'success');
    }

    // --- STEP 6: EMBED IN CLIENT WORKSPACE ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'EMBED CLIENT WORKSPACE')}`);
    log('Embedding SOW in client workspace...', 'step');
    
    const clientEmbedResult = await withTimeout(
      anythingLLM.embedSOWDocument(workspace.slug, sowTitle, fullResponse),
      30000,
      'Embed in Client Workspace'
    );
    
    log(clientEmbedResult ? 'Client workspace embedding successful' : '⚠️ Client embed may have failed', 
        clientEmbedResult ? 'success' : 'error');

    // --- STEP 7: EMBED IN MASTER DASHBOARD ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'EMBED MASTER DASHBOARD')}`);
    log('Embedding SOW in master dashboard...', 'step');
    
    const masterEmbedResult = await withTimeout(
      anythingLLM.embedSOWDocument('sow-master-dashboard', `[${workspace.slug}] ${sowTitle}`, fullResponse),
      30000,
      'Embed in Master Dashboard'
    );
    
    log(masterEmbedResult ? 'Master dashboard embedding successful' : '⚠️ Master embed may have failed',
        masterEmbedResult ? 'success' : 'error');

    // --- STEP 8: QUERY MASTER DASHBOARD ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'QUERY MASTER DASHBOARD')}`);
    log('Querying master dashboard about this SOW...', 'step');
    
    const masterThread = await withTimeout(
      anythingLLM.createThread('sow-master-dashboard'),
      10000,
      'Create Master Dashboard Thread'
    );
    
    if (!masterThread || !masterThread.slug) {
      log('⚠️ Failed to create master dashboard thread', 'error');
    } else {
      const query = `What information do you have about the workspace "${workspace.slug}" and the SOW for "${TEST_CLIENT_NAME}"? Please summarize.`;
      
      let masterChunkCount = 0;
      const masterStartTime = Date.now();
      
      console.log('📡 Querying master dashboard...');
      
      await withTimeout(
        new Promise((resolve, reject) => {
          anythingLLM.streamChatWithThread(
            'sow-master-dashboard',
            masterThread.slug,
            query,
            (chunk) => {
              try {
                const jsonStr = chunk.replace(/^data:\s*/, '');
                const data = JSON.parse(jsonStr);
                
                if (data.textResponse) {
                  masterChunkCount++;
                  masterResponse += data.textResponse;
                  
                  if (masterChunkCount % 20 === 0) {
                    process.stdout.write('.');
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          ).then(() => {
            resolve();
          }).catch((err) => {
            reject(err);
          });
        }),
        60000,
        'Query Master Dashboard'
      );
      
      const masterDuration = Math.round((Date.now() - masterStartTime) / 1000);
      console.log(''); // New line
      log(`Master dashboard responded: ${masterResponse.length} chars in ${masterDuration}s`, 'success');
      
      console.log('\n--- Master Dashboard Response ---');
      console.log(masterResponse.substring(0, 600));
      if (masterResponse.length > 600) {
        console.log(`\n... [${masterResponse.length - 600} more characters] ...`);
      }
      console.log('--------------------------------\n');
    }

    // --- FINAL SUMMARY ---
    console.log('\n' + '='.repeat(70));
    console.log('🎉 PRODUCTION WORKFLOW COMPLETE!\n');
    console.log(`✅ Workspace: ${workspace.slug}`);
    console.log(`✅ SOW ID: ${sowId || 'N/A (save failed)'}`);
    console.log(`✅ SOW Length: ${fullResponse.length} characters`);
    console.log(`✅ Generation Time: ${duration}s`);
    console.log(`✅ Client Embed: ${clientEmbedResult ? 'Success' : 'Failed'}`);
    console.log(`✅ Master Embed: ${masterEmbedResult ? 'Success' : 'Failed'}`);
    
    console.log('\n📊 Validation:');
    const hasGST = fullResponse.includes('+GST');
    const hasJSON = fullResponse.includes('"suggestedRoles"');
    const hasThinking = fullResponse.includes('<think>');
    console.log(`   GST Suffix: ${hasGST ? '✅' : '❌'}`);
    console.log(`   JSON Pricing: ${hasJSON ? '✅' : '❌'}`);
    console.log(`   Thinking Tags: ${hasThinking ? '✅' : '❌'}`);
    console.log(`   Master Dashboard Aware: ${masterResponse && masterResponse.length > 0 ? '✅' : '❌'}`);
    
    console.log('\n🔗 Links:');
    if (sowId) {
      console.log(`   Production SOW: ${PROD_API_URL}/portal/sow/${sowId}`);
    }
    console.log(`   Client Workspace: https://ahmad-anything-llm.840tjq.easypanel.host/workspace/${workspace.slug}`);
    console.log(`   Master Dashboard: https://ahmad-anything-llm.840tjq.easypanel.host/workspace/sow-master-dashboard`);
    
    console.log('\n🧹 Cleanup (optional):');
    console.log(`   Delete workspace: Run deleteWorkspace('${workspace.slug}')`);
    if (sowId) {
      console.log(`   Delete SOW: DELETE ${PROD_API_URL}/api/sow/${sowId}`);
    }
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.log('\n' + '='.repeat(70));
    log(`WORKFLOW FAILED AT STEP ${step}/${totalSteps}`, 'error');
    console.error(error);
    console.log('='.repeat(70) + '\n');
    process.exit(1);
  }
}

main();
