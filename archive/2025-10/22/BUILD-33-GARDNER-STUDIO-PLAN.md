# Build 33: Gardner Studio - Simplified UI + Predefined Workspace Config

**Date:** October 19, 2025  
**Status:** PLANNING → IMPLEMENTATION  
**Build Number:** 33  
**Focus:** Gardner Studio as simplified UI layer + Auto-configured workspaces

---

## 🎯 Vision

**Gardner = AnythingLLM Workspace with Simplified UI**

When user creates a Gardner:
1. ✅ Backend: Creates AnythingLLM workspace with PREDEFINED CONFIG
2. ✅ Frontend: Shows only 3-4 client-friendly tabs (NOT all AnythingLLM settings)
3. ✅ Config: Auto-applies optimal settings (provider, model, agent skills, etc)
4. ✅ User Control: Can only customize name, prompt, profile image

---

## 📋 Implementation Checklist

### Phase 1: Backend API Enhancement
- [ ] Update `/api/gardners/create` to auto-configure workspace with predefined config
- [ ] Set default LLM provider: OpenRouter
- [ ] Set default chat model: z-ai/glm-4.5-air:free
- [ ] Set default agent model: openai/gpt-oss-20b:free
- [ ] Enable default agent skills: RAG, docs, web scrape, charts, web search
- [ ] Set default chat settings: history=20, temperature=0.7, context=4
- [ ] Create `/api/gardners/[slug]/settings` endpoint for editing user-exposed fields only

### Phase 2: Gardner Studio UI Simplification
- [ ] Modify GardnerCreator to hide technical fields (temperature, chat history, chat mode)
- [ ] Simplify to 3 sections: 1) Basic (name), 2) Prompt, 3) Preview
- [ ] Update GardnerCard to show only essential info
- [ ] Create new Gardner Settings Modal with 3 tabs:
  - [ ] Tab 1: General (name, suggested messages, profile image)
  - [ ] Tab 2: System Prompt
  - [ ] Tab 3: Agent (provider + model dropdowns ONLY)
- [ ] Remove all other tabs/settings from Gardner UI

### Phase 3: Database Schema Update
- [ ] Gardner table already exists, ensure fields:
  - workspace_slug ✅
  - workspace_id (add if missing)
  - name
  - profile_image_url (add if missing)
  - suggested_messages (add if missing)

### Phase 4: Integration & Testing
- [ ] Test creating new Gardner (should create workspace + auto-config)
- [ ] Test editing name/prompt/image
- [ ] Test that chat still works with configured workspace
- [ ] Verify AnythingLLM workspace has all settings pre-applied

---

## 🛠️ Predefined Workspace Config (To Auto-Apply)

When creating new Gardner/Workspace:

```json
{
  "chatProvider": "openrouter",
  "chatModel": "z-ai/glm-4.5-air:free",
  "openAiTemp": 0.7,
  "openAiHistory": 20,
  "chatMode": "chat",
  "topN": 4,
  "agentProvider": "openrouter",
  "agentModel": "openai/gpt-oss-20b:free",
  "agentSkills": {
    "rag": true,
    "viewDocs": true,
    "webScrape": true,
    "generateCharts": true,
    "webSearch": true,
    "sqlConnector": false,
    "generateFiles": false
  }
}
```

---

## 🎨 Gardner Studio UI Structure (Build 33)

### Current (WRONG - Too Complex)
```
Gardner Creator:
- Name
- System Prompt
- Temperature slider (confusing for users)
- Chat History dropdown
- Chat Mode toggle
- Model selection (too technical)
```

### New (RIGHT - Simple & Client-Friendly)
```
Create Gardner Dialog:
┌────────────────────────────────────┐
│ Gardner Name *                      │
│ [Input field]                       │
│                                     │
│ System Prompt *                     │
│ [Textarea - full instructions]      │
│                                     │
│ [Create Button]                     │
└────────────────────────────────────┘

Edit Gardner Dialog (3 Tabs):
┌────────────────────────────────────┐
│ General | Prompt | Agent  X        │
├────────────────────────────────────┤
│ GENERAL TAB:                        │
│  - Name                             │
│  - Suggested Messages               │
│  - Profile Image                    │
│                                     │
│ PROMPT TAB:                         │
│  - System Prompt (textarea)         │
│                                     │
│ AGENT TAB:                          │
│  - Provider: [Dropdown]             │
│  - Model: [Dropdown]                │
│                                     │
│ [Save] [Cancel]                     │
└────────────────────────────────────┘
```

---

## 📝 Code Changes Required

### 1. Update API: `/api/gardners/create/route.ts`

**Before:**
```typescript
const response = await fetch(`${this.baseUrl}/api/v1/workspace/new`, {
  body: JSON.stringify({ name: clientName })
});
```

**After:**
```typescript
// Step 1: Create workspace
const workspaceResponse = await fetch(`${ANYTHINGLLM_URL}/api/v1/workspace/new`, {
  body: JSON.stringify({ name: gardnerName })
});

// Step 2: Auto-apply predefined config
const configResponse = await fetch(
  `${ANYTHINGLLM_URL}/api/v1/workspace/${workspaceSlug}/update`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}` },
    body: JSON.stringify({
      // Chat config
      chatProvider: 'openrouter',
      chatModel: 'z-ai/glm-4.5-air:free',
      openAiTemp: 0.7,
      openAiHistory: 20,
      chatMode: 'chat',
      topN: 4,
      // Agent config
      agentProvider: 'openrouter',
      agentModel: 'openai/gpt-oss-20b:free'
    })
  }
);

// Step 3: Enable agent skills
const skillsResponse = await fetch(
  `${ANYTHINGLLM_URL}/api/v1/system/agent-skills`,
  {
    method: 'POST',
    body: JSON.stringify({
      rag: true,
      viewDocs: true,
      webScrape: true,
      generateCharts: true,
      webSearch: true,
      sqlConnector: false,
      generateFiles: false
    })
  }
);
```

### 2. New API: `/api/gardners/[slug]/settings/route.ts`

```typescript
// GET: Get Gardner settings (name, prompt, image)
// POST: Update only user-editable fields (name, prompt, image)

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  // Return: { name, systemPrompt, profileImage, suggestedMessages }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  // Accept: { name?, systemPrompt?, profileImage?, suggestedMessages? }
  // Update workspace + database
  // Return: updated Gardner
}
```

### 3. Update Component: `GardnerCreator.tsx`

```typescript
// Remove all technical fields:
// - temperature slider ❌
// - chat history ❌
// - chat mode toggle ❌

// Keep only:
// - name field ✅
// - system prompt textarea ✅
// - [Create] button ✅

// Everything else auto-configured in backend
```

### 4. Create Component: `GardnerSettings.tsx` (Modal)

```typescript
// New modal with 3 tabs:
// Tab 1: General
//  - Name input
//  - Suggested messages (array)
//  - Profile image upload
//
// Tab 2: System Prompt  
//  - Textarea for prompt
//
// Tab 3: Agent
//  - Provider dropdown (only shows available)
//  - Model dropdown (loads based on provider)

// All calls to /api/gardners/[slug]/settings
```

### 5. Update Component: `GardnerCard.tsx`

```typescript
// Before: Shows all settings (temperature, history, etc) - confusing
// After: Shows only name, category, created date - clean

// Remove:
// - Temperature display ❌
// - Chat history badge ❌
// - Chat mode label ❌

// Keep:
// - Gardner name ✅
// - Category ✅
// - Created date ✅
// - Edit/Delete/Chat buttons ✅
```

---

## 🔄 User Flow (Build 33)

### Create Gardner
```
User clicks "Create Gardner"
  ↓
Modal shows: Name + Prompt only
  ↓
User fills in, clicks Create
  ↓
Backend:
  1. Creates AnythingLLM workspace
  2. Auto-applies all config (provider, model, agent skills, etc)
  3. Saves to database
  ↓
Frontend:
  1. Modal closes
  2. New Gardner appears in list
  3. Chat ready to use immediately
```

### Edit Gardner
```
User clicks "Edit" on Gardner card
  ↓
Settings Modal opens with 3 tabs
  ↓
User can change:
  - Name (tab 1)
  - Prompt (tab 2)
  - LLM provider/model (tab 3)
  ↓
Everything else is locked/hidden (already optimized)
  ↓
User clicks Save
  ↓
Backend updates workspace + database
  ↓
Changes apply immediately to chat
```

---

## ✅ Success Criteria

- [ ] User creates Gardner = workspace created with full config auto-applied
- [ ] Gardner UI shows ONLY 3-4 fields (name, prompt, image, model)
- [ ] No technical AnythingLLM settings visible in Gardner Studio
- [ ] Temperature/history/threshold/similarity all hidden (pre-optimized)
- [ ] Edit Modal has 3 clean tabs
- [ ] Chat immediately works after Gardner creation (config pre-done)
- [ ] Can change name/prompt/model without touching other settings

---

## 📊 Build 33 Deliverables

| Component | Current | Build 33 |
|-----------|---------|----------|
| Gardner Creator | Complex (7 fields) | Simple (2 fields) |
| Gardner Settings | N/A | New modal (3 tabs) |
| Auto Config | No | Yes (full preset) |
| User-visible settings | 7 (too many) | 4 (just right) |
| Technical settings | Exposed | Hidden |
| Predefined config | None | Complete |

---

## 🚀 Timeline

**Phase 1 (Backend):** ~30 minutes
**Phase 2 (UI):** ~45 minutes  
**Phase 3 (Database):** ~15 minutes
**Phase 4 (Testing):** ~20 minutes

**Total:** ~2 hours

---

## 🔐 Notes for Implementation

1. **Don't break existing Gardners:** Only apply predefined config to NEW Gardners
2. **Preserve backward compatibility:** Existing Gardners keep their settings
3. **Agent skills API:** Check if AnythingLLM v1.9.0 has this endpoint
4. **Provider/model lists:** Fetch available from AnythingLLM system endpoints
5. **Rate limiting:** Use Free tier models (no cost escalation)

---
