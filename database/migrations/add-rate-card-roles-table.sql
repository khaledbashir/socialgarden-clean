-- ================================================================
-- Rate Card Roles Table Migration
-- ================================================================
-- Purpose: Single source of truth for all roles and hourly rates
-- Created: 2025-10-27
-- Feature: Global Rate Card Management System

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS rate_card_roles;

-- ================================================================
-- Rate Card Roles Table
-- ================================================================
CREATE TABLE rate_card_roles (
  id VARCHAR(36) PRIMARY KEY,
  role_name VARCHAR(500) NOT NULL UNIQUE,
  hourly_rate DECIMAL(10,2) NOT NULL,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for performance
  INDEX idx_role_name (role_name),
  INDEX idx_is_active (is_active),
  INDEX idx_hourly_rate (hourly_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Seed Data: Official Master Rate Card (Single Source of Truth)
-- ================================================================
INSERT INTO rate_card_roles (id, role_name, hourly_rate) VALUES
('rc-001', 'Account Management - (Senior Account Director)', 365.00),
('rc-002', 'Account Management - (Account Director)', 295.00),
('rc-003', 'Account Management - (Senior Account Manager)', 210.00),
('rc-004', 'Account Management - (Account Manager)', 180.00),
('rc-005', 'Account Management (Off)', 120.00),
('rc-006', 'Project Management - (Account Director)', 295.00),
('rc-007', 'Project Management - (Account Manager)', 180.00),
('rc-008', 'Project Management - (Senior Account Manager)', 210.00),
('rc-009', 'Tech - Delivery - Project Coordination', 110.00),
('rc-010', 'Tech - Delivery - Project Management', 150.00),
('rc-011', 'Tech - Head Of - Senior Project Management', 365.00),
('rc-012', 'Tech - Head Of - Customer Experience Strategy', 365.00),
('rc-013', 'Tech - Head Of - Program Strategy', 365.00),
('rc-014', 'Tech - Head Of - System Setup', 365.00),
('rc-015', 'Tech - Sr. Architect - Approval & Testing', 365.00),
('rc-016', 'Tech - Sr. Architect - Consultancy Services', 365.00),
('rc-017', 'Tech - Sr. Architect - Data Strategy', 365.00),
('rc-018', 'Tech - Sr. Architect - Integration Strategy', 365.00),
('rc-019', 'Tech - Sr. Consultant - Admin Configuration', 295.00),
('rc-020', 'Tech - Sr. Consultant - Advisory & Consultation', 295.00),
('rc-021', 'Tech - Sr. Consultant - Approval & Testing', 295.00),
('rc-022', 'Tech - Sr. Consultant - Campaign Optimisation', 295.00),
('rc-023', 'Tech - Sr. Consultant - Campaign Strategy', 295.00),
('rc-024', 'Tech - Sr. Consultant - Database Management', 295.00),
('rc-025', 'Tech - Sr. Consultant - Reporting', 295.00),
('rc-026', 'Tech - Sr. Consultant - Services', 295.00),
('rc-027', 'Tech - Sr. Consultant - Strategy', 295.00),
('rc-028', 'Tech - Sr. Consultant - Training', 295.00),
('rc-029', 'Tech - Integrations', 170.00),
('rc-030', 'Tech - Integrations (Srn MAP)', 295.00),
('rc-031', 'Tech - Specialist - Admin Configuration', 180.00),
('rc-032', 'Tech - Specialist - Campaign Optimisation', 180.00),
('rc-033', 'Tech - Specialist - Campaign Orchestration', 180.00),
('rc-034', 'Tech - Specialist - Database Management', 180.00),
('rc-035', 'Tech - Specialist - Email Production', 180.00),
('rc-036', 'Tech - Specialist - Integration Configuration', 180.00),
('rc-037', 'Tech - Specialist - Integration Services', 190.00),
('rc-038', 'Tech - Specialist - Lead Scoring Setup', 180.00),
('rc-039', 'Tech - Specialist - Program Management', 180.00),
('rc-040', 'Tech - Specialist - Reporting', 180.00),
('rc-041', 'Tech - Specialist - Services', 180.00),
('rc-042', 'Tech - Specialist - Testing', 180.00),
('rc-043', 'Tech - Specialist - Training', 180.00),
('rc-044', 'Tech - Specialist - Workflows', 180.00),
('rc-045', 'Tech - Keyword Research', 120.00),
('rc-046', 'Tech - Landing Page - (Offshore)', 120.00),
('rc-047', 'Tech - Landing Page - (Onshore)', 210.00),
('rc-048', 'Tech - Producer - Admin Configuration', 120.00),
('rc-049', 'Tech - Producer - Campaign Build', 120.00),
('rc-050', 'Tech - Producer - Chat Bot / Live Chat', 120.00),
('rc-051', 'Tech - Producer - Copywriting', 120.00),
('rc-052', 'Tech - Producer - Deployment', 120.00),
('rc-053', 'Tech - Producer - Design', 120.00),
('rc-054', 'Tech - Producer - Development', 120.00),
('rc-055', 'Tech - Producer - Documentation Setup', 120.00),
('rc-056', 'Tech - Producer - Email Production', 120.00),
('rc-057', 'Tech - Producer - Field / Property Setup', 120.00),
('rc-058', 'Tech - Producer - Integration Assistance', 120.00),
('rc-059', 'Tech - Producer - Landing Page Production', 120.00),
('rc-060', 'Tech - Producer - Lead Scoring Setup', 120.00),
('rc-061', 'Tech - Producer - Reporting', 120.00),
('rc-062', 'Tech - Producer - Services', 120.00),
('rc-063', 'Tech - Producer - SMS Setup', 120.00),
('rc-064', 'Tech - Producer - Support & Monitoring', 120.00),
('rc-065', 'Tech - Producer - Testing', 120.00),
('rc-066', 'Tech - Producer - Training', 120.00),
('rc-067', 'Tech - Producer - Web Development', 120.00),
('rc-068', 'Tech - Producer - Workflows', 120.00),
('rc-069', 'Tech - SEO Producer', 120.00),
('rc-070', 'Tech - SEO Strategy', 180.00),
('rc-071', 'Tech - Website Optimisation', 120.00),
('rc-072', 'Content - Campaign Strategy (Onshore)', 180.00),
('rc-073', 'Content - Keyword Research (Offshore)', 120.00),
('rc-074', 'Content - Keyword Research (Onshore)', 150.00),
('rc-075', 'Content - Optimisation (Onshore)', 150.00),
('rc-076', 'Content - Reporting (Offshore)', 120.00),
('rc-077', 'Content - Reporting (Onshore)', 150.00),
('rc-078', 'Content - SEO Copywriting (Onshore)', 150.00),
('rc-079', 'Content - SEO Strategy (Onshore)', 210.00),
('rc-080', 'Content - Website Optimisations (Offshore)', 120.00),
('rc-081', 'Copywriting (Offshore)', 120.00),
('rc-082', 'Copywriting (Onshore)', 180.00),
('rc-083', 'Design - Digital Asset (Offshore)', 140.00),
('rc-084', 'Design - Digital Asset (Onshore)', 190.00),
('rc-085', 'Design - Email (Offshore)', 120.00),
('rc-086', 'Design - Email (Onshore)', 295.00),
('rc-087', 'Design - Landing Page (Offshore)', 120.00),
('rc-088', 'Design - Landing Page (Onshore)', 190.00),
('rc-089', 'Dev (orTech) - Landing Page - (Offshore)', 120.00),
('rc-090', 'Dev (orTech) - Landing Page - (Onshore)', 210.00);

-- ================================================================
-- Success Message
-- ================================================================
SELECT 'Rate Card Roles table created and seeded successfully!' as status;
SELECT COUNT(*) as total_roles FROM rate_card_roles;
