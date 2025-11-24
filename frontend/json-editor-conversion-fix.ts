// JSON to Editor Conversion Fix
// This fixes the issue where JSON is inserted as raw text instead of editable tables

import { cleanSOWContent } from "@/lib/export-utils";
import { extractAllJSONBlocks } from "@/lib/streaming-enhancements/json-extractor";

interface V41PricingData {
    currency: string;
    gst_rate: number;
    scopes: Array<{
        scope_name: string;
        scope_description: string;
        deliverables: string[];
        assumptions: string[];
        role_allocation: Array<{
            role: string;
            description: string;
            hours: number;
            rate: number;
            cost: number;
        }>;
        discount?: number;
    }>;
    discount: number;
    grand_total_pre_gst: number;
    gst_amount: number;
    grand_total: number;
}

// Convert V4.1 JSON to TipTap editor JSON format
export function convertV41JSONToEditorFormat(
    pricingData: V41PricingData,
): string {
    console.log("🔄 [JSON->EDITOR] Converting V4.1 JSON to editor format");

    let markdownContent = `# Statement of Work\n\n`;

    // Helper to safely format numbers
    const fmt = (num: number | undefined) => (num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Add project header
    markdownContent += `**Currency:** ${pricingData.currency}  \n`;
    markdownContent += `**GST Rate:** ${pricingData.gst_rate}%  \n`;
    markdownContent += `**Total Investment:** ${pricingData.currency} ${fmt(pricingData.grand_total)}  \n\n`;

    // Process each scope
    pricingData.scopes.forEach((scope, scopeIndex) => {
        const scopeNumber = scopeIndex + 1;
        markdownContent += `## Phase ${scopeNumber}: ${scope.scope_name}\n\n`;
        markdownContent += `**Description:** ${scope.scope_description}\n\n`;

        // Add deliverables
        if (scope.deliverables && scope.deliverables.length > 0) {
            markdownContent += `**Deliverables:**\n`;
            scope.deliverables.forEach((deliverable) => {
                markdownContent += `- ${deliverable}\n`;
            });
            markdownContent += `\n`;
        }

        // Add assumptions
        if (scope.assumptions && scope.assumptions.length > 0) {
            markdownContent += `**Assumptions:**\n`;
            scope.assumptions.forEach((assumption) => {
                markdownContent += `- ${assumption}\n`;
            });
            markdownContent += `\n`;
        }

        // Add pricing table for this scope
        markdownContent += `### Investment Breakdown - Phase ${scopeNumber}\n\n`;

        // Create the rows for this scope's table
        const tableRows = (scope.role_allocation || []).map((role, idx) => ({
            id: `row-${scopeIndex}-${idx}-${Date.now()}`,
            role: role.role,
            description: role.description,
            hours: role.hours,
            rate: role.rate,
        }));

        // Serialize rows and other data for the custom node
        const rowsJson = JSON.stringify(tableRows).replace(/"/g, '&quot;');
        const aiDataJson = JSON.stringify({ rows: tableRows, discount: scope.discount || 0 }).replace(/"/g, '&quot;');

        // Construct the HTML for the custom node
        // We use data attributes to pass the structured data
        markdownContent += `<div data-type="editable-pricing-table" 
            data-rows="${rowsJson}" 
            data-discount="${scope.discount || 0}"
            data-scope-name="${scope.scope_name}"
            data-scope-description="${scope.scope_description}"
            data-scope-index="${scopeIndex}"
            data-total-scopes="${pricingData.scopes.length}"
            data-mode="view"
            data-ai-generated-data="${aiDataJson}"
            data-show-totals="true"></div>\n\n`;
    });

    // Add overall financial summary table (ReadOnly Markdown Table)
    markdownContent += `## Investment Summary\n\n`;
    markdownContent += `| Scope | Estimated Hours | Total Cost |\n`;
    markdownContent += `|-------|-----------------|------------|\n`;

    pricingData.scopes.forEach((scope, idx) => {
        const scopeTotal = (scope.role_allocation || []).reduce((sum, r) => sum + (r.cost || 0), 0);
        const scopeHours = (scope.role_allocation || []).reduce((sum, r) => sum + (r.hours || 0), 0);
        const discountAmount = scopeTotal * ((scope.discount || 0) / 100);
        const finalScopeTotal = scopeTotal - discountAmount;

        markdownContent += `| **Scope ${idx + 1}: ${scope.scope_name}** | **${scopeHours}** | **${pricingData.currency} ${fmt(finalScopeTotal)}** |\n`;
    });

    markdownContent += `| **TOTAL PROJECT** | **${pricingData.scopes.reduce((acc, s) => acc + (s.role_allocation || []).reduce((h, r) => h + (r.hours || 0), 0), 0)}** | **${pricingData.currency} ${fmt(pricingData.grand_total_pre_gst)}** |\n\n`;

    // Final totals
    if (pricingData.discount > 0) {
        const discountAmount = (pricingData.grand_total_pre_gst || 0) * (pricingData.discount / 100);
        const discountedSubtotal = (pricingData.grand_total_pre_gst || 0) - discountAmount;
        markdownContent += `**Subtotal (before discount):** ${pricingData.currency} ${fmt(pricingData.grand_total_pre_gst)}\n`;
        markdownContent += `**Discount:** ${pricingData.discount}% (-${pricingData.currency} ${fmt(discountAmount)})\n`;
        markdownContent += `**Subtotal (after discount):** ${pricingData.currency} ${fmt(discountedSubtotal)}\n`;
    } else {
        markdownContent += `**Subtotal:** ${pricingData.currency} ${fmt(pricingData.grand_total_pre_gst)}\n`;
    }

    markdownContent += `**GST:** ${pricingData.gst_rate}% (${pricingData.currency} ${fmt(pricingData.gst_amount)})\n`;
    markdownContent += `**TOTAL PROJECT VALUE:** ${pricingData.currency} ${fmt(pricingData.grand_total)}\n\n`;

    // Add closing
    markdownContent += `---\n\n`;
    markdownContent += `*This Statement of Work was generated using The Architect V4.1 AI system.*`;

    return markdownContent;
}

// Extract JSON from markdown content
export function extractJSONFromContent(content: string): V41PricingData | null {
    console.log(
        "🔍 [JSON-EXTRACT] Extracting JSON from content - looking for LAST valid JSON",
    );

    try {
        // Use robust extractor
        const allBlocks = extractAllJSONBlocks(content);

        const validJSONs: V41PricingData[] = [];

        for (const block of allBlocks) {
            const parsed = block.parsed;

            // Check if it looks like pricing data (has currency and scopes)
            if (parsed && parsed.currency && Array.isArray(parsed.scopes)) {
                // Normalize to V41PricingData (snake_case)
                // Handle both camelCase (from some AI outputs) and snake_case

                const grandTotal = parsed.grandTotal ?? parsed.grand_total ?? 0;
                const gstAmount = parsed.gstAmount ?? parsed.gst_amount ?? 0;
                const discount = parsed.discountPercent ?? parsed.discount ?? 0;

                // Calculate pre-GST total if missing
                let grandTotalPreGst = parsed.grandTotalPreGst ?? parsed.grand_total_pre_gst;
                if (grandTotalPreGst === undefined) {
                    // Reverse calculate from grand total and GST if possible
                    // Total = (Subtotal - Discount) + GST
                    // This is complex to reverse perfectly without more data, 
                    // but often PreGST is just Total - GST
                    grandTotalPreGst = grandTotal - gstAmount;
                }

                const normalized: V41PricingData = {
                    currency: parsed.currency,
                    gst_rate: parsed.gstRate ?? parsed.gst_rate ?? 10, // Default to 10% if missing
                    discount: discount,
                    grand_total: grandTotal,
                    gst_amount: gstAmount,
                    grand_total_pre_gst: grandTotalPreGst,
                    scopes: parsed.scopes.map((s: any) => ({
                        scope_name: s.scope_name,
                        scope_description: s.scope_description,
                        deliverables: Array.isArray(s.deliverables) ? s.deliverables : [],
                        assumptions: Array.isArray(s.assumptions) ? s.assumptions : [],
                        role_allocation: (s.roles || s.role_allocation || []).map((r: any) => ({
                            role: r.role,
                            description: r.description || "",
                            hours: r.hours || 0,
                            rate: r.rate || 0,
                            cost: r.cost || 0
                        })),
                        discount: s.discountPercent ?? s.discount ?? 0
                    }))
                };

                validJSONs.push(normalized);
                console.log(
                    `✅ [JSON-EXTRACT] Found valid V4.1 JSON (total: ${validJSONs.length})`,
                );
            }
        }

        // Return the LAST valid JSON if we found any
        if (validJSONs.length > 0) {
            const lastValidJSON = validJSONs[validJSONs.length - 1];
            console.log(
                `✅ [JSON-EXTRACT] Successfully extracted LAST V4.1 JSON out of ${validJSONs.length}:`,
                lastValidJSON,
            );
            return lastValidJSON;
        }

        console.log("❌ [JSON-EXTRACT] No valid JSON found");
        return null;
    } catch (error) {
        console.error("❌ [JSON-EXTRACT] Error extracting JSON:", error);
        return null;
    }
}

// Enhanced insert function that handles JSON properly
export function insertPricingToEditor(
    content: string,
    onInsert: (formattedContent: string) => void,
): void {
    console.log("🔗 [INSERT] Processing content for editor insertion");

    try {
        // First try to extract and convert JSON
        const extractedJSON = extractJSONFromContent(content);
        if (extractedJSON) {
            console.log("💰 [INSERT] Converting V4.1 JSON to editor format");
            const formattedContent =
                convertV41JSONToEditorFormat(extractedJSON);
            onInsert(formattedContent);
            return;
        }

        // If no JSON found, use cleaned content
        console.log("📝 [INSERT] No JSON found, using cleaned content");
        const cleanedContent = cleanSOWContent(content);
        onInsert(cleanedContent);
    } catch (error) {
        console.error("❌ [INSERT] Error processing content:", error);
        // Fallback to raw content
        onInsert(content);
    }
}

// Safe content processor for emergency fallback
export function safeContentProcessor(content: string): string {
    console.log("🛡️ [SAFE] Using safe content processor");

    try {
        // Remove any potential malicious content
        const safeContent = content
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
            .replace(/javascript:/gi, "")
            .replace(/on\w+=/gi, "");

        return safeContent;
    } catch (error) {
        console.error("❌ [SAFE] Error in safe processor:", error);
        return content.substring(0, 5000); // Truncate if processing fails
    }
}
