# 🚨 TWO CRITICAL ISSUES - FIX BOTH NOW

## Issue #1: `/undefined/api/v1/workspace/123test/update` - AnythingLLM URL Still Wrong

**Problem**: Still getting `/undefined/` in API calls  
**Cause**: `NEXT_PUBLIC_ANYTHINGLLM_URL` not set correctly in frontend env vars

**Fix**: Make sure this is in your `sow-qandu-me` frontend environment:
```env
NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
```

---

## Issue #2: `Table 'socialgarden_sow.folders' doesn't exist`

**Problem**: Database missing `folders` table  
**Cause**: Schema was incomplete  
**Status**: ✅ FIXED - table added to schema.sql

**Fix**: Run this SQL on your EasyPanel MySQL database:

```sql
CREATE TABLE IF NOT EXISTS folders (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  user_email VARCHAR(255),
  workspace_slug VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_workspace_slug (workspace_slug),
  INDEX idx_user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## How to Run Migration on EasyPanel

### Option 1: PhpMyAdmin (Easiest)
1. Go to EasyPanel → MySQL service → phpMyAdmin
2. Select database `socialgarden_sow`
3. Click **SQL** tab
4. Copy-paste the SQL above
5. Click **Go**

### Option 2: Terminal SSH
```bash
mysql -h ahmad-mysql-database -u sg_sow_user -p socialgarden_sow < migration-add-folders-table.sql
```

### Option 3: Command Line (if you have access)
```bash
mysql -h ahmad-mysql-database \
  -u sg_sow_user \
  -pSG_sow_2025_SecurePass! \
  socialgarden_sow \
  -e "CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    user_email VARCHAR(255),
    workspace_slug VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_workspace_slug (workspace_slug),
    INDEX idx_user_email (user_email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
```

---

## Verification

After running the migration, verify the table exists:

```sql
SHOW TABLES LIKE 'folders';
DESCRIBE folders;
```

You should see:
```
+---------+
| Tables_in_socialgarden_sow (folders) |
+---------+
| folders |
+---------+
```

---

## What to Do After Migration

1. ✅ Run the migration SQL above
2. ✅ Verify `folders` table exists
3. ✅ Make sure `NEXT_PUBLIC_ANYTHINGLLM_URL` is in frontend env vars
4. ✅ Redeploy frontend on EasyPanel
5. ✅ Try creating a workspace again

You should NOT see these errors anymore! 🎯
