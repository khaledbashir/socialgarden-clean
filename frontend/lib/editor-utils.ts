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

// Enhanced markdown -> Novel JSON serializer that preserves narrative and pricing tables
export function convertMarkdownToNovelJSON(
  markdown: string,
  suggestedRoles: any[] = [],
  options: ConvertOptions = {},
): any {
  if (!markdown) return { type: "doc", content: [] };

  const content: any[] = [];

  // Step 1: Extract JSON code blocks (```json ... ```) and convert to pricing tables
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/gi;
  const jsonMatches: Array<{ match: string; json: any; index: number }> = [];
  let match;
  let lastIndex = 0;

  while ((match = jsonBlockRegex.exec(markdown)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      jsonMatches.push({
        match: match[0],
        json: jsonData,
        index: match.index,
      });
    } catch (e) {
      console.warn("⚠️ [Editor Utils] Failed to parse JSON block:", e);
    }
  }

  // Step 2: Process markdown in segments, inserting pricing tables where JSON blocks were found
  jsonMatches.forEach((jsonMatch, idx) => {
    // Add narrative text before this JSON block (includes pipe tables)
    const textBefore = markdown.substring(lastIndex, jsonMatch.index).trim();
    if (textBefore) {
      const narrativeContent = parseMarkdownToNodes(textBefore, true); // true = parse tables
      content.push(...narrativeContent);
    }

    // Convert JSON to pricing table
    const pricingTable = convertJSONToPricingTable(jsonMatch.json);
    if (pricingTable) {
      content.push(pricingTable);
    }

    lastIndex = jsonMatch.index + jsonMatch.match.length;
  });

  // Step 3: Add remaining narrative text after the last JSON block (includes pipe tables)
  const textAfter = markdown.substring(lastIndex).trim();
  if (textAfter) {
    const narrativeContent = parseMarkdownToNodes(textAfter, true); // true = parse tables
    content.push(...narrativeContent);
  }

  // Step 4: If no JSON blocks found, parse entire markdown as narrative (with tables)
  if (content.length === 0) {
    const narrativeContent = parseMarkdownToNodes(markdown, true); // true = parse tables
    content.push(...narrativeContent);
  }

  return { type: "doc", content };
}

// Helper: Parse markdown text to TipTap nodes (headings, paragraphs, lists, tables, etc.)
function parseMarkdownToNodes(markdown: string, parseTables: boolean = false): any[] {
  const nodes: any[] = [];
  const lines = markdown.split("\n");
  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ").trim();
      if (text) {
        nodes.push({
          type: "paragraph",
          content: parseInlineFormatting(text),
        });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      const listContent = listItems.map((item) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: parseInlineFormatting(item.replace(/^[-*+]\s+/, "").trim()),
          },
        ],
      }));
      nodes.push({
        type: "bulletList",
        content: listContent,
      });
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Headings
    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      nodes.push({
        type: "heading",
        attrs: { level: 1 },
        content: parseInlineFormatting(line.substring(2).trim()),
      });
    } else if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      nodes.push({
        type: "heading",
        attrs: { level: 2 },
        content: parseInlineFormatting(line.substring(3).trim()),
      });
    } else if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      nodes.push({
        type: "heading",
        attrs: { level: 3 },
        content: parseInlineFormatting(line.substring(4).trim()),
      });
    }
    // Pipe tables (if parseTables is enabled)
    else if (parseTables && line.startsWith("|") && line.endsWith("|")) {
      flushParagraph();
      flushList();
      
      // Collect all table lines
      const headerLine = line;
      let j = i + 1;
      const dataLines: string[] = [];
      
      // Skip separator line (|---|---|) if present
      if (j < lines.length && /^\|\s*[-:|\s]+\s*\|/.test(lines[j].trim())) {
        j++;
      }
      
      // Collect data rows
      while (j < lines.length && lines[j].trim().startsWith("|") && lines[j].trim().endsWith("|")) {
        dataLines.push(lines[j].trim());
        j++;
      }
      
      // Parse table (need at least header + 1 data row)
      if (dataLines.length > 0) {
        const tableNode = parsePipeTable(headerLine, dataLines);
        if (tableNode) {
          nodes.push(tableNode);
        }
        i = j - 1; // Skip processed lines
      } else {
        // Single line (no data rows), treat as regular text
        flushList();
        currentParagraph.push(line);
      }
    }
    // List items
    else if (/^[-*+]\s+/.test(line)) {
      flushParagraph();
      if (!inList) inList = true;
      listItems.push(line);
    }
    // Empty line
    else if (!line) {
      flushParagraph();
      flushList();
    }
    // Regular paragraph text
    else {
      flushList();
      currentParagraph.push(line);
    }
  }

  flushParagraph();
  flushList();

  // If no structured content was found, create a single paragraph
  if (nodes.length === 0 && markdown.trim()) {
    nodes.push({
      type: "paragraph",
      content: parseInlineFormatting(markdown.trim()),
    });
  }

  return nodes;
}

// Helper: Parse inline formatting (bold, italic, etc.)
function parseInlineFormatting(text: string): any[] {
  const parts: any[] = [];
  let currentText = "";
  let i = 0;

  while (i < text.length) {
    // Bold (**text**)
    if (text.substring(i, i + 2) === "**") {
      if (currentText) {
        parts.push({ type: "text", text: currentText });
        currentText = "";
      }
      const endBold = text.indexOf("**", i + 2);
      if (endBold !== -1) {
        const boldText = text.substring(i + 2, endBold);
        parts.push({
          type: "text",
          text: boldText,
          marks: [{ type: "bold" }],
        });
        i = endBold + 2;
      } else {
        currentText += "**";
        i += 2;
      }
    }
    // Regular text
    else {
      currentText += text[i];
      i++;
    }
  }

  if (currentText) {
    parts.push({ type: "text", text: currentText });
  }

  return parts.length > 0 ? parts : [{ type: "text", text }];
}

// Helper: Convert JSON pricing data to editablePricingTable node
function convertJSONToPricingTable(jsonData: any): any | null {
  if (!jsonData || typeof jsonData !== "object") return null;

  // Handle root-level array of roles (e.g. [{"role": "...", ...}, ...])
  if (Array.isArray(jsonData)) {
    const rows = jsonData.map((role: any) => ({
      role: role.role || role.name || "",
      hours: role.hours || null,
      rate: role.rate || null,
      total: role.total || null,
    }));
    return {
      type: "editablePricingTable",
      attrs: {
        rows,
        discount: 0,
      },
    };
  }

  // Handle V4.1 JSON format with scopes
  if (jsonData.scopes && Array.isArray(jsonData.scopes)) {
    // Multi-scope: combine all scopes into one table
    const allRows: any[] = [];
    jsonData.scopes.forEach((scope: any, scopeIdx: number) => {
      if (scopeIdx > 0) {
        // Add separator row between scopes
        allRows.push({
          role: "---",
          hours: null,
          rate: null,
          total: null,
        });
      }
      if (scope.roles && Array.isArray(scope.roles)) {
        scope.roles.forEach((role: any) => {
          allRows.push({
            role: role.role || role.name || "",
            hours: role.hours || null,
            rate: role.rate || null,
            total: role.total || null,
          });
        });
      }
    });
    return {
      type: "editablePricingTable",
      attrs: {
        rows: allRows,
        discount: jsonData.discount || 0,
      },
    };
  }

  // Handle simple roles array
  if (jsonData.roles && Array.isArray(jsonData.roles)) {
    const rows = jsonData.roles.map((role: any) => ({
      role: role.role || role.name || "",
      hours: role.hours || null,
      rate: role.rate || null,
      total: role.total || null,
    }));
    return {
      type: "editablePricingTable",
      attrs: {
        rows,
        discount: jsonData.discount || 0,
      },
    };
  }

  // Handle Social Media Retainer style schema with scope_items
  if (jsonData.scope_items && Array.isArray(jsonData.scope_items)) {
    const rows = jsonData.scope_items.map((item: any) => ({
      role: item.role_name || item.role || "",
      hours: item.hours_assigned ?? item.hours ?? null,
      rate: item.role_rate_per_hour ?? item.rate ?? null,
      total:
        item.role_total ??
        (item.hours_assigned != null && item.role_rate_per_hour != null
          ? Number(item.hours_assigned) * Number(item.role_rate_per_hour)
          : null),
    }));
    return {
      type: "editablePricingTable",
      attrs: {
        rows,
        discount: jsonData.discount_percent || jsonData.discount || 0,
        scopeName:
          jsonData.project_name || jsonData.phase_name || "Project Pricing",
        scopeDescription:
          jsonData.project_type || (jsonData.currency ? `Currency: ${jsonData.currency}` : ""),
      },
    };
  }

  return null;
}

// Helper: Parse pipe table to editablePricingTable node (interactive pricing table)
function parsePipeTable(headerLine: string, dataLines: string[]): any | null {
  if (dataLines.length === 0) return null;

  // Parse header to find column indices
  const headerCells = headerLine
    .split("|")
    .map((c) => c.trim())
    .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1); // Remove empty first/last

  // Find column indices (case-insensitive)
  const findColumnIndex = (searchTerms: string[]): number => {
    for (let i = 0; i < headerCells.length; i++) {
      const cell = headerCells[i].toLowerCase();
      if (searchTerms.some(term => cell.includes(term.toLowerCase()))) {
        return i;
      }
    }
    return -1;
  };

  // More flexible column detection - try multiple terms
  const roleIndex = findColumnIndex(["role", "name", "item", "description", "deliverable", "phase", "service"]);
  const descriptionIndex = findColumnIndex(["description", "details", "notes"]) !== roleIndex 
    ? findColumnIndex(["description", "details", "notes"]) 
    : -1;
  const hoursIndex = findColumnIndex(["hours", "hour", "hrs", "h"]);
  const rateIndex = findColumnIndex(["rate", "investment", "cost", "aud", "price", "amount", "$"]);
  const totalIndex = findColumnIndex(["total", "subtotal", "investment", "cost", "amount"]);

  // Helper to extract number from cell (handles "$1,234.56 +GST" format)
  const extractNumber = (cell: string): number | null => {
    if (!cell) return null;
    // Remove currency symbols, commas, and text like "+GST"
    const cleaned = cell.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  // Parse data rows into pricing table format
  const rows = dataLines.map((row, rowIdx) => {
    const cells = row
      .split("|")
      .map((c) => c.trim())
      .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1); // Remove empty first/last

    // Extract role - use first column if no role column found
    const role = roleIndex >= 0 && roleIndex < cells.length 
      ? cells[roleIndex] 
      : cells[0] || "";
    
    // Extract description - use second column if available and not used for role
    const description = descriptionIndex >= 0 && descriptionIndex < cells.length && descriptionIndex !== roleIndex
      ? cells[descriptionIndex]
      : (roleIndex === 0 && cells.length > 1 ? cells[1] : "") || "";

    // Extract hours - try to find numeric value in hours column or any column
    let hours = null;
    if (hoursIndex >= 0 && hoursIndex < cells.length) {
      hours = extractNumber(cells[hoursIndex]);
    } else {
      // Try to find hours in any column (look for numbers that could be hours)
      for (let i = 0; i < cells.length; i++) {
        if (i !== roleIndex && i !== descriptionIndex) {
          const num = extractNumber(cells[i]);
          if (num !== null && num > 0 && num < 1000) { // Reasonable hours range
            hours = num;
            break;
          }
        }
      }
    }

    // Extract rate - try to find currency value
    let rate = null;
    if (rateIndex >= 0 && rateIndex < cells.length) {
      rate = extractNumber(cells[rateIndex]);
    } else {
      // Try to find rate in any column (look for currency values)
      for (let i = 0; i < cells.length; i++) {
        if (i !== roleIndex && i !== descriptionIndex && i !== hoursIndex) {
          const num = extractNumber(cells[i]);
          if (num !== null && num >= 50 && num < 10000) { // Reasonable rate range
            rate = num;
            break;
          }
        }
      }
    }

    // Try to get total from totalIndex, or calculate from hours * rate, or use last numeric column
    let total = null;
    if (totalIndex >= 0 && totalIndex < cells.length) {
      total = extractNumber(cells[totalIndex]);
    }
    if (!total && hours !== null && rate !== null) {
      total = hours * rate;
    } else if (!total) {
      // Try last column as total if it looks like a currency value
      const lastCell = cells[cells.length - 1];
      if (lastCell && (lastCell.includes("$") || lastCell.includes("GST") || lastCell.match(/\d/))) {
        total = extractNumber(lastCell);
      }
    }

    return {
      id: `row-${rowIdx}-${Date.now()}`,
      role: role || "",
      description: description || "",
      hours: hours,
      rate: rate,
      total: total,
    };
  });

  // Filter out empty rows and separator rows
  let validRows = rows.filter(row => {
    const role = (row.role || "").trim();
    return role && role !== "---" && !role.match(/^[-|]+$/);
  });

  // If no valid rows after filtering, but we have data rows, create rows from raw cells
  if (validRows.length === 0 && dataLines.length > 0) {
    // Fallback: create rows from raw table data
    validRows = dataLines.map((row, rowIdx) => {
      const cells = row
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      return {
        id: `row-${rowIdx}-${Date.now()}`,
        role: cells[0] || "",
        description: cells.length > 1 ? cells[1] : "",
        hours: cells.length > 2 ? extractNumber(cells[2]) : null,
        rate: cells.length > 3 ? extractNumber(cells[3]) : null,
        total: cells.length > 4 ? extractNumber(cells[4]) : (cells.length > 3 ? extractNumber(cells[3]) : null),
      };
    }).filter(row => (row.role || "").trim() && row.role !== "---");
  }

  if (validRows.length === 0) return null;

  return {
    type: "editablePricingTable",
    attrs: {
      rows: validRows,
      discount: 0, // Default discount, can be extracted from context if needed
    },
  };
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

// Convert the Novel editor JSON (simplified) to HTML for PDF/preview
export function convertNovelToHTML(content: any): string {
  if (!content) return "";
  const flatten = (node: any): string => {
    if (!node) return "";
    if (node.type === "text") return node.text || "";
    if (Array.isArray(node.content)) return node.content.map(flatten).join("");
    if (node.type === "paragraph" && node.content) return node.content.map(flatten).join("") + "\n\n";
    if (node.type === "editablePricingTable" && node.attrs?.rows) {
      // Minimal table conversion
      const rows = node.attrs.rows;
      const th = "<tr>" + rows.map((r:any)=>`<td>${r.role}</td><td>${r.hours}</td><td>${r.rate}</td>`).join("") + "</tr>";
      return `<table>${th}</table>`;
    }
    return "";
  };
  if (Array.isArray(content.content)) return content.content.map(flatten).join("");
  return flatten(content);
}
