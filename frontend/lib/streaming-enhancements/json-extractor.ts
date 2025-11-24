/**
 * Enhanced JSON Extractor for Streaming SOW Generation
 *
 * This module provides utilities to extract and process JSON data during streaming,
 * specifically targeting the issue where the AI generates multiple JSON blocks
 * while iterating through different pricing options.
 */

interface PricingData {
    currency: string;
    discountPercent?: number;
    scopes: Array<{
        scope_name: string;
        scope_description: string;
        deliverables: string[];
        assumptions: string[];
        roles: Array<{
            role: string;
            description?: string;
            hours: number;
            rate: number;
            cost: number;
        }>;
        subTotal?: number;
        discountAmount?: number;
        gstAmount?: number;
        total?: number;
    }>;
    grandTotal?: number;
    gstAmount?: number;
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
 * Robustly extract all valid JSON blocks from content using brace counting.
 * This handles nested objects correctly, which regex often fails at.
 * Returns parsed object and its location in the string.
 */
export function extractAllJSONBlocks(content: string): { parsed: any; start: number; end: number; raw: string }[] {
    const blocks: { parsed: any; start: number; end: number; raw: string }[] = [];
    let startIndex = 0;

    // Safety limit to prevent infinite loops on extremely large content
    const MAX_ITERATIONS = 1000;
    let iterations = 0;

    while (startIndex < content.length && iterations < MAX_ITERATIONS) {
        iterations++;
        const openBraceIndex = content.indexOf('{', startIndex);
        if (openBraceIndex === -1) break;

        let braceCount = 1;
        let currentIndex = openBraceIndex + 1;
        let foundClose = false;
        let inString = false;
        let escape = false;

        while (currentIndex < content.length) {
            const char = content[currentIndex];

            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (char === '"') {
                inString = !inString;
            } else if (!inString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        foundClose = true;
                        break;
                    }
                }
            }
            currentIndex++;
        }

        if (foundClose) {
            const jsonStr = content.substring(openBraceIndex, currentIndex + 1);
            try {
                const parsed = JSON.parse(jsonStr);
                blocks.push({ parsed, start: openBraceIndex, end: currentIndex + 1, raw: jsonStr });
            } catch (e) {
                // Ignore invalid JSON
            }
            startIndex = currentIndex + 1;
        } else {
            // No matching close brace, stop searching
            break;
        }
    }
    return blocks;
}

/**
 * Extract all valid JSON blocks from streaming content
 * @param content - The current streaming content
 * @returns Object with extracted JSON data and metadata
 */
export function extractStreamingJSON(content: string): StreamUpdate {
    // Use robust brace counting instead of regex
    const allBlocks = extractAllJSONBlocks(content);

    const validJSONBlocks: PricingData[] = [];

    for (const block of allBlocks) {
        const parsed = block.parsed;
        try {
            if (parsed && parsed.currency && Array.isArray(parsed.scopes)) {
                // Normalize legacy keys to the new schema when present
                const normalized: PricingData = {
                    currency: parsed.currency,
                    discountPercent: parsed.discountPercent ?? parsed.discount ?? 0,
                    scopes: (parsed.scopes || []).map((s: any) => ({
                        scope_name: s.scope_name,
                        scope_description: s.scope_description,
                        deliverables: Array.isArray(s.deliverables) ? s.deliverables : [],
                        assumptions: Array.isArray(s.assumptions) ? s.assumptions : [],
                        roles: Array.isArray(s.roles)
                            ? s.roles
                            : Array.isArray(s.role_allocation)
                                ? s.role_allocation
                                : [],
                        subTotal: s.subTotal ?? s.scope_subtotal ?? undefined,
                        discountAmount: s.discountAmount ?? s.discount_amount ?? undefined,
                        gstAmount: s.gstAmount ?? s.gst_amount ?? undefined,
                        total: s.total ?? s.scope_total ?? undefined,
                    })),
                    grandTotal: parsed.grandTotal ?? parsed.grand_total ?? undefined,
                    gstAmount: parsed.gstAmount ?? parsed.gst_amount ?? undefined,
                };
                validJSONBlocks.push(normalized);
            }
        } catch (e) {
            // Invalid structure, skip
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
                ? validJSONBlocks[validJSONBlocks.length - 1].grandTotal
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
    // Remove code blocks first
    let cleaned = content
        .replace(/```json[\s\S]*?```/gi, "")
        .trim();

    // Use robust extractor to find remaining JSON blocks and remove them
    const blocks = extractAllJSONBlocks(cleaned);

    // Sort blocks by start index descending to remove from end to start without affecting indices
    blocks.sort((a, b) => b.start - a.start);

    for (const block of blocks) {
        // Only remove if it looks like a pricing block (currency or scopes or scope_name)
        const p = block.parsed;
        if (p && (p.currency || p.scopes || p.scope_name)) {
            cleaned = cleaned.substring(0, block.start) + cleaned.substring(block.end);
        }
    }

    return cleaned.trim();
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
