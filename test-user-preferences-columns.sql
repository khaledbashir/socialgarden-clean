-- Test script to verify the exact column names in user_preferences table
-- This will help identify any case sensitivity or naming issues

-- 1. Check exact column names with case sensitivity
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'socialgarden_sow'
    AND TABLE_NAME = 'user_preferences'
ORDER BY
    ORDINAL_POSITION;

-- 2. Try a direct query with column names in backticks (case-sensitive)
SELECT `id`, `user_id`, `preference_key`, `preference_value`, `created_at`, `updated_at`
FROM user_preferences
LIMIT 0; -- Should return empty result set but no error if columns exist

-- 3. Test the exact query used in the application
SELECT preference_key, preference_value
FROM user_preferences
WHERE user_id = 'test-user'
LIMIT 0; -- Should return empty result set but no error if columns exist

-- 4. Alternative query with backticks
SELECT `preference_key`, `preference_value`
FROM `user_preferences`
WHERE `user_id` = 'test-user'
LIMIT 0; -- Should return empty result set but no error if columns exist

-- 5. Check for any similar column names that might cause confusion
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'socialgarden_sow'
    AND TABLE_NAME = 'user_preferences'
    AND COLUMN_NAME LIKE '%user%';
