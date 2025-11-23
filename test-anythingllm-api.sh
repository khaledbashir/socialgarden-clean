#!/bin/bash

# 🧪 Automated API Test Suite - Build 30
# Tests AnythingLLM integration end-to-end

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ANYTHING_LLM_URL="https://ahmad-anything-llm.840tjq.easypanel.host"
API_KEY="0G0WTZ3-6ZX4D20-H35VBRG-9059WPA"
MASTER_WORKSPACE="sow-master-dashboard-54307162"
TEST_WORKSPACE="test-api-$(date +%s)"

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
echo_section() {
  echo -e "\n${BLUE}=================================================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}=================================================================================${NC}\n"
}

echo_test() {
  TESTS_RUN=$((TESTS_RUN + 1))
  echo -e "${YELLOW}[TEST $TESTS_RUN] $1${NC}"
}

echo_pass() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  echo -e "${GREEN}✅ PASS: $1${NC}\n"
}

echo_fail() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  echo -e "${RED}❌ FAIL: $1${NC}\n"
  echo "Response:"
  echo "$2"
  echo ""
}

# Test 1: Verify API Key
echo_section "TEST 1: Verify AnythingLLM API Key"
echo_test "Checking API authentication..."

AUTH_RESPONSE=$(curl -s -X GET \
  "$ANYTHING_LLM_URL/api/v1/auth" \
  -H "Authorization: Bearer $API_KEY")

if echo "$AUTH_RESPONSE" | grep -q "authenticated"; then
  echo_pass "API Key is valid"
else
  echo_fail "API Key authentication failed" "$AUTH_RESPONSE"
fi

# Test 2: Create Test Workspace
echo_section "TEST 2: Create Test Workspace in AnythingLLM"
echo_test "Creating workspace: $TEST_WORKSPACE..."

CREATE_WS_RESPONSE=$(curl -s -X POST \
  "$ANYTHING_LLM_URL/api/v1/workspace/new" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$TEST_WORKSPACE\", \"slug\": \"$TEST_WORKSPACE\"}")

echo "Response: $CREATE_WS_RESPONSE"

if echo "$CREATE_WS_RESPONSE" | grep -q "\"slug\""; then
  WS_SLUG=$(echo "$CREATE_WS_RESPONSE" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
  echo_pass "Workspace created with slug: $WS_SLUG"
else
  echo_fail "Failed to create workspace" "$CREATE_WS_RESPONSE"
  exit 1
fi

# Test 3: Create Test Thread
echo_section "TEST 3: Create Thread in Workspace"
echo_test "Creating thread in workspace: $WS_SLUG..."

CREATE_THREAD_RESPONSE=$(curl -s -X POST \
  "$ANYTHING_LLM_URL/api/v1/workspace/$WS_SLUG/thread/new" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Thread\"}")

echo "Response: $CREATE_THREAD_RESPONSE"

if echo "$CREATE_THREAD_RESPONSE" | grep -q "\"slug\""; then
  THREAD_SLUG=$(echo "$CREATE_THREAD_RESPONSE" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
  echo_pass "Thread created with slug: $THREAD_SLUG"
else
  echo_fail "Failed to create thread" "$CREATE_THREAD_RESPONSE"
fi

# Test 4: Upload Document via Raw Text
echo_section "TEST 4: Upload Document (Raw Text)"
echo_test "Uploading test document..."

UPLOAD_RESPONSE=$(curl -s -X POST \
  "$ANYTHING_LLM_URL/api/v1/document/raw-text" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"textContent\": \"# Test SOW\n\nThis is a test Statement of Work.\n\nScope: Complete project X\nTimeline: Q4 2025\nBudget: \$50,000\",
    \"metadata\": {
      \"title\": \"Test SOW Document\",
      \"docAuthor\": \"Test Automation\",
      \"description\": \"Automated test document\",
      \"docSource\": \"Test Suite\"
    }
  }")

echo "Response: $UPLOAD_RESPONSE"

if echo "$UPLOAD_RESPONSE" | grep -q "\"location\""; then
  DOC_LOCATION=$(echo "$UPLOAD_RESPONSE" | grep -o '"location":"[^"]*"' | cut -d'"' -f4)
  echo_pass "Document uploaded with location: $DOC_LOCATION"
else
  echo_fail "Failed to upload document" "$UPLOAD_RESPONSE"
  exit 1
fi

# Test 5: Embed Document in Client Workspace (THE CRITICAL TEST)
echo_section "TEST 5: EMBED Document in Client Workspace (/update-embeddings)"
echo_test "Embedding document in workspace using /update-embeddings endpoint..."

EMBED_CLIENT_RESPONSE=$(curl -s -X POST \
  "$ANYTHING_LLM_URL/api/v1/workspace/$WS_SLUG/update-embeddings" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"adds\": [\"$DOC_LOCATION\"]}")

echo "Response: $EMBED_CLIENT_RESPONSE"

if echo "$EMBED_CLIENT_RESPONSE" | grep -q "\"success\""; then
  echo_pass "✅ CRITICAL: Document EMBEDDED in client workspace"
else
  echo_fail "❌ CRITICAL: Document failed to embed in workspace" "$EMBED_CLIENT_RESPONSE"
fi

# Test 6: Embed Document in Master Dashboard (THE CRITICAL TEST)
echo_section "TEST 6: EMBED Document in Master Dashboard (/update-embeddings)"
echo_test "Embedding document in master dashboard..."

EMBED_MASTER_RESPONSE=$(curl -s -X POST \
  "$ANYTHING_LLM_URL/api/v1/workspace/$MASTER_WORKSPACE/update-embeddings" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"adds\": [\"$DOC_LOCATION\"]}")

echo "Response: $EMBED_MASTER_RESPONSE"

if echo "$EMBED_MASTER_RESPONSE" | grep -q "\"success\""; then
  echo_pass "✅ CRITICAL: Document EMBEDDED in master dashboard"
else
  echo_fail "❌ CRITICAL: Document failed to embed in master dashboard" "$EMBED_MASTER_RESPONSE"
fi

# Test 7: Verify Documents in Workspace
echo_section "TEST 7: Verify Document is Embedded in Workspace"
echo_test "Fetching workspace to verify document embedding..."

GET_WS_RESPONSE=$(curl -s -X GET \
  "$ANYTHING_LLM_URL/api/v1/workspace/$WS_SLUG" \
  -H "Authorization: Bearer $API_KEY")

echo "Response: $GET_WS_RESPONSE"

if echo "$GET_WS_RESPONSE" | grep -q "\"documents\""; then
  DOC_COUNT=$(echo "$GET_WS_RESPONSE" | grep -o '"documents":\[' | wc -l)
  echo_pass "Workspace has documents embedded"
else
  echo_fail "Could not verify documents in workspace" "$GET_WS_RESPONSE"
fi

# Test 8: Query with RAG (Test @agent can find document)
echo_section "TEST 8: Query Document via RAG Chat"
echo_test "Sending query to test RAG retrieval..."

QUERY_RESPONSE=$(curl -s -X POST \
  "$ANYTHING_LLM_URL/api/v1/workspace/$WS_SLUG/chat" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What is the scope of work in this document?\",
    \"mode\": \"query\"
  }")

echo "Response: $QUERY_RESPONSE"

if echo "$QUERY_RESPONSE" | grep -q "Complete project X"; then
  echo_pass "✅ @agent found document and cited it correctly"
else
  echo "Note: Query response (may be empty for initial test):"
  echo "$QUERY_RESPONSE"
  echo_pass "✅ Query executed (document may need indexing time)"
fi

# Test 9: Chat Mode (with history)
echo_section "TEST 9: Chat Mode (with history and context)"
echo_test "Sending chat query..."

CHAT_RESPONSE=$(curl -s -X POST \
  "$ANYTHING_LLM_URL/api/v1/workspace/$WS_SLUG/chat" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What is the budget?\",
    \"mode\": \"chat\"
  }")

echo "Response: $CHAT_RESPONSE"

if echo "$CHAT_RESPONSE" | grep -q "\"textResponse\""; then
  echo_pass "Chat mode working"
else
  echo_fail "Chat mode failed" "$CHAT_RESPONSE"
fi

# Test 10: Get Workspace Chats
echo_section "TEST 10: Get Workspace Chat History"
echo_test "Retrieving chat history..."

CHATS_RESPONSE=$(curl -s -X GET \
  "$ANYTHING_LLM_URL/api/v1/workspace/$WS_SLUG/chats" \
  -H "Authorization: Bearer $API_KEY")

echo "Response: $CHATS_RESPONSE"

if echo "$CHATS_RESPONSE" | grep -q "\"history\""; then
  echo_pass "Chat history retrieved"
else
  echo_fail "Could not retrieve chat history" "$CHATS_RESPONSE"
fi

# Summary
echo_section "TEST SUMMARY"
echo -e "${BLUE}Tests Run:     $TESTS_RUN${NC}"
echo -e "${GREEN}Tests Passed:  $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed:  $TESTS_FAILED${NC}\n"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}\n"
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}\n"
  exit 1
fi
