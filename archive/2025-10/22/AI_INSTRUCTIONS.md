# AI Coder Instructions — Development Repo (production-latest)

Date: October 19, 2025

Purpose: Provide a concise set of instructions for any developer or AI assistant working in the `production-latest` branch of the `the11-dev` repository so changes feel seamless and do not accidentally break production.

---

## Quick goals
- Work in `production-latest` (dev repo). Do not push directly to `main` in `the11` unless explicitly instructed.
- Keep production assumptions intact: API contracts, endpoints, and env var names should not change without coordination.
- If you change an API route or contract, update tests and documentation and open a PR to `the11`.

---

## Important files & locations
- Frontend Next app: `frontend/app/`
- API routes (Next.js app router): `frontend/app/api/`
- Backend PDF service: `backend/` (FastAPI)
- DB schema & migrations: `database/`
- Environment template: `.env.example`
- Repository workflow doc: `REPOSITORY-SETUP-DOCUMENTATION.md`

---

## Required environment variables (minimum)
Copy `.env.example` to `.env` and fill these at minimum for local dev:

# Database
DB_HOST=localhost
DB_USER=sg_sow_user
DB_PASSWORD=secret
DB_NAME=socialgarden_sow
DB_PORT=3306

# AnythingLLM (chat)
ANYTHINGLLM_URL=https://your-anythingllm-instance
ANYTHINGLLM_API_KEY=your_api_key

# OpenRouter / OpenAI
OPENROUTER_API_KEY=your_openrouter_key
# OR
OPENAI_API_KEY=your_openai_key

# App URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3333
NEXT_PUBLIC_API_URL=http://localhost:8000
FRONTEND_PORT=3333

---

## Start the project locally (recommended)
1. Install dependencies

```bash
# frontend
cd frontend && pnpm install

# backend
cd backend && python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Run all services (dev.sh is available)

```bash
# from repo root
./dev.sh
```

If `dev.sh` is unavailable, start services individually:

```bash
# frontend
cd frontend
pnpm dev

# backend (pdf service)
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## API endpoints to know
- Frontend API root: `http://localhost:3333/api/`
- PDF generation: `http://localhost:8000/generate-pdf`
- SOW creation/list: `http://localhost:3333/api/sow/*`
- AnythingLLM embed/chat endpoints: `http://localhost:3333/api/anythingllm/*`

Before changing an endpoint, search for all usages across the codebase.

---

## Changing API contracts safely
1. Add a new route version or alias — avoid breaking existing route signatures.
2. Update frontend callers to use the new route incrementally.
3. Add integration tests where possible.
4. Document the change in `REPOSITORY-SETUP-DOCUMENTATION.md` and open a PR to `the11`.

---

## When to push to production (`the11` repo)
- Major fixes and verified features only
- Create a PR from `production-latest` (the11-dev) → `main` (the11)
- Include migration scripts for database changes
- Coordinate any downtime if necessary

---

## Quick checklist for AI assistant changes
- [ ] Work on `production-latest` branch only
- [ ] Use `.env` values consistent with `.env.example`
- [ ] Run `pnpm build` and `pnpm dev` to verify frontend after changes
- [ ] Run backend tests and start uvicorn to confirm API behavior
- [ ] Update docs and create PR to `the11` when ready

---

## Contacts
- Project owner: Khaled Bashir
- Repo: https://github.com/khaledbashir/the11-dev
- Upstream production repo: https://github.com/khaledbashir/the11

---

Keep this file short and referenceable. Update when branch or workflow changes.