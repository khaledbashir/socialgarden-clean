# Missing Rate Card Roles - Critical Fix Required

## Issue Identified: Rate Card Discrepancy

**Problem:** 
- `rateCard.ts` contains only **82 roles**
- `knowledge-base.ts` contains the complete **90 roles**
- AnyTHINGLLM embedding is using the incomplete `rateCard.ts`

## Missing 8 Roles (From knowledge-base.ts):

1. **Tech - Producer - Admin Configuration** 
2. **Tech - Producer - Field / Property Setup**
3. **Tech - Producer - Landing Page Production**
4. **Tech - Producer - Lead Scoring Setup**
5. **Tech - Producer - Web Development**
6. **Tech - Producer - Workflows**
7. **Tech - Sr. Consultant - Approval & Testing**
8. **Tech - Sr. Consultant - Strategy**

## Solution Required:

Update the `rateCard.ts` to include the missing 8 roles from `knowledge-base.ts`, OR update the AnyTHINGLLM embedding to use `knowledge-base.ts` as the authoritative source.

## Impact:

- **Current:** Only 82 roles available to The Architect
- **Should be:** All 90 roles available to The Architect
- **Consequence:** Incomplete SOW pricing calculations

## Fix Priority: HIGH

This affects SOW accuracy and pricing completeness.
