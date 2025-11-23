# The Architect v3.1 - Quick Reference

## 🎯 What Changed

**From:** AI that guesses at numbers and takes shortcuts  
**To:** AI that shows its work and iterates for precision

---

## 📋 The 4-Step Workflow

```
STEP 1: [ANALYZE & CLASSIFY]
  └─ Work Type + Core Objective

STEP 2: [MANDATORY FINANCIAL REASONING PROTOCOL]
  ├─ 1. Identify Inputs (BUDGET_INCL_GST, DISCOUNT_PERCENTAGE)
  ├─ 2. Calculate TARGET_SUBTOTAL = (BUDGET / 1.10) / (1 - DISCOUNT%)
  ├─ 3. Initial Hour Allocation → INITIAL_SUBTOTAL
  ├─ 4. Refinement Loop (if diff > $100):
  │    └─ Adjust hours → ADJUSTED_SUBTOTAL (repeat until within $100)
  └─ 5. Final Validation:
       ├─ DISCOUNT_AMOUNT
       ├─ SUBTOTAL_AFTER_DISCOUNT
       ├─ GST_AMOUNT
       └─ FINAL_TOTAL (must = BUDGET_INCL_GST)

STEP 3: [APPLY COMMERCIAL POLISH]
  └─ Document any rounding in [BUDGET_NOTE]

STEP 4: [GENERATE THE SOW]
  ├─ Clean pricing summary in prose
  └─ [PRICING_JSON] with validated figures
```

---

## 🧪 Test Prompt

```
Generate a comprehensive Statement of Work for a new non-profit client: 
'The Green Earth Foundation' - Their budget is a firm $15,000 AUD. 
As they are a non-profit, please ensure you include a 5% goodwill 
discount on the final project value.
```

**Expected Math:**
```
TARGET_SUBTOTAL = ($15,000 / 1.10) / 0.95 = $14,354.06
```

---

## 📊 Console Logs to Monitor

```
💰 Budget extracted from user prompt: $13,636.36 ex GST
🎯 Discount extracted from user prompt: 5%
📊 [FINANCIAL_REASONING] Block Detected:
─────────────────────────────────────
1. Identify Inputs: BUDGET = $15,000, DISCOUNT = 5%
2. TARGET_SUBTOTAL = $14,354.06
3. INITIAL_SUBTOTAL = $[value]
4. Refinement: [adjustments]
5. FINAL_TOTAL = $14,901.70
─────────────────────────────────────
✅ Using budget from user prompt: $13,636.36 (ex GST)
✅ Using discount from user prompt: 5%
```

---

## ✅ Success Criteria

- [ ] [FINANCIAL_REASONING] block appears
- [ ] Refinement loop executes (if needed)
- [ ] ADJUSTED_SUBTOTAL within $100 of TARGET_SUBTOTAL
- [ ] FINAL_TOTAL matches BUDGET_INCL_GST
- [ ] All roles have non-zero hours
- [ ] Discount applied correctly

---

## ⚠️ Red Flags

- ❌ No [FINANCIAL_REASONING] block
- ❌ INITIAL_SUBTOTAL = ADJUSTED_SUBTOTAL (no refinement)
- ❌ Difference > $100 from target
- ❌ "Rounded down" in [BUDGET_NOTE] (shortcut taken)
- ❌ FINAL_TOTAL ≠ BUDGET_INCL_GST

---

## 📦 Deployment

**Commit:** 1595731  
**Files:** `frontend/lib/knowledge-base.ts`, `frontend/app/page.tsx`  
**Status:** ✅ Pushed to GitHub (auto-deploying)

---

## 🎯 Next Steps

1. Monitor EasyPanel rebuild
2. Test with Green Earth Foundation prompt
3. Check console for financial reasoning block
4. Verify ADJUSTED_SUBTOTAL precision
5. Confirm no shortcuts in [BUDGET_NOTE]

---

## 💡 Key Formula

```
TARGET_SUBTOTAL = (BUDGET_INCL_GST / 1.10) / (1 - DISCOUNT_PERCENTAGE)

Example:
  Budget: $15,000 (incl GST)
  Discount: 5%
  
  Step 1: $15,000 / 1.10 = $13,636.36 (remove GST)
  Step 2: $13,636.36 / 0.95 = $14,354.06 (remove discount)
  
  TARGET_SUBTOTAL = $14,354.06
```

---

## 🔧 Files Modified

- `frontend/lib/knowledge-base.ts` - The Architect v3.1 prompt
- `frontend/app/page.tsx` - extractFinancialReasoning() + integration

**Total changes:** +93 insertions, -38 deletions
