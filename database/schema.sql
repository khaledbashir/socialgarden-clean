-- Social Garden SOW Generator - Database Schema
-- Created: October 15, 2025
-- Purpose: Client Portal tracking, activity logging, acceptance workflow

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS ai_conversations;
DROP TABLE IF EXISTS sow_rejections;
DROP TABLE IF EXISTS sow_acceptances;
DROP TABLE IF EXISTS sow_comments;
DROP TABLE IF EXISTS sow_activities;
DROP TABLE IF EXISTS sows;
DROP TABLE IF EXISTS folders;

-- ================================================================
-- Folders Table
-- ================================================================
CREATE TABLE folders (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  user_email VARCHAR(255),
  workspace_slug VARCHAR(255), -- AnythingLLM workspace this folder belongs to
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_workspace_slug (workspace_slug),
  INDEX idx_user_email (user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Main SOW Table
-- ================================================================
CREATE TABLE sows (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  client_name VARCHAR(255), -- Allow NULL for draft SOWs
  client_email VARCHAR(255),
  content LONGTEXT NOT NULL, -- Full SOW content (HTML or JSON)
  total_investment DECIMAL(12,2) DEFAULT 0, -- Allow NULL, default to 0
  
  -- Status tracking
  status ENUM('draft', 'sent', 'viewed', 'accepted', 'declined') DEFAULT 'draft',
  
  -- AnythingLLM integration
  workspace_slug VARCHAR(255), -- AnythingLLM workspace identifier
  thread_slug VARCHAR(255), -- AnythingLLM thread UUID (NOT the SOW ID)
  embed_id VARCHAR(255), -- AnythingLLM embed ID for chat widget
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  sent_at TIMESTAMP NULL,
  first_viewed_at TIMESTAMP NULL,
  last_viewed_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL, -- Proposal expiration date
  accepted_at TIMESTAMP NULL,
  declined_at TIMESTAMP NULL,
  
  -- Metadata
  folder_id VARCHAR(255), -- Reference to folder in localStorage (for now)
  creator_email VARCHAR(255), -- Agency user who created it
  
  -- Social Garden Business Intelligence (Added: October 23, 2025)
  vertical ENUM('property', 'education', 'finance', 'healthcare', 'retail', 'hospitality', 'professional-services', 'technology', 'other') DEFAULT NULL,
  service_line ENUM('crm-implementation', 'marketing-automation', 'revops-strategy', 'managed-services', 'consulting', 'training', 'other') DEFAULT NULL,
  
  -- Indexes for performance
  INDEX idx_status (status),
  INDEX idx_client_email (client_email),
  INDEX idx_created_at (created_at),
  INDEX idx_expires_at (expires_at),
  INDEX idx_vertical (vertical),
  INDEX idx_service_line (service_line)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Activity Tracking Table
-- ================================================================
CREATE TABLE sow_activities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL,
  
  -- Event information
  event_type ENUM(
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
  metadata JSON, -- Examples:
  -- {section: "Phase 2", timeSpent: 45, device: "iPhone"}
  -- {message: "What's included?", buyingSignal: true}
  -- {ip: "1.2.3.4", userAgent: "..."}
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_sow_id (sow_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Comments Table (Threaded)
-- ================================================================
CREATE TABLE sow_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL,
  
  -- Author information
  author_type ENUM('client', 'agency') NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  
  -- Comment details
  section_id VARCHAR(255), -- e.g., "phase-2-email-templates"
  section_title VARCHAR(500), -- e.g., "Phase 2: Email Template Design"
  content TEXT NOT NULL,
  
  -- Threading support
  parent_comment_id BIGINT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE, -- Has agency owner read this?
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES sow_comments(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_sow_id (sow_id),
  INDEX idx_author_type (author_type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Acceptance Records Table
-- ================================================================
CREATE TABLE sow_acceptances (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL UNIQUE, -- One acceptance per SOW
  
  -- Signer information
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  signer_company VARCHAR(255),
  signer_title VARCHAR(255), -- e.g., "Marketing Director"
  
  -- Signature data
  signature_data TEXT NOT NULL, -- base64 encoded signature image
  signature_method ENUM('canvas', 'typed', 'uploaded') DEFAULT 'canvas',
  
  -- Legal tracking
  ip_address VARCHAR(45) NOT NULL, -- IPv4 or IPv6
  user_agent TEXT, -- Browser/device information
  terms_accepted BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_signer_email (signer_email),
  INDEX idx_signed_at (signed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Rejection Records Table
-- ================================================================
CREATE TABLE sow_rejections (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL,
  
  -- Rejection details
  reason ENUM('budget', 'timeline', 'scope_too_large', 'scope_too_small', 'other_vendor', 'not_interested', 'other') NOT NULL,
  details TEXT, -- Free-form explanation from client
  
  -- AI interaction
  ai_response TEXT, -- What the AI suggested in response
  client_replied BOOLEAN DEFAULT FALSE, -- Did client engage with AI's suggestion?
  client_reply TEXT, -- Their response to AI's suggestion
  
  -- Follow-up tracking
  follow_up_scheduled BOOLEAN DEFAULT FALSE,
  follow_up_date DATE NULL,
  follow_up_notes TEXT,
  
  -- Timestamps
  rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_sow_id (sow_id),
  INDEX idx_reason (reason),
  INDEX idx_rejected_at (rejected_at),
  INDEX idx_follow_up_scheduled (follow_up_scheduled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- AI Conversations Table
-- ================================================================
CREATE TABLE ai_conversations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL,
  
  -- Message details
  role ENUM('client', 'ai') NOT NULL,
  message TEXT NOT NULL,
  
  -- Analysis flags
  buying_signal_detected BOOLEAN DEFAULT FALSE,
  objection_detected BOOLEAN DEFAULT FALSE,
  objection_type VARCHAR(100), -- e.g., "pricing", "timeline", "scope"
  sentiment VARCHAR(50), -- e.g., "positive", "neutral", "negative", "excited"
  
  -- Metadata
  metadata JSON, -- Additional context like token count, model used, etc.
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_sow_id (sow_id),
  INDEX idx_role (role),
  INDEX idx_buying_signal (buying_signal_detected),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Views for Easy Querying
-- ================================================================

-- Active SOWs dashboard view
CREATE VIEW active_sows_dashboard AS
SELECT 
  s.id,
  s.title,
  s.client_name,
  s.client_email,
  s.total_investment,
  s.status,
  s.created_at,
  s.sent_at,
  s.first_viewed_at,
  s.last_viewed_at,
  s.expires_at,
  
  -- Engagement metrics
  (SELECT COUNT(*) FROM sow_activities WHERE sow_id = s.id AND event_type = 'sow_opened') as view_count,
  (SELECT COUNT(*) FROM sow_comments WHERE sow_id = s.id AND author_type = 'client') as client_comments_count,
  (SELECT COUNT(*) FROM sow_comments WHERE sow_id = s.id AND author_type = 'client' AND is_read = FALSE) as unread_comments_count,
  (SELECT COUNT(*) FROM ai_conversations WHERE sow_id = s.id) as ai_message_count,
  (SELECT COUNT(*) FROM ai_conversations WHERE sow_id = s.id AND buying_signal_detected = TRUE) as buying_signals_count,
  
  -- Time calculations
  TIMESTAMPDIFF(SECOND, s.sent_at, s.first_viewed_at) as seconds_to_first_view,
  TIMESTAMPDIFF(DAY, CURRENT_TIMESTAMP, s.expires_at) as days_until_expiry,
  
  -- Latest activity
  (SELECT created_at FROM sow_activities WHERE sow_id = s.id ORDER BY created_at DESC LIMIT 1) as last_activity_at
  
FROM sows s
WHERE s.status IN ('sent', 'viewed')
ORDER BY last_activity_at DESC;

-- ================================================================
-- Sample Data for Testing (Optional)
-- ================================================================

-- Uncomment to insert sample data:
/*
INSERT INTO sows (id, title, client_name, client_email, content, total_investment, status, workspace_slug, expires_at, sent_at) VALUES
('sow-demo-001', 'HubSpot Implementation', 'ABC Corporation', 'john@abccorp.com', '<h1>HubSpot Implementation</h1><p>Full scope...</p>', 50000.00, 'sent', 'client-abc-corp', DATE_ADD(NOW(), INTERVAL 14 DAY), NOW()),
('sow-demo-002', 'Social Media Campaign', 'XYZ Pty Ltd', 'sarah@xyzptyltd.com', '<h1>Social Media Campaign</h1><p>6-month engagement...</p>', 35000.00, 'viewed', 'client-xyz-pty', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO sow_activities (sow_id, event_type, metadata) VALUES
('sow-demo-001', 'sow_sent', JSON_OBJECT('method', 'email', 'sentBy', 'sam@socialgarden.com.au')),
('sow-demo-002', 'sow_sent', JSON_OBJECT('method', 'email', 'sentBy', 'sam@socialgarden.com.au')),
('sow-demo-002', 'sow_opened', JSON_OBJECT('device', 'iPhone 14 Pro', 'ip', '192.168.1.100'));

INSERT INTO ai_conversations (sow_id, role, message, buying_signal_detected, sentiment) VALUES
('sow-demo-002', 'client', 'What''s included in the $35,000 investment?', FALSE, 'curious'),
('sow-demo-002', 'ai', 'Great question! The $35,000 investment covers a comprehensive 6-month social media campaign including...', FALSE, 'helpful'),
('sow-demo-002', 'client', 'How quickly can we get started?', TRUE, 'excited'),
('sow-demo-002', 'ai', 'We can kick off within 5 business days! Are you ready to accept this proposal?', FALSE, 'encouraging');
*/

-- ================================================================
-- Service Catalog Table (for Admin Settings)
-- ================================================================
CREATE TABLE IF NOT EXISTS service_catalog (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(12,2) NOT NULL,
  pricing_unit VARCHAR(50) DEFAULT 'month', -- e.g., 'month', 'project', 'hour'
  category VARCHAR(100) DEFAULT 'general', -- e.g., 'social-media', 'content', 'advertising', 'seo'
  icon_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_category (category),
  INDEX idx_is_active (is_active),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- SOW Recommendations Table (AI-Generated Add-Ons)
-- ================================================================
CREATE TABLE IF NOT EXISTS sow_recommendations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL,
  service_id VARCHAR(36) NOT NULL,
  
  -- Pricing and selection
  recommended_price DECIMAL(12,2) NOT NULL,
  is_selected BOOLEAN DEFAULT FALSE,
  
  -- AI reasoning
  ai_reasoning TEXT, -- Why this service is recommended for this client
  relevance_score DECIMAL(3,2), -- 0.00 to 1.00 confidence score
  
  -- Metadata from AI scraping
  client_insights JSON, -- e.g., {"missing": "video content", "industry": "real estate"}
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES service_catalog(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_sow_id (sow_id),
  INDEX idx_service_id (service_id),
  INDEX idx_is_selected (is_selected),
  INDEX idx_relevance_score (relevance_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Success Message
-- ================================================================
SELECT 'Database schema created successfully!' as status;
SELECT 'Tables created: sows, sow_activities, sow_comments, sow_acceptances, sow_rejections, ai_conversations, service_catalog, sow_recommendations' as tables;
SELECT 'View created: active_sows_dashboard' as views;
