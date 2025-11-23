#!/bin/bash

# Quick status check for SOW Generator services

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SOW GENERATOR STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Frontend (port 3333)
if lsof -ti:3333 > /dev/null 2>&1; then
    FRONTEND_PID=$(lsof -ti:3333)
    echo "✅ Frontend: RUNNING on port 3333 (PID: $FRONTEND_PID)"
    echo "   http://localhost:3333"
else
    echo "❌ Frontend: NOT RUNNING"
fi

echo ""

# Check Backend (port 8000)
if lsof -ti:8000 > /dev/null 2>&1; then
    BACKEND_PID=$(lsof -ti:8000)
    echo "✅ Backend:  RUNNING on port 8000 (PID: $BACKEND_PID)"
    echo "   http://localhost:8000"
else
    echo "❌ Backend:  NOT RUNNING"
fi

echo ""

# Check Database Connection
echo "🗄️  Database: Testing connection..."
if mysql -h 168.231.115.219 -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow -e "SELECT 1;" 2>/dev/null | grep -q 1; then
    echo "✅ Database: CONNECTED (168.231.115.219:3306)"
else
    echo "❌ Database: CONNECTION FAILED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 QUICK COMMANDS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ./dev.sh              - Start services"
echo "  ./status.sh           - Check status (this)"
echo "  tail -f /tmp/backend.log  - View backend logs"
echo ""
echo "  lsof -ti:3333 | xargs kill -9  - Kill frontend"
echo "  lsof -ti:8000 | xargs kill -9  - Kill backend"
echo ""
