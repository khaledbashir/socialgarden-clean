-- ============================================
-- FINAL SCHEMA FIX FOR EASYPANEL MYSQL
-- Run this in EasyPanel MySQL UI now
-- ============================================

-- Verify current sows structure has folder_id
ALTER TABLE `sows` ADD COLUMN `creator_email` varchar(255) DEFAULT NULL IF NOT EXISTS;

-- Fix sow_activities - make sure it has the right columns
-- Drop if needed and recreate
DROP TABLE IF EXISTS `sow_activities_temp`;

CREATE TABLE `sow_activities_temp` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sow_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sow_id` (`sow_id`),
  KEY `idx_event_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copy existing data if any
INSERT INTO `sow_activities_temp` SELECT * FROM `sow_activities` WHERE id IS NOT NULL;

-- Drop old table and rename new one
DROP TABLE `sow_activities`;
RENAME TABLE `sow_activities_temp` TO `sow_activities`;

-- Verify final schema
SELECT 'SOWs table columns:' as check_name;
SHOW COLUMNS FROM sows;

SELECT 'SOW Activities table columns:' as check_name;
SHOW COLUMNS FROM sow_activities;

SELECT 'Gardners table check:' as check_name;
SELECT COUNT(*) as total_gardners FROM gardners;
