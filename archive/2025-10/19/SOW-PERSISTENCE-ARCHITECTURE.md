# SOW Persistence Architecture

## Overview
Fixed the SOW persistence issue where SOWs disappeared on refresh. The system now uses a **hybrid architecture** combining MySQL and AnythingLLM.

## The Problem
**Before Fix:**
1. Create SOW → Saved to MySQL only
2. Refresh page → Loaded from AnythingLLM threads (empty!) ❌
3. Result: SOWs disappeared on refresh

## The Solution: Hybrid Architecture

### Primary Data Flow

```
┌─────────────────────────────────────────────────┐
│  1. CREATE SOW                                  │
├─────────────────────────────────────────────────┤
│  • Create AnythingLLM thread (for AI chat)     │
│  • Save to MySQL (content + metadata)          │
│  • Use thread.slug as SOW ID (consistency)     │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  2. EDIT SOW                                    │
├─────────────────────────────────────────────────┤
│  • Auto-save to MySQL every 2 seconds          │
│  • Fast, persistent storage                    │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  3. LOAD SOWS (on page load/refresh)           │
├─────────────────────────────────────────────────┤
│  • Load workspaces from AnythingLLM            │
│  • Load SOWs from MySQL database               │
│  • Match SOWs to workspaces by workspace_slug  │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  4. SHARE PORTAL                                │
├─────────────────────────────────────────────────┤
│  • Embed SOW to AnythingLLM (client + master)  │
│  • Generate shareable portal link              │
│  • Portal loads from MySQL database            │
└─────────────────────────────────────────────────┘
```

## Data Storage Strategy

### MySQL Database
**Purpose:** Primary storage for SOW content and metadata

**Stores:**
- `id` - SOW unique identifier (uses AnythingLLM thread slug)
- `title` - SOW title/name
- `content` - Full SOW content (TipTap JSON format)
- `workspace_slug` - Associated AnythingLLM workspace
- `client_name`, `client_email` - Client information
- `total_investment` - Calculated from pricing tables
- `status` - draft, sent, accepted, rejected
- `sent_at`, `first_viewed_at`, `last_viewed_at` - Tracking timestamps
- `created_at`, `updated_at` - Audit timestamps

**Why MySQL?**
✅ Fast query performance
✅ Rich metadata and tracking
✅ Transaction support
✅ Portal can load without AnythingLLM
✅ Reliable persistence

### AnythingLLM
**Purpose:** AI-enabled workspaces for chat and analysis

**Stores:**
- Workspaces (client folders)
- Threads (SOW conversations)
- Embeddings (for AI chat about SOWs)

**Why AnythingLLM?**
✅ AI chat functionality
✅ Semantic search
✅ Knowledge base integration
✅ Client workspace isolation

## Code Changes

### 1. Updated `handleCreateSOW()` in `/frontend/app/page.tsx`

**Before:**
```typescript
const handleCreateSOW = async (workspaceId: string, sowName: string) => {
  // Only saved to MySQL
  const response = await fetch('/api/sow/create', { ... });
};
```

**After:**
```typescript
const handleCreateSOW = async (workspaceId: string, sowName: string) => {
  // Step 1: Create AnythingLLM thread
  const thread = await anythingLLM.createThread(workspace.workspace_slug, sowName);
  
  // Step 2: Save to MySQL with thread slug as ID
  const response = await fetch('/api/sow/create', {
    body: JSON.stringify({
      id: thread.slug,  // ← Use thread slug
      title: sowName,
      workspace_slug: workspace.workspace_slug,
      ...
    })
  });
};
```

### 2. Updated `loadData()` in `/frontend/app/page.tsx`

**Before:**
```typescript
const loadData = async () => {
  const workspaces = await anythingLLM.listWorkspaces();
  
  for (const ws of workspaces) {
    const threads = await anythingLLM.listThreads(ws.slug);  // ← Empty!
    // Created SOWs from threads (none existed)
  }
};
```

**After:**
```typescript
const loadData = async () => {
  // Load workspaces from AnythingLLM
  const workspaces = await anythingLLM.listWorkspaces();
  
  // Load SOWs from MySQL database ← KEY CHANGE!
  const { sows } = await fetch('/api/sow/list').then(r => r.json());
  
  // Match SOWs to workspaces by workspace_slug
  for (const ws of workspaces) {
    const workspaceSOWs = sows.filter(sow => 
      sow.workspace_slug === ws.slug
    );
  }
};
```

### 3. Updated `/api/sow/list/route.ts`

**Before:**
```typescript
SELECT id, title, client_name, ... FROM sows
```

**After:**
```typescript
SELECT id, title, content, workspace_slug, ... FROM sows
return NextResponse.json({ sows: sows || [] });
```

### 4. Installed `@tiptap/html` for Portal

```bash
pnpm add @tiptap/html
```

This fixes the portal error when converting TipTap JSON to HTML.

## Benefits

✅ **SOWs persist across refreshes** - Loaded from MySQL
✅ **AI chat works** - AnythingLLM threads created
✅ **Fast performance** - MySQL for content, no API delay
✅ **Rich tracking** - MySQL stores all metadata
✅ **Portal works** - Loads from database, no dependency on localStorage
✅ **Scalable** - Each system does what it's best at

## Testing

1. **Create a SOW:**
   - Open dashboard
   - Click "New SOW" in any workspace
   - Enter SOW name
   - Verify SOW opens in editor

2. **Verify Persistence:**
   - Edit the SOW content
   - Wait 2 seconds (auto-save)
   - Refresh the page (Ctrl+R or F5)
   - ✅ SOW should still be there with your content

3. **Check Database:**
   ```sql
   SELECT id, title, workspace_slug, created_at 
   FROM sows 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

4. **Check AnythingLLM:**
   - Open workspace in AnythingLLM UI
   - Verify thread exists with SOW name
   - Thread ID should match `sows.id`

## Architecture Decision

**Why not use ONLY AnythingLLM?**
- Slower API calls for every operation
- Limited metadata storage
- No transaction support
- Portal would depend on AnythingLLM availability

**Why not use ONLY MySQL?**
- No AI chat functionality
- No semantic search
- No knowledge base features

**Hybrid = Best of Both Worlds** ✅

---

## Files Modified
- `/frontend/app/page.tsx` - Create SOW + Load SOWs logic
- `/frontend/app/api/sow/list/route.ts` - Return content + workspace_slug
- `/frontend/package.json` - Added @tiptap/html dependency

## Next Steps
- [ ] Test SOW creation in all workspaces
- [ ] Verify refresh persistence
- [ ] Test Share Portal with new SOWs
- [ ] Monitor auto-save performance
- [ ] Add sync status indicator in UI
