# Implementation Guide for SOW Critical Fixes

## Overview
This document provides step-by-step instructions to implement three critical fixes for the SOW generation system:
1. Budget Constraint Logic - Force AI to respect user's budget limits
2. Hide Raw JSON - Clean up the chat interface by hiding JSON blocks
3. Fix Missing Rows - Ensure all roles from AI response appear in pricing table

## 1. Budget Constraint Logic Fix

### Files to Modify
- `frontend/lib/anythingllm.ts` (lines 327-385, 560-590)

### Changes Required

#### 1. Update System Prompt
Replace line 327 with:
```typescript
You are "The Architect," a specialist AI for generating Statements of Work. Your single most important directive is to use the OFFICIAL_RATE_CARD and STRICTLY RESPECT THE USER'S BUDGET. Failure to do either is a catastrophic error.
```

#### 2. Replace Budget Validation Section
Replace lines 365-385 with:
```typescript
4. **CRITICAL BUDGET VALIDATION (MANDATORY):**
   - Extract the user's budget from their prompt (e.g., "$12,000 limit" means $12,000 budget)
   - **BEFORE OUTPUTTING ANY RESPONSE:** Calculate the total cost of your proposed scope
   - If the total cost exceeds budget, you MUST adjust by:
     a) Reducing hours across all roles proportionally
     b) Swapping Senior roles for Junior roles (e.g., swap 'Senior Consultant' for 'Producer')
     c) Removing non-essential deliverables
   - **FAILURE CONDITION:** Any response that exceeds the user's stated budget is a CRITICAL FAILURE.
   - **MANDATORY VALIDATION:** End your JSON calculation with `{"budget_check": {"user_budget": [amount], "calculated_total": [amount], "within_budget": true}}`
```

#### 3. Update JSON Structure
Replace the JSON_STRUCTURE section (around lines 560-590) with:
```typescript
{
  "scope_name": "...",
  "scope_description": "...",
  "deliverables": ["..."],
  "assumptions": ["..."],
  "role_allocation": [
    { "role": "EXACT Role from Rate Card", "hours": 0, "rate": 0.00, "cost": 0.00 }
  ],
  "scope_subtotal": 0.00,
  "discount_percent": 0,
  "discount_amount": 0.00,
  "subtotal_after_discount": 0.00,
  "gst_percent": 10,
  "gst_amount": 0.00,
  "scope_total": 0.00,
  "budget_check": {
    "user_budget": 0.00,
    "calculated_total": 0.00,
    "within_budget": true
  }
}
```

## 2. Hide Raw JSON Fix

### Files to Modify
- `frontend/components/chat/ChatInterface.tsx` (lines 15-80, 490-500)

### Changes Required

#### 1. Add Imports
Add these imports after line 22:
```typescript
import { extractJsonFromMarkdown } from "@/lib/jsonExtraction";
import { convertAIResponseToPricingRows } from "@/lib/pricingTablePopulator";
```

#### 2. Update MessageContent Component Signature
Replace line 41 with:
```typescript
const MessageContent = ({ content, onPricingUpdate }: { content: string, onPricingUpdate?: (rows: any[]) => void }) => {
```

#### 3. Add JSON Processing Logic
After line 40, add:
```typescript
    // Process JSON when content changes - extract and send to parent if pricing update callback is provided
    React.useEffect(() => {
        if (content.includes("```json") && onPricingUpdate) {
            const extracted = extractJsonFromMarkdown(content);
            if (extracted.json) {
                try {
                    // Handle both single scope and multi-scope formats
                    const pricingData = Array.isArray(extracted.json.scopeItems)
                        ? extracted.json // Multi-scope format
                        : { scopeItems: [extracted.json] }; // Single scope format

                    const result = convertAIResponseToPricingRows(pricingData);
                    if (result.rows.length > 0) {
                        onPricingUpdate(result.rows);
                        console.log("✅ Processed pricing data:", result.rows);
                    }
                } catch (error) {
                    console.error("❌ Failed to process pricing JSON:", error);
                }
            }
        }
    }, [content, onPricingUpdate]);
```

#### 4. Update Display Logic
Replace lines 42-54 with:
```typescript
    // Check for JSON blocks in content
    const hasJSON = content.includes("```json");

    // ALWAYS hide JSON blocks from display - they're for system processing, not user viewing
    const displayContent = content.replace(/```json[\s\S]*?```/g, "").trim();

    // Hide "Insert into editor" marker if present
    const cleanContent = displayContent.replace(/\*\*\* Insert into editor:[\s\S]*/, "").trim();
```

#### 5. Update JSX Rendering
Replace lines 55-65 with:
```typescript
    return (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {/* Always show cleaned content without JSON blocks */}
            <div>{cleanContent}</div>

            {/* Show processing indicator if JSON was present */}
            {hasJSON && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="font-medium">Pricing data processed and applied</span>
                </div>
            )}
        </div>
    );
```

#### 6. Update ChatInterface Component Props
Add to props interface around line 110:
```typescript
    onPricingUpdate?: (rows: any[]) => void;
```

#### 7. Pass onPricingUpdate to MessageContent
Update the MessageContent usage around line 490:
```typescript
<MessageContent
    content={message.content}
    onPricingUpdate={onPricingUpdate}
/>
```

## 3. Fix Missing Rows in Pricing Table

### Files to Modify
- `frontend/lib/pricingTablePopulator.ts` (lines 44-235)
- `frontend/lib/mandatory-roles-enforcer.ts` (lines 400-420)

### Changes Required

#### 1. Update pricingTablePopulator.ts

##### a. Update findRoleInRateCard Function Signature
Replace lines 30-36 with:
```typescript
export function findRoleInRateCard(roleNameFromAI: string): {
    found: boolean;
    rate: number | null;
    exactMatch: boolean;
    matchedRole?: string;
}
```

##### b. Add Lowercase Processing
After line 44, add:
```typescript
    const lowerTrimmed = trimmed.toLowerCase();
```

##### c. Update Exact Match Return
Replace lines 49-52 with:
```typescript
    if (exactMatch) {
        return {
            found: true,
            rate: exactMatch.rate,
            exactMatch: true,
            matchedRole: exactMatch.name,
        };
    }
```

##### d. Add Fuzzy Matching Logic
After line 54, add:
```typescript
    // Try fuzzy matching for common abbreviations and variants
    // Handle "Sr. Consultant" → "Tech - Sr. Consultant - Advisory & Consultation"
    if (lowerTrimmed.includes("sr") || lowerTrimmed.includes("senior")) {
        const seniorMatch = ROLES.find(
            (r) =>
                r.name.toLowerCase().includes("senior") ||
                r.name.toLowerCase().includes("sr."),
        );
        if (seniorMatch) {
            return {
                found: true,
                rate: seniorMatch.rate,
                exactMatch: false,
                matchedRole: seniorMatch.name,
            };
        }
    }

    // Handle "Producer" variants
    if (lowerTrimmed.includes("producer")) {
        const producerMatch = ROLES.find((r) =>
            r.name.toLowerCase().includes("producer"),
        );
        if (producerMatch) {
            return {
                found: true,
                rate: producerMatch.rate,
                exactMatch: false,
                matchedRole: producerMatch.name,
            };
        }
    }

    // Handle "Consultant" variants
    if (lowerTrimmed.includes("consultant")) {
        const consultantMatch = ROLES.find((r) =>
            r.name.toLowerCase().includes("consultant"),
        );
        if (consultantMatch) {
            return {
                found: true,
                rate: consultantMatch.rate,
                exactMatch: false,
                matchedRole: consultantMatch.name,
            };
        }
    }
```

##### e. Update Row Creation to Preserve Matched Role
Replace lines 230-237 with:
```typescript
                const row: PricingRow = {
                    id: `row-${Date.now()}-${Math.random()}`,
                    role: roleMatch.matchedRole || roleData.role, // Use matched role if found, otherwise original
                    description: roleData.description || "",
                    hours,
                    rate,
                    cost,
                    scopeName: scope.scope_name,
                    isUnknownRole: !roleMatch.found, // Mark as unknown for visual indication
                    isHeader: false,
                };
```

#### 2. Update mandatory-roles-enforcer.ts

##### a. Preserve Unknown Roles
Replace lines 391-401 with:
```typescript
        if (!rateCardEntry) {
            console.warn(
                `⚠️ [Enforcer] Role "${aiRole.role}" not found in Rate Card. ` +
                    `This role will be PRESERVED with a default rate to prevent data loss.`,
            );
            // CRITICAL FIX: Preserve role instead of skipping to prevent missing rows
            const additionalRow: PricingRow = {
                id: ensureUniqueId(aiRole.id),
                role: aiRole.role, // Keep original role name
                description: String(aiRole.description || "").trim(),
                hours: validatedHours,
                rate: 120, // Default rate for unknown roles (Producer rate)
            };

            // Add to middle roles by default
            middleRoles.push(additionalRow);
            technicalRolesAdded++;
            processedRoles.add(normalizedAiRole);
            continue;
        }
```

## Testing Instructions

1. After applying all fixes, test the budget constraint:
   - Create a new SOW with "$12,000 limit" in the prompt
   - Verify the AI stays under this budget
   - Check the budget_check object in the response

2. Test the JSON hiding:
   - Generate an SOW with multiple scopes
   - Verify that JSON blocks are not visible in the chat
   - Confirm a blue "Pricing data processed" indicator appears

3. Test the missing rows fix:
   - Generate an SOW with roles like "Sr. Consultant" and "Producer"
   - Verify all roles appear in the pricing table
   - Check that the total matches between chat text and table

## Expected Results

After implementing these fixes:
- ✅ The AI will strictly respect user budget limits
- ✅ Users will see a clean chat interface without technical JSON blocks
- ✅ All roles from the AI response will appear in the pricing table
- ✅ No more price discrepancies between chat text and pricing table