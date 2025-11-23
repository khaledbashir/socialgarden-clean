# 🗑️ Multi-Select Workspace Deletion - Visual Guide

## UI States

### Normal Mode (Default View)
```
┌─────────────────────────────────────────────┐
│  WORKSPACES  [🗑️]  [➕]                      │  ← Click 🗑️ to enter delete mode
├─────────────────────────────────────────────┤
│                                             │
│ CLIENT WORKSPACES (3)                      │
│ ├─ ✋ ▼ Client A          [➕][✏️][🗑️]   │
│ ├─ ✋ ▼ Project Phoenix   [➕][✏️][🗑️]   │
│ └─ ☝️ ▶ Marketing Agency [➕][✏️][🗑️]   │
│                                             │
│ AI AGENTS                                   │
│ ├─ 🎯 Gen The Architect  🔒 Protected      │  ← Protected (cannot delete)
│ ├─ 📧 Ad Copy Machine    🔒 Protected      │
│ └─ 📝 Case Study Crafter 🔒 Protected      │
│                                             │
│ SYSTEM TOOLS                                │
│ ├─ 📊 Master Dashboard   🔒 Protected      │  ← System workspaces protected
│ └─ 🔧 SQL Tools          🔒 Protected      │
│                                             │
└─────────────────────────────────────────────┘

Legend:
  ✋ = Grip handle (drag to reorder)
  ▼ = Expanded (click to collapse)
  ▶ = Collapsed (click to expand)
  [➕] = Add new SOW/document
  [✏️] = Rename workspace
  [🗑️] = Delete single workspace
  🔒 = Protected badge
```

---

### Delete Mode (Active)
```
┌──────────────────────────────────────────────────┐
│  WORKSPACES  [←] (2 selected) [🗑️]             │  ← Back arrow to exit
├──────────────────────────────────────────────────┤
│                                                  │
│ CLIENT WORKSPACES (3)                           │
│ ├─ ☐ Client A                                  │  ← Checkbox unchecked
│ ├─ ☑ Project Phoenix   ▼                       │  ← Checkbox checked ✓
│ │   ☐ SOW #1                                   │
│ │   ☑ SOW #2                                   │  ← SOWs not selectable
│ │   ☐ SOW #3                                   │
│ └─ ☑ Marketing Agency  ▶                       │  ← Checkbox checked ✓
│                                                  │
│ AI AGENTS                                        │
│ ├─ [No checkboxes - protected]                  │
│ └─ 🎯 Gen The Architect  🔒 Protected          │
│                                                  │
│ SYSTEM TOOLS                                     │
│ ├─ [No checkboxes - protected]                  │
│ └─ 📊 Master Dashboard   🔒 Protected          │
│                                                  │
└──────────────────────────────────────────────────┘

Now you can:
  • Check boxes to select workspaces
  • Click red 🗑️ to delete selected
  • Click [←] to exit delete mode
```

---

### Confirmation Dialog
```
┌─────────────────────────────────────────────────────────┐
│ Delete 2 workspace(s)?                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ This will:                                              │
│ ✓ Delete all SOWs inside                               │
│ ✓ Delete from AnythingLLM                              │
│ ✓ Remove all chat history                              │
│ ⚠️  This cannot be undone.                             │
│                                                         │
│ Workspaces to delete:                                  │
│ • Project Phoenix                                       │
│ • Marketing Agency                                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Cancel]                          [Delete (2 selected)]│
└─────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Usage

### Step 1: Enter Delete Mode
```
1. In sidebar, look for workspace list header
2. Click red trash icon 🗑️
3. UI transforms to show checkboxes
```

**Before:**
```
WORKSPACES [🗑️] [➕]
```

**After:**
```
WORKSPACES [←] (0 selected) [🗑️]
```

---

### Step 2: Select Workspaces
```
1. Click checkbox next to workspace name
2. Checkbox shows ☑ (checked) or ☐ (unchecked)
3. Counter updates: "0 selected" → "1 selected" → "2 selected"
```

**Examples:**
```
☐ Client A           → Not selected
☑ Project Phoenix    → Selected ✓
☑ Marketing Agency   → Selected ✓
```

---

### Step 3: Bulk Delete
```
1. Click the red trash icon 🗑️ (only visible when selected > 0)
2. Review confirmation dialog
3. Read the warning
4. Click [Delete (X selected)] to confirm
```

**Result:**
- All selected workspaces deleted
- AnythingLLM workspaces deleted (cascades threads)
- Database cleaned up
- Toast notification: "✅ Workspace deleted"
- Selection cleared
- Delete mode exited (if all deleted)

---

### Step 4: Exit Delete Mode
```
1. Click back arrow [←] in header
2. Normal UI returns
3. Delete mode disabled
4. Checkboxes disappear
```

---

## Protected Workspaces

### Cannot Be Deleted
These appear with 🔒 badge and no checkboxes:

**System Workspaces:**
- 📊 Master Dashboard (all SOWs dashboard)
- 🔧 SQL Tools
- 🏠 Default Client
- 📁 General Architecture

**Gardner AI Workspaces:**
- 🎯 Gen The Architect
- 📧 Ad Copy Machine
- 📝 Case Study Crafter
- 💼 Property Marketing Pro
- 🌐 Landing Page Persuader
- 📱 CRM Communication
- 🔍 SEO Content Strategist
- 📋 Proposal Audit Specialist

### Why Protected?
- ✅ Prevents accidental system damage
- ✅ Maintains core AI functionality
- ✅ Protects dashboard integrity
- ✅ Preserves analytics data

---

## Safety Alerts

### Alert 1: Protected Workspaces Selected
```
❌ Cannot delete X protected workspace(es):
• Master Dashboard
• Gardner AI
• System workspaces

Only client workspaces can be deleted.
```
→ Selection cleared, no deletion occurs

### Alert 2: Confirmation Required
```
Delete X workspace(s)?

This will:
✓ Delete all SOWs inside
✓ Delete from AnythingLLM
✓ Remove all chat history

⚠️  This cannot be undone.
```
→ Must click [Delete (X selected)] to proceed

---

## Success Feedback

### Toast Notification (after delete)
```
✅ Workspace "Project Phoenix" deleted
```

### UI State Changes
- ✓ Workspace removed from list
- ✓ Count updated
- ✓ If current workspace deleted → switches to next available
- ✓ Delete mode exits if all deleted

---

## Common Tasks

### Delete One Workspace (Quick)
```
1. Hover over workspace
2. Click red trash icon [🗑️] (single delete)
3. Confirm dialog
4. Done ✓
```

### Delete Multiple Workspaces (Bulk)
```
1. Click trash icon 🗑️ in header (enter delete mode)
2. Check multiple workspaces
3. Click red trash 🗑️ with counter showing
4. Confirm dialog
5. Done ✓
```

### Exit Delete Mode Without Deleting
```
1. Click back arrow [←] in header
2. Delete mode closed
3. No changes made ✓
```

---

## Keyboard Shortcuts (Future)

Not yet implemented, but planned:
- `Escape` - Exit delete mode
- `Ctrl+A` - Select all (client workspaces)
- `Delete` - Bulk delete selected

---

## Troubleshooting

### Issue: No delete button appears
**Solution:** Workspaces are protected. Only client workspaces can be deleted.

### Issue: Deletion fails with error
**Solution:** Check browser console for details. Try refreshing and deleting again.

### Issue: Workspace still exists after deletion
**Solution:** Refresh page. Deletion may not have completed yet.

### Issue: Checkbox won't stay checked
**Solution:** Click and hold briefly. UI updates after selection.

---

## Performance Tips

✅ **Deleting 1-2 workspaces:** Instant  
✅ **Deleting 5+ workspaces:** Takes a few seconds (cascades to AnythingLLM)  
✅ **Deleting 10+ workspaces:** May take 10-15 seconds  

💡 **Tip:** Delete in smaller batches if deleting many workspaces

---

## Visual Hierarchy

```
Header Level
  └─ Workspaces Title + Controls
       └─ Category (CLIENT WORKSPACES)
            └─ Workspace Item
                 ├─ Checkbox (delete mode only)
                 ├─ Drag Handle
                 ├─ Toggle Arrow
                 ├─ Workspace Name
                 └─ Action Buttons
                      ├─ [➕] Add Doc
                      ├─ [✏️] Rename
                      ├─ [🗑️] Delete
                      └─ [🔒] Protected Badge
                 └─ SOWs/Documents
                      └─ Document Item
```

---

## Color Coding

- 🟢 **Green**: Active, positive actions (select, add)
- 🔵 **Blue**: Primary actions (rename)
- 🔴 **Red**: Dangerous actions (delete)
- 🟡 **Yellow**: Warnings (protected)
- ⚫ **Gray**: Neutral, disabled states

---

## Mobile/Touch Support

✅ Checkboxes work on touch devices  
✅ Buttons are large enough for touch  
✅ Swipe to scroll workspace list  
⚠️  Drag-to-reorder works but may conflict with scroll (disabled in delete mode)
