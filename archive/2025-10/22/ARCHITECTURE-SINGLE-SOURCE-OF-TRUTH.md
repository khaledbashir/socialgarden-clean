# 🏗️ ARCHITECTURE: Single Source of Truth

**🚨 CRITICAL: This document is the ONLY authoritative source for architecture. Always read it fully before making changes.**

**Last Updated**: October 22, 2025  
**Status**: In Development / Being Fixed  
**Environment**: VPS self-hosted on port 3000 (`localhost:3000`)

---

## 📋 ACTIVE ISSUES & FEATURES CHECKLIST

**Use this section to track current work. Check items as they're completed.**

### Current Sprint Issues
- [ ] **Issue**: Backend Migration to EasyPanel
  - **Status**: 📋 Documented, ready to execute
  - **Description**: Move FastAPI from PM2 to EasyPanel Docker for consistency
  - **Time Estimate**: ~30 minutes
  - **Steps**: 5-step Docker build/push/deploy process outlined below
  - **Next Step**: User approval + Docker Hub account setup

### Recent Fixes (October 22)
- [x] **COMPLETED**: Workspace Type Selector
  - **What it does**: Users select workspace type (SOW, Client Portal, Generic) when creating
  - **SOW Type**: Auto-configures with "The Architect" system prompt + Z.AI GLM 4.5 Air (free)
  - **Commits**: `9b05592`, `370546d`
  - **Files Modified**:
    - `frontend/components/tailwind/sidebar-nav.tsx` - UI with dropdown selector
    - `frontend/app/page.tsx` - Logic to apply prompt for SOW type
  - **Result**: Clean workspace setup, type-specific AI configuration ✅

- [x] **COMPLETED**: Architect Prompt Enhanced with Rate Card
  - **What it includes**: 82-role Social Garden rate card (AUD $110-$200/hr)
  - **Additional Features**: Retainer pricing logic (40-hour breakdown), custom rate handling, validation checklist
  - **File Modified**: `frontend/lib/knowledge-base.ts` - THE_ARCHITECT_SYSTEM_PROMPT constant
  - **Commit**: `2b14c54`
  - **Result**: System prompt now has all pricing logic for accurate SOW generation ✅

- [x] **FIXED**: Dashboard Chat Empty Response
  - **What was wrong**: Dashboard returned 0 content length (empty responses)
  - **Root cause**: Master dashboard workspace missing temperature/history settings
  - **How fixed**: Added `openAiTemp: 0.7`, `openAiHistory: 25` to workspace update
  - **File Modified**: `frontend/lib/anythingllm.ts` - setMasterDashboardPrompt method
  - **Commit**: `172903a`
  - **Result**: Dashboard now returns actual data ✅

- [x] **FIXED**: Master Dashboard Purpose Corrected
  - **What was wrong**: Master dashboard had generation-focused prompt (wrong purpose)
  - **How fixed**: Changed prompt to analytics/query-focused
  - **File Modified**: `frontend/lib/anythingllm.ts` - setMasterDashboardPrompt method
  - **Commit**: `3837a91`
  - **New Prompt Characteristics**: "This is a QUERY workspace - you are NOT creating new SOWs, only analyzing existing ones"
  - **Examples**: "How many SOWs this month?", "What's total revenue?", "Which clients have most SOWs?"
  - **Result**: Dashboard properly queries embedded SOWs for analytics ✅

- [x] **FIXED**: Dashboard Chat 401 Error
  - **What was wrong**: Dashboard was routing to OpenRouter instead of AnythingLLM
  - **Root cause**: effectiveAgent.model was 'google/gemini-2.0-flash-exp:free' instead of 'anythingllm'
  - **How fixed**: Changed dashboard agent model to 'anythingllm'
  - **Commit**: `01c8a4d`
  - **Result**: Dashboard now routes to `/api/anythingllm/stream-chat` → sow-master-dashboard workspace ✅

- [x] **FIXED**: Workspace Embedding Issue
  - **What was wrong**: Knowledge base embedded on empty workspaces immediately
  - **How fixed**: Removed premature embedding from `createOrGetClientWorkspace()`
  - **Commit**: `6bd8166`
  - **Result**: Clean workspace creation, no wasted API calls ✅

- [x] **FIXED**: Chat Messages Disappearing + 400 Errors
  - **What was wrong**: Threads created in client workspace but accessed from gen-the-architect
  - **How fixed**: 3 critical code changes to workspace routing in `page.tsx`
  - **Commit**: `f854863`
  - **Files Modified**:
    - Line 683: Load chat from SOW's actual workspace
    - Line 1356: Create threads in client workspace
    - Line 2340: Route chat to SOW workspace
  - **Result**: Messages persist, no duplicate threads, 400 errors eliminated ✅

- [x] **FIXED**: Gen AI Chat Empty Response
  - **What was wrong**: Thread slug not stored in database, was using SOW ID instead of AnythingLLM thread UUID
  - **How fixed**: Added `thread_slug` column to sows table, updated chat retrieval logic
  - **Commits**: Various
  - **Result**: Chat messages now display correctly, threads properly tracked ✅

- [x] **FIXED**: Dashboard Chat Double /stream-chat
  - **What was wrong**: Endpoint URL was doubled: `/api/anythingllm/stream-stream-chat`
  - **How fixed**: Check if `/stream-chat` already in URL before replacing
  - **Commit**: `b462dc7`
  - **Result**: Dashboard chat endpoint now routes correctly ✅

- [x] **FIXED**: TypeScript Compilation Error
  - **What was wrong**: sidebar-nav.tsx calling onCreateWorkspace with 2 args but interface expected 1
  - **How fixed**: Updated interface to accept optional type parameter
  - **Commit**: `370546d`
  - **Result**: Frontend compiles successfully ✅

- [ ] **PENDING**: Environment Configuration
  - **Issue**: `ANYTHINGLLM_URL` not exposed to browser code
  - **Fix Needed**: Change in `frontend/.env`: `ANYTHINGLLM_URL` → `NEXT_PUBLIC_ANYTHINGLLM_URL`
  - **Why**: Next.js only exposes env vars with NEXT_PUBLIC_ prefix to client-side code
  - **Status**: User needs to update .env and restart dev server

### Planned Features
- [ ] **Feature**: API Response Caching
  - **Status**: 🔵 Not started
  - **Description**: Cache AnythingLLM API responses to reduce latency
  - **Priority**: Medium

---

## 🚀 DEPLOYMENT & NEXT STEPS

**Current Status:**
- ✅ Frontend: EasyPanel (sow.qandu.me)
- ✅ AnythingLLM: EasyPanel (ahmad-anything-llm.840tjq.easypanel.host)
- ⚠️ Backend: PM2 (needs to move to EasyPanel)
- ✅ MySQL: Remote (168.231.115.219)

**NEXT TASK: Migrate Backend to EasyPanel**

Backend Dockerfile exists at `/root/the11-dev/backend/Dockerfile` and is production-ready.

**5-Step Process (~30 min):**

```bash
# Step 1: Build Docker image
cd /root/the11-dev/backend
docker build -t socialgarden-backend:latest .

# Step 2: Push to Docker Hub (need account)
docker tag socialgarden-backend:latest YOUR-USERNAME/socialgarden-backend:latest
docker push YOUR-USERNAME/socialgarden-backend:latest

# Step 3: In EasyPanel UI
# Create new Docker service:
# - Image: YOUR-USERNAME/socialgarden-backend:latest
# - Port: 8000
# - Env vars: Copy from /root/the11-dev/backend/.env
# - Click Deploy (wait 3 min)

# Step 4: Get backend URL from EasyPanel
# Example: https://sow-backend.840tjq.easypanel.host

# Step 5: Update frontend
# Edit: frontend/.env.production
# NEXT_PUBLIC_PDF_SERVICE_URL=https://sow-backend.840tjq.easypanel.host
# Redeploy frontend (automatic via GitHub)
```

**Test:**
```bash
curl https://sow-backend.840tjq.easypanel.host/docs
# Should show FastAPI docs (not 500 error)
```

---

/root/the11-dev/frontend/app/api/sow/create/ANYTHINGAPI   is the source of truth anythingllm intergation
---

## 📋 Table of Contents

1. [Quick Overview](#quick-overview)
2. [3 AI Systems](#3-ai-systems)
3. [Embedding Flow](#embedding-flow)
4. [Master Dashboard Architecture](#master-dashboard-architecture)
5. [Known Issues & Fixes](#known-issues--fixes)
6. [API Routes & Auth](#api-routes--auth)

---

## Quick Overview

**Social Garden SOW Generator** has THREE distinct AI systems:

| System | Purpose | Backend | Endpoint | Model |
|--------|---------|---------|----------|-------|
| **Dashboard AI** | Query all SOWs across all workspaces | AnythingLLM (Master Workspace) | `/api/anythingllm/stream-chat` | `anythingllm` |
| **Gen AI** | Generate new SOWs (The Architect) | AnythingLLM (gen-the-architect workspace) | `/api/anythingllm/stream-chat` | `anythingllm` |
| **Inline Editor AI** | Inline text generation in SOW editor | OpenRouter (direct) | `/api/generate` | Various (Gemini, Claude, etc) |

---

## 3 AI Systems

### System 1️⃣: Dashboard AI (Master Workspace)

**Purpose**: Client talks to "everything" - asks questions about ALL SOWs across ALL workspaces  
**Main Job**: Analytics, cross-client queries, "How many clients do we have?", "What's the budget for TTT?"

**Key Understanding - AnythingLLM Model/Workspace Relationship**:
- `model` field in our app = **WORKSPACE SLUG** (NOT a provider/model name like "claude-3-sonnet")
- Each workspace is pre-configured in AnythingLLM UI with: Provider (Claude/OpenAI/Gemini), Model version, Temperature, System prompt
- We pass workspace slug to AnythingLLM, it internally decides which provider/model to use
- **Example**: `model: "sow-master-dashboard"` → AnythingLLM looks up that workspace → sees it's configured for "Claude 3.5 Sonnet" → uses Claude

**Architecture**:
```
User → Dashboard View (right sidebar)
  ↓
Sends: { model: 'sow-master-dashboard', messages: [...] }
  ↓
Endpoint: /api/anythingllm/stream-chat
  ↓
AnythingLLM: Looks up workspace 'sow-master-dashboard'
  ↓
Sees workspace config: { provider: 'Claude', model: 'claude-3.5-sonnet', temp: 0.7 }
  ↓
Calls Claude API with that config
  ↓
Returns response to us
```

**Thread Location**: No threads in this mode. Pure Q&A against embedded SOWs.

---

### System 2️⃣: Gen AI (The Architect)

**Purpose**: Generate new SOWs with AI  
**Main Job**: Write SOWs, respond to prompts about specific SOW being edited

**Architecture**:
```
User in Editor → Clicks agent "GEN - The Architect"
  ↓
Sends: { model: 'gen-the-architect', workspace: 'gen-the-architect', threadSlug: 'xxx', messages: [...] }
  ↓
Endpoint: /api/anythingllm/stream-chat
  ↓
AnythingLLM: Looks up workspace 'gen-the-architect'
  ↓
Finds thread 'xxx' in that workspace
  ↓
Workspace config tells it: { provider: 'Claude', model: 'claude-3.5-sonnet', temp: 0.8 }
  ↓
Continues conversation in that thread
```

**Thread Location**: Threads stored IN the gen-the-architect workspace

---

### System 3️⃣: Inline Editor AI (OpenRouter)

**Purpose**: Quick text generation in editor (Expand, Rewrite, etc)  
**Main Job**: NOT AnythingLLM - uses OpenRouter directly for cost/speed

**Architecture**:
```
User selects text in editor → Clicks "Expand" action
  ↓
Sends: { model: 'openrouter model name', messages: [...] }  ← REAL model name like "claude-3-sonnet"
  ↓
Endpoint: /api/generate (NOT AnythingLLM!)
  ↓
Backend: Calls OpenRouter API directly with that real model name
  ↓
Returns response
```

**No Threads**: This is stateless - each request is independent

**Key Details**:
- **Workspace**: `sow-master-dashboard` (slug: `sow-master-dashboard`)
- **System Prompt**: "You are a helpful AI assistant for the Social Garden SOW Generator platform..."
- **Documents**: Contains embedded copies of ALL SOWs (with `[WORKSPACE]` prefix for context)
- **Thread**: Workspace-level chats (NOT thread-based, no per-SOW thread)
- **Model**: Uses AnythingLLM default model configured in workspace

**When It Gets Updated**:
- Every time a new SOW is created
- Every time a SOW is edited/saved
- See [Embedding Flow](#embedding-flow) below

**Current Issue**: ⚠️ 401 Unauthorized on chat send
- Symptom: Dashboard chat opens, but sending message returns 401
- Suspected Cause: Auth token not being sent with request OR token invalid
- Needs Investigation: Check `frontend/app/api/anythingllm/stream-chat/route.ts`

---

### System 2️⃣: Gen AI (gen-the-architect Workspace)

**Purpose**: Generate new SOWs, edit SOW content  
**Main Job**: Professional SOW generation with system prompt optimized for SOW creation

**Architecture**:
```
User → SOW Editor View
  ↓
Clicks "Create New SOW" OR opens existing SOW
  ↓
1. Creates/gets THREAD in gen-the-architect workspace (thread = SOW)
2. Thread slug = SOW ID (e.g., `sow-mh2d9qa6-37m3q`)
3. SOW embedded in BOTH:
   - gen-the-architect workspace (for generation AI access)
   - sow-master-dashboard workspace (for analytics AI access)
  ↓
User chats in editor → messages go to THIS thread
  ↓
/api/anythingllm/stream-chat
  ↓
AnythingLLM: gen-the-architect workspace → thread: sow-xyz
  ↓
AI responds with generation help
```

**Key Details**:
- **Workspace**: `gen-the-architect` (slug: `gen-the-architect`)
- **Thread**: Per-SOW thread (thread slug = SOW ID)
- **System Prompt**: Optimized for SOW generation (in workspace config on AnythingLLM)
- **Documents**: Only THAT SOW is embedded in thread context
- **Model**: Uses AnythingLLM default model configured in workspace

**When It Gets Updated**:
- When user creates a new SOW → creates thread in gen-the-architect
- When user saves SOW → embeds SOW in gen-the-architect + master dashboard
- See [Embedding Flow](#embedding-flow) below

**Current Status**: 
- ✅ Thread creation works (auto-creates on first chat if missing)
- ⚠️ 401 error when sending messages (same as Dashboard AI)

---

### System 3️⃣: Inline Editor AI (OpenRouter Direct)

**Purpose**: Inline text generation (rewrite, expand, etc) while editing SOW  
**Main Job**: Quick inline suggestions WITHOUT using AnythingLLM

**Architecture**:
```
User → In SOW editor, selects text
  ↓
Clicks AI action (e.g., "Expand", "Rewrite")
  ↓
/api/generate
  ↓
Frontend calls `/api/generate` with:
- prompt: user's AI command
- option: "zap" (inline generation)
- model: selected model (from dropdown)
- text: selected text in editor
  ↓
Backend streams response from OpenRouter API directly
  ↓
Response inserted inline in editor
```

**Key Details**:
- **Backend**: OpenRouter API (NOT AnythingLLM)
- **Endpoint**: `/frontend/app/api/generate/route.ts`
- **Models**: User can select from OpenRouter models (Claude, Gemini, GPT-4, etc) NOTHING coded it should be fetched
- **Auth**: Uses `OPENROUTER_API_KEY` environment variable
- **NOT a workspace**: Does NOT use AnythingLLM workspaces
- **NOT embedded**: Doesn't embed SOW content

**When It's Used**:
- User highlights text in editor
- Clicks AI action from toolbar
- Gets instant response without context of other SOWs

**Current Status**: 
- ✅ Working (no 401 errors reported)
- Uses separate auth (OpenRouter API key)

---

## Embedding Flow

**🔑 CRITICAL: Every SOW must be embedded in BOTH workspaces**

### What is "Embedding"?

In AnythingLLM, "embedding" = uploading a document into a workspace so the AI can reference it.

Flow:
1. **Create document** → Convert SOW HTML to text
2. **Upload to AnythingLLM** → `/api/v1/document/raw-text` → Get `documentLocation`
3. **Embed in workspace** → `/api/v1/workspace/{slug}/update-embeddings` → Add to workspace

### When SOW is Created

```
1. User creates new SOW
2. Frontend: `/frontend/app/page.tsx` → `handleCreateSOW()`
   ├─ Create thread in gen-the-architect workspace
   ├─ Save SOW to database
   └─ Call: anythingLLM.embedSOWInBothWorkspaces()
3. embedSOWInBothWorkspaces():
   ├─ Embed in gen-the-architect workspace
   │  └─ Thread context knows about this SOW
   ├─ Get or create master dashboard workspace
   └─ Embed in master dashboard with [WORKSPACE] prefix
4. Result:
   ✅ Dashboard AI can see it
   ✅ Gen AI can generate with it
```

### When SOW is Saved/Updated

```
1. User edits SOW and auto-saves
2. Frontend: `/frontend/app/page.tsx` → auto-save triggers
3. Call: anythingLLM.embedSOWInBothWorkspaces()
4. Same flow as creation
```

### Code Location

**File**: `/root/the11-dev/frontend/lib/anythingllm.ts`

**Key Functions**:
- `embedSOWDocument()` (lines 155-230): Upload + embed ONE SOW in ONE workspace
- `embedSOWInBothWorkspaces()` (lines 918-967): Embed in BOTH workspaces (main entry point)
- `getOrCreateMasterDashboard()` (lines 821-863): Ensure master dashboard workspace exists

**Implementation Details**:

```typescript
// Step 1: Convert SOW to text document
const enrichedContent = `# ${sowTitle}\n\n${textContent}...`;

// Step 2: Upload to AnythingLLM
POST /api/v1/document/raw-text
{
  textContent: enrichedContent,
  metadata: {
    title: sowTitle,
    docAuthor: 'Social Garden',
    docSource: 'SOW Generator'
  }
}
// Returns: { documents: [{ location: "custom-documents/..." }] }

// Step 3: Embed in workspace
POST /api/v1/workspace/{workspaceSlug}/update-embeddings
{
  adds: ["custom-documents/..."]
}
```

---

## Master Dashboard Architecture

### Purpose
Single workspace that contains copy of EVERY SOW from ALL workspaces. Enables dashboard AI to have full context.

### Workspace Details

| Property | Value |
|----------|-------|
| **Name** | SOW Master Dashboard |
| **Slug** | `sow-master-dashboard` |
| **Type** | Central Knowledge Base |
| **Created By** | Frontend on first dashboard load |
| **Documents** | All SOWs (with `[WORKSPACE]` prefix) |

### Document Naming in Master Dashboard

When SOW is embedded in master dashboard, it's prefixed with workspace name for context:

```
Gen AI creates: "Budget Planning SOW"
In gen-the-architect: [GEN-THE-ARCHITECT] Budget Planning SOW

Dashboard AI sees it as: [GEN-THE-ARCHITECT] Budget Planning SOW
Knows it came from "gen-the-architect" workspace
```

### Workflow

```
SOW Created in gen-the-architect workspace
  ↓
Step 1: Embed in gen-the-architect (for Gen AI to use)
  ↓
Step 2: Also embed in master dashboard with [GEN-THE-ARCHITECT] prefix
  ↓
Dashboard AI queries master dashboard
  ↓
Can see: "[GEN-THE-ARCHITECT] Budget Planning SOW"
         "[TTT-WORKSPACE] Property Estimate"
         "[UUUIIUI-WORKSPACE] Another SOW"
  ↓
Can answer: "How many SOWs in TTT workspace?" ✅
           "What's total budget across all?" ✅
           "Show me all real estate SOWs" ✅
```

---

## Known Issues & Fixes

### ✅ FIXED #1: Dashboard Chat Empty Response (October 22, 2025)

**Problem**: Dashboard chat returned empty responses (0 content length).

**Root Cause**: Master dashboard workspace was missing temperature and history settings. Only the system prompt was being set, not the LLM configuration.

**Fix Applied**:
- Updated `setMasterDashboardPrompt` in `frontend/lib/anythingllm.ts` to include:
  ```json
  {
    "openAiTemp": 0.7,
    "openAiHistory": 25
  }
  ```
- These settings are required for AnythingLLM workspaces to properly configure the underlying LLM

**Code Change**: `frontend/lib/anythingllm.ts` setMasterDashboardPrompt method

**Commit**: `172903a` - "fix: Add temperature and history settings to master dashboard prompt"

**Result**: Dashboard chat now returns actual data with proper content length ✅

---

### ✅ FIXED #2: Master Dashboard Purpose Correction (October 22, 2025)

**Problem**: Master dashboard had generation-focused prompt, but its purpose is analytics/querying.

**What It Should Be**:
- Master dashboard is a READ-ONLY query workspace
- Embeds copies of all SOWs from all client workspaces
- Used to answer questions like: "How many SOWs?", "What's total revenue?", "Which clients?" 
- NOT for generating new SOWs (that's what client SOW workspaces are for)

**Fix Applied**:
- Changed system prompt to analytics/query-focused
- Removed generation-focused language ("Generate reports", "strategic decision-making")
- Added explicit guidance: "This is a QUERY workspace - you are NOT creating new SOWs, only analyzing existing ones"
- Added examples of proper usage

**Code Change**: `frontend/lib/anythingllm.ts` setMasterDashboardPrompt method

**Commit**: `3837a91` - "fix: Update master dashboard prompt to be analytics/query focused"

**Result**: Dashboard AI now properly queries SOW knowledge base instead of trying to generate ✅

---

### ✅ FIXED #3: Workspace Type Selector & Auto-Configuration (October 22, 2025)

**Feature**: Users can now select workspace type when creating a workspace.

**Implementation**:
1. **UI Component**: Dropdown selector in sidebar-nav.tsx with three options:
   - 📄 Scope of Work (SOW)
   - 👥 Client Portal
   - 📋 Generic Workspace

2. **Auto-Configuration Logic**: When workspace created with type="SOW":
   - Frontend calls AnythingLLM `/api/v1/workspace/{slug}/update`
   - Applies THE_ARCHITECT_SYSTEM_PROMPT
   - Sets temperature=0.7 and history=25
   - **Result**: All SOW workspaces are now "Architect workspaces" with same system prompt

3. **Workspace Architecture**: 
   - SOW workspaces: Get The Architect prompt + rate card
   - Client Portal workspaces: Get system defaults
   - Generic workspaces: Get system defaults

**Code Changes**:
- `frontend/components/tailwind/sidebar-nav.tsx`: UI with type selector
- `frontend/app/page.tsx`: Logic to apply The Architect prompt for SOW type
- Interface updated: `onCreateWorkspace(name: string, type?: "sow" | "client" | "generic")`

**Commits**: `9b05592`, `370546d`

**Result**: Clean workspace creation with type-specific AI configuration ✅

---

### ✅ FIXED #4: Architect Prompt Rate Card Integration (October 22, 2025)

**Feature**: Integrated Social Garden's complete rate card into The Architect system prompt.

**What's Included**:
- 82+ Social Garden roles with AUD hourly rates ($110-$200/hr)
- Retainer pricing logic (40-hour allocation per month)
- Custom rate handling rules
- Validation checklist for SOW pricing
- Sanity checks for total investment

**Code Location**: `frontend/lib/knowledge-base.ts` constant `THE_ARCHITECT_SYSTEM_PROMPT`

**Example in Prompt**:
```
When pricing SOWs, reference this rate card:
- Senior Developer: $200/hr AUD
- Project Manager: $180/hr AUD
- Designer: $160/hr AUD
...82 more roles...

For retainers (e.g., 40 hours/month):
- Allocate across roles: 10 hrs PM, 20 hrs Dev, 5 hrs Design, 5 hrs QA
- Validate: Total hours = 40
- Calculate: (10 × PM_rate) + (20 × Dev_rate) + ...
```

**Commit**: `2b14c54` - "feat: Add complete 82-role rate card to Architect prompt with retainer logic"

**Result**: All SOW workspaces now have pricing authority built into system prompt ✅

---

### ✅ FIXED #5: Chat Messages Disappearing + 400 Errors (October 22, 2025)

**Root Cause**: Workspace routing mismatch - threads created in client workspace but accessed from gen-the-architect.

**Specific Issues**:
1. **Line 683** (`frontend/app/page.tsx`): Chat loaded from hardcoded workspace instead of SOW's actual workspace
2. **Line 1356** (`frontend/app/page.tsx`): Threads created in gen-the-architect instead of client workspace
3. **Line 2340** (`frontend/app/page.tsx`): Chat requests routed to gen-the-architect instead of SOW's workspace

**Fixes Applied**:
1. Load chat from `doc.workspaceSlug` (SOW's actual workspace)
2. Create threads in `workspace.workspace_slug` (client workspace)
3. Route chat to correct workspace based on SOW properties

**Code Changes**: `frontend/app/page.tsx` 3 critical locations

**Commit**: `f854863` - "fix: Route chat messages to correct workspace based on SOW"

**Result**: Messages now persist, no duplicate threads, 400 errors eliminated ✅

---

### ✅ FIXED #6: Workspace Embedding (October 22, 2025)

**Problem**: Knowledge base was embedded into empty workspaces immediately on creation.

**Fix Applied**:
- Removed `embedCompanyKnowledgeBase()` from `createOrGetClientWorkspace()` function
- Knowledge base now ONLY embeds when first SOW is created
- Triggered by `embedSOWInBothWorkspaces()` call

**Code Change**: `frontend/lib/anythingllm.ts` lines 93-109

**Commit**: `6bd8166` - "fix: Don't embed knowledge base when creating client workspaces"

**Result**: Clean workspace creation with no unnecessary API calls ✅

---

### ✅ FIXED #7: Thread Slug Storage (October 22, 2025)

**Problem**: Chat messages not persisting - threads created but couldn't find them later.

**Root Cause**: Using SOW database ID instead of AnythingLLM thread UUID for thread tracking.

**Fix Applied**:
- Added `thread_slug` column to `sows` table in MySQL
- Store actual AnythingLLM thread UUID in database
- Use this slug for all thread operations

**Database Change**: `database/schema.sql`
```sql
ALTER TABLE sows ADD COLUMN thread_slug VARCHAR(255) UNIQUE;
```

**Code Location**: `frontend/lib/db.ts` - Updated queries to use thread_slug

**Result**: Chat messages now display correctly, threads properly tracked ✅

---

### ✅ FIXED #8: TypeScript Compilation (October 22, 2025)

**Problem**: Frontend wouldn't compile - interface mismatch.

**Error**: sidebar-nav.tsx calling `onCreateWorkspace(name, type)` but interface expected only 1 parameter.

**Fix Applied**:
- Updated interface in sidebar-nav.tsx:
  ```typescript
  onCreateWorkspace: (name: string, type?: "sow" | "client" | "generic") => void
  ```

**Code Change**: `frontend/components/tailwind/sidebar-nav.tsx`

**Commit**: `370546d` - "fix: Update onCreateWorkspace interface to accept optional type parameter"

**Result**: Frontend compiles successfully ✅

---

### ⚠️ PENDING: Environment Configuration (User Action Required)

**Issue**: `ANYTHINGLLM_URL` not exposed to browser code.

**Root Cause**: Next.js only exposes environment variables with `NEXT_PUBLIC_` prefix to client-side code.

**Fix Required**: In `frontend/.env`
```bash
# Change this:
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host

# To this:
NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
```

**Why This Matters**:
- Frontend code runs in browser
- Browser cannot access env vars without NEXT_PUBLIC_ prefix
- Other backend routes can use ANYTHINGLLM_URL, but browser code needs NEXT_PUBLIC_ANYTHINGLLM_URL

**Status**: Awaiting user to update .env and restart dev server ⏳

---

## API Routes & Auth

### AnythingLLM Routes (All Need Auth)

| Endpoint | Purpose | Auth Header |
|----------|---------|-------------|
| `POST /api/v1/document/raw-text` | Upload SOW text | `Bearer {ANYTHINGLLM_API_KEY}` |
| `POST /api/v1/workspace/{slug}/update-embeddings` | Embed in workspace | `Bearer {ANYTHINGLLM_API_KEY}` |
| `POST /api/v1/workspace/{slug}/stream-chat` | Chat in workspace | `Bearer {ANYTHINGLLM_API_KEY}` |
| `GET /api/v1/workspace/{slug}/thread/{threadSlug}/chats` | Get thread messages | `Bearer {ANYTHINGLLM_API_KEY}` |
| `POST /api/v1/workspace/{slug}/thread/{threadSlug}/chat` | Message in thread | `Bearer {ANYTHINGLLM_API_KEY}` |
| `POST /api/v1/workspace/{slug}/thread/new` | Create thread | `Bearer {ANYTHINGLLM_API_KEY}` |

### Frontend Routes That Call AnythingLLM

| Frontend Route | Calls | Purpose |
|---|---|---|
| `/api/anythingllm/stream-chat` | `/v1/workspace/{slug}/stream-chat` | Dashboard/Gen AI chat |
| `/api/anythingllm/chat` | `/v1/workspace/{slug}/chat` | Non-streaming chat |
| `/api/generate` | OpenRouter (NOT AnythingLLM) | Inline editor |

### Environment Variables Required

```bash
# AnythingLLM Access
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA

# OpenRouter (for inline editor)
OPENROUTER_API_KEY=your-key-here

# Next.js Public
NEXT_PUBLIC_PDF_SERVICE_URL=http://localhost:8000
```

---

## Handover Notes

### What Works ✅
- ✅ SOW creation → thread auto-creates
- ✅ SOW embedding in both workspaces
- ✅ Inline editor AI (OpenRouter)
- ✅ Dashboard view loads
- ✅ Gen AI workspace exists
- ✅ Master dashboard auto-creates

### What's Broken ❌
- ❌ Dashboard AI chat (401 on send)
- ❌ Gen AI chat might have same 401 issue
- ❌ Chat messages not persisting (thread exists but 401 blocks load)

### Next Steps
1. **Debug 401 Error**: Add logging to `/api/anythingllm/stream-chat/route.ts`
2. **Verify Auth Token**: Check if `ANYTHINGLLM_API_KEY` is valid
3. **Test AnythingLLM**: Direct curl to AnythingLLM to verify it's accessible
4. **Fix Auth**: Ensure all AnythingLLM requests include Bearer token
5. **Retest**: Both Dashboard AI and Gen AI chat

---

## Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `/frontend/lib/anythingllm.ts` | AnythingLLM API wrapper | ✅ Embedding works |
| `/frontend/app/page.tsx` | Main app component, SOW creation | ✅ Creation works |
| `/frontend/app/api/anythingllm/stream-chat/route.ts` | Chat endpoint (ISSUE HERE) | ❌ 401 error |
| `/frontend/components/tailwind/agent-sidebar-clean.tsx` | Dashboard AI UI | ✅ UI works |
| `/frontend/components/tailwind/generative/ai-selector.tsx` | Inline editor AI | ✅ Works |

---

**LAST UPDATE**: October 22, 2025, 2:30 AM UTC  
**NEXT REVIEW**: After 401 error is fixed
