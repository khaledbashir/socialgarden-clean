# 🔧 Easypanel Environment Variables Update

## What's Changed
- Updated `/api/generate` endpoint to support dynamic model selection
- Admin panel now allows changing OpenRouter model from `http://168.231.115.219:3000/admin/settings`
- Default model changed to `openai/gpt-oss-20b:free` (working with your new API key)
- Models now support the `:free` suffix format

## Required Environment Variables to Update in Easypanel

Update these in your Easypanel `sow-qandu-me` service environment:

```env
# ✅ REQUIRED: Update this with your new OpenRouter API key
OPENROUTER_API_KEY=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

# ✅ OPTIONAL: Default model (can be changed from admin panel)
OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-20b:free

# ✅ OPTIONAL: For frontend to know the default model
NEXT_PUBLIC_DEFAULT_AI_MODEL=openai/gpt-oss-20b:free
```

## How to Update in Easypanel Dashboard

1. Go to **Services** → **sow-qandu-me**
2. Click **Environment** tab
3. Find `OPENROUTER_API_KEY` and replace with:
   ```
   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
   ```
4. Add new env vars if not present:
   ```
   OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-20b:free
   NEXT_PUBLIC_DEFAULT_AI_MODEL=openai/gpt-oss-20b:free
   ```
5. Click **Save** and **Restart** the service

## Alternative: Update via Docker Command

If you want to update from CLI:

```bash
# Stop the container
docker stop ahmad_sow-qandu-me.1.dmgle664fr12fc237t2r2t05u

# Update the environment and restart
# (Best done through Easypanel dashboard to ensure persistence)
```

## Verify the Update

After updating environment variables:

1. Test the API key:
   ```bash
   curl -s -X POST https://sow.qandu.me/api/generate \
     -H "Content-Type: application/json" \
     -d '{
       "prompt":"test",
       "option":"generate",
       "command":"write hello in one word"
     }' | head -20
   ```
   
   Expected response: Should return text without 401 error

2. Go to **Admin Panel**: `https://sow.qandu.me/admin/settings`
   - You should see model selector dropdown
   - Available free models:
     - `openai/gpt-oss-20b:free` (recommended - working)
     - `google/gemini-2.0-flash-exp:free`
     - `meta-llama/llama-3.1-70b-instruct:free`
     - `mistralai/mistral-large:free`
     - `deepseek/deepseek-chat:free`

3. Change model and save settings
4. Test floating AI bar in editor - should work now ✅

## What Works After Update

- ✅ Floating AI bar (magic wand) - text generation
- ✅ Quick actions (Improve, Shorten, Elaborate, etc.)
- ✅ Admin model selector to switch between free models
- ✅ Dynamic model configuration from frontend
- ✅ Both direct access and Easypanel link access will work

## Files Changed

- `frontend/app/api/generate/route.ts` - Now accepts model parameter and uses env var defaults
- `frontend/context/ai-settings.tsx` - Updated default model to use env var
- `frontend/app/admin/settings/page.tsx` - Updated model list and defaults

## Testing After Update

```bash
# Test direct floating AI bar generation
# 1. Go to https://sow.qandu.me
# 2. Create/open a SOW
# 3. Type `/ai` in the editor
# 4. Type a command like "write a summary"
# 5. Should generate text without 401 error
```

## Support

If you still get 401 errors after updating:
1. Verify API key was copied correctly (no extra spaces)
2. Restart the Easypanel service
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check that `OPENROUTER_API_KEY` env var is actually set in the container:
   ```bash
   docker exec ahmad_sow-qandu-me.1.dmgle664fr12fc237t2r2t05u env | grep OPENROUTER
   ```

