#!/bin/bash

# Fix the TipTap imports in the SOW API route

FILE="/root/the11-dev/frontend/app/api/sow/[id]/route.ts"

# Create a backup
cp "$FILE" "$FILE.backup"

# Use sed to replace the problematic section
# Find the line with "Import AnythingLLM service" and replace the next 14 lines

sed -i '/Import AnythingLLM service/,/EditablePricingTable\]/c\
        // Import AnythingLLM service and HTML converter\
        const { AnythingLLMService } = await import('\''@/lib/anythingllm'\'');\
        const { sowContentToHTML } = await import('\''@/lib/export-utils'\'');\
        const anythingLLM = new AnythingLLMService();\
        \
        // Convert JSON content to HTML for embedding\
        const contentObj = typeof content === '\''string'\'' ? JSON.parse(content) : content;\
        const htmlContent = sowContentToHTML(contentObj);' "$FILE"

echo "✅ Fixed TipTap imports in $FILE"
echo "📝 Backup saved to $FILE.backup"
