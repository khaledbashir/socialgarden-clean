# 🔧 ADD MISSING embed_id COLUMN

**Run this ONE SQL command in EasyPanel phpMyAdmin:**

```sql
ALTER TABLE `sows` ADD COLUMN `embed_id` int DEFAULT NULL AFTER `thread_slug`;
```

That's it! This is the missing column causing the 500 error.

**Verify it was added:**
```sql
DESCRIBE sows;
```

Should now show `embed_id` in the list.

**Then:**
1. Refresh browser at https://sow.qandu.me
2. Try creating a workspace again
3. Should work! ✅
