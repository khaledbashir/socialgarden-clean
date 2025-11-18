/**
 * Simplified editor utils used for conversions and helpers.
 * This minimal implementation is intended to be stable and type-safe
 * while the larger feature conversions are re-implemented separately.
 */
import { MultiScopeData } from "./types/sow";
import { ROLES } from "./rateCard";

export interface ConvertOptions {
  strictRoles?: boolean;
  jsonDiscount?: number;
  tablesRoles?: any[];
  tablesDiscounts?: any[];
  multiScopePricingData?: MultiScopeData | null;
}

// Basic markdown -> Novel JSON serializer (very small subset)
export function convertMarkdownToNovelJSON(
  markdown: string,
  suggestedRoles: any[] = [],
  options: ConvertOptions = {},
): any {
  if (!markdown) return { type: "doc", content: [] };

  // If a simple pipe table appears, convert to an editablePricingTable node
  const lines = markdown.split("\n");
  const content: any[] = [];

  // Detect simple pipe tables
  const tableStart = lines.findIndex((l) => l.trim().startsWith("|"));
  if (tableStart !== -1) {
    // Basic parse of table rows (limited support)
    const tableLines = lines.slice(tableStart).filter((l) => l.trim().startsWith("|"));
    const rows = tableLines.map((row) => {
      const cells = row
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      const role = cells[0] || "";
      const hours = Number(cells[1] || 0);
      const rate = Number(cells[2] || 0);
      return {
        role,
        hours,
        rate,
        total: hours * rate,
      };
    });
    content.push({ type: "editablePricingTable", attrs: { rows } });
    return { type: "doc", content };
  }

  // Fallback: simple paragraph
  content.push({ type: "paragraph", content: [{ type: "text", text: markdown }] });
  return { type: "doc", content };
}

// Parse budget from simple markdown
export const parseBudgetFromMarkdown = (text: string): number | null => {
  if (!text) return null;
  const patterns = [
    /budget[:\s]*\$?([0-9,]+(?:\.[0-9]{2})?)/i,
    /investment[:\s]*\$?([0-9,]+)/i,
    /total[:\s]*\$?([0-9,]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const val = parseFloat(m[1].replace(/,/g, ""));
      if (!isNaN(val)) return val;
    }
  }
  return null;
};

// Exported helper to insert pricing tables into editor content
export function insertPricingTable(content: any[], rolesData: any[], discount: number = 0) {
  if (!Array.isArray(rolesData) || rolesData.length === 0) return;
  const rows = rolesData.map((r: any) => ({
    role: r.role,
    hours: r.hours || 0,
    rate: r.rate || 0,
    total: (r.hours || 0) * (r.rate || 0),
  }));
  content.push({ type: "editablePricingTable", attrs: { rows, discount } });
}

export default convertMarkdownToNovelJSON;
