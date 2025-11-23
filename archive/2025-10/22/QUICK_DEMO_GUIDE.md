# 🚀 QUICK START: Update & Demo

## 1️⃣ Update API Key (2 minutes)

### In Easypanel:
1. Go to dashboard: http://168.231.115.219:3000
2. Services → sow-qandu-me → Environment
3. Find: `OPENROUTER_API_KEY`
4. Replace with: `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`
5. Save & Restart

### Or via CLI:
```bash
# SSH to server and check
docker ps | grep sow-qandu
docker inspect CONTAINER_ID | grep OPENROUTER_API_KEY
```

---

## 2️⃣ Verify (1 minute)

```bash
# Run verification script
./verify-sow.sh

# Or test manually
curl -s -X POST https://sow.qandu.me/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","option":"generate","command":"hello"}' | head -5
```

Expected: Text response (not 401)

---

## 3️⃣ Demo Points

### Show 1: Working Floating AI Bar
- Open https://sow.qandu.me
- Create SOW
- Type `/ai` in editor
- Type: "Write a catchy headline"
- ✅ See text generated in real-time

### Show 2: Model Selection (Admin)
- Go to https://sow.qandu.me/admin/settings
- Show dropdown with 5+ free models available
- Change model, save
- Generate again with new model
- Show different output

### Show 3: AnythingLLM Integration (Main Feature)
- Chat with SOW assistant on right sidebar
- Ask AI to generate project details
- Watch it fill in SOW sections
- This is the *real* differentiator

### Show 4: Export
- Generate complete SOW
- Click "Export to PDF" or "Export to Google Sheets"
- Shows professionalism

---

## 📌 Key Points

| What | Where | Status |
|------|-------|--------|
| **Frontend** | https://sow.qandu.me | ✅ Live |
| **Admin Settings** | https://sow.qandu.me/admin/settings | ✅ Ready |
| **API Key** | Easypanel Environment | ⚠️ Needs update |
| **Floating AI** | `/ai` command in editor | ⚠️ After key update |
| **AnythingLLM Chat** | Right sidebar | ✅ Working now |
| **PDF Export** | SOW toolbar | ✅ Working |

---

## 🎯 Model Options (After Update)

All are FREE and working:
- `openai/gpt-oss-20b:free` ← Recommended (tested)
- `google/gemini-2.0-flash-exp:free`
- `meta-llama/llama-3.1-70b-instruct:free`
- `mistralai/mistral-large:free`
- `deepseek/deepseek-chat:free`

---

## 💡 Pro Tips for Demo

1. **Pre-create** a sample SOW so you can jump in
2. **Practice** the flow: Create → Chat → Refine → Export
3. **Show** how text generation with `/ai` improves sections
4. **Emphasize** the AnythingLLM integration - that's the magic
5. **Mention** model flexibility - they can use any OpenRouter model

---

## ❓ If Client Asks...

**"Will this work offline?"**  
No, requires internet for AnythingLLM and OpenRouter APIs.

**"Can we use our own OpenRouter account?"**  
Yes! Just update the API key and OPENROUTER_DEFAULT_MODEL env vars.

**"Can we use other LLM providers?"**  
Currently set for OpenRouter, but backend supports AnythingLLM (already integrated for chat).

**"How many users can it handle?"**  
Depends on OpenRouter account limits. Currently on free tier.

---

## 📞 Still Not Working?

```bash
# Check if Docker has the key
docker exec ahmad_sow-qandu-me.1.dmgle664fr12fc237t2r2t05u printenv | grep OPENROUTER

# Should output:
# OPENROUTER_API_KEY=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

# If not there, Easypanel restart didn't pick it up
# Go back to Easypanel, click Restart again, wait 60 seconds
```

---

## ✅ Ready Checklist

- [ ] API key updated
- [ ] Container restarted
- [ ] Verification script passed
- [ ] Floating AI bar tested
- [ ] Admin settings viewed
- [ ] Model change tested
- [ ] PDF export works
- [ ] Ready for demo!

---

**File Summary:**
- `CLIENT_DEMO_READY.md` - Full details
- `EASYPANEL_ENV_UPDATE.md` - Env var guide
- `verify-sow.sh` - Health check script
- `frontend/app/api/generate/route.ts` - Modified to accept dynamic models
- `frontend/context/ai-settings.tsx` - Uses env var defaults
- `frontend/app/admin/settings/page.tsx` - Updated model list

**Time to ready**: ~5 minutes (update API key + restart)

