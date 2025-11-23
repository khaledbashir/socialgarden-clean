-- Migration: Add thread_slug column to sows table
-- Date: October 22, 2025
-- Purpose: Store AnythingLLM thread UUID for SOW-specific chat threads

-- Check if column exists before adding
SELECT IF (
  EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_name='sows' AND column_name='thread_slug'
  ),
  'SELECT "Column thread_slug already exists"',
  'ALTER TABLE sows ADD COLUMN thread_slug VARCHAR(255) AFTER workspace_slug'
) INTO @sql;

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
