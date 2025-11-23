# Social Garden SOW Generator — Detailed Architecture Overview

## Purpose
- Generate, manage, and export Statements of Work (SOW) for Social Garden engagements.
- Provide AI-assisted authoring, analysis, and chat via AnythingLLM workspaces.
- Persist SOWs, activity, comments, and acceptance/rejection workflows in MySQL.
- Export artifacts: professional PDFs (WeasyPrint), Excel summaries, and Google Sheets.

## Technology Stack
- Frontend: `Next.js 15` (App Router), `React 18`, Tailwind UI components, TipTap-based rich editor, `mysql2` for server-side DB access.
- Backend: `FastAPI` (Python), `WeasyPrint` for PDF, `Jinja2` templating, Google APIs for OAuth and Sheets.
- Database: MySQL 8.0 (schema and migrations included).
- AI Platform: AnythingLLM (workspaces, threads, chat), proxied via Next.js API routes.
- Dev/Deploy: Docker Compose for local/prod multi-service orchestration; PM2 config (legacy) and helper scripts.

## High-Level Architecture
- Web client (Next.js) renders editor and dashboards; server-side API routes interact with MySQL, AnythingLLM, and the Python backend.
- Python backend offers PDF/Excel generation endpoints and Google Sheets integration (OAuth and service account).
- AnythingLLM handles AI generation and analysis; Next.js proxies requests and embeds SOW content back into workspaces for search/analytics.
- MySQL stores SOWs and engagement data; schema supports BI fields (`vertical`, `service_line`) and threaded comments.

## Frontend
- Entry/Layout: `+/root/the11-dev-clean/frontend/app/layout.tsx` sets global styles, fonts, metadata, and providers.
- Pages:
  - `+/root/the11-dev-clean/frontend/app/page.tsx` main workspace/editor (SOW creation, pricing tools, exports).
  - Admin: `+/root/the11-dev-clean/frontend/app/admin/*` settings (services, rate cards, etc.).
  - Portal: `+/root/the11-dev-clean/frontend/app/portal/*` client-facing views (requirements/SOW).
- Components:
  - Editor & UI: `+/root/the11-dev-clean/frontend/components/tailwind/*`, TipTap extensions, pricing table widgets `editable-pricing-table`.
  - SOW Export UI: `+/root/the11-dev-clean/frontend/components/sow/*` (PDF export wrappers, examples, create-sheet button).
- API Routes (server-side, App Router):
  - SOW CRUD and exports: `+/root/the11-dev-clean/frontend/app/api/sow/*`
    - `GET/PUT/DELETE /api/sow/[id]`: persistence + automatic `total_investment` calculation.
    - `GET /api/sow/[id]/export-excel`: calls Python backend `/export-excel` with structured SOW data.
    - `POST /api/sow/[id]/export-pdf`: calls Python backend `/generate-pdf` for PDFs.
    - `POST /api/sow/create`: validates roles and inserts SOW + logs activity.
  - PDF export (direct HTML or structured multi-scope):
    - `POST /api/generate-pdf` → forwards to `NEXT_PUBLIC_PDF_SERVICE_URL` `/generate-pdf` (TipTap → HTML conversion via `tiptapToHTML`).
    - `POST /api/generate-professional-pdf` → forwards to `/generate-professional-pdf` with discount validation.
  - Google Sheets: `POST /api/create-sow-sheet` → `backend:/create-sheet` or `/create-sheet-oauth`.
  - AnythingLLM:
    - `POST /api/anythingllm/chat` → workspace/thread chat; preserves `@agent` invocations.
    - `GET /api/anythingllm/workspace` → fetch workspace config/details.
- Libraries:
  - DB: `+/root/the11-dev-clean/frontend/lib/db.ts` creates a MySQL pool; exports helpers `query`, `queryOne`, `testConnection`.
  - Pricing: `+/root/the11-dev-clean/frontend/lib/export-utils.ts` extract pricing from TipTap/HTML, calculate totals, CSV/Excel export, TipTap JSON → HTML serializer.
  - SOW logic: `+/root/the11-dev-clean/frontend/lib/sow-utils.ts`, `pricingCalculator.ts`, `mandatory-roles-enforcer.ts`, `anythingllm.ts` embedding helpers.
- Config:
  - Next config: `+/root/the11-dev-clean/frontend/next.config.js` (standalone output, redirects, build flags).
  - Env example: `+/root/the11-dev-clean/frontend/.env.example` documents required vars.

## Backend (Python FastAPI)
- App: `+/root/the11-dev-clean/backend/main.py` defines endpoints:
  - `POST /generate-pdf`: TipTap-derived HTML wrapped in `SOW_TEMPLATE` + `DEFAULT_CSS`; outputs PDF via WeasyPrint.
  - `POST /generate-professional-pdf`: multi-scope SOW → totals (discount validation, GST) and professional template `multiscope_template.html`.
  - `POST /export-excel`: builds an in-memory Excel workbook from SOW pricing and sections.
  - `POST /create-sheet` and `POST /create-sheet-oauth`: Google Sheets creation (service account or OAuth access token).
  - OAuth: `GET /oauth/authorize`, `POST /oauth/token` using `GoogleOAuthHandler`.
  - Health: `GET /health`.
- Services:
  - OAuth: `+/root/the11-dev-clean/backend/services/google_oauth_handler.py` builds auth URL, exchanges code for tokens, encodes/decodes token dicts.
  - Sheets: `+/root/the11-dev-clean/backend/services/google_sheets_generator.py` creates formatted spreadsheet, moves to folder, applies branding, optional share.
- Dependencies: `+/root/the11-dev-clean/backend/requirements.txt` (FastAPI, WeasyPrint, Google APIs, XlsxWriter, dotenv, requests).

## Data & Database
- Schema: `+/root/the11-dev-clean/database/schema.sql` creates core tables:
  - `sows`: SOW document store with status, AnythingLLM IDs, timestamps, BI fields (`vertical`, `service_line`).
  - `sow_activities`: event tracking with JSON metadata.
  - `sow_comments`: threaded client/agency comments.
  - `sow_acceptances`: one acceptance record per SOW with legal fields and signature.
  - `sow_rejections`: reasoned rejections with AI follow-up records.
  - `ai_conversations`: per-SOW message log for AI interactions (signals, sentiment).
  - Views: `active_sows_dashboard` aggregating engagement metrics.
- Migrations and extras: `+/root/the11-dev-clean/database/migrations/*` add columns/tables (`chat_messages`, `users`, rate card roles, folders, dashboard chat schema).
- Frontend DB config: `+/root/the11-dev-clean/frontend/lib/db.ts` uses `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` (dotenv or env) and a pool.

## AnythingLLM Integration
- Workspace chat proxy: `+/root/the11-dev-clean/frontend/app/api/anythingllm/chat/route.ts`
  - Accepts `{messages, workspaceSlug|workspace, threadSlug, mode}`.
  - Defaults workspace to `gen-the-architect` if not provided.
  - Sends final user message verbatim (system prompt handled by workspace config).
  - Thread-aware endpoint for per-SOW threads; returns OpenAI-like completion shape.
- Workspace metadata: `+/root/the11-dev-clean/frontend/app/api/anythingllm/workspace/route.ts` requires `ANYTHINGLLM_URL` and `ANYTHINGLLM_API_KEY`.
- SOW embedding (best-effort): `PUT /api/sow/[id]` converts TipTap JSON → HTML and embeds in specific workspace and a master dashboard workspace.

## Export Pipelines
- PDF (standard): Frontend generates HTML via `tiptapToHTML` and calls backend `/generate-pdf`.
  - Frontend: `+/root/the11-dev-clean/frontend/app/api/generate-pdf/route.ts` with 60s timeout and file response.
  - Backend: `+/root/the11-dev-clean/backend/main.py` `SOW_TEMPLATE` and `DEFAULT_CSS` yielding branded PDF.
- PDF (professional multi-scope): Frontend validates discount and sends structured `scopes[]` to `/generate-professional-pdf`.
- Excel: Frontend builds `sowData` (pricing, discount, headings) and calls backend `/export-excel` → returns `.xlsx`.
- Google Sheets: `POST /api/create-sow-sheet` forwards to backend service account endpoint or OAuth endpoint when `accessToken` provided.

## Configuration & Environment
- Global example: `+/root/the11-dev-clean/.env.example`
  - DB connection, AnythingLLM URL/API key, OpenRouter/OpenAI (legacy), base URLs.
- Frontend example: `+/root/the11-dev-clean/frontend/.env.example`
  - Documents server-side and client-side AnythingLLM vars, backend URLs, Google OAuth, Vercel integrations, and optional analytics.
- Next.js uses `NEXT_PUBLIC_*` for client-accessible settings; backend URLs default to `http://localhost:8000`.

## Orchestration & Scripts
- Docker Compose: `+/root/the11-dev-clean/docker-compose.yml`
  - Services: `database` (MySQL 8.0), `backend` (FastAPI), `frontend` (Next.js standalone).
  - Networking: `sow-network` bridge; backend exposed at `8000`, frontend at `3001`.
  - Env wiring: passes DB creds to frontend/backend; sets `NEXT_PUBLIC_PDF_SERVICE_URL` to `http://backend:8000`.
- Dev helper: `+/root/the11-dev-clean/dev.sh`
  - Creates/activates Python venv, runs `uvicorn` for backend, runs `pnpm dev` for Next.js at `PORT=3333`.
  - Cleans ports `3333` and `8000`, verifies backend health via `/docs`.
- Backend runner: `+/root/the11-dev-clean/start-backend.sh` quick-start script for local `uvicorn` with venv setup.
- PM2 config (legacy paths): `+/root/the11-dev-clean/ecosystem.config.js` references `/root/the11/...` instead of `/root/the11-dev-clean/...` (see Inconsistencies).

## Security & Auth
- CORS: Backend FastAPI allows origins `https://sow-generator.socialgarden.com.au` and `http://localhost:3000`.
- OAuth: Google OAuth flow implemented with explicit token exchange and `encode_token` helper for safe transport.
- AnythingLLM: Frontend requires `NEXT_PUBLIC_ANYTHINGLLM_API_KEY` for chat proxy route; rejects if missing.
- Discount validation: Strict range checks (0–50%) on multi-scope PDFs to prevent negative totals or invalid inputs.

## Data Integrity & Business Logic
- Auto-calculation: `PUT /api/sow/[id]` recalculates `total_investment` when `content` changes, using pricing extraction.
- Mandatory roles: `POST /api/sow/create` validates presence of required roles in pricing tables; rejects invalid SOWs.
- TipTap JSON normalization: `tiptapToHTML` transforms custom pricing nodes into stable HTML with an optional summary section controlled by `showTotal`.

## Deployment Notes
- Compose is production-ready with standalone Next.js output; ensure proper env vars for AnythingLLM and Google Sheets.
- PM2 config file paths likely outdated; prefer Docker Compose or update paths to `the11-dev-clean`.

## Testing & Diagnostics
- Unit tests/live checks exist under `+/root/the11-dev-clean/tests/*` and `+/root/the11-dev-clean/frontend/lib/__tests__/*`.
- Logging: DB connection and queries log to console; dev.sh streams backend logs to `/tmp/backend.log`.

## Known Inconsistencies / TODO
- PM2 paths: `+/root/the11-dev-clean/ecosystem.config.js` points to `/root/the11/...` — update to `/root/the11-dev-clean/...` if using PM2.
- Backend logo asset: expects `social-garden-logo-dark-new.png`; repo contains `social-garden-logo-dark.png`. Add/update asset to match.
- Next.js `next.config.js` duplicates `productionBrowserSourceMaps` keys; prefer a single configuration.

## Quick Start
- Local dev without Docker:
  - Backend: `cd /root/the11-dev-clean/backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
  - Frontend: `cd /root/the11-dev-clean/frontend && pnpm install && PORT=3333 pnpm dev`
- Docker Compose (recommended):
  - Ensure env vars are set; run: `cd /root/the11-dev-clean && docker-compose up --build -d`
- Verify:
  - Frontend: `http://localhost:3001` (or `http://localhost:3333` for dev.sh).
  - Backend: `http://localhost:8000/health` and OpenAPI `http://localhost:8000/docs`.