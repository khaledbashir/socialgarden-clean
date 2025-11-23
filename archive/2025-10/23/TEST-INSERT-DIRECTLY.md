# 🧪 TEST INSERT DIRECTLY IN DATABASE

Go to **EasyPanel → ahmad-mysql-database → phpMyAdmin → SQL tab** and run this test insert:

```sql
-- Test insert with all columns from the API code
INSERT INTO sows (
  id, title, client_name, client_email, content, total_investment,
  status, workspace_slug, thread_slug, embed_id, folder_id, creator_email, expires_at
) VALUES (
  'test-sow-001',
  'Test SOW Title',
  NULL,
  NULL,
  'Test content for SOW',
  0,
  'draft',
  'test-workspace-slug',
  NULL,
  161,
  NULL,
  NULL,
  NOW() + INTERVAL 30 DAY
);

-- Verify it worked
SELECT * FROM sows WHERE id = 'test-sow-001';

-- Check if we can also insert activity
INSERT INTO sow_activities (sow_id, event_type, metadata) VALUES (
  'test-sow-001',
  'sow_created',
  JSON_OBJECT('creatorEmail', NULL, 'folderId', NULL)
);

-- Verify activity
SELECT * FROM sow_activities WHERE sow_id = 'test-sow-001';
```

**If both succeed**, then the database is fine and the issue is the API code hasn't redeployed.

**Report back:**
- ✅ Insert succeeded / ❌ Got an error (paste exact error)
