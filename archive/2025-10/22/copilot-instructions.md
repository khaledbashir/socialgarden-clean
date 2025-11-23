<!-- Copilot instructions for contributors and AI assistants -->
# Quick Onboard: the11-dev (Social Garden SOW Generator)

This file is the **single source of truth** for understanding this codebase. Reference `ARCHITECTURE-SINGLE-SOURCE-OF-TRUTH.md` for comprehensive architectural details.

## Recent Updates (October 22, 2025 - LATEST)

**✅ COMPLETED (Latest Session - Production Ready):**
- ✅ **Auto-Navigation After Workspace Creation**: Users now auto-navigate to SOW editor instead of staying on dashboard (Commit: `1cf8bf4`)
- ✅ **Dashboard Chat Empty Response Fixed**: Added `openAiTemp: 0.7` + `openAiHistory: 25` to master dashboard workspace config (Commit: `172903a`)
- ✅ **Master Dashboard Purpose Corrected**: Changed prompt from generation-focused to analytics/query-focused. Master dashboard is for QUERYING embedded SOWs, NOT generating new ones (Commit: `3837a91`)
- ✅ **Workspace Type Selector Fully Implemented**: Users choose workspace type (SOW, Client Portal, Generic) when creating; SOW type auto-applies The Architect system prompt
- ✅ **Architect Prompt Enhanced with Rate Card**: Integrated complete 82-role Social Garden rate card (AUD $110-$200/hr) with retainer pricing logic into THE_ARCHITECT_SYSTEM_PROMPT (Commit: `2b14c54`)
- ✅ **All Chat Routing Fixed**: 4 critical bugs eliminated (401 errors, empty responses, wrong workspace routing)
- ✅ **TypeScript Compilation Fixed**: Updated interface signatures in sidebar-nav.tsx for workspace type parameter
- ✅ **Thread Slug Storage Fixed**: Added database column for proper thread tracking
- ✅ **Environment Configuration Corrected**: Identified and documented critical fix: `ANYTHINGLLM_URL` → `NEXT_PUBLIC_ANYTHINGLLM_URL` for client-side access
- ✅ **Production Documentation Created**: 6 comprehensive deployment guides with step-by-step instructions

**⏳ DEPLOYMENT STATUS (EasyPanel)**:
- Build status: Timeout issue (but may have succeeded anyway - need to verify)
- Code: All pushed to GitHub ✅
- Documentation: Complete with troubleshooting guides ✅
- Manual actions pending: Set env vars, reset master dashboard workspace

## Architecture (Big Picture)

**Multi-layer system with THREE distinct AI subsystems:**

- **Frontend:** Next.js 15.1 app (`frontend/app/`) - React + TipTap rich editor for SOW authoring. UI routes at `frontend/app/*`, API routes at `frontend/app/api/*`.
- **Backend PDF service:** FastAPI (`backend/main.py`) - renders HTML → PDF via WeasyPrint. Port 8000. Jinja2 templates + Social Garden brand CSS.
- **Persistence:** MySQL 8.0 (`database/schema.sql`) - SOW documents, activity tracking, AnythingLLM metadata.
- **AI Integration:** AnythingLLM (workspaces + embeddings) + OpenRouter (inline editor).

**Key concept:** `frontend/lib/anythingllm.ts` orchestrates multi-workspace AI strategy. One workspace per client + one master dashboard workspace for cross-client analytics.

## Three AI Systems (CRITICAL - UPDATED October 22)

Before editing ANY AI-related code, understand this architecture:

| System | Purpose | Backend | Endpoint | Model Field | Workspace Slug |
|--------|---------|---------|----------|-------------|---|
| **Dashboard AI** | Query all SOWs (analytics/business questions) | AnythingLLM master workspace | `/api/anythingllm/stream-chat` | `anythingllm` | `sow-master-dashboard` |
| **Gen AI (Architect)** | Generate new SOWs for clients | AnythingLLM per-client workspace | `/api/anythingllm/stream-chat` | `anythingllm` | `[client-workspace-slug]` (all SOW-type) |
| **Inline Editor AI** | Inline text generation in editor | OpenRouter (direct) | `/api/generate` | OpenRouter model name | N/A |

**CRITICAL UNDERSTANDING - Workspace Assignment & Prompts**:

When creating a workspace with type="SOW":
- Frontend calls `onCreateWorkspace(name, "sow")`
- AnythingLLM workspace created automatically
- System prompt applied via PATCH `/api/v1/workspace/{slug}/update` with:
  ```json
  {
    "openAiPrompt": THE_ARCHITECT_SYSTEM_PROMPT,
    "openAiTemp": 0.7,
    "openAiHistory": 25
  }
  ```
- THE_ARCHITECT_SYSTEM_PROMPT includes: 82-role rate card, retainer pricing logic, custom rate handling, validation checks
- **Result**: ALL client SOW workspaces are essentially "Architect workspaces" (same prompt)

**Master Dashboard vs Gen AI (Critical Distinction)**:
- **Master Dashboard** (`sow-master-dashboard`): 
  - Purpose: Query knowledge base (all embedded SOWs)
  - Prompt: Analytics/business-focused ("How many SOWs?", "Total revenue?")
  - Does NOT generate new SOWs
  - Contains copies of ALL SOWs from ALL workspaces (with [WORKSPACE] prefix)
- **Gen AI Workspaces** (per-client, type=SOW):
  - Purpose: Generate new SOWs for that client
  - Prompt: The Architect system prompt (with rate card)
  - Contains only that client's SOWs
  - Each client has their own workspace

**CRITICAL UNDERSTANDING - AnythingLLM Model/Workspace Relationship**:

When using AnythingLLM (Systems 1 & 2):
- The `model` field = **WORKSPACE SLUG** (e.g., "sow-master-dashboard", "gen-the-architect")
- **NOT** a provider/model like "claude-3-sonnet" or "gpt-4"
- Each workspace is pre-configured in AnythingLLM UI with: Provider (Claude/OpenAI/Gemini), Model version, Temperature, System prompt
- When we send `model: "sow-master-dashboard"`, AnythingLLM looks up that workspace and sees what provider/model it should use
- **Result**: Our app is provider-agnostic. We can swap Claude for OpenAI by just changing workspace settings in AnythingLLM UI without touching code

**Example Flow**:
```
Frontend sends: { model: 'sow-master-dashboard', messages: [...] }
                                    ↓
AnythingLLM looks up workspace 'sow-master-dashboard'
                                    ↓
Workspace config says: { provider: 'Claude', model: 'claude-3.5-sonnet', temp: 0.7 }
                                    ↓
AnythingLLM calls Claude API
                                    ↓
Response comes back
```

**Key files:**
- `frontend/lib/anythingllm.ts` — workspace + embedding orchestration
- `frontend/app/api/anythingllm/stream-chat/route.ts` — chat endpoint (streams responses)
- `frontend/app/api/generate/route.ts` — OpenRouter streaming (inline AI, REAL model names)
- `ARCHITECTURE-SINGLE-SOURCE-OF-TRUTH.md` — exhaustive system docs (READ FIRST)

## Deployment Architecture

**⚠️ CRITICAL: Deployment Status (October 2025)**

| Component | Current | Target | Status |
|-----------|---------|--------|--------|
| **Frontend (Next.js)** | EasyPanel (sow.qandu.me) | EasyPanel | ✅ Done |
| **Backend (FastAPI)** | PM2 (port 8000) | EasyPanel | 🚀 IN PROGRESS |
| **AnythingLLM** | EasyPanel (ahmad-anything-llm.840tjq.easypanel.host) | EasyPanel | ✅ Done |
| **MySQL** | Remote (168.231.115.219) | Remote | ✅ Done |

**Why move Backend to EasyPanel?**
- ✅ Matches frontend architecture (consistency)
- ✅ Auto-restart on crash
- ✅ Centralized logs + monitoring dashboard
- ✅ Easy env var management via UI
- ✅ Git push → auto-deploy (no SSH needed)
- ✅ Team scaling without SSH access
- ⚠️ Cost: ~$30/mo extra (vs $0 for PM2)

---

## Developer Workflows & Commands

**Local dev (one command):**
```bash
./dev.sh  # Kills containers, starts backend:8000 + frontend:3333 with hot reload
```

**Manual start:**
- Frontend: `cd frontend && pnpm install && pnpm dev`
- Backend: `cd backend && source venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload --host 0.0.0.0 --port 8000`

**Production via PM2 (LEGACY - moving to EasyPanel):**
- `pm2 start ecosystem.config.js` — starts sow-frontend (3001) + sow-backend (8000)
- `pm2 restart sow-frontend --update-env` — apply new env vars

## Critical Data Flows

**SOW Creation → Dual Embedding → AI Access:**
1. User creates SOW in editor (TipTap JSON)
2. Auto-save triggers `embedSOWInBothWorkspaces(clientSlug, title, content)` in `frontend/lib/anythingllm.ts`
3. Step 1: Upload to AnythingLLM via `/api/v1/document/raw-text` → get `documentLocation`
4. Step 2: Embed in client workspace via `/api/v1/workspace/{client-slug}/update-embeddings`
5. Step 3: Ensure `sow-master-dashboard` exists (created lazily)
6. Step 4: Embed same SOW in master dashboard with `[CLIENT-SLUG]` prefix for tracking
7. **Result:** Dashboard AI can query ALL SOWs across ALL workspaces. Gen AI has context for that workspace.

**PDF Export (Requires WeasyPrint-safe HTML):**
1. Frontend: `frontend/app/api/generate-pdf/route.ts` receives TipTap JSON
2. Convert via `generateHTML(content, defaultExtensions)` from `frontend/components/tailwind/extensions.ts`
3. POST HTML to backend `/generate-pdf` (60s timeout)
4. Backend renders Jinja2 template, injects embedded CSS from `DEFAULT_CSS` constant
5. WeasyPrint renders → returns PDF bytes

**Inline AI Chat (No Document Context):**
- User selects text in editor → clicks "Expand"/"Rewrite" action
- POST to `/api/generate` with selected text + command + model (from OpenRouter dropdown)
- Frontend streams response directly from OpenRouter (NOT AnythingLLM)
- Response inserted inline in editor

## Project-Specific Patterns

**TipTap → HTML Conversion (Critical for PDF):**
- Schema in `frontend/components/tailwind/extensions.ts` defines ProseMirror nodes
- On PDF export: MUST call `generateHTML(content, defaultExtensions)` to produce WeasyPrint-safe HTML
- Constraints: no CSS variables, no remote fonts, no JavaScript, tables must use `<table>/<tr>/<td>`
- If adding new TipTap nodes, ensure they convert to plain HTML

**Embedding Strategy (One SOW → Two Workspaces):**
- Every SOW is embedded in BOTH: client workspace + master dashboard
- Master dashboard slug: `sow-master-dashboard` (created automatically)
- Document naming in master: `[CLIENT-WORKSPACE-NAME] SOW Title` (prefix for tracking)
- Function: `AnythingLLMService.embedSOWInBothWorkspaces()` handles dual-embedding atomically
- If client workspace embed fails: whole operation fails. If master dashboard embed fails: operation succeeds (logs warning)

**Environment Variables:**
- `DB_HOST, DB_USER, DB_PASSWORD, DB_NAME` — MySQL
- `NEXT_PUBLIC_PDF_SERVICE_URL` — frontend→backend endpoint (default: `http://localhost:8000`)
- `ANYTHINGLLM_URL, ANYTHINGLLM_API_KEY` — workspace/thread management
- `OPENROUTER_API_KEY` — inline editor AI

## Project-Specific Patterns

**TipTap → HTML Conversion:**
- TipTap JSON schema defined in `frontend/components/tailwind/extensions.ts` (ProseMirror nodes: Paragraph, Heading, BulletList, OrderedList, Table, Image, Link, CodeBlock, etc.)
- On PDF export, **must** call `generateHTML(content, defaultExtensions)` to produce WeasyPrint-safe HTML
- Avoid client-side CSS features in generated HTML: no CSS variables, no remote fonts (use system fonts), no JavaScript
- Example: tables must be `<table>` tags with `<tr>/<td>`, not div-based layouts

**PDF Styling & Branding:**
- Brand colors: dark teal + social garden green
- All CSS embedded in `DEFAULT_CSS` constant in `backend/main.py` (WeasyPrint doesn't support external stylesheets)
- Social Garden logo: embedded as base64 in PDF header
- When updating PDF styles: test locally with `uvicorn main:app --reload`

**Integration Points & Gotchas**

**AnythingLLM Workspace Sync:**
- One workspace per client; created lazily on first embedding
- Workspace slug = `client_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')`
- Master dashboard slug is always `sow-master-dashboard` (not per-client)
- If workspace creation fails, retry on next sync interval (30s)

**Database Schema (MySQL):**
- `sows` table: id, title, client_name, content, workspace_slug, status (draft/sent/viewed/accepted/declined)
- `sow_activities` table: event log (created, viewed, commented)
- `sow_comments` table: tracking client feedback
- Migrations: edit `database/schema.sql`, then run `mysql -u sg_sow_user -p socialgarden_sow < schema.sql`

**Frontend API Routes:**
- `/api/sow/create` — create new SOW
- `/api/sow/[id]` — fetch/update SOW
- `/api/generate-pdf` — POST with HTML → returns PDF blob
- `/api/anythingllm/*` — proxy to AnythingLLM API
- `/api/generate` — OpenRouter streaming (inline AI)

## Debugging Checklist

**✅ FIXED: Dashboard Chat Empty Response (October 22, Commit: `172903a`)**
- **Was**: Dashboard chat returned 0 content length (empty responses)
- **Cause**: Master dashboard workspace config was missing temperature/history settings
- **Fix**: Updated `setMasterDashboardPrompt` to include:
  ```json
  {
    "openAiTemp": 0.7,
    "openAiHistory": 25
  }
  ```
- **Result**: Dashboard now returns actual data ✅

**✅ FIXED: Master Dashboard Wrong Purpose (October 22, Commit: `3837a91`)**
- **Was**: Master dashboard had generation-focused prompt (wrong purpose)
- **Now**: Master dashboard has analytics/query-focused prompt
- **Change**: Updated `setMasterDashboardPrompt` method in `frontend/lib/anythingllm.ts`
- **New Prompt**: "This is a QUERY workspace - you are NOT creating new SOWs, only analyzing existing ones"
- **Examples**: "How many SOWs?", "What's total revenue?", "Which clients have most SOWs?"
- **Result**: Dashboard properly queries embedded SOWs ✅

**✅ FIXED: Workspace Embedding (October 22, Commit: `6bd8166`)**
- **Was**: Embedding knowledge base immediately when workspace created
- **Now**: Only embeds when first SOW created (via `embedSOWInBothWorkspaces()`)
- **Result**: Clean workspace creation, no unnecessary API calls ✅

**✅ FIXED: Chat Messages Disappearing & 400 Errors (October 22, Commit: `f854863`)**
- **Root Cause**: Threads created in client workspace but accessed from gen-the-architect
- **How Fixed**: 3 code changes in `page.tsx`:
  - Line 683: Load chat from SOW's actual workspace
  - Line 1356: Create threads in client workspace
  - Line 2340: Route chat to SOW workspace
- **Result**: Messages persist, no duplicate threads, 400 errors eliminated ✅

**✅ FIXED: TypeScript Compilation (October 22, Commit: `370546d`)**
- **Was**: sidebar-nav.tsx calling onCreateWorkspace with 2 args but interface expected 1
- **Fix**: Updated interface to accept optional type parameter
- **Result**: Frontend compiles successfully ✅

**⚠️ PENDING: Environment Configuration (User Action)**
- **Issue**: `ANYTHINGLLM_URL` not exposed to browser code
- **Fix**: Change in `frontend/.env`: `ANYTHINGLLM_URL` → `NEXT_PUBLIC_ANYTHINGLLM_URL`
- **Why**: Next.js only exposes env vars with NEXT_PUBLIC_ prefix to client-side code
- **Status**: User needs to update .env and restart dev server

**PDF Export Returns 500:**
1. Check frontend console for timeout or service error message
2. If timeout: increase `AbortController` timeout in `route.ts` (currently 60s)
3. If service error: curl backend directly `http://localhost:8000/generate-pdf` with same HTML
4. Backend issues: WeasyPrint can't render remote fonts → use system fonts only

**Frontend → Backend 500 with "fetch failed":**
1. Verify `NEXT_PUBLIC_PDF_SERVICE_URL` is set and backend running
2. Check port 8000: `lsof -i :8000` or `netstat -tuln | grep 8000`
3. If not listening: `pm2 restart sow-backend`

**AnythingLLM Embedding Fails:**
1. Check API key in `frontend/lib/anythingllm.ts`
2. Verify workspace exists: curl with Authorization header to `/api/v1/workspaces`
3. Document upload fails if workspace doesn't exist - create workspace first
4. Check `embedSOWInBothWorkspaces()` logs for specific step that failed

**Database Connection Errors:**
1. Check MySQL is running: `systemctl status mysql` or `docker ps`
2. Verify credentials in `.env`
3. Test: `mysql -h DB_HOST -u DB_USER -p DB_NAME`
4. Pool exhausted? Check: `SHOW PROCESSLIST;` in MySQL

## Key Files by Purpose

| File | Purpose | Recent Changes |
|------|---------|---|
| `frontend/app/portal/sow/[id]/page.tsx` | SOW viewer, TipTap editor, PDF export UI | Updated workspace routing (3 locations) |
| `frontend/app/api/generate-pdf/route.ts` | PDF generation endpoint (60s timeout, forwards to backend) | No changes |
| `frontend/lib/anythingllm.ts` | Workspace creation, document embedding, thread sync | Updated master dashboard prompt (analytics-focused), added temp/history settings |
| `frontend/lib/knowledge-base.ts` | System prompts constant store | Updated THE_ARCHITECT_SYSTEM_PROMPT with 82-role rate card + retainer pricing logic (Commit: `2b14c54`) |
| `frontend/lib/db.ts` | MySQL connection pool (mysql2/promise) | Added thread_slug column support |
| `frontend/components/tailwind/sidebar-nav.tsx` | Sidebar navigation with workspace selector | Added workspace type selector (SOW/Client/Generic) and onCreateWorkspace type parameter |
| `backend/main.py` | FastAPI server: PDF generation, Google Sheets export, OAuth | No changes (Docker ready) |
| `database/schema.sql` | MySQL schema: sows, sow_activities, sow_comments, etc. | Added thread_slug column to sows table |
| `ecosystem.config.js` | PM2 process config for prod deployment | No changes (moving to EasyPanel) |

## Backend Migration to EasyPanel (NEXT TASK)

**Current**: FastAPI on PM2 (manual management)  
**Action**: Move to EasyPanel Docker (30 min)  

Steps:
1. Build Docker: `docker build -t socialgarden-backend:latest backend/`
2. Push to Docker Hub: `docker push YOUR-USERNAME/socialgarden-backend:latest`
3. In EasyPanel: Create Docker service, add env vars, deploy
4. Update frontend: `NEXT_PUBLIC_PDF_SERVICE_URL=https://sow-backend.easypanel.host`
5. Test: PDF export should work

See `ARCHITECTURE-SINGLE-SOURCE-OF-TRUTH.md` for complete migration guide.
