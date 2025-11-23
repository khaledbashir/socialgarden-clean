-- Migration: 003_create_chat_messages_table.sql
-- Create chat_messages table if it doesn't exist

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  agent_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  role ENUM('user','assistant','system') DEFAULT 'user',
  timestamp BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agent_id (agent_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
