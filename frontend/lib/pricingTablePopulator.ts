/**
 * Pricing Table Population Utilities
 *
 * Converts AI-generated JSON responses into pricing table row objects.
 * Handles both single-scope (v3.1) and multi-scope (v4.1) formats.
 * Provides role validation, visual indicators for mismatches, and calculations.
 */

import { ROLES } from "./rateCard";

export interface PricingRow {
  id: string;
  role: string;
  description: string;
  hours: number;
  rate: number;
  cost?: number;
  scopeName?: string; // For multi-scope support
  isUnknownRole?: boolean; // Visual indicator for mismatched roles
  isHeader?: boolean; // For scope header rows
}

export interface ScopeItem {
  scope_name?: string;
  scope_description?: string;
  deliverables?: string[];
  assumptions?: string[];
  roles: Array<{
    role: string;
    hours: number;
    rate?: number;
    cost?: number;
  }>;
}

export interface PricingTablePopulationResult {
  rows: PricingRow[];
  errors: string[];
  format: "v3.1" | "v4.1" | "unknown";
  totalScopes: number;
  totalRoles: number;
  roleMatchPercentage: number;
}

/**
 * Find exact match for role name in official rate card
 * Case-sensitive, complete word matching
 *
 * @param roleNameFromAI - Role name from AI response
 * @returns Object with { found: boolean, rate: number | null, exactMatch: boolean }
 */
export function findRoleInRateCard(
  roleNameFromAI: string,
): {
  found: boolean;
  rate: number | null;
  exactMatch: boolean;
} {
  if (!roleNameFromAI || typeof roleNameFromAI !== "string") {
    return { found: false, rate: null, exactMatch: false };
  }

  const trimmed = roleNameFromAI.trim();

  // Try exact match first
  const exactMatch = ROLES.find((r) => r.name === trimmed);
  if (exactMatch) {
    return { found: true, rate: exactMatch.rate, exactMatch: true };
  }

  // No partial matching - be strict about role names
  return { found: false, rate: null, exactMatch: false };
}

/**
 * Convert AI JSON response to pricing table rows
 * Handles both single-scope and multi-scope formats
 * Creates visual indicators for mismatched roles
 *
 * @param aiJsonData - Parsed JSON from AI response
 * @param discount - Discount percentage (0-100)
 * @returns PricingTablePopulationResult with rows and metadata
 */
export function convertAIResponseToPricingRows(
  aiJsonData: Record<string, any>,
  discount: number = 0,
): PricingTablePopulationResult {
  const rows: PricingRow[] = [];
  const errors: string[] = [];
  let format: "v3.1" | "v4.1" | "unknown" = "unknown";
  let totalScopes = 0;
  let totalRoles = 0;
  let matchedRoles = 0;

  if (!aiJsonData || typeof aiJsonData !== "object") {
    errors.push("AI JSON data must be an object");
    return { rows, errors, format, totalScopes, totalRoles, roleMatchPercentage: 0 };
  }

  // Detect format: scopeItems (v4.1 multi-scope) vs direct roles
  const scopes: ScopeItem[] = [];

  if (Array.isArray(aiJsonData.scopeItems)) {
    // v4.1 Multi-scope format
    format = "v4.1";
    scopes.push(...aiJsonData.scopeItems);
  } else if (Array.isArray(aiJsonData.roles)) {
    // v3.1 Single-scope format (legacy) - roles directly in object
    format = "v3.1";
    scopes.push({
      scope_name: "Default Scope",
      roles: aiJsonData.roles,
    });
  } else if (Array.isArray(aiJsonData.suggestedRoles)) {
    // Alternative format
    format = "v3.1";
    scopes.push({
      scope_name: "Default Scope",
      roles: aiJsonData.suggestedRoles,
    });
  } else {
    errors.push(
      "No roles or scopeItems found in AI response. Expected format: { scopeItems: [...] } or { roles: [...] }",
    );
    return { rows, errors, format, totalScopes, totalRoles, roleMatchPercentage: 0 };
  }

  totalScopes = scopes.length;

  // Process each scope
  for (const scope of scopes) {
    // Add scope header row (non-editable) if this is multi-scope
    if (scopes.length > 1 && scope.scope_name) {
      rows.push({
        id: `scope-header-${Date.now()}-${Math.random()}`,
        role: `📍 Scope: ${scope.scope_name}`,
        description: scope.scope_description || "",
        hours: 0,
        rate: 0,
        scopeName: scope.scope_name,
        isUnknownRole: true, // Mark as non-editable/header
        isHeader: true,
      });
    }

    // Process roles in this scope
    if (Array.isArray(scope.roles)) {
      for (const roleData of scope.roles) {
        if (!roleData || typeof roleData !== "object") {
          errors.push("Invalid role object in scope");
          continue;
        }

        totalRoles++;

        const roleMatch = findRoleInRateCard(roleData.role);

        if (!roleMatch.found) {
          errors.push(
            `Role mismatch: "${roleData.role}" not found in official rate card (${ROLES.length} available roles)`,
          );
        } else {
          matchedRoles++;
        }

        const hours = Number(roleData.hours) || 0;
        const rate =
          Number(roleData.rate) || roleMatch.rate || 0;
        const cost = hours * rate;

        const row: PricingRow = {
          id: `row-${Date.now()}-${Math.random()}`,
          role: roleData.role,
          description: roleData.description || "",
          hours,
          rate,
          cost,
          scopeName: scope.scope_name,
          isUnknownRole: !roleMatch.found,
          isHeader: false,
        };

        rows.push(row);
      }
    } else if (scope.roles !== undefined) {
      errors.push("Scope roles must be an array");
    }
  }

  const roleMatchPercentage =
    totalRoles > 0 ? Math.round((matchedRoles / totalRoles) * 100) : 0;

  return {
    rows,
    errors,
    format,
    totalScopes,
    totalRoles,
    roleMatchPercentage,
  };
}

/**
 * Calculate totals and subtotals from pricing rows
 *
 * @param rows - Array of pricing rows
 * @param discount - Discount percentage (0-100)
 * @param gstRate - GST/tax rate percentage (default 10 for Australia)
 * @returns Object with calculated totals
 */
export function calculatePricingTotals(
  rows: PricingRow[],
  discount: number = 0,
  gstRate: number = 10,
): {
  subtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  gstAmount: number;
  total: number;
} {
  // Filter out header rows (scope headers)
  const dataRows = rows.filter((r) => !r.isHeader && r.hours > 0);

  const subtotal = dataRows.reduce((sum, row) => sum + (row.cost || 0), 0);
  const discountAmount = (subtotal * Math.max(0, Math.min(100, discount))) / 100;
  const discountedSubtotal = subtotal - discountAmount;
  const gstAmount = (discountedSubtotal * gstRate) / 100;
  const total = discountedSubtotal + gstAmount;

  return {
    subtotal,
    discountAmount,
    discountedSubtotal,
    gstAmount,
    total,
  };
}

/**
 * Get all available role names from the rate card
 *
 * @returns Array of role names
 */
export function getAvailableRoleNames(): string[] {
  return ROLES.map((r) => r.name);
}

/**
 * Find closest role name match (for fuzzy matching suggestions)
 * Uses Levenshtein distance to find similar role names
 *
 * @param partialRoleName - Partial or misspelled role name
 * @param maxDistance - Maximum Levenshtein distance to consider a match
 * @returns Suggested role name or null
 */
export function findClosestRoleMatch(
  partialRoleName: string,
  maxDistance: number = 2,
): string | null {
  if (!partialRoleName || typeof partialRoleName !== "string") {
    return null;
  }

  const input = partialRoleName.toLowerCase().trim();
  let bestMatch: string | null = null;
  let bestDistance = maxDistance;

  for (const role of ROLES) {
    const distance = levenshteinDistance(input, role.name.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = role.name;
    }
  }

  return bestMatch;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy role name matching
 *
 * @param a - First string
 * @param b - Second string
 * @returns Distance (lower = more similar)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Generate CSV export of pricing rows
 *
 * @param rows - Pricing rows to export
 * @param includeHeaders - Include column headers
 * @returns CSV string
 */
export function exportPricingRowsToCSV(
  rows: PricingRow[],
  includeHeaders: boolean = true,
): string {
  const lines: string[] = [];

  if (includeHeaders) {
    lines.push(
      ["Role", "Hours", "Rate (AUD)", "Cost (AUD)", "Scope", "Status"].join(
        ",",
      ),
    );
  }

  for (const row of rows) {
    const status = row.isHeader
      ? "HEADER"
      : row.isUnknownRole
        ? "⚠️ UNKNOWN"
        : "✓ VALID";

    lines.push(
      [
        `"${row.role.replace(/"/g, '""')}"`,
        row.hours,
        row.rate,
        row.cost || 0,
        `"${(row.scopeName || "").replace(/"/g, '""')}"`,
        status,
      ].join(","),
    );
  }

  return lines.join("\n");
}

/**
 * Create summary report of pricing population
 *
 * @param result - Result from convertAIResponseToPricingRows
 * @returns Formatted summary string for logging/display
 */
export function createPopulationSummary(
  result: PricingTablePopulationResult,
): string {
  const lines = [
    "📊 PRICING TABLE POPULATION SUMMARY",
    "━".repeat(50),
    `Format: ${result.format}`,
    `Total Scopes: ${result.totalScopes}`,
    `Total Roles: ${result.totalRoles}`,
    `Role Match Rate: ${result.roleMatchPercentage}%`,
    `Warnings/Errors: ${result.errors.length}`,
  ];

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("⚠️ Issues Found:");
    for (const error of result.errors.slice(0, 5)) {
      lines.push(`  • ${error}`);
    }
    if (result.errors.length > 5) {
      lines.push(`  ... and ${result.errors.length - 5} more`);
    }
  }

  lines.push("━".repeat(50));

  return lines.join("\n");
}
