/**
 * Enhanced JSON Extractor for Streaming SOW Generation
 *
 * This module provides utilities to extract and process JSON data during streaming,
 * specifically targeting the issue where the AI generates multiple JSON blocks
 * while iterating through different pricing options.
 */

interface PricingData {
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

interface StreamUpdate {
    content: string;
    hasValidJSON: boolean;
    jsonCount: number;
    latestJSON?: PricingData;
    totalInvestment?: number;
    statusMessage?: string;
}

/**
 * Extract all valid JSON blocks from streaming content
 * @param content - The current streaming content
 * @returns Object with extracted JSON data and metadata
 */
export function extractStreamingJSON(content: string): StreamUpdate {
    // Look for JSON blocks that match our pricing structure
    const jsonMatches = [
        ...content.matchAll(/\{[\s\S]*?"currency"[\s\S]*?\}/gi),
        ...content.matchAll(/\{[\s\S]*?"scopes"[\s\S]*?\}/gi),
    ];

    // Parse and validate all JSON blocks
    const validJSONBlocks: PricingData[] = [];

    for (let i = 0; i < jsonMatches.length; i++) {
        const match = jsonMatches[i];
        try {
            const jsonStr = match[0].trim();
            const parsed = JSON.parse(jsonStr);

            // Validate that this looks like our pricing format
            if (
                parsed.currency &&
                parsed.scopes &&
                Array.isArray(parsed.scopes)
            ) {
                validJSONBlocks.push(parsed);
            }
        } catch (e) {
            // Invalid JSON, skip
            continue;
        }
    }

    // Determine the status message based on content
    let statusMessage = "";

    // Look for patterns indicating the AI is recalculating
    if (
        content.includes("recalculate") ||
        content.includes("too high") ||
        content.includes("over budget") ||
        content.includes("adjust")
    ) {
        statusMessage = "AI is adjusting the pricing to match your budget...";
    } else if (content.includes("thinking") || content.includes("let me")) {
        statusMessage =
            "AI is analyzing requirements and calculating pricing...";
    } else if (validJSONBlocks.length > 0) {
        statusMessage = "AI has generated a pricing proposal...";
    } else {
        statusMessage = "AI is generating your SOW...";
    }

    // Return the latest (last) valid JSON block and metadata
    return {
        content,
        hasValidJSON: validJSONBlocks.length > 0,
        jsonCount: validJSONBlocks.length,
        latestJSON:
            validJSONBlocks.length > 0
                ? validJSONBlocks[validJSONBlocks.length - 1]
                : undefined,
        totalInvestment:
            validJSONBlocks.length > 0
                ? validJSONBlocks[validJSONBlocks.length - 1].grand_total
                : undefined,
        statusMessage,
    };
}

/**
 * Clean content for display by removing JSON blocks
 * @param content - The content to clean
 * @returns Cleaned content without JSON blocks
 */
export function cleanStreamContent(content: string): string {
    return content
        .replace(/\{[\s\S]*?"currency"[\s\S]*?\}/gi, "")
        .replace(/\{[\s\S]*?"scopes"[\s\S]*?\}/gi, "")
        .replace(/```json[\s\S]*?```/gi, "")
        .trim();
}

/**
 * Detect if the content contains indicators that the AI is still working
 * @param content - The content to check
 * @returns True if AI appears to be still working
 */
export function isAIStillWorking(content: string): boolean {
    const workingIndicators = [
        "let me",
        "i need to",
        "thinking",
        "recalculate",
        "adjust",
        "checking",
        "reconsider",
        "looking",
        "calculating",
        "wait",
        "one moment",
    ];

    const lowerContent = content.toLowerCase();
    return workingIndicators.some((indicator) =>
        lowerContent.includes(indicator),
    );
}
