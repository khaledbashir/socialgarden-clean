// Export utilities for SOW documents
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
// NOTE: Removed heavy TipTap runtime imports (StarterKit, extensions) to avoid
// bundling mismatched @tiptap/* versions during Next.js build. We implement a
// minimal serializer for TipTap JSON here instead of relying on
// `@tiptap/starter-kit`/`@tiptap/html`.

export interface PricingRow {
  role: string;
  hours: number;
  rate: number;
  total: number;
}

// Architect structured SOW JSON (subset used for role derivation)
export interface ArchitectSOW {
  scopeItems: Array<{
    title?: string;
    description?: string;
    roles?: Array<{ role: string; hours: number; rate?: number; cost?: number }>;
  }>;
  project_details?: {
    discount_percentage?: number;
  };
  [key: string]: any;
}

export interface SOWData {
  title: string;
  client?: string;
  overview?: string;
  deliverables?: string[];
  pricingRows: PricingRow[];
  discount?: { type: 'percentage' | 'fixed'; value: number };
  showGST?: boolean;
  assumptions?: string[];
  timeline?: string;
}

/**
 * Extract pricing data from Novel editor content
 */
export function extractPricingFromContent(content: any): PricingRow[] {
  const rows: PricingRow[] = [];
  if (!content || !content.content) return rows;

  const readText = (node: any): string => {
    if (!node) return '';
    if (node.type === 'text' && node.text) return node.text;
    const kids = Array.isArray(node.content) ? node.content : [];
    return kids.map(readText).join('');
  };

  const walk = (nodes: any[]): void => {
    for (const node of nodes) {
      // Custom editable pricing table (authoritative)
      if (node?.type === 'editablePricingTable' && Array.isArray(node?.attrs?.rows)) {
        for (const r of node.attrs.rows) {
          const role = String(r?.role || '').trim();
          const hours = Number(r?.hours) || 0;
          const rate = Number(r?.rate) || 0;
          if (!role || /total/i.test(role)) continue;
          const total = (Number(r?.total) || (hours * rate)) || 0;
          if (hours > 0 && rate > 0) rows.push({ role, hours, rate, total });
        }
      }

      // Generic table fallback (header + data rows)
      if (node?.type === 'table' && Array.isArray(node.content)) {
        const dataRows = node.content.slice(1);
        for (const row of dataRows) {
          if (row?.type !== 'tableRow' || !Array.isArray(row.content)) continue;
          const cells = row.content;
          const role = readText(cells[0] || {}).trim();
          const hours = parseFloat((readText(cells[1] || {}) || '0').replace(/[^\d.]/g, '')) || 0;
          const rate = parseFloat((readText(cells[2] || {}) || '0').replace(/[^\d.]/g, '')) || 0;
          let total = parseFloat((readText(cells[3] || {}) || '0').replace(/[^\d.]/g, '')) || 0;
          if (!total && hours && rate) total = hours * rate;
          if (role && !/total|role/i.test(role) && hours > 0 && rate > 0) {
            rows.push({ role, hours, rate, total });
          }
        }
      }

      if (Array.isArray(node?.content)) walk(node.content);
    }
  };

  walk(content.content);
  return rows;
}

/**
 * Calculate totals with optional discount
 */
export function calculateTotals(rows: PricingRow[], discount?: { type: 'percentage' | 'fixed'; value: number }) {
  const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
  const totalHours = rows.reduce((sum, row) => sum + row.hours, 0);
  
  let discountAmount = 0;
  if (discount) {
    if (discount.type === 'percentage') {
      discountAmount = subtotal * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }
  }
  
  const grandTotal = subtotal - discountAmount;
  
  return {
    subtotal,
    totalHours,
    discountAmount,
    grandTotal,
    gstAmount: grandTotal * 0.1, // 10% GST
  };
}

/**
 * Export pricing table to CSV
 */
export function exportToCSV(sowData: SOWData, filename: string = 'sow-pricing.csv') {
  const { pricingRows, discount } = sowData;
  const totals = calculateTotals(pricingRows, discount);
  
  // Create data array for CSV
  const data: any[] = [
    ['Social Garden - Scope of Work Pricing'],
    [''],
    ['Role', 'Hours', 'Rate (AUD)', 'Total (AUD)'],
  ];
  
  pricingRows.forEach(row => {
    data.push([
      row.role,
      row.hours,
      `$${row.rate}`,
      `$${row.total.toFixed(2)} +GST`
    ]);
  });
  
  data.push(['']);
  data.push(['Total Hours', totals.totalHours, '', '']);
  data.push(['Sub-Total', '', '', `$${totals.subtotal.toFixed(2)} +GST`]);
  
  if (discount && totals.discountAmount > 0) {
    const discountLabel = discount.type === 'percentage' 
      ? `Discount (${discount.value}%)` 
      : 'Discount';
    data.push([discountLabel, '', '', `-$${totals.discountAmount.toFixed(2)}`]);
  }
  
  data.push(['Grand Total', '', '', `$${totals.grandTotal.toFixed(2)} +GST`]);
  data.push(['GST (10%)', '', '', `$${totals.gstAmount.toFixed(2)}`]);
  data.push(['Total Inc. GST', '', '', `$${(totals.grandTotal + totals.gstAmount).toFixed(2)}`]);
  
  // Convert to CSV string
  const csvContent = data.map(row => row.join(',')).join('\n');
  
  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Export pricing table to Excel
 */
export function exportToExcel(sowData: SOWData, filename: string = 'sow-pricing.xlsx') {
  const { pricingRows, discount, title } = sowData;
  const totals = calculateTotals(pricingRows, discount);
  
  // Create worksheet data
  const wsData: any[] = [
    ['Social Garden - Scope of Work'],
    [title || 'Statement of Work'],
    [''],
    ['Role', 'Hours', 'Rate (AUD)', 'Total (AUD)'],
  ];
  
  pricingRows.forEach(row => {
    wsData.push([
      row.role,
      row.hours,
      row.rate,
      row.total
    ]);
  });
  
  wsData.push(['']);
  wsData.push(['Total Hours', totals.totalHours, '', '']);
  wsData.push(['Sub-Total (excl. GST)', '', '', totals.subtotal]);
  
  if (discount && totals.discountAmount > 0) {
    const discountLabel = discount.type === 'percentage' 
      ? `Discount (${discount.value}%)` 
      : 'Discount';
    wsData.push([discountLabel, '', '', -totals.discountAmount]);
  }
  
  wsData.push(['Grand Total (excl. GST)', '', '', totals.grandTotal]);
  wsData.push(['GST (10%)', '', '', totals.gstAmount]);
  wsData.push(['Total Inc. GST', '', '', totals.grandTotal + totals.gstAmount]);
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 50 },  // Role
    { wch: 10 },  // Hours
    { wch: 15 },  // Rate
    { wch: 20 },  // Total
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'SOW Pricing');
  XLSX.writeFile(wb, filename);
}

/**
 * Generate PDF from HTML content
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string = 'sow-document.pdf',
  options?: {
    showLogo?: boolean;
    logoUrl?: string;
    title?: string;
  }
) {
  try {
    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;
    const width = pdfWidth - 20; // 10mm margins
    const height = width / ratio;
    
    // Add logo if provided
    if (options?.showLogo && options?.logoUrl) {
      try {
        pdf.addImage(options.logoUrl, 'PNG', 10, 10, 40, 15);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
    
    // Add title if provided
    if (options?.title) {
      pdf.setFontSize(16);
      pdf.setTextColor(44, 130, 61); // Social Garden green
      pdf.text(options.title, 10, options?.showLogo ? 35 : 20);
    }
    
    // Add content
    const yOffset = options?.title ? (options?.showLogo ? 45 : 30) : (options?.showLogo ? 30 : 10);
    let remainingHeight = height;
    let yPosition = yOffset;
    
    // Add pages as needed
    while (remainingHeight > 0) {
      pdf.addImage(
        imgData,
        'PNG',
        10,
        yPosition,
        width,
        Math.min(remainingHeight, pdfHeight - yPosition - 10)
      );
      
      remainingHeight -= (pdfHeight - yPosition - 10);
      
      if (remainingHeight > 0) {
        pdf.addPage();
        yPosition = 10;
      }
    }
    
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, showGST: boolean = true): string {
  const formatted = `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return showGST ? `${formatted} +GST` : formatted;
}

/**
 * Parse markdown SOW content and extract structured data
 */
// Legacy markdown parsing removed. SOW data should be extracted from TipTap JSON or Architect JSON.

/**
 * Clean SOW content by removing non-client-facing elements
 */
export function cleanSOWContent(content: string): string {
  // Remove any internal comments, thinking tags, etc.
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<!-- .*? -->/gi, '')
    .trim();
}

/**
 * Attempt to extract Architect structured JSON from a markdown/string blob.
 * Looks for JSON code fences first; returns object if it contains scopeItems[].
 */
const findJsonObjectContainingKey = (text: string, rawKey: string): string | null => {
  if (!text) return null;
  const normalizedKey = rawKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`"${normalizedKey}"`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const braceStart = (() => {
      for (let i = matchIndex; i >= 0; i--) {
        const char = text[i];
        if (char === '{') return i;
        if (char === '}') break;
      }
      return -1;
    })();
    if (braceStart === -1) continue;
    let depth = 0;
    let inString = false;
    let isEscaped = false;
    for (let cursor = braceStart; cursor < text.length; cursor++) {
      const char = text[cursor];
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char === '\\') {
        isEscaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
      }
      if (!inString) {
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) {
            return text.slice(braceStart, cursor + 1);
          }
        }
      }
    }
  }
  return null;
};

export function extractSOWStructuredJson(text: string): ArchitectSOW | null {
  if (!text) return null;
  // 1) Try language-tagged JSON blocks
  const jsonBlocks = [...text.matchAll(/```json\s*([\s\S]*?)\s*```/gi)];
  for (const m of jsonBlocks) {
    const body = m[1];
    try {
      const obj = JSON.parse(body);
      if (obj && Array.isArray(obj.scopeItems)) {
        return obj as ArchitectSOW;
      }
    } catch {}
  }
  // 2) Try generic code fences if they appear to include scopeItems
  const anyBlocks = [...text.matchAll(/```\s*([\s\S]*?)\s*```/g)];
  for (const m of anyBlocks) {
    const body = m[1];
    if (!/scopeItems\s*[:]/.test(body)) continue;
    try {
      const obj = JSON.parse(body);
      if (obj && Array.isArray(obj.scopeItems)) {
        return obj as ArchitectSOW;
      }
    } catch {}
  }
  // 3) Attempt to locate embedded JSON objects that contain scopeItems/scope_items
  const candidates = [
    findJsonObjectContainingKey(text, 'scopeItems'),
    findJsonObjectContainingKey(text, 'scope_items'),
  ].filter(Boolean) as string[];
  for (const snippet of candidates) {
    try {
      const raw = JSON.parse(snippet);
      if (!raw) continue;
      const normalized = raw as ArchitectSOW & { scope_items?: ArchitectSOW['scopeItems'] };
      const scopeItems = Array.isArray(normalized.scopeItems)
        ? normalized.scopeItems
        : Array.isArray(normalized.scope_items)
          ? normalized.scope_items
          : undefined;
      if (scopeItems) {
        return { ...normalized, scopeItems } as ArchitectSOW;
      }
    } catch {}
  }
  // 3) Nothing found
  return null;
}

/**
 * Derive flat role rows from Architect SOW structured JSON.
 * - Merges roles from all scopeItems
 * - Prefers explicit rate or cost fields when available
 */
export function rolesFromArchitectSOW(sow: ArchitectSOW): PricingRow[] {
  const out: PricingRow[] = [];
  if (!sow || !Array.isArray(sow.scopeItems)) return out;
  for (const item of sow.scopeItems) {
    const roles = Array.isArray(item?.roles) ? item.roles : [];
    for (const r of roles) {
      const role = String(r?.role || '').trim();
      const hours = Number(r?.hours) || 0;
      const rate = Number(r?.rate) || 0;
      const cost = Number(r?.cost) || (hours * rate) || 0;
      if (!role || hours <= 0) continue;
      out.push({ role, hours, rate, total: cost });
    }
  }
  return out;
}

/**
 * Extract pricing rows from an HTML string (client-side only). Looks for tables
 * with Role/Hours/Rate/Total columns and returns parsed rows.
 */
export function extractPricingFromHTML(html: string): PricingRow[] {
  try {
    if (typeof window === 'undefined') return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table')) as HTMLTableElement[];
    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.toLowerCase().trim() || '');
      let roleIdx = -1, hoursIdx = -1, rateIdx = -1, totalIdx = -1;
      if (headers.length) {
        roleIdx = headers.findIndex(h => /role/.test(h));
        hoursIdx = headers.findIndex(h => /hours?/.test(h));
        rateIdx = headers.findIndex(h => /rate/.test(h));
        totalIdx = headers.findIndex(h => /total/.test(h));
      }
      // Fallback: infer columns by numeric patterns when headers absent
      const bodyRows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
      if (bodyRows.length === 0) continue;
      if (roleIdx === -1 || hoursIdx === -1) {
        const sample = Array.from(bodyRows[0].querySelectorAll('td')) as HTMLTableCellElement[];
        // Assume: [role, hours, rate, total]
        if (sample.length >= 3) {
          roleIdx = 0;
          // find first numeric-like index for hours
          hoursIdx = sample.findIndex(td => /\d/.test(td.textContent || '')) || 1;
          rateIdx = hoursIdx + 1 < sample.length ? hoursIdx + 1 : -1;
          totalIdx = rateIdx + 1 < sample.length ? rateIdx + 1 : -1;
        }
      }
      if (roleIdx === -1 || hoursIdx === -1) continue;
      const out: PricingRow[] = [];
      for (const tr of bodyRows) {
        const cells = Array.from(tr.querySelectorAll('td')) as HTMLTableCellElement[];
        if (!cells.length) continue;
        const role = (cells[roleIdx]?.textContent || '').trim();
        if (!role || /total/i.test(role)) continue;
        const hours = parseFloat((cells[hoursIdx]?.textContent || '0').replace(/[^\d.]/g, '')) || 0;
        const rate = rateIdx >= 0 ? parseFloat((cells[rateIdx]?.textContent || '0').replace(/[^\d.]/g, '')) || 0 : 0;
        const total = totalIdx >= 0 ? parseFloat((cells[totalIdx]?.textContent || '0').replace(/[^\d.]/g, '')) || (hours * rate) : (hours * rate);
        if (hours > 0 && rate > 0) out.push({ role, hours, rate, total });
      }
      if (out.length) return out;
    }
  } catch (e) {
    console.warn('extractPricingFromHTML failed:', e);
  }
  return [];
}

/**
 * Convert TipTap JSON content to HTML suitable for embedding or export.
 * - Replaces custom editablePricingTable nodes with standard HTML tables.
 * - Uses TipTap's generateHTML for the rest of the document.
 */
export function tiptapToHTML(content: any): string {
  if (!content || typeof content !== 'object') return '';

  // Replace editablePricingTable nodes by equivalent sequence: heading + table + summary
  const transform = (node: any): any => {
    if (!node) return node;
    if (Array.isArray(node)) return node.map(transform);
    if (node.type === 'editablePricingTable') {
      const rows = Array.isArray(node?.attrs?.rows) ? node.attrs.rows : [];
      const discount = Number(node?.attrs?.discount) || 0;
      const showTotal = node?.attrs?.showTotal !== undefined ? node.attrs.showTotal : true;
      
      // Calculate totals
      const subtotal = rows.reduce((sum: number, r: any) => {
        const hours = Number(r?.hours) || 0;
        const rate = Number(r?.rate) || 0;
        return sum + (hours * rate);
      }, 0);
      
      const discountAmount = subtotal * (discount / 100);
      const subtotalAfterDiscount = subtotal - discountAmount;
      const gst = subtotalAfterDiscount * 0.1;
      const total = subtotalAfterDiscount + gst;
      const roundedTotal = Math.round(total / 100) * 100; // Round to nearest $100
      
      const headerRow = {
        type: 'tableRow',
        content: ['Role', 'Description', 'Hours', 'Rate (AUD)', 'Cost (AUD, ex GST)'].map((h) => ({
          type: 'tableHeader',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: h }] }],
        })),
      };
      const bodyRows = rows.map((r: any) => ({
        type: 'tableRow',
        content: [
          String(r?.role || ''),
          String(r?.description || ''),
          String(Number(r?.hours) || 0),
          `$${(Number(r?.rate) || 0).toFixed(2)}`,
          `$${(((Number(r?.hours) || 0) * (Number(r?.rate) || 0))).toFixed(2)} +GST`,
        ].map((txt) => ({
          type: 'tableCell',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: txt }] }],
        })),
      }));
      
      // Create pricing table node with summary metadata
      const pricingTableNode = {
        type: 'pricingTableWithSummary',
        attrs: {
          showTotal,
          subtotal,
          discount,
          discountAmount,
          subtotalAfterDiscount,
          gst,
          total,
          roundedTotal,
        },
        content: [{
          type: 'table',
          content: [headerRow, ...bodyRows],
        }],
      };
      
      return pricingTableNode;
    }
    if (Array.isArray(node.content)) {
      return { ...node, content: node.content.map(transform) };
    }
    return node;
  };

  const normalized = transform(content);

  // Lightweight serializer for TipTap JSON nodes. Handles common node types
  // used in SOW documents (doc, paragraph, text, heading, lists, tables,
  // images, links). This avoids importing TipTap runtime extensions which
  // previously pulled in incompatible dependencies during the Next.js build.
  const serialize = (node: any): string => {
    if (!node) return '';
    if (Array.isArray(node)) return node.map(serialize).join('');

    const type = node.type || 'text';

    switch (type) {
      case 'doc':
        return (node.content || []).map(serialize).join('');
      case 'paragraph':
        return `<p>${(node.content || []).map(serialize).join('')}</p>`;
      case 'heading': {
        const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 2));
        return `<h${level}>${(node.content || []).map(serialize).join('')}</h${level}>`;
      }
      case 'text': {
        let text = node.text || '';
        if (node.marks && Array.isArray(node.marks)) {
          for (const mark of node.marks) {
            if (mark.type === 'strong') text = `<strong>${text}</strong>`;
            if (mark.type === 'em') text = `<em>${text}</em>`;
            if (mark.type === 'code') text = `<code>${text}</code>`;
            if (mark.type === 'link' && mark.attrs && mark.attrs.href) {
              const href = String(mark.attrs.href);
              text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            }
          }
        }
        return text;
      }
      case 'bulletList':
        return `<ul>${(node.content || []).map(serialize).join('')}</ul>`;
      case 'orderedList':
        return `<ol>${(node.content || []).map(serialize).join('')}</ol>`;
      case 'listItem':
        return `<li>${(node.content || []).map(serialize).join('')}</li>`;
      case 'hardBreak':
        return '<br/>';
      case 'blockquote':
        return `<blockquote>${(node.content || []).map(serialize).join('')}</blockquote>`;
      case 'codeBlock':
        return `<pre><code>${(node.content || []).map(n=>n.text||'').join('')}</code></pre>`;
      case 'image': {
        const src = node.attrs?.src || '';
        const alt = node.attrs?.alt || '';
        return `<img src="${src}" alt="${alt}"/>`;
      }
      case 'table': {
        const rows = (node.content || []).map(serialize).join('');
        return `<table>${rows}</table>`;
      }
      case 'tableRow':
        return `<tr>${(node.content || []).map(serialize).join('')}</tr>`;
      case 'tableHeader':
        return `<th>${(node.content || []).map(serialize).join('')}</th>`;
      case 'tableCell':
        return `<td>${(node.content || []).map(serialize).join('')}</td>`;
      case 'pricingTableWithSummary': {
        // Render pricing table with conditional summary section
        const tableHTML = (node.content || []).map(serialize).join('');
        const showTotal = node.attrs?.showTotal !== undefined ? node.attrs.showTotal : true;
        const subtotal = Number(node.attrs?.subtotal) || 0;
        const discount = Number(node.attrs?.discount) || 0;
        const discountAmount = Number(node.attrs?.discountAmount) || 0;
        const subtotalAfterDiscount = Number(node.attrs?.subtotalAfterDiscount) || 0;
        const gst = Number(node.attrs?.gst) || 0;
        const total = Number(node.attrs?.total) || 0;
        const roundedTotal = Number(node.attrs?.roundedTotal) || 0;
        
        let html = '<h3>Project Pricing</h3>';
        html += tableHTML;
        
        // 🎯 SMART PDF EXPORT: Only show summary section if showTotal is true
        if (showTotal) {
          html += '<h4 style="margin-top: 20px;">Summary</h4>';
          html += '<table class="summary-table" style="width: 100%; border-collapse: collapse;">';
          const formatMoney = (amt: number) => `$${amt.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          
          html += `<tr><td style="text-align: right; padding-right: 12px;"><strong>Subtotal (ex GST):</strong></td><td style="text-align: right;" class="num">${formatMoney(subtotal)} <span style="color:#6b7280; font-size: 0.85em;">+GST</span></td></tr>`;
          
          if (discount > 0) {
            html += `<tr><td style="text-align: right; padding-right: 12px; color: #dc2626;"><strong>Discount (${discount}%):</strong></td><td style="text-align: right; color: #dc2626;" class="num">-${formatMoney(discountAmount)}</td></tr>`;
            html += `<tr><td style="text-align: right; padding-right: 12px;"><strong>After Discount (ex GST):</strong></td><td style="text-align: right;" class="num">${formatMoney(subtotalAfterDiscount)} <span style="color:#6b7280; font-size: 0.85em;">+GST</span></td></tr>`;
          }
          
          html += `<tr><td style="text-align: right; padding-right: 12px;"><strong>GST (10%):</strong></td><td style="text-align: right;" class="num">${formatMoney(gst)}</td></tr>`;
          html += `<tr><td style="text-align: right; padding-right: 12px;"><strong>Total (incl GST, unrounded):</strong></td><td style="text-align: right;" class="num">${formatMoney(total)}</td></tr>`;
          html += `<tr style="border-top: 2px solid #2C823D;"><td style="text-align: right; padding-right: 12px; padding-top: 8px;"><strong>Total Project Value (incl GST, rounded):</strong></td><td style="text-align: right; padding-top: 8px; color: #2C823D; font-size: 18px;" class="num"><strong>${formatMoney(roundedTotal)}</strong></td></tr>`;
          html += '</table>';
          html += '<p style="margin-top: 12px; font-size: 0.85em; color: #6b7280;">All prices are in Australian Dollars (AUD). GST is calculated at 10% on the subtotal after discount.</p>';
        }
        
        return html;
      }
      case 'editablePricingTable':
        // Our transform already turned this into a pricingTableWithSummary node, but be
        // defensive in case an editablePricingTable remains.
        const rows = Array.isArray(node?.attrs?.rows) ? node.attrs.rows : [];
        const header = `<tr>${['Role','Description','Hours','Rate (AUD)','Cost (AUD, ex GST)'].map(h=>`<th>${h}</th>`).join('')}</tr>`;
        const body = rows.map((r:any)=>`<tr>${['role','description','hours','rate','total'].map((k,i)=>`<td>${i===3?`$${(Number(r?.rate)||0).toFixed(2)}`:(k==='total'?`$${(((Number(r?.hours)||0)*(Number(r?.rate)||0))).toFixed(2)} +GST`:String(r?.[k]||''))}</td>`).join('')}</tr>`).join('');
        return `<table>${header}${body}</table>`;
      default:
        // Generic fallback: render children
        return (node.content || []).map(serialize).join('');
    }
  };

  try {
    return serialize(normalized);
  } catch (e) {
    console.warn('tiptapToHTML serializer failed, returning empty string:', e);
    return '';
  }
}
