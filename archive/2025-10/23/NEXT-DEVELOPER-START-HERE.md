# 🚀 Quick Start Guide - October 25 Session

**For Next Developer:** Start here if picking up after this session.

---

## 📋 TL;DR - What Changed

| What | Status | Where |
|------|--------|-------|
| Portal UI (Google Sheets → Excel) | ✅ DONE | Portal page |
| Modal styling (#0E0F0F + white) | ✅ DONE | Workspace creation modal |
| Scope Assumptions section | ✅ DONE | SOW generator prompt |
| Management Services section | ✅ DONE | SOW generator prompt |
| Known issues documented | ✅ DONE | Checklist |

**Current Status:** 60% of requirements done (9/15)

---

## ⚡ What To Do Next (Priority Order)

### 1. 🔴 HIGH - Fix OpenRouter API 401 Error
**Why:** Inline AI generation broken (Expand/Rewrite buttons)  
**Error:** `Failed to load resource: /api/generate returned 401`  
**Location:** `floating-ai-bar.tsx:237`  
**Fix Steps:**
```bash
# 1. Check frontend .env for OPENROUTER_API_KEY
cat frontend/.env | grep OPENROUTER_API_KEY

# 2. If missing, add it
echo "OPENROUTER_API_KEY=sk-or-v1-..." >> frontend/.env

# 3. Verify route has the key
cat frontend/app/api/generate/route.ts

# 4. Test locally
cd frontend && npm run dev

# 5. If fixed, commit and push (auto-deploys)
git add -A && git commit -m "fix: Add OpenRouter API key to generate endpoint"
git push origin enterprise-grade-ux
```

### 2. 🟡 MEDIUM - Verify UI Elements Visibility

**Discount Section:**
- [ ] View `/portal/sow/[id]?id=1` (any SOW ID)
- [ ] Click "Pricing" tab
- [ ] Verify "Discount (%)" slider is visible and prominent
- [ ] If not obvious, make it bigger/highlight it

**Price Toggle:**
- [ ] Same page, same tab
- [ ] Find "Hide Grand Total" button
- [ ] Verify it's obvious and clickable
- [ ] If not, make it more prominent

**What to do if not visible:**
```bash
# Edit the portal page
nano frontend/app/portal/sow/[id]/page.tsx

# Search for "hideGrandTotal" or "Discount"
# Make styling more prominent (add bg color, increase size, etc)

# Test locally, then:
git add -A && git commit -m "ui: Make discount and price toggle more prominent"
git push origin enterprise-grade-ux
```

### 3. 🟡 MEDIUM - Test Scope Assumptions in SOWs

**To verify it works:**
```bash
# 1. Go to Architect/SOW generator in app
# 2. Generate a new SOW for a test project
# 3. Check if output has "## Scope Assumptions" section
# 4. Verify it appears AFTER "Project Outcomes"
# 5. Verify it appears BEFORE "Project Phases"

# If it doesn't appear:
# - Check THE_ARCHITECT_SYSTEM_PROMPT in frontend/lib/knowledge-base.ts
# - Look for "MANDATORY SECTION ORDER" comment
# - Re-read the enforcement section
# - Strengthen it further if needed
```

### 4. 🟡 MEDIUM - Test Management Services Section

**To verify it works:**
- Same as #3 above
- Look for "## Account & Project Management Services" section
- Should list 6 bullet points:
  * Project kick-off meeting
  * Weekly project status updates
  * Internal briefing
  * Change request management
  * Risk and issue escalation
  * Post-delivery knowledge transfer

**If missing:** Strengthen prompt in `frontend/lib/knowledge-base.ts`

---

## 📚 Documentation Files

**Read These In Order:**

1. **`SOW-REQUIREMENTS-CHECKLIST.md`** ← Start here
   - Lists all 15 requirements
   - Shows what's done, what's needed
   - Known issues section
   - Deployment workflow explained

2. **`SESSION-OCTOBER25-SUMMARY.md`** ← For context
   - What was accomplished this session
   - Why changes were made
   - Stats and metrics

3. **`PORTAL-UI-CLEANUP-COMPLETE.md`** ← Portal details
   - How Excel export works
   - Button layout
   - Testing checklist

4. **`PORTAL-UI-VISUAL-GUIDE.md`** ← For designers/PMs
   - Visual mockups
   - User flow scenarios
   - Mobile responsiveness

5. **`ARCHITECTURE-SINGLE-SOURCE-OF-TRUTH.md`** ← System overview
   - Overall architecture
   - How systems connect
   - Deployment architecture

---

## 🔧 Development Workflow

### Local Testing
```bash
cd frontend
npm install  # if needed
npm run dev  # Start dev server on :3000

# Browser: http://localhost:3000
```

### Making Changes
```bash
# 1. Edit files in VS Code
# 2. Save and check hot reload
# 3. Test in browser
# 4. When ready to deploy:

git add -A
git commit -m "clear message about what you fixed"
git push origin enterprise-grade-ux

# → EasyPanel auto-deploys in ~5 min
```

### Verify Deployment
```bash
# Check production: https://sow.qandu.me
# Should see your changes within 5-10 minutes of push

# If not deployed:
# 1. Check EasyPanel dashboard for build errors
# 2. Check GitHub Actions for failed builds
# 3. Check .env variables on EasyPanel
```

---

## 🎯 Current Branch

**Branch Name:** `enterprise-grade-ux`  
**Latest Commit:** `b936f0f`  
**Last Push:** Today  
**Auto-Deploy:** Enabled ✅  

**Checking Current State:**
```bash
git log --oneline -5  # See last 5 commits
git status            # See what's changed
git branch -a         # See all branches
```

---

## 🧪 Testing Checklist

Before pushing changes:

```
☐ npm run build passes (no errors)
☐ npm run dev runs without errors
☐ Tested in browser (http://localhost:3000)
☐ No console errors in browser DevTools
☐ Feature works as expected
☐ Related features still work
☐ Responsive design looks good (mobile/tablet)
☐ Ready to commit
```

---

## 📱 Testing SOW Features

### Generate a Test SOW
```
1. Go to https://sow.qandu.me
2. Create new workspace (SOW type)
3. Give it a test name (e.g., "Test Project Oct 25")
4. Wait for workspace creation
5. Click "Start Creating SOWs"
6. Enter test brief:
   "Build 3 landing pages with HubSpot integration"
7. Submit and wait for SOW generation
```

### Check Generated SOW
- [ ] Has "Scope Assumptions" section
- [ ] Assumptions come AFTER "Project Outcomes"
- [ ] Has "Account & Project Management Services" section
- [ ] All 6 management services listed
- [ ] Pricing table includes mandatory roles (Account Manager, Project Coordination, Senior Management)
- [ ] Account Manager hours are at BOTTOM of pricing table

### Test Portal Page
- [ ] Download PDF button works
- [ ] Download Excel button works (NEW)
- [ ] Excel file has 3 sheets (Overview, Content, Pricing)
- [ ] Accept Proposal button works
- [ ] AI Chat panel opens/closes
- [ ] Dark theme looks professional

---

## 🆘 If Something Breaks

**Step 1: Check the console**
```bash
# In browser DevTools (F12 or Cmd+Option+I):
# Console tab → Look for red errors
# Take a screenshot of error
```

**Step 2: Check the issue list**
```bash
# Open: SOW-REQUIREMENTS-CHECKLIST.md
# Look in "🐛 Known Issues & Fixes Needed" section
# Your error might already be documented there
```

**Step 3: Search for similar issues**
```bash
cd /root/the11-dev
grep -r "error message" --include="*.md"
# Search documentation for that error
```

**Step 4: Check git log**
```bash
git log --oneline --grep="similar keyword"
# See if someone fixed similar issue before
```

**Step 5: Revert if needed**
```bash
# Last commit broke things? Revert it:
git revert HEAD
git push origin enterprise-grade-ux

# Or go back to specific commit:
git reset --hard <commit-hash>
git push -f origin enterprise-grade-ux
```

---

## 🚀 When You're Ready to Deploy

### Pre-Deployment Checklist
```
☐ All changes committed to enterprise-grade-ux
☐ npm run build passes
☐ Tested locally (npm run dev)
☐ No console errors in browser
☐ Ready message in commit description
```

### Deploy (Auto-Deploy)
```bash
git push origin enterprise-grade-ux
# That's it! EasyPanel handles the rest:
# 1. Detects push
# 2. Pulls code from GitHub
# 3. Runs npm install
# 4. Runs npm run build
# 5. Deploys to production
# 6. Available in ~5 minutes
```

### Verify Deployment
```bash
# Wait 5 minutes, then:
# Visit: https://sow.qandu.me
# Test your changes in production
# If issues, follow "If Something Breaks" section
```

---

## 📞 Quick Reference

| Need | Location |
|------|----------|
| Main app code | `/root/the11-dev/frontend/` |
| SOW generator prompt | `frontend/lib/knowledge-base.ts` |
| Portal page | `frontend/app/portal/sow/[id]/page.tsx` |
| Modal styling | `frontend/components/tailwind/workspace-creation-progress.tsx` |
| API endpoints | `frontend/app/api/*/route.ts` |
| Checklists & docs | `/root/the11-dev/*.md` |
| Git history | `git log --oneline` |
| Current changes | `git status` |

---

## 💡 Pro Tips

1. **Use the checklist** - It tracks what's done and what needs work
2. **Read commit messages** - They explain WHY changes were made
3. **Test before pushing** - Deployment is automatic, so test locally first
4. **Push frequently** - Small commits are easier to debug than big ones
5. **Document your work** - Next developer will thank you
6. **Check SOW-REQUIREMENTS-CHECKLIST.md** - It's your map

---

## 🎓 Key Things To Remember

- **Auto-Deploy Works:** Every push to GitHub → auto-deploys
- **Scope Assumptions Required:** Add ⭐ markers to enforce
- **Management Services Visible:** Must be explicit section
- **Portal has Excel now:** Not Google Sheets anymore
- **Modal looks professional:** Dark #0E0F0F background
- **Known Issues Exist:** Check checklist for 401 error priority

---

**Questions?** Check the documentation files listed above.  
**Ready?** Pick the next task from "What To Do Next" and let's go! 🚀

*Last Updated: October 25, 2025*  
*Session: Portal Cleanup + SOW Requirements*  
*Status: 60% Complete (9/15 items done)*
