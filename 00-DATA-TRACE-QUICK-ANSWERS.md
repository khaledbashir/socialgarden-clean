# Data-Trace Investigation - Quick Answers

## Question 1: Frontend Prompt Handling
**Are there any hidden additions to chatInput before it's sent?**

### Answer: ✅ **NO - Frontend passes exact user message unchanged**

**File:** `frontend/components/tailwind/workspace-chat.tsx`
**Lines:** 382-408

The `chatInput` is passed directly to `onSendMessage(chatInput, threadSlug, attachments)` with:
- ✅ NO string concatenation
- ✅ NO hidden prompts prepended
- ✅ NO contextual data appended
- ✅ NO template literals modifying the message

**Verification:** The message flows through unchanged at this point.

---

## Question 2: Backend Context Injection
**Is context being injected before sending to AnythingLLM?**

### Answer: ⚠️ **YES - But ONLY for Master Dashboard, NOT for SOW generation**

**File:** `frontend/app/api/anythingllm/stream-chat/route.ts`
**Lines:** 216-235

```typescript
const isMasterDashboard = effectiveWorkspaceSlug === "sow-master-dashboard";

if (isMasterDashboard) {
    const liveData = await getLiveAnalyticsData();
    messageToSend = `${liveData}\n\nUser Question: ${messageToSend}`;
}
```

**Critical:** For SOW generation workspaces (e.g., "gen-the-architect", "hello", "pho"):
- ✅ NO context injection occurs
- ✅ Message passes through unchanged
- ✅ This analytics injection is INTENTIONAL for dashboard only

**Additional Finding:** System messages are actively FILTERED OUT at lines 105-108:
```typescript
if (Array.isArray(messages)) {
    messages = messages.filter((m: any) => m && m.role !== "system");
}
```

---

## Question 3: Rate Card Injection Method
**How is the rate card provided to the LLM?**

### Answer: 🔍 **Option C - Vector Database (RAG/Knowledge Base)**

The rate card is **NOT injected into the prompt**. Instead:

1. **Fetched from database** via `GET /api/rate-card/markdown` → Returns markdown table
2. **Uploaded as document** via `POST /api/v1/document/raw-text` → AnythingLLM processes it
3. **Embedded in workspace** via `POST /api/v1/workspace/{workspace}/update-embeddings` → Creates vector embeddings
4. **Retrieved via RAG** when user asks about pricing → Similarity search retrieves the rate card

**File:** `frontend/lib/anythingllm.ts`
- **Lines 249-278:** `buildRateCardMarkdown()` - Fetches from API
- **Lines 333-407:** `embedRateCardDocument()` - Embeds in workspace knowledge base

**Critical Issue:** Rate card is in RAG (vector search), NOT in explicit system prompt. If AnythingLLM doesn't treat RAG-retrieved content with same priority as explicit instructions, the LLM may not adhere to exact role names.

---

## Question 4: Final Payload Verification
**What is the exact JSON payload sent to AnythingLLM?**

### Answer: Simple structure with NO hidden content

**File:** `frontend/app/api/anythingllm/stream-chat/route.ts`
**Lines:** 271-281 (THE FETCH CALL)

```typescript
const response = await fetch(endpoint, {
    method: "POST",
    headers: {
        Authorization: `Bearer ${ANYTHINGLLM_API_KEY}`,
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        message: messageToSend,    // ← User message (potentially with analytics prepended for dashboard)
        mode,                      // ← 'chat' or 'query'
    }),
});
```

**Expected JSON:**
```json
{
  "message": "User's exact message or [analytics]\n\nUser Question: message",
  "mode": "chat"
}
```

✅ **The system prompt is NOT included in this payload**
✅ **The system prompt comes from workspace configuration in AnythingLLM**
✅ **No rate card is explicitly included (only in RAG/knowledge base)**

### **TO ADD DETAILED LOGGING OF FINAL PAYLOAD:**

Add this before the `fetch()` call at line 271:

```typescript
// 🔍 FINAL PAYLOAD DEBUG
const finalPayload = {
    message: messageToSend,
    mode,
};

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║        FINAL PAYLOAD SENT TO ANYTHINGLLM /chat ENDPOINT    ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log("Endpoint:", endpoint);
console.log("Full Payload:");
console.log(JSON.stringify(finalPayload, null, 2));
console.log("");
console.log("Message Content (Length: " + messageToSend.length + " chars):");
console.log("─".repeat(60));
console.log(messageToSend);
console.log("─".repeat(60));
console.log("");
```

---

## Root Cause of LLM Role Name Failures

Based on this investigation, the issue is **NOT** application code contaminating prompts.

### **The Real Problem:**

1. ✅ Frontend passes clean messages
2. ✅ Backend only injects analytics for dashboard (not SOW)
3. ⚠️ **Rate card is in RAG but may not be retrieved reliably**
4. ❌ **System prompt enforcement in AnythingLLM workspace may not be configured correctly**
5. ❌ **System messages are being filtered out at backend (line 105-108)**

### **Why LLM Ignores Role Name Instructions:**

- The system prompt in your workspace might be using a `[OFFICIAL_RATE_CARD]` placeholder
- But this placeholder is NOT being replaced with actual rate card data
- The rate card is embedded as a RAG document, but LLM doesn't treat it with same authority as explicit system prompt
- Alternatively, the system prompt might not be applied at all in AnythingLLM

### **Next Steps:**

1. **Verify AnythingLLM Admin** → Check the system prompt is actually saved and visible
2. **Test Rate Card Retrieval** → Ask "What is the exact hourly rate for Account Management - (Senior Account Director)?" 
3. **Add Debug Logging** → Use the code snippet from Question 4
4. **Implement Backend Validation** → After LLM responds, validate role names match official list
5. **Consider Explicit Embedding** → Instead of RAG, prepend rate card directly to every SOW message

---

## Summary Table: All Injection Points

| Location | What | Impact | For SOW? |
|----------|------|--------|----------|
| Frontend `workspace-chat.tsx` L382-408 | User message capture | ✅ NONE - unchanged | YES |
| Frontend `page.tsx` L5350-5410 | Message array construction | ✅ NONE - unchanged | YES |
| Backend `stream-chat/route.ts` L216-235 | Analytics injection | ⚠️ PREPENDED | Dashboard only |
| Backend `stream-chat/route.ts` L105-108 | System message filtering | ❌ REMOVED | YES |
| AnythingLLM Workspace | Rate card RAG | ⚠️ Retrieved via search | YES |
| AnythingLLM Workspace | System prompt | ❌ Not applied? | YES |

---

## Conclusion

**Application code is clean and NOT contaminating prompts.**

**The issue is in AnythingLLM configuration or rate card RAG retrieval, NOT in our application.**

Deploy the debug logging from Question 4, then verify AnythingLLM workspace settings directly.