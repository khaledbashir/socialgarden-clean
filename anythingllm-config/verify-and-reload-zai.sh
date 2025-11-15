#!/bin/bash

# Script to verify Z.ai settings persistence and force reload in AnythingLLM
# This addresses the issue where UI shows empty fields even though database has the settings

set -e

echo "🔍 Z.ai Configuration Verification & Reload Script"
echo "=================================================="
echo ""

# Configuration
STORAGE_DIR="/var/lib/docker/volumes/ahmad_anything-llm_storage/_data"
DB_PATH="${STORAGE_DIR}/anythingllm.db"
CONTAINER_NAME="ahmad_anything-llm.1.tl3ghqkl26ekt0txovhpktovj"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at: $DB_PATH"
    exit 1
fi

echo "✅ Database found: $DB_PATH"
echo ""

# Step 1: Verify current settings in database
echo "📊 Current Z.ai Settings in Database:"
echo "======================================"
sqlite3 "$DB_PATH" <<EOF
.mode column
.headers on
SELECT
    label as Setting,
    CASE
        WHEN label = 'GenericOpenAiKey' THEN '***' || substr(value, -8) || '***'
        ELSE value
    END as Value
FROM system_settings
WHERE label IN (
    'llm_provider',
    'GenericOpenAiBasePath',
    'GenericOpenAiKey',
    'GenericOpenAiModelPref',
    'GenericOpenAiTokenLimit',
    'GenericOpenAiMaxTokens'
)
ORDER BY label;
EOF

echo ""
echo ""

# Step 2: Check if settings are correct
echo "🔧 Validating Settings..."
echo "========================="

LLM_PROVIDER=$(sqlite3 "$DB_PATH" "SELECT value FROM system_settings WHERE label = 'llm_provider';")
BASE_PATH=$(sqlite3 "$DB_PATH" "SELECT value FROM system_settings WHERE label = 'GenericOpenAiBasePath';")
MODEL=$(sqlite3 "$DB_PATH" "SELECT value FROM system_settings WHERE label = 'GenericOpenAiModelPref';")
API_KEY=$(sqlite3 "$DB_PATH" "SELECT value FROM system_settings WHERE label = 'GenericOpenAiKey';")

if [ "$LLM_PROVIDER" = "generic-openai" ]; then
    echo "✅ LLM Provider: $LLM_PROVIDER"
else
    echo "❌ LLM Provider: $LLM_PROVIDER (Expected: generic-openai)"
fi

if [ "$BASE_PATH" = "https://api.z.ai/api/coding/paas/v4" ]; then
    echo "✅ Base Path: $BASE_PATH"
else
    echo "❌ Base Path: $BASE_PATH (Expected: https://api.z.ai/api/coding/paas/v4)"
fi

if [ "$MODEL" = "glm-4.6" ]; then
    echo "✅ Model: $MODEL"
else
    echo "❌ Model: $MODEL (Expected: glm-4.6)"
fi

if [ -n "$API_KEY" ] && [ ${#API_KEY} -gt 20 ]; then
    echo "✅ API Key: Set (***${API_KEY: -8})"
else
    echo "❌ API Key: Missing or invalid"
fi

echo ""
echo ""

# Step 3: Check if container can see the database
echo "🐳 Container Database Access:"
echo "============================="

CONTAINER_DB_SIZE=$(docker exec "$CONTAINER_NAME" stat -c%s /app/server/storage/anythingllm.db 2>/dev/null || echo "0")
HOST_DB_SIZE=$(stat -c%s "$DB_PATH" 2>/dev/null || echo "0")

if [ "$CONTAINER_DB_SIZE" = "$HOST_DB_SIZE" ] && [ "$CONTAINER_DB_SIZE" != "0" ]; then
    echo "✅ Container sees same database file (${CONTAINER_DB_SIZE} bytes)"
else
    echo "⚠️  Container DB size: $CONTAINER_DB_SIZE bytes"
    echo "⚠️  Host DB size: $HOST_DB_SIZE bytes"
    echo "❌ Database files don't match! Volume mount issue!"
fi

echo ""
echo ""

# Step 4: Check recent logs for Z.ai usage
echo "📜 Recent AnythingLLM Logs (Z.ai Activity):"
echo "==========================================="
docker logs --tail 20 "$CONTAINER_NAME" 2>&1 | grep -i "GenericOpenAi\|z.ai\|glm-4.6" || echo "No recent Z.ai activity in logs"

echo ""
echo ""

# Step 5: Force settings refresh
echo "🔄 Force Reloading Settings..."
echo "=============================="

# Touch the database file to update its modification time
# This can trigger AnythingLLM to re-read settings
touch "$DB_PATH"
echo "✅ Database timestamp updated"

# Restart the container to force complete reload
read -p "Do you want to restart the AnythingLLM container to force reload? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Restarting container..."
    docker restart "$CONTAINER_NAME"
    echo "✅ Container restarted"
    echo ""
    echo "⏳ Waiting 15 seconds for container to be healthy..."
    sleep 15

    # Check if container is healthy
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "unknown")
    echo "Container health: $HEALTH"
fi

echo ""
echo ""

# Step 6: Provide next steps
echo "📋 Next Steps:"
echo "============="
echo ""
echo "1. Open AnythingLLM UI: http://168.231.115.219:3000/projects/ahmad/app/anything-llm"
echo "2. Go to: Settings → LLM Preference"
echo "3. Check if 'OpenAI Compatible' is selected"
echo "4. Verify these fields are populated:"
echo "   - Base URL: https://api.z.ai/api/coding/paas/v4"
echo "   - API Key: ***${API_KEY: -8}"
echo "   - Model: glm-4.6"
echo ""
echo "If fields are STILL empty:"
echo "   → The UI might be reading from cached values"
echo "   → Try a hard refresh (Ctrl+Shift+R) in browser"
echo "   → Clear browser cache/cookies for this site"
echo "   → Use incognito/private mode to test"
echo ""

# Step 7: Alternative verification via API
echo "🌐 API Verification:"
echo "==================="
echo ""
echo "To verify via API (requires API key), run:"
echo ""
echo "  curl -H 'Authorization: Bearer YOUR_API_KEY' \\"
echo "       https://ahmad-anything-llm.840tjq.easypanel.host/api/system"
echo ""

# Step 8: Check for multiple containers
echo "🔍 Checking for Multiple AnythingLLM Containers:"
echo "================================================"
CONTAINER_COUNT=$(docker ps | grep -c anythingllm || echo "0")
echo "Found $CONTAINER_COUNT running AnythingLLM container(s)"

if [ "$CONTAINER_COUNT" -gt 1 ]; then
    echo "⚠️  WARNING: Multiple AnythingLLM containers detected!"
    echo "    You might be accessing a different container than expected."
    echo ""
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}" | grep anythingllm
    echo ""
    echo "Ensure you're accessing the correct container via your URL."
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "💡 TIP: If UI still shows empty fields but logs show Z.ai working,"
echo "       the settings ARE persisted - it's just a UI display issue."
echo "       The backend is using the correct configuration!"
