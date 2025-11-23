-- Migration: Add missing 'folders' table
-- Run this on your EasyPanel MySQL database to add the folders table

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

-- Verify table was created
SHOW TABLES LIKE 'folders';
DESCRIBE folders;
