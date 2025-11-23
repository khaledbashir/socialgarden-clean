#!/usr/bin/env node

/**
 * AnythingLLM Complete Workflow Test Script (chat via sow.qandu.me proxy)
 * Clean rebuild after file corruption
 */

import { AnythingLLMService } from './frontend/lib/anythingllm.ts';

const SOW_APP_BASE = 'https://sow.qandu.me';
const MODEL_PROVIDER = 'openrouter';
const MODEL_ID = 'minimax/minimax-m2:free';

const TEST_BRIEF = 'Please create me a scope of work for a client to support them with a nurture program build - 5 emails and 2 landing pages for HubSpot. At approximately $25,000 cost';

const service = new AnythingLLMService();

function log(message, type = 'info') {
  const emoji = { info: '📋', success: '✅', error: '❌', step: '▶️' };
  console.log(`${emoji[type] || '➡️'} ${message}`);
}

async function streamViaSOWProxy({ workspaceSlug, threadSlug, message }) {
  const endpoint = `${SOW_APP_BASE}/api/anythingllm/stream-chat`;
  const body = {
    workspace: workspaceSlug,
    threadSlug,
    mode: 'chat',
    messages: [ { role: 'user', content: message } ]
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Proxy stream failed: ${res.status} ${txt.substring(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let chunks = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const jsonStr = line.replace(/^data:\s*/, '');
        const data = JSON.parse(jsonStr);
        if (data.textResponse) {
          chunks++;
          full += data.textResponse;
          if (chunks % 50 === 0) process.stdout.write('.');
        }
      } catch (_) {}
    }
  }

  return { text: full, chunks };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   AnythingLLM WORKFLOW (chat via sow.qandu.me proxy)         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const workspaceName = `Architect SOW Test - ${Date.now()}`;
  log(`Creating/Getting workspace: "${workspaceName}"`, 'step');
  const workspace = await service.createOrGetClientWorkspace(workspaceName);
  if (!workspace?.slug) throw new Error('Workspace creation/get failed');
  log(`Workspace: ${workspace.slug}`, 'success');

  log('Applying The Architect prompt to workspace', 'step');
  await service.setWorkspacePrompt(workspace.slug, workspaceName, true);
  log('Architect prompt applied', 'success');

  log('Embedding 91-role rate card (idempotent)', 'step');
  await service.embedRateCardDocument(workspace.slug);
  log('Rate card embedded', 'success');

  log(`Configuring LLM provider/model: ${MODEL_PROVIDER}/${MODEL_ID}`, 'step');
  await service.setWorkspaceLLMProvider(workspace.slug, MODEL_PROVIDER, MODEL_ID);
  log('LLM configured on workspace', 'success');

  log('Creating chat thread', 'step');
  const thread = await service.createThread(workspace.slug);
  if (!thread?.slug) throw new Error('Thread creation failed');
  log(`Thread: ${thread.slug}`, 'success');

  log('Streaming SOW generation via sow.qandu.me/api/anythingllm/stream-chat ...', 'step');
  const t0 = Date.now();
  const { text, chunks } = await streamViaSOWProxy({
    workspaceSlug: workspace.slug,
    threadSlug: thread.slug,
    message: TEST_BRIEF
  });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('');
  log(`Generated ${text.length} chars in ${secs}s (${chunks} chunks)`, 'success');

  const checks = {
    gst: /\+\s*GST/i.test(text),
    json: /```json|"suggestedRoles"/i.test(text),
    closing: /This concludes the Scope of Work/i.test(text),
    bullets: /\n\s*\+\s+/m.test(text)
  };
  log(`GST: ${checks.gst ? '✅' : '❌'} | JSON: ${checks.json ? '✅' : '❌'} | Closing: ${checks.closing ? '✅' : '❌'} | Bullets: ${checks.bullets ? '✅' : '❌'}`);

  console.log('\n─── Preview (first 600 chars) ───');
  console.log(text.substring(0, 600));
  console.log('────────────────────────────────');

  // Embed the generated SOW in BOTH the client workspace and master dashboard
  const sowTitle = `${workspaceName} — SOW ${new Date().toISOString().slice(0,10)}`;
  log('Embedding SOW in both client and master dashboard workspaces', 'step');
  const embedded = await service.embedSOWInBothWorkspaces(workspace.slug, sowTitle, text);
  if (!embedded) throw new Error('Failed to embed SOW in both workspaces');
  log('SOW embedded in BOTH workspaces ✅', 'success');
}

main().catch(err => {
  log(`Fatal: ${err.message}`, 'error');
  process.exit(1);
});
