#!/bin/bash

# Script to add Z.ai configuration to AnythingLLM environment variables
# This uses the CORRECT variable names that AnythingLLM actually reads

set -e

echo "🔧 Adding Z.ai Environment Variables to AnythingLLM"
echo "===================================================="
echo ""

# Path to your .env file (adjust if needed)
ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file not found: $ENV_FILE"
    echo "Usage: $0 [path-to-env-file]"
    exit 1
fi

echo "📁 Using environment file: $ENV_FILE"
echo ""

# Backup the original file
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP_FILE"
echo "✅ Created backup: $BACKUP_FILE"
echo ""

# Z.ai Configuration
ZAI_BASE_URL="https://api.z.ai/api/coding/paas/v4"
ZAI_API_KEY="eb0d4d6e54ab4258aac5f5d17a7a01a4.FEf31FrtkMWWRN4Z"
ZAI_MODEL="glm-4.6"

# Check if GENERIC_OPEN_AI variables already exist
if grep -q "GENERIC_OPEN_AI" "$ENV_FILE"; then
    echo "⚠️  GENERIC_OPEN_AI variables already exist in $ENV_FILE"
    echo ""
    echo "Current values:"
    grep "GENERIC_OPEN_AI" "$ENV_FILE"
    echo ""
    read -p "Do you want to UPDATE them? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. No changes made."
        exit 0
    fi

    # Remove old entries
    sed -i '/GENERIC_OPEN_AI/d' "$ENV_FILE"
    echo "✅ Removed old GENERIC_OPEN_AI variables"
fi

echo "➕ Adding new Z.ai configuration..."
echo ""

# Add the correct AnythingLLM environment variables
cat >> "$ENV_FILE" << EOF

###########################################
######## Generic OpenAI (Z.ai) ############
###########################################
# These variables are read by AnythingLLM for generic-openai provider
GENERIC_OPEN_AI_BASE_PATH=${ZAI_BASE_URL}
GENERIC_OPEN_AI_API_KEY=${ZAI_API_KEY}
GENERIC_OPEN_AI_MODEL_PREF=${ZAI_MODEL}
GENERIC_OPEN_AI_MAX_TOKENS=4096
GENERIC_OPEN_AI_TOKEN_LIMIT=8192
EOF

echo "✅ Added Z.ai configuration to $ENV_FILE"
echo ""

# Show what was added
echo "📋 Variables added:"
echo "==================="
tail -n 7 "$ENV_FILE"
echo ""

# Important note about LLM_PROVIDER
echo "⚠️  IMPORTANT: You must ALSO set the LLM provider!"
echo ""

if grep -q "^LLM_PROVIDER=" "$ENV_FILE"; then
    CURRENT_PROVIDER=$(grep "^LLM_PROVIDER=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"')
    echo "Current LLM_PROVIDER: $CURRENT_PROVIDER"
    echo ""

    if [ "$CURRENT_PROVIDER" != "generic-openai" ]; then
        read -p "Change LLM_PROVIDER to 'generic-openai'? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sed -i 's/^LLM_PROVIDER=.*/LLM_PROVIDER="generic-openai"/' "$ENV_FILE"
            echo "✅ Updated LLM_PROVIDER to generic-openai"
        else
            echo "⚠️  WARNING: LLM_PROVIDER is still set to '$CURRENT_PROVIDER'"
            echo "   Z.ai will NOT be used until you change it to 'generic-openai'"
        fi
    else
        echo "✅ LLM_PROVIDER is already set to generic-openai"
    fi
else
    echo "Adding LLM_PROVIDER=generic-openai..."
    sed -i '/^#.*LLM API Selection/a LLM_PROVIDER="generic-openai"' "$ENV_FILE"
    echo "✅ Added LLM_PROVIDER=generic-openai"
fi

echo ""
echo "✅ Configuration Complete!"
echo "=========================="
echo ""
echo "Next Steps:"
echo "1. Restart AnythingLLM container to apply changes:"
echo "   docker restart ahmad_anything-llm.1.tl3ghqkl26ekt0txovhpktovj"
echo ""
echo "2. OR restart via Easypanel:"
echo "   http://168.231.115.219:3000/projects/ahmad/app/anything-llm"
echo "   Click 'Restart' button"
echo ""
echo "3. After restart, verify in logs:"
echo "   docker logs ahmad_anything-llm.1.tl3ghqkl26ekt0txovhpktovj | grep 'GenericOpenAi'"
echo ""
echo "   You should see:"
echo "   [GenericOpenAiLLM] Inference API: ${ZAI_BASE_URL}"
echo ""
echo "4. Test in workspace:"
echo "   https://ahmad-anything-llm.840tjq.easypanel.host/workspace/sow-generator"
echo ""
echo "💡 TIP: The UI Settings page may still show empty fields"
echo "        This is NORMAL - the backend reads from environment variables!"
echo ""
