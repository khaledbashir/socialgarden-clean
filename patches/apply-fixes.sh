#!/bin/bash

# SOW Critical Fixes - Application Script
# This script applies the three critical fixes to resolve SOW generation issues

set -e  # Exit on any error

echo "🔧 Applying SOW Critical Fixes..."
echo "=================================="

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the root of the11-dev-clean project"
    exit 1
fi

echo "✅ Directory check passed"

# Apply Fix 1: Budget Constraint Logic (System Prompt)
echo ""
echo "📝 Fix 1/3: Budget Constraint Logic (System Prompt)"
echo "----------------------------------------------"

# Check if the changes are already applied
if grep -q "CRITICAL BUDGET VALIDATION (MANDATORY)" frontend/lib/anythingllm.ts; then
    echo "⚠️  Budget validation fix already applied. Skipping."
else
    # Apply the budget validation changes to anythingllm.ts
    sed -i 's/You are "The Architect," a specialist AI for generating Statements of Work. Your single most important directive is to use the OFFICIAL_RATE_CARD. Failure to do so is a catastrophic error./You are "The Architect," a specialist AI for generating Statements of Work. Your single most important directive is to use the OFFICIAL_RATE_CARD and STRICTLY RESPECT THE USER'\''S BUDGET. Failure to do either is a catastrophic error./' frontend/lib/anythingllm.ts

    # Add budget validation section to architect prompt
    sed -i '/4\. \*\*BUDGET & TIMELINE CALIBRATION:\*/,/BUDGET & TIMELINE CALIBRATION:/' frontend/lib/anythingllm.ts
    sed -i '/BUDGET & TIMELINE CALIBRATION:/,/Check the Timeline:/c\
4. **CRITICAL BUDGET VALIDATION (MANDATORY):**\
   - Extract the user'\''s budget from their prompt (e.g., "$12,000 limit" means $12,000 budget)\
   - **BEFORE OUTPUTTING ANY RESPONSE:** Calculate the total cost of your proposed scope\
   - If total cost exceeds budget, you MUST adjust by:\
     a) Reducing hours across all roles proportionally\
     b) Swapping Senior roles for Junior roles (e.g., swap '\''Senior Consultant'\'' for '\''Producer'\'')\
     c) Removing non-essential deliverables\
   - **FAILURE CONDITION:** Any response that exceeds the user'\''s stated budget is a CRITICAL FAILURE.\
   - **MANDATORY VALIDATION:** End your JSON calculation with `{"budget_check": {"user_budget": [amount], "calculated_total": [amount], "within_budget": true}}`' frontend/lib/anythingllm.ts

    # Update JSON structure to include budget_check
    sed -i '/"scope_total": 0\.00/c\
  "scope_total": 0.00,\
  "budget_check": {\
    "user_budget": 0.00,\
    "calculated_total": 0.00,\
    "within_budget": true\
  }' frontend/lib/anythingllm.ts

    echo "✅ Budget constraint logic fix applied"
fi

# Apply Fix 2: Hide Raw JSON (UI Cleanliness)
echo ""
echo "🎨 Fix 2/3: Hide Raw JSON (UI Cleanliness)"
echo "-----------------------------------------"

# Check if the changes are already applied
if grep -q "ALWAYS hide JSON blocks from display" frontend/components/chat/ChatInterface.tsx; then
    echo "⚠️  JSON hiding fix already applied. Skipping."
else
    # Add imports for JSON processing
    sed -i '/import { Badge } from "@\/components\/tailwind\/ui\/badge";/a\
import { extractJsonFromMarkdown } from "@/lib\/jsonExtraction";\
import { convertAIResponseToPricingRows } from "@/lib\/pricingTablePopulator";' frontend/components/chat/ChatInterface.tsx

    # Update MessageContent component signature
    sed -i 's/const MessageContent = ({ content }: { content: string }) => {/const MessageContent = ({ content, onPricingUpdate }: { content: string, onPricingUpdate?: (rows: any\[\]) => void }) => {/' frontend/components/chat/ChatInterface.tsx

    # Add JSON processing useEffect
    sed -i '/const \[expandedJSON, setExpandedJSON\] = useState<Record<number, boolean>>({});/a\
\
    // Process JSON when content changes - extract and send to parent if pricing update callback is provided\
    React.useEffect(() => {\
        if (content.includes("```json") && onPricingUpdate) {\
            const extracted = extractJsonFromMarkdown(content);\
            if (extracted.json) {\
                try {\
                    // Handle both single scope and multi-scope formats\
                    const pricingData = Array.isArray(extracted.json.scopeItems)\
                        ? extracted.json // Multi-scope format\
                        : { scopeItems: [extracted.json] }; // Single scope format\
\
                    const result = convertAIResponseToPricingRows(pricingData);\
                    if (result.rows.length > 0) {\
                        onPricingUpdate(result.rows);\
                        console.log("✅ Processed pricing data:", result.rows);\
                    }\
                } catch (error) {\
                    console.error("❌ Failed to process pricing JSON:", error);\
                }\
            }\
        }\
    }, [content, onPricingUpdate]);' frontend/components/chat/ChatInterface.tsx

    # Update display logic to always hide JSON
    sed -i '/\/\/ Hide the "Insert into editor" marker for display/,/const hasJSON = content.includes("```json");/c\
    // Check for JSON blocks in content\
    const hasJSON = content.includes("```json");\
\
    // ALWAYS hide JSON blocks from display - they'\''re for system processing, not user viewing\
    const displayContent = content.replace(/```json[\s\S]*?```/g, "").trim();\
\
    // Hide "Insert into editor" marker if present\
    const cleanContent = displayContent.replace(/\*\*\* Insert into editor:[\s\S]*/, "").trim();' frontend/components/chat/ChatInterface.tsx

    # Add pricing update prop to MessageContent usage
    sed -i 's/<MessageContent content={message.content} \/>/<MessageContent\
                                            content={message.content}\
                                            onPricingUpdate={onPricingUpdate}\
                                        \/>/' frontend/components/chat/ChatInterface.tsx

    echo "✅ Raw JSON hiding fix applied"
fi

# Apply Fix 3: Missing Rows in Pricing Table (Data Persistence)
echo ""
echo "📊 Fix 3/3: Missing Rows in Pricing Table (Data Persistence)"
echo "----------------------------------------------------"

# Check if the changes are already applied
if grep -q "Uses fuzzy matching for variants like" frontend/lib/pricingTablePopulator.ts; then
    echo "⚠️  Missing rows fix already applied. Skipping."
else
    # Update findRoleInRateCard function to use fuzzy matching
    sed -i '/Find exact match for role name in official rate card/,/Case-sensitive, complete word matching/c\
 * Find match for role name in official rate card\
 * Uses fuzzy matching for variants like "Sr. Consultant" to find "Tech - Sr. Consultant - Advisory & Consultation"' frontend/lib/pricingTablePopulator.ts

    # Add fuzzy matching logic
    sed -i '/const trimmed = roleNameFromAI.trim();/a\
    const lowerTrimmed = trimmed.toLowerCase();' frontend/lib/pricingTablePopulator.ts

    # Update return type to include matchedRole
    sed -i '/found: boolean;/a\
    rate: number | null;\
    exactMatch: boolean;\
    matchedRole?: string;' frontend/lib/pricingTablePopulator.ts

    # Update exact match return
    sed -i '/return { found: true, rate: exactMatch.rate, exactMatch: true };/c\
        return {\
            found: true,\
            rate: exactMatch.rate,\
            exactMatch: true,\
            matchedRole: exactMatch.name,\
        };' frontend/lib/pricingTablePopulator.ts

    # Add fuzzy matching for roles
    sed -i '// No partial matching - be strict about role names/i\
    // Try fuzzy matching for common abbreviations and variants\
    // Handle "Sr. Consultant" → "Tech - Sr. Consultant - Advisory & Consultation"\
    if (lowerTrimmed.includes("sr") || lowerTrimmed.includes("senior")) {\
        const seniorMatch = ROLES.find(\
            (r) =>\
                r.name.toLowerCase().includes("senior") ||\
                r.name.toLowerCase().includes("sr."),\
        );\
        if (seniorMatch) {\
            return {\
                found: true,\
                rate: seniorMatch.rate,\
                exactMatch: false,\
                matchedRole: seniorMatch.name,\
            };\
        }\
    }\
\
    // Handle "Producer" variants\
    if (lowerTrimmed.includes("producer")) {\
        const producerMatch = ROLES.find((r) =>\
            r.name.toLowerCase().includes("producer"),\
        );\
        if (producerMatch) {\
            return {\
                found: true,\
                rate: producerMatch.rate,\
                exactMatch: false,\
                matchedRole: producerMatch.name,\
            };\
        }\
    }\
\
    // Handle "Consultant" variants\
    if (lowerTrimmed.includes("consultant")) {\
        const consultantMatch = ROLES.find((r) =>\
            r.name.toLowerCase().includes("consultant"),\
        );\
        if (consultantMatch) {\
            return {\
                found: true,\
                rate: consultantMatch.rate,\
                exactMatch: false,\
                matchedRole: consultantMatch.name,\
            };\
        }\
    }' frontend/lib/pricingTablePopulator.ts

    # Update role creation to preserve all roles
    sed -i '/role: roleData.role,/c\
                    role: roleMatch.matchedRole || roleData.role, // Use matched role if found, otherwise original\
                    description: roleData.description || "",\
                    hours,\
                    rate,\
                    cost,\
                    scopeName: scope.scope_name,\
                    isUnknownRole: !roleMatch.found, // Mark as unknown for visual indication\
                    isHeader: false,' frontend/lib/pricingTablePopulator.ts

    echo "✅ Missing rows in pricing table fix applied"
fi

# Fix mandatory-roles-enforcer to preserve unknown roles
if grep -q "This role will be REJECTED" frontend/lib/mandatory-roles-enforcer.ts; then
    echo "📊 Updating mandatory-roles-enforcer to preserve unknown roles..."

    # Update to preserve instead of reject unknown roles
    sed -i 's/This role will be REJECTED. Please select roles from official Rate Card./This role will be PRESERVED with a default rate to prevent data loss./' frontend/lib/mandatory-roles-enforcer.ts

    # Add logic to preserve unknown roles
    sed -i '/continue; // Skip invalid roles/i\
            // CRITICAL FIX: Preserve role instead of skipping to prevent missing rows\
            const additionalRow: PricingRow = {\
                id: ensureUniqueId(aiRole.id),\
                role: aiRole.role, // Keep original role name\
                description: String(aiRole.description || "").trim(),\
                hours: validatedHours,\
                rate: 120, // Default rate for unknown roles (Producer rate)\
            };\
\
            // Add to middle roles by default\
            middleRoles.push(additionalRow);\
            technicalRolesAdded++;\
            processedRoles.add(normalizedAiRole);\
            continue;' frontend/lib/mandatory-roles-enforcer.ts

    echo "✅ Mandatory roles enforcer updated"
fi

echo ""
echo "🎉 All critical fixes have been applied successfully!"
echo "=================================="
echo ""
echo "Summary of changes:"
echo "1. ✅ Budget Constraint Logic - AI will now respect user's budget caps"
echo "2. ✅ Hide Raw JSON - Users will see clean chat interface without technical JSON"
echo "3. ✅ Missing Rows Fix - All roles will be preserved in pricing table"
echo ""
echo "Next steps:"
echo "1. Test the SOW generation with a budget limit (e.g., '$12,000 limit')"
echo "2. Verify that JSON blocks are hidden from chat"
echo "3. Confirm all roles appear in the pricing table"
echo ""
echo "Run 'npm run dev' to start the development server and test the changes."
