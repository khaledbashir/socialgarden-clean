#!/bin/bash

# Create Inline Editor Enhancement Workspace
# This workspace is specifically for enhancing selected text in the SOW editor
# It's separate from the SOW generation workspace

ANYTHINGLLM_API_URL="http://localhost:3001/api"
ADMIN_USER_SLUG="default"

echo "🚀 Setting up Inline Editor Enhancement Workspace..."

# System prompt for Inline Editor text enhancement
INLINE_EDITOR_PROMPT='You are a professional text enhancement assistant specialized in improving written content for business documents. Your role is to:

1. **For Selected Text:** Take the user-provided text and improve it while maintaining the original meaning and intent
2. **Enhancement Goals:**
   - Improve clarity and professionalism
   - Fix grammar, spelling, and punctuation
   - Make sentences more concise or more detailed as needed
   - Enhance tone to be appropriate for business context
   - Maintain technical accuracy

3. **Important Rules:**
   - Return ONLY the improved text, no explanations
   - Preserve the original structure and lists
   - Do not add or remove significant content
   - Keep formatting consistent

4. **Examples:**
   - Input: "the client wants stuff done quick"
   - Output: "The client requires expedited completion of deliverables"
   
   - Input: "We can do testing"
   - Output: "We provide comprehensive testing services"

When the user provides text, enhance it immediately without asking questions.'

# Create workspace via API
echo "Creating 'Inline Editor Enhancement' workspace..."
RESPONSE=$(curl -s -X POST "${ANYTHINGLLM_API_URL}/workspaces" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Inline Editor Enhancement\",
    \"slug\": \"utility-inline-enhancer\",
    \"openAiKey\": \"\",
    \"openAiModelPref\": \"gpt-4\",
    \"vectorDbSelection\": {
      \"preference\": \"lancedb\"
    }
  }")

echo "Response: $RESPONSE"
WORKSPACE_SLUG=$(echo "$RESPONSE" | grep -o '"slug":"[^"]*' | cut -d'"' -f4 | tail -1)

if [ -z "$WORKSPACE_SLUG" ]; then
  WORKSPACE_SLUG="utility-inline-enhancer"
  echo "⚠️  Could not extract workspace slug from response, using default: $WORKSPACE_SLUG"
fi

echo "✅ Workspace slug: $WORKSPACE_SLUG"

# Set the system prompt
echo "Setting system prompt for inline editor enhancement..."
curl -s -X POST "${ANYTHINGLLM_API_URL}/workspaces/${WORKSPACE_SLUG}/system-prompt" \
  -H "Content-Type: application/json" \
  -d "{
    \"systemPrompt\": \"$INLINE_EDITOR_PROMPT\"
  }" > /dev/null

echo "✅ System prompt set"

# Enable all chat models for this workspace
echo "Configuring workspace settings..."
curl -s -X PATCH "${ANYTHINGLLM_API_URL}/workspaces/${WORKSPACE_SLUG}" \
  -H "Content-Type: application/json" \
  -d "{
    \"settings\": {
      \"chat_model\": \"gpt-4-turbo\",
      \"temperature\": 0.7,
      \"context_length\": 4096
    }
  }" > /dev/null

echo ""
echo "================================"
echo "✅ Inline Editor Enhancement Workspace Created!"
echo "================================"
echo "Workspace Name: Inline Editor Enhancement"
echo "Workspace Slug: $WORKSPACE_SLUG"
echo "Purpose: Text enhancement for inline editor"
echo ""
echo "This workspace is SEPARATE from:"
echo "  - 'Utility: Prompt Enhancer' (for SOW prompt enhancement in chat)"
echo "  - 'Utility: SOW Generator' (for The Architect SOW generation)"
echo ""
echo "API Usage:"
echo "  POST /api/workspaces/$WORKSPACE_SLUG/chat"
echo ""
