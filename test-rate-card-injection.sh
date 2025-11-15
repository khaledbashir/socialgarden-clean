#!/bin/bash

echo "🔍 Testing Rate Card Injection System"
echo "======================================"
echo ""

# Test 1: Check if frontend is running
echo "1️⃣ Testing frontend server..."
FRONTEND_URL="http://localhost:3000"
RATE_CARD_ENDPOINT="$FRONTEND_URL/api/rate-card/markdown"

echo "   Endpoint: $RATE_CARD_ENDPOINT"
RESPONSE=$(curl -s -w "\n%{http_code}" "$RATE_CARD_ENDPOINT")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "   HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Rate card API is working!"
    echo ""
    echo "   Response preview:"
    echo "$BODY" | head -20
    echo ""

    # Check if it contains rate data
    if echo "$BODY" | grep -q "roleCount"; then
        ROLE_COUNT=$(echo "$BODY" | grep -o '"roleCount":[0-9]*' | cut -d: -f2)
        echo "   ✅ Found $ROLE_COUNT roles in database"
    else
        echo "   ❌ Response doesn't contain roleCount"
    fi
else
    echo "   ❌ Rate card API failed with status $HTTP_CODE"
    echo "   Response:"
    echo "$BODY" | head -10
fi

echo ""
echo "2️⃣ Testing if database connection works..."
DATABASE_URL="${DATABASE_URL:-}"
if [ -z "$DATABASE_URL" ]; then
    echo "   ⚠️  DATABASE_URL not set in environment"
    echo "   Please set: export DATABASE_URL='postgresql://...'"
else
    echo "   ✅ DATABASE_URL is set"
    echo "   (Not executing query for safety)"
fi

echo ""
echo "3️⃣ Checking AnythingLLM connection..."
ANYTHINGLLM_URL="${ANYTHINGLLM_URL:-http://localhost:3001}"
echo "   Testing: $ANYTHINGLLM_URL/api/v1/system/agents"

AGENT_RESPONSE=$(curl -s -w "\n%{http_code}" "$ANYTHINGLLM_URL/api/v1/system/agents")
AGENT_HTTP=$(echo "$AGENT_RESPONSE" | tail -n1)
AGENT_BODY=$(echo "$AGENT_RESPONSE" | head -n-1)

if [ "$AGENT_HTTP" = "200" ]; then
    echo "   ✅ AnythingLLM is accessible"
    AGENT_COUNT=$(echo "$AGENT_BODY" | grep -o '"agents"' | wc -l)
    echo "   Response size: $(echo "$AGENT_BODY" | wc -c) bytes"
else
    echo "   ❌ AnythingLLM connection failed: $AGENT_HTTP"
fi

echo ""
echo "4️⃣ Summary"
echo "=========="

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Rate card injection system is ready"
    echo "   The AI should receive rate card context with every request"
else
    echo "❌ Rate card injection system has issues"
    echo "   Check:"
    echo "   1. Is the frontend server running? (npm run dev)"
    echo "   2. Is the database connected?"
    echo "   3. Check DATABASE_URL environment variable"
    echo "   4. Check frontend logs for errors"
fi

echo ""
echo "🔧 To debug further:"
echo "   1. Check frontend logs: tail -f .next/logs"
echo "   2. Check database: psql \$DATABASE_URL -c 'SELECT COUNT(*) FROM rate_card_roles;'"
echo "   3. Test rate card directly: curl -v http://localhost:3000/api/rate-card/markdown"
echo ""
