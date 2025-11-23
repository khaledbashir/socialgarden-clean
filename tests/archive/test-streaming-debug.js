#!/usr/bin/env node

import { AnythingLLMService } from './frontend/lib/anythingllm.js';

const anythingLLM = new AnythingLLMService();

async function main() {
  console.log('🔍 DEBUG: Testing MiniMax M2 streaming...\n');
  
  try {
    // Create workspace
    const workspace = await anythingLLM.createOrGetClientWorkspace(`test-debug-${Date.now()}`);
    console.log(`✅ Workspace: ${workspace.slug}`);
    
    // Configure LLM
    await anythingLLM.setWorkspaceLLMProvider(workspace.slug, 'openrouter', 'minimax/minimax-m2:free');
    console.log(`✅ LLM configured`);
    
    // Create thread
    const thread = await anythingLLM.createThread(workspace.slug);
    console.log(`✅ Thread: ${thread.slug}\n`);
    
    // Stream chat
    console.log(`📡 Streaming response (first 5 chunks detailed):\n`);
    let chunkCount = 0;
    let fullResponse = '';
    
    await new Promise((resolve) => {
      anythingLLM.streamChatWithThread(
        workspace.slug,
        thread.slug,
        'Generate a simple SOW for HubSpot implementation at $25,000',
        (chunk) => {
          chunkCount++;
          if (chunkCount <= 5) {
            console.log(`Chunk ${chunkCount}:`);
            console.log(`  Raw: ${chunk}`);
            console.log(`  Length: ${chunk.length} chars\n`);
          } else if (chunkCount % 20 === 0) {
            process.stdout.write('.');
          }
          
          try {
            const jsonStr = chunk.replace(/^data:\s*/, '');
            const data = JSON.parse(jsonStr);
            if (data.textResponse) {
              fullResponse += data.textResponse;
            }
          } catch (e) {
            // Silent
          }
        }
      ).then(() => {
        resolve();
      });
    });
    
    console.log(`\n\n✅ Total chunks: ${chunkCount}`);
    console.log(`✅ Response length: ${fullResponse.length} chars`);
    console.log(`\nFirst 500 chars:\n${fullResponse.substring(0, 500)}`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
