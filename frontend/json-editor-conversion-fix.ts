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

    // Add project header
    markdownContent += `**Currency:** ${pricingData.currency}  \n`;
    markdownContent += `**GST Rate:** ${pricingData.gst_rate}%  \n`;
    markdownContent += `**Total Investment:** ${pricingData.currency} ${pricingData.grand_total.toLocaleString()}  \n\n`;

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

        // Add pricing table
        markdownContent += `### Investment Breakdown\n\n`;
        markdownContent += `| Role | Description | Hours | Rate | Cost |\n`;
        markdownContent += `|------|-------------|-------|------|----- |\n`;

        scope.role_allocation.forEach((role) => {
            markdownContent += `| ${role.role} | ${role.description} | ${role.hours} | ${pricingData.currency} ${role.rate} | ${pricingData.currency} ${role.cost} |\n`;
        });

        // Calculate scope total
        const scopeTotal = scope.role_allocation.reduce(
            (sum, role) => sum + role.cost,
            0,
        );
        markdownContent += `\n**Scope Total:** ${pricingData.currency} ${scopeTotal.toLocaleString()}\n\n`;

        // Add scope discount if specified
        if (scope.discount && scope.discount > 0) {
            const discountAmount = scopeTotal * (scope.discount / 100);
            const finalScopeTotal = scopeTotal - discountAmount;
            markdownContent += `**Discount:** ${scope.discount}% (-${pricingData.currency} ${discountAmount.toLocaleString()})\n`;
            markdownContent += `**Final Scope Total:** ${pricingData.currency} ${finalScopeTotal.toLocaleString()}\n\n`;
        }
    });

    // Add overall financial summary
    markdownContent += `## Investment Summary\n\n`;
    markdownContent += `**Subtotal (before discount):** ${pricingData.currency} ${pricingData.grand_total_pre_gst.toLocaleString()}\n`;

    if (pricingData.discount > 0) {
        const discountAmount =
            pricingData.grand_total_pre_gst * (pricingData.discount / 100);
        const discountedSubtotal =
            pricingData.grand_total_pre_gst - discountAmount;
        markdownContent += `**Discount:** ${pricingData.discount}% (-${pricingData.currency} ${discountAmount.toLocaleString()})\n`;
        markdownContent += `**Subtotal (after discount):** ${pricingData.currency} ${discountedSubtotal.toLocaleString()}\n`;
    } else {
        const discountedSubtotal = pricingData.grand_total_pre_gst;
        markdownContent += `**Subtotal (after discount):** ${pricingData.currency} ${discountedSubtotal.toLocaleString()}\n`;
    }

    markdownContent += `**GST:** ${pricingData.gst_rate}% (${pricingData.currency} ${pricingData.gst_amount.toLocaleString()})\n`;
    markdownContent += `**TOTAL PROJECT VALUE:** ${pricingData.currency} ${pricingData.grand_total.toLocaleString()}\n\n`;

    // Add editable pricing table marker for TipTap processing
    markdownContent += `[editablePricingTable]\n\n`;

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
            // Validate that this looks like our V4.1 format
            if (
                parsed &&
                parsed.currency &&
                parsed.scopes &&
                Array.isArray(parsed.scopes)
            ) {
                validJSONs.push(parsed as V41PricingData);
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
