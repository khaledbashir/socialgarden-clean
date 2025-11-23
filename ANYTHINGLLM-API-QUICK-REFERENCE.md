# AnythingLLM API Quick Reference
**For AI Assistants & Developers**

> **Purpose**: This document contains ONLY the endpoints we actually use in our SOW Generator project. It's organized by priority and use case.

---

## 🎯 HOW TO USE THIS DOCUMENT

### When Building Features
1. **Search by use case** (e.g., "I need to create a chat thread")
2. **Copy the endpoint + example** from the appropriate section
3. **Check the Notes section** for common gotchas

### What This Document IS:
- ✅ Quick reference for endpoints we actively use
- ✅ Real examples from our codebase
- ✅ Common patterns and gotchas

### What This Document IS NOT:
- ❌ Complete API documentation (see official docs for that)
- ❌ Implementation details (see `frontend/lib/anythingllm.ts` for that)
- ❌ Comprehensive list of all possible endpoints

---

## 🔴 CRITICAL ENDPOINTS (Used Daily)

### 1. Create Workspace Thread
**When**: User starts new chat conversation  
**File**: `frontend/lib/anythingllm.ts:534`

```typescript
POST /api/v1/workspace/{workspaceSlug}/thread/new
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "userId": null,  // Optional - only for multi-user mode
  "name": "New Thread",  // Optional - auto-names on first message
  "slug": "thread-uuid"  // Optional - system generates if not provided
}

Response:
{
  "thread": {
    "id": 1,
    "name": "New Thread",
    "slug": "625a6332-a3b5-4e93-bc65-345f23213fc5",
    "user_id": null,
    "workspace_id": 79
  },
  "message": null
}
```

**⚠️ GOTCHA**: Thread names auto-update on first chat message - don't rely on the initial name

---

### 2. Stream Chat with Thread
**When**: User sends message in chat UI  
**File**: `frontend/lib/anythingllm.ts:738`

```typescript
POST /api/v1/workspace/{workspaceSlug}/thread/{threadSlug}/stream-chat
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "message": "What is AnythingLLM?",
  "mode": "chat",  // or "query" - see explanation below
  "userId": null,
  "attachments": [],  // Optional - for image uploads
  "reset": false  // true = clear chat history
}

Response: (Server-Sent Events stream)
[
  {
    "id": "uuid-123",
    "type": "textResponseChunk",
    "textResponse": "First chunk",
    "sources": [],
    "close": false,
    "error": null
  },
  ...
  {
    "id": "uuid-123",
    "type": "textResponseChunk",
    "textResponse": "final chunk!",
    "sources": [{ "title": "doc.txt", "chunk": "..." }],
    "close": true,
    "error": null
  }
]
```

**Chat Modes Explained**:
- `"chat"`: Uses LLM + embeddings + rolling chat history (default for conversations)
- `"query"`: Only uses embeddings if relevant, no chat history (good for one-off questions)

---

### 3. Get Thread Chat History
**When**: Loading existing chat conversation  
**File**: `frontend/lib/anythingllm.ts:634`

```typescript
GET /api/v1/workspace/{workspaceSlug}/thread/{threadSlug}/chats
Authorization: Bearer {API_KEY}

Response:
{
  "history": [
    {
      "role": "user",
      "content": "What is AnythingLLM?",
      "sentAt": 1692851630
    },
    {
      "role": "assistant",
      "content": "AnythingLLM is a platform...",
      "sources": [{ "source": "..." }]
    }
  ]
}
```

---

### 4. Update Workspace Settings (Temperature, Prompt, etc.)
**When**: Applying The Architect prompt to SOW workspaces  
**File**: `frontend/lib/anythingllm.ts:390`, `815`

```typescript
POST /api/v1/workspace/{workspaceSlug}/update
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "openAiPrompt": "Your custom system prompt here...",
  "openAiTemp": 0.7,
  "openAiHistory": 25  // Number of messages to keep in context
}

Response:
{
  "workspace": { "id": 79, "slug": "my-workspace", ... },
  "message": null
}
```

**Common Use Cases**:
- Set The Architect prompt for new SOW workspaces
- Update master dashboard prompt for analytics focus
- Adjust temperature for creativity vs consistency

---

## 🟡 IMPORTANT ENDPOINTS (Used Regularly)

### 5. Embed Document in Workspace
**When**: New SOW created → embed in client workspace + master dashboard  
**File**: `frontend/lib/anythingllm.ts:219`

```typescript
POST /api/v1/workspace/{workspaceSlug}/update-embeddings
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "adds": [
    "custom-documents/my-pdf.pdf-hash.json"
  ],
  "deletes": [
    "custom-documents/old-doc.txt-hash.json"
  ]
}

Response:
{
  "workspace": { "id": 79, "documents": [...] },
  "message": null
}
```

**⚠️ PREREQUISITE**: Document must be uploaded first (see endpoint #6)

---

### 6. Upload Raw Text as Document
**When**: Converting SOW HTML/text content into embeddable document  
**File**: `frontend/lib/anythingllm.ts:187`, `360`

```typescript
POST /api/v1/document/raw-text
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "textContent": "This is the raw text to embed...",
  "metadata": {
    "title": "SOW: Acme Corp - Social Media Campaign",  // REQUIRED
    "docAuthor": "Social Garden",
    "description": "Q1 2024 Social Media SOW",
    "docSource": "SOW Generator"
  }
}

Response:
{
  "success": true,
  "documents": [
    {
      "id": "c530dbe6-bff1-4b9e-b87f-710d539d20bc",
      "location": "custom-documents/raw-my-doc-text-uuid.json",
      "title": "SOW: Acme Corp...",
      "wordCount": 252,
      "token_count_estimate": 447
    }
  ]
}
```

**⚠️ IMPORTANT**: Save the `location` field - you need it for embedding (endpoint #5)

---

### 7. Create New Workspace
**When**: New client onboarded → create dedicated workspace  
**File**: `frontend/lib/anythingllm.ts:69`

```typescript
POST /api/v1/workspace/new
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "name": "Acme Corp",
  "similarityThreshold": 0.7,  // Optional
  "openAiTemp": 0.7,  // Optional
  "openAiHistory": 20,  // Optional
  "openAiPrompt": "System prompt",  // Optional
  "chatMode": "chat",  // or "query"
  "topN": 4  // Number of document chunks to retrieve
}

Response:
{
  "workspace": {
    "id": 79,
    "name": "Acme Corp",
    "slug": "acme-corp",
    "createdAt": "2023-08-17 00:45:03"
  },
  "message": "Workspace created"
}
```

**Auto-Slug Rules**:
- Lowercase
- Alphanumeric + hyphens only
- Spaces → hyphens
- Example: "Acme Corp!" → "acme-corp"

---

### 8. List All Workspaces
**When**: Dashboard initialization, workspace selector dropdown  
**File**: `frontend/lib/anythingllm.ts:109`

```typescript
GET /api/v1/workspaces
Authorization: Bearer {API_KEY}

Response:
{
  "workspaces": [
    {
      "id": 79,
      "name": "Acme Corp",
      "slug": "acme-corp",
      "createdAt": "2023-08-17 00:45:03",
      "openAiTemp": 0.7,
      "openAiHistory": 20,
      "threads": []
    }
  ]
}
```

---

## 🟢 UTILITY ENDPOINTS (Used Occasionally)

### 9. Update Thread Name
**When**: User renames conversation thread  
**File**: `frontend/lib/anythingllm.ts:572`

```typescript
POST /api/v1/workspace/{workspaceSlug}/thread/{threadSlug}/update
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "name": "Updated Thread Name"
}

Response:
{
  "thread": {
    "id": 1,
    "name": "Updated Thread Name",
    "slug": "thread-uuid"
  },
  "message": null
}
```

---

### 10. Delete Thread
**When**: User deletes conversation history  
**File**: `frontend/lib/anythingllm.ts:603`

```typescript
DELETE /api/v1/workspace/{workspaceSlug}/thread/{threadSlug}
Authorization: Bearer {API_KEY}

Response:
200 OK (no body)
```

---

### 11. Get Workspace Details
**When**: Fetching workspace metadata, checking if workspace exists  
**File**: `frontend/lib/anythingllm.ts:787`

```typescript
GET /api/v1/workspace/{workspaceSlug}
Authorization: Bearer {API_KEY}

Response:
{
  "workspace": {
    "id": 79,
    "name": "Acme Corp",
    "slug": "acme-corp",
    "documents": [],
    "threads": []
  }
}
```

---

## 🔵 NICE-TO-HAVE ENDPOINTS (Rarely Used)

### 12. Get All Threads in Workspace
**When**: Listing all conversations for a client  
**File**: `frontend/lib/anythingllm.ts:131`

```typescript
GET /api/v1/workspace/{workspaceSlug}/threads
Authorization: Bearer {API_KEY}

Response:
{
  "threads": [
    {
      "id": 1,
      "name": "Thread Name",
      "slug": "thread-uuid",
      "workspace_id": 79
    }
  ]
}
```

---

### 13. Non-Streaming Chat
**When**: Need synchronous response (not used in our UI)  
**File**: `frontend/lib/anythingllm.ts:702`

```typescript
POST /api/v1/workspace/{workspaceSlug}/thread/{threadSlug}/chat
Authorization: Bearer {API_KEY}
Content-Type: application/json

Body:
{
  "message": "What is AnythingLLM?",
  "mode": "chat"
}

Response:
{
  "id": "chat-uuid",
  "type": "textResponse",
  "textResponse": "Complete response here",
  "sources": [...],
  "close": true,
  "error": null
}
```

**Note**: We use streaming chat (#2) for better UX

---

## ⚫ NOT NEEDED (Endpoints We DON'T Use)

These are in the full API but irrelevant to our project:

- ❌ **Admin endpoints** (`/v1/admin/*`) - Not in multi-user mode
- ❌ **User management** (`/v1/users/*`) - Single-user system
- ❌ **Invites** (`/v1/admin/invite/*`) - Not used
- ❌ **OpenAI compatible endpoints** (`/v1/openai/*`) - Direct integration preferred
- ❌ **Embed widgets** (`/v1/embed/*`) - Not using iframe embedding
- ❌ **Document upload via file** (`/v1/document/upload`) - We use raw-text instead
- ❌ **Document folders** (`/v1/document/create-folder`) - Flat structure
- ❌ **Vector search** (`/v1/workspace/{slug}/vector-search`) - Chat handles this internally
- ❌ **System settings** (`/v1/system/*`) - Configured via AnythingLLM UI

---

## 📚 COMMON PATTERNS IN OUR CODEBASE

### Pattern 1: Dual Embedding (Client + Master Dashboard)
**File**: `frontend/lib/anythingllm.ts:embedSOWInBothWorkspaces()`

```typescript
// Step 1: Upload document
const doc = await POST /api/v1/document/raw-text

// Step 2: Embed in client workspace
await POST /api/v1/workspace/{clientSlug}/update-embeddings
  Body: { adds: [doc.location] }

// Step 3: Embed in master dashboard (with [CLIENT] prefix)
await POST /api/v1/workspace/sow-master-dashboard/update-embeddings
  Body: { adds: [doc.location] }
```

**Why**: Master dashboard can query ALL SOWs across ALL clients

---

### Pattern 2: Workspace Creation with Prompt
**File**: `frontend/lib/anythingllm.ts:createOrGetClientWorkspace()`

```typescript
// Step 1: Create workspace
const workspace = await POST /api/v1/workspace/new

// Step 2: Apply The Architect prompt (for SOW type workspaces)
await POST /api/v1/workspace/{slug}/update
  Body: {
    openAiPrompt: THE_ARCHITECT_SYSTEM_PROMPT,
    openAiTemp: 0.7,
    openAiHistory: 25
  }

// Step 3: Create default thread (users can chat immediately)
await POST /api/v1/workspace/{slug}/thread/new
```

---

### Pattern 3: Thread Chat with History
**File**: `frontend/app/api/anythingllm/stream-chat/route.ts`

```typescript
// Frontend sends message
const response = await POST /api/v1/workspace/{slug}/thread/{threadSlug}/stream-chat

// Backend streams response
const reader = response.body.getReader()
while (true) {
  const {done, value} = await reader.read()
  if (done) break
  
  // Parse SSE format: "data: {...}\n\n"
  const chunk = decoder.decode(value)
  const json = JSON.parse(chunk.replace('data: ', ''))
  
  if (json.type === 'textResponseChunk') {
    appendToUI(json.textResponse)
  }
}
```

---

## 🚨 COMMON GOTCHAS & TROUBLESHOOTING

### Issue: "Thread not found" after creation
**Cause**: AnythingLLM takes 2-3 seconds to index new threads  
**Solution**: Add 3-second delay before fetching thread history
```typescript
await createThread(...)
await new Promise(resolve => setTimeout(resolve, 3000))
await getThreadHistory(...)
```

---

### Issue: Empty chat responses
**Cause**: Workspace missing temperature/history settings  
**Solution**: Always set on workspace creation:
```typescript
{
  "openAiTemp": 0.7,
  "openAiHistory": 25
}
```

---

### Issue: Documents not appearing in chat context
**Cause**: Document uploaded but not embedded  
**Solution**: Two-step process required:
1. Upload: `POST /api/v1/document/raw-text`
2. Embed: `POST /api/v1/workspace/{slug}/update-embeddings`

---

### Issue: 401 Unauthorized
**Cause**: API key not in Authorization header  
**Solution**: 
```typescript
headers: {
  'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
  'Content-Type': 'application/json'
}
```

---

### Issue: Workspace slug mismatch
**Cause**: AnythingLLM auto-generates slugs with specific rules  
**Solution**: Always use the slug from the creation response, don't assume:
```typescript
const response = await createWorkspace({ name: "Acme Corp!" })
const slug = response.workspace.slug  // "acme-corp" (no "!")
```

---

## 🎯 HOW TO ASK AI FOR HELP

### ✅ GOOD REQUESTS (Copy these patterns):

**"Add thread deletion to the chat UI"**
```
Context: User clicks delete button in thread list
Need: Call DELETE /api/v1/workspace/{slug}/thread/{threadSlug}
File: frontend/components/tailwind/agent-sidebar-clean.tsx
```

**"Fix empty chat history on thread load"**
```
Issue: GET /api/v1/workspace/{slug}/thread/{threadSlug}/chats returns []
Check: Is 3-second delay after thread creation in place?
Reference: See GOTCHA in ANYTHINGLLM-API-QUICK-REFERENCE.md
```

**"Embed new SOW in both workspaces"**
```
Pattern: Dual embedding (see Pattern 1 in reference doc)
Step 1: Upload with POST /api/v1/document/raw-text
Step 2: Embed in client workspace
Step 3: Embed in master dashboard with [CLIENT] prefix
File: frontend/lib/anythingllm.ts:embedSOWInBothWorkspaces()
```

---

### ❌ BAD REQUESTS (Avoid these):

**"How does AnythingLLM work?"**  
→ Too vague - ask specific implementation questions

**"Show me all AnythingLLM endpoints"**  
→ This doc already shows what we use - be specific about what you need

**"Why isn't my chat working?"**  
→ Include: error messages, which endpoint, console logs, network tab

---

## 📖 ADDITIONAL RESOURCES

- **Full Implementation**: `/root/the11-dev/frontend/lib/anythingllm.ts`
- **Chat API Route**: `/root/the11-dev/frontend/app/api/anythingllm/stream-chat/route.ts`
- **Architecture Docs**: `/root/the11-dev/ARCHITECTURE-SINGLE-SOURCE-OF-TRUTH.md`
- **System Prompts**: `/root/the11-dev/frontend/lib/knowledge-base.ts`
- **Official API Docs**: https://docs.anythingllm.com/api (comprehensive but overwhelming)

---

## 🔄 DOCUMENT MAINTENANCE

**Last Updated**: October 24, 2025  
**Endpoints Count**: 13 actively used (out of 60+ available)  
**Coverage**: 100% of our codebase usage patterns

**Update This Doc When**:
- Adding new AnythingLLM integration features
- Discovering new gotchas/patterns
- API endpoint behavior changes
- New workspace types added (beyond SOW/Client/Generic)

---

**Made with ❤️ for efficient AI collaboration**
