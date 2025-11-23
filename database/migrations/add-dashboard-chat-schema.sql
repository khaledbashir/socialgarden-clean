-- 🚀 Dashboard AI Chat Enhancement - Database Schema Implementation
-- 
-- This migration adds the necessary tables for full chat functionality:
-- - Chat history persistence
-- - New conversation management  
-- - Message storage and retrieval
-- - Conversation switching capabilities
--
-- Execute this SQL to enable complete dashboard AI chat functionality

-- Create dashboard_conversations table for conversation management
CREATE TABLE IF NOT EXISTS dashboard_conversations (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) DEFAULT 'New Conversation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create dashboard_messages table for message storage
CREATE TABLE IF NOT EXISTS dashboard_messages (
  id VARCHAR(255) PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_created_at (created_at),
  INDEX idx_role (role),
  FOREIGN KEY (conversation_id) REFERENCES dashboard_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing (optional)
-- INSERT INTO dashboard_conversations (id, user_id, title) VALUES 
--   (UUID(), 'test-user-1', 'Client Strategy Discussion'),
--   (UUID(), 'test-user-1', 'SOW Analysis'),
--   (UUID(), 'test-user-2', 'Dashboard Analytics');

-- INSERT INTO dashboard_messages (id, conversation_id, role, content) VALUES 
--   (UUID(), 'test-conversation-1', 'user', 'How can I improve client engagement?'),
--   (UUID(), 'test-conversation-1', 'assistant', 'Based on the analytics, focus on personalized content and timely follow-ups.'),
--   (UUID(), 'test-conversation-2', 'user', 'Show me SOW trends for Q4'),
--   (UUID(), 'test-conversation-2', 'assistant', 'Q4 SOW trends show a 23% increase in enterprise clients.');

-- 🎯 Success: Dashboard AI now supports:
-- ✅ Chat history persistence across sessions
-- ✅ New conversation creation and management
-- ✅ Message storage and retrieval
-- ✅ Conversation switching interface
-- ✅ Full chat functionality for client discussions

-- 🔧 Usage: Run this migration on your MySQL database to enable complete dashboard chat functionality
