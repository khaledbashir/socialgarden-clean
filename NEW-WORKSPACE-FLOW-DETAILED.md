# New Workspace Creation Flow - Complete Step-by-Step Process

## When User Clicks "New Workspace"

### 1. **UI Trigger**
- User clicks "New Workspace" button in sidebar
- Progress modal appears: "Creating workspace '[name]'"
- Shows 4-step progress indicator (Step 0/1/2/3)

### 2. **STEP 1: Create AnythingLLM Workspace** 
```typescript
const workspace = await anythingLLM.getMasterSOWWorkspace(workspaceName);
const embedId = await anythingLLM.getOrCreateEmbedId(workspace.slug);
```
- Creates workspace in AnythingLLM platform
- Gets unique embed ID for chat functionality
- Progress: Step 0 → Completed

### 3. **STEP 1b: Configure SOW Workspace Prompt**
```typescript
const configured = await anythingLLM.setWorkspacePrompt(workspace.slug, workspaceName, true);
```
- Applies "The Architect" AI prompt to workspace
- Enables SOW generation with pricing logic
- Progress: Step 1 → Completed

### 4. **STEP 2: Save Folder to Database**
```typescript
const folderResponse = await fetch('/api/folders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    name: workspaceName,
    workspaceSlug: workspace.slug,
    workspaceId: workspace.id,
    embedId: embedId,
  }),
});
```
- Creates folder record in MySQL `folders` table
- Links database folder to AnythingLLM workspace
- Progress: Step 2 → Completed

### 5. **STEP 3: Create Default SOW + Thread**
```typescript
// Create SOW in database
const sowResponse = await fetch('/api/sow/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: `New SOW for ${workspaceName}`,
    content: defaultEditorContent,
    folderId: folderId,
  }),
});

// Create AnythingLLM thread
const thread = await anythingLLM.createThread(workspace.slug);

// Update SOW with thread info
await fetch(`/api/sow/${sowId}`, {
  method: 'PUT',
  body: JSON.stringify({
    threadSlug: thread.slug,
    workspaceSlug: workspace.slug,
  }),
});
```
- Auto-creates blank SOW titled "New SOW for [workspace]"
- Saves to MySQL `sows` table
- Creates thread in AnythingLLM workspace for AI chat
- Progress: Step 3 → Completed

### 6. **STEP 4: Embed SOW in Both Workspaces**
```typescript
await anythingLLM.embedSOWInBothWorkspaces(workspace.slug, sowTitle, sowContent);
```
- Embeds empty SOW in client workspace
- Embeds empty SOW in master dashboard
- Enables AI to reference SOW content in chat

### 7. **State Updates**
```typescript
// Update frontend state
setWorkspaces(prev => [newWorkspace, ...prev]);
setCurrentWorkspaceId(folderId);
setCurrentSOWId(sowId);

// Update UI state
setViewMode('editor');
setCurrentDocId(sowId);
```
- Adds workspace to local state (appears in sidebar)
- Sets as current workspace
- Auto-selects the new SOW
- Switches to editor view
- Loads editor with empty content

### 8. **Success Notifications**
```typescript
toast.success(`✅ Workspace "${workspaceName}" created with AnythingLLM integration!`);
toast.success(`✅ Created workspace "${workspaceName}" with blank SOW ready to edit!`);
```
- Closes progress modal after 500ms delay
- Auto-selects new SOW in editor
- Clear chat for fresh start

## End Result
- **New folder** appears in sidebar with workspace name
- **New empty SOW** created and automatically opened
- **Editor view** active with blank TipTap document
- **AI chat** ready with The Architect available
- **AnythingLLM workspace** configured for SOW generation
- **Database records** created linking everything together

## Time to Complete
~3-5 seconds total from click to ready-to-edit state

## Error Handling
- If AnythingLLM creation fails → Error toast, no folder created
- If database save fails → Error toast, rollback workspace
- If any step fails → Progress modal closes with error state
