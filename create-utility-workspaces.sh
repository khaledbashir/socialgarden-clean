#!/bin/bash

# Create utility workspaces in AnythingLLM for unified AI architecture
# This script creates two workspaces:
# 1. utility-prompt-enhancer - For enhancing user prompts
# 2. utility-inline-editor - For inline editing assistance

set -e

echo "🚀 Creating utility workspaces in AnythingLLM..."

# Use NEXT_PUBLIC_ANYTHINGLLM_URL if ANYTHINGLLM_URL is not set
if [ -z "$ANYTHINGLLM_URL" ] && [ -n "$NEXT_PUBLIC_ANYTHINGLLM_URL" ]; then
  ANYTHINGLLM_URL="$NEXT_PUBLIC_ANYTHINGLLM_URL"
fi

# Check if AnythingLLM is configured
if [ -z "$ANYTHINGLLM_URL" ] || [ -z "$ANYTHINGLLM_API_KEY" ]; then
  echo "❌ Error: ANYTHINGLLM_URL and ANYTHINGLLM_API_KEY must be passed as environment variables"
  echo "Usage: ANYTHINGLLM_URL=... ANYTHINGLLM_API_KEY=... ./create-utility-workspaces.sh"
  exit 1
fi

BASE_URL="${ANYTHINGLLM_URL%/}"
API_KEY="$ANYTHINGLLM_API_KEY"

echo "📍 AnythingLLM URL: $BASE_URL"

# System prompt for Prompt Enhancer (Clarifier AI)
PROMPT_ENHANCER_SYSTEM_PROMPT="You are the Clarifier AI - an expert at transforming vague, incomplete user prompts into clear, detailed, actionable instructions.

Your mission: Take the user's brief input and expand it into a well-structured prompt that:
1. Clarifies ambiguous requirements
2. Adds relevant context and constraints
3. Structures the request logically
4. Specifies desired format and tone
5. Includes success criteria

Rules:
- Keep the user's core intent intact
- Add helpful details they might have forgotten
- Use clear, professional language
- Output ONLY the enhanced prompt (no meta-commentary like 'Here is...')
- Make it immediately usable by another AI

Example:
User: 'write a SOW for a website'
Enhanced: 'Create a comprehensive Statement of Work for designing and developing a modern, responsive website. Include: 1) Project overview and objectives, 2) Detailed scope of work with specific deliverables, 3) Technology stack recommendations, 4) Timeline with milestones, 5) Pricing breakdown by phase, 6) Acceptance criteria and testing plan. Use professional business language appropriate for a client-facing document. Format with clear sections and bullet points for readability.'"

# System prompt for Inline Editor
INLINE_EDITOR_SYSTEM_PROMPT="You are a professional writing assistant embedded in a document editor.

Your role: Help users improve their writing through:
- Rewriting text to improve clarity, tone, or style
- Expanding brief notes into full paragraphs
- Summarizing long sections concisely
- Fixing grammar and spelling
- Adjusting formality level (casual ↔ professional)
- Generating content based on brief instructions

Rules:
- Output ONLY the final text (no explanations like 'Here is...')
- Match the user's requested tone and style
- Preserve the core meaning and intent
- Be concise and direct
- When rewriting, improve without changing the fundamental message
- When generating, follow the user's instruction precisely

The user will give you a command (e.g., '/ask what is this?', 'rewrite this professionally', 'make it shorter') and possibly a text selection. Respond with the requested output only."

echo ""
echo "📝 Creating workspace: utility-prompt-enhancer"

# Create Prompt Enhancer workspace
RESPONSE_1=$(curl -s -X POST "$BASE_URL/api/v1/workspace/new" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Utility: Prompt Enhancer\",
    \"openAiPrompt\": $(echo "$PROMPT_ENHANCER_SYSTEM_PROMPT" | jq -Rs .),
    \"openAiTemp\": 0.7,
    \"openAiHistory\": 5,
    \"chatMode\": \"chat\",
    \"topN\": 4
  }")

echo "$RESPONSE_1" | jq .

# Extract slug from response
SLUG_1=$(echo "$RESPONSE_1" | jq -r '.workspace.slug // empty')
if [ -z "$SLUG_1" ]; then
  echo "⚠️  Warning: Could not extract slug for prompt-enhancer. It may already exist."
  SLUG_1="utility-prompt-enhancer"
else
  echo "✅ Created workspace with slug: $SLUG_1"
fi

echo ""
echo "📝 Creating workspace: utility-inline-editor"

# Create Inline Editor workspace
RESPONSE_2=$(curl -s -X POST "$BASE_URL/api/v1/workspace/new" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Utility: Inline Editor\",
    \"openAiPrompt\": $(echo "$INLINE_EDITOR_SYSTEM_PROMPT" | jq -Rs .),
    \"openAiTemp\": 0.7,
    \"openAiHistory\": 3,
    \"chatMode\": \"chat\",
    \"topN\": 4
  }")

echo "$RESPONSE_2" | jq .

# Extract slug from response
SLUG_2=$(echo "$RESPONSE_2" | jq -r '.workspace.slug // empty')
if [ -z "$SLUG_2" ]; then
  echo "⚠️  Warning: Could not extract slug for inline-editor. It may already exist."
  SLUG_2="utility-inline-editor"
else
  echo "✅ Created workspace with slug: $SLUG_2"
fi

echo ""
echo "🎉 Workspace creation complete!"
echo ""
echo "📋 Summary:"
echo "  1. Prompt Enhancer: $SLUG_1"
echo "  2. Inline Editor: $SLUG_2"
echo ""
echo "🔗 View in AnythingLLM UI: $BASE_URL/workspace/$SLUG_1"
echo "🔗 View in AnythingLLM UI: $BASE_URL/workspace/$SLUG_2"
echo ""
echo "✅ Next step: Update frontend code to use these workspaces"
