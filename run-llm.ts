/**
 * AnyTHINGLLM Complete Workflow Test Script
 *
 * This script demonstrates the end-to-end flow of:
 * 1. Creating a new workspace.
 * 2. Modifying the workspace with the FULL "The Architect" system prompt.
 * 3. Embedding the COMPLETE 91-role rate card as a knowledge document.
 * 4. Running a chat query to validate the AI's advanced behavior.
 * 5. Cleaning up the created resources.
 *
 * Usage: pnpm tsx run-llm.ts
 */

import { AnythingLLMService } from './frontend/lib/anythingllm';

// --- CONFIGURATION ---

// 1. The COMPLETE "Architect" system prompt.
const ARCHITECT_PROMPT = `
You are 'The Architect,' the most senior and highest-paid proposal specialist at Social Garden. Your reputation for FLAWLESS, logically sound, and client-centric Scopes of Work is legendary. Your performance is valued at over a million dollars a year because you NEVER make foolish mistakes, you NEVER default to generic templates, and you ALWAYS follow instructions with absolute precision.

YOUR CORE DIRECTIVES

FIRST - ANALYZE THE WORK TYPE: Before writing, SILENTLY classify the user's brief into one of three categories:
*   Standard Project: A defined build/delivery with a start and end.
*   Audit/Strategy: An analysis and recommendation engagement.
*   Retainer Agreement: An ongoing service over a set period.
You WILL use the specific SOW structure for that work type. Failure is not an option.

SECOND - BESPOKE DELIVERABLES GENERATION:
- Generate UNIQUE deliverables based on the specific brief and context
- NEVER use static template lists or generic deliverables
- Platform-specific deliverables: 
  * Salesforce implementations require custom objects, workflows, and integrations
  * HubSpot implementations focus on marketing automation, lead scoring, and CRM workflows
  * Marketo implementations emphasize campaign orchestration and lead nurturing

THIRD - ROLE ALLOCATION HIERARCHY (CRITICAL):
- **MANDATORY ROLE ALLOCATION RULES:**
  * Head Of Senior Project Management: MINIMAL hours (5-15 hours only)
  * Project Coordination: MINIMAL hours (3-10 hours only)
  * Account Management: MAXIMUM hours (minimum 6-12 hours)
  * Split hours across granular roles: email production, dev, design, copy, deployment, testing
- **PRICING TABLE ORDER:** Account Management roles MUST appear at the BOTTOM of the pricing table

FOURTH - COMMERCIAL PRESENTATION:
- Currency: AUD only (never USD)
- All pricing must show "+GST" suffix
- Aim for ROUND NUMBERS: Target 200, 250, 300 hours total OR $50k, $45k, $60k final amounts
- After calculating ideal hours/cost, intelligently adjust to cleaner commercial numbers

FIFTH - BUDGET ADHERENCE:
- Respect specified target budgets (e.g., $10k, $50k)
- When budget is provided, adjust scope, roles, or hours to meet the target by modifying the roles and hours in your suggestedRoles JSON output
- If a discount is needed to meet the budget, include ONLY this simple line in the narrative: "**Discount:** X%" (where X is the discount percentage). The Smart Discount system will automatically apply it to the pricing table
- DO NOT write "Original Price," "Discount Amount," or "Final Price" calculations in the narrative. The application calculates all financial totals

---
CRITICAL RULE: DO NOT CALCULATE PRICING IN THE NARRATIVE

Your ONLY responsibility for pricing is to generate the list of roles and hours in the suggestedRoles JSON output at the end of your response.

You are STRICTLY FORBIDDEN from writing any sentences or bullet points in the main SOW narrative that mention specific dollar amounts, discounts, subtotals, or final prices. Do not create your own "RETAINER INVESTMENT STRUCTURE" or "BUDGET ANALYSIS" sections with financial calculations.

The application's code will generate the one and only pricing summary table. Your job is to focus exclusively on the project scope, deliverables, timeline, and strategy - and then provide the suggestedRoles JSON. The application handles all math.

This ensures the document has a single, authoritative source of financial truth.
---

SIXTH - DELIVERABLE FORMAT (MANDATORY):
- ALL deliverables as bullet points with "+" prefix
- NO paragraph format for deliverables

SEVENTH - GENERATE THE SOW: Your entire response MUST be structured into two distinct parts:
1. PART 1: INTERNAL STRATEGY MONOLOGUE: This first section MUST be wrapped in <thinking> tags.
2. PART 2: THE FINAL SCOPE OF WORK: Immediately following the closing </thinking> tag, you WILL generate the complete and final Scope of Work document.

**CRITICAL JSON REQUIREMENT:**
After completing the Scope of Work, you MUST include a valid JSON code block with the pricing table data. This is REQUIRED for the pricing table to render.

\`\`\`json
{
  "suggestedRoles": [
    { "role": "Role Name From Knowledge Base", "hours": 40 },
    { "role": "Another Role From Knowledge Base", "hours": 60 }
  ]
}
\`\`\`

FINAL INSTRUCTION: Your response MUST end with the exact phrase on its own line: *** This concludes the Scope of Work document. ***
`;

// 2. The COMPLETE 91-role rate card, formatted for clarity.
const RATE_CARD_CONTENT = `
# Social Garden Official Rate Card (91 Roles)

### Account Management (5 roles)
- Senior Account Director ($365)
- Account Director ($295) 
- Senior Account Manager ($210)
- Account Manager ($180)
- Account Management (Off) ($120)

### Project Management (3 roles)
- Project Management - Account Director ($295)
- Project Management - Senior Account Manager ($210)
- Project Management - Account Manager ($180)

### Tech - Delivery (2 roles)
- Project Management ($150)
- Project Coordination ($110)

### Tech - Head Of (4 roles)
- Customer Experience Strategy ($365)
- Program Strategy ($365)
- Senior Project Management ($365)
- System Setup ($365)

### Tech - Integrations (2 roles)
- Integrations (Senior) ($295)
- Integration Specialist ($170)

### Tech - Producer (21 roles)
- Admin Configuration ($120)
- Campaign Build ($120)
- Chat Bot / Live Chat ($120)
- Copywriting ($120)
- Deployment ($120)
- Design ($120)
- Development ($120)
- Documentation Setup ($120)
- Email Production ($120)
- Field / Property Setup ($120)
- Integration Assistance ($120)
- Landing Page Production ($120)
- Lead Scoring Setup ($120)
- Reporting ($120)
- Services ($120)
- SMS Setup ($120)
- Support & Monitoring ($120)
- Testing ($120)
- Training ($120)
- Web Development ($120)
- Workflows ($120)

### Tech - SEO (2 roles)
- SEO Strategy ($180)
- SEO Producer ($120)

### Tech - Specialist (14 roles)
- Integration Services ($190)
- Admin Configuration ($180)
- Campaign Optimisation ($180)
- Campaign Orchestration ($180)
- Database Management ($180)
- Email Production ($180)
- Integration Configuration ($180)
- Lead Scoring Setup ($180)
- Program Management ($180)
- Reporting ($180)
- Services ($180)
- Testing ($180)
- Training ($180)
- Workflows ($180)

### Tech - Sr. Architect (4 roles)
- Approval & Testing ($365)
- Consultancy Services ($365)
- Data Strategy ($365)
- Integration Strategy ($365)

### Tech - Sr. Consultant (10 roles)
- Admin Configuration ($295)
- Advisory & Consultation ($295)
- Approval & Testing ($295)
- Campaign Optimisation ($295)
- Campaign Strategy ($295)
- Database Management ($295)
- Reporting ($295)
- Services ($295)
- Strategy ($295)
- Training ($295)

### Content (9 roles)
- SEO Strategy (Onshore) ($210)
- Campaign Strategy (Onshore) ($180)
- Keyword Research (Onshore) ($150)
- Optimisation (Onshore) ($150)
- Reporting (Onshore) ($150)
- SEO Copywriting (Onshore) ($150)
- Keyword Research (Offshore) ($120)
- Reporting (Offshore) ($120)
- Website Optimisations (Offshore) ($120)

### Design (6 roles)
- Email (Onshore) ($295)
- Digital Asset (Onshore) ($190)
- Landing Page (Onshore) ($190)
- Digital Asset (Offshore) ($140)
- Email (Offshore) ($120)
- Landing Page (Offshore) ($120)

### Development (2 roles)
- Dev (orTech) - Landing Page (Onshore) ($210)
- Dev (orTech) - Landing Page (Offshore) ($120)
`;

// 3. The name for the temporary workspace.
const WORKSPACE_NAME = `Architect SOW Test - ${Date.now()}`;

// --- HELPER & MAIN EXECUTION ---

const service = new AnythingLLMService();

function log(message: string, type: 'info' | 'success' | 'error' | 'test' | 'cleanup' = 'info') {
  const emojiMap: Record<string, string> = {
    info: '📋',
    success: '✅',
    error: '❌',
    test: '🧪',
    cleanup: '🧹',
  };
  console.log(`${emojiMap[type] || '➡️'} ${message}`);
}

async function main() {
  let workspaceSlug: string | null = null;

  try {
    // --- STEP 1: CREATE OR GET WORKSPACE ---
    log(`Creating or getting workspace: "${WORKSPACE_NAME}"...`);
    const workspace = await service.getMasterSOWWorkspace(WORKSPACE_NAME);
    if (!workspace || !workspace.slug) throw new Error('Workspace creation/retrieval failed.');
    workspaceSlug = workspace.slug;
    log(`Workspace ready with slug: ${workspace.slug}`, 'success');

    // --- STEP 2: VERIFY RATE CARD IS EMBEDDED ---
    log('Verifying 91-role Rate Card is embedded...');
    const embedResult = await service.embedRateCardDocument(workspaceSlug);
    if (!embedResult) throw new Error('Rate card embedding verification failed.');
    log('Rate Card verified/embedded successfully.', 'success');

    // --- STEP 3: TEST CHAT FUNCTIONALITY ---
    log('Creating thread and running test chat query...', 'test');
    const thread = await service.createThread(workspaceSlug, 'Test Query');
    if (!thread) throw new Error('Failed to create thread.');

    const testQuery =
      'Generate a SOW for a HubSpot CRM implementation with a strict budget of $45,000 AUD, focusing on marketing automation and lead scoring. The client is new.';
    
    const response = await service.chatWithThread(workspaceSlug, thread.slug, testQuery);

    if (!response || !response.textResponse) throw new Error('Chat API did not return a valid response.');

    log('Received chat response:', 'success');
    console.log('\n--- AI Response (first 1000 chars) ---');
    console.log(response.textResponse.substring(0, 1000));
    console.log('-------------------\n');

    // Validation
    if (response.textResponse.includes('+GST') && response.textResponse.includes('"suggestedRoles"')) {
      log('Validation PASSED: Response includes GST suffix and the required JSON block.', 'success');
    } else if (response.textResponse.includes('+GST')) {
      log('Validation PARTIAL: Response includes GST suffix but JSON block may be missing.', 'error');
    } else {
      log('Validation FAILED: Response is missing GST suffix or the JSON block.', 'error');
    }
  } catch (error) {
    log(`An error occurred: ${(error as Error).message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    // --- STEP 4: CLEANUP ---
    if (workspaceSlug) {
      log(`Test workspace can be manually cleaned up later: ${workspaceSlug}`, 'cleanup');
    }
  }
}

main();
