-- Batch Financial Data Extraction Script
-- Purpose: Extract pricing totals from all SOWs with pricing tables
-- 
-- This script:
-- 1. Identifies SOWs with editablePricingTable in content
-- 2. Extracts TOTAL row hours value from JSON
-- 3. Updates total_investment for all processable SOWs
-- 4. Verifies results
--
-- Run: docker exec [container] mysql -u [user] -p[pass] [db] < extract-pricing-batch.sql

-- Step 1: Verify we can identify SOWs with pricing tables
SELECT 
  COUNT(*) as total_sows,
  SUM(IF(content LIKE '%editablePricingTable%', 1, 0)) as with_pricing_tables,
  SUM(IF(content LIKE '%editablePricingTable%' AND total_investment = 0, 1, 0)) as unpopulated_with_pricing
FROM sows;

-- Step 2: Extract and display pricing totals for debugging
SELECT 
  id,
  title,
  -- Extract hours from JSON: find the last "hours" value before rate=0
  -- In TipTap pricing tables, TOTAL row stores amount in "hours" field
  CAST(
    SUBSTRING_INDEX(
      SUBSTRING_INDEX(
        SUBSTRING(content, POSITION('"rate":0' IN content) - 50, 50),
        '"hours":',
        -1
      ),
      ',',
      1
    ) AS DECIMAL(10, 2)
  ) as extracted_total,
  total_investment as current_value
FROM sows 
WHERE content LIKE '%editablePricingTable%' 
  AND total_investment = 0
LIMIT 15;

-- Step 3: Create temporary table for safe processing
CREATE TEMPORARY TABLE pricing_updates AS
SELECT 
  id,
  title,
  CAST(
    SUBSTRING_INDEX(
      SUBSTRING_INDEX(
        SUBSTRING(content, POSITION('"rate":0' IN content) - 50, 50),
        '"hours":',
        -1
      ),
      ',',
      1
    ) AS DECIMAL(10, 2)
  ) as new_total
FROM sows 
WHERE content LIKE '%editablePricingTable%' 
  AND (total_investment = 0 OR total_investment IS NULL);

-- Step 4: Show what will be updated
SELECT 
  COUNT(*) as sows_to_update,
  SUM(new_total) as total_value_to_add,
  MIN(new_total) as min_value,
  MAX(new_total) as max_value
FROM pricing_updates;

-- Step 5: Execute updates
UPDATE sows s
INNER JOIN pricing_updates p ON s.id = p.id
SET s.total_investment = p.new_total
WHERE p.new_total > 0;

-- Step 6: Verify updates
SELECT 
  COUNT(*) as sows_with_values,
  SUM(total_investment) as total_investment_value,
  AVG(total_investment) as avg_per_sow,
  MIN(total_investment) as min_sow_value,
  MAX(total_investment) as max_sow_value
FROM sows
WHERE total_investment > 0;

-- Step 7: Final dashboard summary
SELECT 
  COUNT(*) as total_sows,
  SUM(total_investment) as total_investment,
  SUM(IF(total_investment > 0, 1, 0)) as sows_with_values,
  SUM(IF(total_investment = 0, 1, 0)) as sows_with_zero
FROM sows;

-- Step 8: Show top SOWs by value
SELECT 
  id,
  title,
  total_investment,
  vertical,
  service_line
FROM sows
WHERE total_investment > 0
ORDER BY total_investment DESC
LIMIT 10;
