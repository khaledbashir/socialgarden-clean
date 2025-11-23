# @Agent Implementation Guide

This document explains how the application implements `@agent` functionality to mirror AnythingLLM's agent behavior.

## Overview

The application leverages AnythingLLM's built-in agent detection by sending plain text messages containing the `@agent` invocation string. AnythingLLM automatically detects and handles agent mode, executing tools and flows as configured in the workspace.

## Architecture

### Core Principle

**The application acts as a thin conduit** - it preserves the user's message exactly as typed (including `@agent`), and forwards it to AnythingLLM's standard streaming chat API. AnythingLLM handles all agent logic internally.

### Key Endpoints

| Endpoint | Purpose | Agent Support |
|----------|---------|---------------|
| `POST /api/anythingllm/stream-chat` | Thread-based streaming chat (primary) | ✅ Full support |
| `POST /api/anythingllm/chat` | Non-streaming chat (legacy) | ✅ Full support |

Both endpoints forward to AnythingLLM's canonical endpoint:
```
POST /api/v1/workspace/{slug}/thread/{threadSlug}/stream-chat
```

## Implementation Details

### 1. Message Preservation

The application **preserves the user's message exactly as typed**, including the `@agent` string:

```typescript
// frontend/app/api/anythingllm/stream-chat/route.ts
const messageToSend = lastMessage.content; // Preserved exactly as user typed

// 🤖 @AGENT SUPPORT: Detect and preserve @agent invocations
const hasAgentInvocation = messageToSend.includes("@agent");
if (hasAgentInvocation) {
    console.log("🤖 [@Agent] Agent invocation detected");
    // Message is sent to AnythingLLM with @agent intact
}
```

### 2. Agent Invocation Format

Users invoke agents by including `@agent` in their message:

```json
{
  "workspaceSlug": "generate",
  "threadSlug": "fd64d73b-94cd-4ad9-a519-702f8461f302",
  "mode": "chat",
  "message": "@agent use the RAG Search tool to summarize the client's uploaded documents."
}
```

**Critical Requirements:**
- Message must be **plain text** (not JSON objects)
- `@agent` string must be preserved exactly as typed
- AnythingLLM detects `@agent` automatically and triggers agent mode

### 3. Agent Session Persistence

Once an agent is invoked via `@agent`:
- The agent session **remains active** for follow-up messages
- Users **do not need** to include `@agent` in subsequent messages
- Session persists until:
  - User sends `/exit` command
  - Agent completes the task
  - Thread is reset

### 4. Context Injection

The application injects context (rate card, analytics) **before** the user's message, ensuring `@agent` remains intact:

```typescript
const messageWithContext = `[OFFICIAL_RATE_CARD_SOURCE_OF_TRUTH]
${rateCardMarkdown}

[USER_REQUEST]
${messageToSend}`; // @agent string preserved here
```

## Agent Configuration Prerequisites

### 1. LLM Model Selection

Agents require an LLM model capable of tool-calling:
- **Current Model**: `glm-4.6` via `generic-openai`
- **Requirement**: Model must generate valid JSON for tool calls
- **Warning**: Smaller/quantized models may struggle with tool-calling JSON generation

### 2. Agent Tools Configuration

Agent tools must be enabled in AnythingLLM's Agent Skills configuration:

| Tool | Purpose | Example Use Case |
|------|---------|------------------|
| **RAG Search** | Search embedded documents | "Find information about client requirements" |
| **Web Scraping** | Scrape and embed URLs | "Research company website" |
| **API Call** | Call external APIs | "Fetch data from backend service" |
| **Summarize Documents** | Generate document summaries | "Summarize uploaded briefs" |

### 3. Workspace Configuration

The workspace must be configured with:
- **LLM Provider**: Selected in workspace settings
- **Agent Model**: Capable of tool-calling (e.g., `glm-4.6`)
- **System Prompt**: Defined in workspace (not overridden by app)
- **Tools Enabled**: Agent skills enabled in configuration

## Advanced Agent Features

### Agent Flows (No-Code Logic)

Agent Flows allow complex multi-step processes using visual blocks:

| Flow Block | Purpose | Example |
|------------|---------|---------|
| **API Call** | Invoke external APIs | Fetch data from backend using `${variableName}` syntax |
| **Web Scraper** | Extract text from URLs | Scrape client website and pass to LLM |
| **LLM Instruction** | Provide explicit instructions | Guide agent reasoning based on prior steps |

**Usage**: Configure flows in AnythingLLM UI, then invoke via `@agent` in messages.

### Custom Agent Skills (Code Logic)

For highly custom operations, implement JavaScript skills:

**Location**: `plugins/agent-skills/{hubId}/handler.js`

**Structure**:
```javascript
module.exports = {
    handler: async function({ userMessage, workspace }) {
        // Custom logic here
        this.introspect("Processing..."); // Log to UI
        return "Result string"; // Must return string
    }
};
```

## Testing @Agent Functionality

### Basic Test

1. Send message with `@agent`:
   ```
   @agent use RAG Search to find information about the client
   ```

2. Verify in logs:
   ```
   🤖 [@Agent] Agent invocation detected in user message
   ```

3. Check AnythingLLM response includes agent tool calls

### Session Persistence Test

1. Invoke agent: `@agent search for client requirements`
2. Send follow-up (no `@agent`): `What did you find?`
3. Verify agent session remains active

### Tool Execution Test

1. Ensure RAG Search tool is enabled
2. Upload document to workspace
3. Send: `@agent search for pricing information`
4. Verify agent finds and cites the document

## Troubleshooting

### Agent Not Responding

1. **Check Model**: Ensure workspace uses tool-calling capable model
2. **Check Tools**: Verify agent tools are enabled in AnythingLLM
3. **Check Logs**: Look for `🤖 [@Agent]` detection logs
4. **Check Message**: Verify `@agent` string is preserved in message

### Tool Calls Failing

1. **Model Capability**: Smaller models may fail at JSON generation
2. **Tool Configuration**: Verify tools are properly configured
3. **Workspace Settings**: Check agent model selection

### Agent Session Not Persisting

1. **Thread Context**: Ensure using thread-based endpoint (`/thread/{slug}/stream-chat`)
2. **Mode**: Use `mode: "chat"` (not `"query"`) for session persistence
3. **AnythingLLM Version**: Verify AnythingLLM supports agent sessions

## Best Practices

1. **Use Thread-Based Endpoints**: Always use `/thread/{slug}/stream-chat` for agent sessions
2. **Preserve Message Format**: Never modify or strip `@agent` from user messages
3. **Log Agent Invocations**: Use detection logging for debugging
4. **Configure Tools Properly**: Ensure required tools are enabled before use
5. **Model Selection**: Use models proven to work with tool-calling

## Related Files

- `frontend/app/api/anythingllm/stream-chat/route.ts` - Primary streaming endpoint with @agent support
- `frontend/app/api/anythingllm/chat/route.ts` - Non-streaming endpoint with @agent support
- `frontend/app/api/anythingllm/document/upload/route.ts` - Document upload for RAG
- `frontend/app/api/anythingllm/document/upload-link/route.ts` - URL scraping for RAG
- `frontend/app/api/anythingllm/document/raw-text/route.ts` - Raw text upload for RAG

## References

- [AnythingLLM API Documentation](./anythingllm-complete-api-endpoints.md)
- [AnythingLLM Agent Skills Documentation](https://useanything.com/docs/agent-skills)
- [Direct API Approach Guide](./README.md) - Recommended architecture for document uploads and RAG

