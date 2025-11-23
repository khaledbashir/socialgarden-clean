-- Social Garden SOW Generator - Database Setup Script
-- Run this to create the database and user

-- Create database
CREATE DATABASE IF NOT EXISTS socialgarden_sow 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Create user (change password in production!)
CREATE USER IF NOT EXISTS 'sg_sow_user'@'localhost' IDENTIFIED BY 'SG_sow_2025_SecurePass!';

-- Grant privileges
GRANT ALL PRIVILEGES ON socialgarden_sow.* TO 'sg_sow_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Use the database
USE socialgarden_sow;

-- Success message
SELECT 'Database "socialgarden_sow" created successfully!' as status;
SELECT 'User "sg_sow_user" created with full privileges' as user_info;
SELECT 'Next step: Run schema.sql to create tables' as next_step;
