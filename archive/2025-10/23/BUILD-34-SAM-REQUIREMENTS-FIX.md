# BUILD 34: Sam's Requirements - Complete Fix

**Date**: October 23, 2025  
**Status**: IN PROGRESS  
**Priority**: CRITICAL - Client-facing requirements

## 🎯 Issues Identified from Video Analysis

### ✅ CONFIRMED WORKING:
1. ✅ **Pricing Table** - Fully interactive with granular roles
2. ✅ **Discount Logic** - Real-time calculation working
3. ✅ **Role Granularity** - Multiple seniority levels shown

### ❌ STILL BROKEN (Must Fix):

#### 1. ❌ **Deliverables Location** (CRITICAL)
**Issue**: "Detailed Deliverable Groups" appears AFTER "Project Phases"  
**Required**: Must appear AFTER "Scope Overview", BEFORE "Project Phases"

**Current Structure** (WRONG):
```
1. Overview
2. What's Included
3. Project Outcomes
4. Project Phases ← TOO EARLY
5. Detailed Deliverable Groups ← TOO LATE
6. Investment
```

**Required Structure** (CORRECT):
```
1. Overview
2. What's Included
3. Project Outcomes
4. Scope Assumptions ← MISSING
5. Detailed Deliverable Groups ← MOVE HERE
6. Project Phases ← MOVE DOWN
7. Investment
```

**Fix Location**: `frontend/lib/knowledge-base.ts` - THE_ARCHITECT_SYSTEM_PROMPT section 6

---

#### 2. ❌ **Scope Assumptions Section** (CRITICAL)
**Issue**: Completely missing from generated SOWs  
**Required**: MANDATORY section after "Project Outcomes", before deliverables

**What It Must Include**:
```markdown
## Scope Assumptions

• Hours outlined are capped as an estimate
• Client will provide feedback within 3-7 days
• Rates are not locked in if agreement not signed within 30 days
• Project timeline finalized post sign-off
• [3-5 project-specific assumptions]
```

**Root Cause**: The Architect prompt has this requirement, but LLM is not following it consistently

**Fix Strategy**:
1. Add explicit enforcement in prompt: "STOP if Scope Assumptions missing"
2. Add validation check in frontend before rendering
3. Add placeholder UI if section missing

---

#### 3. ❌ **Total Price Toggle** (CRITICAL)
**Issue**: No way to hide/show "Total Project Value" in pricing section  
**Required**: Button/checkbox to toggle visibility of total investment

**UI Requirements**:
- Checkbox: "Show Total Investment" (default: ON)
- When OFF: Hide all price totals (Sub-Total, Grand Total, Discount)
- When OFF: Show only roles and hours (no $ amounts)
- Use case: Internal planning, client negotiation stages

**Implementation**:
- Location: `frontend/components/tailwind/extensions/editable-pricing-table.tsx`
- Add state: `const [showPrices, setShowPrices] = useState(true)`
- Add toggle UI above pricing table
- Conditionally render price columns

---

#### 4. ⚠️ **Account Management Role Ordering** (HIGH PRIORITY)
**Issue**: Cannot verify from video (no Account Management role in that SOW)  
**Required**: Account Management MUST ALWAYS appear at BOTTOM of pricing table

**Enforcement**:
- Sort pricing rows: Strategic/Tech → Delivery → Coordination → Account Management (LAST)
- Add validation: If Account Management not last → warn user
- Update prompt to emphasize this rule more strongly

**Fix Location**: 
- Prompt: `frontend/lib/knowledge-base.ts` (strengthen language)
- UI: `frontend/components/tailwind/extensions/editable-pricing-table.tsx` (add sort logic)

---

#### 5. ⚠️ **Mandatory Minimum Hours** (MEDIUM PRIORITY)
**Issue**: Cannot verify if minimum hours enforced for management roles  
**Required**: 
- Account Management: 6-12 hours minimum
- Project Coordination: 3-10 hours minimum
- Senior Management: 5-15 hours minimum

**Validation Strategy**:
- Check on auto-save
- If below minimum → yellow warning toast
- Don't block save (allow exceptions) but warn user

---

#### 6. ⚠️ **PDF Branding** (CANNOT VERIFY - Not in Video)
**Issue**: Video shows web UI only, not PDF export  
**Required**:
- Social Garden logo in header
- Plus Jakarta Sans font throughout
- Brand colors: dark teal + social garden green

**Verification Needed**:
- Export a PDF and inspect
- Check logo embedding (base64?)
- Check font loading (embedded or system fallback?)

**Files to Check**:
- `backend/main.py` - PDF generation with WeasyPrint
- `frontend/app/api/generate-pdf/route.ts` - HTML → PDF conversion

---

## 📋 Implementation Plan

### Phase 1: Critical Fixes (Today)
1. **Fix Scope Assumptions** - Add enforcement + validation
2. **Fix Deliverables Location** - Update prompt structure
3. **Add Price Toggle** - Implement show/hide functionality

### Phase 2: Validation & Ordering (Today)
4. **Account Management Ordering** - Add sort logic
5. **Minimum Hours Validation** - Add warnings

### Phase 3: Verification (Tomorrow)
6. **PDF Branding Test** - Generate test PDF and verify
7. **End-to-End Test** - Create full SOW with all features

---

## 🔧 Technical Changes Required

### File: `frontend/lib/knowledge-base.ts`
**Change**: Update THE_ARCHITECT_SYSTEM_PROMPT structure order

```typescript
// BEFORE (Current - WRONG ORDER):
6. Detailed Deliverable Groups
7. Project Phases

// AFTER (Required - CORRECT ORDER):
5. Scope Assumptions (NEW - ENFORCED)
6. Detailed Deliverable Groups (MOVE UP)
7. Project Phases (MOVE DOWN)
```

**Enforcement Addition**:
```
⚠️ CRITICAL ENFORCEMENT RULE:
If you generate an SOW without a visible "## Scope Assumptions" section appearing IMMEDIATELY after "Project Outcomes", you HAVE FAILED. 
STOP. Do not continue to other sections. Regenerate with Scope Assumptions included.
```

---

### File: `frontend/components/tailwind/extensions/editable-pricing-table.tsx`
**Changes**:
1. Add price toggle checkbox
2. Add Account Management sort logic
3. Add minimum hours validation warnings

```typescript
// New state
const [showPrices, setShowPrices] = useState(true);
const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

// Sort function
const sortedRows = useMemo(() => {
  return [...rows].sort((a, b) => {
    // Account Management always last
    if (a.role.includes('Account Management')) return 1;
    if (b.role.includes('Account Management')) return -1;
    // Rest by original order
    return 0;
  });
}, [rows]);

// Validation function
useEffect(() => {
  const warnings: string[] = [];
  
  const accountMgmt = rows.find(r => r.role.includes('Account Management'));
  if (accountMgmt && accountMgmt.hours < 6) {
    warnings.push('⚠️ Account Management below minimum 6 hours');
  }
  
  const projectCoord = rows.find(r => r.role.includes('Project Coordination'));
  if (projectCoord && projectCoord.hours < 3) {
    warnings.push('⚠️ Project Coordination below minimum 3 hours');
  }
  
  setValidationWarnings(warnings);
}, [rows]);
```

---

### File: `frontend/app/page.tsx`
**Change**: Add Scope Assumptions validation before rendering

```typescript
// After loading SOW content, check for required sections
const validateSOWStructure = (content: any): string[] => {
  const errors: string[] = [];
  const contentText = JSON.stringify(content).toLowerCase();
  
  if (!contentText.includes('scope assumptions')) {
    errors.push('❌ Missing required section: Scope Assumptions');
  }
  
  // Check section order (deliverables before phases)
  const deliverablesIndex = contentText.indexOf('detailed deliverable');
  const phasesIndex = contentText.indexOf('project phases');
  
  if (phasesIndex > 0 && deliverablesIndex > phasesIndex) {
    errors.push('⚠️ Incorrect order: Deliverables should appear before Project Phases');
  }
  
  return errors;
};
```

---

## 🎬 Next Steps

1. **Implement Phase 1** (Critical fixes)
2. **Test with sample SOW** (generate new one)
3. **Record video** showing fixes working
4. **Ship to production** after validation

---

## 📊 Success Criteria

**When All Fixed**:
- [ ] Scope Assumptions section appears in EVERY generated SOW
- [ ] Deliverables appear AFTER Scope Overview, BEFORE Project Phases
- [ ] Price toggle button shows/hides $ amounts
- [ ] Account Management always at bottom of pricing table
- [ ] Warnings shown when minimum hours not met
- [ ] PDF exports with Social Garden logo + Plus Jakarta Sans font

**Verification**: Generate 3 test SOWs (Standard, Audit, Retainer) and confirm all requirements met.
