-- Diagnostic script to check the user_preferences table structure
-- Run this script to verify the table was created correctly

-- Check if the table exists
SHOW TABLES LIKE 'user_preferences';

-- If the table exists, show its structure
DESCRIBE user_preferences;

-- Check the columns specifically
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM
  INFORMATION_SCHEMA.COLUMNS
WHERE
  TABLE_SCHEMA = 'socialgarden_sow'
  AND TABLE_NAME = 'user_preferences';

-- Show the CREATE TABLE statement
SHOW CREATE TABLE user_preferences;

-- Check the current database
SELECT DATABASE() as current_database;

-- Test a simple query
SELECT COUNT(*) as row_count FROM user_preferences;
