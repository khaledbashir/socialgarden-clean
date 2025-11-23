-- 🎯 User Preferences Table Migration
-- 
-- This migration adds user preferences storage to eliminate localStorage usage
-- for AI model selection and other user-specific settings
--
-- Features:
-- - Per-user preference storage
-- - Multi-device sync capability
-- - Audit trail with timestamps
-- - Flexible key-value structure
--
-- Execute this SQL to enable user preference persistence

CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL COMMENT 'User identifier (email, UUID, etc.)',
  preference_key VARCHAR(255) NOT NULL COMMENT 'Preference identifier (e.g., ai-selector-model)',
  preference_value TEXT COMMENT 'JSON-encoded preference value',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Ensure one preference value per user per key
  UNIQUE KEY unique_user_preference (user_id, preference_key),
  
  -- Index for fast user lookups
  INDEX idx_user_id (user_id),
  INDEX idx_preference_key (preference_key),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User preferences for AI model selection and UI settings';

-- Sample preferences that will be migrated from localStorage:
-- 
-- 1. ai-selector-model: "anthropic/claude-3.5-sonnet"
-- 2. ai-selector-free-only: "true" | "false"
-- 3. ai-settings: JSON object with model configurations
-- 4. sow-tutorial-completed: "true" | "false"
--
-- Example usage:
-- INSERT INTO user_preferences (user_id, preference_key, preference_value)
-- VALUES ('user@example.com', 'ai-selector-model', '"anthropic/claude-3.5-sonnet"')
-- ON DUPLICATE KEY UPDATE preference_value = '"anthropic/claude-3.5-sonnet"', updated_at = NOW();
