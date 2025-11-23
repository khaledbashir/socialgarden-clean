# 🎯 DASHBOARD AI CHAT - QUICK REFERENCE CARD

**Save this file and reference it while implementing Phase 2**

---

## 📂 FILES TO CREATE/MODIFY

### 1️⃣ CREATE: `frontend/lib/chat-service.ts`
```typescript
// Import this in your files:
import { 
  createConversation, 
  addMessage, 
  getConversation,
  listConversations,
  updateConversationTitle,
  deleteConversation
} from '@/lib/chat-service';

// Use in API routes:
const convId = await createConversation(userId, 'Initial message');
await addMessage(convId, 'user', userMessage);
await addMessage(convId, 'assistant', assistantResponse);
```

**Lines**: ~150  
**Functions**: 7  
**Location**: Copy from `PHASE-2-CHAT-API-PERSISTENCE-GUIDE.md` (Step 1)

---

### 2️⃣ MODIFY: `frontend/app/api/dashboard/chat/route.ts`
```typescript
// Key changes around line 15:
const { messages, conversationId: providedConversationId, userId } = body;

// New logic:
let conversationId = providedConversationId;
if (!conversationId) {
  conversationId = await createConversation(userId);
}

await addMessage(conversationId, 'user', userMessage.content);
// ... call AnythingLLM ...
// ... then capture response and:
await addMessage(conversationId, 'assistant', assistantMessage);
```

**Changes**: ~50 lines  
**Key additions**: conversation management, message storage  
**Location**: Detailed in `PHASE-2-CHAT-API-PERSISTENCE-GUIDE.md` (Step 2)

---

### 3️⃣ CREATE: `frontend/app/api/dashboard/conversations/route.ts`
```typescript
// Handles two operations:

// POST - Create new conversation
export async function POST(request: NextRequest) {
  const { userId, title } = await request.json();
  const conversationId = await createConversation(userId, title);
  return NextResponse.json({ id: conversationId, success: true });
}

// GET - List all conversations
export async function GET(request: NextRequest) {
  const userId = searchParams.get('userId');
  const conversations = await listConversations(userId);
  return NextResponse.json({ conversations, success: true });
}
```

**Lines**: ~40  
**Endpoints**: 2  
**Location**: `PHASE-2-CHAT-API-PERSISTENCE-GUIDE.md` (Step 3)

---

### 4️⃣ CREATE: `frontend/app/api/dashboard/conversations/[id]/route.ts`
```typescript
// Handles three operations:

// GET - Retrieve conversation with messages
export async function GET(request, { params }) {
  const conversation = await getConversation(params.id);
  return NextResponse.json({ conversation, success: true });
}

// PATCH - Update title
export async function PATCH(request, { params }) {
  const { title } = await request.json();
  await updateConversationTitle(params.id, title);
  return NextResponse.json({ success: true });
}

// DELETE - Remove conversation
export async function DELETE(request, { params }) {
  await deleteConversation(params.id);
  return NextResponse.json({ success: true });
}
```

**Lines**: ~40  
**Endpoints**: 3  
**Location**: `PHASE-2-CHAT-API-PERSISTENCE-GUIDE.md` (Step 4)

---

## 🧪 TESTING WITH CURL

### Test 1: Create Conversation
```bash
curl -X POST http://localhost:3001/api/dashboard/conversations \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-1", "title": "Test"}'

# Response: { "id": "abc123", "success": true }
```

### Test 2: Send Chat Message
```bash
curl -X POST http://localhost:3001/api/dashboard/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "How many SOWs?"}],
    "conversationId": "abc123",
    "userId": "test-user-1"
  }'

# Response: Streams from AnythingLLM
```

### Test 3: Get Conversation
```bash
curl http://localhost:3001/api/dashboard/conversations/abc123

# Response: { "conversation": { "id": "abc123", "messages": [...] }, "success": true }
```

### Test 4: List Conversations
```bash
curl "http://localhost:3001/api/dashboard/conversations?userId=test-user-1"

# Response: { "conversations": [...], "success": true }
```

---

## 💾 DATABASE OPERATIONS

### Available Functions

| Function | Input | Output | Purpose |
|----------|-------|--------|---------|
| `createConversation(userId, title?)` | user ID, optional title | conversation ID | Create new chat |
| `addMessage(convId, role, content)` | conv ID, role, text | message ID | Store message |
| `getConversation(convId)` | conversation ID | full conversation object | Get with history |
| `listConversations(userId)` | user ID | array of conversations | List all |
| `updateConversationTitle(convId, title)` | conv ID, new title | void | Update title |
| `deleteConversation(convId)` | conversation ID | void | Remove conversation |
| `getMessageCount(convId)` | conversation ID | number | Count messages |

### Database Tables

**dashboard_conversations**
```sql
id (VARCHAR) - PRIMARY KEY
user_id (VARCHAR) - indexed
title (VARCHAR)
created_at (TIMESTAMP) - indexed
updated_at (TIMESTAMP) - indexed
```

**dashboard_messages**
```sql
id (VARCHAR) - PRIMARY KEY
conversation_id (VARCHAR) - indexed, FK
role (ENUM: 'user' | 'assistant') - indexed
content (TEXT)
created_at (TIMESTAMP) - indexed
```

---

## 📋 IMPLEMENTATION CHECKLIST

```
CREATE frontend/lib/chat-service.ts
  ☐ Import db connection
  ☐ Import uuid (or use require('uuid').v4())
  ☐ Define Conversation interface
  ☐ Define Message interface
  ☐ createConversation() - INSERT
  ☐ addMessage() - INSERT
  ☐ getConversation() - SELECT with JOIN
  ☐ listConversations() - SELECT ORDER BY
  ☐ updateConversationTitle() - UPDATE
  ☐ deleteConversation() - DELETE
  ☐ getMessageCount() - COUNT(*)
  ☐ Export all functions

MODIFY frontend/app/api/dashboard/chat/route.ts
  ☐ Import chat service functions
  ☐ Extract userId from request body
  ☐ Extract conversationId from body (nullable)
  ☐ Create conversation if null
  ☐ Store user message BEFORE AnythingLLM call
  ☐ Call AnythingLLM endpoint
  ☐ Capture full response in variable
  ☐ Store assistant message AFTER streaming
  ☐ Return conversationId with response
  ☐ Add error handling

CREATE frontend/app/api/dashboard/conversations/route.ts
  ☐ POST: Validate userId, call createConversation()
  ☐ GET: Validate userId, call listConversations()
  ☐ Both return { success: true, data... }

CREATE frontend/app/api/dashboard/conversations/[id]/route.ts
  ☐ GET: Return full conversation with messages
  ☐ PATCH: Update title
  ☐ DELETE: Remove conversation and messages

LOCAL TESTING
  ☐ Test create conversation
  ☐ Test send message (check DB for user message)
  ☐ Test receive response (check DB for assistant message)
  ☐ Test get conversation (all messages visible)
  ☐ Test list conversations
  ☐ Test update title
  ☐ Test delete conversation

DEPLOYMENT
  ☐ git add all 4 files
  ☐ git commit with message
  ☐ git push to enterprise-grade-ux
  ☐ Watch EasyPanel for rebuild
  ☐ Test on production URL
```

---

## 🚀 COPY-PASTE COMMANDS

### Create Branch (if needed)
```bash
cd /root/the11-dev
git checkout enterprise-grade-ux
```

### After Implementation
```bash
# Stage files
git add frontend/lib/chat-service.ts
git add frontend/app/api/dashboard/chat/route.ts
git add frontend/app/api/dashboard/conversations/route.ts
git add frontend/app/api/dashboard/conversations/conversations/\[id\]/route.ts

# Commit
git commit -m "Phase 2: Implement chat history persistence

- Add chat-service layer for database operations
- Update dashboard chat API with message persistence
- Create conversation management endpoints
- Implement conversation creation on first message
- Add streaming response storage
- Support multiple conversations per user"

# Push
git push origin enterprise-grade-ux
```

### Check Deployment
```bash
# Watch logs
docker logs -f ahmad_sow-qandu-me --tail 50

# Test endpoint
curl -X POST https://sow.qandu.me/api/dashboard/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Test"}],
    "userId": "test-user"
  }'
```

---

## 🆘 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| "Cannot find module uuid" | Use `require('uuid').v4()` or install package |
| "Unknown column 'user_id'" | Run migration: verify tables exist |
| "Connection refused" | Check MySQL running: `docker ps \| grep mysql` |
| "API returns 500" | Check logs: `docker logs ahmad_sow-qandu-me` |
| "Messages not storing" | Verify chat-service functions are imported |
| "Deployment hanging" | Check EasyPanel dashboard - wait 2-3 min |

---

## 📖 WHERE TO FIND DETAILS

- **Code details**: `PHASE-2-CHAT-API-PERSISTENCE-GUIDE.md`
- **Quick checklist**: `PHASE-2-QUICK-START.md`
- **Full roadmap**: `DASHBOARD-CHAT-IMPLEMENTATION-ACTION-PLAN.md`
- **Production commands**: `EASYPANEL-PRODUCTION-REFERENCE.md`
- **Existing chat API**: `frontend/app/api/dashboard/chat/route.ts`

---

## ⏱️ TIME ESTIMATES

| Task | Time |
|------|------|
| Read guides | 10 min |
| Create chat-service | 10 min |
| Modify chat route | 10 min |
| Create conversation endpoints | 10 min |
| Local testing | 10 min |
| Fix issues (if any) | 5-10 min |
| Commit and push | 5 min |
| EasyPanel deployment | 2-3 min |
| Production testing | 5 min |
| **TOTAL** | **45-60 min** |

---

## 🎯 SUCCESS LOOKS LIKE

✅ Can create new conversation via API  
✅ Can send message and it's stored in DB  
✅ Can retrieve conversation with all messages  
✅ Messages persist after page refresh  
✅ Can list all conversations for user  
✅ AnythingLLM still streams responses  
✅ Production URL works without errors  

---

## 🏁 YOU'RE READY!

All files are documented. All code is in guides. Just:

1. Copy code from `PHASE-2-CHAT-API-PERSISTENCE-GUIDE.md`
2. Create/modify 4 files
3. Test with curl
4. Push to GitHub
5. Verify production

**Estimated time: 45 minutes from now ⚡**

Questions? Check the detailed guide!
