# Agents Hiring Brief

## Purpose
Build a robust portfolio of AI agents that operationalize Sam’s non‑negotiable requirements across SOW generation, editing, orchestration, and export QA. This brief defines roles, responsibilities, triggers, KPIs, and required skills for each agent we intend to hire or formalize.

## Core Agents (Phase 1)
### Generation Architect
- Role: Primary SOW generator aligning scope, deliverables, timelines, and pricing to the canonical rate card.
- Triggers: New client workspace creation; prompts containing “SOW”, “proposal”, `@agent gen`.
- KPIs: 100% mandatory role compliance; <2 minutes to first complete draft; pricing accuracy ≥99% vs rate card; 0 invalid TipTap inserts.
- Skills: Prompt engineering for structured JSON, rate card awareness, pricing heuristics, multi‑scope synthesis.

### Inline Editor AI
- Role: Ensures editor‑safe content; inserts structured blocks (pricing tables, role rows); performs semantic cleanup.
- Triggers: Insert actions in the editor, “Add to editor”, `@agent editor`.
- KPIs: 100% valid TipTap `doc`; insert latency <1s; 0 broken tables; 0 raw unsafe strings.
- Skills: TipTap schema familiarity, JSON transformations, sanitation, UX integration.

### Preflight Compliance Guardian
- Role: Enforces guardrails before display/export: mandatory roles present and ordered, canonical names, consistent currency and `+GST` formatting, discount visibility.
- Triggers: Before pricing table render; PDF/Excel export; “Send to client”.
- KPIs: 100% compliance; 0 non‑canonical names; export pass rate ≥99%.
- Skills: Validation pipelines, policy enforcement, formatter adoption.

### Rate Card Governor
- Role: Centralizes rate card source‑of‑truth; normalizes roles; rejects off‑card entries; monitors drift.
- Triggers: Role extraction in AI output; role add/edit; pre‑export validation.
- KPIs: 0 off‑card roles in final SOW; normalization confidence ≥0.95; drift alerts within 24h.
- Skills: Fuzzy matching, data validation, finance alignment.

## Orchestration Agents (Phase 2)
### Workspace Orchestrator
- Role: Routes prompts to correct AnythingLLM workspace using `@agent` keywords, vertical, and service line; resolves slug mismatches.
- Triggers: Chat send, new thread, workspace change.
- KPIs: Correct routing ≥99%; default‑to‑master ≤10%; 0 slug mismatch incidents.
- Skills: Routing logic, metadata extraction, AnythingLLM API.

### Thread Steward
- Role: Manages thread lifecycle per SOW (create, link, archive, delete); ensures workspace fidelity.
- Triggers: New SOW, “Start chat”, archive/delete events.
- KPIs: 100% thread–SOW linkage; orphan threads ≤1%; ops success ≥99%.
- Skills: API reliability, lifecycle automation, audit trails.

### Knowledge Sync Agent
- Role: Governs embedding of SOW content to AnythingLLM; ensures metadata completeness; retries on failure; maintains audit.
- Triggers: After editor insertion; on save; nightly backfill.
- KPIs: Embed success ≥99%; metadata completeness ≥95%; retry success ≥90%.
- Skills: Content extraction, metadata standards, reliability engineering.

## Operational Agents (Phase 3)
### Dashboard AI
- Role: Monitors SOW lifecycle, sync health, workspace usage; drives live analytics to the Master Dashboard and alerts.
- Triggers: SOW CRUD changes; scheduled polling; workspace events.
- KPIs: Sync SLA ≤5s; dashboard freshness ≤5s; alert MTTR ≤15m; coverage ≥95%.
- Skills: Observability, metrics, alerting, UX dashboards.

### Export QA Agent
- Role: Validates content pre‑export (PDF/Excel); checks pricing tables, role names, layout integrity; blocks bad exports and suggests fixes.
- Triggers: Export actions and wrappers.
- KPIs: Export success ≥99%; pricing/table consistency pass ≥99%; 0 truncated labels.
- Skills: Document QA, layout validation, finance schema checks.

### Client Communication Agent
- Role: Generates “Send to Client” emails, proposal cover letters, and thread summaries aligned to CRM workflows.
- Triggers: Send‑to‑client events; proposal completion; `@agent crm`.
- KPIs: Email readiness ≤30s; personalization accuracy ≥99%; bounce ≤1%.
- Skills: CRM integration, templating, tone control.

## Cross‑Cutting Requirements
- Compliance: Mandatory roles, canonical naming, AUD currency, `+GST` visibility, discount display.
- Performance: Draft generation ≤2m; editor inserts ≤1s; sync ≤5s.
- Reliability: Routing correctness ≥99%; embed/export success ≥99%; resilient retries.
- Governance: Single rate card source, drift alerts, audit trails for embeds/threads/exports.

## Hiring Profiles
- Senior Prompt/Orchestration Engineer: Leads `generation-architect`, `workspace-orchestrator`, `knowledge-sync-agent`.
- Frontend Validation Specialist: Owns `inline-editor-ai`, `preflight-compliance-guardian`, `export-qa-agent`.
- Data/Finance Integration Engineer: Owns `rate-card-governor`, Excel/Sheets schemas.
- Observability Engineer: Owns `dashboard-ai` metrics, alerts, KPIs instrumentation.
- RevOps Integrations Specialist: Owns `client-communication-agent` and CRM alignment.

## Success Criteria & KPIs
- 100% guardrail compliance; ≥99% export QA pass; ≥99% routing correctness; ≤5s sync SLA; ≤2m draft generation.

## Onboarding Checklist
- Access: AnythingLLM API, OpenRouter key, DB credentials, `.env` mapping.
- Codebase orientation: Editor schema (TipTap), `ROLES` rate card, export utilities, dashboard components.
- Runbook: Dev scripts (`dev.sh`), health checks, test endpoints.

## Initial Milestones
- Week 1: Formalize Phase 1 agents in code and register triggers; instrument KPIs.
- Week 2: Implement Phase 2 orchestration agents; unify workspace routing; thread lifecycle.
- Week 3: Operationalize dashboards and export QA; integrate CRM comms templates.