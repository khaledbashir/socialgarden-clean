#!/usr/bin/env node

/**
 * PRODUCTION WORKFLOW TEST
 * 
 * Tests the complete user flow through sow.qandu.io:
 * 1. Create workspace via frontend API (auto-creates AnythingLLM workspace)
 * 2. Generate SOW via AnythingLLM chat
 * 3. Save SOW to MySQL database
 * 4. Embed SOW in both client + master dashboard workspaces
 * 5. Generate & download PDF
 * 
 * Usage: pnpm tsx test-production-flow.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sow.qandu.me';
const PDF_SERVICE_URL = process.env.NEXT_PUBLIC_PDF_SERVICE_URL || 'https://sow.qandu.me';

// Test configuration
const TEST_CLIENT_NAME = `Test Client ${Date.now()}`;
const TEST_SOW_BRIEF = "Generate a SOW for a HubSpot CRM implementation with a strict budget of $45,000 AUD, focusing on marketing automation and lead scoring. The client is new to marketing automation.";

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
  let sowId = null;
  let step = 0;
  const totalSteps = 8;
  
  console.log('\n🚀 PRODUCTION WORKFLOW TEST\n');
  console.log(`Frontend: ${BASE_URL}`);
  console.log(`Backend: ${PDF_SERVICE_URL}\n`);

  try {
    // --- STEP 1: CREATE WORKSPACE VIA FRONTEND API ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'CREATE WORKSPACE')}`);
    log(`Creating workspace: "${TEST_CLIENT_NAME}"...`, 'step');
    
    const createWorkspaceRes = await withTimeout(
      fetch(`${BASE_URL}/api/workspace/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: TEST_CLIENT_NAME,
          type: 'sow' // This applies "The Architect" prompt automatically
        })
      }),
      15000,
      'Create Workspace'
    );
    
    if (!createWorkspaceRes.ok) {
      const error = await createWorkspaceRes.text();
      throw new Error(`Workspace creation failed: ${createWorkspaceRes.status} - ${error}`);
    }
    
    workspace = await createWorkspaceRes.json();
    log(`Workspace created: ${workspace.slug}`, 'success');
    log(`AnythingLLM workspace auto-created with Architect prompt + rate card`, 'info');

    // --- STEP 2: CREATE THREAD FOR SOW GENERATION ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'CREATE THREAD')}`);
    log('Creating chat thread...', 'step');
    
    const createThreadRes = await withTimeout(
      fetch(`${BASE_URL}/api/anythingllm/thread/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: workspace.slug
        })
      }),
      10000,
      'Create Thread'
    );
    
    if (!createThreadRes.ok) {
      throw new Error(`Thread creation failed: ${createThreadRes.status}`);
    }
    
    const thread = await createThreadRes.json();
    log(`Thread created: ${thread.slug}`, 'success');

    // --- STEP 3: GENERATE SOW VIA ANYTHINGLLM CHAT ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'GENERATE SOW')}`);
    log('Generating SOW via AnythingLLM (streaming)...', 'step');
    log(`Brief: ${TEST_SOW_BRIEF.substring(0, 80)}...`, 'info');
    
    let fullResponse = '';
    let chunkCount = 0;
    const startTime = Date.now();
    
    const streamRes = await withTimeout(
      fetch(`${BASE_URL}/api/anythingllm/stream-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: workspace.slug, // Workspace slug = model for AnythingLLM
          messages: [{ role: 'user', content: TEST_SOW_BRIEF }],
          threadSlug: thread.slug
        })
      }),
      5000,
      'Start Stream'
    );
    
    if (!streamRes.ok) {
      throw new Error(`Stream failed: ${streamRes.status}`);
    }
    
    // Parse streaming response
    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    console.log('📡 Streaming SOW generation...');
    const progressInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`⏳ [${elapsed}s] Chunks: ${chunkCount} | Length: ${fullResponse.length} chars`);
    }, 5000);
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.textResponse) {
                fullResponse += data.textResponse;
                chunkCount++;
                
                if (chunkCount % 50 === 0) {
                  process.stdout.write('.');
                }
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } finally {
      clearInterval(progressInterval);
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(''); // New line after dots
    log(`SOW generated: ${fullResponse.length} chars in ${duration}s`, 'success');
    
    if (!fullResponse || fullResponse.length === 0) {
      throw new Error('AI returned empty response');
    }

    // --- STEP 4: SAVE SOW TO DATABASE ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'SAVE TO DATABASE')}`);
    log('Saving SOW to MySQL...', 'step');
    
    // Extract title from response (simple heuristic)
    const titleMatch = fullResponse.match(/#{1,2}\s*(.+)/);
    const sowTitle = titleMatch ? titleMatch[1].trim() : 'HubSpot CRM Implementation';
    
    const createSOWRes = await withTimeout(
      fetch(`${BASE_URL}/api/sow/create`, {
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
      10000,
      'Save SOW'
    );
    
    if (!createSOWRes.ok) {
      const error = await createSOWRes.text();
      throw new Error(`SOW save failed: ${createSOWRes.status} - ${error}`);
    }
    
    const savedSOW = await createSOWRes.json();
    sowId = savedSOW.id;
    log(`SOW saved to database: ID=${sowId}`, 'success');

    // --- STEP 5: EMBED SOW IN CLIENT WORKSPACE ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'EMBED IN CLIENT WORKSPACE')}`);
    log('Embedding SOW in client workspace...', 'step');
    
    const embedClientRes = await withTimeout(
      fetch(`${BASE_URL}/api/anythingllm/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: workspace.slug,
          title: sowTitle,
          content: fullResponse
        })
      }),
      30000,
      'Embed in Client Workspace'
    );
    
    if (!embedClientRes.ok) {
      log(`⚠️ Client embed failed: ${embedClientRes.status}`, 'error');
    } else {
      log('Client workspace embedding successful', 'success');
    }

    // --- STEP 6: EMBED SOW IN MASTER DASHBOARD ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'EMBED IN MASTER DASHBOARD')}`);
    log('Embedding SOW in master dashboard...', 'step');
    
    const embedMasterRes = await withTimeout(
      fetch(`${BASE_URL}/api/anythingllm/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceSlug: 'sow-master-dashboard',
          title: `[${workspace.slug}] ${sowTitle}`,
          content: fullResponse
        })
      }),
      30000,
      'Embed in Master Dashboard'
    );
    
    if (!embedMasterRes.ok) {
      log(`⚠️ Master dashboard embed failed: ${embedMasterRes.status}`, 'error');
    } else {
      log('Master dashboard embedding successful', 'success');
    }

    // --- STEP 7: GENERATE PDF ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'GENERATE PDF')}`);
    log('Generating PDF...', 'step');
    
    const pdfRes = await withTimeout(
      fetch(`${BASE_URL}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fullResponse,
          title: sowTitle,
          client: TEST_CLIENT_NAME
        })
      }),
      60000,
      'Generate PDF'
    );
    
    if (!pdfRes.ok) {
      log(`⚠️ PDF generation failed: ${pdfRes.status}`, 'error');
    } else {
      const pdfBlob = await pdfRes.arrayBuffer();
      const fs = await import('fs/promises');
      const pdfPath = `/tmp/sow-test-${Date.now()}.pdf`;
      await fs.writeFile(pdfPath, Buffer.from(pdfBlob));
      log(`PDF generated: ${pdfPath} (${pdfBlob.byteLength} bytes)`, 'success');
    }

    // --- STEP 8: QUERY MASTER DASHBOARD ---
    step++;
    console.log(`\n${progressBar(step, totalSteps, 'QUERY MASTER DASHBOARD')}`);
    log('Querying master dashboard about this workspace and SOW...', 'step');
    
    // Import AnythingLLM service to query the master dashboard
    const { AnythingLLMService } = await import('./frontend/lib/anythingllm.js');
    const anythingLLM = new AnythingLLMService();
    
    // Create thread in master dashboard
    const masterThread = await withTimeout(
      anythingLLM.createThread('sow-master-dashboard'),
      10000,
      'Create Master Dashboard Thread'
    );
    
    if (!masterThread || !masterThread.slug) {
      log('⚠️ Failed to create thread in master dashboard', 'error');
    } else {
      log(`Master dashboard thread created: ${masterThread.slug}`, 'success');
      
      // Ask the master dashboard about this SOW
      const query = `What information do you have about the workspace "${workspace.slug}" and the SOW for "${TEST_CLIENT_NAME}"? Please summarize what was embedded.`;
      
      let masterResponse = '';
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
      console.log(''); // New line after dots
      log(`Master dashboard responded: ${masterResponse.length} chars in ${masterDuration}s`, 'success');
      
      console.log('\n--- Master Dashboard Response ---');
      console.log(masterResponse.substring(0, 500));
      if (masterResponse.length > 500) {
        console.log(`\n... [${masterResponse.length - 500} more characters] ...`);
      }
      console.log('----------------------------\n');
    }

    // --- FINAL SUMMARY ---
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PRODUCTION WORKFLOW COMPLETE!\n');
    console.log(`✅ Workspace: ${workspace.slug}`);
    console.log(`✅ SOW ID: ${sowId}`);
    console.log(`✅ SOW Length: ${fullResponse.length} characters`);
    console.log(`✅ Generation Time: ${duration}s`);
    console.log(`✅ Client Embed: ${embedClientRes.ok ? 'Success' : 'Failed'}`);
    console.log(`✅ Master Embed: ${embedMasterRes.ok ? 'Success' : 'Failed'}`);
    console.log(`✅ PDF: ${pdfRes.ok ? 'Success' : 'Failed'}`);
    console.log(`✅ Master Dashboard Query: ${masterResponse ? 'Success' : 'Skipped'}`);
    
    console.log('\n📊 Validation:');
    const hasGST = fullResponse.includes('+GST');
    const hasJSON = fullResponse.includes('"suggestedRoles"');
    const hasThinking = fullResponse.includes('<think>');
    console.log(`   GST Suffix: ${hasGST ? '✅' : '❌'}`);
    console.log(`   JSON Pricing: ${hasJSON ? '✅' : '❌'}`);
    console.log(`   Thinking Tags: ${hasThinking ? '✅' : '❌'}`);
    console.log(`   Master Dashboard Aware: ${masterResponse && masterResponse.length > 0 ? '✅' : '❌'}`);
    
    console.log('\n🔗 Links:');
    console.log(`   Frontend: ${BASE_URL}/portal/sow/${sowId}`);
    console.log(`   Client Workspace: https://ahmad-anything-llm.840tjq.easypanel.host/workspace/${workspace.slug}`);
    console.log(`   Master Dashboard: https://ahmad-anything-llm.840tjq.easypanel.host/workspace/sow-master-dashboard`);
    
    console.log('\n🧹 Cleanup (optional):');
    console.log(`   Delete workspace: DELETE ${BASE_URL}/api/workspace/${workspace.slug}`);
    console.log(`   Delete SOW: DELETE ${BASE_URL}/api/sow/${sowId}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log(`WORKFLOW FAILED AT STEP ${step}/${totalSteps}`, 'error');
    console.error(error);
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

main();
