#!/bin/bash

# Script to configure Z.ai provider in AnythingLLM via API
# This is safer than direct database manipulation and respects AnythingLLM's internal logic

set -e

echo "🔧 Configuring Z.ai provider in AnythingLLM via API..."

# Configuration
ANYTHINGLLM_URL="${ANYTHINGLLM_URL:-http://localhost:3001}"
ANYTHINGLLM_API_KEY="${ANYTHINGLLM_API_KEY:-your-api-key-here}"

ZAI_BASE_URL="https://api.z.ai/api/coding/paas/v4"
ZAI_API_KEY="eb0d4d6e54ab4258aac5f5d17a7a01a4.FEf31FrtkMWWRN4Z"
ZAI_MODEL="glm-4.6"

echo "📍 AnythingLLM URL: $ANYTHINGLLM_URL"

# Check if AnythingLLM is accessible
if ! curl -s -f "$ANYTHINGLLM_URL/api/ping" > /dev/null 2>&1; then
    echo "❌ Cannot reach AnythingLLM at $ANYTHINGLLM_URL"
    echo "Please ensure AnythingLLM is running and accessible."
    exit 1
fi

echo "✅ AnythingLLM is accessible"

# Configure LLM provider via API
echo "🔧 Setting LLM provider to generic-openai (OpenAI Compatible)..."

# Update system preferences
curl -X POST "${ANYTHINGLLM_URL}/api/system/update-env" \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"LLMProvider\": \"generic-openai\",
    \"GenericOpenAiBasePath\": \"${ZAI_BASE_URL}\",
    \"GenericOpenAiKey\": \"${ZAI_API_KEY}\",
    \"GenericOpenAiModelPref\": \"${ZAI_MODEL}\",
    \"GenericOpenAiTokenLimit\": 8192,
    \"GenericOpenAiMaxTokens\": 4096
  }"

if [ $? -eq 0 ]; then
    echo "✅ Successfully configured Z.ai provider via API"
    echo ""
    echo "Configuration applied:"
    echo "  Provider: generic-openai (OpenAI Compatible)"
    echo "  Base URL: ${ZAI_BASE_URL}"
    echo "  Model: ${ZAI_MODEL}"
    echo ""
    echo "✅ Settings are now persisted in AnythingLLM database"
    echo "These settings will survive container restarts."
else
    echo "❌ Failed to configure provider via API"
    echo "Please check:"
    echo "  1. AnythingLLM API key is correct"
    echo "  2. AnythingLLM URL is accessible"
    echo "  3. You have admin permissions"
    exit 1
fi

echo ""
echo "🔍 To verify, visit: ${ANYTHINGLLM_URL}/settings/llm-preference"
