#!/bin/bash

# 🧹 CONSOLE.LOG CLEANUP SCRIPT
# Removes all console.logs from frontend code (except in .next/ and node_modules/)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 CLEANING CONSOLE.LOGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd /root/the11/frontend

# Find all console.log lines
echo ""
echo "📊 Found these console.log statements:"
echo ""
grep -rn "console\." app/ components/ lib/ 2>/dev/null | grep -v "node_modules" | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Replace with safe logger"
echo "  1. Open each file found above"
echo "  2. Replace: console.log → debug"
echo "  3. Replace: console.error → error"
echo "  4. Add: import { debug, error } from '@/lib/logger'"
echo ""
echo "Option 2: Remove all console.logs (risky)"
echo "  sed -i '/console\.log/d' app/page.tsx"
echo "  sed -i '/console\.log/d' components/tailwind/agent-sidebar-clean.tsx"
echo "  sed -i '/console\.log/d' lib/anythingllm.ts"
echo ""
echo "ℹ️  Use '/lib/logger.ts' for safe logging in production!"
echo ""
