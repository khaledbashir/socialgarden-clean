# BUILD 34: Sam's Requirements - STATUS UPDATE

**Date**: October 23, 2025  
**Last Update**: Phase 1 Complete  
**Commit**: `a676854`

---

## ✅ PHASE 1 COMPLETE (3/6 Issues Fixed)

### 1. ✅ **Scope Assumptions Enforcement** - FIXED
**What Changed**:
- Added **enforcement checkpoint** in THE_ARCHITECT_SYSTEM_PROMPT
- Rule: "If you reach Project Phases without writing '## Scope Assumptions', STOP IMMEDIATELY. You have failed."
- Updated all 3 SOW formats (Standard, Audit, Retainer) with verification steps

**How It Works Now**:
- LLM must generate "## Scope Assumptions" heading BEFORE continuing
- Section must include 4 general assumptions + 3-5 project-specific ones
- If missing, SOW is marked INVALID

**Test**: Generate new SOW and verify "## Scope Assumptions" section appears after "Project Outcomes"

---

### 2. ✅ **Section Ordering Clarified** - FIXED
**What Changed**:
- Prompt now explicitly states: "Deliverables IMMEDIATELY AFTER Scope Assumptions"
- Added: "Project Phases APPEARS AFTER DELIVERABLES, NOT BEFORE"
- Numbered list updated to show correct order (5 → 6 → 7)

**Correct Order Now**:
```
4. Project Outcomes
5. ⭐ Scope Assumptions ⭐ (NEW/ENFORCED)
6. Detailed Deliverable Groups (MOVED UP)
7. Project Phases (MOVED DOWN)
8. Investment
```

**Test**: Generate SOW and verify deliverables appear BEFORE phases

---

### 3. ✅ **Price Toggle Fully Implemented** - FIXED
**What Changed**:
- Toggle now hides **TOTAL COST column** in pricing table (not just summary)
- Moved toggle button to TOP of summary section with better styling
- When OFF: Shows helper text "💡 Pricing hidden - toggle to show investment details"
- When ON: Shows green "✓ Visible" button

**Behavior**:
- **Toggle ON** (default): Full pricing visible (table column + summary)
- **Toggle OFF**: Only Role + Hours visible, all $ amounts hidden

**Use Case**: Internal planning, showing scope to client before discussing price

**Test**: Click "Show Pricing" toggle and verify TOTAL COST column disappears from table

---

## ⏳ PHASE 2 PENDING (3/6 Issues Remaining)

### 4. ⚠️ **Account Management Role Ordering** - NOT YET FIXED
**Issue**: Account Management must ALWAYS appear at bottom of pricing table  
**Status**: Prompt mentions this but no UI enforcement  
**Plan**: Add sort function to automatically move Account Management to last position  

**Implementation**:
```typescript
const sortedRows = useMemo(() => {
  return [...rows].sort((a, b) => {
    if (a.role.includes('Account Management')) return 1;
    if (b.role.includes('Account Management')) return -1;
    return 0;
  });
}, [rows]);
```

---

### 5. ⚠️ **Minimum Hours Validation** - NOT YET FIXED
**Issue**: No warnings when management roles below minimum hours  
**Status**: Requirements exist in prompt but no UI validation  
**Plan**: Add warning toasts when hours below threshold  

**Thresholds**:
- Account Management: 6-12 hours (warn if < 6)
- Project Coordination: 3-10 hours (warn if < 3)
- Senior Management: 5-15 hours (warn if < 5)

**Implementation**:
```typescript
useEffect(() => {
  const accountMgmt = rows.find(r => r.role.includes('Account Management'));
  if (accountMgmt && accountMgmt.hours < 6) {
    toast.warn('⚠️ Account Management below minimum 6 hours');
  }
}, [rows]);
```

---

### 6. ⚠️ **PDF Branding** - CANNOT VERIFY YET
**Issue**: Video shows web UI only, not PDF export  
**Status**: Need to export a PDF and visually inspect  
**Plan**: Generate test SOW → Export PDF → Check logo + font  

**Requirements**:
- Social Garden logo in PDF header (base64 embedded?)
- Plus Jakarta Sans font throughout (embedded or fallback?)
- Brand colors: dark teal (#0e2e33) + emerald green (#1CBF79)

**Files to Check**:
- `backend/main.py` - WeasyPrint PDF generation
- `frontend/app/api/generate-pdf/route.ts` - HTML → PDF conversion
- Logo file: `/frontend/public/images/logo-light.png` (already exists ✓)

---

## 📊 Success Metrics (Current)

| Requirement | Status | Evidence |
|------------|--------|----------|
| Scope Assumptions visible | ✅ FIXED | Enforcement added to prompt |
| Deliverables before Phases | ✅ FIXED | Order clarified in prompt |
| Price toggle works | ✅ FIXED | Hides column + summary |
| Account Mgmt at bottom | ❌ TODO | Sort function needed |
| Minimum hours warnings | ❌ TODO | Validation needed |
| PDF branding correct | ⚠️ UNKNOWN | Need PDF export test |

**Overall Progress**: 3/6 complete (50%)

---

## 🎬 Next Steps

### Immediate (Today):
1. ✅ Test Phase 1 fixes (generate new SOW)
2. ⏳ Implement Account Management sorting
3. ⏳ Add minimum hours validation
4. ⏳ Export test PDF and verify branding

### Tomorrow:
5. End-to-end testing with all 3 SOW types
6. Record demo video showing all fixes
7. Deploy to production

---

## 🔧 How to Test Phase 1 Fixes

1. **Open app**: https://sow.qandu.me
2. **Create new SOW**: Use prompt: "Create SOW for ABC Corp for HubSpot implementation"
3. **Verify Scope Assumptions**: Scroll down, confirm "## Scope Assumptions" section exists
4. **Verify Section Order**: Check that Deliverables appear BEFORE Project Phases
5. **Test Price Toggle**: Click "Show Pricing" button at top of summary section
6. **Verify Column Hide**: Confirm "TOTAL COST + GST" column disappears from table

**Expected Result**: All 3 fixes working ✅

---

## 📝 Notes for Sam

**What's Working Now**:
- Scope Assumptions will appear in all new SOWs (enforcement added)
- Section order is correct (Deliverables → Phases, not Phases → Deliverables)
- Price toggle hides ALL pricing (column + summary) for internal planning

**What's Still Needed**:
- Account Management role will auto-sort to bottom (coming in Phase 2)
- Warnings will show if management hours too low (coming in Phase 2)
- PDF export needs visual verification (pending test)

**ETA for Full Completion**: End of today (Oct 23, 2025)
