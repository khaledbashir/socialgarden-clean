# AnythingLLM Endpoints - CORRECT vs INCORRECT

## ✅ CORRECT METHODS (Use These)

```javascript
// Workspace Management
const workspace = await anythingLLM.getMasterSOWWorkspace(clientName: string)
// Returns: { id: string, slug: string, name: string, ... }

// Prompt & Configuration  
await anythingLLM.setWorkspacePrompt(workspaceSlug: string, clientName?: string, isSOWWorkspace?: boolean)
// Sets "The Architect" system prompt

await anythingLLM.embedRateCardDocument(workspaceSlug: string)
// Embeds the 91-role Social Garden rate card

await anythingLLM.setWorkspaceLLMProvider(workspaceSlug: string, provider: string, model: string)
// Configure LLM: provider="openrouter", model="minimax/minimax-m2:free"

// Thread Management
const thread = await anythingLLM.createThread(workspaceSlug: string, threadName?: string)
// Returns: { slug: string, id: string }

// Chat & Streaming
await anythingLLM.streamChatWithThread(
  workspaceSlug: string, 
  threadSlug: string, 
  message: string,
  onChunk: (chunk: string) => void,
  mode?: 'query' | 'chat'
)
// Streams response in chunks: "data: {...json...}"

// Cleanup
await anythingLLM.deleteWorkspace(workspaceSlug: string)
await anythingLLM.deleteThread(workspaceSlug: string, threadSlug: string)
```

## ❌ INCORRECT METHODS (Don't Use These)

```javascript
// WRONG - doesn't exist
service.createWorkspace(name)
service.updateWorkspace(slug, {systemPrompt: ...})
service.embedText(slug, content, name)
service.chat(slug, message)

// WRONG - wrong method names
anythingLLM.createOrGetClientWorkspace() // ✅ correct
anythingLLM.createWorkspace() // ❌ wrong
anythingLLM.setWorkspaceLLMProvider() // ✅ correct
anythingLLM.configureLLM() // ❌ wrong
anythingLLM.streamChatWithThread() // ✅ correct
anythingLLM.streamChat() // ❌ wrong
```

## Complete Working Workflow Example

```javascript
import { AnythingLLMService } from './lib/anythingllm.js';

const anythingLLM = new AnythingLLMService();

async function fullWorkflow() {
  // 1. Create workspace
  const workspace = await anythingLLM.getMasterSOWWorkspace("My Client");
  
  // 2. Set Architect prompt
  await anythingLLM.setWorkspacePrompt(workspace.slug, "My Client", true);
  
  // 3. Embed 91-role rate card
  await anythingLLM.embedRateCardDocument(workspace.slug);
  
  // 4. Configure LLM provider (MUST DO THIS BEFORE STREAMING)
  await anythingLLM.setWorkspaceLLMProvider(
    workspace.slug,
    "openrouter",
    "minimax/minimax-m2:free"
  );
  
  // 5. Create thread
  const thread = await anythingLLM.createThread(workspace.slug);
  
  // 6. Stream chat response
  let fullResponse = '';
  let chunkCount = 0;
  
  await anythingLLM.streamChatWithThread(
    workspace.slug,
    thread.slug,
    "Your prompt here",
    (chunk) => {
      try {
        chunkCount++;
        // Parse chunk: "data: {...json...}"
        const jsonStr = chunk.replace(/^data:\s*/, '');
        const data = JSON.parse(jsonStr);
        
        if (data.textResponse) {
          fullResponse += data.textResponse;
          process.stdout.write('.');
        }
      } catch (e) {
        // Silently skip parse errors
      }
    }
  );
  
  console.log(`\n✅ Generated: ${fullResponse.length} chars`);
}

fullWorkflow().catch(err => console.error('❌ Error:', err));
```

## Key Points

1. **Provider must be set BEFORE streaming** - LLM won't respond without this
2. **Provider format: provider + model** - e.g., `openrouter` + `minimax/minimax-m2:free`
3. **Streaming chunks are JSON** - prefix `data: ` must be stripped before parsing
4. **Always use correct method names** - check `anythingllm.ts` for available methods
5. **Rate card auto-embeds 91 roles** - includes all Social Garden roles
6. **Architect prompt auto-applies** - includes all Sam's SOW requirements

## Testing Models via OpenRouter

All these models work via OpenRouter provider:
```
minimax/minimax-m2:free
qwen/qwen3-235b-a22b:free
z-ai/glm-4.5-air:free
deepseek/deepseek-r1-0528:free
qwen/qwen3-coder:free
openai/gpt-4o (enterprise, paid)
```

Configure with:
```javascript
await anythingLLM.setWorkspaceLLMProvider(
  workspace.slug,
  "openrouter",
  "model-id-here"
);
```
