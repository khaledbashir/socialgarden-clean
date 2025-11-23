# 🚀 COMPLETE MIGRATION: External DB → EasyPanel MySQL

**Goal**: Move ALL data from 168.231.115.219 → ahmad-mysql-database on EasyPanel  
**Result**: Fully unified system on EasyPanel

## Step 1: Backup External Database ✅

```bash
mysqldump -h 168.231.115.219 -u sg_sow_user -pSG_sow_2025_SecurePass! socialgarden_sow > /tmp/backup.sql
```

**Already done!** Backup at: `/tmp/socialgarden_sow_backup.sql`

## Step 2: Get EasyPanel MySQL Access

You need to access EasyPanel MySQL from phpMyAdmin or command line.

### Option A: Via phpMyAdmin (EASIEST)
1. Go to EasyPanel → MySQL service → phpMyAdmin
2. Select database `socialgarden_sow`
3. Click **Import** tab
4. Upload backup file or paste SQL
5. Click **Go**

### Option B: Via MySQL Command (from here)
This requires SSH access to EasyPanel or port forwarding. Ask me for help if needed.

## Step 3: Update Frontend Environment Variable

After import completes:

**Go to EasyPanel → sow-qandu-me → Edit → Environment**

Change:
```env
DB_HOST=168.231.115.219
```

To:
```env
DB_HOST=ahmad-mysql-database
```

**Save → Redeploy**

## Step 4: Verify

After redeploy:
1. Go to https://sow.qandu.me
2. Create a test workspace
3. Check browser console for any DB errors
4. All data should load from EasyPanel MySQL ✅

---

## What Happens Next?

✅ **All 3 services unified on EasyPanel:**
- Frontend (sow-qandu-me) - talks to EasyPanel MySQL
- Backend (socialgarden-backend) - optional API layer
- MySQL (ahmad-mysql-database) - single source of truth

✅ **Can decommission external MySQL** once verified everything works

---

## File Location
Backup file: `/tmp/socialgarden_sow_backup.sql`  
SQL dump size: 557 lines (small dataset, quick migration)
