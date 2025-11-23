#!/bin/bash

# API Endpoint Testing Script
# Tests the fixed endpoints with various payloads

echo "=========================================="
echo "Testing API Endpoints"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Testing /api/sow/create with camelCase payload${NC}"
echo "-------------------------------------------"
curl -X POST "${BASE_URL}/api/sow/create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test SOW - CamelCase",
    "clientName": "Test Client Corp",
    "clientEmail": "test@example.com",
    "content": {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test content"}]}]},
    "totalInvestment": 5000,
    "folderId": "test-folder-123"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

echo -e "${YELLOW}2. Testing /api/sow/create with snake_case payload${NC}"
echo "-------------------------------------------"
curl -X POST "${BASE_URL}/api/sow/create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test SOW - Snake Case",
    "client_name": "Another Test Client",
    "client_email": "snake@example.com",
    "content": {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test content snake"}]}]},
    "total_investment": 7500,
    "folder_id": "test-folder-456"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

echo -e "${YELLOW}3. Testing /api/sow/create with MISSING required fields (should 400)${NC}"
echo "-------------------------------------------"
curl -X POST "${BASE_URL}/api/sow/create" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Missing Content Test"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

echo -e "${YELLOW}4. Testing POST /api/agents/gen-the-architect/messages${NC}"
echo "-------------------------------------------"
curl -X POST "${BASE_URL}/api/agents/gen-the-architect/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test message using content field",
    "role": "user"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

echo -e "${YELLOW}5. Testing POST /api/agents/gen-the-architect/messages (using 'message' field)${NC}"
echo "-------------------------------------------"
curl -X POST "${BASE_URL}/api/agents/gen-the-architect/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message using message field",
    "role": "user"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

echo -e "${YELLOW}6. Testing GET /api/agents/gen-the-architect/messages${NC}"
echo "-------------------------------------------"
curl -X GET "${BASE_URL}/api/agents/gen-the-architect/messages" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.[0:3]' 2>/dev/null || cat
echo ""
echo ""

echo -e "${YELLOW}7. Testing /api/anythingllm/chat (with workspace)${NC}"
echo "-------------------------------------------"
curl -X POST "${BASE_URL}/api/anythingllm/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, this is a test"}
    ],
    "workspace": "gen"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

echo -e "${YELLOW}8. Testing /api/dashboard/chat${NC}"
echo "-------------------------------------------"
curl -X POST "${BASE_URL}/api/dashboard/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Show me dashboard stats"}
    ]
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || cat
echo ""
echo ""

echo "=========================================="
echo -e "${GREEN}Testing Complete!${NC}"
echo "=========================================="
echo ""
echo "Check the server logs in your main terminal for detailed debugging output"
echo "Expected results:"
echo "  - Tests 1-2: Should return 200 with sowId"
echo "  - Test 3: Should return 400 with clear error message"
echo "  - Tests 4-5: Should return 201 (created)"
echo "  - Test 6: Should return 200 with message array"
echo "  - Tests 7-8: Should return 200 with AI response (or appropriate error)"
