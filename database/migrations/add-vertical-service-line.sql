-- Migration: Add Vertical and Service Line Classification
-- Date: October 23, 2025
-- Purpose: Enable Social Garden business intelligence dashboard

-- Add vertical and service_line columns to existing sows table
ALTER TABLE sows 
  ADD COLUMN vertical ENUM('property', 'education', 'finance', 'healthcare', 'retail', 'hospitality', 'professional-services', 'technology', 'other') DEFAULT NULL AFTER creator_email,
  ADD COLUMN service_line ENUM('crm-implementation', 'marketing-automation', 'revops-strategy', 'managed-services', 'consulting', 'training', 'other') DEFAULT NULL AFTER vertical,
  ADD INDEX idx_vertical (vertical),
  ADD INDEX idx_service_line (service_line);

-- Verify migration
SELECT 'Migration complete! New columns added:' as status;
DESCRIBE sows;

SELECT CONCAT('Total SOWs: ', COUNT(*), ' (', 
  SUM(CASE WHEN vertical IS NULL THEN 1 ELSE 0 END), ' need vertical classification, ',
  SUM(CASE WHEN service_line IS NULL THEN 1 ELSE 0 END), ' need service line classification)') 
as summary 
FROM sows;
