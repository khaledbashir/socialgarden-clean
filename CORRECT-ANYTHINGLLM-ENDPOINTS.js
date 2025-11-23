#!/usr/bin/env node

/**
 * CORRECT AnythingLLM ENDPOINTS REFERENCE
 * 
 * Use these EXACT methods from AnythingLLMService:
 * 
 * ✅ CORRECT:
 * - anythingLLM.createOrGetClientWorkspace(clientName)
 * - anythingLLM.setWorkspacePrompt(workspaceSlug, clientName, isSOWWorkspace)
 * - anythingLLM.embedRateCardDocument(workspaceSlug)
 * - anythingLLM.setWorkspaceLLMProvider(workspaceSlug, provider, model)
 * - anythingLLM.createThread(workspaceSlug, threadName)
 * - anythingLLM.streamChatWithThread(workspaceSlug, threadSlug, message, onChunk)
 * - anythingLLM.deleteWorkspace(workspaceSlug)
 * - anythingLLM.updateWorkspace(workspaceSlug, newName)
 * 
 * ❌ INCORRECT/NON-EXISTENT:
 * - service.createWorkspace(name) → Use getMasterSOWWorkspace() instead
 * - service.updateWorkspace(slug, {systemPrompt: ...}) → Use setWorkspacePrompt() instead
 * - service.embedText(slug, content, name) → Use embedRateCardDocument() instead
 * - service.chat(slug, message) → Use streamChatWithThread() instead
 * 
 * PROPER WORKFLOW:
 * 1. workspace = await anythingLLM.getMasterSOWWorkspace("Client Name")
 * 2. await anythingLLM.setWorkspacePrompt(workspace.slug, "Client Name", true)
 * 3. await anythingLLM.embedRateCardDocument(workspace.slug)
 * 4. await anythingLLM.setWorkspaceLLMProvider(workspace.slug, "openrouter", "minimax/minimax-m2:free")
 * 5. thread = await anythingLLM.createThread(workspace.slug)
 * 6. await anythingLLM.streamChatWithThread(workspace.slug, thread.slug, "prompt", (chunk) => { ... })
 * 
 * FULL EXAMPLE:
 */

import { AnythingLLMService } from './frontend/lib/anythingllm.js';

const anythingLLM = new AnythingLLMService();

async function example() {
  try {
    // 1. Create workspace
    const workspace = await anythingLLM.getMasterSOWWorkspace("Example Client");
    console.log(`✅ Workspace: ${workspace.slug}`);

    // 2. Set prompt
    await anythingLLM.setWorkspacePrompt(workspace.slug, "Example Client", true);
    console.log(`✅ Prompt set`);

    // 3. Embed rate card (91 roles)
    await anythingLLM.embedRateCardDocument(workspace.slug);
    console.log(`✅ Rate card embedded`);

    // 4. Configure LLM provider
    await anythingLLM.setWorkspaceLLMProvider(
      workspace.slug,
      "openrouter",
      "minimax/minimax-m2:free"
    );
    console.log(`✅ LLM provider configured`);

    // 5. Create thread
    const thread = await anythingLLM.createThread(workspace.slug);
    console.log(`✅ Thread: ${thread.slug}`);

    // 6. Stream chat
    let response = '';
    console.log(`📡 Streaming...`);
    
    await anythingLLM.streamChatWithThread(
      workspace.slug,
      thread.slug,
      "Your prompt here",
      (chunk) => {
        try {
          const jsonStr = chunk.replace(/^data:\s*/, '');
          const data = JSON.parse(jsonStr);
          if (data.textResponse) {
            response += data.textResponse;
            process.stdout.write('.');
          }
        } catch (e) {
          // Silent
        }
      }
    );

    console.log(`\n✅ Response: ${response.length} chars`);

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
}

// Uncomment to run:
// example();

console.log('\n✅ CORRECT ENDPOINTS REFERENCE CREATED');
console.log('\nSee example() function above for proper usage.\n');
