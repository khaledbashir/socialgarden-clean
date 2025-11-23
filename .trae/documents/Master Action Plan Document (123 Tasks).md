# Master Action Plan (123 Tasks)

## Overview

Consolidates the project overview and agents hiring brief into a single, actionable plan with 123 numbered tasks. Tracks progress, timestamps, blockers, owners, deadlines, and verification/sign‑off.

## Progress Summary

* Total tasks: 123

* Completed: 0

* In Progress: 0

* Blocked: 0

* Not Started: 123

* Percent complete: 0%

## How to Use

* Detailed fields for each task live in `docs/action-plan.csv` (authoritative tracker for imports to Sheets/PM tools)

* Use this MD for navigation, print, and quick status views. Update status and timestamps in the CSV; this MD summarizes.

## Review & Approval Workflow

* Each task requires verifier review and sign‑off before status can be set to Done

* Phase gates require QA sign‑off on critical tasks; changes recorded in the change log

## Change Log

* 2025-11-22: Initial version created; tasks seeded from overview and hiring brief

## Sections

* Phase 1: Foundational (Tasks 1–25)

* Phase 2: Orchestration (Tasks 26–45)

* Phase 3: Operationalization (Tasks 46–65)

* Governance & Security (Tasks 66–80)

* Finance & Exports (Tasks 81–90)

* Testing & QA (Tasks 91–105)

* Observability & Dashboard (Tasks 106–113)

* Docs & Runbooks (Tasks 114–123)

***

## Phase 1: Foundational (1–25)

1. PDF deliverables order under scope headers (SAM-004)
2. +GST formatting consistency across UI/PDF (SAM-005)
3. Discount visibility (original vs discounted) (SAM-006)
4. AUD currency consistency across dashboard/admin (SAM-007)
5. Mandatory role naming consistency (SAM-010)
6. Hours rounding policy (whole/round numbers) (SAM-008)
7. Budget allocator integration into editor (SAM-009)
8. Rate limiting in critical API routes (SAM-011)
9. Remove hardcoded secrets; enforce envs (SAM-012)
10. Env alignment: DB password defaults (SAM-013)
11. Env alignment: backend CORS dev port (SAM-013)
12. Workspace slug consistency (SAM-014)
13. Excel export schema finance‑friendly alignment (SAM-015)
14. Google Sheets tabular schema (SAM-016)
15. Edge vs Node runtime/env consistency (SAM-017)
16. Multi‑scope grand total toggle parity (SAM-018)
17. TipTap insertion guardrails agentization
18. Connectivity fallback user messaging
19. Retry/backoff for PDF/Excel exports
20. Standardize fetch wrappers and timeouts
21. Formatter adoption across app (currency/GST)
22. Rate card single source‑of‑truth enforcement
23. Role normalization (fuzzy matching) engine
24. Export pre‑flight blockers and validation rules
25. Update policy docs for roles/currency/GST

## Phase 2: Orchestration (26–45)

1. Workspace orchestrator implementation
2. Thread steward implementation
3. Knowledge sync agent implementation
4. Agent registry consolidation (slugs and prompts)
5. Routing rules by vertical/service line
6. @agent keyword parser improvements
7. Thread archive policy and automation
8. Embed retry queue
9. Embed audit trail with metadata completeness
10. Workspace usage analytics integration
11. Orchestrator E2E tests
12. Steward E2E tests
13. Sync SLA instrumentation (≤5s)
14. Default workspace fallback rules
15. Workspace config cleanup and mapping
16. Integrate Property Pro workspace
17. Integrate Ad Machine workspace
18. Integrate CRM Specialist workspace
19. Integrate Case Studies workspace
20. Integrate Proposals workspace

## Phase 3: Operationalization (46–65)

1. Dashboard AI implementation
2. Alerting for SLA breaches
3. Metrics visualization components
4. Export QA agent implementation
5. Export QA rules library
6. Export blocking integration on failures
7. Client Communication agent implementation
8. CRM email templates and cover letters
9. Send‑to‑client pipeline integration
10. KPI registry across agents
11. Daily report routine automation
12. Weekly milestone gate reviews
13. Sign‑off workflow configuration
14. Change log automation and version tags
15. Mobile‑friendly plan views
16. Print‑ready PDF export of plan
17. Accessibility checks for dashboards
18. Performance budgets per route
19. Error budget and SLO definitions
20. Incident runbooks for agent failures

## Governance & Security (66–80)

1. Secrets audit across repo
2. Remove default API keys in proxies
3. Env validation on app boot
4. CORS policy updates for dev/prod
5. Rate limiting middleware insertion
6. Abuse detection thresholds and bans
7. Logging redaction of sensitive data
8. Access control on admin routes
9. Workspace permission checks
10. Security headers in Nginx
11. HTTPS enforcement plan
12. Dependency vulnerability scanning
13. Biome/formatter lint enforcement
14. Code review checklist formalization
15. Security QA test cases

## Finance & Exports (81–90)

1. Excel columns verification with finance
2. GST line positioning standards
3. Discount lines and subtotals in Excel
4. Sheets tabular schema updates
5. Finance ingestion sign‑off and test
6. Branded PDF typography alignment
7. Total rounding policy across exports
8. Multi‑scope totals clarity in exports
9. Export filename conventions
10. Export endpoint retry/backoff policy

## Testing & QA (91–105)

1. Playwright/Cypress setup and CI integration
2. Sidebar stability tests
3. Drag‑and‑drop role reorder tests
4. Pricing table render tests
5. PDF export success tests
6. Excel export success tests
7. Multi‑scope total toggle tests
8. Discount display tests
9. AUD and +GST formatting tests
10. Mandatory roles enforcement tests
11. Allocator integration tests
12. Workspace routing tests
13. Thread lifecycle tests
14. Degraded network connectivity tests
15. Regression suite scheduling and reporting

## Observability & Dashboard (106–113)

1. Instrument agent KPIs
2. Observability stack setup (Grafana/Prometheus or equivalent)
3. SLA alerts ≤5s on sync
4. Embed success rate reporting
5. Routing correctness reporting
6. Export success rate reporting
7. Thread operations reporting
8. Dashboard freshness checks

## Docs & Runbooks (114–123)

1. Update START‑HERE with agents overview
2. Update handover guide with workflows
3. Onboarding checklist for hires
4. Runbook for Export QA agent
5. Runbook for Orchestrator/Steward
6. Policy doc for roles/currency/GST
7. Troubleshooting FAQ for agents
8. Versioning/change‑log process document
9. Mobile/print style guide for plan
10. Review & approvals procedure document

***

## Notes & Branding

* Use Social Garden style colors and typography in spreadsheet exports; MD designed for clean print.

* For mobile, prefer short headers and compact lists; avoid heavy tables in this document.

## Navigation

* Refer to the section indexes above; use task IDs to cross‑reference with `docs/action-plan.csv`.

## Development Workflow

* All development work must be built and tested locally before any push.

* After local verification, changes are pushed to GitHub.

* Pushes must target the correct designated branch.

* EasyPanel builds are triggered automatically after GitHub updates.

### Local Build Procedures

* Combined dev run: from project root run `./dev.sh` to start backend (`uvicorn`) and frontend (`pnpm dev`) together.

* Backend only:

  * `cd backend`

  * `python3 -m venv venv && source venv/bin/activate`

  * `pip install -r requirements.txt`

  * `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

  * Verify at `http://localhost:8000/health`

* Frontend only:

  * `cd frontend`

  * `pnpm install`

  * `pnpm dev --port 3333`

  * Verify at `http://localhost:3333/`

* Before pushing: run local checks, lints, and any tests (unit/E2E where applicable) and confirm exports (PDF/Excel) succeed.

### Branch Naming Conventions

* Designated branches for EasyPanel builds:

  * Source A: Owner `khaledbashir`, Repo `the11-dev-clean`, Branch `saved-state-20251122-110345`, Build Path `/`

  * Source B: Owner `khaledbashir`, Repo `the11-dev-clean`, Branch `backend-service`, Build Path `/backend`

* Working branch patterns:

  * `feature/<area>-<short-desc>` (e.g., `feature/pdf-gst-formatting`)

  * `fix/<issue-id>-<short-desc>` (e.g., `fix/1234-cors-dev-port`)

  * `chore/<task>` (e.g., `chore/deps-upgrade`)

* Merge via PR into the designated build branches; avoid direct commits to production branches.

### Commit Message Standards

* Follow Conventional Commits:

  * `feat(frontend): unify +GST formatting across PDF totals`

  * `fix(backend): add CORS origin http://localhost:3333`

  * `chore(devops): remove hardcoded AnythingLLM defaults`

* Include scope (`frontend`, `backend`, `devops`) and reference IDs where relevant.

### EasyPanel Integration Requirements

* GitHub Source configuration must match:

  * Owner: `khaledbashir`

  * Repository: `the11-dev-clean`

  * Branch and Build Path: see designated branches above

* Environment & credentials:

  * Configure environment variables in EasyPanel (do not hardcode in repo):

    * `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

    * `ANYTHINGLLM_URL`, `ANYTHINGLLM_API_KEY`

    * `OPENROUTER_API_KEY`

    * `PDF_SERVICE_URL`

  * Use the internal MySQL host `ahmad_mysql-database` and port `3306` where applicable.

  * Store credentials securely via EasyPanel’s environment manager; do not commit secrets.

* Build trigger: EasyPanel will auto-build on pushes to the configured branch. Verify build logs and health checks post-deploy.

### Version Control & Environment Clarity

* Local vs remote:

  * Local development uses `http://localhost:3333` (frontend) and `http://localhost:8000` (backend).

  * Remote deployments use EasyPanel-managed URLs and internal Docker networking.

* Keep `.env` files local; production secrets live only in EasyPanel.

* All code changes flow: local build → local verify → commit → push to designated branch → EasyPanel auto-build → post-deploy verification.

