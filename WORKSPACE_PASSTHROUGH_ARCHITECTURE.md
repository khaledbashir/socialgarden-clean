# Direct Workspace Passthrough Architecture

## Objective
The backend is now a pure passthrough to the AnythingLLM workspace configuration. The app does NOT modify or override the system prompt. It trusts the workspace settings configured by the admin (Ahmad) and provides reliable context injection instead.

## What Changed

### Removed (Reverted)
1. ❌ **Deleted** `SYSTEM_PROMPT_TEMPLATE` constant (was 150+ lines)
2. ❌ **Removed** `system_prompt_override` from the JSON payload to AnythingLLM
3. ❌ **Removed** hardcoded prompt construction logic
4. ❌ **Removed** system message filtering (now all messages pass through)

### Added (New Architecture)
1. ✅ **Rate Card Context Injection** – Rate card is prepended to every user message
2. ✅ **Direct Passthrough** – System prompt controlled entirely by AnythingLLM workspace config
3. ✅ **Reliable Context** – Rate card markdown always included, never lost via RAG

## How It Works

### Message Flow
```
User Request
    ↓
Backend fetches live rate card from /api/rate-card/markdown
    ↓
Prepend rate card to user message:
    [OFFICIAL_RATE_CARD_SOURCE_OF_TRUTH]
    {rate card markdown}
    
    [USER_REQUEST]
    {user's actual request}
    ↓
Send to AnythingLLM with workspace's configured system prompt
    ↓
AI responds using:
    - System prompt (from workspace config)
    - Rate card context (from prepended message)
    - All available RAG documents
```

### Key Differences

| Aspect | Before (Hardcoded) | After (Passthrough) |
|--------|-------------------|-------------------|
| System Prompt | Overridden by backend | Controlled by workspace admin |
| Rate Card | Embedded in system prompt | Prepended to user message |
| Backend Role | Modify AI behavior | Pass context + stream response |
| Control | Frontend developer | Workspace admin (Ahmad) |

## File Modified
- `frontend/app/api/anythingllm/stream-chat/route.ts`

## Testing

1. **Verify Passthrough**
   - Check backend logs for: `✅ INFO: System prompt is controlled by AnythingLLM workspace configuration.`
   - Verify no `system_prompt_override` in the AnythingLLM API request

2. **Verify Rate Card Injection**
   - Look for: `✅ [Rate Card Injection] Rate card prepended to message`
   - Send test prompt and confirm rate card context is used

3. **Verify System Prompt Control**
   - Go to AnythingLLM admin panel → workspace settings
   - Modify the system prompt
   - Send a message and confirm it uses the new prompt (not backend override)

## Admin Control
Ahmad can now control AI behavior entirely through AnythingLLM's admin panel:
- Change system prompt (workspace settings)
- Modify RAG documents
- Adjust model parameters
- No need to redeploy backend

## Benefits
✅ **Single Source of Truth** – Workspace config is authoritative  
✅ **Reliability** – Rate card always available in context  
✅ **Maintainability** – Fewer layers of logic  
✅ **Flexibility** – Admin can iterate on prompts without code changes  
✅ **Debuggability** – Simpler flow, easier to diagnose issues  

## Logs to Watch
```
📋 [Rate Card Injection] Fetching live rate card...
✅ [Rate Card Injection] Rate card prepended to message
✅ INFO: System prompt is controlled by AnythingLLM workspace configuration.
✅ INFO: Rate card is injected into user message context for reliable access.
```
