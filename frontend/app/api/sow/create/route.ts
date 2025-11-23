/**
 * API Route: Create new SOW
 * POST /api/sow/create
 */

import { NextRequest, NextResponse } from "next/server";
import { query, generateSOWId, formatDateForMySQL } from "@/lib/db";
import { validatePricing, proposeAdjustments } from "@/lib/pricing-validation";
import { validateMandatoryRoles } from "@/lib/mandatory-roles-enforcer";
// import removed: enforceHeadOfRole is now a no-op
import { extractPricingFromContent } from "@/lib/export-utils";

/**
 * Extract pricing tables from TipTap JSON content
 * @param content - TipTap JSON document
 * @returns Array of pricing table data
 */
function extractPricingTablesFromContent(content: any): Array<{ rows: any[] }> {
    const pricingTables: Array<{ rows: any[] }> = [];

    if (!content || typeof content !== "object") {
        return pricingTables;
    }

    // Recursive function to traverse TipTap JSON
    function traverse(node: any) {
        if (!node) return;

        // Check if this node is a pricing table
        if (node.type === "pricingTable" && node.attrs?.rows) {
            pricingTables.push({
                rows: node.attrs.rows,
            });
        }

        // Recurse into content array
        if (Array.isArray(node.content)) {
            for (const child of node.content) {
                traverse(child);
            }
        }
    }

    traverse(content);
    return pricingTables;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("📝 [SOW CREATE] Incoming body keys:", Object.keys(body));

        // Accept both camelCase and snake_case payloads from various callers
        const title = body.title || body.title_text || body.name || null;
        const clientName =
            body.clientName || body.client_name || body.client || null;
        const clientEmail = body.clientEmail || body.client_email || null;
        let content = body.content || body.body || body.sowContent || null;

        // No legacy enforcement: pricing table is now deterministic and single-source from frontend
        const totalInvestment =
            body.totalInvestment ?? body.total_investment ?? 0;
        const budgetLimit = body.budgetLimit ?? body.budget_limit ?? null;
        const folderId = body.folderId || body.folder_id || null;
        const creatorEmail = body.creatorEmail || body.creator_email || null;
        const workspaceSlug =
            body.workspaceSlug || body.workspace_slug || body.workspace || null;
        const embedId = body.embedId || body.embed_id || null;
        const threadSlug = body.threadSlug || body.thread_slug || null; // 🧵 AnythingLLM thread UUID
        const vertical = body.vertical || null; // 📊 Social Garden Business Intelligence
        const serviceLine = body.serviceLine || body.service_line || null; // 📊 Social Garden Business Intelligence

        // Validation - only title and content are strictly required for creating a draft SOW
        const missing: string[] = [];
        if (!title) missing.push("title");
        if (!content) missing.push("content");

        if (missing.length) {
            console.error(" [SOW CREATE] Validation failed - missing fields", {
                missing,
                receivedKeys: Object.keys(body),
            });
            return NextResponse.json(
                {
                    error: `Missing required fields: ${missing.join(", ")}`,
                    received: Object.keys(body),
                },
                { status: 400 },
            );
        }

        // 🔒 MANDATORY ROLE VALIDATION (Sam-Proof Architecture)
        // Extract pricing data from content if present
        if (content && typeof content === "object") {
            try {
                // Parse TipTap JSON to find pricing tables
                const pricingTables = extractPricingTablesFromContent(content);

                if (pricingTables.length > 0) {
                    console.log(
                        `🔍 [SOW CREATE] Found ${pricingTables.length} pricing table(s), validating...`,
                    );

                    // Validate each pricing table for mandatory roles
                    for (const table of pricingTables) {
                        const mandatoryValidation = validateMandatoryRoles(
                            table.rows,
                        );

                        if (!mandatoryValidation.isValid) {
                            console.error(
                                "❌ [SOW CREATE] Mandatory role validation failed:",
                                mandatoryValidation.details,
                            );
                            return NextResponse.json(
                                {
                                    error: "SOW validation failed: Missing mandatory roles",
                                    details: mandatoryValidation.details,
                                    missingRoles:
                                        mandatoryValidation.missingRoles,
                                    message:
                                        "This SOW is missing required management roles. All SOWs must include: Tech - Head Of - Senior Project Management, Tech - Delivery - Project Coordination, and Account Management - Senior Account Manager.",
                                },
                                { status: 400 },
                            );
                        }
                    }

                    console.log(
                        "✅ [SOW CREATE] Mandatory role validation passed",
                    );
                }
            } catch (validationError: any) {
                console.error(
                    "⚠️ [SOW CREATE] Validation error:",
                    validationError.message,
                );
                // Don't block creation for validation errors, but log them
            }
        }

        // Ensure schema supports budget_limit (self-healing)
        try {
            const sowCols: any[] = await query('SHOW COLUMNS FROM sows');
            const sowColNames = sowCols.map((c: any) => c.Field);
            if (!sowColNames.includes('budget_limit')) {
                await query('ALTER TABLE sows ADD COLUMN budget_limit DECIMAL(12,2) NULL AFTER total_investment');
            }
        } catch (schemaErr) {
            // Non-blocking: insertion will still succeed via fallback if other columns are missing
            console.warn(' [SOW CREATE] Schema self-heal skipped:', schemaErr instanceof Error ? schemaErr.message : schemaErr);
        }

        // Generate unique ID
        const sowId = generateSOWId();

        // Set expiration date (default: 30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Insert into database
        try {
            // Try with vertical/service_line columns first (Phase 1A)
            try {
                await query(
                    `INSERT INTO sows (
            id, title, client_name, client_email, content, total_investment,
            status, workspace_slug, thread_slug, embed_id, folder_id, creator_email, expires_at, vertical, service_line, budget_limit
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        sowId,
                        title,
                        clientName,
                        clientEmail || null,
                        content,
                        totalInvestment || 0,
                        "draft",
                        workspaceSlug || null,
                        threadSlug || null,
                        embedId || null,
                        folderId || null,
                        creatorEmail || null,
                        formatDateForMySQL(expiresAt),
                        vertical || null,
                        serviceLine || null,
                        budgetLimit || null,
                    ],
                );
                console.log(
                    " [SOW CREATE] SOW inserted successfully (with BI columns):",
                    sowId,
                );
            } catch (phaseError: any) {
                // Fallback: insert without vertical/service_line if columns don't exist yet
                if (phaseError?.message?.includes("Unknown column")) {
                    console.warn(
                        " [SOW CREATE] Phase 1A columns not ready, falling back to basic insert",
                    );
                    await query(
                        `INSERT INTO sows (
              id, title, client_name, client_email, content, total_investment,
              status, workspace_slug, thread_slug, embed_id, folder_id, creator_email, expires_at, budget_limit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            sowId,
                            title,
                            clientName,
                            clientEmail || null,
                            content,
                            totalInvestment || 0,
                            "draft",
                            workspaceSlug || null,
                            threadSlug || null,
                            embedId || null,
                            folderId || null,
                            creatorEmail || null,
                            formatDateForMySQL(expiresAt),
                            budgetLimit || null,
                        ],
                    );
                    console.log(
                        " [SOW CREATE] SOW inserted successfully (basic columns):",
                        sowId,
                    );
                } else {
                    throw phaseError;
                }
            }
        } catch (dbError) {
            console.error(
                " [SOW CREATE] Database insert failed:",
                dbError instanceof Error ? dbError.message : dbError,
            );
            throw dbError;
        }

        // Log activity
        try {
            await query(
                `INSERT INTO sow_activities (sow_id, event_type, metadata) VALUES (?, ?, ?)`,
                [
                    sowId,
                    "sow_created",
                    JSON.stringify({ creatorEmail, folderId }),
                ],
            );
            console.log(" [SOW CREATE] Activity logged successfully");
        } catch (activityError) {
            console.warn(
                " [SOW CREATE] Activity logging failed (non-critical):",
                activityError instanceof Error
                    ? activityError.message
                    : activityError,
            );
        }

        // 🔒 Invisible background snapshot (best-effort)
        try {
            const host = req.headers.get("host") || "localhost:3333";
            const proto =
                req.headers.get("x-forwarded-proto") ||
                (host.includes("localhost") ? "http" : "https");
            const origin = `${proto}://${host}`;
            await fetch(`${origin}/api/sow/${sowId}/snapshots`, {
                method: "POST",
            }).catch(() => {});
        } catch {
            // non-blocking
        }

        // Backend budget enforcement: adjust management roles if over max
        try {
            if (typeof budgetLimit === 'number' && budgetLimit > 0 && content && typeof content === 'object') {
                const rows = extractPricingFromContent(content);
                const total = rows.reduce((sum, r) => sum + ((Number(r.hours)||0) * (Number(r.rate)||0)), 0);
                if (total > budgetLimit) {
                    // Reduce management roles first
                    const isMgmt = (role: string) => /Account|Project Management|Senior Project Manager|Head Of/i.test(role);
                    let adjustedRows = JSON.parse(JSON.stringify(rows));
                    let attempts = 0;
                    while (attempts < 10) {
                        const subtotal = adjustedRows.reduce((s, r) => s + ((Number(r.hours)||0) * (Number(r.rate)||0)), 0);
                        if (subtotal <= budgetLimit) break;
                        adjustedRows = adjustedRows.map(r => {
                            if (isMgmt(r.role) && (Number(r.hours)||0) > 0) {
                                return { ...r, hours: Math.max(0, (Number(r.hours)||0) * 0.9) };
                            }
                            return r;
                        });
                        attempts++;
                    }
                    // Write back adjusted content pricing tables (first table only for now)
                    try {
                        const newContent = JSON.parse(JSON.stringify(content));
                        const patchRows = adjustedRows.map((r, idx) => ({ id: `row-${idx}`, role: r.role, description: r.description || '', hours: Number(r.hours)||0, rate: Number(r.rate)||0 }));
                        const patched = (nodes: any[]): boolean => {
                            for (const node of nodes) {
                                if (node.type === 'editablePricingTable' && node.attrs?.rows) {
                                    node.attrs.rows = patchRows;
                                    return true;
                                }
                                if (Array.isArray(node.content) && patched(node.content)) return true;
                            }
                            return false;
                        };
                        if (Array.isArray(newContent?.content)) patched(newContent.content);
                        await query('UPDATE sows SET content = ? WHERE id = ?', [JSON.stringify(newContent), sowId]);
                    } catch {}
                }
            }
        } catch {}

        return NextResponse.json({ success: true, id: sowId, sowId, message: "SOW created successfully" });
    } catch (error) {
        console.error(" [SOW CREATE] FATAL ERROR:", error);
        console.error(
            " [SOW CREATE] Error stack:",
            error instanceof Error ? error.stack : "No stack",
        );
        return NextResponse.json(
            {
                error: "Failed to create SOW",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
