# 🧹 Clean Start Guide: Database & AnythingLLM Sync

## 🎯 Goal

Achieve a perfect mirror between your app database and AnythingLLM:
- Every workspace created in app → Created in AnythingLLM
- Every workspace in AnythingLLM → Has folder in database
- Every SOW → Has thread in AnythingLLM
- No orphaned data

## ✅ Current Implementation Status

### Workspace Creation Flow (Already Implemented)

When you click "Create Workspace" in the app:

1. **Creates AnythingLLM Workspace** (`createWorkspaceWithPrompt`)
   - Creates workspace with unique slug
   - Sets Architect system prompt automatically
   - Returns workspace ID and slug

2. **Saves to Database** (`/api/folders`)
   - Creates folder record with `workspace_slug` and `workspace_id`
   - Links database folder to AnythingLLM workspace

3. **Creates Thread** (`createThread`)
   - Creates thread in the AnythingLLM workspace
   - Returns thread slug

4. **Saves SOW** (`/api/sow/create`)
   - Creates SOW in database
   - Links SOW to folder and workspace
   - Updates SOW with `thread_slug` and `workspace_slug`

**✅ This flow is already correct and working!**

---

## 🧹 Clean Start Process

### Step 1: Backup Everything (CRITICAL!)

```bash
# Backup database
bash scripts/backup-database.sh

# Backup AnythingLLM workspaces
node scripts/backup-anythingllm-workspaces.js
```

**Backups saved to:** `./backups/` directory

---

### Step 2: Analyze Current State

```bash
# Check sync status (dry run)
node scripts/sync-database-anythingllm.js
```

This will show you:
- How many folders are in database
- How many workspaces are in AnythingLLM
- How many orphans exist (out of sync)

---

### Step 3: Fix Sync Issues

```bash
# Apply sync (creates missing workspaces/folders)
node scripts/sync-database-anythingllm.js --live
```

This will:
- Create missing workspaces in AnythingLLM (for folders in DB)
- Create missing folders in database (for workspaces in AnythingLLM)

---

### Step 4: Clean Up Orphans (Optional)

**⚠️ WARNING: This deletes data! Only run if you're sure.**

```bash
# Analyze orphans first (dry run)
node scripts/cleanup-orphans.js

# Delete orphans (with confirmation)
node scripts/cleanup-orphans.js --live --confirm
```

**Note:** Folders with SOWs are protected and won't be deleted.

---

### Step 5: Verify Everything

```bash
# Check sync status again
node scripts/sync-database-anythingllm.js
```

You should see:
- ✅ Same number of folders and workspaces
- ✅ No orphans

---

## 🚀 Quick Reset (All-in-One)

Use the master script:

```bash
bash scripts/reset-and-sync.sh
```

This runs all steps interactively with confirmations.

---

## 📋 Verification Checklist

After cleanup, verify:

- [ ] Database has folders with `workspace_slug` and `workspace_id`
- [ ] AnythingLLM has workspaces matching database folders
- [ ] Each workspace in AnythingLLM has the Architect system prompt
- [ ] Creating a new workspace in app creates it in AnythingLLM
- [ ] Creating a new SOW creates a thread in AnythingLLM
- [ ] No orphaned data exists

---

## 🔍 Testing the Flow

1. **Create a new workspace in the app:**
   - Click "New Workspace"
   - Enter a name (e.g., "Test Client")
   - Verify it appears in sidebar

2. **Check AnythingLLM:**
   - Go to AnythingLLM admin
   - Verify workspace "Test Client" exists
   - Verify it has the Architect system prompt

3. **Check Database:**
   ```sql
   SELECT * FROM folders WHERE name = 'Test Client';
   ```
   - Should have `workspace_slug` and `workspace_id`

4. **Create a SOW in the workspace:**
   - Click "New SOW" in the workspace
   - Verify thread is created in AnythingLLM

---

## 🐛 Troubleshooting

### Workspace not appearing in AnythingLLM

**Check:**
1. Verify `createWorkspaceWithPrompt()` is being called
2. Check browser console for errors
3. Verify `NEXT_PUBLIC_ANYTHINGLLM_API_KEY` is set
4. Check AnythingLLM service is running

**Fix:**
```bash
# Manually create missing workspace
node scripts/sync-database-anythingllm.js --live
```

### Folder not saving to database

**Check:**
1. Verify `/api/folders` endpoint is working
2. Check database connection
3. Verify `workspace_slug` is being passed

**Fix:**
- Check database logs
- Verify DB credentials in environment variables

### Thread not created

**Check:**
1. Verify `createThread()` is being called
2. Check workspace slug is correct
3. Verify thread is saved to SOW record

**Fix:**
- Check browser console for errors
- Verify AnythingLLM API is accessible

---

## 📝 Environment Variables Required

Make sure these are set in your Easypanel frontend service:

```bash
# Database
DB_HOST=ahmad_mysql-database
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
DB_PORT=3306

# AnythingLLM
NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
NEXT_PUBLIC_ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
```

---

## ✅ Success Criteria

After cleanup, you should have:

1. **Perfect Sync:**
   - Every folder in DB has a workspace in AnythingLLM
   - Every workspace in AnythingLLM has a folder in DB
   - No orphans

2. **Proper Creation:**
   - New workspaces create in both places
   - New SOWs create threads in AnythingLLM
   - All data persists correctly

3. **Clean State:**
   - No duplicate workspaces
   - No orphaned folders
   - All workspaces have system prompts

---

## 🎉 Next Steps

After cleanup:

1. Test creating a new workspace
2. Verify it appears in both database and AnythingLLM
3. Test creating a SOW
4. Verify thread is created
5. Test chat functionality
6. Verify data persists after refresh

---

## 📞 Support

If you encounter issues:

1. Check the backup files in `./backups/`
2. Review the sync analysis output
3. Check browser console for errors
4. Check database logs
5. Check AnythingLLM logs

All scripts are in the `scripts/` directory with detailed README.

