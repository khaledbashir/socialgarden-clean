# 🎨 ACCORDION FOLDER UI - IMPLEMENTATION GUIDE

## 🎯 What You Want

```
📁 Folder 1: "Demo Client Workspace"
   ├─ 📄 SOW: "HubSpot Implementation" (created Oct 15)
   ├─ 📄 SOW: "Social Media Campaign" (created Oct 14)
   └─ 📄 SOW: "Email Marketing" (created Oct 13)

📁 Folder 2: "uuuuuuuu"
   ├─ 📄 SOW: "Project A"
   └─ 📄 SOW: "Project B"

📁 Folder 3: "assistedvip"
   └─ 📄 SOW: "Custom Proposal"
```

**Features:**
- ✅ Click folder to expand/collapse
- ✅ Drag SOW between folders
- ✅ See all SOWs in accordion
- ✅ Rename folders
- ✅ Delete folders (moves SOWs up)

---

## 🛠️ How to Implement

### Option 1: Quick UI Change (2 hours)
**Use shadcn Accordion component**

```typescript
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

// In the sidebar or left panel
{folders.map(folder => (
  <AccordionItem key={folder.id} value={folder.id}>
    <AccordionTrigger>
      📁 {folder.name}
      <span className="text-xs text-gray-500">({sowsInFolder.length} SOWs)</span>
    </AccordionTrigger>
    <AccordionContent>
      {sowsInFolder.map(sow => (
        <div 
          key={sow.id}
          className="ml-4 p-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => loadSow(sow.id)}
          draggable
          onDragStart={() => setDraggedSow(sow.id)}
        >
          📄 {sow.title}
          <span className="text-xs text-gray-400">{formatDate(sow.created_at)}</span>
        </div>
      ))}
    </AccordionContent>
  </AccordionItem>
))}
```

### Option 2: Custom Component (4 hours)
**Build FolderTree component with better styling**

```typescript
// components/FolderTree.tsx
export function FolderTree({
  folders,
  sows,
  onSelectSow,
  onMoveSow,
  onDeleteFolder,
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  
  return (
    <div className="space-y-1">
      {folders.map(folder => (
        <Folder
          key={folder.id}
          folder={folder}
          sows={sows.filter(s => s.folder_id === folder.id)}
          expanded={expanded.has(folder.id)}
          onToggle={() => toggleExpanded(folder.id)}
          onSelectSow={onSelectSow}
          onMoveSow={onMoveSow}
        />
      ))}
    </div>
  );
}
```

### Option 3: Library (1 hour)
**Use react-sortable-tree for everything**

```bash
npm install react-sortable-tree react-dnd react-dnd-html5-backend
```

```typescript
import SortableTree from 'react-sortable-tree';

<SortableTree
  treeData={treeData}  // Nested folders/sows
  onChange={setTreeData}
  onMoveNode={handleMoveSow}
/>
```

---

## 📊 Data Structure for Accordion

Current (Flat):
```typescript
folders: Folder[]
documents: Document[]
```

Needed (Hierarchical):
```typescript
folders: Folder[]  // Still flat
documents: Document[]  // Still flat (has folder_id)

// In component, group by folder_id
const groupByfolderId = (docs) => {
  const grouped = {};
  docs.forEach(doc => {
    if (!grouped[doc.folder_id]) grouped[doc.folder_id] = [];
    grouped[doc.folder_id].push(doc);
  });
  return grouped;
};
```

---

## 🎯 Implementation Priority

### Phase 1: Get DB Working (Today)
- [ ] Create `/api/sow/list` endpoint ✅ DONE
- [ ] Update page.tsx to load from DB
- [ ] Update page.tsx to save to DB
- [ ] Verify SOWs show up in database

### Phase 2: Basic Accordion (Tomorrow)
- [ ] Add shadcn Accordion component
- [ ] Group SOWs by folder in UI
- [ ] Show count per folder
- [ ] Click SOW to load

### Phase 3: Drag & Drop (Later)
- [ ] Add react-beautiful-dnd or react-dnd
- [ ] Implement folder-to-folder drag
- [ ] Update folder_id in database on drop
- [ ] Animate drag feedback

### Phase 4: Polish (Nice-to-have)
- [ ] Folder icons change based on content
- [ ] Context menu (rename, delete)
- [ ] Keyboard shortcuts
- [ ] Search across SOWs

---

## 📦 Dependencies Needed

For accordion: **Nothing extra** (use shadcn Accordion)

For drag & drop, pick one:

```bash
# Option A: react-beautiful-dnd (easier)
npm install react-beautiful-dnd

# Option B: react-dnd (more powerful)
npm install react-dnd react-dnd-html5-backend

# Option C: dnd-kit (modern)
npm install @dnd-kit/sortable @dnd-kit/core @dnd-kit/utilities
```

---

## 🎨 UI Component Structure

```
LeftSidebar/SidebarNav
└── FolderAccordion
    ├── AccordionItem (for each folder)
    │   ├── AccordionTrigger
    │   │   └── "📁 Folder Name (3 SOWs)"
    │   └── AccordionContent
    │       └── SOWList
    │           ├── SOWItem (draggable)
    │           ├── SOWItem (draggable)
    │           └── SOWItem (draggable)
    └── NewFolderButton
```

---

## 🚀 Quick Start (Use This)

### Step 1: Add Accordion to page.tsx

```typescript
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

// Replace the current folder list with:
<Accordion type="multiple" defaultValue={folders.map(f => f.id)}>
  {folders.map(folder => {
    const folderSows = documents.filter(d => d.folderId === folder.id);
    return (
      <AccordionItem key={folder.id} value={folder.id}>
        <AccordionTrigger>
          <span>📁 {folder.name}</span>
          <span className="ml-2 text-sm text-gray-500">({folderSows.length})</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-1 ml-4">
            {folderSows.map(sow => (
              <div
                key={sow.id}
                className="p-2 hover:bg-blue-50 rounded cursor-pointer"
                onClick={() => setCurrentDocId(sow.id)}
              >
                📄 {sow.title}
              </div>
            ))}
            {folderSows.length === 0 && (
              <div className="text-sm text-gray-400">No SOWs yet</div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  })}
</Accordion>
```

### Step 2: Add Drag Events

```typescript
<div
  key={sow.id}
  className="p-2 hover:bg-blue-50 rounded cursor-pointer"
  onClick={() => setCurrentDocId(sow.id)}
  draggable
  onDragStart={(e) => {
    e.dataTransfer?.setData('sowId', sow.id);
    e.dataTransfer!.effectAllowed = 'move';
  }}
>
  📄 {sow.title}
</div>
```

### Step 3: Add Drop Events

```typescript
<AccordionContent
  onDragOver={(e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }}
  onDrop={(e) => {
    e.preventDefault();
    const sowId = e.dataTransfer?.getData('sowId');
    if (sowId) {
      moveSowToFolder(sowId, folder.id);
    }
  }}
>
  {/* SOWs */}
</AccordionContent>
```

### Step 4: Implement moveSowToFolder

```typescript
const moveSowToFolder = async (sowId: string, folderId: string) => {
  try {
    // Update in database
    await fetch(`/api/sow/${sowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId }),
    });
    
    // Update UI
    setDocuments(docs =>
      docs.map(d =>
        d.id === sowId ? { ...d, folderId } : d
      )
    );
    
    toast.success(`Moved to ${folders.find(f => f.id === folderId)?.name}`);
  } catch (error) {
    toast.error('Failed to move SOW');
  }
};
```

---

## 🧪 Test Checklist

- [ ] Accordion expands/collapses
- [ ] All folders show
- [ ] SOW counts are correct
- [ ] Click SOW to select it
- [ ] Drag SOW to another folder
- [ ] Database updates with new folder_id
- [ ] Refresh page, SOW still in new folder

---

## 📝 Files to Modify

1. **`/frontend/app/page.tsx`**
   - Add Accordion import
   - Replace folder list with accordion
   - Add drag/drop handlers
   - Add moveSowToFolder function

2. **Create new component (optional)**
   - `components/FolderAccordion.tsx`
   - Extract logic from page.tsx
   - Make it reusable

---

**Ready to implement? Start with Phase 1 (database persistence) first!** ✅
