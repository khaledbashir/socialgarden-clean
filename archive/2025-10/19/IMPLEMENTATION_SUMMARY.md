# Social Garden SOW Generator - Implementation Summary

## 📋 What Sam Wants (from conversation.md analysis)

Sam needs an AI-powered Statement of Work generator for Social Garden with the following key requirements:

### Core Functionality
1. **AI Chat Interface** - Natural conversation to gather SOW requirements
2. **Automatic SOW Generation** - AI creates complete, professional SOWs
3. **Easy Editing** - Inline editing of hours, rates, and roles
4. **Multiple Export Formats** - PDF (branded), Excel, CSV
5. **Discount Management** - % or fixed amount discounts on individual or total SOW
6. **Budget Constraints** - AI respects target budgets and rounds to clean numbers
7. **Folder Organization** - Organize SOWs in folders for different projects
8. **Professional Output** - Social Garden branding, proper formatting

### Specific Requirements

#### Pricing & Financial
- All pricing in **AUD currency**
- Every price must show **+GST**
- Support **discounts** (percentage or fixed amount)
- Show: Sub-Total, Discount, Grand Total, GST calculations
- **Commercial rounding** to clean numbers ($50k not $47,328)
- Round hour totals (200, 250, 300 not 237 hours)

#### Role Allocation (SAM'S LAW)
Every SOW MUST include:
- **Tech - Head Of - Senior Project Management**: 2-15 hours (minimal, strategic)
- **Tech - Delivery - Project Coordination**: 3-10 hours
- **Account Management - (Senior Account Manager)**: 6-12 hours (larger allocation)
- **6+ relevant roles** total per scope
- Use **granular role names** from the 82-role rate card
- Separate roles for email projects (Copywriting, Design, Development, Deployment, Testing)
- Balance: Senior roles for strategy, Producer/Specialist for execution

#### Deliverables Formatting
- **MUST use bullet lists**, NOT paragraphs
- Format with `+` symbols for bullets
- Organize by phase with sub-bullets
- Include deliverable assumptions at end of each section

Example deliverable structure:
```
**Design**
+ Defining the email template style & brand
+ Email Template Wireframe Design
+ UX Design: Modular prototype in Figma
+ Client Review & Template Approval

**Development**
+ Email Template Development Design Review
+ Email Template Development
+ Email Template Testing & Rendering
+ Email Template QA Check
```

#### Project Types Supported
1. **Standard Projects**: HubSpot Implementation, Email Templates, Landing Pages
2. **Support Retainers**: Monthly ongoing support (40h, 80h, 120h options)
3. **Audit/Strategy**: Customer Journey Mapping, MAP Audits, CRM Strategy

---

## ✅ What We Currently Have (COMPLETED)

### 1. Enhanced AI System Prompt ✅
**File:** `/lib/knowledge-base.ts`

Created a **700+ line comprehensive system prompt** with:
- Complete SOW structure templates for all project types
- Detailed deliverable formatting rules and examples
- Sam's Law role allocation requirements
- Budget constraint handling logic
- Commercial rounding rules
- Discount handling workflows
- 82-role rate card with AUD pricing
- Typical team compositions for common projects
- Post-generation workflow instructions

**Key Features:**
- Instructs AI to generate 6+ relevant roles
- Always include mandatory PM/coordination/AM roles
- Format deliverables as bullet lists
- Respect budget constraints
- Round to clean commercial numbers
- Show +GST on all pricing
- Handle discounts properly

### 2. Export Utilities Library ✅
**File:** `/lib/export-utils.ts`

Comprehensive export functionality including:
- `extractPricingFromContent()` - Parse pricing tables from Novel editor
- `calculateTotals()` - Compute subtotals, discounts, GST, grand totals
- `exportToCSV()` - Finance team spreadsheet export
- `exportToExcel()` - XLSX format with proper formatting
- `exportToPDF()` - PDF generation with logo and branding support
- `formatCurrency()` - AUD currency with +GST display
- `parseSOWMarkdown()` - Extract structured data from markdown

**Libraries Installed:**
- jspdf (PDF generation)
- html2canvas (HTML to image conversion)
- xlsx (Excel file generation)
- papaparse (CSV parsing)
- @dnd-kit/core & @dnd-kit/sortable (drag-drop functionality)

### 3. Branding Assets Setup ✅
**Folder:** `/public/assets/`

Created folder structure with README for:
- Logo (Logo Dark-Green.png) - awaiting file
- Banner images for PDFs
- Brand colors configured (Social Garden green: #2C823D)
- Font specification: Plus Jakarta Sans

### 4. Core App Features ✅
**File:** `/app/page.tsx`

Existing functionality:
- Novel rich text editor with markdown conversion
- AI agent sidebar (Claude 3.5 Sonnet via OpenRouter)
- `/inserttosow` command to insert AI-generated content
- Automatic document naming from SOW title
- "New SOW" button for clean slate
- localStorage persistence (ready for Supabase migration)
- Document management (create, rename, delete)
- Chat history persistence per agent

### 5. Markdown Rendering ✅
**File:** `/components/tailwind/agent-sidebar-clean.tsx`

Enhanced ReactMarkdown with:
- Table rendering with proper styling
- Headers (H1, H2, H3) with sizing
- Bold/italic text support
- Lists (ordered and unordered)
- Code blocks
- Horizontal rules
- Proper spacing and colors

---

## 🚧 What Still Needs Implementation

### Priority 1: Export Integration (High Priority)
**Status:** Libraries installed, utils created, needs UI integration

**Tasks:**
1. Add "Export PDF" button to Menu component
2. Add "Export Excel" and "Export CSV" buttons
3. Wire up export-utils functions to buttons
4. Add Social Garden logo file to `/public/assets/`
5. Test PDF generation with branding
6. Test Excel/CSV exports with discount calculations

**Files to modify:**
- `/components/tailwind/ui/menu.tsx` - Add export buttons
- `/app/page.tsx` - Connect export handlers

### Priority 2: Discount Controls (High Priority)
**Status:** Logic in place, needs UI controls

**Tasks:**
1. Add discount input fields to editor toolbar or sidebar
2. Add toggle for discount type (% vs fixed amount)
3. Add toggle for individual SOW vs total discount
4. Update `convertMarkdownToNovelJSON()` to parse discount sections
5. Display discount calculations in pricing tables
6. Persist discount settings with document

**Implementation approach:**
- Create new component: `/components/tailwind/discount-controls.tsx`
- Add discount state to document object
- Update pricing table rendering to show discounts

### Priority 3: Folder Organization (Medium Priority)
**Status:** Data structure exists, needs UI

**Tasks:**
1. Create folder tree component for sidebar
2. Add "New Folder" button
3. Implement drag-drop documents into folders
4. Add breadcrumb navigation
5. Folder rename/delete functionality
6. Persist folder structure in localStorage

**Implementation approach:**
- Enhance `/components/tailwind/sidebar.tsx` with folder tree
- Use @dnd-kit for drag-drop
- Add folder UI controls

### Priority 4: Inline Pricing Editor (Medium Priority)
**Status:** Not started

**Tasks:**
1. Detect pricing tables in Novel editor
2. Make table cells editable (hours and rates)
3. Auto-calculate totals on change
4. Add/remove role rows
5. Drag-drop to reorder roles
6. Save changes back to document

**Implementation approach:**
- Create custom Tiptap extension for editable tables
- Use @dnd-kit for row reordering
- Add calculation logic on cell change

### Priority 5: Summary Price Toggle (Low Priority)
**Status:** Not started

**Tasks:**
1. Add toggle button to editor toolbar
2. Show/hide total summary at bottom
3. Keep individual SOW prices visible
4. Persist toggle state with document
5. Update PDF export to respect toggle

### Priority 6: Testing & Polish (Ongoing)
**Status:** Ready to test once exports are integrated

**Tasks:**
1. End-to-end workflow testing
2. Test AI generation quality with various project types
3. Test all export formats
4. Verify budget constraints work
5. Test discount calculations
6. Cross-browser testing
7. Mobile responsiveness check

---

## 📝 Implementation Roadmap

### Week 1: Core Exports & Discounts
- [ ] Day 1-2: Integrate PDF/Excel/CSV export buttons
- [ ] Day 2-3: Add discount controls UI
- [ ] Day 3-4: Test and refine export formatting
- [ ] Day 4-5: Add Social Garden branding assets

### Week 2: Organization & Editing
- [ ] Day 1-2: Implement folder organization
- [ ] Day 3-4: Add inline pricing editor
- [ ] Day 5: Add drag-drop role reordering

### Week 3: Testing & Polish
- [ ] Day 1-2: Comprehensive testing
- [ ] Day 3-4: Bug fixes and refinements
- [ ] Day 5: Documentation and deployment prep

### Future: Production Ready
- [ ] Migrate from localStorage to Supabase
- [ ] Add user authentication
- [ ] Secure API key management
- [ ] Add usage analytics
- [ ] Create user documentation

---

## 🎯 Quick Start for Next Developer

### To add PDF export:
1. Wire up `handleExportPDF()` in `page.tsx` to use `exportToPDF()` from `export-utils.ts`
2. Add logo file to `/public/assets/Logo-Dark-Green.png`
3. Test with a sample SOW document

### To add discount controls:
1. Create `/components/tailwind/discount-controls.tsx`
2. Add discount fields (type: %, fixed; amount)
3. Update document state to include discount
4. Modify pricing table rendering to show discounts

### To test AI generation:
1. Click "New SOW"
2. Chat: "Create a HubSpot Implementation SOW for ABC Corp, 3 hubs, budget $50,000"
3. Type `/inserttosow` when AI generates the SOW
4. Verify formatting, roles, pricing, deliverables

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `/lib/knowledge-base.ts` | 82-role rate card + 700-line system prompt |
| `/lib/export-utils.ts` | PDF/Excel/CSV export functions |
| `/app/page.tsx` | Main app, document management, AI chat integration |
| `/components/tailwind/agent-sidebar-clean.tsx` | AI chat interface |
| `/components/tailwind/advanced-editor.tsx` | Novel editor component |
| `/components/tailwind/sidebar.tsx` | Document/folder sidebar |
| `/public/assets/` | Branding assets (logo, banners) |

---

## 🔧 Technical Stack

- **Framework:** Next.js 15 (App Router)
- **Editor:** Novel (Tiptap-based rich text editor)
- **AI:** Claude 3.5 Sonnet via OpenRouter API
- **Styling:** Tailwind CSS
- **Exports:** jspdf, html2canvas, xlsx, papaparse
- **Drag-Drop:** @dnd-kit
- **Storage:** localStorage (migrate to Supabase later)

---

## 💡 Key Design Decisions

1. **No separate calculator widget** - Sam explicitly doesn't want this. Everything through AI chat.
2. **/inserttosow command** - Simple command to insert AI-generated content into editor
3. **Automatic document naming** - Extracts title from SOW and renames document automatically
4. **localStorage first** - Quick development, migrate to Supabase when ready
5. **Markdown intermediate format** - AI generates markdown, converted to Novel JSON
6. **Comprehensive system prompt** - All business logic and requirements encoded in AI prompt

---

## 🚀 Ready to Deploy Features

These are DONE and working:
- ✅ AI chat with The Architect agent
- ✅ 82-role rate card with AUD pricing
- ✅ Enhanced system prompt with all requirements
- ✅ /inserttosow command
- ✅ Automatic document naming
- ✅ New SOW button
- ✅ Export utilities library
- ✅ Markdown to Novel JSON converter
- ✅ Chat message persistence
- ✅ Document management

These need UI integration:
- 🔨 PDF export (library ready, needs button)
- 🔨 Excel/CSV export (library ready, needs button)
- 🔨 Discount controls (logic ready, needs UI)
- 🔨 Folder organization (structure ready, needs UI)

---

## 📞 Questions for Sam

1. **Logo file:** Can you provide `Logo-Dark-Green.png` for PDF headers?
2. **Banner images:** Do you have banner/letterhead images for SOW PDFs?
3. **Discount workflow:** When should discount be applied? During AI generation or after?
4. **Folder structure:** How deep should folder nesting go? (1 level, 2 levels, unlimited?)
5. **Export defaults:** Should PDF always include logo? Should Excel include formulas?

---

## 📈 Success Metrics

The system will be production-ready when:
- ✅ AI generates SOWs with 6+ roles following Sam's Law
- ✅ All pricing shows +GST in AUD
- ✅ Deliverables are formatted as bullet lists (not paragraphs)
- ✅ PDF exports with Social Garden branding
- ✅ Excel exports work for finance team
- ✅ Discount calculations are accurate
- ✅ Budget constraints are respected
- ✅ Documents organized in folders
- ✅ Inline editing of hours/rates works
- ✅ End-to-end workflow is smooth and reliable

---

**Last Updated:** October 12, 2025
**Status:** Core AI and export libraries complete, UI integration in progress
