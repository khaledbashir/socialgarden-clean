#!/usr/bin/env node
import { AnythingLLMService } from './frontend/lib/anythingllm.ts';

const service = new AnythingLLMService();

async function testChat() {
  console.log('1. Creating workspace...');
  const workspace = await service.createOrGetClientWorkspace(`ChatTest-${Date.now()}`);
  console.log('✅ Workspace:', workspace.slug);
  
  console.log('\n2. Configuring Groq provider...');
  await service.setWorkspaceLLMProvider(workspace.slug, 'groq', 'openai/gpt-oss-120b');
  console.log('✅ Provider set');
  
  console.log('\n3. Creating thread...');
  const thread = await service.createThread(workspace.slug);
  console.log('✅ Thread:', thread.slug);
  
  console.log('\n4. Sending simple chat message...');
  let response = '';
  let chunks = 0;
  const timeout = setTimeout(() => {
    console.log(`\n⏱️  TIMEOUT after 30s - received ${chunks} chunks, ${response.length} chars`);
    console.log('First 500 chars:', response.substring(0, 500));
    process.exit(1);
  }, 30000);
  
  try {
    await service.streamChatWithThread(
      workspace.slug,
      thread.slug,
      "Say hello in exactly 10 words.",
      (chunk) => {
        chunks++;
        response += chunk;
        if (chunks === 1) console.log('✨ First chunk received!');
        if (chunks % 10 === 0) console.log(`   Received ${chunks} chunks...`);
      }
    );
    
    clearTimeout(timeout);
    console.log(`\n✅ Chat completed!`);
    console.log(`Chunks: ${chunks}, Length: ${response.length}`);
    console.log(`Response: ${response}`);
  } catch (err) {
    clearTimeout(timeout);
    console.error('❌ Error:', err);
  }
  
  console.log('\n5. Cleaning up...');
  await service.deleteWorkspace(workspace.slug);
  console.log('✅ Done!');
}

testChat().catch(console.error);
