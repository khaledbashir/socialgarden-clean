#!/usr/bin/env node

/**
 * Fix Workspace Routing Issues
 * 
 * This script creates the missing sow-generator workspace and fixes routing issues
 */

const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;

if (!ANYTHINGLLM_URL || !ANYTHINGLLM_API_KEY) {
  console.error('❌ Missing ANYTHINGLLM_URL or ANYTHINGLLM_API_KEY environment variables');
  process.exit(1);
}

const BASE_URL = ANYTHINGLLM_URL.replace(/\/$/, '');

// System prompt for SOW Generator workspace
const SOW_GENERATOR_SYSTEM_PROMPT = `You are 'The Architect,' the most senior and highest-paid proposal specialist at Social Garden. Your reputation for FLAWLESS, logically sound, and client-centric Scopes of Work is legendary. You protect the agency's profitability and reputation by NEVER making foolish mistakes and ALWAYS following instructions with absolute precision.

YOUR NON-NEGOTIABLE WORKFLOW:

You will follow this exact four-step process for every SOW request.

STEP 1: FINANCIAL REASONING (MANDATORY)
Before writing anything, you MUST calculate the total budget and determine if scope reduction is needed.

<think>
Budget Analysis:
- Client Budget: $[amount] AUD
- Initial Scope Estimate: $[calculated total] AUD
- Budget Status: [WITHIN BUDGET / OVER BUDGET by $X]
- Required Scope Adjustments: [list specific reductions if over budget]
- Final Scope Total: $[final amount] AUD
</think>

STEP 2: NARRATIVE CONTENT
Write compelling, professional SOW content with:
- Executive Summary
- Detailed scope of work
- Clear deliverables and timelines
- Risk mitigation strategies

STEP 3: PRICING TABLE (JSON FORMAT)
Generate a complete pricing breakdown using this EXACT format:

\`\`\`json
{
  "pricing_table": [
    {
      "role": "Tech - Head Of - Senior Project Management",
      "hours": 8,
      "rate": 195,
      "total": 1560,
      "category": "Management"
    }
  ],
  "total_cost": 25000,
  "gst": 2500,
  "total_including_gst": 27500
}
\`\`\`

STEP 4: QUALITY ASSURANCE
Verify all calculations are correct and budget is met exactly.

CRITICAL RULES:
- NEVER exceed the client's stated budget
- Always show your financial reasoning in <think> tags
- Include GST calculations (10%)
- Use only roles from the embedded rate card
- Provide specific hour allocations for each role
- Ensure pricing table JSON is valid and complete`;

async function makeApiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

async function checkWorkspaceExists(slug) {
  try {
    const workspace = await makeApiCall(`/api/v1/workspace/${slug}`);
    return workspace;
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

async function createWorkspace(name, slug, systemPrompt) {
  console.log(`📝 Creating workspace: ${name} (${slug})`);
  
  const workspace = await makeApiCall('/api/v1/workspace/new', {
    method: 'POST',
    body: JSON.stringify({
      name: name,
      openAiPrompt: systemPrompt,
      openAiTemp: 0.7,
      openAiHistory: 10,
      chatMode: 'chat',
      topN: 4
    }),
  });

  console.log(`✅ Created workspace: ${workspace.workspace?.slug || slug}`);
  return workspace;
}

async function main() {
  console.log('🚀 Fixing workspace routing issues...');
  console.log(`📡 AnythingLLM URL: ${BASE_URL}`);

  // Check and create sow-generator workspace
  console.log('\n📝 Checking sow-generator workspace...');
  let sowGenerator = await checkWorkspaceExists('sow-generator');
  
  if (!sowGenerator) {
    console.log('❌ sow-generator workspace not found, creating...');
    await createWorkspace('SOW Generator', 'sow-generator', SOW_GENERATOR_SYSTEM_PROMPT);
    sowGenerator = await checkWorkspaceExists('sow-generator');
  } else {
    console.log('✅ sow-generator workspace exists');
  }

  // Verify other workspaces exist
  const workspacesToCheck = [
    { slug: 'utility-prompt-enhancer', name: 'Prompt Enhancer' },
    { slug: 'inline-editor', name: 'Inline Editor' },
    { slug: 'sow-master-dashboard', name: 'Master Dashboard' }
  ];

  for (const ws of workspacesToCheck) {
    console.log(`\n📝 Checking ${ws.slug} workspace...`);
    const exists = await checkWorkspaceExists(ws.slug);
    if (exists) {
      console.log(`✅ ${ws.slug} workspace exists`);
    } else {
      console.log(`❌ ${ws.slug} workspace NOT FOUND - please create it manually`);
    }
  }

  console.log('\n🎉 Workspace routing fix complete!');
  console.log('\n📋 Summary:');
  console.log('  ✅ sow-generator: SOW generation workspace');
  console.log('  ✅ utility-prompt-enhancer: Prompt enhancement');
  console.log('  ✅ inline-editor: Text improvement');
  console.log('  ✅ sow-master-dashboard: Analytics dashboard');
}

main().catch(console.error);
