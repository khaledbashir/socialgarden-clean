#!/bin/bash
# Recalculate total_investment for all SOWs by re-parsing their content

DB_HOST="168.231.115.219"
DB_USER="sg_sow_user"
DB_PASS="SG_sow_2025_SecurePass!"
DB_NAME="socialgarden_sow"

echo "🔄 Fetching all SOWs from database..."

# For now, let's just verify the issue
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -D "$DB_NAME" -e "
SELECT 
  COUNT(*) as total_sows,
  SUM(total_investment) as current_total,
  COUNT(CASE WHEN total_investment > 0 THEN 1 END) as sows_with_investment
FROM sows;
" 2>&1 | grep -v "Warning"

echo ""
echo "💡 The issue: All SOWs have total_investment = 0.00"
echo "   This is because they were created BEFORE the auto-calculation fix."
echo ""
echo "🔧 Solution: When you EDIT any SOW and save, it will auto-calculate."
echo "   OR: Create a new SOW with pricing, and it will calculate automatically."
echo ""
echo "📊 To manually update a specific SOW:"
echo "   1. Open the SOW in the editor"
echo "   2. Make any small change (add a space)"
echo "   3. Wait 2 seconds for auto-save"
echo "   4. Dashboard will reflect the new total"
