# 🔧 SOW PERSISTENCE FIX - COMPLETE PLAN

## 🔍 The Problem

**Current:** Documents (SOWs) are saved to **localStorage** ❌
- Data is lost on browser refresh (if not saved)
- Only works on one device/browser
- Not persistent across sessions
- Can't see SOWs in database

**What We Need:** Save to **database** ✅
- Permanent storage
- Available everywhere
- Visible in database
- Proper persistence

---

## 📊 Current State

### ✅ What Already Exists

**Database:**
- ✅ `sows` table exists with all fields
- ✅ Properly normalized structure
- ✅ `folder_id` field for organization

**API Endpoints:**
- ✅ `POST /api/sow/create` - Create new SOW
- ✅ `GET /api/sow/[id]` - Fetch SOW from database
- ✅ `PUT /api/sow/[id]` - Update SOW in database
- ✅ `DELETE /api/sow/[id]` - Delete SOW from database

### ❌ What's Missing

**Frontend Logic:**
- ❌ page.tsx saves to localStorage instead of API
- ❌ No call to `PUT /api/sow/[id]` when content changes
- ❌ No call to `POST /api/sow/create` when creating new SOWs
- ❌ Not fetching SOWs from database on page load

---

## 🎯 The Fix (4 Steps)

### Step 1: Load SOWs from Database (Not localStorage)
**File:** `page.tsx` line ~370
```typescript
// OLD
const savedDocs = localStorage.getItem("documents");

// NEW
const response = await fetch('/api/sow/list'); // Need to create this
const allSows = await response.json();
setDocuments(allSows);
```

### Step 2: Create New SOW in Database
**File:** `page.tsx` line ~540
```typescript
// OLD
setDocuments(prev => [...prev, newDoc]);  // Just adds to state

// NEW
const response = await fetch('/api/sow/create', {
  method: 'POST',
  body: JSON.stringify(newDoc),
});
const savedSow = await response.json();
setDocuments(prev => [...prev, savedSow]);
```

### Step 3: Save SOW When Content Changes
**File:** `page.tsx` line ~820
```typescript
// OLD
localStorage.setItem('documents', JSON.stringify(docs));

// NEW
await fetch(`/api/sow/${currentDoc.id}`, {
  method: 'PUT',
  body: JSON.stringify({ content: editorContent }),
});
```

### Step 4: Delete SOW from Database
**File:** `page.tsx` line ~620
```typescript
// OLD
setDocuments(docs.filter(d => d.id !== currentDoc.id));

// NEW
await fetch(`/api/sow/${currentDoc.id}`, {
  method: 'DELETE',
});
setDocuments(docs.filter(d => d.id !== currentDoc.id));
```

---

## 🛠️ Implementation Steps

1. **Create GET all SOWs endpoint** → `/api/sow/list` (GET)
   - Fetches all SOWs for current user
   - Filters by folder (optional)
   - Returns sorted list

2. **Update page.tsx line 370** → Load from database
   - Call `GET /api/sow/list`
   - Populate state with database records
   - Stop using localStorage for SOWs

3. **Update page.tsx line 540** → Save new SOWs to database
   - Call `POST /api/sow/create`
   - Don't just add to state, save to DB first
   - Get ID from response

4. **Update page.tsx line 820** → Auto-save to database
   - Call `PUT /api/sow/[id]` with new content
   - Debounce to avoid too many requests
   - Show save indicator

5. **Update page.tsx line 620** → Delete from database
   - Call `DELETE /api/sow/[id]`
   - Then remove from UI

---

## 🗂️ Folder Structure (After Implementation)

```
Folders (Database)
├── 📁 Folder 1
│   ├── 📄 SOW A (in DB)
│   ├── 📄 SOW B (in DB)
│   └── 📄 SOW C (in DB)
├── 📁 Folder 2
│   ├── 📄 SOW D (in DB)
│   └── 📄 SOW E (in DB)
└── 📁 Folder 3
    └── 📄 SOW F (in DB)

All data persisted in MySQL, not localStorage ✅
```

---

## 🎯 Error Fixes (Bonus)

While fixing SOW persistence, we'll also fix:

| Endpoint | Error | Root Cause | Fix |
|----------|-------|-----------|-----|
| `/api/models` | 400 | Missing/broken endpoint | Create list of AI models |
| `/api/preferences/current_agent_id` | 405 | No PUT handler | Add PUT handler |
| `/api/agents/architect` | 404 | Architect agent not in DB | Create/seed architect agent |

---

## 📋 Files to Modify

1. **`/frontend/app/api/sow/list/route.ts`** ← CREATE (fetch all SOWs)
2. **`/frontend/app/page.tsx`** ← UPDATE (use database instead of localStorage)
   - Line ~370: Load from DB
   - Line ~540: Create in DB
   - Line ~820: Update in DB
   - Line ~620: Delete from DB

---

## ✅ Success Criteria

After implementation:

- [ ] SOWs appear in database `sows` table
- [ ] Creating a SOW saves to database
- [ ] Editing content saves to database
- [ ] Deleting SOW removes from database
- [ ] Refreshing page shows same SOWs
- [ ] Accordion UI shows folders → SOWs
- [ ] Can drag SOWs between folders
- [ ] All folder names show in sidebar (9 folders currently)

---

## 🚀 Testing

```bash
# After fix
1. Open app at http://localhost:3333
2. Create a new SOW
3. Check database:
   mysql -h 168.231.115.219 -u sg_sow_user -p'...' socialgarden_sow
   SELECT * FROM sows;
   # Should show your new SOW ✅
4. Refresh page
5. SOW should still appear ✅
6. Edit SOW
7. Check database
8. Updated content should be there ✅
```

---

## 📝 Why localStorage was used (Previously)

Likely reasons:
1. Quick local testing without database
2. Offline-first approach
3. Temporary placeholder during development
4. Not tied to user accounts yet

**Now:** We have a database and API endpoints, so we should use them! ✅

---

**Next:** Start implementing step by step, beginning with creating the list endpoint.
