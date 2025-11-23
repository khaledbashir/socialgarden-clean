# System Architecture (October 22, 2025)

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           THE11-DEV System Architecture                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND LAYER (User-Facing)                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Next.js 15.1 Application (React)                                           │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Pages:                                                             │    │
│  │ • Dashboard (analytics, master SOW view)                           │    │
│  │ • SOW Editor (TipTap rich editor)                                  │    │
│  │ • Gardner Studio (AI agents)                                       │    │
│  │ • Admin (workspace management)                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Key Libraries:                                                              │
│  • TipTap (editor) → JSON → HTML → PDF                                      │
│  • React Markdown (display)                                                  │
│  • Axios (API calls)                                                        │
│  • shadcn/ui (components)                                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                ↓
                    (API calls via Axios)
                                ↓

┌──────────────────────────────────────────────────────────────────────────────┐
│ API LAYER (Frontend API Routes - Node.js)                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /api/sow/*                    - SOW CRUD operations                         │
│  /api/folders/*                - Folder management                           │
│  /api/gardners/*               - AI agent management                         │
│  /api/anythingllm/*            - AnythingLLM proxy                           │
│  /api/generate                 - OpenRouter inline AI                        │
│  /api/generate-pdf             - PDF generation (forwards to backend)        │
│  /api/oauth/*                  - Google authentication                       │
│  /api/preferences/*            - User preferences                            │
│                                                                              │
│  Language: TypeScript (Next.js App Router)                                   │
│  Database: MySQL (via mysql2/promise pool)                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                ↓
                    (HTTP requests)
                                ↓

┌──────────────────────────────────────────────────────────────────────────────┐
│ BACKEND LAYER (FastAPI Service)                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Primary Functions:                                                          │
│                                                                              │
│  1. PDF Generation                                                           │
│     POST /generate-pdf                                                       │
│     - Takes: HTML + TipTap JSON                                              │
│     - Uses: WeasyPrint (HTML → PDF renderer)                                 │
│     - Jinja2 templates with Social Garden branding                           │
│     - Embedded base64 images (logo, CSS)                                     │
│     - Returns: PDF blob                                                      │
│                                                                              │
│  2. Google Sheets Integration                                                │
│     POST /export-to-sheets                                                   │
│     - Takes: SOW data (title, client, scope, investment)                     │
│     - Reads: Google Service Account credentials                              │
│     - Creates/updates Google Sheets                                          │
│     - Auto-shares with client email                                          │
│                                                                              │
│  3. OAuth Handling                                                           │
│     GET /oauth/callback                                                      │
│     - Google OAuth redirect                                                  │
│     - Exchanges auth code for tokens                                         │
│                                                                              │
│  4. Health Check                                                             │
│     GET /health                                                              │
│     - EasyPanel monitoring endpoint                                          │
│                                                                              │
│  Language: Python (FastAPI)                                                  │
│  Server: Uvicorn (async ASGI)                                                │
│  Timeout: 60s for PDF generation                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                ↓
                (External service calls)
                                ↓

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. MySQL Database (168.231.115.219:3306)                                    │
│     • sows table (documents, metadata, status)                               │
│     • sow_activities table (tracking events)                                 │
│     • sow_comments table (client feedback)                                   │
│     • Accessed by: Frontend API + Backend                                    │
│                                                                              │
│  2. AnythingLLM (ahmad-anything-llm.840tjq.easypanel.host)                   │
│     • Workspaces (one per client + master dashboard)                         │
│     • Embeddings (SOW documents for context)                                 │
│     • Threads (chat conversations)                                           │
│     • Models: Claude 3.5 Sonnet (configurable via UI)                        │
│     • API: /api/v1/workspace/*, /api/v1/document/*, /api/v1/threads/        │
│                                                                              │
│  3. OpenRouter API (for inline editor AI)                                    │
│     • Used for: Quick text generation in SOW editor                          │
│     • Models: Claude, GPT-4, Gemini (user-selectable)                        │
│     • Endpoint: https://openrouter.ai/api/v1/chat/completions               │
│                                                                              │
│  4. Google Sheets + OAuth                                                    │
│     • Service Account: anythingllm-sheets@samsow-471202.iam...               │
│     • Creates/updates sheets with SOW summaries                              │
│     • OAuth for user authentication                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Creating a SOW

```
1. User creates SOW in TipTap editor
   ↓
2. Auto-save triggered every 5s
   ↓
3. Frontend: POST /api/sow/create
   ├─ Saves to MySQL (sows table)
   ├─ Calls: embedSOWInBothWorkspaces()
   └─ Returns: SOW ID
   ↓
4. Frontend: calls AnythingLLMService
   ├─ Create/get workspace for client
   ├─ Upload SOW document
   ├─ Embed in client workspace (for Architect AI)
   ├─ Embed in master dashboard workspace (for analytics)
   └─ Create default thread for chat
   ↓
5. SOW now available for:
   ├─ User editing
   ├─ AI generation (Architect agent in that workspace)
   ├─ Dashboard analytics (querying master dashboard)
   └─ PDF export (frontend → backend → WeasyPrint)
```

---

## Data Flow: Exporting to PDF

```
1. User clicks "Export to PDF" in SOW editor
   ↓
2. Frontend: generateHTML(content, extensions)
   ├─ Converts TipTap JSON to HTML
   ├─ Validates no remote fonts (WeasyPrint limitation)
   └─ Creates WeasyPrint-safe HTML
   ↓
3. Frontend: POST /api/generate-pdf
   ├─ Sends: HTML blob
   ├─ Timeout: 60 seconds
   └─ Forwards to backend
   ↓
4. Backend: POST /generate-pdf
   ├─ Receives HTML
   ├─ Loads Jinja2 template
   ├─ Injects DEFAULT_CSS (embedded styles)
   ├─ Calls WeasyPrint.write_pdf(html)
   └─ Returns: PDF bytes
   ↓
5. Frontend: Receives PDF blob
   ├─ Creates download link
   └─ User downloads file
```

---

## Data Flow: Dashboard Analytics

```
1. User opens Dashboard
   ↓
2. Frontend: Query master dashboard workspace (AnythingLLM)
   ├─ Workspace slug: "sow-master-dashboard"
   ├─ Contains: Embeddings of ALL SOWs from ALL workspaces
   └─ Prompt: "Analyze these SOWs for business insights"
   ↓
3. User asks question: "How many SOWs this month?"
   ↓
4. Frontend: POST /api/anythingllm/stream-chat
   ├─ Workspace: sow-master-dashboard
   ├─ Message: "How many SOWs this month?"
   ├─ AnythingLLM retrieves: Relevant SOW embeddings
   ├─ Claude analyzes them
   └─ Streams response back
   ↓
5. Frontend: Displays streamed response
   ├─ With thinking accordion (if using Claude with <think> tags)
   └─ User sees insights
```

---

## Three AI Systems

| System | Purpose | Backend | Workspace | Model |
|--------|---------|---------|-----------|-------|
| **Dashboard AI** | Query all SOWs for analytics | AnythingLLM | sow-master-dashboard | Claude 3.5 Sonnet |
| **Architect AI** | Generate new SOWs for client | AnythingLLM | [client-slug] | Claude 3.5 Sonnet |
| **Inline Editor AI** | Quick text generation | OpenRouter | N/A | User-selectable |

---

## Deployment

### Frontend
- **Code**: `the11-dev/frontend/` (GitHub)
- **Container**: EasyPanel (Node.js)
- **Port**: 3001 (internal) / https://sow.qandu.me (external)
- **Deploy**: Git push → EasyPanel auto-deploys

### Backend
- **Code**: `the11-dev/backend/` (GitHub)
- **Container**: EasyPanel (Docker via backend/Dockerfile)
- **Port**: 8000 (internal) / https://sow-backend.*.easypanel.host (optional external)
- **Deploy**: Git push → EasyPanel builds Docker → runs

### Database
- **Type**: MySQL 8.0
- **Host**: 168.231.115.219 (remote, NOT containerized)
- **Persistence**: Data survives container restarts
- **Access**: Both frontend & backend connect via credentials

### AnythingLLM
- **Host**: https://ahmad-anything-llm.840tjq.easypanel.host
- **Access**: API key based
- **Workspaces**: Auto-created per client + master dashboard
- **Model**: Configured in AnythingLLM UI (default: Claude 3.5 Sonnet)

---

## Key Files by Layer

### Frontend
- `frontend/app/page.tsx` - Main dashboard
- `frontend/app/portal/sow/[id]/page.tsx` - SOW editor
- `frontend/lib/anythingllm.ts` - AI orchestration
- `frontend/lib/db.ts` - MySQL queries
- `frontend/app/api/*/route.ts` - API endpoints

### Backend
- `backend/main.py` - FastAPI server
- `backend/routes/pdf.py` - PDF generation
- `backend/routes/sheets.py` - Google Sheets export

### Database
- `database/schema.sql` - MySQL schema
- `database/migrations/` - Schema updates

### Infrastructure
- `Dockerfile` - Frontend image
- `backend/Dockerfile` - Backend image
- `docker-compose.yml` - Local development

---

## Summary

**One codebase (GitHub) → Two deployable services (EasyPanel) → Multiple AI backends (AnythingLLM + OpenRouter)**

All orchestrated through:
- Next.js frontend
- FastAPI backend
- External MySQL database
- AnythingLLM workspaces
