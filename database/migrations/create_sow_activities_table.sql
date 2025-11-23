-- Migration: Create missing sow_activities table
-- This table is required for activity logging in the SOW system

CREATE TABLE IF NOT EXISTS `sow_activities` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `sow_id` VARCHAR(255) NOT NULL,
  
  -- Event information
  `event_type` ENUM(
    'sow_created',
    'sow_sent',
    'sow_opened',
    'section_viewed',
    'pricing_viewed',
    'comment_added',
    'ai_message_sent',
    'accept_initiated',
    'sow_accepted',
    'sow_declined',
    'pdf_downloaded',
    'link_shared'
  ) NOT NULL,
  
  -- Event metadata (JSON for flexibility)
  `metadata` JSON, -- Examples:
  -- {section: "Phase 2", timeSpent: 45, device: "iPhone"}
  -- {message: "What's included?", buyingSignal: true}
  -- {ip: "1.2.3.4", userAgent: "..."}
  
  -- Timestamp
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (`sow_id`) REFERENCES `sows`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_sow_id` (`sow_id`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;