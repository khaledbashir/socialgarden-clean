#!/bin/bash

# 🔍 SOW QANDU.ME - Quick Verification Script
# Run this after updating environment variables in Easypanel

echo "🔍 SOW.QANDU.ME Health Check"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Frontend is up
echo -n "1️⃣  Frontend responding... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sow.qandu.me/)
if [ "$STATUS" == "200" ]; then
  echo -e "${GREEN}✅ 200 OK${NC}"
else
  echo -e "${RED}❌ Status $STATUS${NC}"
fi

# Test 2: AnythingLLM Chat (should still work)
echo -n "2️⃣  AnythingLLM Chat endpoint... "
RESPONSE=$(curl -s -X POST https://sow.qandu.me/api/anythingllm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "hello"}],
    "workspace": "pop"
  }')

if echo "$RESPONSE" | grep -q '"choices"'; then
  echo -e "${GREEN}✅ Working${NC}"
else
  echo -e "${RED}❌ Failed${NC}"
fi

# Test 3: OpenRouter API key (critical)
echo -n "3️⃣  OpenRouter API endpoint... "
RESPONSE=$(curl -s -X POST https://sow.qandu.me/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt":"test",
    "option":"generate",
    "command":"hello"
  }')

if echo "$RESPONSE" | grep -q '"error"'; then
  if echo "$RESPONSE" | grep -q '401'; then
    echo -e "${RED}❌ 401 Unauthorized - API key not updated in Easypanel!${NC}"
    echo "   Please update OPENROUTER_API_KEY in Easypanel environment"
  else
    echo -e "${YELLOW}⚠️  API Error (might be temporary)${NC}"
  fi
elif echo "$RESPONSE" | grep -q -E '[a-zA-Z]'; then
  echo -e "${GREEN}✅ Working${NC}"
else
  echo -e "${YELLOW}⚠️  No clear response${NC}"
fi

echo ""
echo "================================"
echo "✅ If all tests pass, you're ready for client demo!"
echo "❌ If test 3 fails, update OPENROUTER_API_KEY in Easypanel"
echo ""
echo "Quick Update Checklist:"
echo "1. Go to Easypanel Dashboard"
echo "2. Services → sow-qandu-me → Environment"
echo "3. Update: OPENROUTER_API_KEY=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"
echo "4. Save & Restart service"
echo "5. Run this script again"
echo ""

