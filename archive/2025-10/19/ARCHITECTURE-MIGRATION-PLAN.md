# 🏗️ AnythingLLM Architecture Migration Plan
## Folders = Workspaces, SOWs = Threads

**Status:** 🟡 Planning Phase  
**Target:** Replace localStorage with AnythingLLM as primary storage  
**Impact:** Major architectural shift - full system refactor

---

## 🎯 Vision

### Current Architecture (localStorage):
```
📁 Folders (localStorage)
  ├── 📄 SOW 1 (localStorage)
  ├── 📄 SOW 2 (localStorage)
  └── 📄 SOW 3 (localStorage)
  
💬 AI Chat: Separate workspace per client, manual embedding
```

### New Architecture (AnythingLLM Native):
```
🏢 Workspace (AnythingLLM) = Folder = Client
  ├── 🧵 Thread 1 = "Q1 Marketing SOW" (chat history isolated)
  ├── 🧵 Thread 2 = "Website Redesign SOW" (chat history isolated)  
  └── 🧵 Thread 3 = "CRM Implementation" (chat history isolated)
  
💬 AI Chat: Thread-native conversations, automatic context
```

---

## ✅ Benefits

1. **Perfect Chat Isolation** - Each SOW has its own thread with isolated chat history
2. **API-Native CRUD** - Create/rename/delete folders/SOWs via AnythingLLM API
3. **Multi-Device Sync** - No more localStorage limitations
4. **Better Context** - Workspace-level context + thread-specific SOW content
5. **Cleaner Architecture** - Single source of truth (AnythingLLM)
6. **Proper Delete Cascade** - Delete folder = delete workspace + all threads
7. **Thread Forking** - Clone SOWs with chat history (future feature)
8. **Better Portal** - Real-time chat history sync from threads

---

## 📋 Implementation Phases

### Phase 1: API Service Enhancement ✅ (Complete)
- [x] Create `AnythingLLMService` class
- [x] Implement workspace creation
- [x] Implement document embedding
- [x] Implement chat URL generation
- [x] Auto-inject Social Garden knowledge base

### Phase 2: Thread API Integration 🟡 (Current)
**Files to Update:**
- `/root/the11/novel-editor-demo/apps/web/lib/anythingllm.ts`
- `/root/the11/novel-editor-demo/apps/web/app/page.tsx`
- `/root/the11/novel-editor-demo/apps/web/components/tailwind/sidebar.tsx`

**New Methods Needed:**
```typescript
// Thread Management
async createThread(workspaceSlug: string, name: string): Promise<{ slug: string; id: string }>
async updateThread(workspaceSlug: string, threadSlug: string, name: string): Promise<boolean>
async deleteThread(workspaceSlug: string, threadSlug: string): Promise<boolean>
async getThreadChats(workspaceSlug: string, threadSlug: string): Promise<ChatMessage[]>
async chatWithThread(workspaceSlug: string, threadSlug: string, message: string): Promise<Response>

// Workspace Management (enhanced)
async createWorkspace(name: string): Promise<{ slug: string; id: string }>
async deleteWorkspace(slug: string): Promise<boolean>
async renameWorkspace(slug: string, newName: string): Promise<boolean>
```

### Phase 3: Data Model Migration 🔲 (Next)
**Current Data Model:**
```typescript
interface Folder {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  content: any;
  folderId: string | null;
  createdAt: Date;
}
```

**New Data Model:**
```typescript
interface Folder {
  id: string;           // Keep for backward compatibility
  name: string;
  workspaceSlug: string;  // 🆕 AnythingLLM workspace slug
  workspaceId: string;    // 🆕 AnythingLLM workspace ID
  embedId?: string;       // 🆕 For portal widget
}

interface Document {
  id: string;           // Keep for backward compatibility
  title: string;
  content: any;
  folderId: string | null;
  threadSlug: string;     // 🆕 AnythingLLM thread slug
  threadId: string;       // 🆕 AnythingLLM thread ID
  workspaceSlug: string;  // 🆕 Parent workspace
  createdAt: Date;
  syncedAt?: Date;        // 🆕 Last sync timestamp
}
```

### Phase 4: Folder Operations 🔲
**Folder Create:**
```typescript
// When user creates folder:
1. Create workspace in AnythingLLM
2. Auto-inject Social Garden KB
3. Set client-facing prompt
4. Get/create embed ID
5. Save folder with workspaceSlug
```

**Folder Rename:**
```typescript
// When user renames folder:
1. Update workspace name via API
2. Update localStorage folder name
```

**Folder Delete:**
```typescript
// When user deletes folder:
1. Delete workspace (cascades to all threads)
2. Remove from localStorage
```

### Phase 5: SOW Operations 🔲
**SOW Create:**
```typescript
// When user creates SOW:
1. Get parent folder's workspaceSlug
2. Create thread in that workspace
3. Save document with threadSlug
4. Initial thread message with SOW content
```

**SOW Rename:**
```typescript
// When user renames SOW:
1. Update thread name via API
2. Update localStorage document title
```

**SOW Delete:**
```typescript
// When user deletes SOW:
1. Delete thread via API
2. Remove from localStorage
```

**SOW Edit:**
```typescript
// When user edits SOW content:
1. Save to localStorage (immediate)
2. Debounced: Send chat message to thread with updated content
3. Mark syncedAt timestamp
```

### Phase 6: Chat Integration 🔲
**Current:**
- Separate "AI Agent" sidebar
- Generic workspace chat
- Manual "Embed to AI" button

**New:**
- Chat directly in thread context
- No manual embedding needed
- "Ask AI about this SOW" button
- Opens thread-specific chat with SOW context

### Phase 7: Portal Enhancement 🔲
**Current Portal:**
```typescript
// Loads from localStorage
const doc = localStorage.getItem(`document_${id}`);
```

**New Portal:**
```typescript
// Loads from AnythingLLM thread
const threadHistory = await anythingLLM.getThreadChats(workspaceSlug, threadSlug);
const latestSOW = threadHistory.find(msg => msg.role === 'user' && msg.content.includes('SOW'));
```

### Phase 8: Migration Tool 🔲
**One-Time Migration Script:**
```typescript
async function migrateLocalStorageToAnythingLLM() {
  const folders = JSON.parse(localStorage.getItem('folders') || '[]');
  const documents = JSON.parse(localStorage.getItem('documents') || '[]');
  
  for (const folder of folders) {
    // Create workspace for each folder
    const { slug, id } = await anythingLLM.createWorkspace(folder.name);
    folder.workspaceSlug = slug;
    folder.workspaceId = id;
    
    // Migrate documents in this folder
    const folderDocs = documents.filter(d => d.folderId === folder.id);
    for (const doc of folderDocs) {
      // Create thread for each document
      const { slug: threadSlug, id: threadId } = await anythingLLM.createThread(slug, doc.title);
      doc.threadSlug = threadSlug;
      doc.threadId = threadId;
      doc.workspaceSlug = slug;
      
      // Send initial message with SOW content
      await anythingLLM.chatWithThread(slug, threadSlug, `Here is the SOW: ${JSON.stringify(doc.content)}`);
    }
  }
  
  // Save migrated data
  localStorage.setItem('folders', JSON.stringify(folders));
  localStorage.setItem('documents', JSON.stringify(documents));
  localStorage.setItem('migrated_to_anythingllm', 'true');
}
```

---

## 🔧 Technical Implementation Details

### API Endpoints Used

**Workspace APIs:**
```
POST   /v1/workspace/new                     - Create workspace
DELETE /v1/workspace/{slug}                  - Delete workspace  
POST   /v1/workspace/{slug}/update           - Rename workspace
GET    /v1/workspace/{slug}                  - Get workspace details
```

**Thread APIs:**
```
POST   /v1/workspace/{slug}/thread/new       - Create thread
POST   /v1/workspace/{slug}/thread/{threadSlug}/update - Rename thread
DELETE /v1/workspace/{slug}/thread/{threadSlug}        - Delete thread
GET    /v1/workspace/{slug}/thread/{threadSlug}/chats  - Get chat history
POST   /v1/workspace/{slug}/thread/{threadSlug}/chat   - Send message
POST   /v1/workspace/{slug}/thread/{threadSlug}/stream-chat - Stream chat
```

**Embed APIs:**
```
POST   /v1/embed/new                        - Create embed for workspace
GET    /v1/embed/{embedUuid}                - Get embed details
```

### Error Handling Strategy

1. **Dual-Write Period:** 
   - Write to both localStorage AND AnythingLLM
   - Read from AnythingLLM, fallback to localStorage
   - Duration: 2 weeks

2. **Offline Support:**
   - Queue operations when API unavailable
   - Sync when connection restored
   - Show "unsaved changes" indicator

3. **Conflict Resolution:**
   - AnythingLLM is source of truth
   - localStorage cache can be rebuilt from API
   - Timestamp-based conflict resolution

### Performance Considerations

1. **Caching:**
   - Cache workspace/thread slugs in memory
   - Debounce content sync (5 second delay)
   - Batch operations when possible

2. **Lazy Loading:**
   - Load threads on-demand (not all at once)
   - Stream chat history for large threads
   - Paginate thread lists

3. **Background Sync:**
   - Sync every 30 seconds (configurable)
   - Only sync changed documents
   - Show sync status indicator

---

## 📊 Migration Timeline

| Phase | Tasks | Duration | Status |
|-------|-------|----------|--------|
| 1. API Service | Thread methods, enhanced workspace APIs | 2 hours | 🔲 Next |
| 2. Data Model | Update interfaces, migration helpers | 1 hour | 🔲 |
| 3. Folder Ops | Create/rename/delete with API calls | 2 hours | 🔲 |
| 4. SOW Ops | Create/rename/delete with threads | 2 hours | 🔲 |
| 5. Chat Integration | Thread-specific chat UI | 3 hours | 🔲 |
| 6. Portal Update | Load from threads, not localStorage | 1 hour | 🔲 |
| 7. Migration Tool | One-time migration script | 2 hours | 🔲 |
| 8. Testing | E2E tests, edge cases | 3 hours | 🔲 |
| **Total** | | **16 hours** | **0% Complete** |

---

## 🚨 Risks & Mitigation

### Risk 1: Data Loss During Migration
**Mitigation:**
- Full localStorage backup before migration
- Dual-write period with rollback capability
- Migration dry-run with test data first

### Risk 2: API Rate Limits
**Mitigation:**
- Batch operations where possible
- Implement exponential backoff
- Queue system for failed requests

### Risk 3: Breaking Existing Features
**Mitigation:**
- Feature flags for gradual rollout
- Parallel localStorage operations during transition
- Comprehensive E2E tests

### Risk 4: AnythingLLM Downtime
**Mitigation:**
- Offline queue with retry logic
- localStorage fallback for reads
- Clear user messaging about sync status

---

## 🎯 Success Criteria

- [ ] Zero data loss during migration
- [ ] All folder operations work via API
- [ ] All SOW operations work via threads
- [ ] Chat history persists across sessions
- [ ] Portal loads from thread history
- [ ] Performance: < 2s for any operation
- [ ] Offline: Queue works, syncs on reconnect
- [ ] Multi-device: Changes sync within 30s

---

## 🚀 Quick Wins Before Full Migration

While planning full migration, implement these quick wins:

1. **Auto-sync to threads** (keep localStorage primary)
   - When SOW saved → send to thread
   - Doesn't break anything, adds functionality

2. **Thread chat in sidebar** (parallel to current chat)
   - Add "Chat in Thread" button
   - Doesn't replace current chat, just adds option

3. **Portal from threads** (with localStorage fallback)
   - Try loading from thread first
   - Fall back to localStorage if no thread

These give us 80% of benefits with 20% of risk!

---

## 📝 Next Steps

1. **Immediate:** Update `anythingllm.ts` with thread methods
2. **Short-term:** Implement auto-sync to threads (dual-write)
3. **Medium-term:** Full migration with feature flag
4. **Long-term:** Remove localStorage entirely (threads only)

---

**Last Updated:** October 15, 2025  
**Owner:** Sam (Social Garden)  
**Priority:** HIGH - Game-changer for multi-device & scalability
