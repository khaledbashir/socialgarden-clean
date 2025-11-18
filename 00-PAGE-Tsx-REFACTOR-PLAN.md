# Page.tsx Refactoring Plan
**Date:** November 18, 2025  
**Current Status:** COMPILING ✅ | EXTRACTED: JSX + UI State ✅  
**Goal:** Reduce from 6,987 lines → ~300 lines

---

## Current Structure Analysis

### 📊 Line Count Breakdown
- **Total:** 5,594 lines (was 6,987)
- **Imports (1-42):** 42 lines ✅ (OK)
- **Utility Functions (44-560):** ~516 lines (can stay)
- **Page Component Logic (561-6665):** ~4,712 lines ❌ (NEEDS EXTRACTION)
- **JSX Return (6666-6987):** 321 lines ✅ (already extracted into components)

### 🎯 The Real Problem
**6,105 lines of complex logic** that needs to be extracted from the Page component into:
- Custom hooks
- Service functions
- Utility modules
- Event handlers

---

## Extraction Strategy

### ✅ Phase 1: UI State Management (COMPLETED)
**Target:** All UI-related useState and related logic  
**Lines Extracted:** ~1,393 lines  
**New Hook:** `useUIState.ts`  
**Status:** ✅ DONE

### Phase 2: Document & Agent State
**Target:** Document CRUD, agent management, workspace state

**Estimated Reduction:** ~1,500 lines

### Phase 2: AI Chat & Response Processing  
**Target:** Message handling, AI response processing, streaming

**Estimated Reduction:** ~2,500 lines

### Phase 3: Document & Content Management
**Target:** Document CRUD, content conversion, pricing extraction

**Estimated Reduction:** ~1,000 lines

### Phase 4: Event Handlers & Effects
**Target:** useEffect hooks, event handlers, callbacks

**Estimated Reduction:** ~600 lines

### Phase 5: Cleanup & Integration
**Target:** Final integration, imports, exports

**Estimated Reduction:** ~5 lines

---

## Detailed Line-by-Line Breakdown

### Lines 561-1000: State & Setup
**What:** useState declarations, initial setup, router
**Extraction Target:** `useAppState.ts` custom hook
**Lines to move:** ~440

### Lines 1001-2000: Chat Management  
**What:** Chat message handling, streaming, AI responses
**Extraction Target:** `useChat.ts` + `aiService.ts`
**Lines to move:** ~1,000

### Lines 2001-3000: Document Management
**What:** Document CRUD, content processing, pricing
**Extraction Target:** `useDocuments.ts` + `documentService.ts`
**Lines to move:** ~1,000

### Lines 3001-4000: AI Response Processing
**What:** Complex AI response parsing, content conversion
**Extraction Target:** `aiResponseProcessor.ts` + `contentConverter.ts`
**Lines to move:** ~1,000

### Lines 4001-5000: Advanced Chat Logic
**What:** Budget extraction, discount handling, pricing tables
**Extraction Target:** `pricingService.ts` + `budgetExtractor.ts`
**Lines to move:** ~1,000

### Lines 5001-6000: Content & Error Handling
**What:** Content sanitization, error handling, fallbacks
**Extraction Target:** `contentService.ts` + `errorHandler.ts`
**Lines to move:** ~1,000

### Lines 6001-6665: UI Event Handlers
**What:** Modal handlers, sidebar toggles, export functions
**Extraction Target:** `eventHandlers.ts` + existing hooks
**Lines to move:** ~665

---

## Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|---------|
| Total Lines | 5,594 | ~300 | 🔄 |
| Page Component Logic | ~4,712 | ~0 | 🔄 |
| Custom Hooks | 1 | 8-10 | 🔄 |
| Service Modules | 0 | 6-8 | ❌ |
| Build Success | ✅ | ✅ | ✅ |

---

## Progress Log

### ✅ Completed
- [x] Build compilation fixes
- [x] JSX extraction into components
- [x] Feature flag integration
- [x] TypeScript error resolution
- [x] **Phase 1: UI State Management** - 1,393 lines extracted to `useUIState.ts`

### 🚧 In Progress
- [ ] Structure analysis (current step)
- [ ] Phase 2: Document & Agent State
- [ ] Phase 3: AI chat processing
- [ ] Phase 4: Content management
- [ ] Phase 5: Event handlers
- [ ] Phase 6: Final cleanup

### 📋 Next Actions
1. **Start Phase 2** - Extract document & agent state
2. **Create `useDocumentState.ts`** hook
3. **Create `useAgentState.ts`** hook  
4. **Test after each extraction**
5. **Update this document** after each phase

---

## 🚀 EXECUTION LOG

### Phase 1: State Management Hooks [IN PROGRESS]
**Target:** Extract all useState and related logic from Page component
**Start Time:** November 18, 2025 - 15:45 UTC
**Status:** Beginning extraction

**Steps:**
1. [✅] Identify all useState declarations - FOUND: 25+ useState declarations
2. [✅] Check existing hooks - FOUND: useWorkspaces.ts already has documents/folders/workspaces!
3. [✅] Attempt extraction - FAILED: Type mismatches and import issues
4. [❌] Need different ap
6. [ ] Or create new clean hooks from scratch
proach - Types don't align, dependencies broken
5. [ ] Try simpler extraction - Move one state group at a time
**Issues Found:**
- Type mismatches between @/types and @/lib/types/sow
- Property 'workspaceSlug' optional vs required conflict
- Import path conflicts (multiple Folder/Document types)
- useWorkspaces hook has complex dependencies that break page.tsx

**New Strategy:**
- Extract simpler state first (UI state, not business logic)
- Create minimal new hooks instead of reusing existing complex ones
- Fix types gradually rather than all at once

---

## Notes
- Keep feature flags working throughout
- Maintain existing functionality
- Test after each extraction
- Focus on logical separation, not just line count

**Last Updated:** [AUTO] November 18, 2025 - 16:15 UTC
