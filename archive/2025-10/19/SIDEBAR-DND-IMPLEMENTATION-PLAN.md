# Sidebar Drag-and-Drop Implementation Plan

## Current Status ✅
- All 8 Gardners now showing in agent dropdown
- Workspace clicking works
- Rate limit issue noted (will clear)

## Requirements from Screenshot

### 1. Sidebar Structure (Like AnythingLLM)
```
┌─────────────────────────────┐
│ 🔍 Search                   │
├─────────────────────────────┤
│ Workspaces            [+]   │  ← Single "Create Workspace" button
├─────────────────────────────┤
│ :: Workspace 1        [Doc] │  ← Draggable workspace with "New Doc" button
│   ↓                          │
│   📄 Doc 1                   │  ← Draggable doc/SOW
│   📄 Doc 2                   │  ← Draggable doc/SOW
│                              │
│ :: Workspace 2        [Doc] │  ← Draggable workspace
│   ↓                          │
│   📄 Doc 1                   │
│                              │
│ :: Workspace 3        [Doc] │
└─────────────────────────────┘
```

### 2. Functionality Needed

#### A. Workspace Features
- [x] Single "Create Workspace" button at top
- [x] Click workspace → auto-creates first doc → opens editor
- [ ] Each workspace has "New Doc" button (not "New SOW")
- [ ] Workspaces are **drag-and-drop reorderable**
- [ ] Workspace drag handle (:: icon)

#### B. Doc/SOW Features  
- [ ] Rename from "SOW" to "Doc" throughout UI
- [ ] Docs within workspace are **drag-and-drop reorderable**
- [ ] Doc drag handle or full-row draggable

#### C. UX Flow
1. Click "Create Workspace" → Enter name → Press Enter
2. **Auto-creates** first doc named "default" or "Untitled Doc"
3. **Auto-opens** editor with that doc
4. User chats with AI, says "create SOW for X"
5. User clicks "Insert to Editor"
6. Content appears in currently open doc

### 3. Terminology Changes
- ❌ "New SOW" → ✅ "New Doc"
- ❌ "SOW" → ✅ "Doc" (in most places)
- Keep "SOW" in backend/database (sows table)
- Frontend displays as "Doc" for consistency with AnythingLLM "threads"

## Implementation Steps

### Step 1: Install Dependencies ✅
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Step 2: Update Sidebar Component
File: `/root/the11/frontend/components/tailwind/sidebar-nav.tsx`

**Changes needed:**
1. Import dnd-kit components
2. Wrap workspace list with `DndContext`
3. Add `SortableContext` for workspaces
4. Add drag handles (:: icon) to each workspace
5. Implement `handleDragEnd` for workspace reordering
6. Add nested `SortableContext` for docs within each workspace
7. Change "New SOW" button text to "New Doc"

### Step 3: Add Workspace/Doc Order to Database
Currently, workspaces and SOWs don't have an `order` or `position` field.

**Option A: Add order column**
```sql
ALTER TABLE folders ADD COLUMN display_order INT DEFAULT 0;
ALTER TABLE sows ADD COLUMN display_order INT DEFAULT 0;
```

**Option B: Use client-side state only**
- Store order in localStorage
- Simpler, no DB changes needed
- Order resets if localStorage cleared

**Recommendation:** Option B for MVP, can add DB persistence later

### Step 4: Update Terminology
Files to update:
- `sidebar-nav.tsx` - "New SOW" → "New Doc"
- `new-sow-modal.tsx` - "Create SOW" → "Create Doc"
- `page.tsx` - Display labels (keep backend as `sow`)

### Step 5: Auto-open Editor on Workspace Creation
File: `/root/the11/frontend/app/page.tsx`

Currently in `handleCreateWorkspace`:
```typescript
// Create folder
// Create default SOW
// Switch to editor mode  ← Already does this!
```

**Verify:** Check if `setViewMode('editor')` is being called

## Code Structure

### Drag-and-Drop Pattern (dnd-kit)

```typescript
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Workspace Component
function SortableWorkspace({ workspace }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: workspace.id 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle */}
      <button {...attributes} {...listeners}>
        ::
      </button>
      {/* Workspace content */}
    </div>
  );
}

// Main sidebar
function Sidebar() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setWorkspaces((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
  
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={workspaces} strategy={verticalListSortingStrategy}>
        {workspaces.map(ws => <SortableWorkspace key={ws.id} workspace={ws} />)}
      </SortableContext>
    </DndContext>
  );
}
```

## Testing Checklist

- [ ] All 8 Gardners show in dropdown
- [ ] Can drag workspaces up/down
- [ ] Can drag docs within a workspace
- [ ] Workspace order persists (localStorage)
- [ ] Doc order persists (localStorage)
- [ ] "New Doc" button appears on each workspace
- [ ] Create Workspace → auto-creates doc → auto-opens editor
- [ ] Chat → Insert to Editor works
- [ ] Terminology shows "Doc" not "SOW" in UI

## Next Steps

1. ✅ Update Gardner filtering (DONE)
2. 🔄 Implement drag-and-drop for workspaces (IN PROGRESS)
3. ⏳ Implement drag-and-drop for docs
4. ⏳ Change terminology to "Doc"
5. ⏳ Test complete flow

---

**Current File Being Edited:** `/root/the11/frontend/components/tailwind/sidebar-nav.tsx`
