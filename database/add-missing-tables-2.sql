-- Add remaining missing tables
-- Run this to fix the 500 errors

-- ================================================================
-- SOW Acceptances Table
-- ================================================================
CREATE TABLE IF NOT EXISTS sow_acceptances (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL,
  
  -- Acceptance details
  accepted_by VARCHAR(255) NOT NULL,
  accepted_email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45), -- Support both IPv4 and IPv6
  user_agent TEXT,
  
  -- Signature tracking
  signature_url VARCHAR(500), -- URL to signed document
  
  -- Digital signature
  signature_hash VARCHAR(255), -- Hash for verification
  
  -- Timestamps
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_sow_id (sow_id),
  INDEX idx_accepted_email (accepted_email),
  INDEX idx_accepted_at (accepted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- SOW Rejections Table
-- ================================================================
CREATE TABLE IF NOT EXISTS sow_rejections (
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
  INDEX idx_rejected_at (rejected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- SOW Comments Table
-- ================================================================
CREATE TABLE IF NOT EXISTS sow_comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL,
  
  -- Comment details
  commenter_email VARCHAR(255) NOT NULL,
  commenter_name VARCHAR(255),
  comment_text TEXT NOT NULL,
  
  -- Metadata
  section_id VARCHAR(255), -- Which section of SOW (if applicable)
  is_internal BOOLEAN DEFAULT FALSE, -- Internal note vs client comment
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key
  FOREIGN KEY (sow_id) REFERENCES sows(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_sow_id (sow_id),
  INDEX idx_commenter_email (commenter_email),
  INDEX idx_created_at (created_at),
  INDEX idx_is_internal (is_internal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- AI Conversations Table (for chat history)
-- ================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sow_id VARCHAR(255) NOT NULL,
  
  -- Message details
  role ENUM('client', 'ai', 'system') NOT NULL,
  message TEXT NOT NULL,
  
  -- AI analysis
  buying_signal_detected BOOLEAN DEFAULT FALSE,
  sentiment VARCHAR(50), -- e.g., 'positive', 'negative', 'neutral', 'curious', 'excited'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Metadata
  metadata JSON, -- Store additional context
  
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

SELECT 'All missing tables created successfully!' as status;
