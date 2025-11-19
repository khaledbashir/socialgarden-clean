# Implementation Plan & Status - SOW Workbench "Definition of Done"

## 🎯 Goal: Production-Grade SOW Workbench

We are building a system that meets a strict 23-point checklist.

---

## 🔎 Technical Discovery & Answers

I have investigated the codebase to answer the critical questions:

### 1. File Upload & Vector Context
*   **Finding:** The current implementation (`document-pinning.ts`) uploads and pins documents but **does not wait for vector embedding to complete**. It assumes immediate availability.
*   **Risk:** High risk of AI "hallucinating" if the user chats immediately after upload.
*   **Solution:** We must implement a polling mechanism or a "Processing..." UI state that waits for the document to be queryable before allowing SOW generation.

### 2. PDF Export Styling & Branding
*   **Finding:** `SOWPdfExport.tsx` has hardcoded colors and attempts to use `Plus Jakarta Sans`.
*   **Critical Gap:** **The font is NOT registered.** `react-pdf` requires explicit font registration. Without this, the PDF will likely crash or revert to a default serif font.
*   **Solution:** Register the font using a CDN URL (e.g., Google Fonts) or local assets immediately.

### 3. Workspace Slug & Thread Management
*   **Finding:** The system currently uses a **Single Master Workspace (`sow-generator`)** for all SOW generation logic (`anythingllm.ts:165`).
*   **Critical Security Flaw:** If Client A's brief is uploaded to this shared workspace, Client B's SOW generation session might access it via RAG.
*   **Solution:** We MUST switch to **Per-Client Workspaces** for generation to ensure data isolation. Each client should have their own workspace (e.g., `client-a-gen`, `client-b-gen`) where their specific briefs are embedded.

---

## 📝 Updated Implementation Plan

### Phase 1: Content & Context (The "Brief")
- [x] **System Prompt:** Updated to enforce specific deliverables.
- [ ] **Fix Data Isolation:** Update `page.tsx` and `anythingllm.ts` to create/use a **Client-Specific Workspace** for generation, not the shared `sow-generator`.
- [ ] **Fix Upload Timing:** Add a "Waiting for Embedding" check in `ChatInterface`.

### Phase 2: Pricing Logic (The "Brain")
- [x] **Rate Card:** Source of truth established.
- [x] **Granularity & Budget:** Prompt updated.
- [x] **Mandatory Layers:** Enforcer logic exists.
- [ ] **Math Verification:** Review `editable-pricing-table.tsx` for GST/Discount order.

### Phase 3: App Functionality (The "Face")
- [x] **Data Binding:** Fixed JSON parsing and auto-insertion (`f764d40`).
- [x] **Editability:** Drag-and-drop implemented.
- [ ] **Fix PDF Export:**
    - *Action:* Add `Font.register` for Plus Jakarta Sans in `SOWPdfExport.tsx`.
    - *Action:* Verify logo URL handling.
- [ ] **Persistence:** Verify DB save flow.

### Phase 4: Final Polish
- [x] **UI Cleanup:** Collapsed raw JSON.
- [ ] **User Trust:** Add "Analyzing Brief..." indicators.

---

## 🚀 Immediate Actions
1. **Fix PDF Font:** Register the font to prevent export failures.
2. **Fix Workspace Isolation:** Refactor creation logic to use client-specific workspaces.
