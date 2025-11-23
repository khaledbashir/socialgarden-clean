#!/bin/bash

# Script to set Z.ai configuration via AnythingLLM API
# This ensures settings are properly cached and displayed in UI

set -e

echo "🔧 Setting Z.ai Configuration via AnythingLLM API"
echo "=================================================="
echo ""

# Configuration
ANYTHINGLLM_URL="${ANYTHINGLLM_URL:-https://ahmad-anything-llm.840tjq.easypanel.host}"
ANYTHINGLLM_API_KEY="${ANYTHINGLLM_API_KEY}"

ZAI_BASE_URL="https://api.z.ai/api/coding/paas/v4"
ZAI_API_KEY="eb0d4d6e54ab4258aac5f5d17a7a01a4.FEf31FrtkMWWRN4Z"
ZAI_MODEL="glm-4.6"

# Check if API key is provided
if [ -z "$ANYTHINGLLM_API_KEY" ]; then
    echo "❌ ANYTHINGLLM_API_KEY environment variable not set"
    echo ""
    echo "To get your API key:"
    echo "  1. Go to: ${ANYTHINGLLM_URL}/settings/api-keys"
    echo "  2. Create a new API key"
    echo "  3. Export it: export ANYTHINGLLM_API_KEY='your-key-here'"
    echo "  4. Run this script again"
    echo ""
    echo "OR run with the key inline:"
    echo "  ANYTHINGLLM_API_KEY='your-key' $0"
    exit 1
fi

echo "📍 AnythingLLM URL: $ANYTHINGLLM_URL"
echo "🔑 API Key: ***${ANYTHINGLLM_API_KEY: -8}"
echo ""

# Test connection
echo "🔌 Testing connection to AnythingLLM..."
PING_RESPONSE=$(curl -s -w "\n%{http_code}" "${ANYTHINGLLM_URL}/api/ping" 2>&1)
HTTP_CODE=$(echo "$PING_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Connection successful"
else
    echo "❌ Cannot connect to AnythingLLM (HTTP $HTTP_CODE)"
    echo "Response: $PING_RESPONSE"
    exit 1
fi

echo ""

# Update system settings via API
echo "🔧 Updating LLM provider settings..."
echo "===================================="

# Prepare the JSON payload
PAYLOAD=$(cat <<EOF
{
  "LLMProvider": "generic-openai",
  "GenericOpenAiBasePath": "${ZAI_BASE_URL}",
  "GenericOpenAiKey": "${ZAI_API_KEY}",
  "GenericOpenAiModelPref": "${ZAI_MODEL}",
  "GenericOpenAiTokenLimit": 8192,
  "GenericOpenAiMaxTokens": 4096
}
EOF
)

echo "Sending configuration to AnythingLLM API..."
echo ""

# Make the API call
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${ANYTHINGLLM_URL}/api/system/update-env" \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Configuration updated successfully!"
    echo ""
    echo "Settings applied:"
    echo "  • Provider: generic-openai (OpenAI Compatible)"
    echo "  • Base URL: ${ZAI_BASE_URL}"
    echo "  • Model: ${ZAI_MODEL}"
    echo "  • Token Limit: 8192"
    echo "  • Max Tokens: 4096"
    echo ""
    echo "Response from server:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "❌ Failed to update configuration (HTTP $HTTP_CODE)"
    echo ""
    echo "Response:"
    echo "$RESPONSE_BODY"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify your API key is correct and has admin permissions"
    echo "  2. Check AnythingLLM logs: docker logs ahmad_anything-llm.1.tl3ghqkl26ekt0txovhpktovj"
    echo "  3. Ensure the /api/system/update-env endpoint is available"
    exit 1
fi

echo ""
echo "🔄 Verifying settings were saved..."
echo "==================================="

# Get current system settings
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${ANYTHINGLLM_URL}/api/system" \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" 2>&1)

VERIFY_HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -1)
VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | head -n -1)

if [ "$VERIFY_HTTP_CODE" = "200" ]; then
    echo "✅ Settings verification successful"
    echo ""
    echo "Current LLM Configuration:"
    echo "$VERIFY_BODY" | jq '.system | {
        LLMProvider,
        GenericOpenAiBasePath,
        GenericOpenAiModelPref,
        GenericOpenAiTokenLimit,
        GenericOpenAiMaxTokens
    }' 2>/dev/null || echo "Could not parse JSON response"
else
    echo "⚠️  Could not verify settings (HTTP $VERIFY_HTTP_CODE)"
    echo "Settings may have been saved but verification failed"
fi

echo ""
echo "✅ Configuration Complete!"
echo "=========================="
echo ""
echo "Next Steps:"
echo "1. Go to: ${ANYTHINGLLM_URL}/settings/llm-preference"
echo "2. Verify 'OpenAI Compatible' is selected"
echo "3. All fields should now be populated:"
echo "   - Base URL: ${ZAI_BASE_URL}"
echo "   - Model: ${ZAI_MODEL}"
echo "   - API Key: ***${ZAI_API_KEY: -8}"
echo ""
echo "4. Test by sending a message in any workspace"
echo ""
echo "💡 These settings will now persist across container restarts!"
echo ""

# Optional: Test with a workspace
read -p "Would you like to test Z.ai with a workspace now? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter workspace slug (e.g., 'sow-generator'): " WORKSPACE_SLUG

    if [ -n "$WORKSPACE_SLUG" ]; then
        echo ""
        echo "🧪 Testing Z.ai with workspace: $WORKSPACE_SLUG"
        echo "=============================================="

        TEST_MESSAGE="Hello, this is a test message to verify Z.ai is working correctly."

        TEST_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
          "${ANYTHINGLLM_URL}/api/v1/workspace/${WORKSPACE_SLUG}/chat" \
          -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
          -H "Content-Type: application/json" \
          -d "{\"message\":\"${TEST_MESSAGE}\",\"mode\":\"chat\"}" 2>&1)

        TEST_HTTP_CODE=$(echo "$TEST_RESPONSE" | tail -1)
        TEST_BODY=$(echo "$TEST_RESPONSE" | head -n -1)

        if [ "$TEST_HTTP_CODE" = "200" ]; then
            echo "✅ Test message sent successfully!"
            echo ""
            echo "AI Response:"
            echo "$TEST_BODY" | jq -r '.textResponse // .response // .' 2>/dev/null || echo "$TEST_BODY"
        else
            echo "❌ Test failed (HTTP $TEST_HTTP_CODE)"
            echo "Response: $TEST_BODY"
        fi
    fi
fi

echo ""
echo "🎉 Done! Z.ai is now configured and persisted."
