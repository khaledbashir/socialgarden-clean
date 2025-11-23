# Master Action Plan (123 Tasks)

## Overview
Consolidates the project overview and agents hiring brief into a single, actionable plan with 123 numbered tasks. Tracks progress, timestamps, blockers, owners, deadlines, and verification/sign‑off.

## Progress Summary
- Total tasks: 123
- Completed: 0
- In Progress: 0
- Blocked: 0
- Not Started: 123
- Percent complete: 0%

## How to Use
- Detailed fields for each task live in `docs/action-plan.csv` (authoritative tracker for imports to Sheets/PM tools)
- Use this MD for navigation, print, and quick status views. Update status and timestamps in the CSV; this MD summarizes.

## Review & Approval Workflow
- Each task requires verifier review and sign‑off before status can be set to Done
- Phase gates require QA sign‑off on critical tasks; changes recorded in the change log

## Change Log
- 2025-11-22: Initial version created; tasks seeded from overview and hiring brief

## Sections
- Phase 1: Foundational (Tasks 1–25)
- Phase 2: Orchestration (Tasks 26–45)
- Phase 3: Operationalization (Tasks 46–65)
- Governance & Security (Tasks 66–80)
- Finance & Exports (Tasks 81–90)
- Testing & QA (Tasks 91–105)
- Observability & Dashboard (Tasks 106–113)
- Docs & Runbooks (Tasks 114–123)

---

## Phase 1: Foundational (1–25)
1. [ ] PDF deliverables order under scope headers (SAM-004)
2. [ ] +GST formatting consistency across UI/PDF (SAM-005)
3. [ ] Discount visibility (original vs discounted) (SAM-006)
4. [ ] AUD currency consistency across dashboard/admin (SAM-007)
5. [ ] Mandatory role naming consistency (SAM-010)
6. [ ] Hours rounding policy (whole/round numbers) (SAM-008)
7. [ ] Budget allocator integration into editor (SAM-009)
8. [ ] Rate limiting in critical API routes (SAM-011)
9. [ ] Remove hardcoded secrets; enforce envs (SAM-012)
10. [ ] Env alignment: DB password defaults (SAM-013)
11. [ ] Env alignment: backend CORS dev port (SAM-013)
12. [ ] Workspace slug consistency (SAM-014)
13. [ ] Excel export schema finance‑friendly alignment (SAM-015)
14. [ ] Google Sheets tabular schema (SAM-016)
15. [ ] Edge vs Node runtime/env consistency (SAM-017)
16. [ ] Multi‑scope grand total toggle parity (SAM-018)
17. [ ] TipTap insertion guardrails agentization
18. [ ] Connectivity fallback user messaging
19. [ ] Retry/backoff for PDF/Excel exports
20. [ ] Standardize fetch wrappers and timeouts
21. [ ] Formatter adoption across app (currency/GST)
22. [ ] Rate card single source‑of‑truth enforcement
23. [ ] Role normalization (fuzzy matching) engine
24. [ ] Export pre‑flight blockers and validation rules
25. [ ] Update policy docs for roles/currency/GST

## Phase 2: Orchestration (26–45)
26. [ ] Workspace orchestrator implementation
27. [ ] Thread steward implementation
28. [ ] Knowledge sync agent implementation
29. [ ] Agent registry consolidation (slugs and prompts)
30. [ ] Routing rules by vertical/service line
31. [ ] @agent keyword parser improvements
32. [ ] Thread archive policy and automation
33. [ ] Embed retry queue
34. [ ] Embed audit trail with metadata completeness
35. [ ] Workspace usage analytics integration
36. [ ] Orchestrator E2E tests
37. [ ] Steward E2E tests
38. [ ] Sync SLA instrumentation (≤5s)
39. [ ] Default workspace fallback rules
40. [ ] Workspace config cleanup and mapping
41. [ ] Integrate Property Pro workspace
42. [ ] Integrate Ad Machine workspace
43. [ ] Integrate CRM Specialist workspace
44. [ ] Integrate Case Studies workspace
45. [ ] Integrate Proposals workspace

## Phase 3: Operationalization (46–65)
46. [ ] Dashboard AI implementation
47. [ ] Alerting for SLA breaches
48. [ ] Metrics visualization components
49. [ ] Export QA agent implementation
50. [ ] Export QA rules library
51. [ ] Export blocking integration on failures
52. [ ] Client Communication agent implementation
53. [ ] CRM email templates and cover letters
54. [ ] Send‑to‑client pipeline integration
55. [ ] KPI registry across agents
56. [ ] Daily report routine automation
57. [ ] Weekly milestone gate reviews
58. [ ] Sign‑off workflow configuration
59. [ ] Change log automation and version tags
60. [ ] Mobile‑friendly plan views
61. [ ] Print‑ready PDF export of plan
62. [ ] Accessibility checks for dashboards
63. [ ] Performance budgets per route
64. [ ] Error budget and SLO definitions
65. [ ] Incident runbooks for agent failures

## Governance & Security (66–80)
66. [ ] Secrets audit across repo
67. [ ] Remove default API keys in proxies
68. [ ] Env validation on app boot
69. [ ] CORS policy updates for dev/prod
70. [ ] Rate limiting middleware insertion
71. [ ] Abuse detection thresholds and bans
72. [ ] Logging redaction of sensitive data
73. [ ] Access control on admin routes
74. [ ] Workspace permission checks
75. [ ] Security headers in Nginx
76. [ ] HTTPS enforcement plan
77. [ ] Dependency vulnerability scanning
78. [ ] Biome/formatter lint enforcement
79. [ ] Code review checklist formalization
80. [ ] Security QA test cases

## Finance & Exports (81–90)
81. [ ] Excel columns verification with finance
82. [ ] GST line positioning standards
83. [ ] Discount lines and subtotals in Excel
84. [ ] Sheets tabular schema updates
85. [ ] Finance ingestion sign‑off and test
86. [ ] Branded PDF typography alignment
87. [ ] Total rounding policy across exports
88. [ ] Multi‑scope totals clarity in exports
89. [ ] Export filename conventions
90. [ ] Export endpoint retry/backoff policy

## Testing & QA (91–105)
91. [ ] Playwright/Cypress setup and CI integration
92. [ ] Sidebar stability tests
93. [ ] Drag‑and‑drop role reorder tests
94. [ ] Pricing table render tests
95. [ ] PDF export success tests
96. [ ] Excel export success tests
97. [ ] Multi‑scope total toggle tests
98. [ ] Discount display tests
99. [ ] AUD and +GST formatting tests
100. [ ] Mandatory roles enforcement tests
101. [ ] Allocator integration tests
102. [ ] Workspace routing tests
103. [ ] Thread lifecycle tests
104. [ ] Degraded network connectivity tests
105. [ ] Regression suite scheduling and reporting

## Observability & Dashboard (106–113)
106. [ ] Instrument agent KPIs
107. [ ] Observability stack setup (Grafana/Prometheus or equivalent)
108. [ ] SLA alerts ≤5s on sync
109. [ ] Embed success rate reporting
110. [ ] Routing correctness reporting
111. [ ] Export success rate reporting
112. [ ] Thread operations reporting
113. [ ] Dashboard freshness checks

## Docs & Runbooks (114–123)
114. [ ] Update START‑HERE with agents overview
115. [ ] Update handover guide with workflows
116. [ ] Onboarding checklist for hires
117. [ ] Runbook for Export QA agent
118. [ ] Runbook for Orchestrator/Steward
119. [ ] Policy doc for roles/currency/GST
120. [ ] Troubleshooting FAQ for agents
121. [ ] Versioning/change‑log process document
122. [ ] Mobile/print style guide for plan
123. [ ] Review & approvals procedure document

---

## Notes & Branding
- Use Social Garden style colors and typography in spreadsheet exports; MD designed for clean print.
- For mobile, prefer short headers and compact lists; avoid heavy tables in this document.

## Navigation
- Refer to the section indexes above; use task IDs to cross‑reference with `docs/action-plan.csv`.