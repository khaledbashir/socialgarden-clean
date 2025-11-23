# 🗑️ Workspace Deletion Architecture & Integration

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         SidebarNav Component (UI Layer)                    │ │
│  │                                                             │ │
│  │  States:                                                   │ │
│  │  • selectedWorkspaces: Set<string>                        │ │
│  │  • isDeleteMode: boolean                                  │ │
│  │                                                             │ │
│  │  Functions:                                               │ │
│  │  • toggleWorkspaceSelection()                             │ │
│  │  • handleBulkDelete()                                     │ │
│  │  • isProtectedWorkspace()                                 │ │
│  │  • isSystemWorkspace()                                    │ │
│  │  • isAgentWorkspace()                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          ↓                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │      Page Component (Business Logic Layer)                │ │
│  │                                                             │ │
│  │  handleDeleteWorkspace(workspaceId: string)              │ │
│  │  ├─ 1. DELETE /api/workspaces/{workspaceId}             │ │
│  │  ├─ 2. anythingLLM.deleteWorkspace(slug)                │ │
│  │  ├─ 3. Update React state                                │ │
│  │  ├─ 4. Switch to next workspace if current deleted       │ │
│  │  └─ 5. Show success toast                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
        ↓                            ↓
   ┌─────────┐              ┌────────────────┐
   │ Database │              │ AnythingLLM    │
   │ (MySQL)  │              │ (FastAPI)      │
   └─────────┘              └────────────────┘
        ↓                            ↓
   DELETE                    DELETE /v1/workspace/
   workspaces                {slug}
   WHERE id=?               │
                            ├─ Delete workspace
                            ├─ Cascade delete threads
                            ├─ Cascade delete embeddings
                            └─ Cascade delete documents
```

---

## Data Flow: Bulk Delete

### Scenario: Delete 2 Workspaces

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: User selects workspaces                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ selectedWorkspaces = Set {                                  │
│   "ws_proj_phoenix_1abc",                                   │
│   "ws_market_agency_2def"                                   │
│ }                                                            │
│                                                              │
│ UI shows: "WORKSPACES [←] (2 selected) [🗑️]"              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: User clicks bulk delete button                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ handleBulkDelete() called                                   │
│                                                              │
│ if (selectedCount === 0) → alert "No workspaces selected"  │
│ if (protectedCount > 0) → alert "Cannot delete protected"  │
│ else → showConfirmationDialog()                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Confirmation dialog                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ "Delete 2 workspace(s)?"                                    │
│                                                              │
│ • Project Phoenix                                           │
│ • Marketing Agency                                          │
│                                                              │
│ This will:                                                  │
│ ✓ Delete all SOWs inside                                   │
│ ✓ Delete from AnythingLLM                                  │
│ ✓ Remove all chat history                                  │
│ ⚠️  This cannot be undone.                                 │
│                                                              │
│ [Cancel]  [Delete (2 selected)]                            │
│                                                              │
│ User clicks → [Delete (2 selected)]                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Delete workspace 1 (Project Phoenix)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ handleDeleteWorkspace("ws_proj_phoenix_1abc")              │
│ │                                                            │
│ ├─→ fetch DELETE /api/workspaces/ws_proj_phoenix_1abc      │
│ │   └─→ Database: DELETE FROM workspaces WHERE id=...      │
│ │                                                            │
│ ├─→ await anythingLLM.deleteWorkspace("proj-phoenix")      │
│ │   ├─ DELETE /api/v1/workspace/proj-phoenix               │
│ │   ├─ Deletes workspace in AnythingLLM                   │
│ │   ├─ Cascades: delete threads                            │
│ │   ├─ Cascades: delete embeddings                         │
│ │   └─ Cascades: delete documents                          │
│ │                                                            │
│ ├─→ setWorkspaces(prev => prev.filter(w => ...))           │
│ │   └─ Update React state (removed from list)              │
│ │                                                            │
│ └─→ toast.success("✅ Workspace deleted")                  │
│                                                              │
│ Wait for completion...                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Delete workspace 2 (Marketing Agency)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Same as Step 4 for second workspace]                       │
│ → toast.success("✅ Workspace deleted")                    │
│                                                              │
│ Wait for completion...                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Cleanup                                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ setSelectedWorkspaces(new Set())  // Clear selections       │
│ setIsDeleteMode(false)             // Exit delete mode     │
│                                                              │
│ UI returns to normal view with both workspaces removed ✓   │
│                                                              │
│ WORKSPACES [🗑️] [➕]                                      │
│ ├─ ✋ ▼ Client A          [➕][✏️][🗑️]                   │
│ ├─ ☝️ ▶ Other Workspace   [➕][✏️][🗑️]                   │
│ └─ [No more Project Phoenix or Marketing Agency]          │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
Page (app/page.tsx)
├─ useState: workspaces[]
├─ useState: currentWorkspaceId
│
├─ handleDeleteWorkspace()  ← Entry point for delete
│  ├─ fetch DELETE /api/workspaces/{id}
│  ├─ await anythingLLM.deleteWorkspace(slug)
│  ├─ setWorkspaces(filtered)
│  └─ toast success/error
│
└─ SidebarNav (components/tailwind/sidebar-nav.tsx)
   ├─ useState: selectedWorkspaces Set<string>
   ├─ useState: isDeleteMode boolean
   │
   ├─ isProtectedWorkspace()
   │  ├─ isSystemWorkspace()  ← Check system workspaces
   │  └─ isAgentWorkspace()   ← Check Gardner AI workspaces
   │
   ├─ toggleWorkspaceSelection(workspaceId)
   │  └─ Update selectedWorkspaces Set
   │
   ├─ handleBulkDelete()  ← Validates & calls parent handler
   │  ├─ Check selectedCount > 0
   │  ├─ Check protectedCount === 0
   │  ├─ Show confirmation
   │  ├─ Loop: onDeleteWorkspace(id) for each
   │  ├─ Clear selections
   │  └─ Exit delete mode
   │
   ├─ Header (Delete Mode Toggle)
   │  ├─ Normal: [🗑️] toggle button + [➕] new button
   │  └─ Delete: [←] back button + (X selected) + [🗑️] bulk delete
   │
   └─ SortableWorkspaceItem
      ├─ Checkbox (delete mode only, if not protected)
      ├─ Drag handle, toggle arrow
      ├─ Workspace name
      │
      └─ Action Buttons (normal mode only)
         ├─ [➕] Add SOW → onCreateSOW()
         ├─ [✏️] Rename → onRenameWorkspace()
         ├─ [🗑️] Single Delete → onDeleteWorkspace()
         └─ [🔒] Protected Badge (if protected)
```

---

## File Modifications Summary

### `/frontend/components/tailwind/sidebar-nav.tsx`

**Added:**
- Lines 101-103: State for delete mode
```typescript
const [selectedWorkspaces, setSelectedWorkspaces] = useState<Set<string>>(new Set());
const [isDeleteMode, setIsDeleteMode] = useState(false);
```

- Lines 128-133: Protection check function
```typescript
const isProtectedWorkspace = (workspace: any) => {
  if (isSystemWorkspace(workspace)) return true;
  if (isAgentWorkspace(workspace)) return true;
  return false;
};
```

- Lines 135-151: Bulk delete handler
```typescript
const handleBulkDelete = async () => {
  // Validation, confirmation, deletion logic
};
```

- Lines 155-194: Workspace selection toggle
```typescript
const toggleWorkspaceSelection = (workspaceId: string) => {
  // Add/remove from Set
};
```

- Lines 310-320: Checkbox in workspace item (delete mode only)
```tsx
{isDeleteMode && !isProtectedWorkspace(workspace) && (
  <input type="checkbox" ... />
)}
```

- Lines 365-375: Action buttons conditional rendering
```tsx
{!isDeleteMode && (
  <>
    {/* Add, Rename, Delete buttons */}
  </>
)}
{isProtectedWorkspace(workspace) && (
  <div>🔒 Protected</div>
)}
```

- Lines 630-690: Delete mode toggle buttons
```tsx
{!isDeleteMode ? (
  <>
    {/* Normal mode buttons */}
  </>
) : (
  <>
    {/* Delete mode buttons */}
  </>
)}
```

### `/frontend/app/page.tsx`

**Modified:**
- Lines 1100-1141: Updated `handleDeleteWorkspace()`
```typescript
const handleDeleteWorkspace = async (workspaceId: string) => {
  try {
    // Get workspace
    // DELETE from database
    // DELETE from AnythingLLM
    // Update state
    // Show toast
  } catch (error) {
    // Error handling
  }
};
```

**Key Changes:**
- Now async (was sync)
- Calls database delete
- Calls AnythingLLM delete
- Proper error handling
- Toast notifications

---

## API Integration

### Database API

```typescript
// Delete workspace from database
fetch(`/api/workspaces/${workspaceId}`, {
  method: 'DELETE',
})
```

Expected Response:
```json
{
  "success": true,
  "message": "Workspace deleted"
}
```

### AnythingLLM API

```typescript
// Delete workspace and cascade threads
await anythingLLM.deleteWorkspace(workspaceSlug)
```

Internally calls:
```
DELETE /api/v1/workspace/{slug}
Authorization: Bearer {API_KEY}
```

Cascade Effects:
- Workspace deleted
- All threads deleted
- All embeddings removed
- Chat history cleared

---

## State Management Flow

```
┌──────────────────────────────────────┐
│ Parent: Page.tsx                     │
│                                       │
│ State:                               │
│ • workspaces: Workspace[]            │
│ • currentWorkspaceId: string         │
│ • currentSOWId: string | null        │
└──────────────────────────────────────┘
         ↓ pass down
┌──────────────────────────────────────┐
│ Child: SidebarNav.tsx                │
│                                       │
│ State:                               │
│ • selectedWorkspaces: Set<string>    │
│ • isDeleteMode: boolean              │
│ • renamingId: string | null          │
│ • showNewWorkspaceDialog: boolean    │
└──────────────────────────────────────┘
         ↓ call callback
┌──────────────────────────────────────┐
│ Parent Handler: handleDeleteWorkspace│
│                                       │
│ Actions:                             │
│ 1. fetch DELETE /api/workspaces/{id} │
│ 2. anythingLLM.deleteWorkspace(slug) │
│ 3. setWorkspaces(filtered)           │
│ 4. Switch workspace if needed        │
│ 5. toast.success()                   │
└──────────────────────────────────────┘
         ↓ state updated
┌──────────────────────────────────────┐
│ Child Re-renders: SidebarNav         │
│                                       │
│ Workspace removed from list ✓        │
│ Selection cleared ✓                  │
│ Delete mode exited ✓                 │
└──────────────────────────────────────┘
```

---

## Error Handling

### Scenario 1: No Workspaces Selected
```
user clicks 🗑️ bulk delete
│
├─ selectedWorkspaces.length === 0
│
└─ Alert: "No workspaces selected"
   └─ User checks boxes first
```

### Scenario 2: Protected Workspaces Selected
```
user has protected workspace checked
│
├─ protectedCount > 0
│
└─ Alert: "❌ Cannot delete X protected workspace(es):
              • Master Dashboard
              • Gardner AI
              • System workspaces"
   └─ User unchecks protected workspaces
```

### Scenario 3: Database Delete Fails
```
fetch DELETE /api/workspaces/{id}
│
├─ response.ok === false
│
└─ throw Error("Failed to delete from database")
   └─ catch: toast.error("Failed to delete workspace")
   └─ continue to next workspace (don't cascade failure)
```

### Scenario 4: AnythingLLM Delete Fails
```
anythingLLM.deleteWorkspace(slug)
│
├─ fetch throws error
│
└─ catch: console.error(error)
   └─ still mark as deleted in UI (database already deleted)
   └─ show warning toast
```

---

## Protection Mechanism

### System Workspaces (Never Deletable)
```javascript
const systemSlugs = [
  'default-client',
  'sow-master-dashboard',
  'gen',
  'sql',
  'sow-master-dashboard-63003769',
  'pop'
];
```

### Gardner/AI Workspaces (Never Deletable)
```javascript
const agentSlugs = [
  'gen-the-architect',
  'property-marketing-pro',
  'ad-copy-machine',
  'crm-communication-specialist',
  'case-study-crafter',
  'landing-page-persuader',
  'seo-content-strategist',
  'proposal-audit-specialist',
  'proposal-and-audit-specialist'
];
```

### Client Workspaces (Deletable)
```javascript
// Any workspace NOT in system or agent lists
// Examples:
// - "Client A"
// - "Project Phoenix"
// - "Marketing Agency"
// - User-created workspaces
```

---

## Performance Considerations

### Single Delete (Normal Mode)
- **Time:** ~500ms - 1s
- **DB Query:** Direct workspace delete
- **API Call:** Single AnythingLLM call
- **UI Update:** Immediate removal

### Bulk Delete (Delete Mode, 5 workspaces)
- **Time:** ~2-3 seconds total
- **Process:** Sequential deletion (not parallel)
- **DB Queries:** 5 separate DELETE queries
- **API Calls:** 5 separate AnythingLLM calls
- **UI Update:** After all complete

### Optimization Opportunities
```
Current: Sequential deletions
├─ For each workspace:
│  ├─ await fetch DELETE /api/workspaces/{id}
│  └─ await anythingLLM.deleteWorkspace(slug)

Potential: Parallel deletions
├─ Promise.all([
│  ├─ fetch DELETE /api/workspaces/{id1},
│  ├─ fetch DELETE /api/workspaces/{id2},
│  ├─ fetch DELETE /api/workspaces/{id3}
│  └─ ...
│ ])
│
└─ Note: May overload server, use with care
```

---

## Future Enhancements

### Soft Delete (Undo Within 30 Days)
```typescript
// Delete marked as "soft"
DELETE FROM workspaces 
WHERE id = ? 
UPDATE deleted_at = NOW()

// Restore within 30 days
UPDATE workspaces 
SET deleted_at = NULL 
WHERE id = ? AND deleted_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
```

### Batch Export Before Delete
```typescript
// Download SOWs as PDF/DOCX before deleting
const sowExports = await exportSOWs(workspace.sows)
downloadZip(sowExports)
// Then delete
```

### Audit Logging
```typescript
// Log every deletion
INSERT INTO audit_log (
  user_id, action, workspace_id, timestamp
) VALUES (?, 'DELETE_WORKSPACE', ?, NOW())
```

### Scheduled Deletion
```typescript
// Delete after confirmation period
UPDATE workspaces 
SET scheduled_delete_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
WHERE id = ?

// Show warning until then
if (workspace.scheduled_delete_at) {
  return <DeletionWarning daysLeft={daysUntilDelete} />
}
```

---

## Testing Coverage

### Unit Tests (Recommended)
- [ ] `isProtectedWorkspace()` returns true for system workspaces
- [ ] `isProtectedWorkspace()` returns true for Gardner workspaces
- [ ] `isProtectedWorkspace()` returns false for client workspaces
- [ ] `toggleWorkspaceSelection()` adds/removes from Set
- [ ] `handleBulkDelete()` validates selection count
- [ ] `handleBulkDelete()` prevents protected deletion

### Integration Tests (Recommended)
- [ ] Delete single workspace → removed from DB and AnythingLLM
- [ ] Delete multiple workspaces → all removed sequentially
- [ ] Delete current workspace → switches to next available
- [ ] Protected workspace → no checkbox, stays in list
- [ ] Confirmation dialog → cancel aborts deletion
- [ ] Toast notification → success/error shown

### E2E Tests (Recommended)
- [ ] Enter delete mode, select workspace, delete, exit
- [ ] Try to delete protected workspace → blocked
- [ ] Delete all client workspaces → only system remains
- [ ] Refresh page → deletion persists

---

## Deployment Checklist

- [x] Code changes implemented
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Frontend build successful
- [x] PM2 restarted (restart #6)
- [x] Both services online
- [ ] Tested in browser
- [ ] Delete mode UI works
- [ ] Checkboxes selectable
- [ ] Bulk delete functional
- [ ] Protection working
- [ ] AnythingLLM sync verified

---

## Status

✅ **Implemented:** Multi-select deletion UI  
✅ **Implemented:** Protected workspace logic  
✅ **Implemented:** Bulk delete handler  
✅ **Implemented:** AnythingLLM sync  
✅ **Built:** Frontend successful  
✅ **Deployed:** PM2 restart #6  
✅ **Online:** Both services running  

🚀 **Ready for Testing!**
