# 🎯 Pricing Table Population - Complete Implementation Guide

## Overview

This guide provides step-by-step instructions for integrating the pricing table population system into the Social Garden SOW Generator. The system converts AI-generated JSON responses into populated pricing tables with validation, error handling, and visual feedback.

## Status

- ✅ **Bug #1 FIXED**: Workspace chat now sends raw strings instead of JSON wrappers
- ✅ **Utilities Created**: `jsonExtraction.ts` and `pricingTablePopulator.ts` 
- ⏳ **Integration In Progress**: Update components to use new utilities

## Architecture Overview

```
AI Response (Markdown)
        ↓
   [JSON Extraction]
        ↓
Parsed JSON Object
        ↓
   [Validation]
        ↓
   [Role Matching]
        ↓
Pricing Rows Array
        ↓
[Visual Rendering]
        ↓
Updated UI Table
```

## File Locations

### Utilities Created
- `frontend/lib/jsonExtraction.ts` - JSON extraction from markdown
- `frontend/lib/pricingTablePopulator.ts` - Row conversion and calculations

### Files to Modify
- `frontend/components/tailwind/pricing-table-builder.tsx` - Add population callback
- `frontend/app/page.tsx` - Integration with AI response handler

### Already Fixed
- `frontend/components/tailwind/workspace-chat.tsx` - Line 340 (raw string fix)

## Implementation Steps

### Step 1: Verify Bug #1 Fix

**File**: `frontend/components/tailwind/workspace-chat.tsx`  
**Line**: 340

Verify the fix is applied:
```typescript
// CORRECT (after fix):
onSendMessage(chatInput, threadSlug, attachments);

// INCORRECT (before fix):
// onSendMessage(JSON.stringify({ prompt: chatInput }), threadSlug, attachments);
```

**Test**:
1. Send a message through WorkspaceChat
2. Check server logs: message should arrive as raw string, not JSON object
3. Verify AnythingLLM receives plain text

### Step 2: Import New Utilities

In `frontend/app/page.tsx`, add imports near the top:

```typescript
import {
  extractJsonFromMarkdown,
  extractAndValidatePricingJson,
} from "@/lib/jsonExtraction";

import {
  convertAIResponseToPricingRows,
  calculatePricingTotals,
  createPopulationSummary,
  type PricingTablePopulationResult,
} from "@/lib/pricingTablePopulator";
```

### Step 3: Add Pricing Table Reference (page.tsx)

Add a ref to access the pricing table component:

```typescript
const pricingTableRef = useRef<any>(null);
```

### Step 4: Create Handler Function (page.tsx)

Add this function after the `handleInsertToEditor` function (around line 5500):

```typescript
/**
 * 🎯 NEW: Handle pricing table population from AI response
 * 
 * Called when user wants to populate the pricing table from AI's suggested JSON.
 * Validates roles against rate card and provides visual feedback for mismatches.
 */
const handleInsertPricingTableFromAI = (aiMessage: string) => {
  if (!aiMessage) {
    toast.error("No AI message to extract pricing from");
    return;
  }

  try {
    console.log("📊 Attempting to extract and populate pricing table from AI response...");

    // Step 1: Extract JSON from markdown
    const extraction = extractJsonFromMarkdown(aiMessage);

    if (!extraction.json) {
      console.error("❌ Pricing extraction failed:", extraction.error);
      toast.error(`Failed to extract pricing data: ${extraction.error}`);
      return;
    }

    console.log("✅ JSON extracted successfully:", {
      hasRoles: !!extraction.json.roles,
      hasScopeItems: !!extraction.json.scopeItems,
      hasDiscount: !!extraction.json.discount,
    });

    // Step 2: Convert to pricing rows
    const populationResult = convertAIResponseToPricingRows(
      extraction.json,
      extraction.json.discount || 0,
    );

    // Step 3: Log summary
    console.log(createPopulationSummary(populationResult));

    // Step 4: Warn about role mismatches
    if (populationResult.errors.length > 0) {
      console.warn(
        `⚠️ Found ${populationResult.errors.length} issues:`,
        populationResult.errors.slice(0, 3),
      );

      // Show user-friendly warning
      const unknownCount = populationResult.rows.filter(
        (r) => r.isUnknownRole && !r.isHeader,
      ).length;

      if (unknownCount > 0) {
        toast.warning(
          `⚠️ ${unknownCount} role(s) not found in rate card - shown in red for manual correction`,
          { duration: 5000 },
        );
      }
    }

    // Step 5: Calculate totals for verification
    const totals = calculatePricingTotals(
      populationResult.rows,
      extraction.json.discount || 0,
    );

    console.log("💰 Pricing Totals:", {
      subtotal: totals.subtotal.toFixed(2),
      discount: totals.discountAmount.toFixed(2),
      gst: totals.gstAmount.toFixed(2),
      total: totals.total.toFixed(2),
    });

    // Step 6: Update UI - pass rows to pricing table component
    // This assumes PricingTableBuilder has been updated with a population method
    if (pricingTableRef.current?.populate) {
      pricingTableRef.current.populate(
        populationResult.rows,
        extraction.json.discount || 0,
      );
      toast.success("✅ Pricing table populated with AI data");
      console.log(
        `✅ Populated ${populationResult.totalRoles} roles across ${populationResult.totalScopes} scope(s)`,
      );
    } else {
      console.warn(
        "⚠️ Pricing table ref not ready - ensure PricingTableBuilder is mounted",
      );
      toast.error(
        "Pricing table component not ready. Please try again in a moment.",
      );
    }
  } catch (error) {
    console.error("❌ Failed to populate pricing table:", error);
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    toast.error(`Failed to populate pricing table: ${errorMsg}`);
  }
};
```

### Step 5: Find and Update "Insert Pricing" Button Handler

In `page.tsx`, search for where the user clicks "Insert Pricing Table" button. This is typically in the AI chat response section around line 5000-5500.

Look for code that handles extracting roles from the AI message. Replace it with:

```typescript
// OLD CODE: Complex multi-block extraction logic
// NEW CODE: Use the handler
handleInsertPricingTableFromAI(lastAIMessage.content);
```

### Step 6: Update PricingTableBuilder Component

**File**: `frontend/components/tailwind/pricing-table-builder.tsx`

Update the component to accept and expose a population method:

```typescript
import { useImperativeHandle } from 'react';

interface PricingTableBuilderProps {
  onInsertTable: (table: any) => void;
  ref?: any; // Add ref support
}

export default function PricingTableBuilder({
  onInsertTable,
}: PricingTableBuilderProps, ref: any) {
  const [rows, setRows] = useState<PricingRow[]>([
    { id: "1", role: "", description: "", hours: 0, rate: 0 },
  ]);
  const [discount, setDiscount] = useState(0);

  // Expose populate method to parent
  useImperativeHandle(
    ref,
    () => ({
      populate: (newRows: PricingRow[], newDiscount?: number) => {
        console.log(
          `📋 Populating pricing table with ${newRows.length} rows`,
        );
        setRows(newRows);
        if (newDiscount !== undefined) {
          setDiscount(newDiscount);
        }
      },
      getRows: () => rows,
      getDiscount: () => discount,
    }),
    [rows, discount],
  );

  // ... rest of component
}

export default forwardRef(PricingTableBuilder);
```

### Step 7: Add Visual Indicator for Unknown Roles

**File**: `frontend/components/tailwind/pricing-table-builder.tsx`

In the row rendering section, update to highlight unknown roles:

```typescript
{rows.map((row) => (
  <div
    key={row.id}
    className={`
      p-3 border rounded-lg transition-colors
      ${
        row.isHeader
          ? "bg-blue-50 border-blue-300 text-blue-900"
          : row.isUnknownRole
            ? "bg-red-50 border-red-300"
            : "bg-white"
      }
    `}
  >
    {row.isHeader && (
      <div className="font-semibold text-sm mb-2">
        {row.role}
      </div>
    )}

    {row.isUnknownRole && !row.isHeader && (
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-600 text-sm font-semibold">
          ⚠️ Unknown Role:
        </span>
        <span className="text-red-600 text-sm font-mono">
          "{row.role}"
        </span>
      </div>
    )}

    {/* Rest of row rendering */}
  </div>
))}
```

### Step 8: Connect Handler to Insert Button

In `page.tsx`, find where the "Insert Pricing Table" button is rendered (usually in the AI chat area around line 5300-5400).

Add an onClick handler:

```typescript
<Button
  onClick={() => {
    const lastAIMessage = [...chatMessages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (lastAIMessage) {
      handleInsertPricingTableFromAI(lastAIMessage.content);
    } else {
      toast.error("No AI response to extract pricing from");
    }
  }}
>
  Insert Pricing Table
</Button>
```

## Testing Checklist

### Basic Functionality
- [ ] Send message through WorkspaceChat
- [ ] Verify AnythingLLM receives raw string (check logs)
- [ ] AI responds with pricing JSON

### JSON Extraction
- [ ] Extract JSON from markdown successfully
- [ ] Handle malformed JSON gracefully
- [ ] Log extraction results

### Role Matching
- [ ] Exact match found → Rate populated correctly
- [ ] Role mismatch → Red highlight appears
- [ ] Summary shows match percentage

### Multi-Scope Support
- [ ] Single scope → Works as before
- [ ] Multiple scopes → Header rows appear
- [ ] Scope names visible in table

### Calculations
- [ ] Subtotal calculated correctly
- [ ] Discount applied correctly
- [ ] GST (10%) calculated on discounted subtotal
- [ ] Total = Subtotal - Discount + GST

### Edge Cases
- [ ] Empty roles array → Error message
- [ ] Missing JSON block → Extraction error
- [ ] Invalid role names → Red highlight with suggestion
- [ ] Hours/rate as strings → Converted to numbers
- [ ] Negative hours/rates → Validated and clamped

## Example Test Cases

### Test Case 1: Single Scope, All Matches

**AI Response**:
```json
{
  "roles": [
    { "role": "Project Manager", "hours": 10, "rate": 160 },
    { "role": "Senior Developer", "hours": 40, "rate": 160 }
  ],
  "discount": 0
}
```

**Expected Result**:
- 2 rows added
- 0 errors
- Match percentage: 100%
- No red highlights
- Subtotal: (10×160) + (40×160) = $8,000

### Test Case 2: Multiple Scopes, Some Mismatches

**AI Response**:
```json
{
  "scopeItems": [
    {
      "scope_name": "Phase 1: Discovery",
      "roles": [
        { "role": "UX Researcher", "hours": 20, "rate": 170 },
        { "role": "Chief Architect", "hours": 10 }
      ]
    },
    {
      "scope_name": "Phase 2: Development",
      "roles": [
        { "role": "Senior Developer", "hours": 60, "rate": 160 }
      ]
    }
  ],
  "discount": 10
}
```

**Expected Result**:
- Scope 1 header row
- 1 matched role (UX Researcher)
- 1 unknown role (Chief Architect) - red highlight
- Scope 2 header row
- 1 matched role (Senior Developer)
- Match percentage: 66%
- Warning toast shown

### Test Case 3: Malformed JSON

**AI Response**:
```markdown
Here's the pricing breakdown:

```json
{
  "roles": [
    { "role": "Developer", "hours": 40
  ]
}
```

This is incomplete JSON.
```

**Expected Result**:
- Extraction fails
- Error message: "JSON parse error..."
- User notified with toast
- No table update

## Debugging Tips

### Enable Verbose Logging

In the handler, add:

```typescript
console.log("🔍 DEBUG: Full extraction result:", extraction);
console.log("🔍 DEBUG: Population result:", populationResult);
console.log("🔍 DEBUG: Totals:", totals);
```

### Inspect Rate Card

```typescript
// In browser console
import { ROLES } from "@/lib/rateCard"
console.log("Available roles:", ROLES.map(r => r.name))
console.log("Total roles:", ROLES.length)
```

### Test Role Matching

```typescript
import { findRoleInRateCard } from "@/lib/pricingTablePopulator"
console.log(findRoleInRateCard("Senior Developer"))
console.log(findRoleInRateCard("Chief Architect")) // Should be unknown
```

## Common Issues & Solutions

### Issue: "Pricing table ref not ready"
**Cause**: PricingTableBuilder not mounted yet
**Solution**: 
1. Verify PricingTableBuilder is in the DOM
2. Check that `ref={pricingTableRef}` is set on component
3. Wait for component to fully render before clicking button

### Issue: Role always shows as unknown despite being in rate card
**Cause**: Case-sensitivity or extra whitespace
**Solution**: 
1. Check exact role name in rate card with `ROLES`
2. AI may be outputting "Developer " (with space) vs "Developer"
3. Implement trim() in findRoleInRateCard (already done)

### Issue: Calculations are off
**Cause**: Discount applied before vs after GST
**Solution**: Order is always: Subtotal → Discount → GST on discounted amount → Total
```
Total = ((Subtotal - (Subtotal × Discount%)) × (1 + GST%))
```

### Issue: JSON extraction fails for valid JSON
**Cause**: Code block markers not exactly ```json
**Solution**: Check markdown has:
- Opening: ` ```json`
- Closing: ` ``` `
- With newlines before/after

## Performance Considerations

- **Role Matching**: O(n) lookup in ROLES array (82 roles) - acceptable
- **Row Conversion**: O(roles × scopes) - typically <100 roles per response
- **Rendering**: Use `key={row.id}` for efficient re-renders

For very large scopes (>500 roles), consider:
- Lazy rendering rows
- Pagination in table
- Virtual scrolling

## Security Considerations

- ✅ JSON parsing wrapped in try-catch
- ✅ Role names never execute as code
- ✅ Numbers validated before calculation
- ✅ User input (hours/rates) sanitized
- ✅ No localStorage for sensitive data

## Next Steps

1. **Implement Step-by-Step**: Follow Steps 1-8 in order
2. **Test Thoroughly**: Use test cases from section above
3. **Gather Feedback**: Monitor user errors in production
4. **Iterate**: Refine role matching based on real AI responses

## Support & Questions

If issues arise:
1. Check console for detailed error logs
2. Verify all imports are correct
3. Ensure utilities are properly exported
4. Test with simple example first
5. Check if AI response format matches expected structure

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Ready for Implementation