-- ================================================================
-- Users Table Migration for Role-Based Access Control
-- ================================================================
-- Purpose: Create users table with role column for RBAC
-- Database: socialgarden_sow
-- Version: 1.0
-- Created: 2025-01-XX
-- ================================================================

-- Ensure we're using the correct database
USE socialgarden_sow;

-- ================================================================
-- Create users table
-- ================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'Unique user identifier (UUID)',
  `username` VARCHAR(255) UNIQUE NOT NULL COMMENT 'Unique username',
  `email` VARCHAR(255) UNIQUE COMMENT 'User email address',
  `role` ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer' COMMENT 'User role for access control',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',

  -- Performance indexes
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts with role-based access control';

-- ================================================================
-- Insert default admin user (optional - for initial setup)
-- ================================================================
-- Uncomment and modify the following lines to create a default admin user
-- INSERT INTO `users` (`id`, `username`, `email`, `role`) VALUES
-- ('admin-001', 'admin', 'admin@socialgarden.com.au', 'admin')
-- ON DUPLICATE KEY UPDATE `role` = 'admin';

-- ================================================================
-- Migration Complete
-- ================================================================
-- To verify the table was created:
-- SELECT * FROM users;
-- 
-- To add a new admin user:
-- INSERT INTO users (id, username, email, role) 
-- VALUES (UUID(), 'your-username', 'your-email@example.com', 'admin');
-- 
-- To update a user's role:
-- UPDATE users SET role = 'admin' WHERE username = 'your-username';
-- ================================================================

