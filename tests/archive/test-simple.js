#!/usr/bin/env node
import { AnythingLLMService } from './frontend/lib/anythingllm.ts';

const service = new AnythingLLMService();

async function test() {
  console.log('1. Testing workspace creation...');
  const workspace = await service.createOrGetClientWorkspace(`Test-${Date.now()}`);
  console.log('✅ Workspace:', workspace.slug);
  
  console.log('\n2. Testing LLM provider config...');
  const result = await service.setWorkspaceLLMProvider(workspace.slug, 'groq', 'openai/gpt-oss-120b');
  console.log('✅ Provider configured:', result);
  
  console.log('\n3. Testing thread creation...');
  const thread = await service.createThread(workspace.slug);
  console.log('✅ Thread:', thread.slug);
  
  console.log('\n✅ All basic operations work!');
  
  console.log('\n4. Cleaning up...');
  await service.deleteWorkspace(workspace.slug);
  console.log('✅ Done!');
}

test().catch(console.error);
