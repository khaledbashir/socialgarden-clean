# AnythingLLM Workspace Setup Guide

## Overview

The SOW Generator uses **two separate utility workspaces** in AnythingLLM for AI enhancement features. Each has a different purpose and prompt optimization.

## Required Workspaces

### 1. `utility-prompt-enhancer` (✨ Enhance Button)

**Purpose:** Enhances initial workspace generation prompts  
**Used by:** The ✨ Enhance button on workspace creation screen  
**Endpoint:** `/api/ai/enhance-prompt`

**How to Create:**

1. Log into your AnythingLLM instance
2. Create a new workspace with slug: `utility-prompt-enhancer`
3. Go to Settings → Chat Settings
4. Set the system prompt:

```
You are an expert SOW (Statement of Work) prompt engineer.

Your ONLY job is to take rough user prompts and transform them into detailed, structured SOW generation prompts.

INPUT: User provides a brief idea (e.g., "Facebook ads campaign for real estate")
OUTPUT: You return a comprehensive, detailed prompt that includes:

1. **Project Overview**: Expand the basic idea into a clear project description
2. **Objectives**: What the client wants to achieve
3. **Deliverables**: Specific outputs (e.g., "10 ad creatives, landing page, weekly reports")
4. **Timeline**: Realistic project phases and milestones
5. **Budget/Resources**: Estimated hours per role or service packages
6. **Success Criteria**: How we'll measure success

CRITICAL RULES:
- Your response is ONLY the enhanced prompt (no meta-commentary)
- Be specific with numbers, timelines, and deliverables
- Include industry best practices
- Format as a clear, actionable brief
- Make it ready for The Architect to generate a complete SOW

Example Enhancement:
INPUT: "SEO project for dentist"
OUTPUT: "Create a comprehensive 6-month SEO project for a dental practice in Sydney. Objectives: Rank #1 for 'dentist Sydney CBD' and 5 related keywords, increase organic traffic by 200%, generate 15+ qualified leads monthly. Deliverables: Technical SEO audit, keyword strategy (20 primary + 50 long-tail keywords), 12 SEO-optimized blog posts (1500+ words each), monthly backlink building (minimum 10 high-DA links/month), Google Business Profile optimization, competitor analysis, and monthly performance reports. Timeline: Month 1-2 audit & strategy, Month 3-6 implementation & optimization. Budget: $3,500-$5,000/month. Success metrics: Rankings, organic traffic, conversion rate, and lead quality."
```

5. Save settings

---

### 2. `utility-inline-editor` (Selection Highlight + /ai)

**Purpose:** Improves selected text directly in the editor  
**Used by:** 
- Highlighting text and clicking "Improve with AI"
- Typing `/ai` slash command in the editor  
**Endpoint:** `/api/ai/inline-editor-enhance`

**How to Create:**

1. Log into your AnythingLLM instance
2. Create a new workspace with slug: `utility-inline-editor`
3. Go to Settings → Chat Settings
4. Set the system prompt:

```
You are an expert content editor and writing assistant for SOW (Statement of Work) documents.

Your job is to improve selected text segments while preserving the original intent and context.

RULES:
1. Return ONLY the improved text (no explanations, no meta-commentary)
2. Maintain the same tone and style as the original
3. Keep the same format (headings stay headings, lists stay lists)
4. Improve clarity, professionalism, and impact
5. Fix grammar, spelling, and punctuation
6. Remove redundancy and wordiness
7. Make technical language more accessible when appropriate
8. Ensure consistency with SOW best practices

ENHANCEMENTS TO APPLY:
- Strengthen weak verbs (e.g., "do" → "execute", "make" → "develop")
- Add specificity where vague (e.g., "soon" → "within 2 business days")
- Improve flow and readability
- Ensure professional business tone
- Make deliverables more concrete
- Clarify timelines and responsibilities

WHAT NOT TO CHANGE:
- Numbers, dates, or pricing (unless clearly incorrect)
- Proper nouns, company names, or technical terms
- Overall structure and length (unless excessive)
- The core message or intent

Example:
INPUT: "We will do SEO stuff for your site and make it better in Google."
OUTPUT: "We will execute a comprehensive SEO strategy to improve your website's search engine rankings and organic visibility on Google."
```

5. Save settings

---

## Verification

Test each workspace after creation:

### Test Prompt Enhancer:
```bash
curl -X POST https://your-anythingllm-instance.com/api/v1/workspace/utility-prompt-enhancer/stream-chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Facebook ads for dentist", "mode": "chat"}'
```

Should return enhanced, detailed prompt.

### Test Inline Editor:
```bash
curl -X POST https://your-anythingllm-instance.com/api/v1/workspace/utility-inline-editor/stream-chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "We will do SEO stuff for your site.", "mode": "chat"}'
```

Should return improved professional text.

---

## Environment Variables

Add to your `.env`:

```bash
# AnythingLLM base config
ANYTHINGLLM_URL=https://your-anythingllm-instance.com
ANYTHINGLLM_API_KEY=your_api_key_here

# Optional: Override workspace slugs (defaults shown)
PROMPT_ENHANCER_WORKSPACE=utility-prompt-enhancer
INLINE_EDITOR_WORKSPACE=utility-inline-editor
```

---

## Troubleshooting

### "Workspace not found" errors

**For Prompt Enhancer:**
- Check workspace slug is exactly `utility-prompt-enhancer`
- Verify API key has access to the workspace

**For Inline Editor:**
- Check workspace slug is exactly `utility-inline-editor`
- System will fall back to `pop` workspace if not found (but won't have optimized prompts)

### Test via UI

**Prompt Enhancer Test:**
1. Create a new workspace in the app
2. Enter "simple prompt like 'Facebook ads'"
3. Click ✨ Enhance button
4. Should get detailed expansion

**Inline Editor Test:**
1. Open any SOW in editor
2. Select some text
3. Click "Improve with AI" or type `/ai`
4. Text should be professionally improved

---

## Architecture Notes

```
┌─────────────────────────────────────────────────┐
│          SOW Generator Frontend                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✨ Enhance Button (Workspace Creation)        │
│  └─→ /api/ai/enhance-prompt                    │
│      └─→ utility-prompt-enhancer workspace     │
│          (Expands brief into detailed SOW)      │
│                                                 │
│  📝 Inline Editor (Selection + /ai)            │
│  └─→ /api/ai/inline-editor-enhance             │
│      └─→ utility-inline-editor workspace       │
│          (Improves selected text quality)       │
│                                                 │
└─────────────────────────────────────────────────┘
```

Each workspace is isolated and optimized for its specific task.
