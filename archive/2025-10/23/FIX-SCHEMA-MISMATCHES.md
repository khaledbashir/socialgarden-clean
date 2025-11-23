-- ============================================
-- FIX SCHEMA MISMATCHES IN EASYPANEL MYSQL
-- Run this in EasyPanel MySQL UI immediately
-- ============================================

-- STEP 1: Add missing column to sows table
ALTER TABLE `sows` ADD COLUMN `folder_id` varchar(36) DEFAULT NULL AFTER `content`;

-- STEP 2: Create gardners table
CREATE TABLE IF NOT EXISTS `gardners` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'custom',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_workspace_slug` (`workspace_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- STEP 3: Insert the 8 standard Gardners
INSERT INTO `gardners` (`id`, `workspace_slug`, `category`, `created_at`) VALUES
('1', 'gen-the-architect', 'sow', NOW()),
('2', 'property-marketing-pro', 'custom', NOW()),
('3', 'ad-copy-machine', 'custom', NOW()),
('4', 'crm-communication-specialist', 'email', NOW()),
('5', 'case-study-crafter', 'blog', NOW()),
('6', 'landing-page-persuader', 'custom', NOW()),
('7', 'seo-content-strategist', 'blog', NOW()),
('8', 'proposal-and-audit-specialist', 'sow', NOW());

-- STEP 4: Verify changes
SELECT 'Checking sows table structure:' as check_name;
SHOW COLUMNS FROM sows WHERE Field IN ('folder_id', 'id', 'title');

SELECT 'Checking gardners table:' as check_name;
SELECT COUNT(*) as total_gardners FROM gardners;

SELECT 'Gardners list:' as check_name;
SELECT workspace_slug, category FROM gardners;
