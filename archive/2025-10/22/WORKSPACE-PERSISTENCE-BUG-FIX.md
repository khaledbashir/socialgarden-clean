# WORKSPACE PERSISTENCE BUG - ROOT CAUSE & FIX 🐛

## The Problem
**Workspaces/folders are NOT persisting** between page refreshes.

### What You're Seeing:
- Create a new workspace → Looks good
- Refresh page → Workspace is GONE ❌

## Root Cause Analysis

### The Bug:
There's a **mismatch between how workspaces are created vs. how they're loaded**.

**When CREATING a workspace** (`handleCreateWorkspace` in page.tsx line 949):
1. Creates AnythingLLM workspace ✓
2. Saves folder to database via `POST /api/folders` ✓
3. Adds to local state ✓

**When LOADING workspaces** (useEffect in page.tsx line 434):
1. ❌ Loads from **AnythingLLM** (not database!)
2. ❌ Ignores folders table completely

### Why It's Broken:
- **Creation**: Saves to `folders` table in MySQL
- **Loading**: Reads from AnythingLLM API (which doesn't have the folders!)
- **Result**: Page refresh loses everything saved to database

## The Fix Required

### Step 1: Fix `/api/folders` Route (✅ DONE)
Updated to accept and save `workspace_slug`, `workspace_id`, `embedId`:
```typescript
// /root/the11/frontend/app/api/folders/route.ts
export async function POST(request: NextRequest) {
  const { name, workspaceSlug, workspaceId, embedId } = await request.json();
  await query(
    'INSERT INTO folders (id, name, workspace_slug, workspace_id, embed_id) VALUES (?, ?, ?, ?, ?)',
    [folderId, name, workspaceSlug || null, workspaceId || null, embedId || null]
  );
  return NextResponse.json({ id: folderId, name, workspaceSlug, workspaceId, embedId });
}
```

### Step 2: Fix Loading Logic in page.tsx (⚠️ NEEDS MANUAL FIX)
**File**: `/root/the11/frontend/app/page.tsx`
**Line**: ~434-548 (the `useEffect` with `loadData`)

**Change FROM** (Loading from AnythingLLM):
```typescript
const anythingllmWorkspaces = await anythingLLM.listWorkspaces();
for (const ws of anythingllmWorkspaces) {
  const workspaceSOWs = dbSOWs.filter((sow: any) => 
    sow.workspace_slug === ws.slug || !sow.workspace_slug
  );
  // ...
}
```

**Change TO** (Loading from database):
```typescript
const foldersResponse = await fetch('/api/folders');
const foldersData = await foldersResponse.json();
for (const folder of foldersData) {
  const folderSOWs = dbSOWs.filter((sow: any) => sow.folder_id === folder.id);
  // ...
}
```

### Complete Replacement Needed:

**Replace lines 445-547 in `/root/the11/frontend/app/page.tsx` with:**

```typescript
        // ✅ LOAD FOLDERS FROM DATABASE
        const foldersResponse = await fetch('/api/folders');
        const foldersData = await foldersResponse.json();
        console.log('✅ Loaded folders from database:', foldersData.length);
        
        // ✅ LOAD SOWS FROM DATABASE
        const sowsResponse = await fetch('/api/sow/list');
        const { sows: dbSOWs } = await sowsResponse.json();
        console.log('✅ Loaded SOWs from database:', dbSOWs.length);
        
        const workspacesWithSOWs: Workspace[] = [];
        const documentsFromDB: Document[] = [];
        const foldersFromDB: Folder[] = [];
        
        // Create workspace objects with SOWs from database
        for (const folder of foldersData) {
          console.log(`📁 Processing folder: ${folder.name} (ID: ${folder.id})`);
          
          // Find SOWs that belong to this folder
          const folderSOWs = dbSOWs.filter((sow: any) => sow.folder_id === folder.id);
          
          const sows: SOW[] = folderSOWs.map((sow: any) => ({
            id: sow.id,
            name: sow.title || 'Untitled SOW',
            workspaceId: folder.id,
          }));
          
          console.log(`   ✅ Found ${sows.length} SOWs in this folder`);
          
          // Add to workspaces array
          workspacesWithSOWs.push({
            id: folder.id,
            name: folder.name,
            sows: sows,
            workspace_slug: folder.workspace_slug,
          });
          
          // Add to folders array
          foldersFromDB.push({
            id: folder.id,
            name: folder.name,
            workspaceSlug: folder.workspace_slug,
            workspaceId: folder.workspace_id,
            embedId: folder.embed_id,
            syncedAt: folder.updated_at || folder.created_at,
          });
          
          // Create document objects for each SOW from database
          for (const sow of folderSOWs) {
            // Parse content if it's a JSON string, otherwise use as-is
            let parsedContent = defaultEditorContent;
            if (sow.content) {
              try {
                parsedContent = typeof sow.content === 'string' 
                  ? JSON.parse(sow.content) 
                  : sow.content;
              } catch (e) {
                console.warn('⚠️ Failed to parse SOW content:', sow.id);
                parsedContent = defaultEditorContent;
              }
            }
            
            documentsFromDB.push({
              id: sow.id,
              title: sow.title || 'Untitled SOW',
              content: parsedContent,
              folderId: folder.id,
              workspaceSlug: folder.workspace_slug,
              syncedAt: sow.updated_at,
            });
          }
        }
        
        console.log('✅ Total workspaces loaded:', workspacesWithSOWs.length);
        console.log('✅ Total SOWs loaded:', documentsFromDB.length);
        
        // Update state
        setWorkspaces(workspacesWithSOWs);
        setFolders(foldersFromDB);
        setDocuments(documentsFromDB);
```

## Files Modified

1. ✅ `/root/the11/frontend/app/api/folders/route.ts` - Fixed to save workspace mappings
2. ⚠️ `/root/the11/frontend/app/page.tsx` - NEEDS MANUAL FIX (lines 445-547)

## After the Fix

Once both changes are made:
1. Create workspace → Saves to database ✓
2. Refresh page → Loads from database ✓
3. Workspaces persist! ✓

## Testing Steps

1. Make the page.tsx fix manually
2. Rebuild: `npm run build`
3. Restart: `pm2 restart sow-frontend --update-env`
4. Create a workspace
5. Refresh the page
6. Workspace should still be there! ✓

## Current Status

- ✅ API fix deployed
- ⚠️ Page.tsx loading logic needs manual fix
- 🔄 Build ready after manual fix
