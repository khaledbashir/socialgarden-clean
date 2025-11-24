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

export function convertV41JSONToEditorFormat(
    pricingData: V41PricingData,
): any {
    console.log("🔄 [JSON->EDITOR] Converting V4.1 JSON to TipTap JSON format");

    // Helper to safely format numbers
    const fmt = (num: number | undefined) => (num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Build TipTap JSON content array
    const content: any[] = [];

    // Add title
    content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Statement of Work" }]
    });

    // Add project header paragraph
    content.push({
        type: "paragraph",
        content: [
            { type: "text", marks: [{ type: "bold" }], text: "Currency:" },
            { type: "text", text: ` ${pricingData.currency}  ` },
            { type: "hardBreak" },
            { type: "text", marks: [{ type: "bold" }], text: "GST Rate:" },
            { type: "text", text: ` ${pricingData.gst_rate}%  ` },
            { type: "hardBreak" },
            { type: "text", marks: [{ type: "bold" }], text: "Total Investment:" },
            { type: "text", text: ` ${pricingData.currency} ${fmt(pricingData.grand_total)}` }
        ]
    });

    // Process each scope
    pricingData.scopes.forEach((scope, scopeIndex) => {
        const scopeNumber = scopeIndex + 1;

        // Scope heading
        content.push({
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: `Phase ${scopeNumber}: ${scope.scope_name}` }]
        });

        // Description
        content.push({
            type: "paragraph",
            content: [
                { type: "text", marks: [{ type: "bold" }], text: "Description:" },
                { type: "text", text: ` ${scope.scope_description}` }
            ]
        });

        // Deliverables
        if (scope.deliverables && scope.deliverables.length > 0) {
            content.push({
                type: "paragraph",
                content: [{ type: "text", marks: [{ type: "bold" }], text: "Deliverables:" }]
            });
            content.push({
                type: "bulletList",
                content: scope.deliverables.map(d => ({
                    type: "listItem",
                    content: [{
                        type: "paragraph",
                        content: [{ type: "text", text: d }]
                    }]
                }))
            });
        }

        // Assumptions
        if (scope.assumptions && scope.assumptions.length > 0) {
            content.push({
                type: "paragraph",
                content: [{ type: "text", marks: [{ type: "bold" }], text: "Assumptions:" }]
            });
            content.push({
                type: "bulletList",
                content: scope.assumptions.map(a => ({
                    type: "listItem",
                    content: [{
                        type: "paragraph",
                        content: [{ type: "text", text: a }]
                    }]
                }))
            });
        }

        // Investment breakdown heading
        content.push({
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: `Investment Breakdown - Phase ${scopeNumber}` }]
        });

        // Create the pricing table node
        const tableRows = (scope.role_allocation || []).map((role, idx) => ({
            id: `row-${scopeIndex}-${idx}-${Date.now()}`,
            role: role.role,
            description: role.description,
            hours: role.hours,
            rate: role.rate,
        }));

        // Add the editablePricingTable node
        content.push({
            type: "editablePricingTable",
            attrs: {
                rows: tableRows,
                discount: scope.discount || 0,
                scopeName: scope.scope_name,
                scopeDescription: scope.scope_description,
                scopeIndex: scopeIndex,
                totalScopes: pricingData.scopes.length,
                mode: "view",
                showTotals: true
            }
        });
    });

    // Add overall summary heading
    content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Investment Summary" }]
    });

    // Add summary placeholder
    content.push({
        type: "paragraph",
        content: [{ type: "text", text: "[editablePricingTable]" }]
    });

    // Add financial summary
    const discountAmount = pricingData.grand_total_pre_gst * (pricingData.discount / 100);
    const subtotalAfterDiscount = pricingData.grand_total_pre_gst - discountAmount;

    content.push({
        type: "paragraph",
        content: [
            { type: "text", marks: [{ type: "bold" }], text: "Subtotal (before discount):" },
            { type: "text", text: ` ${pricingData.currency} ${fmt(pricingData.grand_total_pre_gst)}  ` },
            { type: "hardBreak" },
            { type: "text", marks: [{ type: "bold" }], text: "Discount:" },
            { type: "text", text: ` ${pricingData.discount}% (-${pricingData.currency} ${fmt(discountAmount)})  ` },
            { type: "hardBreak" },
            { type: "text", marks: [{ type: "bold" }], text: "Subtotal (after discount):" },
            { type: "text", text: ` ${pricingData.currency} ${fmt(subtotalAfterDiscount)}  ` },
            { type: "hardBreak" },
            { type: "text", marks: [{ type: "bold" }], text: "GST:" },
            { type: "text", text: ` ${pricingData.gst_rate}% (${pricingData.currency} ${fmt(pricingData.gst_amount)})  ` },
            { type: "hardBreak" },
            { type: "text", marks: [{ type: "bold" }], text: "TOTAL PROJECT VALUE:" },
            { type: "text", text: ` ${pricingData.currency} ${fmt(pricingData.grand_total)}` }
        ]
    });

    // Add horizontal rule
    content.push({ type: "horizontalRule" });

    // Add footer
    content.push({
        type: "paragraph",
        content: [
            { type: "text", marks: [{ type: "italic" }], text: "This Statement of Work was generated using The Architect V4.1 AI system." }
        ]
    });

    // Return as TipTap JSON document
    return {
        type: "doc",
        content: content
    };
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
