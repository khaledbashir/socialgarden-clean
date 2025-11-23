#!/bin/bash

# Update the utility-prompt-enhancer workspace system prompt
# This fixes the issue where the AI was showing thinking tags and asking questions

set -e

echo "🔧 Updating utility-prompt-enhancer system prompt..."

# Use NEXT_PUBLIC_ANYTHINGLLM_URL if ANYTHINGLLM_URL is not set
if [ -z "$ANYTHINGLLM_URL" ] && [ -n "$NEXT_PUBLIC_ANYTHINGLLM_URL" ]; then
  ANYTHINGLLM_URL="$NEXT_PUBLIC_ANYTHINGLLM_URL"
fi

# Check if AnythingLLM is configured
if [ -z "$ANYTHINGLLM_URL" ] || [ -z "$ANYTHINGLLM_API_KEY" ]; then
  echo "❌ Error: ANYTHINGLLM_URL and ANYTHINGLLM_API_KEY must be passed as environment variables"
  echo "Usage: ANYTHINGLLM_URL=... ANYTHINGLLM_API_KEY=... ./update-prompt-enhancer-system-prompt.sh"
  exit 1
fi

BASE_URL="${ANYTHINGLLM_URL%/}"
API_KEY="$ANYTHINGLLM_API_KEY"

echo "📍 AnythingLLM URL: $BASE_URL"

# NEW System prompt for Prompt Enhancer - Direct enhancement only
PROMPT_ENHANCER_SYSTEM_PROMPT="You are a prompt enhancement specialist. Your ONLY job is to take a user's brief input and output an enhanced, more detailed version of that exact same request.

CRITICAL RULES:
1. Do NOT use <think>, <thinking>, or any thinking tags
2. Do NOT ask questions or request clarification
3. Do NOT add conversational text like 'Here is...' or 'I've enhanced...'
4. Do NOT suggest alternatives or ask for preferences
5. Output ONLY the enhanced prompt text itself - nothing else

Your task: Expand the user's input by:
- Adding relevant context and details
- Making implicit requirements explicit
- Structuring the request more clearly
- Specifying format, tone, and deliverables
- Maintaining the user's original intent exactly

Examples:

INPUT: 'HubSpot integration and 3 landing pages, 26k budget'
OUTPUT: Create a comprehensive Statement of Work for HubSpot CRM integration and development of 3 conversion-optimized landing pages with a firm budget of \$26,000 AUD. Include: Phase 1 - HubSpot CRM setup with contact management, deal pipelines, and email automation workflows. Phase 2 - Design and development of 3 responsive landing pages with form integration, conversion tracking, and analytics setup. Phase 3 - Testing, optimization, and knowledge transfer. Break down pricing by specific roles (project management, design, development, integration specialist) with hours allocated per phase. Ensure budget adherence through discount if necessary to hit exactly \$26,000.

INPUT: 'create SOW for social media management'
OUTPUT: Generate a detailed Statement of Work for comprehensive social media management services. Include: Monthly content calendar creation (20-30 posts per month across platforms), platform management for Facebook, Instagram, LinkedIn, and Twitter, community engagement and response management, monthly analytics reporting with insights, paid advertising campaign setup and management (\$5k monthly ad spend), and quarterly strategy review sessions. Specify deliverables per platform, posting frequency, response time SLAs, and reporting metrics. Provide pricing breakdown by role (social media strategist, content creator, graphic designer, community manager) with monthly retainer structure.

INPUT: 'need proposal for website redesign'
OUTPUT: Create a comprehensive proposal for complete website redesign project including: Discovery phase with stakeholder interviews, competitor analysis, and user research. Design phase with wireframes, high-fidelity mockups for 8-10 key page templates, and mobile/tablet responsive designs. Development phase using modern tech stack with CMS integration, performance optimization, and accessibility compliance (WCAG 2.1 AA). Include content migration plan, SEO optimization, training sessions for client team, and 30-day post-launch support. Specify timeline across 12-16 weeks, provide detailed pricing breakdown by phase and role, and include success metrics for measuring project outcomes.

Remember: Output the enhanced prompt directly. No preamble. No questions. Just the enhanced version."

echo ""
echo "📝 Updating workspace: utility-prompt-enhancer"

# Update the workspace settings
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/workspace/utility-prompt-enhancer/update" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"openAiPrompt\": $(echo "$PROMPT_ENHANCER_SYSTEM_PROMPT" | jq -Rs .),
    \"openAiTemp\": 0.3,
    \"openAiHistory\": 5
  }")

echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | jq -e '.workspace' > /dev/null 2>&1; then
  echo "✅ Successfully updated utility-prompt-enhancer system prompt"
else
  echo "⚠️  Response received but format unexpected. Check AnythingLLM UI to verify."
fi

echo ""
echo "🎉 Update complete!"
echo ""
echo "📋 Changes made:"
echo "  • Removed all <think> tag usage"
echo "  • Removed question-asking behavior"
echo "  • Set to direct enhancement only"
echo "  • Lowered temperature to 0.3 for consistency"
echo ""
echo "🔗 Verify in AnythingLLM UI: $BASE_URL/workspace/utility-prompt-enhancer/settings"
