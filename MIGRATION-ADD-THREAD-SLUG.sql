-- Quick Fix: Add thread_slug column if missing
-- Run this on the remote MySQL database

ALTER TABLE sows ADD COLUMN thread_slug VARCHAR(255) AFTER workspace_slug;

-- Verify it was added
DESCRIBE sows;
