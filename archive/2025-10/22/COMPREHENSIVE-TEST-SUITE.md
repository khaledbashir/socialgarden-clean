# 🧪 Comprehensive Test Suite - Build 30

## Test Environment
- **Frontend:** http://localhost:3000
- **AnythingLLM:** https://ahmad-anything-llm.840tjq.easypanel.host
- **API Key:** 0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
- **Master Dashboard:** sow-master-dashboard-54307162

---

## 🧪 TEST 1: Workspace Creation Flow

### Objective: Verify workspace is created in AnythingLLM

### Steps:
1. Open http://localhost:3000
2. Click "My Documents" → "New Folder"
3. Enter name: `TEST-WORKSPACE-001`
4. Click "Create"

### Expected Results:
```
✅ UI shows: "Workspace created successfully"
✅ Frontend shows new folder in sidebar
✅ console.log should show:
   - "🏢 Creating AnythingLLM workspace..."
   - "✅ AnythingLLM workspace created: test-workspace-001"
   - "💾 Saving folder to database..."
   - "✅ Folder saved to database with ID: [id]"
```

### Verification in AnythingLLM:
1. Go to https://ahmad-anything-llm.840tjq.easypanel.host
2. Click "Workspaces" in sidebar
3. **Should see:** `test-workspace-001` in the list
4. Click on it
5. **Should see:** 
   - Workspace settings
   - Documents section (will be empty or with embedded SOW)
   - Threads section (will have one thread)

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 2: SOW Document Creation & Embedding

### Objective: Verify SOW is created, thread is created, and document is embedded in BOTH workspaces

### Steps:
1. In the workspace you just created, click "New SOW"
2. System should automatically create SOW
3. Check browser console for logs

### Expected Results in Console:
```
✅ "📄 Creating SOW in database"
✅ "✅ SOW created with ID: [sowId]"
✅ "🧵 Creating AnythingLLM thread..."
✅ "✅ AnythingLLM thread created: thread_slug_xxx"
✅ "📊 Embedding SOW in both workspaces..."
✅ "📄 Embedding SOW: New SOW for TEST-WORKSPACE-001 to workspace: test-workspace-001"
✅ "✅ Document processed: custom-documents/..."
✅ "✅ Document EMBEDDED in workspace: test-workspace-001"  ← CRITICAL: /update-embeddings called
✅ "✅ Document EMBEDDED in workspace: sow-master-dashboard-54307162" ← CRITICAL: Master dashboard
```

### Key Check: Look for "EMBEDDED" messages (not just "added")
- ❌ If you see: "added to workspace" (old code)
- ✅ If you see: "EMBEDDED in workspace" (new code - Build 30)

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 3: Verify SOW is Embedded in Client Workspace

### Objective: Check AnythingLLM UI shows document is embedded (not just uploaded)

### Steps:
1. Go to https://ahmad-anything-llm.840tjq.easypanel.host
2. Click "Workspaces" → Find `test-workspace-001`
3. Click on workspace
4. Scroll to "Documents" section

### Expected Results:
```
✅ See document section showing:
   - [X] (checkmark) or "Embedded" indicator
   - Document name: "New SOW for TEST-WORKSPACE-001"
   - Status should NOT say "available" or "pending"
   - Status should show "embedded" or similar
```

### ❌ If you see:
- "Available to embed" ← Document is NOT embedded (broken)
- No documents ← Something failed

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 4: Verify SOW is Embedded in Master Dashboard

### Objective: Check master dashboard also has the SOW with client prefix

### Steps:
1. Go to https://ahmad-anything-llm.840tjq.easypanel.host
2. Click "Workspaces" → Find `sow-master-dashboard-54307162`
3. Click on workspace
4. Scroll to "Documents" section

### Expected Results:
```
✅ See document with prefix:
   - Document name: "[TEST-WORKSPACE-001] New SOW for TEST-WORKSPACE-001"
   - Status shows "embedded"
   - This allows admin to track which client SOW is which
```

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 5: @agent RAG Query in Client Workspace

### Objective: Verify @agent can find and cite the embedded SOW

### Steps:
1. Go back to http://localhost:3000
2. You should be in the workspace you created
3. Scroll right to see the AI chat panel on the right
4. In the chat input, type: `@agent What is the scope of work mentioned in this SOW?`
5. Hit Send

### Expected Results:
```
✅ Chat shows:
   - Agent starts thinking
   - Thinking blocks stream (if enabled)
   - Response says something like:
     "Based on the SOW in this workspace, the scope of work is..."
   - Sources section shows:
     - Document: "New SOW for TEST-WORKSPACE-001"
     - Chunk: [relevant text from SOW]
```

### ❌ If you see:
- "I don't have information about..." ← Document NOT embedded
- Error message ← Something failed
- No sources cited ← Document not being used

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 6: Switch to Master Dashboard

### Objective: Verify master dashboard is default and can see ALL SOWs

### Steps:
1. Click on dashboard mode (top nav)
2. Look at the right panel (AI chat)
3. Check workspace selector dropdown

### Expected Results:
```
✅ Workspace selector shows:
   - 🎯 All SOWs (Master) ← Selected by default
   - 📁 test-workspace-001 ← Available in dropdown
```

### Dropdown Test:
4. Click dropdown
5. Should see all available workspaces
6. Select "📁 test-workspace-001"

### Expected Results:
```
✅ Chat now uses that client workspace
✅ Queries will only search that client's SOWs
✅ Select back to "🎯 All SOWs (Master)"
✅ Queries search across ALL client SOWs
```

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 7: Master Dashboard @agent Cross-Client Query

### Objective: Verify master dashboard can query across all SOWs

### Prerequisites: You should have:
- At least 1-2 workspaces created
- At least 1-2 SOWs embedded in master dashboard

### Steps:
1. Make sure you're in "Dashboard" mode
2. Make sure "🎯 All SOWs (Master)" is selected in right panel
3. In chat input type: `@agent How many SOWs are in this master database?`
4. Hit Send

### Expected Results:
```
✅ Response mentions:
   - Number of SOWs found
   - References to different clients
   - Example: "I found 2 SOWs in this master workspace: [CLIENT-1] SOW... and [CLIENT-2] SOW..."
✅ Sources shows multiple documents
```

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 8: Verify Thread was Created

### Objective: Confirm conversation thread exists for chat history

### Steps:
1. Go to https://ahmad-anything-llm.840tjq.easypanel.host
2. Navigate to `test-workspace-001` workspace
3. Look for "Threads" section

### Expected Results:
```
✅ See thread listed:
   - Thread name/slug: thread_xxxxxxxxx
   - Created timestamp
   - Thread is associated with the SOW
```

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 9: Create Additional SOW in Same Workspace

### Objective: Verify multiple SOWs in one workspace work correctly

### Steps:
1. Make sure you're in the workspace (TEST-WORKSPACE-001)
2. Click "New SOW" again
3. Repeat TEST 2-5 for this new SOW

### Expected Results:
```
✅ New SOW created
✅ New thread created
✅ New SOW embedded in BOTH workspaces
✅ Now master dashboard should have 2 documents:
   - [TEST-WORKSPACE-001] New SOW for TEST-WORKSPACE-001 (first)
   - [TEST-WORKSPACE-001] New SOW (second)
✅ @agent can find both SOWs when querying
```

### ✅ PASS / ❌ FAIL: ___________

---

## 🧪 TEST 10: Verify Streaming Works

### Objective: Confirm thinking blocks and streaming work properly

### Steps:
1. In any chat, send: `@agent I need you to think about the timeline for this SOW`
2. Watch the response

### Expected Results:
```
✅ Thinking block appears (if enabled)
✅ Text streams in real-time (not all at once)
✅ Sources appear at bottom
✅ Agent mentions the SOW timeline from embedded document
```

### ✅ PASS / ❌ FAIL: ___________

---

## 📊 Test Summary

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Workspace Creation | ⬜ | |
| 2 | SOW Embedding (Both) | ⬜ | CRITICAL |
| 3 | Client Workspace Embedding | ⬜ | |
| 4 | Master Dashboard Embedding | ⬜ | |
| 5 | @agent Client Query | ⬜ | |
| 6 | Master Dashboard Selector | ⬜ | |
| 7 | Master Cross-Client Query | ⬜ | |
| 8 | Thread Creation | ⬜ | |
| 9 | Multiple SOWs | ⬜ | |
| 10 | Streaming | ⬜ | |

---

## 🚨 Critical Issues to Watch For

### Issue 1: Document NOT Embedding
- **Symptom:** Console shows "added to workspace" instead of "EMBEDDED in workspace"
- **Cause:** Using wrong endpoint (was /update, should be /update-embeddings)
- **Status:** ✅ Fixed in Build 30

### Issue 2: @agent Can't Find SOW
- **Symptom:** Agent says "I don't have information about..."
- **Cause:** Document uploaded but not embedded
- **Status:** ✅ Fixed in Build 30

### Issue 3: Master Dashboard Not Getting Document
- **Symptom:** Master dashboard only shows SOWs for ONE workspace
- **Cause:** embedSOWInBothWorkspaces not calling for master
- **Status:** ✅ Fixed in Build 28+30

### Issue 4: Streaming Broken
- **Symptom:** Thinking blocks don't stream, all at once
- **Cause:** Message combining at API level
- **Status:** ✅ Fixed in Build 26-27

### Issue 5: Wrong Master Dashboard Slug
- **Symptom:** Workspace selector shows wrong default
- **Cause:** Using old slug without number suffix
- **Status:** ✅ Fixed in Build 29

---

## 🎯 Success Criteria

**ALL tests PASS if:**
- ✅ Workspaces appear in AnythingLLM
- ✅ SOWs are embedded (not just uploaded)
- ✅ @agent finds embedded SOWs in RAG
- ✅ Master dashboard has all SOWs with client prefixes
- ✅ Streaming works smoothly
- ✅ Threads are created for conversation
- ✅ Multiple SOWs work in same workspace

---

## 📝 Test Execution Notes

Please fill in results as you test:

```
Tester: _______________
Date: __________________
Build: 30
Environment: Production / Staging / Local

Test 1: PASS / FAIL
  Notes: _________________________________________________

Test 2: PASS / FAIL (CRITICAL)
  Notes: _________________________________________________

Test 3: PASS / FAIL
  Notes: _________________________________________________

Test 4: PASS / FAIL
  Notes: _________________________________________________

Test 5: PASS / FAIL
  Notes: _________________________________________________

Test 6: PASS / FAIL
  Notes: _________________________________________________

Test 7: PASS / FAIL
  Notes: _________________________________________________

Test 8: PASS / FAIL
  Notes: _________________________________________________

Test 9: PASS / FAIL
  Notes: _________________________________________________

Test 10: PASS / FAIL
  Notes: _________________________________________________

Overall Result: ✅ ALL PASS / ⚠️ SOME FAIL
Issues Found: ___________________________________________________
```

---

## 🔍 Debug Commands

If tests fail, use these to investigate:

### Check workspace in AnythingLLM:
```
https://ahmad-anything-llm.840tjq.easypanel.host/api/v1/workspaces
```

### Check document embedding:
```
https://ahmad-anything-llm.840tjq.easypanel.host/api/v1/workspace/test-workspace-001/chats
```

### Check browser console:
1. Press F12
2. Go to Console tab
3. Look for log messages with 📁 📄 🧵 📊 ✅ ❌
4. Copy relevant logs for debugging

### Check network requests:
1. Press F12
2. Go to Network tab
3. Filter for "api"
4. Check for POST requests to:
   - `/update-embeddings` ← Should see 2 (client + master)
   - `/document/raw-text` ← Should see 2 (client + master)

---

## ✅ What Success Looks Like

When all tests pass:

1. **Create Workspace** → Appears in AnythingLLM immediately
2. **Create SOW** → Embedded in BOTH workspaces with no manual steps
3. **Query @agent** → Finds SOW and cites it with context
4. **Master Dashboard** → Shows all SOWs from all clients with prefixes
5. **Streaming** → Real-time thinking and response, no delays
6. **Conversation** → Thread tracks all chats for each SOW

🚀 **System is production-ready when all 10 tests pass!**
