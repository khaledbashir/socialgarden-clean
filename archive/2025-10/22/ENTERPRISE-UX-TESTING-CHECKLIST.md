# ✅ Enterprise-Grade UX Testing Checklist

**🚨 CRITICAL**: SEE **ARCHITECTURE-SINGLE-SOURCE-OF-TRUTH.md** FOR DEFINITIVE SYSTEM ARCHITECTURE  
That document is the ONLY authoritative source - always read it fully before making changes.

**Status**: TESTING IN PROGRESS | **Branch**: enterprise-grade-ux | **Latest Commit**: 5311ce0  
**Deployment**: VPS self-hosted on port 3000 (NOT easypanel.io)  
**Environment**: `/root/the11-dev` → builds and runs on http://localhost:3000

---

## 🚀 PHASE 1: DEPLOYMENT VERIFICATION

### ✅ COMPLETED: Code Deployed to VPS
- [x] Git branch confirmed: `enterprise-grade-ux`
- [x] Latest commit: `527d085` deployed
- [x] VPS running on port 3000: ✅ CONFIRMED
- [x] Frontend loads successfully

**Status**: ✅ DEPLOYMENT SUCCESSFUL

---

### ✅ COMPLETED: Dashboard Loads
- [x] App lands on dashboard view
- [x] No auto-navigation away (stays on dashboard)
- [x] Workspaces visible: Array(1) confirmed
- [x] SOWs loaded: 13 total from database
- [x] Folders loaded: 7 total from database

**Console Output**:
```
✅ Loaded 8 Gardners: Array(8)
🎯 [Agent Selection] Default agent set to: gen-the-architect
Loaded SOWs from database: 13
Total workspaces loaded: 7
Total SOWs loaded: 10
```

**Status**: ✅ PASS

---

## 🎯 PHASE 2: DASHBOARD & NAVIGATION

### ✅ Test 2.1: Dashboard Entry Point Working
- [x] Dashboard loads on app start
- [x] Dashboard stays put (doesn't auto-switch to editor)
- [x] All workspaces visible
- [x] All SOWs visible
- [x] No auto-navigation

**Status**: ✅ PASS - Dashboard entry point fixed!

---

### ⏳ Test 2.2: Manual Navigation to SOW
- [ ] On dashboard, click a SOW to open it
- [ ] App switches to editor view
- [ ] SOW document loads
- [ ] No navigation errors

**Next Action**: Click a SOW and check if it opens correctly

**Status**: ⏳ PENDING

---

## 💬 PHASE 3: CHAT & THREADS (NEW ISSUE FOUND)

### ⏳ Test 3.1: Thread Creation on SOW Load
- [x] Opened SOW in editor
- [x] Console shows threads attempting to load
- [ ] Thread should auto-create if missing (Pattern B expected)

**Expected Console (Pattern A or B)**:
```
Pattern A (thread exists):
🧵 [getThreadChats] Fetching messages from gen-the-architect/sow-xyz
✅ [getThreadChats] Got 0 messages from thread (attempt 1/5)

Pattern B (thread auto-created):
⚠️ [getThreadChats] Thread doesn't exist (400). Creating thread now...
✅ [getThreadChats] Thread created on-demand: sow-xyz-new
```

**Status**: ⏳ PENDING - Need to verify thread creation works

---

### ❌ Test 3.2: Chat Send - ISSUE FOUND
- [x] Attempted to send chat message
- [x] Got **401 Unauthorized** error on `/api/chat`
- [ ] ❌ Chat endpoint blocked

**Error Observed**:
```
/api/chat:1 Failed to load resource: the server responded with a status of 401 ()
page.tsx:2514 📥 Response Status: 401
```

**Root Cause**: Authentication token missing or expired on chat endpoint

**Action Needed**: Fix auth flow for chat endpoint

**Status**: ❌ BLOCKED - Need to fix 401 error

---

## 🤖 PHASE 4: TEST FEATURE #3 - Auto-Agent Selection

### Test 4.1: Dashboard Agent Auto-Selection
- [ ] Go to dashboard (click "Dashboard" or refresh)
- [ ] Look at the **Agent Selector dropdown** (right side)
- [ ] Should show **"Business Analyst"** auto-selected
- [ ] Below it says: "Selected for dashboard chat"
- [ ] Open browser console

**Expected Console Log**:
```
🤖 [Auto-Select] Dashboard mode → Auto-selecting Business Analyst
```

**PASS**: "Business Analyst" auto-selected in dashboard ✅  
**FAIL**: Manual selection needed, or wrong agent shown ❌

**Status**: ⏳ Test after deployment

---

### Test 4.2: Editor Agent Auto-Selection
- [ ] Click to open any SOW (goes to editor)
- [ ] Look at the **Agent Selector dropdown**
- [ ] Should show **"The Architect"** auto-selected
- [ ] Below it says: "Selected for SOW generation"
- [ ] Open browser console

**Expected Console Log**:
```
🤖 [Auto-Select] Editor mode → Auto-selecting GEN - The Architect
```

**PASS**: "The Architect" auto-selected in editor ✅  
**FAIL**: Manual selection needed, or wrong agent shown ❌

**Status**: ⏳ Test after deployment

---

## ⏳ PHASE 5: TEST FEATURE #4 - Workspace Creation Progress Modal

### Test 5.1: Create a New Workspace
- [ ] Go to dashboard
- [ ] Look for **"Create New Workspace"** button (usually top-right or "+" icon)
- [ ] Click it
- [ ] Enter a name: `"Test Workspace 2025"`
- [ ] A **modal popup should appear**

**Progress Modal Should Show**:
- [ ] 4 steps displayed
- [ ] Spinner on current step
- [ ] Checkmarks ✓ appear as steps complete
- [ ] Progress bar moving forward

**Expected Steps**:
1. ✓ Workspace data saved
2. ✓ AnythingLLM workspace created
3. ✓ Master dashboard initialized
4. ✓ Workspace ready!

**PASS**: See beautiful 4-step progress modal with animations ✅  
**FAIL**: No modal, or silent creation with no feedback ❌

**Status**: ⏳ Test after deployment

---

### Test 5.2: Workspace Creation Completes
- [ ] Progress modal finishes all 4 steps
- [ ] Modal auto-closes after completion
- [ ] New workspace appears in dashboard
- [ ] No errors in console

**PASS**: Workspace created, appears in list ✅  
**FAIL**: Modal hangs, workspace doesn't appear, errors ❌

**Status**: ⏳ Test after deployment

---

## 🌱 PHASE 6: TEST FEATURE #5 - Beautiful Onboarding Flow

### Test 6.1: Trigger Onboarding (Fresh User)
- [ ] **Clear localStorage**: Open console (F12), type: `localStorage.clear()`
- [ ] Press Enter
- [ ] Refresh the page
- [ ] **Onboarding flow should appear**

**You Should See**:
- [ ] Welcome screen with app description
- [ ] Beautiful gradient background
- [ ] Progress bar at bottom
- [ ] "Next" button to continue
- [ ] "Skip" (X) button to exit

**PASS**: Beautiful onboarding screen appears ✅  
**FAIL**: No onboarding, goes straight to dashboard ❌

**Status**: ⏳ Test after deployment

---

### Test 6.2: Navigate Through Onboarding
- [ ] Click **"Next"** button
- [ ] See Step 2 (Features overview)
- [ ] Click **"Next"** again
- [ ] See Step 3 (Create workspace option)
- [ ] Click **"Next"** again
- [ ] See Step 4 (Success/Ready screen)
- [ ] Click **"Finish"** or **"Done"**
- [ ] Onboarding closes, dashboard loads

**Each Step Should Have**:
- [ ] Clear title and description
- [ ] Progress indication
- [ ] Beautiful gradient design
- [ ] Smooth transitions between steps

**PASS**: Can complete all steps, smooth flow ✅  
**FAIL**: Steps broken, can't navigate, errors ❌

**Status**: ⏳ Test after deployment

---

### Test 6.3: Onboarding Doesn't Repeat
- [ ] Complete onboarding (or skip it)
- [ ] Close the browser
- [ ] Reopen the app
- [ ] **Onboarding should NOT appear again**
- [ ] Go straight to dashboard

**PASS**: Onboarding shows once, then never again ✅  
**FAIL**: Onboarding shows every time ❌

**Status**: ⏳ Test after deployment

---

## 🎯 PHASE 7: INTEGRATION TEST - Everything Works Together

### Test 7.1: Full User Flow
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Refresh page
- [ ] Complete onboarding flow
- [ ] Dashboard loads after onboarding
- [ ] Verify agent is auto-selected
- [ ] Create a new workspace (see progress modal)
- [ ] Workspace appears in dashboard
- [ ] Click workspace to open
- [ ] Editor loads with "The Architect" agent selected
- [ ] Try sending a chat message
- [ ] Message sends and receives response

**PASS**: Full flow works smoothly ✅  
**FAIL**: Any step breaks or shows error ❌

**Status**: ⏳ Test after deployment

---

---

## � CRITICAL ISSUE: 401 Unauthorized on Chat Endpoint

### Issue Details
**Error**: `/api/chat` returns 401 Unauthorized  
**When**: User tries to send a chat message  
**Root Cause**: Authentication token missing or expired  
**Severity**: BLOCKS all chat functionality

**Console Output**:
```
/api/chat:1 Failed to load resource: the server responded with a status of 401 ()
page.tsx:2514 📥 Response Status: 401
```

### Diagnosis Needed
- [ ] Check `/frontend/app/api/chat/route.ts` for auth validation
- [ ] Verify auth token is being sent with request headers
- [ ] Check if session/cookie is set correctly
- [ ] Verify auth middleware is not too strict

### Next Steps
1. Find the `/api/chat` route handler
2. Check how it validates auth
3. Compare with working endpoints (like `/api/sow/create`)
4. Add token to request if missing OR relax auth if too strict
5. Test chat again

**Status**: ❌ BLOCKED - Waiting for fix

---

## 🔧 TROUBLESHOOTING GUIDE

### Problem: 401 Unauthorized on /api/chat
**This is the current blocker**

Possible solutions:
1. Auth token not being sent → Add token to request headers
2. Session expired → Refresh session before chat
3. Auth middleware too strict → Modify middleware to allow chat requests
4. CORS issue → Check CORS headers
5. Missing auth provider → Ensure auth is initialized

**Files to check**:
- `/frontend/app/api/chat/route.ts` (main handler)
- `/frontend/lib/anythingllm.ts` (request builder)
- `/frontend/app/page.tsx` (where chat is called)

### Problem: Dashboard Shows But Then Switches Away
**Solution**: This means auto-selection is working! Check:
- Console logs show: `🤖 [Auto-Select] Editor mode`
- This is correct behavior if you had SOWs in a workspace
- New users won't see this (dashboard stays if no workspaces)

### Problem: 400 Errors Still in Console
**Solution**: Check the exact error message:
- If it says "Creating thread on-demand" → Good, working as designed
- If it says "Failed (attempt 5/5): 400" → Thread creation failing, DM me logs

### Problem: Workspace Creation Modal Doesn't Appear
**Solution**:
- Refresh the page
- Try creating another workspace
- Check browser console for JavaScript errors
- If still broken, share console output

### Problem: Onboarding Doesn't Appear
**Solution**:
- Clear localStorage: `localStorage.clear()`
- Refresh page
- If still no onboarding, check console for errors
- Onboarding only shows when there are ZERO workspaces

### Problem: Chat Doesn't Send
**Solution**:
- Check console for errors (F12 → Console)
- Verify thread was created (look for console logs)
- If 400 error, wait 5 seconds and try again
- Share console output if stuck

---

## 📊 FINAL RESULTS TEMPLATE

**When you've completed all tests, fill this out:**

```
Enterprise-Grade UX Testing Results
Date: [Today's date]
Build: [Commit number, e.g., 527d085]

✅ Dashboard Entry Point: PASS / FAIL / PARTIAL
   Notes: [Any issues or observations]

✅ Auto-Create Threads: PASS / FAIL / PARTIAL
   Notes: [Any issues or observations]

✅ Auto-Agent Selection: PASS / FAIL / PARTIAL
   Notes: [Any issues or observations]

✅ Workspace Progress: PASS / FAIL / PARTIAL
   Notes: [Any issues or observations]

✅ Onboarding Flow: PASS / FAIL / PARTIAL
   Notes: [Any issues or observations]

✅ Integration Test: PASS / FAIL / PARTIAL
   Notes: [Any issues or observations]

Overall Status: READY / NEEDS FIXES / BLOCKED
```

---

## 🚀 NEXT STEPS AFTER TESTING

### If All Tests Pass ✅
1. ✅ Features are production-ready
2. ✅ Can deploy to main/production
3. ✅ Celebrate! 🎉

### If Some Tests Fail ❌
1. ❌ Share console logs
2. ❌ Note which features failed
3. ❌ I'll fix and redeploy
4. ❌ Retest

### If Major Issues 🔴
1. 🔴 Rollback to previous version
2. 🔴 Debug root cause
3. 🔴 Fix and test locally first
4. 🔴 Then redeploy

---

## 💡 Quick Reference

| Feature | What to Test | Expected Result |
|---------|--------------|-----------------|
| Dashboard | Load app | Stays on dashboard, no auto-switch |
| Threads | Open SOW | Creates thread on-demand if missing |
| Auto-Agent | Look at dropdown | Business Analyst (dashboard) / The Architect (editor) |
| Progress | Create workspace | See 4-step modal with animations |
| Onboarding | Clear localStorage | See 5-step guided flow |

---

**Ready to test? Go to Easypanel and click Rebuild! 🚀**

Questions? Check the console logs first (F12 → Console tab).
Still stuck? Share the exact error message.
