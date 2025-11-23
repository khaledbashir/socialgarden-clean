# 🔧 DIAGNOSTIC SQL - Check Exact Column Structure

**Run this in EasyPanel phpMyAdmin SQL tab to diagnose the insert issue:**

```sql
-- Check exact structure of sows table
DESCRIBE sows;

-- List all columns
SHOW COLUMNS FROM sows;

-- Try a test insert with minimal fields
INSERT INTO sows (id, title, content, status) VALUES ('test-123', 'Test SOW', 'Test content', 'draft');

-- If that works, check which columns are causing the issue:
-- Try with creator_email
INSERT INTO sows (id, title, content, status, creator_email) VALUES ('test-124', 'Test SOW 2', 'Test content', 'draft', NULL);

-- Try with folder_id
INSERT INTO sows (id, title, content, status, folder_id) VALUES ('test-125', 'Test SOW 3', 'Test content', 'draft', NULL);

-- Try with expires_at
INSERT INTO sows (id, title, content, status, expires_at) VALUES ('test-126', 'Test SOW 4', 'Test content', 'draft', NOW() + INTERVAL 30 DAY);

-- If all work, try full insert from code
INSERT INTO sows (
  id, title, client_name, client_email, content, total_investment,
  status, workspace_slug, thread_slug, embed_id, folder_id, creator_email, expires_at
) VALUES (
  'test-127', 'Full Test', 'Client Name', 'client@test.com', 'Content here', 0,
  'draft', 'test-workspace', NULL, NULL, NULL, NULL, NOW() + INTERVAL 30 DAY
);

-- Check the test rows
SELECT id, title, status FROM sows WHERE id LIKE 'test-%';
```

**Report back what error you get, if any.**
