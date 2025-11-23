# 🗄️ IMPORT DATABASE DUMP TO EASYPANEL MYSQL

## Status
✅ Database dump created from external MySQL (168.231.115.219)  
⏳ Ready to import into EasyPanel MySQL (ahmad-mysql-database)

## Steps to Import

### Option 1: Via phpMyAdmin (Easiest - Recommended) ⭐

1. Go to EasyPanel → `ahmad-mysql-database` service
2. Look for **"phpMyAdmin"** link or web UI button
3. Login with:
   - **User**: `sg_sow_user`
   - **Password**: `SG_sow_2025_SecurePass!`
   - **Database**: `socialgarden_sow`
4. Top menu → **"Import"** tab
5. Select file or paste the SQL below
6. Click **"Go"** → Wait for completion

### Option 2: Via MySQL CLI in EasyPanel Terminal

1. Go to EasyPanel → `ahmad-mysql-database` → Terminal (or SSH)
2. Run:
   ```bash
   mysql -u sg_sow_user -pSG_sow_2025_SecurePass! socialgarden_sow < /path/to/dump.sql
   ```

### Option 3: Paste SQL Directly (If UI has SQL editor)

Use the SQL script below:

---

## SQL Script to Execute

```sql
-- ============================================
-- SOCIAL GARDEN SOW DATABASE FULL DUMP
-- Source: 168.231.115.219
-- Date: 2025-10-22
-- ============================================

-- Drop and recreate all tables to ensure clean state
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `chat_threads`;
DROP TABLE IF EXISTS `ai_conversations`;
DROP TABLE IF EXISTS `sow_activities`;
DROP TABLE IF EXISTS `sow_comments`;
DROP TABLE IF EXISTS `sows`;
DROP TABLE IF EXISTS `agents`;
DROP TABLE IF EXISTS `folders`;
DROP VIEW IF EXISTS `active_sows_dashboard`;

-- Create folders table
CREATE TABLE `folders` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_id` int DEFAULT NULL,
  `embed_id` int DEFAULT NULL,
  `anythingllm_workspace_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_workspace` (`workspace_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert production folder data
INSERT INTO `folders` VALUES
('24bdf5f3-d83a-4b54-a84d-fda093a128d6', 'yyyy', 'yyyy', 131, 149, NULL, '2025-10-22 22:51:23', '2025-10-22 22:51:23'),
('2c62dfd7-328b-4461-9531-e85b32e4fee9', 'testing444', 'testing444', 129147, NULL, NULL, '2025-10-22 22:42:17', '2025-10-22 22:42:17'),
('42eb7621-258b-4460-8004-15653a9a6496', 'test123', 'test123', 126, 145, NULL, '2025-10-22 21:59:01', '2025-10-22 21:59:01'),
('8f6b9de5-7e3d-484b-b808-1ba15c5cd4a5', 'hello', 'hello', 114, 144, NULL, '2025-10-22 21:08:31', '2025-10-22 21:08:31'),
('9511701f-50ed-4660-8aa7-fe4461dd5151', '678', '678', 130, 148, NULL, '2025-10-22 22:44:52', '2025-10-22 22:44:52');

-- Create agents table
CREATE TABLE `agents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `system_prompt` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'z-ai/glm-4.5-air:free',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sows table
CREATE TABLE `sows` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_investment` decimal(12,2) DEFAULT NULL,
  `status` enum('draft','sent','viewed','accepted','declined') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `workspace_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anythingllm_workspace_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thread_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thread_slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` timestamp NULL,
  `first_viewed_at` timestamp NULL,
  `last_viewed_at` timestamp NULL,
  `expires_at` timestamp NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_workspace` (`workspace_slug`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sow_activities table
CREATE TABLE `sow_activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sow_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sow_id` (`sow_id`),
  KEY `idx_event_type` (`event_type`),
  CONSTRAINT `sow_activities_ibfk_1` FOREIGN KEY (`sow_id`) REFERENCES `sows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sow_comments table
CREATE TABLE `sow_comments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sow_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_type` enum('client','internal') COLLATE utf8mb4_unicode_ci DEFAULT 'client',
  `author_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sow_id` (`sow_id`),
  KEY `idx_author_type` (`author_type`),
  CONSTRAINT `sow_comments_ibfk_1` FOREIGN KEY (`sow_id`) REFERENCES `sows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ai_conversations table
CREATE TABLE `ai_conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sow_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('client','ai') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `buying_signal_detected` tinyint(1) DEFAULT '0',
  `objection_detected` tinyint(1) DEFAULT '0',
  `objection_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sentiment` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sow_id` (`sow_id`),
  KEY `idx_role` (`role`),
  KEY `idx_buying_signal` (`buying_signal_detected`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `ai_conversations_ibfk_1` FOREIGN KEY (`sow_id`) REFERENCES `sows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create chat_threads table
CREATE TABLE `chat_threads` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `thread_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sow_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_thread` (`thread_id`, `workspace_slug`),
  KEY `idx_workspace` (`workspace_slug`),
  KEY `idx_sow_id` (`sow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create chat_messages table
CREATE TABLE `chat_messages` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `thread_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workspace_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','assistant') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_thread` (`thread_id`),
  KEY `idx_workspace` (`workspace_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create active_sows_dashboard view
CREATE VIEW `active_sows_dashboard` AS
SELECT 
  `s`.`id` AS `id`,
  `s`.`title` AS `title`,
  `s`.`client_name` AS `client_name`,
  `s`.`client_email` AS `client_email`,
  `s`.`total_investment` AS `total_investment`,
  `s`.`status` AS `status`,
  `s`.`created_at` AS `created_at`,
  `s`.`sent_at` AS `sent_at`,
  `s`.`first_viewed_at` AS `first_viewed_at`,
  `s`.`last_viewed_at` AS `last_viewed_at`,
  `s`.`expires_at` AS `expires_at`,
  (SELECT COUNT(*) FROM `sow_activities` WHERE `sow_activities`.`sow_id` = `s`.`id` AND `sow_activities`.`event_type` = 'sow_opened') AS `view_count`,
  (SELECT COUNT(*) FROM `sow_comments` WHERE `sow_comments`.`sow_id` = `s`.`id` AND `sow_comments`.`author_type` = 'client') AS `client_comments_count`,
  (SELECT COUNT(*) FROM `sow_comments` WHERE `sow_comments`.`sow_id` = `s`.`id` AND `sow_comments`.`author_type` = 'client' AND `sow_comments`.`is_read` = 0) AS `unread_comments_count`,
  (SELECT COUNT(*) FROM `ai_conversations` WHERE `ai_conversations`.`sow_id` = `s`.`id`) AS `ai_message_count`,
  (SELECT COUNT(*) FROM `ai_conversations` WHERE `ai_conversations`.`sow_id` = `s`.`id` AND `ai_conversations`.`buying_signal_detected` = 1) AS `buying_signals_count`,
  TIMESTAMPDIFF(SECOND, `s`.`sent_at`, `s`.`first_viewed_at`) AS `seconds_to_first_view`,
  TIMESTAMPDIFF(DAY, NOW(), `s`.`expires_at`) AS `days_until_expiry`,
  (SELECT `sow_activities`.`created_at` FROM `sow_activities` WHERE `sow_activities`.`sow_id` = `s`.`id` ORDER BY `sow_activities`.`created_at` DESC LIMIT 1) AS `last_activity_at`
FROM `sows` `s`
WHERE `s`.`status` IN ('sent', 'viewed')
ORDER BY (SELECT `sow_activities`.`created_at` FROM `sow_activities` WHERE `sow_activities`.`sow_id` = `s`.`id` ORDER BY `sow_activities`.`created_at` DESC LIMIT 1) DESC;

-- Verify import
SELECT COUNT(*) as 'Total Folders' FROM folders;
SELECT COUNT(*) as 'Total SOWs' FROM sows;
SELECT COUNT(*) as 'Total Activities' FROM sow_activities;

SHOW TABLES;
```

---

## After Import

Once imported, run:

```sql
SELECT COUNT(*) as 'Folders' FROM folders;
SELECT COUNT(*) as 'SOWs' FROM sows;
SELECT COUNT(*) as 'Activities' FROM sow_activities;
SHOW TABLES;
```

Expected output:
```
Folders: 5
SOWs: 0
Activities: 0
Tables: folders, sows, sow_activities, sow_comments, ai_conversations, chat_threads, chat_messages, agents
```

## Next Steps After Import

1. ✅ Database populated on EasyPanel MySQL
2. Update frontend `.env.production`: `DB_HOST=ahmad-mysql-database`
3. Redeploy frontend on EasyPanel
4. Test: Create workspace → Should work without 500 errors
5. UNIFIED ✅

---

## Questions?

If import fails:
- Check user credentials
- Verify you're on `socialgarden_sow` database
- Try Option 2 (CLI) if Option 1 (phpMyAdmin) fails
