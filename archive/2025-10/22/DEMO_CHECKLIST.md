# ✅ CLIENT DEMO CHECKLIST

## 🔧 Pre-Demo Setup (5 minutes)

### Step 1: Update API Key
- [ ] Go to http://168.231.115.219:3000 (Easypanel)
- [ ] Services → sow-qandu-me → Environment
- [ ] Update: `OPENROUTER_API_KEY=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`
- [ ] Save & Restart

### Step 2: Verify
- [ ] Wait 30 seconds for restart
- [ ] Run: `./verify-sow.sh`
- [ ] All 3 tests should show ✅

### Step 3: Manual Test
- [ ] Go to https://sow.qandu.me
- [ ] Create SOW → type `/ai` → generate text → should work ✅

---

## 🎬 Demo Script (15-20 minutes)

### Opening (1 min)
- [ ] Show homepage: https://sow.qandu.me
- [ ] Explain: "AI-powered SOW generator"
- [ ] Point out: Dashboard, Create button, documentation links

### Demo 1: Create SOW (3 min)
- [ ] Click "Create SOW"
- [ ] Fill in basic details
- [ ] Show auto-save indicator bottom-right
- [ ] Explain: "Everything saves automatically"

### Demo 2: Show Main Feature - AnythingLLM Chat (5 min)
- [ ] Point to right sidebar: "AI Assistant"
- [ ] Ask AI: "Generate project overview for a social media marketing project"
- [ ] Watch it generate → explain how it's context-aware
- [ ] Copy generated text into SOW
- [ ] **KEY POINT**: "This is the magic - one-click SOW generation"

### Demo 3: Show Floating AI Bar (3 min)
- [ ] Type `/ai` in editor
- [ ] Show 8 quick actions dropdown
- [ ] Select "Improve Writing"
- [ ] Show it refines text in real-time
- [ ] Explain: "Non-disruptive text enhancement"

### Demo 4: Show Model Selection (2 min)
- [ ] Go to https://sow.qandu.me/admin/settings
- [ ] Show model dropdown with 5 options
- [ ] Change model → Save
- [ ] Go back to editor → generate again with new model
- [ ] Point out: "You control which AI model powers it"

### Demo 5: Export (2 min)
- [ ] Go back to SOW
- [ ] Show PDF export button → download
- [ ] Show "Export to Google Sheets" button
- [ ] Explain: "Professional output, team-ready format"

### Closing (1 min)
- [ ] Recap: AI generation + model flexibility + professional output
- [ ] Offer: "We can customize models or providers for your needs"
- [ ] Call to action: "Ready to automate your SOW process?"

---

## 🎯 Key Talking Points

✨ **"AI-Powered Generation"**
- Not just templates - uses LLM to understand project context
- AnythingLLM integration provides intelligent suggestions
- Works with any OpenRouter model (100+ available)

🎨 **"Smart Text Tools"**
- Floating AI bar for quick improvements
- 8 pre-built actions (Improve, Shorten, etc.)
- Doesn't disrupt workflow - works inline

📊 **"Professional Results"**
- PDF export with formatting
- Google Sheets for collaboration
- Auto-save never loses work
- Version history available

⚙️ **"Flexible Configuration"**
- No coding needed to switch models
- Admin panel for settings
- Easy integration into existing workflows

---

## 🚨 Troubleshooting During Demo

### If Floating AI Bar shows error:
1. Refresh page
2. Check: `./verify-sow.sh` shows all ✅
3. If not: API key wasn't updated in Easypanel
4. If yes: Clear browser cache

### If Chat Assistant is slow:
- That's expected - AnythingLLM is processing
- Show the loading indicator
- Explain: "Working with AI takes a moment"
- Tip: "Models can be optimized for speed vs quality"

### If Model dropdown is empty:
- Refresh admin settings page
- Check browser console for errors
- Models list is in code - shouldn't be empty

### If Export doesn't work:
- Ensure SOW has content
- PDF takes 3-5 seconds to generate
- Backend service must be running

---

## 💬 Questions You'll Get (Answers)

**"Can we use our own AI provider?"**
→ "Yes, we support OpenRouter, AnythingLLM, or other providers. Just update the API key and model."

**"How much does this cost?"**
→ "We're using free models on OpenRouter. Cost depends on volume and models chosen."

**"Can this work offline?"**
→ "Currently needs internet for AI services, but we can customize for local/private LLMs."

**"How accurate is the AI-generated content?"**
→ "It's a great starting point. Always review and edit. The faster you iterate, the better results."

**"How long to implement for us?"**
→ "Setup: 1 hour. Customization: depends on needs. Can start immediately."

**"Can we brand it?"**
→ "Yes - logos, colors, domain. Also can white-label with your branding."

---

## 📊 Demo Performance Tips

✅ **DO:**
- Have 2-3 SOW examples pre-created
- Practice the flow before demo
- Show AnythingLLM chat first (it's the differentiator)
- Emphasize "no manual writing required"
- Show the admin settings (proves flexibility)

❌ **DON'T:**
- Get bogged down in technical details
- Apologize for AI quality (it's good!)
- Promise features not yet built
- Demo with poor internet (will be slow)

---

## ✅ Final Pre-Demo Checklist

- [ ] API key updated in Easypanel
- [ ] Container restarted (waited 30 sec)
- [ ] `./verify-sow.sh` shows all ✅
- [ ] Floating AI bar generates text (test `/ai`)
- [ ] Admin settings page loads
- [ ] Model dropdown shows 5+ options
- [ ] AnythingLLM chat responds
- [ ] PDF export button visible
- [ ] 2-3 demo SOWs pre-created
- [ ] Internet connection is fast
- [ ] Browser cache cleared
- [ ] Ready to wow them! 🚀

---

**Time to Ready**: 5 minutes  
**Demo Duration**: 15-20 minutes  
**Expected Outcome**: "When can we start?"

