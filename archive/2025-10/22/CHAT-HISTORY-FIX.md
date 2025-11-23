# 🐛 FIXED: Chat History 400 Error - Wrong Workspace Routing

## The Problem

When you tried to load a SOW and view chat history, you got a **400 error** from AnythingLLM:
```
ahmad-anything-llm.840tjq.easypanel.host/api/v1/workspace/checktets/thread/sow-mh2bfass-ic0dv/chats: 400
```

The issue was that the app was trying to fetch chat history from the **client workspace** (`checktets`) instead of the **"gen-the-architect"** workspace where the thread actually exists.

## Why This Happened

**Architecture Background:**
- All SOWs are generated in the `gen-the-architect` workspace on AnythingLLM
- Threads (persistent chat histories) are created in that workspace
- But documents were storing `workspaceSlug: folder.workspace_slug` (the client workspace)
- When loading chat history, the app used the wrong workspace

**The Bug (Line 653 in page.tsx):**
```typescript
// ❌ WRONG: Uses the client workspace (folder.workspace_slug = "checktets")
const history = await anythingLLM.getThreadChats(doc.workspaceSlug, doc.threadSlug);
```

Result: AnythingLLM returns 400 because thread `sow-mh2bfass-ic0dv` doesn't exist in workspace `checktets` - it exists in `gen-the-architect`!

## The Fix

Changed line 653 to **always use the correct workspace for SOW chat**:

```typescript
// ✅ CORRECT: Always use gen-the-architect for SOW editor threads
const history = await anythingLLM.getThreadChats('gen-the-architect', doc.threadSlug);
```

**Key insight:** 
- Dashboard chat uses client workspaces (different logic)
- **SOW editor chat ALWAYS uses gen-the-architect** (where threads are created)
- This is a fixed, hardcoded workspace for the SOW generation feature

## What Changed

**File:** `frontend/app/page.tsx` (lines 651-679)

**Before:**
```typescript
const loadChatHistory = async () => {
  if (doc.workspaceSlug && doc.threadSlug) {  // ❌ Checking workspace
    const history = await anythingLLM.getThreadChats(doc.workspaceSlug, doc.threadSlug); // ❌ Using it
```

**After:**
```typescript
const loadChatHistory = async () => {
  if (doc.threadSlug) {  // ✅ Only need thread
    const history = await anythingLLM.getThreadChats('gen-the-architect', doc.threadSlug); // ✅ Fixed workspace
```

## What You'll See Now

1. **Create a new SOW** - Thread created in `gen-the-architect`
2. **Chat with AI** - Message stored in that thread
3. **Switch to another SOW** - Previous SOW thread is cached
4. **Switch back** - Chat history loads from `gen-the-architect` workspace ✅
5. **No 400 errors** - AnythingLLM finds the thread because we're asking the right workspace

## Testing

After Easypanel redeploy:

```
1. Create SOW "test-chat" in workspace "checktets"
2. Click chat button → "Let me create a $5k email template SOW"
3. Wait for Architect response (should complete without 400 error)
4. View chat history (should show your message and response)
5. Switch to different SOW
6. Switch back to "test-chat"
7. Chat history should still be there ✅
```

## Commit

- **Hash:** `a814017`
- **Message:** "Fix: Always use gen-the-architect workspace for SOW editor chat history loading"
- **Status:** ✅ Pushed to GitHub production-latest branch

## Technical Notes

- This fix applies only to SOW editor mode (the streaming chat UI)
- Dashboard chat uses different logic (separate workspace routing)
- The workspace slug is still stored in documents for context/logging
- But for SOW editor chat, we always route to `gen-the-architect` workspace

This is correct because:
1. SOWs are generated in `gen-the-architect` workspace
2. AnythingLLM threads are tied to the workspace they're created in
3. To access a thread, you must use the correct workspace
4. SOW editor always = `gen-the-architect` workspace
