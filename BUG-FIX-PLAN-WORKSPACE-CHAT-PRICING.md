# 🐛 Bug Fix Plan: Workspace Chat & Pricing Table

## Executive Summary

This document outlines fixes for two critical bugs in the Social Garden SOW Generator:

1. **Bug #1 (TASK 1):** Workspace Chat wraps user prompt in JSON object instead of sending raw string
2. **Bug #2 (TASK 2):** Pricing table fails to parse AI's JSON response and populate with correct roles

---

## 🔴 Bug #1: Workspace Chat JSON Wrapping Issue

### Current Behavior
When user types "My simple prompt" and clicks Send, the API receives:
```json
{
  "prompt": "My simple prompt"
}
```

### Desired Behavior
The API should receive the raw string directly in the request body to AnythingLLM.

### Root Cause
**File:** `frontend/components/tailwind/workspace-chat.tsx`  
**Lines:** 340-342

```typescript
onSendMessage(JSON.stringify({
  prompt: chatInput,
}), threadSlug, attachments);
```

The `handleSendMessage` function is incorrectly wrapping the user input in a JSON object before passing to the callback.

### Solution

**Step 1:** Fix workspace-chat.tsx line 340-342
- Change from: `JSON.stringify({ prompt: chatInput })`
- Change to: `chatInput` (raw string)

**Why this works:**
- The `onSendMessage` callback expects a plain string as the first parameter
- The `page.tsx` `handleSendMessage` function receives this string as the `message` parameter
- The message is already correctly formatted in the backend API calls

### Code Change
**File:** `frontend/components/tailwind/workspace-chat.tsx`  
**Lines:** 340-342

**Before:**
```typescript
onSendMessage(JSON.stringify({
  prompt: chatInput,
}), threadSlug, attachments);
```

**After:**
```typescript
onSendMessage(chatInput, threadSlug, attachments);
```

---

## 🔴 Bug #2: Pricing Table JSON Parsing & Role Matching

### Current Behavior
- AI generates JSON with role names that don't match the official rate card (e.g., "Development - Senior Developer" vs "Senior Developer")
- Frontend silently fails to parse or populate the pricing table
- Hallucinated roles break the UI
- Multi-scope support not implemented

### Desired Behavior
- Extract JSON from AI's markdown response reliably
- Parse and populate pricing table with roles from AI response
- Perform exact, case-sensitive matching against official rate card
- Display visual indicator (red highlight) for mismatched roles
- Support multiple scopes with header rows

### Root Cause Analysis

**Location 1:** `frontend/app/page.tsx`  
Lines 4900-5000 handle the "insert" command response processing, but:
- Complex multi-block JSON extraction logic (lines 4930-4970)
- Fallback logic is convoluted and error-prone
- No explicit handler for pricing table population from AI chat messages

**Location 2:** `frontend/components/tailwind/pricing-table-builder.tsx`  
Lines 268-278:
- The `PricingTableBuilder` component manages pricing rows state
- No callback mechanism to populate table from external sources (AI chat)
- Role matching is done in `updateRow` but relies on exact ROLES array matching

**Location 3:** `frontend/lib/rateCard.ts` (assumed)  
- Contains the authoritative ROLES array (82 roles with rates)
- No export of role validation/matching utilities

### Solution Architecture

#### Phase 1: Reliable JSON Extraction (new utility function)

**File to create:** `frontend/lib/jsonExtraction.ts`

```typescript
/**
 * Reliably extract JSON code block from markdown response
 * Handles multiple code blocks and malformed JSON gracefully
 */
export function extractJsonFromMarkdown(
  markdown: string
): { json: Record<string, any> | null; error: string | null } {
  // Look for ```json ... ``` blocks
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/i;
  const match = markdown.match(jsonBlockRegex);
  
  if (!match || !match[1]) {
    return { json: null, error: "No JSON code block found" };
  }
  
  try {
    const parsed = JSON.parse(match[1]);
    return { json: parsed, error: null };
  } catch (e) {
    return { json: null, error: `JSON parse error: ${String(e)}` };
  }
}
```

#### Phase 2: Pricing Table Population Handler (new utility)

**File to create:** `frontend/lib/pricingTablePopulator.ts`

```typescript
import { ROLES } from "./rateCard";

interface PricingRow {
  id: string;
  role: string;
  description: string;
  hours: number;
  rate: number;
  scopeName?: string;  // For multi-scope support
  isUnknownRole?: boolean;
  cost?: number;
}

interface ScopeItem {
  scope_name?: string;
  scope_description?: string;
  roles: Array<{
    role: string;
    hours: number;
    rate?: number;
  }>;
}

/**
 * Find exact match for role name in official rate card
 * Case-sensitive, complete word matching
 */
export function findRoleInRateCard(
  roleNameFromAI: string
): { found: boolean; rate: number | null } {
  const trimmed = roleNameFromAI.trim();
  const exactMatch = ROLES.find((r) => r.name === trimmed);
  
  if (exactMatch) {
    return { found: true, rate: exactMatch.rate };
  }
  
  return { found: false, rate: null };
}

/**
 * Convert AI JSON response to pricing table rows
 * Handles both single-scope and multi-scope formats
 * Creates visual indicators for mismatched roles
 */
export function convertAIResponseToPricingRows(
  aiJsonData: Record<string, any>,
  discount: number = 0
): { rows: PricingRow[]; errors: string[] } {
  const rows: PricingRow[] = [];
  const errors: string[] = [];
  
  // Detect format: scopeItems (v4.1 multi-scope) vs direct roles
  const scopes: ScopeItem[] = [];
  
  if (Array.isArray(aiJsonData.scopeItems)) {
    // v4.1 Multi-scope format
    scopes.push(...aiJsonData.scopeItems);
  } else if (Array.isArray(aiJsonData.roles)) {
    // v3.1 Single-scope format (legacy)
    scopes.push({ roles: aiJsonData.roles });
  } else if (Array.isArray(aiJsonData.suggestedRoles)) {
    // Alternative format
    scopes.push({ roles: aiJsonData.suggestedRoles });
  } else {
    errors.push("No roles or scopeItems found in AI response");
    return { rows, errors };
  }
  
  // Process each scope
  for (const scope of scopes) {
    // Add scope header row (non-editable) if this is multi-scope
    if (scopes.length > 1 && scope.scope_name) {
      rows.push({
        id: `scope-header-${Date.now()}`,
        role: `📍 Scope: ${scope.scope_name}`,
        description: scope.scope_description || "",
        hours: 0,
        rate: 0,
        scopeName: scope.scope_name,
        isUnknownRole: true, // Mark as non-editable
      });
    }
    
    // Process roles in this scope
    if (Array.isArray(scope.roles)) {
      for (const roleData of scope.roles) {
        const roleMatch = findRoleInRateCard(roleData.role);
        
        if (!roleMatch.found) {
          errors.push(
            `Role mismatch: "${roleData.role}" not found in rate card`
          );
        }
        
        const row: PricingRow = {
          id: `row-${Date.now()}-${Math.random()}`,
          role: roleData.role,
          description: "",
          hours: roleData.hours || 0,
          rate: roleData.rate || roleMatch.rate || 0,
          scopeName: scope.scope_name,
          isUnknownRole: !roleMatch.found,
          cost: (roleData.hours || 0) * (roleData.rate || roleMatch.rate || 0),
        };
        
        rows.push(row);
      }
    }
  }
  
  return { rows, errors };
}

/**
 * Calculate totals from pricing rows
 */
export function calculatePricingTotals(
  rows: PricingRow[],
  discount: number = 0
): {
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  total: number;
} {
  // Filter out non-data rows (scope headers)
  const dataRows = rows.filter((r) => !r.isUnknownRole || r.hours > 0);
  
  const subtotal = dataRows.reduce((sum, row) => sum + (row.cost || 0), 0);
  const discountAmount = (subtotal * discount) / 100;
  const gstAmount = (subtotal - discountAmount) * 0.1; // 10% GST in Australia
  const total = subtotal - discountAmount + gstAmount;
  
  return {
    subtotal,
    discountAmount,
    gstAmount,
    total,
  };
}
```

#### Phase 3: Update PricingTableBuilder Component

**File:** `frontend/components/tailwind/pricing-table-builder.tsx`

**Add:** Callback prop for external population

```typescript
interface PricingTableBuilderProps {
  onInsertTable: (table: any) => void;
  onPopulateFromAI?: (rows: PricingRow[], discount?: number) => void; // NEW
}
```

**Modify:** Add method to populate from external source

```typescript
export default function PricingTableBuilder({
  onInsertTable,
  onPopulateFromAI, // NEW
}: PricingTableBuilderProps) {
  const [rows, setRows] = useState<PricingRow[]>([
    { id: "1", role: "", description: "", hours: 0, rate: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  
  // NEW: Expose population method via callback
  React.useImperativeHandle(onPopulateFromAI, () => ({
    populate: (newRows: PricingRow[], newDiscount?: number) => {
      setRows(newRows);
      if (newDiscount !== undefined) {
        setDiscount(newDiscount);
      }
    },
  }), []);
  
  // ... rest of component
}
```

#### Phase 4: Integration in page.tsx

**File:** `frontend/app/page.tsx`

**New function** (after the insert command detection ~line 4850):

```typescript
/**
 * Handle pricing table population from AI response
 * Called when user clicks "Insert Pricing Table" button
 */
const handleInsertPricingTableFromAI = (aiMessage: string) => {
  try {
    const { json, error } = extractJsonFromMarkdown(aiMessage);
    
    if (error || !json) {
      toast.error(`Failed to extract pricing data: ${error}`);
      return;
    }
    
    const { rows, errors } = convertAIResponseToPricingRows(
      json,
      json.discount || 0
    );
    
    // Log any role mismatches
    if (errors.length > 0) {
      console.warn("⚠️ Pricing table population warnings:", errors);
      toast.warning(
        `${errors.length} role(s) not found in rate card - check highlighted rows`
      );
    }
    
    // Populate the pricing table component
    pricingTableRef.current?.populate?.(rows, json.discount);
    
    console.log("✅ Pricing table populated with AI data");
  } catch (e) {
    console.error("❌ Failed to populate pricing table:", e);
    toast.error("Failed to parse pricing data from AI response");
  }
};
```

#### Phase 5: Visual Indicator for Mismatched Roles

**File:** `frontend/components/tailwind/pricing-table-builder.tsx`

**Modify:** Row rendering to highlight unknown roles

```typescript
// In the row rendering JSX:
<div
  className={`
    p-3 border rounded-lg
    ${row.isUnknownRole ? "bg-red-50 border-red-300" : "bg-white"}
    ${row.scopeName && !row.hours ? "bg-blue-50 border-blue-200" : ""}
  `}
>
  {row.isUnknownRole && (
    <div className="text-red-600 text-sm font-semibold mb-2">
      ⚠️ Unknown Role: {row.role}
    </div>
  )}
  {/* Rest of row content */}
</div>
```

---

## Implementation Timeline

### Phase 1: Bug #1 Fix (5 minutes)
- [ ] Edit workspace-chat.tsx line 340-342
- [ ] Test: Send message in UI, verify API receives raw string

### Phase 2: Bug #2 Utilities (30 minutes)
- [ ] Create jsonExtraction.ts
- [ ] Create pricingTablePopulator.ts
- [ ] Write unit tests for role matching

### Phase 3: Component Updates (45 minutes)
- [ ] Update PricingTableBuilder props and state handling
- [ ] Add visual indicators for mismatched roles
- [ ] Test: Render table with unknown roles

### Phase 4: Integration (60 minutes)
- [ ] Add handleInsertPricingTableFromAI to page.tsx
- [ ] Connect "Insert Pricing Table" button to new handler
- [ ] Test end-to-end: AI → JSON → Pricing Table

### Phase 5: Testing & Verification (45 minutes)
- [ ] Test with single-scope AI response
- [ ] Test with multi-scope AI response
- [ ] Test with hallucinated role names
- [ ] Test calculations (subtotal, discount, GST, total)

---

## Testing Checklist

### Bug #1 Testing
- [ ] Send message through WorkspaceChat
- [ ] Verify server logs show raw string, not JSON wrapper
- [ ] Verify AnythingLLM receives plain text message

### Bug #2 Testing
- [ ] AI generates pricing with exact role matches → Table populates perfectly
- [ ] AI generates pricing with 1 mismatched role → Red highlight appears
- [ ] Multi-scope response → Scope headers appear, roles grouped correctly
- [ ] Calculations verified → Subtotal, discount, GST, total all correct
- [ ] Can still manually edit rows after AI population

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Breaking existing insert flow | Low | High | Comprehensive testing of insert command |
| JSON parsing edge cases | Medium | Medium | Try-catch blocks + detailed error logging |
| Role matching too strict | Medium | Medium | Provide UI feedback for mismatches |
| Performance with large scopes | Low | Low | Cache ROLES array, use Set for matching |

---

## Success Criteria

✅ Bug #1: Message arrives at AnythingLLM as plain string, no JSON wrapper  
✅ Bug #2: Pricing table correctly populated from AI JSON with visual feedback  
✅ Multi-scope: Multiple scopes displayed with headers  
✅ Role validation: Unknown roles highlighted in red  
✅ Calculations: Subtotal, discount, GST, total all computed correctly  
✅ No breaking changes: Existing features continue to work  

---

**Document Version:** 1.0  
**Created:** October 2025  
**Status:** Ready for Implementation