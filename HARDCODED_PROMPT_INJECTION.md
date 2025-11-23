# Hardcoded Prompt Injection Implementation

## Overview
The backend `/api/anythingllm/stream-chat` route now constructs and injects a complete, self-contained system prompt with the embedded rate card on every chat request. This bypasses unreliable workspace and RAG configuration and guarantees the "perfect package" prompt is used consistently.

## What Changed

### File Modified
- `frontend/app/api/anythingllm/stream-chat/route.ts`

### Key Implementation Details

1. **System Prompt Template** (v4.2)
   - Hardcoded constant `SYSTEM_PROMPT_TEMPLATE` with placeholder `[OFFICIAL_RATE_CARD_SOURCE_OF_TRUTH]`
   - Contains complete workflow instructions, JSON format requirements, and role enforcement rules
   - Includes critical enforcement: "Use ONLY exact role names from the rate card"

2. **Rate Card Fetching**
   - New function `getRateCardMarkdown()` fetches live rate card from `/api/rate-card/markdown`
   - Runs on every request to ensure currency

3. **System Prompt Construction**
   - Template placeholder is replaced with actual rate card markdown
   - Result is a massive, self-contained prompt (~2000+ lines)
   - Sent to AnythingLLM via new `system_prompt_override` key

4. **AnythingLLM Payload**
   - Request body now includes:
     ```json
     {
       "message": "user's chat message",
       "mode": "chat",
       "system_prompt_override": "COMPLETE_PROMPT_WITH_EMBEDDED_RATE_CARD"
     }
     ```

## Expected Behavior

✅ **Before:** System prompt was unreliable, sometimes filtered or replaced by workspace config  
✅ **After:** Same exact system prompt + rate card sent with every request, no workspace configuration needed

## Testing

1. Send a test prompt to any SOW workspace:
   ```
   hubspot integration and 3 landing pages 22k discount 5 percent
   ```

2. Verify response includes:
   - Exact role names from rate card (no abbreviations)
   - Correct financial calculations with 5% discount applied
   - Consistent, deterministic output

3. Check server logs for:
   ```
   🔥 [Hardcoded Prompt] Fetching rate card markdown...
   ✅ [Hardcoded Prompt] System prompt constructed (XXXX chars)
   🔥 CRITICAL: system_prompt_override is being injected
   ```

## No Breaking Changes

- All existing frontend/backend flows unchanged
- Rate card RAG documents can be removed (optional cleanup)
- Workspace system prompt settings are now ignored (by design)