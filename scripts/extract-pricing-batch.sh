#!/bin/bash
# Batch extract and update pricing from SOWs with pricing tables
# This script queries the Docker MySQL container, parses JSON, and updates each SOW

set -e

echo "========================================================================"
echo "🔄 Financial Data Migration - Batch Extraction"
echo "========================================================================"

CONTAINER_ID="ahmad_mysql-database.1.r460oc4y85bii82muxefe8rpi"
DB_USER="sg_sow_user"
DB_PASS="SG_sow_2025_SecurePass!"
DB_NAME="socialgarden_sow"

# Function to extract total from SOW content
extract_total() {
    local sow_id=$1
    local content=$(docker exec $CONTAINER_ID mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "SELECT content FROM sows WHERE id='$sow_id';")
    
    # Parse JSON and find the last rate=0 hours value
    # Using Python since it's more reliable for JSON extraction
    echo "$content" | python3 << 'PYEOF'
import sys, json
try:
    content = json.load(sys.stdin)
    if isinstance(content, dict) and 'content' in content:
        for node in content['content']:
            if node.get('type') == 'editablePricingTable':
                rows = node.get('attrs', {}).get('rows', [])
                for row in rows:
                    if row.get('rate') == 0 and row.get('hours', 0) > 0:
                        print(int(row['hours']))
                        exit(0)
except:
    pass
print(0)
PYEOF
}

echo ""
echo "📊 Fetching SOWs with pricing tables and zero investment..."
echo ""

# Get list of SOWs to process
SOWS=$(docker exec $CONTAINER_ID mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "
SELECT id FROM sows WHERE content LIKE '%editablePricingTable%' AND total_investment = 0;
")

# Convert to array
readarray -t SOWS_ARRAY <<< "$SOWS"

echo "Found ${#SOWS_ARRAY[@]} SOWs to process"
echo ""

TOTAL_EXTRACTED=0
SUCCESS_COUNT=0

# Process each SOW
for i in "${!SOWS_ARRAY[@]}"; do
    sow_id="${SOWS_ARRAY[$i]}"
    
    if [ -z "$sow_id" ]; then
        continue
    fi
    
    # Get title
    title=$(docker exec $CONTAINER_ID mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "SELECT title FROM sows WHERE id='$sow_id';")
    
    # Extract total
    total=$(extract_total "$sow_id")
    
    if [ "$total" -gt 0 ]; then
        echo "✅ [$((i+1))/${#SOWS_ARRAY[@]}] $title"
        echo "   ID: $sow_id | Total: \$$total AUD"
        
        # Update database
        docker exec $CONTAINER_ID mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
UPDATE sows SET total_investment = $total WHERE id = '$sow_id';
" > /dev/null
        
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        TOTAL_EXTRACTED=$((TOTAL_EXTRACTED + total))
    else
        echo "⚠️  [$((i+1))/${#SOWS_ARRAY[@]}] $title - No valid total found"
    fi
done

echo ""
echo "========================================================================"
echo "✅ MIGRATION COMPLETE"
echo "========================================================================"
echo ""
echo "📊 Results:"
echo "   Processed:      $SUCCESS_COUNT/${#SOWS_ARRAY[@]}"
echo "   Total Extracted: \$$TOTAL_EXTRACTED AUD"
echo ""

# Verify final state
FINAL=$(docker exec $CONTAINER_ID mysql -u $DB_USER -p$DB_PASS $DB_NAME -N -e "
SELECT 
  COUNT(*) as total_sows,
  SUM(total_investment) as total_value,
  SUM(IF(total_investment > 0, 1, 0)) as sows_with_values
FROM sows;
")

IFS=$'\t' read -r total_sows total_value sows_with_values <<< "$FINAL"

echo "📈 Final Dashboard Summary:"
echo "   Total SOWs:       $total_sows"
echo "   SOWs with values: $sows_with_values"
echo "   Total Investment: \$$total_value AUD"
echo ""
echo "✨ Dashboard financial data is now populated!"
echo ""
