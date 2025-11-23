# 🎯 PHASE 2 IMPLEMENTATION: Chat API with Persistence

## ✅ STATUS CHECK
- **Database**: Ready ✅ (tables verified in production)
- **GitHub**: Pushed ✅ (enterprise-grade-ux branch)
- **API Endpoint**: Exists ✅ (streaming works)
- **Next Step**: Wire database into API ← YOU ARE HERE

---

## 📋 WHAT WE'RE BUILDING

Transform the stateless chat API into a persistent conversation system:

**BEFORE** (Current):
```
User → API → AnythingLLM → Response → Lost
(no history, no persistence, single query)
```

**AFTER** (Target):
```
User → API → 
  ├─ Create conversation (if new)
  ├─ Store user message in DB
  ├─ Send to AnythingLLM
  ├─ Capture response
  └─ Store assistant message in DB
    → Response + History visible
```

---

## 🛠️ IMPLEMENTATION STRATEGY

### Step 1: Create Chat Service Layer
**File**: `frontend/lib/chat-service.ts` (NEW)

This layer handles all database operations:

```typescript
import { db } from './db';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

// Create new conversation
export async function createConversation(
  userId: string,
  title?: string
): Promise<string> {
  const conversationId = require('uuid').v4();
  
  const connection = await db.getConnection();
  try {
    await connection.execute(
      'INSERT INTO dashboard_conversations (id, user_id, title) VALUES (?, ?, ?)',
      [conversationId, userId, title || 'New Conversation']
    );
    return conversationId;
  } finally {
    connection.release();
  }
}

// Add message to conversation
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<string> {
  const messageId = require('uuid').v4();
  
  const connection = await db.getConnection();
  try {
    await connection.execute(
      'INSERT INTO dashboard_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
      [messageId, conversationId, role, content]
    );
    return messageId;
  } finally {
    connection.release();
  }
}

// Get conversation with all messages
export async function getConversation(
  conversationId: string
): Promise<any> {
  const connection = await db.getConnection();
  try {
    // Get conversation
    const [conversations] = await connection.execute(
      'SELECT * FROM dashboard_conversations WHERE id = ?',
      [conversationId]
    );
    
    if (!conversations.length) {
      throw new Error('Conversation not found');
    }
    
    // Get messages
    const [messages] = await connection.execute(
      'SELECT * FROM dashboard_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );
    
    return {
      ...conversations[0],
      messages
    };
  } finally {
    connection.release();
  }
}

// List all conversations for user
export async function listConversations(
  userId: string
): Promise<Conversation[]> {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM dashboard_conversations WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return rows as Conversation[];
  } finally {
    connection.release();
  }
}

// Update conversation title
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const connection = await db.getConnection();
  try {
    await connection.execute(
      'UPDATE dashboard_conversations SET title = ? WHERE id = ?',
      [title, conversationId]
    );
  } finally {
    connection.release();
  }
}

// Delete conversation and messages
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  const connection = await db.getConnection();
  try {
    // CASCADE is set up in DB, so this deletes messages too
    await connection.execute(
      'DELETE FROM dashboard_conversations WHERE id = ?',
      [conversationId]
    );
  } finally {
    connection.release();
  }
}

// Get message count for conversation
export async function getMessageCount(
  conversationId: string
): Promise<number> {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM dashboard_messages WHERE conversation_id = ?',
      [conversationId]
    );
    return rows[0].count;
  } finally {
    connection.release();
  }
}
```

---

### Step 2: Update Chat API to Use Service
**File**: `frontend/app/api/dashboard/chat/route.ts` (MODIFY)

Change the POST handler to:
1. Get or create conversation
2. Store user message
3. Call AnythingLLM
4. Stream + store response

Here's the key changes needed (around line 15):

```typescript
import { createConversation, addMessage, getConversation } from '@/lib/chat-service';

export async function POST(request: NextRequest) {
  console.log('🎯 [DASHBOARD CHAT] REQUEST RECEIVED');
  
  try {
    const body = await request.json();
    const { messages, conversationId: providedConversationId, userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Get or create conversation
    let conversationId = providedConversationId;
    if (!conversationId) {
      // Extract first message for title
      const firstMessage = messages[0]?.content || 'New Conversation';
      const title = firstMessage.substring(0, 100);
      conversationId = await createConversation(userId, title);
      console.log('✅ [CHAT] Created new conversation:', conversationId);
    }
    
    // Store user message
    const userMessage = messages[messages.length - 1];
    if (userMessage && userMessage.role === 'user') {
      await addMessage(conversationId, 'user', userMessage.content);
      console.log('✅ [CHAT] Stored user message');
    }
    
    // Get the last user message
    const messageToSend = userMessage.content;

    // Call AnythingLLM streaming
    const fetchUrl = `${ANYTHINGLLM_URL}/api/v1/workspace/${DASHBOARD_WORKSPACE}/stream-chat`;
    
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageToSend,
        mode: 'chat',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AnythingLLM error:', response.status, errorText);
      return NextResponse.json(
        { error: 'AnythingLLM service error' },
        { status: response.status }
      );
    }

    // Create a transform stream to capture and store response
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: 'No response body' },
        { status: 500 }
      );
    }

    // Collect full response before storing
    const chunks: string[] = [];
    let assistantMessage = '';

    const transformStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            chunks.push(chunk);
            assistantMessage += chunk;
            
            // Stream to client immediately
            controller.enqueue(value);
          }
          
          // Store complete message after streaming
          if (assistantMessage) {
            await addMessage(conversationId, 'assistant', assistantMessage);
            console.log('✅ [CHAT] Stored assistant message, length:', assistantMessage.length);
          }
          
          controller.close();
        } catch (error) {
          console.error('❌ [CHAT] Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(transformStream, {
      headers: response.headers,
      status: response.status,
    });

  } catch (error) {
    console.error('❌ [DASHBOARD CHAT] Error:', error);
    return NextResponse.json(
      { 
        error: 'Chat error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

---

### Step 3: Add Conversation Endpoint
**File**: `frontend/app/api/dashboard/conversations/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  createConversation,
  listConversations,
  updateConversationTitle
} from '@/lib/chat-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, title } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const conversationId = await createConversation(userId, title);
    
    return NextResponse.json({
      id: conversationId,
      success: true
    });
  } catch (error) {
    console.error('❌ Create conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const conversations = await listConversations(userId);
    
    return NextResponse.json({
      conversations,
      success: true
    });
  } catch (error) {
    console.error('❌ List conversations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

### Step 4: Add Conversation Detail Endpoint
**File**: `frontend/app/api/dashboard/conversations/[id]/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  getConversation,
  updateConversationTitle,
  deleteConversation
} from '@/lib/chat-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await getConversation(params.id);
    
    return NextResponse.json({
      conversation,
      success: true
    });
  } catch (error) {
    console.error('❌ Get conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }
    
    await updateConversationTitle(params.id, title);
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('❌ Update conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteConversation(params.id);
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

---

## 📝 SUMMARY OF FILES TO CREATE/MODIFY

| File | Action | Purpose |
|------|--------|---------|
| `frontend/lib/chat-service.ts` | **CREATE** | Database operations for conversations |
| `frontend/app/api/dashboard/chat/route.ts` | **MODIFY** | Add persistence to existing endpoint |
| `frontend/app/api/dashboard/conversations/route.ts` | **CREATE** | List/create conversations |
| `frontend/app/api/dashboard/conversations/[id]/route.ts` | **CREATE** | Get/update/delete conversation |

---

## 🧪 TESTING PHASE 2

After implementing, test with:

```bash
# 1. Create new conversation
curl -X POST http://localhost:3001/api/dashboard/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-1",
    "title": "Test Conversation"
  }'
# Expected: Returns { id: "...", success: true }

# 2. Send chat message
curl -X POST http://localhost:3001/api/dashboard/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "How many SOWs do we have?"}
    ],
    "conversationId": "[ID-FROM-STEP-1]",
    "userId": "test-user-1"
  }'
# Expected: Streams response + stores in DB

# 3. Get conversation with history
curl "http://localhost:3001/api/dashboard/conversations/[ID-FROM-STEP-1]"
# Expected: Returns { conversation: { id, messages: [...] }, success: true }

# 4. List all conversations
curl "http://localhost:3001/api/dashboard/conversations?userId=test-user-1"
# Expected: Returns { conversations: [...], success: true }
```

---

## 🚀 DEPLOYMENT

Once Phase 2 is complete:

```bash
cd /root/the11-dev

# Stage changes
git add frontend/lib/chat-service.ts
git add frontend/app/api/dashboard/

# Commit
git commit -m "Phase 2: Implement chat history persistence

- Add chat-service layer for database operations
- Update dashboard chat API to store/retrieve messages
- Create conversation management endpoints
- Implement conversation creation on first message
- Add message persistence with streaming response
- Support multiple conversations per user"

# Push
git push origin enterprise-grade-ux

# Wait for EasyPanel to redeploy
# Then test on https://sow.qandu.me
```

---

## ⏭️ WHAT'S NEXT

After Phase 2:
- **Phase 3**: Create conversation endpoints (bonus - already done in this guide!)
- **Phase 4**: Build frontend UI components
- **Phase 5**: Integrate into dashboard
- **Phase 6**: Full testing and deployment

---

## 💡 KEY POINTS

✅ **No breaking changes** - old stateless queries still work  
✅ **User-isolated** - conversations tracked by user_id  
✅ **Scalable** - indexed for performance  
✅ **Transaction-safe** - uses database connections properly  
✅ **Streaming preserved** - response still streams to client  
