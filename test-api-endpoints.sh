#!/bin/bash

# Test script for API endpoints that were failing
# Run this after starting dev server with ./dev.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TESTING API ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="http://localhost:5000"

# Test 1: POST /api/sow/create with camelCase
echo "📝 Test 1: POST /api/sow/create (camelCase)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${BASE_URL}/api/sow/create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test SOW - CamelCase",
    "clientName": "Test Client Corp",
    "clientEmail": "test@example.com",
    "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test content"}]}]},
    "totalInvestment": 5000,
    "folderId": "test-folder-123"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS (200)"
    echo "Response: $BODY"
else
    echo "❌ FAILED (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 2: POST /api/sow/create with snake_case
echo "📝 Test 2: POST /api/sow/create (snake_case)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${BASE_URL}/api/sow/create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test SOW - SnakeCase",
    "client_name": "Test Client Ltd",
    "client_email": "test2@example.com",
    "content": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test content"}]}]},
    "total_investment": 7500,
    "folder_id": "test-folder-456"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS (200)"
    echo "Response: $BODY"
else
    echo "❌ FAILED (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 3: POST /api/sow/create with missing required field
echo "📝 Test 3: POST /api/sow/create (missing title - should return 400)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${BASE_URL}/api/sow/create" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "No Title Client",
    "content": {"type": "doc", "content": []}
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "400" ]; then
    echo "✅ SUCCESS (400 as expected)"
    echo "Response: $BODY"
else
    echo "⚠️  Unexpected HTTP code: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 4: POST /api/agents/:id/messages
echo "📝 Test 4: POST /api/agents/gen-the-architect/messages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${BASE_URL}/api/agents/gen-the-architect/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test message from script",
    "role": "user"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ SUCCESS (201)"
    echo "Response: $BODY"
else
    echo "❌ FAILED (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 5: GET /api/agents/:id/messages
echo "📝 Test 5: GET /api/agents/gen-the-architect/messages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET \
  "${BASE_URL}/api/agents/gen-the-architect/messages")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS (200)"
    echo "Response (first 200 chars): ${BODY:0:200}..."
else
    echo "❌ FAILED (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 API TESTS COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
