# Production Checklist (Oct 2025)

Mark each task with [x] when implemented and [x] when fully tested/approved.

- [x] Implemented  [x] Tested — Mandatory pricing roles merge
  - Enforce presence of:
    - Tech - Head Of - Senior Project Management (default 3h @ $365)
    - Project Coordination (default 6h @ $140)
    - Account Management (default 8h @ $150, always last)
  - Dedupe identical role rows (merge hours, prefer canonical rate)
  - Applies in editor UI and PDF export (renderHTML)

- [x] Implemented  [x] Tested — Commercial rounding to nearest $100
  - Round final Total incl. GST to nearest hundred
  - Show both unrounded and rounded totals in UI; show rounded prominently in PDF

- [x] Implemented  [ ] Tested — SOW chat: New Chat + threads in editor mode
  - Editor sidebar shows New Chat + Threads list
  - Uses the SOW’s workspace; selecting/creating threads updates SOW.threadSlug
  - Thread slug persisted via PUT /api/sow/[id]

- [x] Implemented  [ ] Tested — SOW chat: load history on thread select (editor)
  - Convert AnythingLLM history → ChatMessage[] and display

- [x] Implemented  [ ] Tested — Dashboard chat: consistently use selected thread
  - Ensure send uses selected thread across all dashboard input points

- [x] Implemented  [ ] Tested — Inline AI toolbar UX polish
  - Confirm “Ask AI” bubble reliably appears on selection
  - Add Alt+A shortcut to open AI bar with selected text

Notes
- Currency formatting: en-AU is applied consistently in UI/PDF
- PDF uses WeasyPrint-safe HTML via renderHTML for editablePricingTable node
