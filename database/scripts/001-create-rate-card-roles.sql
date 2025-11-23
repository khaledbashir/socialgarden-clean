-- ================================================================
-- SOCIAL GARDEN SOW GENERATOR
-- Rate Card Roles Table - Complete Migration Script
-- ================================================================
-- Purpose: Create and populate the official rate card
-- Database: socialgarden_sow
-- Version: 1.0
-- Last Updated: 2025-01-XX
-- ================================================================

-- Ensure we're using the correct database
USE socialgarden_sow;

-- ================================================================
-- STEP 1: Drop existing table (if needed for clean migration)
-- ================================================================
-- Uncomment the next line only if you need a complete reset
-- DROP TABLE IF EXISTS rate_card_roles;

-- ================================================================
-- STEP 2: Create rate_card_roles table
-- ================================================================
CREATE TABLE IF NOT EXISTS `rate_card_roles` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'Unique identifier for the role',
  `role_name` VARCHAR(500) NOT NULL UNIQUE COMMENT 'Official role name',
  `hourly_rate` DECIMAL(10,2) NOT NULL COMMENT 'Hourly rate in AUD',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Whether role is available for use',
  `description` TEXT COMMENT 'Role description and context',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',

  -- Performance indexes
  INDEX `idx_role_name` (`role_name`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_hourly_rate` (`hourly_rate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Official Social Garden Rate Card - Single Source of Truth';

-- ================================================================
-- STEP 3: Insert Social Garden's Official Rate Card (91 Roles)
-- ================================================================
-- Note: Using INSERT IGNORE to prevent duplicate key errors on re-runs
INSERT IGNORE INTO `rate_card_roles` (`id`, `role_name`, `hourly_rate`, `is_active`, `description`) VALUES

-- Account Management Roles
('rc-001', 'Account Management - (Senior Account Director)', 365.00, TRUE, 'Senior account direction and client strategy'),
('rc-002', 'Account Management - (Account Director)', 295.00, TRUE, 'Account director level management'),
('rc-003', 'Account Management - (Senior Account Manager)', 210.00, TRUE, 'Senior account management'),
('rc-004', 'Account Management - (Account Manager)', 180.00, TRUE, 'Standard account management'),
('rc-005', 'Account Management (Off)', 120.00, TRUE, 'Offshore account management support'),

-- Project Management Roles
('rc-006', 'Project Management - (Account Director)', 295.00, TRUE, 'Project management at director level'),
('rc-007', 'Project Management - (Account Manager)', 180.00, TRUE, 'Project management and coordination'),
('rc-008', 'Project Management - (Senior Account Manager)', 210.00, TRUE, 'Senior project management'),

-- Tech Delivery - Project Coordination
('rc-009', 'Tech - Delivery - Project Coordination', 110.00, TRUE, 'Project coordination support'),
('rc-010', 'Tech - Delivery - Project Management', 150.00, TRUE, 'Technical project management'),

-- Tech Head Of (Leadership)
('rc-011', 'Tech - Head Of - Senior Project Management', 365.00, TRUE, 'Head of senior project management'),
('rc-012', 'Tech - Head Of - Customer Experience Strategy', 365.00, TRUE, 'Head of customer experience'),
('rc-013', 'Tech - Head Of - Program Strategy', 365.00, TRUE, 'Head of program strategy'),
('rc-014', 'Tech - Head Of - System Setup', 365.00, TRUE, 'Head of system setup and architecture'),

-- Tech Senior Architect
('rc-015', 'Tech - Sr. Architect - Approval & Testing', 365.00, TRUE, 'Senior architect approval and QA'),
('rc-016', 'Tech - Sr. Architect - Consultancy Services', 365.00, TRUE, 'Senior architect consultancy'),
('rc-017', 'Tech - Sr. Architect - Data Strategy', 365.00, TRUE, 'Senior architect data strategy'),
('rc-018', 'Tech - Sr. Architect - Integration Strategy', 365.00, TRUE, 'Senior architect integration strategy'),

-- Tech Senior Consultant
('rc-019', 'Tech - Sr. Consultant - Admin Configuration', 295.00, TRUE, 'Senior consultant admin configuration'),
('rc-020', 'Tech - Sr. Consultant - Advisory & Consultation', 295.00, TRUE, 'Senior advisory consultation'),
('rc-021', 'Tech - Sr. Consultant - Approval & Testing', 295.00, TRUE, 'Senior consultant QA and testing'),
('rc-022', 'Tech - Sr. Consultant - Campaign Optimisation', 295.00, TRUE, 'Senior campaign optimization'),
('rc-023', 'Tech - Sr. Consultant - Campaign Strategy', 295.00, TRUE, 'Senior campaign strategy'),
('rc-024', 'Tech - Sr. Consultant - Database Management', 295.00, TRUE, 'Senior database management'),
('rc-025', 'Tech - Sr. Consultant - Reporting', 295.00, TRUE, 'Senior reporting and analytics'),
('rc-026', 'Tech - Sr. Consultant - Services', 295.00, TRUE, 'Senior consulting services'),
('rc-027', 'Tech - Sr. Consultant - Strategy', 295.00, TRUE, 'Senior strategic consultation'),
('rc-028', 'Tech - Sr. Consultant - Training', 295.00, TRUE, 'Senior training and enablement'),

-- Tech Integration
('rc-029', 'Tech - Integrations', 170.00, TRUE, 'Standard integration configuration'),
('rc-030', 'Tech - Integrations (Srn MAP)', 295.00, TRUE, 'Senior integration MAP specialist'),

-- Tech Specialist
('rc-031', 'Tech - Specialist - Admin Configuration', 180.00, TRUE, 'Specialist admin configuration'),
('rc-032', 'Tech - Specialist - Campaign Optimisation', 180.00, TRUE, 'Campaign optimization specialist'),
('rc-033', 'Tech - Specialist - Campaign Orchestration', 180.00, TRUE, 'Campaign orchestration specialist'),
('rc-034', 'Tech - Specialist - Database Management', 180.00, TRUE, 'Database management specialist'),
('rc-035', 'Tech - Specialist - Email Production', 180.00, TRUE, 'Email production specialist'),
('rc-036', 'Tech - Specialist - Integration Configuration', 180.00, TRUE, 'Integration configuration specialist'),
('rc-037', 'Tech - Specialist - Integration Services', 190.00, TRUE, 'Integration services specialist'),
('rc-038', 'Tech - Specialist - Lead Scoring Setup', 180.00, TRUE, 'Lead scoring setup specialist'),
('rc-039', 'Tech - Specialist - Program Management', 180.00, TRUE, 'Program management specialist'),
('rc-040', 'Tech - Specialist - Reporting', 180.00, TRUE, 'Reporting and analytics specialist'),
('rc-041', 'Tech - Specialist - Services', 180.00, TRUE, 'General technical services'),
('rc-042', 'Tech - Specialist - Testing', 180.00, TRUE, 'QA and testing specialist'),
('rc-043', 'Tech - Specialist - Training', 180.00, TRUE, 'Training specialist'),
('rc-044', 'Tech - Specialist - Workflows', 180.00, TRUE, 'Workflow automation specialist'),

-- Tech Research and Landing Pages
('rc-045', 'Tech - Keyword Research', 120.00, TRUE, 'Keyword research support'),
('rc-046', 'Tech - Landing Page - (Offshore)', 120.00, TRUE, 'Offshore landing page development'),
('rc-047', 'Tech - Landing Page - (Onshore)', 210.00, TRUE, 'Onshore landing page development'),

-- Tech Producer
('rc-048', 'Tech - Producer - Admin Configuration', 120.00, TRUE, 'Producer admin configuration'),
('rc-049', 'Tech - Producer - Campaign Build', 120.00, TRUE, 'Campaign build and execution'),
('rc-050', 'Tech - Producer - Chat Bot / Live Chat', 120.00, TRUE, 'Chatbot and live chat setup'),
('rc-051', 'Tech - Producer - Copywriting', 120.00, TRUE, 'Producer copywriting'),
('rc-052', 'Tech - Producer - Deployment', 120.00, TRUE, 'Deployment and go-live support'),
('rc-053', 'Tech - Producer - Design', 120.00, TRUE, 'Producer design work'),
('rc-054', 'Tech - Producer - Development', 120.00, TRUE, 'Producer development work'),
('rc-055', 'Tech - Producer - Documentation Setup', 120.00, TRUE, 'Documentation creation'),
('rc-056', 'Tech - Producer - Email Production', 120.00, TRUE, 'Email production and setup'),
('rc-057', 'Tech - Producer - Field / Property Setup', 120.00, TRUE, 'Field and property configuration'),
('rc-058', 'Tech - Producer - Integration Assistance', 120.00, TRUE, 'Integration support'),
('rc-059', 'Tech - Producer - Landing Page Production', 120.00, TRUE, 'Landing page production'),
('rc-060', 'Tech - Producer - Lead Scoring Setup', 120.00, TRUE, 'Lead scoring configuration'),
('rc-061', 'Tech - Producer - Reporting', 120.00, TRUE, 'Reporting setup'),
('rc-062', 'Tech - Producer - Services', 120.00, TRUE, 'General production services'),
('rc-063', 'Tech - Producer - SMS Setup', 120.00, TRUE, 'SMS and text setup'),
('rc-064', 'Tech - Producer - Support & Monitoring', 120.00, TRUE, 'Ongoing support and monitoring'),
('rc-065', 'Tech - Producer - Testing', 120.00, TRUE, 'Testing and QA support'),
('rc-066', 'Tech - Producer - Training', 120.00, TRUE, 'Training delivery and materials'),
('rc-067', 'Tech - Producer - Web Development', 120.00, TRUE, 'Web development support'),
('rc-068', 'Tech - Producer - Workflows', 120.00, TRUE, 'Workflow setup and automation'),

-- Tech SEO
('rc-069', 'Tech - SEO Producer', 120.00, TRUE, 'SEO production work'),
('rc-070', 'Tech - SEO Strategy', 180.00, TRUE, 'SEO strategy and consultation'),

-- Tech Website
('rc-071', 'Tech - Website Optimisation', 120.00, TRUE, 'Website optimization and improvement'),

-- Content Roles
('rc-072', 'Content - Campaign Strategy (Onshore)', 180.00, TRUE, 'Onshore campaign strategy'),
('rc-073', 'Content - Keyword Research (Offshore)', 120.00, TRUE, 'Offshore keyword research'),
('rc-074', 'Content - Keyword Research (Onshore)', 150.00, TRUE, 'Onshore keyword research'),
('rc-075', 'Content - Optimisation (Onshore)', 150.00, TRUE, 'Onshore content optimization'),
('rc-076', 'Content - Reporting (Offshore)', 120.00, TRUE, 'Offshore reporting'),
('rc-077', 'Content - Reporting (Onshore)', 150.00, TRUE, 'Onshore reporting'),
('rc-078', 'Content - SEO Copywriting (Onshore)', 150.00, TRUE, 'Onshore SEO copywriting'),
('rc-079', 'Content - SEO Strategy (Onshore)', 210.00, TRUE, 'Onshore SEO strategy'),
('rc-080', 'Content - Website Optimisations (Offshore)', 120.00, TRUE, 'Offshore website optimization'),

-- Copywriting Roles
('rc-081', 'Copywriting (Offshore)', 120.00, TRUE, 'Offshore copywriting services'),
('rc-082', 'Copywriting (Onshore)', 180.00, TRUE, 'Onshore copywriting services'),

-- Design Roles
('rc-083', 'Design - Digital Asset (Offshore)', 140.00, TRUE, 'Offshore digital asset design'),
('rc-084', 'Design - Digital Asset (Onshore)', 190.00, TRUE, 'Onshore digital asset design'),
('rc-085', 'Design - Email (Offshore)', 120.00, TRUE, 'Offshore email design'),
('rc-086', 'Design - Email (Onshore)', 295.00, TRUE, 'Onshore email design'),
('rc-087', 'Design - Landing Page (Offshore)', 120.00, TRUE, 'Offshore landing page design'),
('rc-088', 'Design - Landing Page (Onshore)', 190.00, TRUE, 'Onshore landing page design'),

-- Dev/Tech Landing Page Roles
('rc-089', 'Dev (orTech) - Landing Page - (Offshore)', 120.00, TRUE, 'Offshore landing page development'),
('rc-090', 'Dev (orTech) - Landing Page - (Onshore)', 210.00, TRUE, 'Onshore landing page development');

-- ================================================================
-- STEP 4: Verification Queries
-- ================================================================
-- Display summary statistics
SELECT '✅ Migration Complete' as status;
SELECT COUNT(*) as total_roles FROM rate_card_roles;
SELECT COUNT(*) as active_roles FROM rate_card_roles WHERE is_active = TRUE;
SELECT MIN(hourly_rate) as min_rate, MAX(hourly_rate) as max_rate, AVG(hourly_rate) as avg_rate FROM rate_card_roles WHERE is_active = TRUE;

-- Display sample of roles
SELECT '✅ Sample Roles:' as message;
SELECT role_name, hourly_rate FROM rate_card_roles WHERE is_active = TRUE ORDER BY hourly_rate DESC LIMIT 10;

-- Display all roles for verification (optional - comment out for production)
-- SELECT role_name, hourly_rate FROM rate_card_roles WHERE is_active = TRUE ORDER BY role_name ASC;
