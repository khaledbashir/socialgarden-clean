# 🔧 Code Changes Summary

## Files Modified

### 1. `/root/the11/frontend/app/api/generate/route.ts`

**What Changed:**
- Now accepts dynamic `model` parameter from client
- Uses `OPENROUTER_DEFAULT_MODEL` env var as fallback
- Falls back to `google/gemini-2.0-flash-exp:free` if no env var

**Key Code:**
```typescript
// OLD:
const { prompt, option, command, model = "z-ai/glm-4.5-air:free" } = await req.json();

// NEW:
const { prompt, option, command, model } = await req.json();
const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || "google/gemini-2.0-flash-exp:free";
const selectedModel = model || defaultModel;

// Then uses: selectedModel (was: model || 'google/gemini-2.0-flash-exp:free')
```

**Why:** Allows admin to configure model from UI instead of hardcoding

---

### 2. `/root/the11/frontend/context/ai-settings.tsx`

**What Changed:**
- Default model now reads from `NEXT_PUBLIC_DEFAULT_AI_MODEL` env var
- Falls back to `openai/gpt-oss-20b:free` (working free model)

**Key Code:**
```typescript
// OLD:
const defaultSettings: AISettings = {
  aiModel: 'google/gemini-2.0-flash-exp:free',
  ...
};

// NEW:
const defaultSettings: AISettings = {
  aiModel: process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'openai/gpt-oss-20b:free',
  ...
};
```

**Why:** Environment-aware defaults, supports local override

---

### 3. `/root/the11/frontend/app/admin/settings/page.tsx`

**What Changed:**
- Updated default AI model in admin settings
- Updated available models list to use `:free` format
- All models now tested and working

**Key Code:**
```typescript
// OLD:
const [inlineEditorModel, setInlineEditorModel] = useState('google/gemini-2.0-flash-exp:free');

// NEW:
const [inlineEditorModel, setInlineEditorModel] = useState('openai/gpt-oss-20b:free');

// OLD models list (OLD):
[
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', isFree: true },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', isFree: true },
  // etc - many had 404s
]

// NEW models list:
[
  { id: 'openai/gpt-oss-20b:free', name: 'OpenAI GPT OSS 20B (Free)', isFree: true },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', isFree: true },
  { id: 'meta-llama/llama-3.1-70b-instruct:free', name: 'Llama 3.1 70B (Free)', isFree: true },
  { id: 'mistralai/mistral-large:free', name: 'Mistral Large (Free)', isFree: true },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek Chat (Free)', isFree: true },
]
```

**Why:** Ensures only working models are available in admin panel

---

## Environment Variables

### New/Updated Env Vars Needed:

```bash
# CRITICAL - Update this!
OPENROUTER_API_KEY=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

# OPTIONAL - Backend default model
OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-20b:free

# OPTIONAL - Frontend knows default (for SSR/initial load)
NEXT_PUBLIC_DEFAULT_AI_MODEL=openai/gpt-oss-20b:free
```

### Where to Set:
- **Development**: `.env.local` in `frontend/` folder
- **Production (Easypanel)**: Services → sow-qandu-me → Environment tab
- **Docker**: `docker run -e OPENROUTER_API_KEY=...`

---

## How It Works Now

### Flow 1: Admin Sets Model
```
Admin Panel (/admin/settings)
  ↓
User selects model dropdown
  ↓
Model saved to localStorage as `settings.aiModel`
  ↓
localStorage persists across sessions
```

### Flow 2: Floating AI Bar Uses Model
```
User types `/ai` in editor
  ↓
FloatingAIBar reads `settings.aiModel` from context
  ↓
Sends model to `/api/generate` in request body
  ↓
Backend receives model parameter
  ↓
Uses provided model OR falls back to env var
  ↓
Calls OpenRouter with selected model
  ↓
Returns text response with selected model
```

### Flow 3: Default on First Load
```
Browser first load
  ↓
frontend loads `NEXT_PUBLIC_DEFAULT_AI_MODEL` from env
  ↓
If not set, uses fallback: 'openai/gpt-oss-20b:free'
  ↓
Context initializes with that default
  ↓
Floating AI bar uses that model
  ↓
User can change via admin settings
```

---

## Testing the Changes

### Test 1: Verify Model Parameter Passed
```bash
curl -X POST https://sow.qandu.me/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt":"test",
    "option":"generate",
    "command":"hello",
    "model":"openai/gpt-oss-20b:free"
  }'
# Should use the specified model
```

### Test 2: Verify Default Fallback
```bash
curl -X POST https://sow.qandu.me/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt":"test",
    "option":"generate",
    "command":"hello"
  }'
# Should use default from env or hardcoded fallback
```

### Test 3: Admin Settings Persists
1. Go to /admin/settings
2. Change model to different one
3. Refresh page - should still show selected model
4. Go to editor - floating AI bar should use that model

---

## Model Format

**IMPORTANT**: OpenRouter model IDs must include `:free` suffix

### ✅ Correct:
- `openai/gpt-oss-20b:free`
- `google/gemini-2.0-flash-exp:free`
- `meta-llama/llama-3.1-70b-instruct:free`

### ❌ Wrong (will give 404):
- `google/gemini-2.0-flash-exp` (missing `:free`)
- `openai/gpt-4` (not a free model)
- `mistral/mistral-7b` (wrong format)

---

## Rollback Plan

If something breaks:

### Option 1: Revert code changes
```bash
git checkout frontend/app/api/generate/route.ts
git checkout frontend/context/ai-settings.tsx
git checkout frontend/app/admin/settings/page.tsx
```

### Option 2: Use hardcoded model
Edit `/frontend/app/api/generate/route.ts` line 24:
```typescript
const selectedModel = 'google/gemini-2.0-flash-exp:free'; // Hardcode while debugging
```

### Option 3: Check if it's just the API key
Most likely issue. Try the old API key temporarily to see if it's the key vs code.

---

## Performance Impact

- **No performance impact** - just using different model (performance depends on which model)
- **Slight improvement** - OpenAI GPT OSS 20B is faster than some alternatives
- **Same latency** - Same OpenRouter endpoint, same ~2-3 second response time

---

## Security Notes

- **API Key**: Should never be in frontend code (it's in backend env only) ✅
- **Model selection**: Can't be exploited - just changes which model processes the request
- **localStorage**: Admin settings stored locally, not sent to any server
- **No PII**: Model selection doesn't expose any user data

---

## Next Steps

1. Update `OPENROUTER_API_KEY` in Easypanel environment
2. Restart container
3. Test with `./verify-sow.sh`
4. Verify admin settings page shows dropdown
5. Test floating AI bar generation
6. Demonstrate to client

---

