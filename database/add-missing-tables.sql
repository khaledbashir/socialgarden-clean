-- Add missing tables for service catalog and recommendations
-- Only creates tables if they don't exist

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

SELECT 'Missing tables created successfully!' as status;
