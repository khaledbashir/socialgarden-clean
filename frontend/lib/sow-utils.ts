// Utility functions for SOW handling

import type { Scope, RoleAllocation, MultiScopeData, PDFExportData } from "./types/sow";

/**
 * Interface for pricing table rows in TipTap content
 */
interface PricingTableRow {
  role?: string;
  description?: string;
  hours?: number;
  rate?: number;
}

/**
 * Interface for TipTap nodes in the document structure
 */
interface TipTapNode {
  type: string;
  attrs?: {
    rows?: PricingTableRow[];
  };
  content?: TipTapNode[];
}

/**
 * Interface for TipTap document content
 */
interface TipTapContent {
  type: string;
  content?: TipTapNode[];
}

/**
 * Parses the SOW's TipTap JSON content to calculate the total investment value.
 * 
 * This function robustly sums the `hours * rate` for each line item in the first
 * pricing table found, ignoring any unreliable "Total" rows. This eliminates the
 * need for manual financial migrations by automatically calculating and storing
 * the financial data on every SOW update.
 *
 * Algorithm:
 * 1. Parse the JSON content
 * 2. Find the first editablePricingTable node
 * 3. For each row in the table:
 *    - Skip rows where role contains "total" (case-insensitive)
 *    - Skip rows where rate <= 0 (invalid pricing)
 *    - Sum: hours * rate for all valid line items
 * 4. Return the calculated sum, or 0 if no table found or error occurs
 *
 * @param contentJSON - The SOW content, expected as a JSON string
 * @returns The calculated total investment as a number (in the SOW's currency, typically AUD)
 *          Returns 0 if no pricing table is found, content is invalid, or on any error
 * 
 * @example
 * const totalInvestment = calculateTotalInvestment(sowContent);
 * // Returns 22000 (2.5 days × 40 hrs/day × $220/hr)
 */
export function calculateTotalInvestment(contentJSON: string | any): number {
  // Guard: empty or null content
  if (!contentJSON) {
    return 0;
  }

  try {
    // Handle both JSON string and object inputs
    const content: TipTapContent = typeof contentJSON === 'string' 
      ? JSON.parse(contentJSON) 
      : contentJSON;
    let totalInvestment = 0;

    // Guard: no content array
    if (!content.content || !Array.isArray(content.content)) {
      return 0;
    }

    // Iterate through top-level nodes to find the first pricing table
    for (const node of content.content) {
      // Check if this is a pricing table node
      if (node.type === 'editablePricingTable' && node.attrs?.rows) {
        const rows = node.attrs.rows;

        // Guard: rows is not an array
        if (!Array.isArray(rows)) {
          return 0;
        }

        // Sum the cost for each line item, excluding total rows
        for (const row of rows) {
          // Extract values with defaults to prevent NaN
          const hours = Number(row.hours) || 0;
          const rate = Number(row.rate) || 0;
          const role = String(row.role || '').toLowerCase();

          // Validation: Skip rows that don't represent actual billable line items
          // - rate must be > 0 (pricing must be valid)
          // - role must not contain "total" (skip the total row itself)
          if (rate > 0 && !role.includes('total')) {
            totalInvestment += hours * rate;
          }
        }

        // Once we've processed the first pricing table, we stop
        // (SOWs typically only have one pricing table at the top level)
        return totalInvestment;
      }
    }

    // No pricing table found in the document
    return 0;
  } catch (error) {
    // Log parsing errors for debugging without crashing
    console.error('[SOW Financial Calculation] Failed to parse SOW content:', {
      error: error instanceof Error ? error.message : String(error),
      contentLength: contentJSON?.length || 0
    });
    return 0; // Return 0 on any parsing error (safe default)
  }
}

/**
 * CRITICAL ENFORCEMENT: Ensures mandatory "Tech - Head Of - Senior Project Management" role exists in pricing table.
 * 
 * This function programmatically enforces Sam Gossage's requirement that EVERY SOW must include
 * the Head Of role in the pricing table. If the role is missing, it is automatically inserted
 * as the FIRST row in the table.
 * 
 * @param contentJSON - The SOW content (either JSON string or TipTap object)
 * @returns Modified content with Head Of role guaranteed to be present
 */
export function enforceHeadOfRole(contentJSON: string | any): any {
  // Deprecated: Server-side role enforcement removed in favor of deterministic frontend calculation.
  // Preserve signature and behavior as a no-op for backward compatibility.
  return contentJSON;
}

export function formatInvestment(value: number) {
  const safe = Number(value) || 0;
  return safe.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

export function cleanSOWContent(content: string) {
  // Remove <think>...</think> tags and their content (AI's internal reasoning)
  // This prevents the AI's planning notes from appearing in client-facing SOWs
  let cleaned = content
    // Remove <AI_THINK> tags
    .replace(/<AI_THINK>[\s\S]*?<\/AI_THINK>/gi, '')
    // Remove <thinking> tags (additional variant)
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    // Remove <think> tags
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    // Remove any orphaned think tags
    .replace(/<\/?think>/gi, '')
    // Remove <tool_call> tags
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
    // Remove HTML comments
    .replace(/<!-- .*? -->/gi, '')
    // Clean up extra whitespace that might be left behind
    .replace(/\n\n\n+/g, '\n\n')
    .trim();
  
  return cleaned;
}

// Transform MultiScopeData to PDFExportData format
export function transformScopesToPDFFormat(
  multiScopeData: MultiScopeData,
  currentDocOrTitle: any = "Statement of Work",
  userPromptDiscount?: number,
  showPricingSummary?: boolean,
): PDFExportData {
  const scopes = multiScopeData.scopes.map((scope, index) => {
    const items = scope.role_allocation.map((role) => {
      // 🎯 CRITICAL FIX: Validate and prevent negative values
      const hours = Math.max(0, Number(role.hours) || 0);
      const rate = Math.max(0, Number(role.rate) || 0);
      const calculatedCost = hours * rate;
      const cost = Math.max(0, Number(role.cost) || calculatedCost);
      
      return {
        description: role.description || "",
        role: role.role || "",
        hours,
        rate,
        cost,
      };
    });

    const total = Math.max(0, items.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0
    ));

    return {
      id: `scope-${index + 1}`,
      title: scope.scope_name,
      description: scope.scope_description,
      items,
      deliverables: scope.deliverables,
      assumptions: scope.assumptions,
      total,
    };
  });

  const title = typeof currentDocOrTitle === "string" ? currentDocOrTitle : currentDocOrTitle?.title || "Statement of Work";
  const clientName = typeof currentDocOrTitle === "object" ? currentDocOrTitle?.clientName || "" : "";
  const effectiveDiscount = typeof userPromptDiscount === "number" && userPromptDiscount > 0 ? userPromptDiscount : multiScopeData.discount;

  return {
    title,
    scopes,
    discount: effectiveDiscount,
    clientName,
    company: {
      name: "Social Garden",
    },
    projectSubtitle: "",
    projectOverview: "",
    budgetNotes: "",
    currency: "AUD",
    gstApplicable: true,
    generatedDate: new Date().toISOString(),
    authoritativeTotal: 0,
    showPricingSummary: showPricingSummary !== undefined ? showPricingSummary : true, // Default to true for backward compatibility
  };
}
