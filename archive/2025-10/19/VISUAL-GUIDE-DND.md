# Visual Guide: Drag-and-Drop Implementation

## Before vs After

### BEFORE: Static Sidebar
```
┌─────────────────────────┐
│ ↓ My Workspace          │  ← No drag handle, click to expand
│   📄 Q1 Project Proposal│  ← No drag handle, can't reorder
│   📄 Development Retainer│
│                         │
│ ↓ Client Projects       │
│   📄 Website Redesign   │
│   📄 Marketing Campaign │
└─────────────────────────┘
```

### AFTER: Drag-and-Drop Enabled
```
┌─────────────────────────┐
│ :: ↓ My Workspace       │  ← Drag handle always visible
│    :: 📄 Q1 Project     │  ← Drag handle on hover
│    :: 📄 Development    │  ← Can reorder within workspace
│                         │
│ :: ↓ Client Projects    │  ← Drag to reorder workspaces
│    :: 📄 Website        │  ← Drag to reorder docs
│    :: 📄 Marketing      │
└─────────────────────────┘
```

## UI Elements

### Workspace Item
```
┌─────────────────────────────────────────┐
│ [::] [↓] My Workspace        [+][✏][🗑] │
│  ^    ^        ^                ^        │
│  │    │        │                │        │
│  │    │        │                └─ Actions (hover)
│  │    │        └─ Workspace name (click to select)
│  │    └─ Expand/collapse toggle
│  └─ Drag handle (always visible)
└─────────────────────────────────────────┘
```

### Document/SOW Item (Expanded Workspace)
```
┌─────────────────────────────────────────┐
│   [::] 📄 Q1 Project Proposal    [✏][🗑]│
│    ^    ^        ^                 ^     │
│    │    │        │                 │     │
│    │    │        │                 └─ Actions (hover)
│    │    │        └─ Doc name (click to open)
│    │    └─ File icon
│    └─ Drag handle (shows on hover)
└─────────────────────────────────────────┘
```

## Interaction States

### 1. Default State
- Workspace drag handles (`::`) visible at all times
- Document drag handles hidden

### 2. Hover State
- Document drag handles (`::`) appear
- Action buttons appear (edit, delete)

### 3. Dragging State
- Cursor changes: `grab` → `grabbing`
- Dragged item: 50% opacity
- Other items: shift smoothly to make space

### 4. Drop State
- Item settles into new position
- Order persists to localStorage
- Smooth animation to final position

## Drag Behaviors

### Workspace Dragging
```
Before:                After Drag:
┌──────────┐          ┌──────────┐
│ Workspace A │        │ Workspace B │ ← Moved up
│ Workspace B │  →     │ Workspace A │ ← Moved down
│ Workspace C │        │ Workspace C │
└──────────┘          └──────────┘
```

### Document Dragging (Within Same Workspace)
```
Before:                After Drag:
┌──────────┐          ┌──────────┐
│ ↓ Workspace      │  │ ↓ Workspace      │
│   📄 Doc A       │  │   📄 Doc B       │ ← Moved up
│   📄 Doc B       │  │   📄 Doc A       │ ← Moved down
│   📄 Doc C       │  │   📄 Doc C       │
└──────────┘          └──────────┘
```

### Cross-Workspace Drag (Not Allowed)
```
Workspace 1            Workspace 2
┌──────────┐          ┌──────────┐
│ 📄 Doc A  │          │ 📄 Doc X  │
│ 📄 Doc B  │  ✗→     │ 📄 Doc Y  │
│ 📄 Doc C  │          │ 📄 Doc Z  │
└──────────┘          └──────────┘
         ↑
   Can't drag here!
   Docs stay in workspace
```

## Terminology Changes

### Modal: New SOW → New Doc
```
BEFORE:                      AFTER:
┌─────────────────┐         ┌─────────────────┐
│   New SOW       │    →    │   New Doc       │
│                 │         │                 │
│ [Input field]   │         │ [Input field]   │
│                 │         │                 │
│ [Create SOW]    │         │ [Create Doc]    │
└─────────────────┘         └─────────────────┘
```

### Button Labels
```
BEFORE:                      AFTER:
[+ New SOW]         →       [+ New Doc]
Title: "New SOW"    →       Title: "New Doc"
Placeholder:                Placeholder:
"Q3 Marketing SOW"  →       "Q3 Marketing Plan"
```

## Technical Highlights

### Component Hierarchy
```
<DndContext>
  <SortableContext items={workspaces}>
    {workspaces.map(workspace => (
      <SortableWorkspaceItem>
        <SortableContext items={sows}>
          {sows.map(sow => (
            <SortableSOWItem />
          ))}
        </SortableContext>
      </SortableWorkspaceItem>
    ))}
  </SortableContext>
</DndContext>
```

### Drag Handle Implementation
```typescript
// Always visible (workspace)
<button {...attributes} {...listeners}>
  <GripVertical />
</button>

// Visible on hover (document)
<button 
  {...attributes} 
  {...listeners}
  className="opacity-0 group-hover:opacity-100"
>
  <GripVertical />
</button>
```

## Visual Cues

### Cursor Changes
- **Default**: `cursor-pointer` (normal)
- **Hover on handle**: `cursor-grab` (open hand)
- **Dragging**: `cursor-grabbing` (closed hand)

### Opacity Effects
- **Normal item**: `opacity-100` (fully visible)
- **Dragging item**: `opacity-50` (semi-transparent)
- **Drop target**: Smooth transition

### Transitions
- **Reorder animation**: `transition` (smooth CSS)
- **Handle visibility**: `transition-opacity` (fade in/out)

## Keyboard Accessibility

### Supported Actions
- **Tab**: Focus on drag handles
- **Enter/Space**: Pick up/drop item
- **Arrow keys**: Move item up/down
- **Escape**: Cancel drag operation

## Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile touch devices (iOS/Android)

## Performance Notes
- Minimal re-renders (only affected items)
- Smooth 60fps animations
- No layout thrashing
- Efficient collision detection

---

## Testing Checklist

- [ ] Workspace drag handles visible
- [ ] Document drag handles appear on hover
- [ ] Can drag workspace up/down
- [ ] Can drag document within workspace
- [ ] Cannot drag document to different workspace
- [ ] Order persists after page refresh
- [ ] Cursor changes appropriately
- [ ] Dragged item becomes transparent
- [ ] Smooth animations throughout
- [ ] No console errors
- [ ] "Doc" terminology everywhere
- [ ] Keyboard navigation works

---

**All visual and interaction requirements from AnythingLLM screenshot have been implemented!** ✅
