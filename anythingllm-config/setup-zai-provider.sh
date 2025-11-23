#!/bin/bash

# Script to configure Z.ai as a persistent LLM provider in AnythingLLM
# This modifies the SQLite database directly to set the provider configuration

set -e

echo "🔧 Configuring Z.ai provider in AnythingLLM..."

# Path to AnythingLLM storage directory
STORAGE_DIR="/var/lib/docker/volumes/ahmad_anything-llm_storage/_data"
DB_PATH="${STORAGE_DIR}/anythingllm.db"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at: $DB_PATH"
    echo "Please ensure AnythingLLM is running and has initialized the database."
    exit 1
fi

echo "✅ Found database at: $DB_PATH"

# Backup the database first
BACKUP_PATH="${DB_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$DB_PATH" "$BACKUP_PATH"
echo "✅ Created backup at: $BACKUP_PATH"

# Z.ai configuration values
ZAI_BASE_URL="https://api.z.ai/api/coding/paas/v4"
ZAI_API_KEY="eb0d4d6e54ab4258aac5f5d17a7a01a4.FEf31FrtkMWWRN4Z"
ZAI_MODEL="glm-4.6"

echo "🔧 Setting LLM provider configuration..."

# Update or insert system_settings for LLM provider
sqlite3 "$DB_PATH" <<EOF
-- Set LLM provider to generic-openai (OpenAI Compatible)
INSERT OR REPLACE INTO system_settings (label, value, createdAt, lastUpdatedAt)
VALUES (
    'llm_provider',
    'generic-openai',
    datetime('now'),
    datetime('now')
);

-- Set generic OpenAI base path
INSERT OR REPLACE INTO system_settings (label, value, createdAt, lastUpdatedAt)
VALUES (
    'GenericOpenAiBasePath',
    '${ZAI_BASE_URL}',
    datetime('now'),
    datetime('now')
);

-- Set generic OpenAI API key
INSERT OR REPLACE INTO system_settings (label, value, createdAt, lastUpdatedAt)
VALUES (
    'GenericOpenAiKey',
    '${ZAI_API_KEY}',
    datetime('now'),
    datetime('now')
);

-- Set generic OpenAI model preference
INSERT OR REPLACE INTO system_settings (label, value, createdAt, lastUpdatedAt)
VALUES (
    'GenericOpenAiModelPref',
    '${ZAI_MODEL}',
    datetime('now'),
    datetime('now')
);

-- Set token limit (adjust as needed for your model)
INSERT OR REPLACE INTO system_settings (label, value, createdAt, lastUpdatedAt)
VALUES (
    'GenericOpenAiTokenLimit',
    '8192',
    datetime('now'),
    datetime('now')
);

-- Set max tokens (adjust as needed)
INSERT OR REPLACE INTO system_settings (label, value, createdAt, lastUpdatedAt)
VALUES (
    'GenericOpenAiMaxTokens',
    '4096',
    datetime('now'),
    datetime('now')
);
EOF

if [ $? -eq 0 ]; then
    echo "✅ Successfully configured Z.ai provider"
    echo ""
    echo "Configuration applied:"
    echo "  Provider: generic-openai (OpenAI Compatible)"
    echo "  Base URL: ${ZAI_BASE_URL}"
    echo "  Model: ${ZAI_MODEL}"
    echo ""
    echo "🔄 Please restart AnythingLLM container for changes to take effect:"
    echo "   docker restart ahmad_anything-llm.1.uhiet96dgklnuno4s1jaewraf"
else
    echo "❌ Failed to configure provider"
    echo "Restoring from backup..."
    cp "$BACKUP_PATH" "$DB_PATH"
    exit 1
fi

echo ""
echo "📋 To verify the configuration, check the system_settings table:"
echo "   sqlite3 ${DB_PATH} \"SELECT * FROM system_settings WHERE label LIKE '%Generic%' OR label = 'llm_provider';\""
