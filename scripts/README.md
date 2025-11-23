# Database & AnythingLLM Sync Scripts

These scripts help you maintain a perfect mirror between your database and AnythingLLM workspaces.

## 🎯 Goal

Ensure that:
- Every workspace created in the app is created in AnythingLLM
- Every workspace in AnythingLLM has a corresponding folder in the database
- Threads are properly created in AnythingLLM when SOWs are created
- No orphaned data exists

## 📋 Scripts

### 1. `backup-database.sh`
**Purpose:** Backup all database data before any cleanup operations

**Usage:**
```bash
bash scripts/backup-database.sh
```

**What it does:**
- Creates full SQL backup of the database
- Exports folders and SOWs to text files
- Saves backups in `./backups/` directory

---

### 2. `backup-anythingllm-workspaces.js`
**Purpose:** Backup all AnythingLLM workspaces and threads

**Usage:**
```bash
node scripts/backup-anythingllm-workspaces.js
```

**What it does:**
- Lists all workspaces in AnythingLLM
- Lists all threads for each workspace
- Saves backups as JSON files in `./backups/` directory

**Requirements:**
- `NEXT_PUBLIC_ANYTHINGLLM_URL` environment variable
- `NEXT_PUBLIC_ANYTHINGLLM_API_KEY` environment variable

---

### 3. `sync-database-anythingllm.js`
**Purpose:** Analyze and fix sync between database and AnythingLLM

**Usage:**
```bash
# Dry run (analysis only)
node scripts/sync-database-anythingllm.js

# Live (apply changes)
node scripts/sync-database-anythingllm.js --live
```

**What it does:**
- Lists all folders in database
- Lists all workspaces in AnythingLLM
- Identifies orphans (workspaces in one but not the other)
- Creates missing workspaces in AnythingLLM
- Creates missing folders in database

**Requirements:**
- Database connection (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- AnythingLLM API access

---

### 4. `cleanup-orphans.js`
**Purpose:** Remove orphaned workspaces/folders

**Usage:**
```bash
# Dry run (analysis only)
node scripts/cleanup-orphans.js

# Live (with confirmation)
node scripts/cleanup-orphans.js --live --confirm
```

**What it does:**
- Identifies orphaned folders (in DB but not in AnythingLLM)
- Identifies orphaned workspaces (in AnythingLLM but not in DB)
- Optionally deletes them (with confirmation)

**⚠️ WARNING:** This script DELETES data. Always backup first!

---

### 5. `reset-and-sync.sh`
**Purpose:** Master script that runs all steps in sequence

**Usage:**
```bash
bash scripts/reset-and-sync.sh
```

**What it does:**
1. Backs up database
2. Backs up AnythingLLM workspaces
3. Analyzes sync status (dry run)
4. Analyzes orphans (dry run)
5. Asks for confirmation before applying changes

---

## 🚀 Quick Start: Clean Reset

If you want a clean start with everything in sync:

```bash
# 1. Backup everything first (IMPORTANT!)
bash scripts/backup-database.sh
node scripts/backup-anythingllm-workspaces.js

# 2. Analyze what needs to be fixed (dry run)
node scripts/sync-database-anythingllm.js

# 3. Apply sync (creates missing workspaces/folders)
node scripts/sync-database-anythingllm.js --live

# 4. Clean up orphans (optional, be careful!)
node scripts/cleanup-orphans.js --live --confirm
```

Or use the master script:
```bash
bash scripts/reset-and-sync.sh
```

---

## 🔍 Verification

After running sync, verify everything is in sync:

```bash
# Check sync status
node scripts/sync-database-anythingllm.js
```

You should see:
- ✅ Same number of folders in DB and workspaces in AnythingLLM
- ✅ No orphans

---

## 📝 Environment Variables

Make sure these are set:

```bash
# Database
export DB_HOST=ahmad_mysql-database
export DB_USER=sg_sow_user
export DB_PASSWORD=SG_sow_2025_SecurePass!
export DB_NAME=socialgarden_sow
export DB_PORT=3306

# AnythingLLM
export NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
export NEXT_PUBLIC_ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
```

---

## ⚠️ Important Notes

1. **Always backup first** - These scripts can modify/delete data
2. **Test in dry-run mode first** - Use `--live` only after reviewing
3. **Orphan cleanup is destructive** - Only use `--confirm` if you're sure
4. **Folders with SOWs are protected** - Orphan cleanup won't delete folders that have SOWs

---

## 🐛 Troubleshooting

### "Failed to connect to database"
- Check DB_HOST, DB_USER, DB_PASSWORD are correct
- Verify database is accessible from your location

### "Failed to list workspaces"
- Check NEXT_PUBLIC_ANYTHINGLLM_URL is correct
- Check NEXT_PUBLIC_ANYTHINGLLM_API_KEY is valid
- Verify AnythingLLM service is running

### "Module not found: mysql2"
- Install dependencies: `npm install mysql2`

---

## 📊 Expected Workflow

1. User clicks "Create Workspace" in app
2. App calls `createWorkspaceWithPrompt()` → Creates workspace in AnythingLLM
3. App saves folder to database with `workspace_slug` and `workspace_id`
4. App creates thread in AnythingLLM workspace
5. App saves SOW to database with `thread_slug` and `workspace_slug`

**Result:** Perfect sync between app database and AnythingLLM!

