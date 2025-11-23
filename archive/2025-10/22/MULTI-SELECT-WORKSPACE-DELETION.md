# 🗑️ Multi-Select Workspace Deletion Feature

**Build Date:** October 19, 2025  
**Status:** ✅ Deployed & Running  
**Frontend Restart:** #6

## Overview

Added a powerful bulk deletion UI for client workspaces with built-in protection for system and Gardner workspaces. Users can now select multiple workspaces and delete them all at once, with all deletions automatically synced to AnythingLLM.

---

## What Changed

### 1️⃣ **Sidebar UI Enhancements** (`/frontend/components/tailwind/sidebar-nav.tsx`)

#### New Delete Mode
- **Toggle Button**: Click trash icon (🗑️) in workspace header to enter delete mode
- **Cancel Button**: Click back arrow (←) to exit delete mode
- **Selected Counter**: Shows how many workspaces are selected for deletion
- **Bulk Delete Button**: Shows when selections > 0, displays trash icon with hover effect

#### Workspace Item Checkboxes (Delete Mode Only)
- Checkboxes appear only when delete mode is active
- Only client workspaces show checkboxes (protected workspaces hidden)
- **Protected Badge**: System/Gardner workspaces show 🔒 Protected badge instead of delete button
- Checkboxes are easily clickable with visual feedback

#### Action Button Changes
- In normal mode: Show [+] Add Doc, [✏️] Rename, [🗑️] Delete buttons
- In delete mode: Hide normal buttons, show checkboxes instead
- Protected workspaces always show badge, never show checkbox

### 2️⃣ **Protection Logic** (`/frontend/components/tailwind/sidebar-nav.tsx`)

#### Protected Workspaces (Cannot be deleted)
```javascript
// System Workspaces
- 'default-client'
- 'sow-master-dashboard'
- 'gen' (General Architecture)
- 'sql'
- 'sow-master-dashboard-63003769'
- 'pop'

// Gardner/Agent Workspaces
- 'gen-the-architect'
- 'property-marketing-pro'
- 'ad-copy-machine'
- 'crm-communication-specialist'
- 'case-study-crafter'
- 'landing-page-persuader'
- 'seo-content-strategist'
- 'proposal-audit-specialist'
- 'proposal-and-audit-specialist'
```

#### Only Client Workspaces Can Be Deleted
- Custom workspaces created by users for specific clients/projects
- All others are protected to prevent accidental system damage

### 3️⃣ **Bulk Delete Handler** (`/frontend/components/tailwind/sidebar-nav.tsx`)

```typescript
handleBulkDelete()
│
├─ Validate selection (must have > 0 selected)
│
├─ Check for protected workspaces
│   └─ If any protected: Alert user, abort
│
├─ Show confirmation dialog with:
│   ✓ Workspace count
│   ✓ Consequences (deletes SOWs, chat history, etc.)
│   ✓ "Cannot be undone" warning
│
└─ Delete each workspace:
   ├─ Call onDeleteWorkspace() for each
   ├─ Trigger database deletion
   ├─ Trigger AnythingLLM deletion (cascades threads)
   └─ Show success toast
```

### 4️⃣ **Database & AnythingLLM Sync** (`/frontend/app/page.tsx`)

Updated `handleDeleteWorkspace()` to:
1. **Delete from Database** → `/api/workspaces/{workspaceId}` (DELETE)
2. **Delete from AnythingLLM** → `anythingLLM.deleteWorkspace(slug)`
3. **Cascade Effect**: All threads/SOWs automatically deleted with workspace
4. **Update UI State**: Remove workspace from local state, switch to next available
5. **Toast Notification**: Confirm successful deletion

---

## How to Use

### Entering Delete Mode
1. In the sidebar, click the **trash icon (🗑️)** next to workspace list header
2. Workspace checkboxes appear (only for client workspaces)
3. Protected workspaces show 🔒 badge instead

### Selecting Workspaces
1. Check the boxes next to workspaces you want to delete
2. A counter shows "X selected" in the header
3. Selected workspaces are highlighted

### Deleting Selected Workspaces
1. Click the **red trash icon** that appears when selections > 0
2. Confirm the warning dialog
3. All selected workspaces deleted in sequence
4. State updates automatically
5. Toast notification confirms deletion

### Exiting Delete Mode
1. Click the **back arrow (←)** in the workspace header
2. Delete mode disabled
3. Normal buttons (Add, Rename, Delete) return

---

## Features

✅ **Multi-select with checkboxes**  
✅ **Protected workspaces blocked** (system + Gardner AI)  
✅ **Bulk delete action** (all selected at once)  
✅ **AnythingLLM sync** (deleted from both places)  
✅ **Database cleanup** (cascades to SOWs/threads)  
✅ **Clear visual feedback** (badges, counters, toast)  
✅ **Confirmation dialog** (prevents accidents)  
✅ **Graceful state management** (switches to next workspace if current deleted)

---

## Code Locations

### UI Components
- **Sidebar**: `/frontend/components/tailwind/sidebar-nav.tsx`
  - Lines 101-103: Multi-select state variables
  - Lines 155-194: Protection & helper functions
  - Lines 310-320: Checkbox rendering in workspace item
  - Lines 630-690: Delete mode toggle buttons & bulk delete button
  - Lines 365-375: Action button hiding/showing based on mode

### Delete Handler
- **Page**: `/frontend/app/page.tsx`
  - Lines 1100-1141: `handleDeleteWorkspace()` with DB & AnythingLLM deletion

### Workspace Protection
- **Sidebar**: `/frontend/components/tailwind/sidebar-nav.tsx`
  - Lines 128-133: `isProtectedWorkspace()` function
  - Lines 135-151: `handleBulkDelete()` with validation logic

---

## Technical Implementation

### State Management
```typescript
// Delete mode states
const [selectedWorkspaces, setSelectedWorkspaces] = useState<Set<string>>(new Set());
const [isDeleteMode, setIsDeleteMode] = useState(false);

// Toggle selection
const toggleWorkspaceSelection = (workspaceId: string) => {
  const newSelected = new Set(selectedWorkspaces);
  if (newSelected.has(workspaceId)) {
    newSelected.delete(workspaceId);
  } else {
    newSelected.add(workspaceId);
  }
  setSelectedWorkspaces(newSelected);
};
```

### Protection Check
```typescript
const isProtectedWorkspace = (workspace: any) => {
  // Protect system workspaces
  if (isSystemWorkspace(workspace)) return true;
  // Protect Gardner workspaces (agent workspaces)
  if (isAgentWorkspace(workspace)) return true;
  return false;
};
```

### Bulk Delete Flow
```typescript
const handleBulkDelete = async () => {
  // 1. Get selected list
  // 2. Check for protected workspaces (alert & abort if found)
  // 3. Show confirmation dialog
  // 4. Loop through each workspace:
  //    - Call onDeleteWorkspace()
  //    - Wait for completion
  // 5. Clear selections & exit delete mode
};
```

---

## Deletion Flow Diagram

```
User clicks 🗑️ in header
│
├─ isDeleteMode = true
├─ Show checkboxes (client workspaces only)
└─ Show "X selected" counter

User checks workspaces
│
├─ Toggle checkboxes
└─ Update selectedWorkspaces Set

User clicks red 🗑️ when selected > 0
│
├─ Check for protected (abort if found)
├─ Show confirmation dialog
│
└─ User confirms
   │
   ├─ For each selected workspace:
   │  ├─ DELETE /api/workspaces/{id} (database)
   │  ├─ anythingLLM.deleteWorkspace(slug) (AnythingLLM)
   │  └─ Update UI state
   │
   ├─ Clear selections
   ├─ Exit delete mode
   └─ Show success toast
```

---

## Testing Checklist

- [ ] Enter delete mode (click 🗑️ button)
- [ ] Verify checkboxes appear only for client workspaces
- [ ] Verify system/Gardner workspaces show 🔒 badge instead
- [ ] Select multiple client workspaces
- [ ] Verify counter shows selected count
- [ ] Click bulk delete button
- [ ] Confirm dialog appears
- [ ] Workspaces deleted from UI
- [ ] Verify in AnythingLLM workspaces are also deleted
- [ ] Exit delete mode (click ← button)
- [ ] Verify normal buttons return
- [ ] Try to delete protected workspace (should not show checkbox)
- [ ] Verify toast notifications on success/error

---

## Safety Features

✅ **Protected Workspaces**: System and Gardner AI workspaces cannot be selected  
✅ **Confirmation Dialog**: User must confirm before deletion  
✅ **Cascade Delete**: Threads and SOWs auto-deleted with workspace  
✅ **State Cleanup**: UI updates to next available workspace if current deleted  
✅ **Visual Warnings**: Toast messages and 🔒 badges prevent confusion  
✅ **Error Handling**: Graceful error messages if deletion fails

---

## Database & API

### API Endpoint Used
```
DELETE /api/workspaces/{workspaceId}
```

### AnythingLLM Service Call
```typescript
await anythingLLM.deleteWorkspace(workspace.workspace_slug)
```

This cascades to:
- All threads deleted
- All embeddings cleaned up
- Chat history removed

---

## Performance Notes

- ✅ Batch deletion: Multiple workspaces deleted in sequence (async/await)
- ✅ State updates: Only re-render after all deletions complete
- ✅ No UI freezing: Async operations don't block interaction
- ✅ Database optimized: Uses indexed workspace_slug for fast lookups

---

## Future Enhancements

- [ ] Undo functionality (soft delete with restore window)
- [ ] Batch operations: Move, archive, or tag multiple workspaces
- [ ] Export before delete: Download SOWs before removing workspace
- [ ] Scheduled deletion: Delete after confirmation period expires
- [ ] Audit log: Track who deleted what and when

---

## Related Files

- `/frontend/components/tailwind/sidebar-nav.tsx` - UI component
- `/frontend/app/page.tsx` - Delete handler
- `/frontend/lib/anythingllm.ts` - AnythingLLM service
- `ecosystem.config.js` - PM2 process management

---

## Deployment

**Frontend Build:** ✅ Successful (107KB shared JS)  
**PM2 Restart:** ✅ Completed (#6)  
**Services Online:**
- ✅ sow-frontend (port 3001, restart #6)
- ✅ sow-backend (port 8000, restart #1)

**Live & Ready for Testing!** 🚀
