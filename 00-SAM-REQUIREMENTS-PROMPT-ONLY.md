# Sam's Requirements - PROMPT vs CODING Separation

## ✅ PROMPT-ONLY (Text Instructions)

### I. Core AI Functionality and Content Generation
- **Bespoke Deliverables:** AI should generate unique deliverables based on brief, not use static lists
- **Contextual Variation:** Deliverables should vary by project type (MAP/CRM Implementation, Customer Journey Mapping, Email Template Production) and platform (Salesforce, HubSpot, Marketo)
- **Standard Structure:** Follow standard phases: Discovery & Planning → Technical Assessment → Quality Assurance → Final Delivery → Training & Handover
- **Deliverable Format:** All deliverables as bullet points with `+` prefix, NO paragraph format
- **Best Practices:** AI should research and apply best practices rather than copy templates
- **Increased Detail:** Include more detailed descriptions and line items

### II. Pricing, Roles, and Budget Management
- **Role Allocation Rules:**
  - Use Social Garden Rate Card accurately
  - Blend rates across various roles
  - Avoid excessive hours for senior roles on execution tasks
  - **Minimal hours** for Head Of Senior Project Management (5-15 hours)
  - **Minimal hours** for Project Coordination (3-10 hours)
  - **Larger hours** for Account Management (6-12 hours minimum)
  - Account Management roles **ALWAYS at bottom** of pricing table
  - Split hours across granular roles (email production, dev, design, copy, deployment, testing)
- **Costing:** 
  - Currency: **AUD only** (never USD)
  - All pricing shows **+GST** suffix
  - Final amounts should aim for **round numbers** (200, 250, 300 hours total OR $50k, $45k, $60k totals)
- **Budget Adherence:**
  - Respect specified target budget (e.g., $10k)
  - Ability to adjust scope to meet target amounts
  - Include percentage discount capability
  - Show original price AND discounted price clearly

### III. Workflow (Prompt Instructions)
- **Two-Step Process:** AI should understand this is draft → review → final generation cycle

## ❌ CODING REQUIRED (UI Development)

### I. Usability and Workflow
- Two-step process interface
- Easy modification system for hours/roles/tasks
- Role layout control (drag & drop functionality)
- Total price toggle button
- Plus Jakarta Sans font enforcement
- Social Garden logo integration
- Reliability features (prevent scopes going missing)

### II. Interface Features
- Budget adjustment interface
- Discount percentage slider
- Editable pricing table
- Document export to Google Docs/Sheets/PDF

## 🎯 PROMPT ENHANCEMENTS NEEDED

### MISSING from Current Prompt:
1. **Bespoke Deliverables Generation** - Add instruction to avoid templates
2. **Contextual Variation** - Specify platform-specific deliverables (Salesforce vs HubSpot vs Marketo)
3. **Deliverable Format** - Enforce bullet points with `+` prefix only
4. **Role Allocation Hierarchy** - Specific instructions for Head Of/Project Coordination (minimal) vs Account Management (maximum)
5. **Round Number Targets** - Instruction to aim for commercial round numbers
6. **GST Display Rule** - Every price line must show "+GST"
7. **Discount Logic** - Show original vs discounted pricing
8. **Budget Adherence** - Ability to adjust scope to meet target budgets
9. **Account Management Bottom Placement** - Enforce Account Management roles at end of table
10. **Granular Role Splitting** - Avoid lumping, split into specific tasks (email production, dev, design, copy, deployment, testing)

### CURRENT PROMPT GAPS:
- No mention of platform-specific deliverables
- No role hierarchy rules
- No round number targets
- No GST display requirements
- No discount presentation logic
- No budget adherence instructions
- No bullet point format enforcement
