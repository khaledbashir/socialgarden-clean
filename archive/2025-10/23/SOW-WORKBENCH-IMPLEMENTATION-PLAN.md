# SOW Workbench Finalization - Implementation Plan

**Date:** October 23, 2025  
**Status:** Implementation In Progress

---

## ✅ COMPLETED TASKS

### 1. Architect Prompt Updates
- ✅ Added mandatory "Scope Assumptions" section to ALL SOW types
  - Position: IMMEDIATELY after Project Outcomes
  - Includes: General assumptions + project-specific assumptions
- ✅ Reordered SOW structure to enforce:
  - Overview → What's Included → Project Outcomes → **Scope Assumptions** → **Deliverable Groups** → Project Phases
- ✅ Added "Budget Adjustment Notes" guidance for when budget optimization occurs
- ✅ Enhanced discount presentation instructions with exact format:
  - Sub-Total (Before Discount)
  - Discount (Description / %)
  - Grand Total (After Discount) +GST
- ✅ Ensured mandatory management roles are documented:
  - Tech-Head Of Senior Project Management
  - Tech-Delivery - Project Coordination  
  - Account Management (at BOTTOM of table)

### 2. Backend PDF Template
- ✅ Logo support already implemented (base64 encoding)
- ✅ Plus Jakarta Sans font already enforced
- ✅ Professional CSS branding applied
- ✅ Footer with Social Garden contact info included

---

## 🔄 IN PROGRESS / TODO

### 3. EditablePricingTable Component Enhancements
**File:** `/frontend/components/tailwind/extensions/editable-pricing-table.tsx`

**Changes Needed:**
1. Update table rendering to NOT use [editablePricingTable] placeholder
   - AI should generate actual role rows with hours, rates, costs
   - Placeholder only appears if no data provided
2. Add column for "Discount Description"
3. Enforce role sorting:
   - Account Management roles ALWAYS at bottom
   - Order: Strategic/Tech → Delivery → Coordination → Account Management
4. Add visual formatting:
   - Sub-Total row (grayed out)
   - Discount row (red text)
   - Grand Total row (bold, emerald background)
   - +GST suffix on all pricing

### 4. Pricing Table Summary Section
**Changes Needed:**
1. Create "Pricing Summary" component that displays:
   ```
   Sub-Total: $XX,XXX
   Discount (If Any): -$X,XXX
   Subtotal After Discount: $XX,XXX
   GST (10%): +$X,XXX
   Grand Total: $XX,XXX +GST
   ```
2. Add "Budget Adjustment Notes" field below pricing
3. Make all fields visible in both editor and PDF

### 5. Discount UI Enhancement
**File:** `/frontend/components/tailwind/pricing-table-builder.tsx`

**Changes Needed:**
1. Add "Discount Description" input field
   - Placeholder: "e.g., Annual commitment discount"
   - Stores description with percentage
2. Update summary display:
   - Show: "Discount ([description]): -$X ([percentage]%)"
   - Not just: "Discount (10%): -$X"
3. Make discount section collapsible

### 6. Account Management Role Sorting
**Implementation:**
1. Add sorting logic to pricing table rendering
2. Detect Account Management roles (any role containing "Account Manager" or "Account Management")
3. Always move to bottom before TOTAL row
4. Apply before markdown generation and PDF export

### 7. AUD Currency & Rounding Logic
**Implementation:**
1. Add validation function:
   ```typescript
   function roundToNearestFiveK(amount: number): number {
     return Math.round(amount / 5000) * 5000;
   }
   ```
2. Apply rounding suggestion to grand total
3. Show in summary: "Total rounded to $50k for budget alignment"
4. Make rounding optional/editable

### 8. Folder Persistence
**File:** `/frontend/lib/db.ts` + `/frontend/app/page.tsx`

**Verification Needed:**
1. Check folder structure is saved to MySQL `folders` table
2. Test folder data survives:
   - Page refresh
   - Workspace switch
   - Browser back/forward
3. Add error handling if folders fail to load

### 9. Drag-and-Drop Refinement
**File:** `/frontend/components/tailwind/extensions/editable-pricing-table.tsx`

**Current Issues Reported:**
- Sometimes buggy/difficult to use
- Need to verify HTML5 API implementation

**Fixes:**
1. Add visual feedback (row highlights during drag)
2. Smooth animations
3. Prevent invalid drops
4. Test on Chrome, Firefox, Safari

### 10. Total Price Toggle
**New Feature:**

**Implementation:**
1. Add button to SOW editor header: "🔒 Hide Totals"
2. When clicked: Hides all pricing grand totals (subtotals still visible)
3. Save preference to localStorage
4. Apply to PDF export as well

### 11. GST Display Formatting
**Changes:**
1. Ensure "+GST" appears with ALL pricing references:
   - Individual role totals: "$X,XXX +GST"
   - Sub-totals: "$XX,XXX +GST"
   - Grand total: "$XX,XXX +GST"
2. Make it consistent in:
   - Pricing table
   - Summary section  
   - PDF output

---

## Implementation Priority

### High Priority (Critical for MVP)
1. ✅ Scope Assumptions section (DONE)
2. ✅ Deliverable Groups positioning (DONE)
3. Budget Adjustment Notes field
4. Discount Description + clearer presentation
5. Account Management sorting

### Medium Priority (Needed Soon)
1. AUD Rounding logic
2. GST formatting consistency
3. EditablePricingTable actual data (not placeholder)
4. Folder persistence verification

### Lower Priority (Nice to Have)
1. Total Price Toggle
2. Drag-and-drop refinement
3. UI polish and animations

---

## Files to Modify

### Frontend
- `/frontend/lib/knowledge-base.ts` ✅ DONE
- `/frontend/components/tailwind/extensions/editable-pricing-table.tsx` (TODO)
- `/frontend/components/tailwind/pricing-table-builder.tsx` (TODO)
- `/frontend/app/page.tsx` (folder persistence verification)

### Backend
- `/backend/main.py` ✅ (Already has logo)

---

## Testing Checklist

- [ ] Generate SOW with "Scope Assumptions" section present
- [ ] Verify Deliverables appear before Phases
- [ ] Pricing table shows actual roles (not [editablePricingTable])
- [ ] Account Management roles at bottom
- [ ] Discount section clearly shows description + %
- [ ] +GST displayed with all pricing
- [ ] PDF exports with Social Garden logo
- [ ] Folders survive refresh
- [ ] Drag-drop works smoothly
- [ ] Total price toggle works

---

## Notes

- THE_ARCHITECT_SYSTEM_PROMPT now has all structural requirements
- Backend already has logo + font support
- Main work needed: UI components for discount/summary display
- Consider creating reusable "PricingSummary" component
