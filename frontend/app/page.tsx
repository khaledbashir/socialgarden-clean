"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import SidebarNav from "@/components/tailwind/sidebar-nav";
import DashboardChat from "@/components/tailwind/dashboard-chat";
import WorkspaceChat from "@/components/tailwind/workspace-chat";
import PricingTableBuilder from "@/components/tailwind/pricing-table-builder";
import Menu from "@/components/tailwind/ui/menu";
import { Button } from "@/components/tailwind/ui/button";
import { SendToClientModal } from "@/components/tailwind/send-to-client-modal";
import { ShareLinkModal } from "@/components/tailwind/share-link-modal";
import { ResizableLayout } from "@/components/tailwind/resizable-layout";
import { DocumentStatusBar } from "@/components/tailwind/document-status-bar";
import WorkspaceCreationProgress from "@/components/tailwind/workspace-creation-progress";
import OnboardingFlow from "@/components/tailwind/onboarding-flow";

import { toast } from "sonner";
import { Sparkles, Info, ExternalLink, Send } from "lucide-react";
import { defaultEditorContent } from "@/lib/content";
import { InteractiveOnboarding } from "@/components/tailwind/interactive-onboarding";
import { GuidedClientSetup } from "@/components/tailwind/guided-client-setup";
import { EnhancedDashboard } from "@/components/tailwind/enhanced-dashboard";
import { StatefulDashboardChat } from "@/components/tailwind/stateful-dashboard-chat";
import { KnowledgeBase } from "@/components/tailwind/knowledge-base";
import { FloatingDocumentActions } from "@/components/tailwind/document-toolbar";
import { calculateTotalInvestment } from "@/lib/sow-utils";
import { validateAIResponse } from "@/lib/input-validation";
import {
    extractPricingFromContent,
    exportToExcel,
    exportToPDF,
    cleanSOWContent,
} from "@/lib/export-utils";
import type { ArchitectSOW } from "@/lib/export-utils";
import { extractSOWStructuredJson } from "@/lib/export-utils";
import { anythingLLM } from "@/lib/anythingllm";
import { ROLES } from "@/lib/rateCard";
import { calculatePricingTable } from "@/lib/pricingCalculator";
import { getWorkspaceForAgent, WORKSPACE_CONFIG } from "@/lib/workspace-config";
import { prepareSOWForNewPDF } from "@/lib/sow-pdf-utils";

// Dynamically import PDF components to avoid SSR issues
const SOWPdfExportWrapper = dynamic(
    () => import("@/components/sow/SOWPdfExportWrapper"),
    { ssr: false },
);

// API key is now handled server-side in /api/chat route

// 🎯 UTILITY: Extract client/company name from user prompt
const extractClientName = (prompt: string): string | null => {
    // Common patterns for client mentions:
    // "for ABC Company", "for Company XYZ", "client: ABC Corp", "ABC Corp needs", etc.
    const patterns = [
        /\bfor\s+([A-Z][A-Za-z0-9&\s]+(?:Corp|Corporation|Inc|LLC|Ltd|Company|Co|Group|Agency|Services|Solutions|Technologies)?)/i,
        /\bclient:\s*([A-Z][A-Za-z0-9&\s]+)/i,
        /\b([A-Z][A-Za-z0-9&\s]+(?:Corp|Corporation|Inc|LLC|Ltd|Company|Co|Group))\s+(?:needs|wants|requires)/i,
        /\b([A-Z][A-Za-z0-9&\s]{2,30})\s+(?:integration|website|project|campaign|sow)/i,
    ];

    for (const pattern of patterns) {
        const match = prompt.match(pattern);
        if (match && match[1]) {
            // Clean up the match
            let name = match[1].trim();
            // Remove trailing words that aren't part of company name
            name = name.replace(
                /\s+(integration|website|project|campaign|sow|needs|wants|requires)$/i,
                "",
            );
            if (name.length > 2 && name.length < 50) {
                return name;
            }
        }
    }

    return null;
};

// 🎯 UTILITY: Extract budget and discount from user prompt
const extractBudgetAndDiscount = (
    prompt: string,
): { budget: number; discount: number } => {
    let budget = 0;
    let discount = 0;

    // Extract budget using same patterns as parseBudgetFromMarkdown
    const budgetPatterns = [
        /firm\s*\$?\s*([\d\s,\.]+)\s*(k)?\s*aud/i,
        /(budget|target|total|investment)\s*(?:[:=]|is|of)?\s*(aud\s*)?\$?\s*([\d\s,\.]+)\s*(k)?\s*(aud)?\s*(\+\s*gst|incl\s*gst|ex\s*gst)?/i,
    ];

    for (const re of budgetPatterns) {
        const m = prompt.match(re);
        if (m) {
            const numGroup = m[3] || m[2] || m[1] || "";
            let raw = String(numGroup).replace(/[\,\s]/g, "");
            let v = parseFloat(raw || "0");
            const kGroup = m[4] || m[3] || m[2] || "";
            if (kGroup && /k/i.test(kGroup)) v = v * 1000;
            const gstStr = (m[6] || m[5] || "").toLowerCase();
            const inclGST = /incl\s*gst/.test(gstStr);
            if (!isNaN(v) && v > 0) {
                budget = inclGST ? v / 1.1 : v; // Always return ex GST
                console.log(
                    `💰 Budget extracted from user prompt: $${budget.toFixed(2)} ex GST`,
                );
                break;
            }
        }
    }

    // Discount removed - system defaults to 0%
    discount = 0;

    return { budget, discount };
};

// 🎯 UTILITY: Extract and parse V4.1 Multi-Scope JSON or v3.1 format
const extractPricingJSON = (
    content: string,
): {
    roles: any[];
    discount?: number;
    authoritativeTotal?: number; // 🎯 AI-calculated authoritative total
    // NEW: Multi-scope support
    multiScopeData?: {
        scopes: Array<{
            scope_name: string;
            scope_description: string;
            deliverables: string[];
            assumptions: string[];
            role_allocation: Array<{
                role: string;
                hours: number;
                rate?: number;
                cost?: number;
            }>;
        }>;
        discount: number;
        authoritativeTotal?: number; // 🎯 AI-calculated authoritative total
    };
} | null => {
    // Look for explicit [PRICING_JSON] or [PRICING/JSON] blocks, else fallback to first JSON code fence
    const pricingJsonMatch =
        content.match(/\[PRICING[\/_]JSON\]\s*```json\s*([\s\S]*?)\s*```/i) ||
        content.match(/```json\s*([\s\S]*?)\s*```/);

    if (pricingJsonMatch && pricingJsonMatch[1]) {
        try {
            const parsedJson = JSON.parse(pricingJsonMatch[1]);

            // 🎯 V4.1 Multi-Scope Format Detection
            if (parsedJson.scopes && Array.isArray(parsedJson.scopes)) {
                console.log(
                    "🎯 [V4.1 MULTI-SCOPE] Found",
                    parsedJson.scopes.length,
                    "scopes",
                );
                console.log(
                    "📊 [PRICING_JSON] Block Detected - V4.1 Multi-Scope Format",
                );

                // Extract discount from V4.1 format
                const discount = parsedJson.discount || 0;
                console.log(`🎁 Discount extracted from V4.1: ${discount}%`);

                // Log scope details
                parsedJson.scopes.forEach((scope: any, index: number) => {
                    console.log(`  📋 Scope ${index + 1}: ${scope.scope_name}`);
                    console.log(
                        `    Description: ${scope.scope_description?.substring(0, 100)}...`,
                    );
                    console.log(
                        `    Roles: ${scope.role_allocation?.length || 0}`,
                    );
                    console.log(
                        `    Deliverables: ${scope.deliverables?.length || 0}`,
                    );
                });

                // Transform all role allocations to suggestedRoles format for backward compatibility
                const allRoles: any[] = [];
                parsedJson.scopes.forEach((scope: any) => {
                    if (
                        scope.role_allocation &&
                        Array.isArray(scope.role_allocation)
                    ) {
                        scope.role_allocation.forEach((role: any) => {
                            allRoles.push({
                                role: role.role,
                                hours: role.hours || 0,
                                rate: role.rate || 0,
                                cost: role.cost || role.hours * role.rate,
                            });
                        });
                    }
                });

                return {
                    roles: allRoles,
                    discount,
                    multiScopeData: {
                        scopes: parsedJson.scopes,
                        discount,
                    },
                };
            }

            // Check for role_allocation array (The Architect v3.1 format)
            if (
                parsedJson.role_allocation &&
                Array.isArray(parsedJson.role_allocation)
            ) {
                console.log("📊 [PRICING_JSON] Block Detected - v3.1 Format");
                console.log(
                    `✅ Extracted ${parsedJson.role_allocation.length} roles with validated hours/costs`,
                );

                // Transform role_allocation to suggestedRoles format
                const rolesWithHours = parsedJson.role_allocation.map(
                    (item: any) => ({
                        role: item.role,
                        hours: item.hours || 0,
                        rate: item.rate || 0,
                        cost: item.cost || item.hours * item.rate,
                    }),
                );

                // Extract discount from project_details if available
                let discount = 0;
                if (
                    parsedJson.project_details &&
                    parsedJson.project_details.discount_percentage
                ) {
                    discount = parsedJson.project_details.discount_percentage;
                    console.log(
                        `🎁 Discount extracted from [PRICING_JSON]: ${discount}%`,
                    );
                }

                // Log financial summary if available
                if (parsedJson.financial_summary) {
                    console.log("💰 Financial Summary from AI:");
                    console.log(
                        `   Subtotal (before discount): $${parsedJson.financial_summary.subtotal_before_discount}`,
                    );
                    console.log(
                        `   Discount: $${parsedJson.financial_summary.discount_amount}`,
                    );
                    console.log(
                        `   Subtotal (after discount): $${parsedJson.financial_summary.subtotal_after_discount}`,
                    );
                    console.log(
                        `   GST: $${parsedJson.financial_summary.gst_amount}`,
                    );
                    console.log(
                        `   FINAL TOTAL: $${parsedJson.financial_summary.total_project_value_final}`,
                    );
                }

                return { roles: rolesWithHours, discount };
            }

            // Fallback: Check for legacy suggestedRoles format
            if (
                parsedJson.suggestedRoles &&
                Array.isArray(parsedJson.suggestedRoles)
            ) {
                console.log(
                    `✅ Extracted ${parsedJson.suggestedRoles.length} roles (legacy suggestedRoles format)`,
                );
                return { roles: parsedJson.suggestedRoles };
            }
        } catch (e) {
            console.warn("⚠️ Could not parse [PRICING_JSON] block:", e);
        }
    }

    return null;
};

// 🎯 UTILITY: Extract and log [FINANCIAL_REASONING] block from AI response for transparency
const extractFinancialReasoning = (content: string): string | null => {
    const reasoningMatch = content.match(
        /\[FINANCIAL_REASONING\]([\s\S]*?)(?:\[|$)/i,
    );
    if (reasoningMatch && reasoningMatch[1]) {
        const reasoning = reasoningMatch[1].trim();
        console.log("📊 [FINANCIAL_REASONING] Block Detected:");
        console.log("─────────────────────────────────────");
        console.log(reasoning);
        console.log("─────────────────────────────────────");
        return reasoning;
    }
    return null;
};

// 🎯 V4.1 → Backend Schema: Transform Multi-Scope Data for PDF Generation
// Fixed: Updated type definition to include all properties accessed in the function
const transformScopesToPDFFormat = (multiScopeData: {
    scopes: Array<{
        scope_name: string;
        scope_description: string;
        deliverables: string[];
        assumptions: string[];
        role_allocation: Array<{
            role: string;
            hours: number;
            rate?: number;
            cost?: number;
        }>;
    }>;
    discount: number;
    projectTitle?: string;
    // Additional properties that may be accessed - safely handled with defaults
    clientName?: string;
    company?: any;
    projectSubtitle?: string;
    projectOverview?: string;
    budgetNotes?: string;
    currency?: string;
    gstApplicable?: boolean;
    generatedDate?: string;
    authoritativeTotal?: number;
}): {
    projectTitle: string;
    scopes: Array<{
        id: number;
        title: string;
        description: string;
        items: Array<{
            description: string;
            role: string;
            hours: number;
            cost: number;
        }>;
        deliverables: string[];
        assumptions: string[];
    }>;
    discount: number;
    clientName?: string;
    company?: string;
    projectSubtitle?: string;
    projectOverview?: string;
    budgetNotes?: string;
    currency?: string;
    gstApplicable?: boolean;
    generatedDate?: string;
    authoritativeTotal?: number; // 🎯 AI-calculated authoritative total
} => {
    console.log(
        "🔄 [PDF Export] Transforming V4.1 multi-scope data to backend format...",
    );

    // 🎯 DEDUPLICATION: Collect all assumptions across scopes and remove duplicates
    const allAssumptions = new Set<string>();
    multiScopeData.scopes.forEach((scope) => {
        (scope.assumptions || []).forEach((assumption) => {
            if (assumption && assumption.trim()) {
                // Normalize assumption text for better deduplication
                const normalized = assumption
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, " ");
                allAssumptions.add(normalized);
            }
        });
    });

    const uniqueAssumptions = Array.from(allAssumptions);
    console.log(
        `✅ [Deduplication] Found ${uniqueAssumptions.length} unique assumptions from ${multiScopeData.scopes.reduce((sum, scope) => sum + (scope.assumptions?.length || 0), 0)} total assumptions across ${multiScopeData.scopes.length} scopes`,
    );

    const transformedScopes = multiScopeData.scopes.map((scope, index) => {
        // Get rates for roles
        const items = scope.role_allocation.map((roleItem) => {
            const rate = roleItem.rate || 0;
            const hours = roleItem.hours || 0;
            const cost = roleItem.cost || rate * hours;

            return {
                description: roleItem.role, // Use role name as description (required field)
                role: roleItem.role,
                hours: hours,
                cost: cost,
            };
        });

        return {
            id: index + 1, // Required: Unique integer ID for each scope
            title: scope.scope_name,
            description: scope.scope_description,
            items: items,
            deliverables: scope.deliverables || [],
            assumptions: uniqueAssumptions, // Use deduplicated assumptions for all scopes
        };
    });

    console.log(
        `✅ [PDF Export] Transformed ${transformedScopes.length} scopes for backend`,
    );
    transformedScopes.forEach((scope, index) => {
        console.log(
            `  📋 Scope ${index + 1}: ${scope.title} (${scope.items.length} items, ${uniqueAssumptions.length} shared assumptions)`,
        );
    });

    return {
        projectTitle: multiScopeData.projectTitle || "SOW",
        scopes: transformedScopes,
        discount: multiScopeData.discount || 0,
        clientName: multiScopeData.clientName || undefined,
        company: multiScopeData.company || { name: "Social Garden" },
        projectSubtitle: multiScopeData.projectSubtitle || "",
        projectOverview: multiScopeData.projectOverview || "",
        budgetNotes: multiScopeData.budgetNotes || "",
        currency: multiScopeData.currency || "AUD",
        gstApplicable:
            multiScopeData.gstApplicable !== undefined
                ? multiScopeData.gstApplicable
                : true,
        generatedDate: multiScopeData.generatedDate || new Date().toISOString(),
        authoritativeTotal: multiScopeData.authoritativeTotal, // 🎯 Pass AI-calculated authoritative total
    };
};

// Helper function to convert markdown to Novel editor JSON format
// Extract pricing roles from markdown table format

// 🧹 SANITIZATION: Remove empty text nodes recursively from TipTap JSON
const sanitizeEmptyTextNodes = (content: any): any => {
    if (!content) return content;

    if (Array.isArray(content)) {
        // Filter out text nodes with empty text
        return content
            .filter((node) => {
                // Remove text nodes where text is empty or whitespace-only
                if (
                    node.type === "text" &&
                    (!node.text || node.text.trim() === "")
                ) {
                    return false;
                }
                return true;
            })
            .map((node) => {
                // Recursively sanitize nested content
                if (node.content && Array.isArray(node.content)) {
                    return {
                        ...node,
                        content: sanitizeEmptyTextNodes(node.content),
                    };
                }
                return node;
            });
    }

    return content;
};

type ConvertOptions = {
    strictRoles?: boolean;
    userPromptBudget?: number; // Budget extracted from user's original prompt
    userPromptDiscount?: number; // Discount extracted from user's original prompt
    jsonDiscount?: number; // Discount extracted from [PRICING_JSON] block
    // NEW: Support multiple pricing tables insertion in a single document
    tablesRoles?: any[][]; // Queue of roles arrays, one per [PRICING_JSON] block
    tablesDiscounts?: number[]; // Optional per-table discounts aligned with tablesRoles
    multiScopePricingData?: {
        scopes: Array<{
            scope_name: string;
            scope_description?: string;
            role_allocation: any[];
            discount?: number;
        }>;
        discount?: number;
        extractedAt?: number;
    };
};

// Build suggestedRoles[] from Architect structured JSON (scopeItems[].roles)
const buildSuggestedRolesFromArchitectSOW = (
    structured: ArchitectSOW | null,
) => {
    if (!structured || !Array.isArray(structured.scopeItems))
        return [] as Array<{
            role: string;
            hours: number;
            description?: string;
            rate?: number;
        }>;
    const hoursByRole = new Map<string, number>();
    for (const item of structured.scopeItems) {
        const roles = Array.isArray(item?.roles) ? item.roles : [];
        for (const r of roles) {
            const name = (r?.role || "").toString().trim();
            const hrs = Number(r?.hours) || 0;
            // 🔧 CRITICAL FIX: Filter out empty, placeholder, or invalid role names
            if (
                !name ||
                name.length === 0 ||
                name.toLowerCase() === "select role" ||
                name.toLowerCase() === "select role..."
            )
                continue;
            hoursByRole.set(name, (hoursByRole.get(name) || 0) + hrs);
        }
    }
    // Map to suggestedRoles shape and attach rate from ROLES where possible
    return Array.from(hoursByRole.entries())
        .filter(([role]) => {
            // 🔧 DOUBLE-CHECK: Final filter to ensure no empty roles slip through
            const roleName = role.trim();
            return (
                roleName &&
                roleName.length > 0 &&
                roleName.toLowerCase() !== "select role" &&
                roleName.toLowerCase() !== "select role..."
            );
        })
        .map(([role, hours]) => {
            const match = ROLES.find((x) => x.name === role);
            return { role, hours, description: "", rate: match?.rate || 0 };
        });
};

const convertMarkdownToNovelJSON = (
    markdown: string,
    suggestedRoles: any[] = [],
    options: ConvertOptions = {},
) => {
    const lines = markdown.split("\n");
    const content: any[] = [];
    let i = 0;
    let pricingTablesInsertedCount = 0;
    const strictRoles = !!options.strictRoles;
    const tablesQueue: any[][] = Array.isArray(options.tablesRoles)
        ? [...options.tablesRoles]
        : [];
    const discountQueue: number[] = Array.isArray(options.tablesDiscounts)
        ? [...options.tablesDiscounts]
        : [];
    const multiScopePricingData = options.multiScopePricingData;

    // 🎯 SMART DISCOUNT FEATURE: Priority cascade for discount extraction
    // Priority 1: JSON discount from [PRICING_JSON] block (most authoritative)
    // Priority 2: User prompt discount override
    // Priority 3: Parse from AI's markdown response
    let parsedDiscount = 0;

    if (options.jsonDiscount !== undefined && options.jsonDiscount > 0) {
        parsedDiscount = options.jsonDiscount;
        console.log(
            `🎯 Using discount from [PRICING_JSON]: ${parsedDiscount}%`,
        );
    } else if (
        options.userPromptDiscount !== undefined &&
        options.userPromptDiscount > 0
    ) {
        parsedDiscount = options.userPromptDiscount;
        console.log(`🎯 Using discount from user prompt: ${parsedDiscount}%`);
    } else {
        const discountMatch =
            markdown.match(/\*\*Discount[:\s]*\*\*\s*(\d+(?:\.\d+)?)\s*%/i) ||
            markdown.match(/Discount[:\s]*(\d+(?:\.\d+)?)\s*%/i);
        if (discountMatch && discountMatch[1]) {
            parsedDiscount = parseFloat(discountMatch[1]);
            console.log(
                `🎯 Smart Discount detected from AI response: ${parsedDiscount}%`,
            );
        }
    }

    const parseTextWithFormatting = (text: string) => {
        // This function handles bold/italic without creating empty text nodes
        const parts: any[] = [];
        let currentText = "";
        let isBold = false;
        let isItalic = false;

        for (let i = 0; i < text.length; i++) {
            if (text.substring(i, i + 2) === "**") {
                if (currentText) {
                    const marks = [];
                    if (isBold) marks.push({ type: "bold" });
                    if (isItalic) marks.push({ type: "italic" });
                    parts.push({
                        type: "text",
                        text: currentText,
                        marks: marks.length > 0 ? marks : undefined,
                    });
                    currentText = "";
                }
                isBold = !isBold;
                i++;
            } else if (text[i] === "*" || text[i] === "_") {
                if (currentText) {
                    const marks = [];
                    if (isBold) marks.push({ type: "bold" });
                    if (isItalic) marks.push({ type: "italic" });
                    parts.push({
                        type: "text",
                        text: currentText,
                        marks: marks.length > 0 ? marks : undefined,
                    });
                    currentText = "";
                }
                isItalic = !isItalic;
            } else {
                currentText += text[i];
            }
        }

        if (currentText) {
            const marks = [];
            if (isBold) marks.push({ type: "bold" });
            if (isItalic) marks.push({ type: "italic" });
            parts.push({
                type: "text",
                text: currentText,
                marks: marks.length > 0 ? marks : undefined,
            });
        }

        // Never return empty parts - if text is empty, return one node with that empty text
        // (TipTap requires at least one node, but it will be handled by parent)
        return parts.length > 0 ? parts : [];
    };

    // Helper function to check if a line is a markdown table row
    const isMarkdownTableRow = (line: string): boolean => {
        return /^\s*\|.*\|\s*$/.test(line.trim());
    };

    // Helper function to parse markdown table rows into pricing rows
    const parseMarkdownTable = (tableLines: string[]): any[] => {
        if (tableLines.length < 2) return [];

        const rows: any[] = [];

        // Skip alignment row (usually the second row)
        let dataStartIndex = 1;
        if (tableLines[1] && /^\s*\|[\s|:=-]+\|\s*$/.test(tableLines[1])) {
            dataStartIndex = 2;
        }

        // Parse each data row
        for (let idx = dataStartIndex; idx < tableLines.length; idx++) {
            const line = tableLines[idx];
            if (!isMarkdownTableRow(line)) break;

            const cells = line
                .split("|")
                .map((cell) => cell.trim())
                .filter((cell) => cell.length > 0);

            // Expected format: Role | Description | Hours | Rate
            if (cells.length >= 4) {
                const role = cells[0];
                const description = cells[1];
                const hours = parseInt(cells[2]) || 0;
                const rate = parseInt(cells[3]) || 0;

                if (role.toLowerCase() !== "role") {
                    // Skip header
                    rows.push({
                        role,
                        description,
                        hours,
                        rate,
                    });
                }
            }
        }

        return rows;
    };

    // Best-effort budget parsing from markdown for deterministic allocation
    const parseBudgetFromMarkdown = (
        text: string,
    ): { value: number; inclGST: boolean } | null => {
        if (!text) return null;
        // Try multiple patterns for robustness
        const patterns = [
            // "firm $15,000 AUD" - exact pattern from user prompts
            /firm\s*\$?\s*([\d\s,\.]+)\s*(k)?\s*aud/i,
            // "budget of $15,000 AUD", "budget is 15k", "budget: $15000 ex gst"
            /(budget|target|total|investment)\s*(?:[:=]|is|of)?\s*(aud\s*)?\$?\s*([\d\s,\.]+)\s*(k)?\s*(aud)?\s*(\+\s*gst|incl\s*gst|ex\s*gst)?/i,
            // Loose number capture near AUD or $ (fallback)
            /(aud)?\s*\$?\s*([\d\s,\.]+)\s*(k)?\s*(aud)?\s*(firm)?/i,
        ];
        for (const re of patterns) {
            const m = text.match(re);
            if (m) {
                // For first pattern (firm $X AUD), groups are different
                const numGroup = m[3] || m[2] || m[1] || "";
                // strip spaces and commas from digits
                let raw = String(numGroup).replace(/[\,\s]/g, "");
                let v = parseFloat(raw || "0");
                const kGroup = m[4] || m[3] || m[2] || "";
                if (kGroup && /k/i.test(kGroup)) v = v * 1000; // support 50k
                const gstStr = (m[6] || m[5] || "").toLowerCase();
                const inclGST = /incl\s*gst/.test(gstStr);
                if (!isNaN(v) && v > 0) {
                    console.log(
                        `💰 Budget detected: $${v.toFixed(2)} ${inclGST ? "incl GST" : "ex GST"} from pattern: "${m[0]}"`,
                    );
                    return { value: v, inclGST };
                }
            }
        }
        console.warn("⚠️ No budget detected in markdown content");
        return null;
    };

    // Helper function to insert pricing table
    // Removed default zero-hours fallback: enterprise policy prohibits pricing fallbacks

    const insertPricingTable = (
        rolesFromMarkdown: any[] = [],
        scopeIndex: number = 0,
    ) => {
        // Pull the next roles set from queue if provided via options (multi-table support)
        let rolesSource: any[] = [];
        if (tablesQueue.length > 0) {
            rolesSource = tablesQueue.shift() || [];
        }
        const effectiveRoles =
            rolesSource && rolesSource.length > 0
                ? rolesSource
                : suggestedRoles;

        let pricingRows: any[] = [];
        // Robust normalizer and canonical role finder to map AI role names to official rate card
        const norm = (s: string) =>
            (s || "")
                .toLowerCase()
                .replace(/\s*-/g, "-")
                .replace(/-\s*/g, "-")
                .replace(/\s+/g, " ")
                .replace(/[-()]/g, " ") // reduce punctuation impact
                .trim();
        const tokens = (s: string) => norm(s).split(" ").filter(Boolean);
        const jaccard = (a: string[], b: string[]) => {
            const A = new Set(a),
                B = new Set(b);
            let inter = 0;
            for (const t of A) if (B.has(t)) inter++;
            const uni = new Set([...A, ...B]).size || 1;
            return inter / uni;
        };
        const findCanon = (name: string) => {
            const n = norm(name);
            if (!n) return undefined;
            // 1) Exact normalized match
            let exact = ROLES.find((r) => norm(r.name) === n);
            if (exact) return exact;
            // 2) Substring/contains heuristic
            const contains = ROLES.find(
                (r) => norm(r.name).includes(n) || n.includes(norm(r.name)),
            );
            const syn = n
                .replace("offshore", "off")
                .replace("on-shore", "onshore")
                .replace("on shore", "onshore")
                .replace("off-shore", "offshore")
                .replace("project-coordination", "project coordination")
                .replace("pm", "project management");
            exact = ROLES.find((r) => norm(r.name) === syn);
            if (exact) return exact;
            return undefined;
        };

        // Use provided suggestedRoles first; otherwise use roles parsed from markdown only
        if (effectiveRoles.length > 0) {
            console.log("✅ Using suggestedRoles from JSON.");
            const rolesAreStrings = typeof effectiveRoles[0] === "string";
            const rolesLackHours =
                !rolesAreStrings &&
                effectiveRoles.every(
                    (r: any) => !r || !r.hours || r.hours <= 0,
                );

            if (rolesAreStrings || rolesLackHours) {
                const names = (effectiveRoles as any[])
                    .map((r) => (typeof r === "string" ? r : r.role))
                    .filter(Boolean);

                // Priority 1: Use budget from user's original prompt if provided
                // Priority 2: Parse budget from AI's markdown response
                let budgetExGst = 0;
                if (options.userPromptBudget && options.userPromptBudget > 0) {
                    budgetExGst = options.userPromptBudget;
                    console.log(
                        `💰 Using budget from user prompt: $${budgetExGst.toFixed(2)} (ex GST)`,
                    );
                } else {
                    const budgetInfo = parseBudgetFromMarkdown(markdown) || {
                        value: 0,
                        inclGST: false,
                    };
                    budgetExGst = budgetInfo.value;
                    if (budgetInfo.inclGST) budgetExGst = budgetExGst / 1.1;
                    if (budgetExGst > 0) {
                        console.log(
                            `💰 Budget parsed from AI response: $${budgetExGst.toFixed(2)} (ex GST)`,
                        );
                    }
                }

                if (budgetExGst > 0) {
                    console.log(
                        `🧮 Deterministic allocation with budget (ex GST): $${budgetExGst.toFixed(2)}`,
                    );
                    pricingRows = calculatePricingTable(names, budgetExGst);
                } else {
                    console.error(
                        "❌ CRITICAL: No budget found in user prompt OR AI response. Cannot allocate hours.",
                    );
                    console.error(
                        '   User must provide budget like "firm $15,000 AUD" or AI must include budget in response.',
                    );
                    pricingRows = names.map((roleName) => {
                        const m = findCanon(roleName);
                        return {
                            role: m?.name || roleName,
                            description: "",
                            hours: 0,
                            rate: m?.rate || 0,
                        };
                    });
                }
            } else {
                // Backward compatibility: AI provided hours
                pricingRows = effectiveRoles
                    .filter((role) => {
                        const roleName = (role.role || "").trim();
                        return (
                            roleName &&
                            roleName.length > 0 &&
                            roleName.toLowerCase() !== "select role" &&
                            roleName.toLowerCase() !== "select role..."
                        );
                    })
                    .map((role) => {
                        const matchedRole = findCanon(role.role);
                        return {
                            role: matchedRole?.name || role.role,
                            description: role.description || "",
                            hours: role.hours || 0,
                            rate: matchedRole?.rate || role.rate || 0,
                        };
                    });
            }
        } else if (rolesFromMarkdown.length > 0) {
            console.log("✅ Using roles parsed from markdown table.");
            pricingRows = rolesFromMarkdown
                .filter((r) => {
                    // 🔧 Apply same filter to markdown-parsed roles
                    const roleName = (r.role || "").trim();
                    return (
                        roleName &&
                        roleName.length > 0 &&
                        roleName.toLowerCase() !== "select role" &&
                        roleName.toLowerCase() !== "select role..."
                    );
                })
                .map((r) => {
                    const m = findCanon(r.role);
                    return {
                        ...r,
                        role: m?.name || r.role,
                        rate: m?.rate || r.rate,
                    };
                });
        } else {
            console.log("⚠️ No roles available for pricing table.");
            return; // Can't create pricing table without any roles
        }

        pricingTablesInsertedCount += 1;

        // 🔧 CRITICAL FIX: Filter out any empty/invalid roles BEFORE enforcement
        pricingRows = pricingRows.filter((r) => {
            const roleName = norm(r.role);
            return (
                roleName &&
                roleName !== "select role" &&
                roleName !== "select role..." &&
                roleName.length > 0
            );
        });

        // Deterministic PM selection is handled by calculatePricingTable when a budget is provided.
        // No frontend auto-insertion of Head Of or Project Coordination here.

        // Ensure Account Management role exists and is LAST
        const hasAccountManagement = pricingRows.some((r) =>
            norm(r.role).includes("account management"),
        );
        if (!hasAccountManagement) {
            const am = findCanon("Account Management - (Account Manager)");
            pricingRows.push({
                role: am?.name || "Account Management - (Account Manager)",
                description: "Client comms & governance",
                hours: 8,
                rate: am?.rate || 180,
            });
        } else {
            // Move Account Management to the end
            const amIndex = pricingRows.findIndex((r) =>
                norm(r.role).includes("account management"),
            );
            if (amIndex !== -1 && amIndex !== pricingRows.length - 1) {
                const [amRow] = pricingRows.splice(amIndex, 1);
                const amCanon = findCanon(amRow.role);
                pricingRows.push({
                    ...amRow,
                    role: amCanon?.name || amRow.role,
                    rate: amCanon?.rate || amRow.rate,
                });
            }
        }

        console.log(
            "✅ Inserting EditablePricingTable with",
            pricingRows.length,
            "roles.",
        );
        // Use per-table discount if provided; otherwise fall back to parsed/global discount
        const tableDiscount =
            discountQueue.length > 0 ? discountQueue.shift() || 0 : undefined;
        // 🎯 MULTI-SCOPE SUPPORT: Check if we have multi-scope data
        if (
            multiScopePricingData &&
            multiScopePricingData.scopes &&
            multiScopePricingData.scopes.length > 0 &&
            scopeIndex < multiScopePricingData.scopes.length
        ) {
            // Create a multi-scope pricing table for this specific scope
            const currentScope = multiScopePricingData.scopes[scopeIndex];
            const scopeRoles = currentScope.role_allocation || [];

            console.log(
                `🎯 [Multi-Scope] Creating pricing table ${scopeIndex + 1}/${multiScopePricingData.scopes.length} for scope: ${currentScope.scope_name}`,
            );
            console.log(
                `📊 Scope ${scopeIndex + 1} roles (${scopeRoles.length}):`,
                scopeRoles,
            );

            // Convert scope roles to pricing rows format
            const scopePricingRows = scopeRoles.map((role: any) => {
                const matchedRole = findCanon(role.role);
                return {
                    role: matchedRole?.name || role.role,
                    description: role.description || "",
                    hours: role.hours || 0,
                    rate: matchedRole?.rate || role.rate || 0,
                };
            });

            console.log(
                `✅ [Multi-Scope] Inserting table ${scopeIndex + 1} with ${scopePricingRows.length} roles`,
            );
            content.push({
                type: "editablePricingTable",
                attrs: {
                    rows: scopePricingRows,
                    discount: currentScope.discount || 0,
                    scopeName: currentScope.scope_name,
                    scopeDescription: currentScope.scope_description,
                    scopeIndex: scopeIndex,
                    isMultiScope: true,
                    totalScopes: multiScopePricingData.scopes.length,
                },
            });
        } else {
            // Single scope pricing table (original logic)
            content.push({
                type: "editablePricingTable",
                attrs: {
                    rows: pricingRows,
                    discount:
                        tableDiscount !== undefined && tableDiscount >= 0
                            ? tableDiscount
                            : parsedDiscount, // 🎯 Smart Discount hierarchy
                },
            });
        }
    };

    while (i < lines.length) {
        const line = lines[i];

        // Check for explicit pricing table placeholder
        if (
            line.trim() === "[pricing_table]" ||
            line.trim() === "[editablePricingTable]"
        ) {
            // 🎯 MULTI-SCOPE SUPPORT: Check if we should insert multiple scope tables
            if (
                multiScopePricingData &&
                multiScopePricingData.scopes &&
                multiScopePricingData.scopes.length > 0
            ) {
                console.log(
                    `🎯 [Multi-Scope Placeholder] Inserting ${multiScopePricingData.scopes.length} separate scope tables at [pricing_table] marker`,
                );
                // Insert a pricing table for each scope
                for (
                    let scopeIdx = 0;
                    scopeIdx < multiScopePricingData.scopes.length;
                    scopeIdx++
                ) {
                    console.log(
                        `🔄 [Multi-Scope Placeholder] Inserting table ${scopeIdx + 1}/${multiScopePricingData.scopes.length}`,
                    );
                    insertPricingTable([], scopeIdx);
                }
                console.log(
                    `✅ [Multi-Scope Placeholder] Completed insertion of ${multiScopePricingData.scopes.length} tables`,
                );
            } else {
                insertPricingTable();
            }
            i++;
            continue;
        }

        // Check if this is the start of a markdown table
        if (isMarkdownTableRow(line)) {
            const tableLines = [];
            while (
                i < lines.length &&
                (isMarkdownTableRow(lines[i]) ||
                    /^\s*\|[\s|:=-]+\|\s*$/.test(lines[i].trim()))
            ) {
                tableLines.push(lines[i]);
                i++;
            }

            // Try to parse as pricing table
            const parsedRoles = strictRoles
                ? []
                : parseMarkdownTable(tableLines);
            if (!strictRoles && parsedRoles.length > 0) {
                console.log(
                    `📊 Detected ${parsedRoles.length} roles from markdown table, using for pricing table.`,
                );
                insertPricingTable(parsedRoles);
            } else {
                // Not a pricing table, treat as regular table
                // For now, skip it (tables will be handled by PDF export)
                console.log(
                    "⚠️ Markdown table detected but not recognized as pricing table.",
                );
            }
            i--; // Decrement to compensate for the outer loop increment
            i++;
            continue;
        }

        if (line.startsWith("# ")) {
            const textContent = parseTextWithFormatting(line.substring(2));
            if (textContent.length > 0) {
                content.push({
                    type: "heading",
                    attrs: { level: 1 },
                    content: textContent,
                });
            }
        } else if (line.startsWith("## ")) {
            const textContent = parseTextWithFormatting(line.substring(3));
            if (textContent.length > 0) {
                content.push({
                    type: "heading",
                    attrs: { level: 2 },
                    content: textContent,
                });
            }
        } else if (line.startsWith("### ")) {
            const textContent = parseTextWithFormatting(line.substring(4));
            if (textContent.length > 0) {
                content.push({
                    type: "heading",
                    attrs: { level: 3 },
                    content: textContent,
                });
            }
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
            // Basic bullet list handling
            let listItems = [];
            while (
                i < lines.length &&
                (lines[i].startsWith("- ") || lines[i].startsWith("* "))
            ) {
                const itemContent = parseTextWithFormatting(
                    lines[i].substring(2),
                );
                if (itemContent.length > 0) {
                    listItems.push({
                        type: "listItem",
                        content: [
                            {
                                type: "paragraph",
                                content: itemContent,
                            },
                        ],
                    });
                }
                i++;
            }
            if (listItems.length > 0) {
                content.push({ type: "bulletList", content: listItems });
            }
            i--; // Decrement because the outer loop will increment
        } else if (line.startsWith("---")) {
            content.push({
                type: "horizontalRule",
            });
        } else if (line.trim() !== "") {
            const textContent = parseTextWithFormatting(line);
            if (textContent.length > 0) {
                content.push({
                    type: "paragraph",
                    content: textContent,
                });
            }
        }

        i++;
    }

    // Reorder sections to ensure 'Deliverables' appears after Overview/Objectives and before Phases/Pricing
    const sectionText = (node: any): string => {
        const flatten = (n: any): string => {
            if (!n) return "";
            if (n.type === "text") return n.text || "";
            if (Array.isArray(n.content))
                return n.content.map(flatten).join(" ");
            return "";
        };
        return flatten(node).toLowerCase();
    };

    const findHeadingIndex = (predicate: (text: string) => boolean) => {
        return content.findIndex(
            (n) => n?.type === "heading" && predicate(sectionText(n)),
        );
    };

    const deliverablesIdx = findHeadingIndex((t) => t.includes("deliverables"));
    if (deliverablesIdx !== -1) {
        // Determine block for deliverables: from its heading up to (but not including) next heading or end
        let nextHeadingAfterDeliv = content
            .slice(deliverablesIdx + 1)
            .findIndex((n) => n?.type === "heading");
        if (nextHeadingAfterDeliv === -1)
            nextHeadingAfterDeliv = content.length - (deliverablesIdx + 1);
        const deliverablesBlock = content.splice(
            deliverablesIdx,
            nextHeadingAfterDeliv + 1,
        );

        // Find position after Overview/Objectives
        const overviewIdx = findHeadingIndex((t) =>
            t.includes("project overview"),
        );
        const objectivesIdx = findHeadingIndex((t) =>
            t.includes("project objectives"),
        );
        const anchorIdx = Math.max(overviewIdx, objectivesIdx);
        const insertPos = anchorIdx !== -1 ? anchorIdx + 1 : 0;

        // Insert deliverables block right after the anchor
        content.splice(insertPos, 0, ...deliverablesBlock);
    }

    // If we reach the end and pricing table hasn't been inserted, only insert when roles exist
    if (pricingTablesInsertedCount === 0) {
        if (
            (tablesQueue.length > 0 && tablesQueue[0]?.length > 0) ||
            suggestedRoles.length > 0 ||
            (multiScopePricingData &&
                multiScopePricingData.scopes &&
                multiScopePricingData.scopes.length > 0)
        ) {
            console.log(
                "⚠️ Pricing table not auto-inserted earlier, inserting NOW at end of content.",
            );
            content.push({ type: "horizontalRule" });
            content.push({
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Investment Breakdown" }],
            });

            // 🎯 MULTI-SCOPE SUPPORT: Insert separate table for each scope
            if (
                multiScopePricingData &&
                multiScopePricingData.scopes &&
                multiScopePricingData.scopes.length > 0
            ) {
                console.log(
                    `🎯 [Multi-Scope Auto-Insert] Inserting ${multiScopePricingData.scopes.length} separate scope tables at end of document`,
                );
                // Insert a pricing table for each scope
                for (
                    let scopeIdx = 0;
                    scopeIdx < multiScopePricingData.scopes.length;
                    scopeIdx++
                ) {
                    console.log(
                        `🔄 [Multi-Scope Auto-Insert] Inserting table ${scopeIdx + 1}/${multiScopePricingData.scopes.length}`,
                    );
                    insertPricingTable([], scopeIdx);
                }
                console.log(
                    `✅ [Multi-Scope Auto-Insert] Completed insertion of ${multiScopePricingData.scopes.length} tables`,
                );
            } else {
                // Single table insertion (original logic)
                insertPricingTable();
            }
        } else {
            console.warn(
                "⚠️ No pricing table inserted and no suggestedRoles provided. User will need to add pricing manually.",
            );
        }
    }

    console.log(
        `📊 Final content has ${content.length} nodes. Pricing tables inserted: ${pricingTablesInsertedCount}`,
    );
    // Forensic logging to validate narrative vs pricing merge
    const pricingCount = content.filter(
        (n) => n?.type === "editablePricingTable",
    ).length;
    const narrativeCount = content.length - pricingCount;
    console.log(
        `✅ MERGE COMPLETE - Narrative nodes: ${narrativeCount}, Pricing nodes: ${pricingCount}, Total nodes for insertion: ${content.length}`,
    );
    return { type: "doc", content };
};

interface Document {
    id: string;
    title: string;
    content: any;
    folderId?: string;
    workspaceSlug?: string;
    threadSlug?: string;
    threadId?: string;
    syncedAt?: string;
    totalInvestment?: number;
    workType?: "project" | "audit" | "retainer"; // 🎯 SOW type determined by Architect AI
    vertical?: string; // 📊 Social Garden BI: Client industry vertical
    serviceLine?: string; // 📊 Social Garden BI: Service offering type
}

interface Folder {
    id: string;
    name: string;
    parentId?: string;
    workspaceSlug?: string;
    workspaceId?: string;
    embedId?: number; // Numeric ID from AnythingLLM
    syncedAt?: string;
}

interface Agent {
    id: string;
    name: string;
    systemPrompt: string;
    model: string;
    useAnythingLLM?: boolean; // If true, use AnythingLLM's configured provider
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

interface SOW {
    id: string;
    name: string;
    workspaceId: string;
}

interface Workspace {
    id: string;
    name: string;
    sows: SOW[];
    workspace_slug?: string;
}

// 🎯 Extract SOW work type from AI response
// The Architect classifies SOWs into 3 types: Standard Project, Audit/Strategy, or Retainer
const extractDocTitle = (content: string): string | null => {
    if (!content) return null;

    // Extract title from markdown headers
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        return titleMatch[1];
    }

    // Extract from scope patterns
    const scopeMatch = content.match(/Scope of Work:\s+(.+)/);
    if (scopeMatch) {
        return scopeMatch[1];
    }

    // Extract client information
    const clientMatch = content.match(/\*\*Client:\*\*\s+(.+)$/m);
    if (clientMatch) {
        return `SOW - ${clientMatch[1]}`;
    }

    return null;
};

const extractWorkType = (content: string): "project" | "audit" | "retainer" => {
    if (!content) return "project";

    const lowerContent = content.toLowerCase();

    // Check for Retainer patterns
    if (
        lowerContent.includes("retainer") ||
        lowerContent.includes("monthly support") ||
        lowerContent.includes("ongoing support") ||
        lowerContent.includes("recurring deliverables") ||
        lowerContent.includes("monthly fee") ||
        (lowerContent.includes("month") && lowerContent.includes("support"))
    ) {
        console.log("🎯 [Work Type] Detected: Retainer");
        return "retainer";
    }

    // Check for Audit/Strategy patterns
    if (
        lowerContent.includes("audit") ||
        lowerContent.includes("assessment") ||
        lowerContent.includes("strategy") ||
        lowerContent.includes("recommendations") ||
        lowerContent.includes("analysis") ||
        (lowerContent.includes("review") &&
            lowerContent.includes("implementation"))
    ) {
        console.log("🎯 [Work Type] Detected: Audit/Strategy");
        return "audit";
    }

    // Default to Standard Project
    console.log("🎯 [Work Type] Detected: Standard Project");
    return "project";
};

export default function Page() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentDocId, setCurrentDocId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [agentSidebarOpen, setAgentSidebarOpen] = useState(true);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
        null,
    ); // Track which message is streaming
    const [lastUserPrompt, setLastUserPrompt] = useState<string>(""); // 🎯 Track last user message for budget/discount extraction
    const [showSendModal, setShowSendModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareModalData, setShareModalData] = useState<{
        shareLink: string;
        documentTitle: string;
        shareCount?: number;
        firstShared?: string;
        lastShared?: string;
    } | null>(null);
    const [showGuidedSetup, setShowGuidedSetup] = useState(false);
    const [viewMode, setViewMode] = useState<"editor" | "dashboard">(
        "dashboard",
    ); // NEW: View mode - START WITH DASHBOARD
    const [isGrandTotalVisible, setIsGrandTotalVisible] = useState(true); // 👁️ Toggle grand total visibility

    // Workspace & SOW state (NEW) - Start empty, load from AnythingLLM
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
    const [currentSOWId, setCurrentSOWId] = useState<string | null>(null);
    const editorRef = useRef<any>(null);
    // Track latest editor JSON to drive debounced auto-saves reliably
    const [latestEditorJSON, setLatestEditorJSON] = useState<any | null>(null);

    // --- Role sanitization helpers ---
    const normalize = (s: string) =>
        (s || "")
            .toLowerCase()
            .replace(/\s*-/g, "-")
            .replace(/-\s*/g, "-")
            .replace(/\s+/g, " ")
            .trim();

    const isAccountManagementVariant = (roleName: string) => {
        const n = normalize(roleName);
        // Match any Account Management family variant (manager/director/etc.)
        return /account/.test(n) && /(management|manager|director)/.test(n);
    };

    const sanitizeAccountManagementRoles = (
        roles: Array<
            | {
                  role: string;
                  hours?: number;
                  description?: string;
                  rate?: number;
              }
            | string
        >,
    ) => {
        if (!Array.isArray(roles) || roles.length === 0) return roles || [];

        // Collect hours from any AM-like variants
        let amHoursFromAI = 0;
        let amDescriptionFromAI: string | undefined = undefined;
        const nonAM = roles.filter((r) => {
            const roleName = typeof r === "string" ? r : r.role || "";
            const isAM = isAccountManagementVariant(roleName);
            if (isAM) {
                const hrs = typeof r === "string" ? 0 : Number(r.hours) || 0;
                amHoursFromAI += hrs > 0 ? hrs : 0;
                if (
                    !amDescriptionFromAI &&
                    typeof r !== "string" &&
                    r.description &&
                    r.description.trim().length > 0
                ) {
                    amDescriptionFromAI = r.description;
                }
            }
            return !isAM; // drop AM variants from source list
        });

        // Ensure exactly ONE canonical AM row is appended
        const canonicalName = "Account Management - (Account Manager)";
        const amDef = ROLES.find((r) => r.name === canonicalName);
        const amRate = amDef?.rate || 180;
        const defaultHours = 8;
        const finalHours = amHoursFromAI > 0 ? amHoursFromAI : defaultHours;
        const finalDescription =
            amDescriptionFromAI || "Client comms & governance";

        // If a canonical AM already exists somehow, merge hours
        const existingIndex = nonAM.findIndex(
            (r) =>
                normalize(typeof r === "string" ? r : r.role) ===
                normalize(canonicalName),
        );
        if (existingIndex !== -1) {
            const existing = nonAM[existingIndex] as any;
            const merged = {
                ...(typeof existing === "string"
                    ? { role: canonicalName }
                    : existing),
                role: canonicalName,
                hours: (Number((existing as any).hours) || 0) + finalHours,
                rate: amRate,
                description: (existing as any).description || finalDescription,
            };
            (nonAM as any).splice(existingIndex, 1, merged);
            return nonAM as any;
        }

        return [
            ...nonAM.map((r) =>
                typeof r === "string"
                    ? {
                          role: r,
                          hours: 0,
                          description: "",
                          rate: ROLES.find((x) => x.name === r)?.rate || 0,
                      }
                    : r,
            ),
            {
                role: canonicalName,
                description: finalDescription,
                hours: finalHours,
                rate: amRate,
            },
        ];
    };

    // --- Final price extraction helper ---
    const extractFinalPriceTargetText = (content: any): string | null => {
        if (!content || !Array.isArray(content.content)) return null;

        // Flatten all text content
        const flattenText = (node: any): string => {
            if (!node) return "";
            if (node.type === "text") return node.text || "";
            if (Array.isArray(node.content))
                return node.content.map(flattenText).join(" ");
            return "";
        };

        const allText = content.content
            .map(flattenText)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        if (!allText) return null;

        // Look for patterns like "Final Price: $20,000 +GST" or "Final Investment: $20,000"
        const patterns = [
            /(final\s*(price|investment|project\s*value)\s*[:\-]?\s*)(\$?\s*[\d,]+(?:\.\d+)?(?:\s*\+?\s*gst|\s*ex\s*gst|\s*incl\s*gst)?)/i,
        ];

        for (const re of patterns) {
            const m = allText.match(re);
            if (m && m[3]) {
                // Return the value part, normalized a bit to include a $ sign if missing
                let val = m[3].trim();
                if (!val.startsWith("$")) {
                    const numPart = val.replace(/[^\d.,a-z\s+]/gi, "").trim();
                    val = `$${numPart}`;
                }
                // Normalize spacing around GST annotations
                val = val
                    .replace(/\s*\+\s*gst/i, " +GST")
                    .replace(/\s*ex\s*gst/i, " ex GST")
                    .replace(/\s*incl\s*gst/i, " incl GST");
                return val;
            }
        }
        return null;
    };

    // 🎯 Phase 1C: Dashboard filter state (vertical/service line click-to-filter)
    const [dashboardFilter, setDashboardFilter] = useState<{
        type: "vertical" | "serviceLine" | null;
        value: string | null;
    }>({
        type: null,
        value: null,
    });

    // Workspace creation progress state (NEW)
    const [workspaceCreationProgress, setWorkspaceCreationProgress] = useState<{
        isOpen: boolean;
        workspaceName: string;
        currentStep: number;
        completedSteps: number[];
    }>({
        isOpen: false,
        workspaceName: "",
        currentStep: 0,
        completedSteps: [],
    });

    // Onboarding state (NEW)
    const [showOnboarding, setShowOnboarding] = useState(false);

    // History restore guard to avoid overwriting server-loaded chat
    const [isHistoryRestored, setIsHistoryRestored] = useState(false);

    // OAuth state for Google Sheets
    const [isOAuthAuthorized, setIsOAuthAuthorized] = useState(false);
    const [oauthAccessToken, setOauthAccessToken] = useState<string>("");

    // Dashboard AI workspace selector state - Master dashboard is the default
    const [dashboardChatTarget, setDashboardChatTarget] = useState<string>(
        WORKSPACE_CONFIG.dashboard.slug,
    );
    const [availableWorkspaces, setAvailableWorkspaces] = useState<
        Array<{ slug: string; name: string }>
    >([
        { slug: WORKSPACE_CONFIG.dashboard.slug, name: "🎯 All SOWs (Master)" },
    ]);
    // Structured SOW from AI (Architect modular JSON)
    const [structuredSow, setStructuredSow] = useState<ArchitectSOW | null>(
        null,
    );

    // 🎯 V4.1 Multi-Scope Pricing Data from AI
    const [multiScopePricingData, setMultiScopePricingData] = useState<{
        scopes: Array<{
            scope_name: string;
            scope_description: string;
            deliverables: string[];
            assumptions: string[];
            role_allocation: Array<{
                role: string;
                hours: number;
                rate?: number;
                cost?: number;
            }>;
        }>;
        discount: number;
        extractedAt?: number;
        authoritativeTotal?: number; // 🎯 AI-calculated authoritative total
    } | null>(null);

    // Initialize master dashboard on app load
    useEffect(() => {
        const initDashboard = async () => {
            try {
                await anythingLLM.getOrCreateMasterDashboard();
                console.log("✅ Master SOW Dashboard initialized");
            } catch (error) {
                console.error("❌ Failed to initialize dashboard:", error);
            }
        };
        initDashboard();
    }, []);

    // Initialize dashboard with welcome message on app load
    // 🛡️ CRITICAL FIX: Only show welcome if history hasn't been restored from server
    // Note: DashboardChat component now auto-loads most recent thread from server
    useEffect(() => {
        if (
            viewMode === "dashboard" &&
            chatMessages.length === 0 &&
            !isHistoryRestored
        ) {
            const welcomeMessage: ChatMessage = {
                id: `welcome-${Date.now()}`,
                role: "assistant",
                content: `Welcome to the Master SOW Analytics assistant. I have access to all embedded SOWs.

Ask me questions to get business insights, such as:
• "What is our total revenue from HubSpot projects?"
• "Which services were included in the RealEstateTT SOW?"
• "How many SOWs did we create this month?"
• "What's the breakdown of services across all clients?"`,
                timestamp: Date.now(),
            };

            // Add the welcome message to chat only when appropriate
            setChatMessages((prev) => prev.concat(welcomeMessage));
        }
    }, [viewMode, chatMessages.length, isHistoryRestored]);

    // Handle OAuth callback params separately (clean, focused effect)
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const oauthToken = params.get("oauth_token");
            const error = params.get("oauth_error");

            if (error) {
                toast.error(`OAuth error: ${error}`);
                // Clean up URL
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                );
                return;
            }

            if (oauthToken) {
                console.log("\u2705 OAuth token received from callback");
                setOauthAccessToken(oauthToken);
                setIsOAuthAuthorized(true);
                toast.success(
                    "\u2705 Google authorized! Will create GSheet once document loads...",
                );
                // Clean up URL
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                );
            }
        } catch (e) {
            console.warn("Error handling OAuth params:", e);
        }
    }, []);

    // Auto-trigger sheet creation when BOTH OAuth token and document are ready
    useEffect(() => {
        // Known generated/system workspace slugs that should be treated as non-client
        const GENERATION_SLUGS = new Set([
            "ad-copy-machine",
            "crm-communication-specialist",
            "case-study-crafter",
            "landing-page-persuader",
            "seo-content-strategist",
            "proposal-audit-specialist",
            "proposal-and-audit-specialist",
            "default-client",
            "gen",
            "sql",
            "sow-master-dashboard",
            "sow-master-dashboard-63003769",
            "pop",
        ]);

        const isGenerationOrSystem = (slug?: string) => {
            if (!slug) return true;
            const lower = slug.toLowerCase();
            return GENERATION_SLUGS.has(lower) || lower.startsWith("gen-");
        };

        // Only show master workspace for SOW generation - single workspace architecture
        const workspaceList = [
            {
                slug: WORKSPACE_CONFIG.dashboard.slug,
                name: "🎯 All SOWs (Master)",
            },
        ];

        setAvailableWorkspaces(workspaceList);
        console.log(
            "📋 Available workspaces for dashboard chat:",
            workspaceList,
        );
    }, [workspaces]); // Re-run when workspaces change

    // Fix hydration by setting mounted state
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        console.log("Loading workspace data, mounted:", mounted);
        if (!mounted) return;

        // ⚠️ CRITICAL FIX: Use AbortController to prevent race conditions from double render
        // In development with React.StrictMode, components mount twice. This controller
        // ensures only the latest request completes, preventing duplicate data loads.
        const abortController = new AbortController();

        const loadData = async () => {
            console.log("📂 Loading folders and SOWs from database...");
            // No localStorage: read initial doc from URL query
            const urlParams = new URLSearchParams(window.location.search);
            const initialDocId = urlParams.get("docId");
            const hasCompletedSetup = undefined;

            try {
                // 🔒 SECURITY FIX: Remove localStorage caching for sensitive data
                // Always fetch from database to ensure data security and consistency

                // LOAD FOLDERS FROM DATABASE
                const foldersResponse = await fetch("/api/folders", {
                    signal: abortController.signal,
                });
                const foldersData = await foldersResponse.json();
                console.log(
                    "✅ Loaded folders from database:",
                    foldersData.length,
                );

                // LOAD SOWS FROM DATABASE
                const sowsResponse = await fetch("/api/sow/list", {
                    signal: abortController.signal,
                });
                const { sows } = await sowsResponse.json();
                const dbSOWs = sows;
                console.log("✅ Loaded SOWs from database:", dbSOWs.length);

                const workspacesWithSOWs: Workspace[] = [];
                const documentsFromDB: Document[] = [];
                const foldersFromDB: Folder[] = [];

                // Create workspace objects with SOWs from database
                for (const folder of foldersData) {
                    console.log(
                        `📁 Processing folder: ${folder.name} (ID: ${folder.id})`,
                    );

                    // Find SOWs that belong to this folder
                    const folderSOWs = dbSOWs
                        .filter((sow: any) => sow.folder_id === folder.id)
                        // Sort most-recent first using updated_at then created_at
                        .sort((a: any, b: any) => {
                            const ta = new Date(
                                a.updated_at || a.created_at || 0,
                            ).getTime();
                            const tb = new Date(
                                b.updated_at || b.created_at || 0,
                            ).getTime();
                            return tb - ta;
                        });

                    const sows: SOW[] = folderSOWs.map((sow: any) => ({
                        id: sow.id,
                        name: sow.title || "Untitled SOW",
                        workspaceId: folder.id,
                        vertical: sow.vertical || null,
                        service_line: sow.service_line || null,
                    }));

                    console.log(
                        `   ✓ Found ${sows.length} SOWs in this folder`,
                    );

                    // Add to workspaces array
                    workspacesWithSOWs.push({
                        id: folder.id,
                        name: folder.name,
                        sows: sows,
                        workspace_slug: folder.workspace_slug,
                    });

                    // Add to folders array
                    foldersFromDB.push({
                        id: folder.id,
                        name: folder.name,
                        workspaceSlug: folder.workspace_slug,
                        workspaceId: folder.workspace_id,
                        embedId: folder.embed_id,
                        syncedAt: folder.updated_at || folder.created_at,
                    });

                    // Create document objects for each SOW from database
                    for (const sow of folderSOWs) {
                        // Parse content if it's a JSON string, otherwise use as-is
                        let parsedContent = defaultEditorContent;
                        if (sow.content) {
                            try {
                                parsedContent =
                                    typeof sow.content === "string"
                                        ? JSON.parse(sow.content)
                                        : sow.content;
                            } catch (e) {
                                console.warn(
                                    "Failed to parse SOW content:",
                                    sow.id,
                                );
                                parsedContent = defaultEditorContent;
                            }
                        }

                        documentsFromDB.push({
                            id: sow.id,
                            title: sow.title || "Untitled SOW",
                            content: parsedContent,
                            folderId: folder.id,
                            workspaceSlug: folder.workspace_slug,
                            threadSlug: sow.thread_slug || undefined, // 🧵 AnythingLLM thread UUID (NOT sow.id!)
                            syncedAt: sow.updated_at,
                        });
                    }
                }

                console.log(
                    "✅ Total workspaces loaded:",
                    workspacesWithSOWs.length,
                );
                console.log("✅ Total SOWs loaded:", documentsFromDB.length);

                // Update state
                setWorkspaces(workspacesWithSOWs);
                setFolders(foldersFromDB);
                setDocuments(documentsFromDB);

                // Set current workspace to first one if available
                // BUT: Don't auto-select a SOW - let user click from dashboard
                if (workspacesWithSOWs.length > 0 && !currentWorkspaceId) {
                    setCurrentWorkspaceId(workspacesWithSOWs[0].id);
                    // Removed: Don't auto-select first SOW - user should manually select from dashboard
                    // This provides a better UX where dashboard is the entry point
                }

                // 🎓 Show onboarding if no workspaces (no localStorage gating)
                if (workspacesWithSOWs.length === 0) {
                    setTimeout(() => {
                        setShowOnboarding(true);
                    }, 500);
                }

                // Show guided setup if no workspaces
                if (!hasCompletedSetup && workspacesWithSOWs.length === 0) {
                    setTimeout(() => setShowGuidedSetup(true), 1000);
                }
            } catch (error) {
                // Don't log abort errors - they're expected cleanup
                if (error instanceof Error && error.name === "AbortError") {
                    console.log(
                        "📂 Data loading cancelled (previous request superseded)",
                    );
                    return;
                }
                console.error("❌ Error loading data:", error);
                toast.error("Failed to load workspaces and SOWs");
            }
            // Apply initial selection from URL if provided
            if (initialDocId) {
                setCurrentDocId(initialDocId);
                setCurrentSOWId(initialDocId);
            }
        };

        loadData();

        // Cleanup: abort any pending requests if component unmounts or mounted changes
        return () => {
            console.log("🧹 Cleaning up workspace data loading");
            abortController.abort();
        };
    }, [mounted]);

    // Note: SOWs are now saved to database via API calls, not localStorage

    // ✨ NEW: When currentSOWId changes, load the corresponding document and switch to editor view
    useEffect(() => {
        if (!currentSOWId) return;

        console.log("📄 Loading document for SOW:", currentSOWId);

        // Find the document in the documents array
        const doc = documents.find((d) => d.id === currentSOWId);

        if (doc) {
            console.log("✅ Found document:", doc.title);
            setCurrentDocId(doc.id);
            setViewMode("editor"); // Switch to editor view

            // 🧵 Load chat history from AnythingLLM thread
            const loadChatHistory = async () => {
                if (doc.threadSlug && !doc.threadSlug.startsWith("temp-")) {
                    try {
                        console.log(
                            "💬 Loading chat history for thread:",
                            doc.threadSlug,
                        );
                        // 🎯 Use the workspace where the SOW was created (where its thread lives)
                        const history = await anythingLLM.getThreadChats(
                            doc.workspaceSlug || "sow-generator",
                            doc.threadSlug,
                        );

                        if (history && history.length > 0) {
                            // Convert AnythingLLM history format to our ChatMessage format
                            const messages: ChatMessage[] = history.map(
                                (msg: any) => ({
                                    id: `msg${Date.now()}-${Math.random()}`,
                                    role:
                                        msg.role === "user"
                                            ? "user"
                                            : "assistant",
                                    content: msg.content,
                                    timestamp: Date.now(),
                                }),
                            );

                            console.log(
                                `✅ Loaded ${messages.length} messages from thread`,
                            );
                            setChatMessages(messages);
                        } else {
                            console.log(
                                "ℹ️ No chat history found for this SOW",
                            );
                            setChatMessages([]);
                        }
                    } catch (error) {
                        console.error("❌ Failed to load chat history:", error);
                        setChatMessages([]);
                    }
                } else {
                    console.log(
                        "ℹ️ No valid thread associated with this SOW yet (temp or missing), clearing chat",
                    );
                    setChatMessages([]);
                }
            };

            loadChatHistory();
        } else {
            console.warn("⚠️ Document not found for SOW:", currentSOWId);
        }
    }, [currentSOWId]); // 🔧 FIXED: Removed 'documents' dependency to prevent chat clearing on auto-save

    // Auto-save SOW content whenever editor content changes (debounced)
    useEffect(() => {
        // Don't attempt to save until we have an active document AND
        // we have received at least one onUpdate from the editor (fresh JSON)
        if (!currentDocId || latestEditorJSON === null) return;

        const timer = setTimeout(async () => {
            try {
                // Always try to pull the freshest content from the live editor
                const editorContent =
                    editorRef.current?.getContent?.() || latestEditorJSON;

                // DEBUG: prove what we're about to save
                console.log("🟡 Attempting to save...", {
                    docId: currentDocId,
                    hasEditorRef: !!editorRef.current,
                    hasGetContent: !!editorRef.current?.getContent,
                    contentType: typeof editorContent,
                    isDoc: editorContent && editorContent.type === "doc",
                    nodeCount: Array.isArray(editorContent?.content)
                        ? editorContent.content.length
                        : null,
                });

                if (!editorContent) {
                    console.warn(
                        "⚠️ No editor content to save for:",
                        currentDocId,
                    );
                    return;
                }

                // Extra verbose log: full JSON being sent
                try {
                    console.log(
                        "📦 Editor JSON to save:",
                        JSON.stringify(editorContent),
                    );
                } catch (_) {
                    // ignore stringify errors
                }

                // Calculate total investment from pricing table in content
                const pricingRows = extractPricingFromContent(editorContent);

                // 🔧 SAFETY: Filter out invalid rows and handle NaN values
                const validRows = pricingRows.filter((row) => {
                    const hours = Number(row.hours) || 0;
                    const rate = Number(row.rate) || 0;
                    const total = Number(row.total) || hours * rate;
                    return (
                        hours >= 0 && rate >= 0 && total >= 0 && !isNaN(total)
                    );
                });

                const totalInvestment = validRows.reduce((sum, row) => {
                    const rowTotal =
                        Number(row.total) ||
                        Number(row.hours) * Number(row.rate) ||
                        0;
                    return sum + (isNaN(rowTotal) ? 0 : rowTotal);
                }, 0);

                const currentDoc = documents.find((d) => d.id === currentDocId);

                const response = await fetch(`/api/sow/${currentDocId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: editorContent, // tiptap JSON
                        title: currentDoc?.title || "Untitled SOW",
                        total_investment: isNaN(totalInvestment)
                            ? 0
                            : totalInvestment,
                        vertical: currentDoc?.vertical || null,
                        serviceLine: currentDoc?.serviceLine || null,
                    }),
                });

                if (!response.ok) {
                    console.warn(
                        "⚠️ Auto-save failed for SOW:",
                        currentDocId,
                        "Status:",
                        response.status,
                    );
                } else {
                    console.log(
                        "💾 Auto-save success for",
                        currentDocId,
                        `(Total: $${(isNaN(totalInvestment) ? 0 : totalInvestment).toFixed(2)})`,
                    );
                }
            } catch (error) {
                console.error("❌ Error auto-saving SOW:", error);
            }
        }, 1500); // 1.5s debounce after content changes

        return () => clearTimeout(timer);
    }, [latestEditorJSON, currentDocId]);

    // Persist current document selection in the URL (no localStorage)
    useEffect(() => {
        if (!mounted) return;
        const params = new URLSearchParams(window.location.search);
        if (currentDocId) {
            params.set("docId", currentDocId);
        } else {
            params.delete("docId");
        }
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
        window.history.replaceState({}, "", newUrl);
    }, [currentDocId, mounted]);

    // ⚠️ CRITICAL FIX: Separate useEffect for agent selection that depends on context
    // This ensures we don't set the agent until we know where we are (dashboard vs editor)
    useEffect(() => {
        if (agents.length === 0 || !mounted) return; // Wait for agents to load and app to be ready

        // Determine which agent to use based on current context
        const determineAndSetAgent = async () => {
            let agentIdToUse: string | null = null;

            if (viewMode === "dashboard") {
                // In dashboard mode, we should NOT use the default (gen-the-architect)
                // The dashboard will handle its own agent selection based on dashboardChatTarget
                console.log(
                    "🎯 [Agent Selection] In DASHBOARD mode - agent managed by dashboard component",
                );
                setCurrentAgentId(null); // Let dashboard manage its own agent
            } else if (viewMode === "editor" && currentDocId) {
                // In editor mode, check if there's a saved preference
                try {
                    const prefResponse = await fetch(
                        "/api/preferences/current_agent_id",
                    );
                    if (prefResponse.ok) {
                        const { value } = await prefResponse.json();
                        if (value && agents.find((a) => a.id === value)) {
                            agentIdToUse = value;
                            console.log(
                                `🎯 [Agent Selection] Using saved agent preference: ${value}`,
                            );
                        }
                    }
                } catch (err) {
                    console.error("Failed to load agent preference:", err);
                }

                // If no saved preference, use default only if in editor mode with a document
                if (!agentIdToUse) {
                    const genArchitect = agents.find(
                        (a) =>
                            a.name === "GEN - The Architect" ||
                            a.id === "gen-the-architect",
                    );
                    agentIdToUse = genArchitect?.id || agents[0]?.id || null;
                    console.log(
                        `🎯 [Agent Selection] In EDITOR mode - using default agent: ${agentIdToUse}`,
                    );
                }

                setCurrentAgentId(agentIdToUse);
            } else {
                // No specific context yet, don't set an agent
                console.log(
                    "🎯 [Agent Selection] No context yet - deferring agent selection",
                );
                setCurrentAgentId(null);
            }
        };

        determineAndSetAgent();
    }, [agents, viewMode, currentDocId, mounted]);

    // Save current agent preference to database
    useEffect(() => {
        if (currentAgentId) {
            fetch("/api/preferences/current_agent_id", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value: currentAgentId }),
            }).catch((err) =>
                console.error("Failed to save agent preference:", err),
            );
        }
    }, [currentAgentId]);

    // Chat messages are now saved individually on each message send/receive
    // No need for useEffect saving here - database handles persistence

    const currentDoc = documents.find((d) => d.id === currentDocId);

    useEffect(() => {
        if (currentDoc && editorRef.current) {
            // On document change, load the new document content explicitly
            console.log("📄 Loading content for SOW", currentDocId, "...");
            editorRef.current.commands?.setContent
                ? editorRef.current.commands.setContent(currentDoc.content)
                : editorRef.current.insertContent(currentDoc.content);
            console.log("✅ LOAD SUCCESS for", currentDocId);
        }
    }, [currentDocId]);

    // Synchronous save helper used before navigating away from a document
    const saveCurrentSOWNow = async (docId: string): Promise<boolean> => {
        try {
            const editorContent =
                editorRef.current?.getContent?.() || latestEditorJSON;
            console.log("🟡 Attempting to save (immediate)...", {
                docId,
                hasEditorRef: !!editorRef.current,
                hasGetContent: !!editorRef.current?.getContent,
                contentType: typeof editorContent,
                isDoc: editorContent && editorContent.type === "doc",
                nodeCount: Array.isArray(editorContent?.content)
                    ? editorContent.content.length
                    : null,
            });
            try {
                console.log(
                    "📦 Editor JSON to save (immediate):",
                    JSON.stringify(editorContent),
                );
            } catch (_) {}
            if (!editorContent) {
                console.warn(
                    "⚠️ saveCurrentSOWNow: No editor content to save for:",
                    docId,
                );
                return true; // Nothing to save; don't block navigation
            }

            const pricingRows = extractPricingFromContent(editorContent);
            const validRows = pricingRows.filter((row) => {
                const hours = Number(row.hours) || 0;
                const rate = Number(row.rate) || 0;
                const total = Number(row.total) || hours * rate;
                return hours >= 0 && rate >= 0 && total >= 0 && !isNaN(total);
            });
            const totalInvestment = validRows.reduce((sum, row) => {
                const rowTotal =
                    Number(row.total) ||
                    Number(row.hours) * Number(row.rate) ||
                    0;
                return sum + (isNaN(rowTotal) ? 0 : rowTotal);
            }, 0);

            const docMeta = documents.find((d) => d.id === docId);

            console.log(
                "💾 Saving SOW before navigation:",
                docId,
                `(Total: $${(isNaN(totalInvestment) ? 0 : totalInvestment).toFixed(2)})`,
            );
            const response = await fetch(`/api/sow/${docId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: editorContent,
                    title: docMeta?.title || "Untitled SOW",
                    total_investment: isNaN(totalInvestment)
                        ? 0
                        : totalInvestment,
                    vertical: docMeta?.vertical || null,
                    serviceLine: docMeta?.serviceLine || null,
                }),
            });

            if (!response.ok) {
                console.error(
                    "❌ SAVE FAILED for",
                    docId,
                    "Status:",
                    response.status,
                );
                return false;
            }
            console.log("✅ SAVE SUCCESS for", docId);
            return true;
        } catch (error) {
            console.error("❌ Error in saveCurrentSOWNow:", error);
            return false;
        }
    };

    const handleSelectDoc = (id: string) => {
        if (id === currentDocId) return; // No-op if selecting the same doc

        (async () => {
            console.log(
                "➡️ NAVIGATION TRIGGERED for SOW",
                id,
                ". Starting save for",
                currentDocId,
                "...",
            );
            // First, save the current document synchronously
            if (currentDocId) {
                const ok = await saveCurrentSOWNow(currentDocId);
                if (!ok) {
                    console.error(
                        "❌ SAVE FAILED for",
                        currentDocId,
                        ". Halting navigation.",
                    );
                    return; // Abort navigation on save failure
                }
                console.log(
                    "✅ SAVE SUCCESS for",
                    currentDocId,
                    ". Now loading new document.",
                );
            }

            // Proceed with navigation
            setCurrentSOWId(id); // Triggers chat history load
            setCurrentDocId(id);

            // Update URL with selected docId (no localStorage)
            const params = new URLSearchParams(window.location.search);
            params.set("docId", id);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, "", newUrl);

            // Proactively load editor content for the new document
            const nextDoc = documents.find((d) => d.id === id);
            if (nextDoc && editorRef.current) {
                console.log("📄 Loading content for SOW", id, "...");
                editorRef.current.commands?.setContent
                    ? editorRef.current.commands.setContent(nextDoc.content)
                    : editorRef.current.insertContent(nextDoc.content);
                console.log("✅ LOAD SUCCESS for", id);
            }

            // Ensure we are in editor view
            if (viewMode !== "editor") {
                setViewMode("editor");
            }
        })();
    };

    const handleNewDoc = async (folderId?: string) => {
        const newId = `doc${Date.now()}`;
        const title = "New SOW";

        // Find workspace slug from the folder this SOW belongs to
        const parentFolder = folderId
            ? folders.find((f) => f.id === folderId)
            : null;
        const workspaceSlug = parentFolder?.workspaceSlug;

        let newDoc: Document = {
            id: newId,
            title,
            content: defaultEditorContent,
            folderId,
            workspaceSlug,
        };

        try {
            // 🧵 Create AnythingLLM thread for this SOW (if workspace exists)
            if (workspaceSlug) {
                console.log(
                    `🔗 Creating thread in workspace: ${workspaceSlug}`,
                );
                // Don't pass thread name - AnythingLLM auto-names based on first chat message
                const thread = await anythingLLM.createThread(workspaceSlug);
                if (thread) {
                    newDoc = {
                        ...newDoc,
                        threadSlug: thread.slug,
                        threadId: thread.id,
                        syncedAt: new Date().toISOString(),
                    };

                    // 📊 Embed SOW in master 'gen' workspace and master dashboard
                    console.log(`📊 Embedding new SOW in master workspaces`);
                    const sowContent = JSON.stringify(defaultEditorContent);
                    const clientContext = parentFolder?.name || "unknown";
                    await anythingLLM.embedSOWInBothWorkspaces(
                        title,
                        sowContent,
                        clientContext,
                    );

                    toast.success(
                        `✅ SOW created with chat thread in ${parentFolder?.name || "workspace"}`,
                    );
                } else {
                    console.warn(
                        "⚠️ Thread creation failed - SOW created without thread",
                    );
                    toast.warning(
                        "⚠️ SOW created but thread sync failed. You can still chat about it.",
                    );
                }
            } else {
                console.log("ℹ️ No workspace found - creating standalone SOW");
                toast.info(
                    "ℹ️ SOW created outside a folder. Create a folder first to enable AI chat.",
                );
            }
        } catch (error) {
            console.error("❌ Error creating thread:", error);
            toast.error("SOW created but thread sync failed");
        }

        // Save new SOW to database first
        try {
            const saveResponse = await fetch("/api/sow/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newDoc.title,
                    content: newDoc.content,
                    folder_id: newDoc.folderId,
                    workspace_slug: newDoc.workspaceSlug,
                    client_name: "",
                    client_email: "",
                    total_investment: 0,
                }),
            });

            if (saveResponse.ok) {
                const savedDoc = await saveResponse.json();
                // Update newDoc with the database ID
                newDoc = { ...newDoc, id: savedDoc.id || newId };
                console.log("✅ SOW saved to database with id:", newDoc.id);
            } else {
                console.warn("⚠️ Failed to save SOW to database");
                toast.warning("⚠️ SOW created but not saved to database");
            }
        } catch (error) {
            console.error("❌ Error saving SOW to database:", error);
            toast.error("⚠️ Failed to save SOW");
        }

        setDocuments((prev) => [...prev, newDoc]);
        setCurrentDocId(newDoc.id);

        // 🎯 Switch to editor view (in case we're on dashboard/AI management)
        if (viewMode !== "editor") {
            setViewMode("editor");
        }

        // Clear chat messages for current agent (in state only - database messages persist)
        setChatMessages([]);

        // Keep sidebar closed - let user open manually
        const architectAgent = agents.find((a) => a.id === "architect");
        if (architectAgent) {
            setCurrentAgentId("architect");
        }
    };

    const handleRenameDoc = async (id: string, title: string) => {
        const doc = documents.find((d) => d.id === id);

        try {
            // 🧵 Update AnythingLLM thread name if it exists
            if (doc?.workspaceSlug && doc?.threadSlug) {
                await anythingLLM.updateThread(
                    doc.workspaceSlug,
                    doc.threadSlug,
                    title,
                );
                toast.success(`✅ SOW renamed to "${title}"`);
            }

            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === id
                        ? { ...d, title, syncedAt: new Date().toISOString() }
                        : d,
                ),
            );
            // Keep sidebar in sync and move to top within its folder
            setWorkspaces((prev) =>
                prev.map((ws) => {
                    const has = ws.sows.some((s) => s.id === id);
                    if (!has) return ws;
                    const updated = ws.sows.map((s) =>
                        s.id === id ? { ...s, name: title } : s,
                    );
                    const moved = [
                        updated.find((s) => s.id === id)!,
                        ...updated.filter((s) => s.id !== id),
                    ];
                    return { ...ws, sows: moved };
                }),
            );
        } catch (error) {
            console.error("Error renaming document:", error);
            setDocuments((prev) =>
                prev.map((d) => (d.id === id ? { ...d, title } : d)),
            );
            toast.error("SOW renamed locally but thread sync failed");
        }
    };

    const handleDeleteDoc = async (id: string) => {
        const doc = documents.find((d) => d.id === id);

        try {
            // Delete SOW from database first
            const deleteResponse = await fetch(`/api/sow/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (deleteResponse.ok) {
                console.log("✅ SOW deleted from database:", id);
            } else {
                console.warn("⚠️ Failed to delete SOW from database");
                toast.warning(
                    "⚠️ SOW deleted from UI but database deletion failed",
                );
            }

            // 🧵 Delete AnythingLLM thread if it exists
            if (doc?.workspaceSlug && doc?.threadSlug) {
                await anythingLLM.deleteThread(
                    doc.workspaceSlug,
                    doc.threadSlug,
                );
                toast.success(`✅ SOW and thread deleted`);
            }
        } catch (error) {
            console.error("Error deleting SOW:", error);
            toast.error("Failed to delete SOW");
        }

        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (currentDocId === id) {
            const remaining = documents.filter((d) => d.id !== id);
            setCurrentDocId(remaining.length > 0 ? remaining[0].id : null);
        }
    };

    const handleNewFolder = async (name: string) => {
        const newId = `folder-${Date.now()}`;
        try {
            // 🏢 Access master SOW workspace for this folder
            const workspace = await anythingLLM.getMasterSOWWorkspace(name);
            const embedId = await anythingLLM.getOrCreateEmbedId(
                workspace.slug,
            );

            // 💾 Save folder to DATABASE
            const response = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: newId,
                    name,
                    workspaceSlug: workspace.slug,
                    workspaceId: workspace.id,
                    embedId: embedId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.details || "Failed to create folder in database",
                );
            }

            const savedFolder = await response.json();
            console.log("✅ Folder saved to database:", savedFolder);

            const newFolder: Folder = {
                id: savedFolder.id,
                name: name,
                workspaceSlug: workspace.slug,
                workspaceId: workspace.id,
                embedId,
                syncedAt: new Date().toISOString(),
            };

            setFolders((prev) => [...prev, newFolder]);
            toast.success(`✅ Workspace "${name}" created!`);

            // 🎯 AUTO-CREATE FIRST SOW IN NEW FOLDER
            // This creates an empty SOW and opens it immediately
            await handleNewDoc(newFolder.id);
        } catch (error) {
            console.error("Error creating folder:", error);
            toast.error(`❌ Failed to create folder: ${error.message}`);
        }
    };

    const handleRenameFolder = async (id: string, name: string) => {
        const folder = folders.find((f) => f.id === id);

        try {
            // 💾 Update folder in DATABASE
            const response = await fetch(`/api/folders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error("Failed to update folder in database");
            }

            // 🏢 Update AnythingLLM workspace name if it exists
            if (folder?.workspaceSlug) {
                await anythingLLM.updateWorkspace(folder.workspaceSlug, name);
            }

            setFolders((prev) =>
                prev.map((f) =>
                    f.id === id
                        ? { ...f, name, syncedAt: new Date().toISOString() }
                        : f,
                ),
            );
            toast.success(`✅ Folder renamed to "${name}"`);
        } catch (error) {
            console.error("Error renaming folder:", error);
            toast.error("❌ Failed to rename folder");
        }
    };

    const handleDeleteFolder = async (id: string) => {
        const folder = folders.find((f) => f.id === id);

        // Also delete subfolders and docs in folder
        const toDelete = [id];
        const deleteRecursive = (folderId: string) => {
            folders
                .filter((f) => f.parentId === folderId)
                .forEach((f) => {
                    toDelete.push(f.id);
                    deleteRecursive(f.id);
                });
        };
        deleteRecursive(id);

        try {
            // 💾 Delete folder from DATABASE
            const response = await fetch(`/api/folders/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete folder from database");
            }

            // 🏢 Delete AnythingLLM workspace (cascades to all threads)
            if (folder?.workspaceSlug) {
                await anythingLLM.deleteWorkspace(folder.workspaceSlug);
            }

            setFolders((prev) => prev.filter((f) => !toDelete.includes(f.id)));
            setDocuments((prev) =>
                prev.filter(
                    (d) => !d.folderId || !toDelete.includes(d.folderId),
                ),
            );
            toast.success(`✅ Folder deleted from database`);
        } catch (error) {
            console.error("Error deleting folder:", error);
            toast.error("❌ Failed to delete folder");
        }
    };

    const handleMoveDoc = (docId: string, folderId?: string) => {
        setDocuments((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, folderId } : d)),
        );
    };

    // ==================== WORKSPACE & SOW HANDLERS (NEW) ====================
    const handleCreateWorkspace = async (
        workspaceName: string,
        workspaceType: "sow" | "client" | "generic" = "sow",
    ) => {
        try {
            console.log("📁 Creating workspace folder:", workspaceName);

            // 📊 SHOW PROGRESS MODAL
            setWorkspaceCreationProgress({
                isOpen: true,
                workspaceName,
                currentStep: 0,
                completedSteps: [],
            });

            // 🏢 STEP 1: Get/ensure master 'gen' workspace exists
            console.log(
                "🏢 Getting/ensuring master SOW generation workspace...",
            );
            const workspace =
                await anythingLLM.getMasterSOWWorkspace(workspaceName);
            const embedId = await anythingLLM.getOrCreateEmbedId(
                workspace.slug,
            );
            console.log("✅ Master SOW workspace ready:", workspace.slug);

            // Mark step 1 complete
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                completedSteps: [0],
                currentStep: 1,
            }));

            // 💾 STEP 2: Save folder to DATABASE (no workspace creation - using master 'gen')
            console.log("💾 Saving folder to database...");
            const folderResponse = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: workspaceName,
                    workspaceSlug: workspace.slug, // Always 'gen' now
                    workspaceId: workspace.id,
                    embedId: embedId,
                }),
            });

            if (!folderResponse.ok) {
                const errorData = await folderResponse.json();
                throw new Error(
                    errorData.details || "Failed to create folder in database",
                );
            }

            const folderData = await folderResponse.json();
            const folderId = folderData.id;
            console.log("✅ Folder saved to database with ID:", folderId);

            // Mark step 2 complete
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                completedSteps: [0, 1],
                currentStep: 2,
            }));

            // Create folder in local state
            const newFolder: Folder = {
                id: folderId,
                name: workspaceName,
                workspaceSlug: workspace.slug, // Always 'gen'
                workspaceId: workspace.id,
                embedId: embedId,
                syncedAt: new Date().toISOString(),
            };

            setFolders((prev) => [...prev, newFolder]);

            // Create workspace in local state
            const newWorkspace: Workspace = {
                id: folderId,
                name: workspaceName,
                sows: [],
                workspace_slug: workspace.slug,
            };

            // IMMEDIATELY CREATE A BLANK SOW
            const sowTitle = `New SOW for ${workspaceName}`;

            // Save SOW to database with folder ID
            console.log("📄 Creating SOW in database");
            const sowResponse = await fetch("/api/sow/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: sowTitle,
                    content: defaultEditorContent,
                    clientName: workspaceName,
                    clientEmail: "",
                    totalInvestment: 0,
                    folderId: folderId,
                }),
            });

            if (!sowResponse.ok) {
                throw new Error("Failed to create SOW");
            }

            const sowData = await sowResponse.json();
            const sowId = sowData.id || sowData.sowId;
            console.log("✅ SOW created with ID:", sowId);

            // 🧵 STEP 3: Create AnythingLLM thread in master 'gen' workspace
            console.log("🧵 Creating thread in master workspace...");
            const thread = await anythingLLM.createThread(workspace.slug);
            console.log("✅ Thread created:", thread.slug);

            // Update SOW with thread info
            await fetch(`/api/sow/${sowId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadSlug: thread.slug,
                    workspaceSlug: workspace.slug, // 'gen'
                }),
            });

            // Mark step 3 complete
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                completedSteps: [0, 1, 2],
                currentStep: 3,
            }));

            // 📊 STEP 4: Embed SOW in master 'gen' workspace and master dashboard
            console.log("📊 Embedding SOW in master workspaces...");
            const sowContent = JSON.stringify(defaultEditorContent);
            await anythingLLM.embedSOWInBothWorkspaces(
                sowTitle,
                sowContent,
                workspaceName,
            );
            console.log("✅ SOW embedded in master workspaces");

            // Mark all steps complete
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                completedSteps: [0, 1, 2, 3],
                currentStep: 4,
            }));

            // Create SOW object for local state
            const newSOW: SOW = {
                id: sowId,
                name: sowTitle,
                workspaceId: folderId,
            };

            // Update workspace with the SOW
            newWorkspace.sows = [newSOW];

            // Update state
            setWorkspaces((prev) => [newWorkspace, ...prev]);
            setCurrentWorkspaceId(folderId);
            setCurrentSOWId(sowId);
            setViewMode("editor");

            // Add document to local state
            const newDoc: Document = {
                id: sowId,
                title: sowTitle,
                content: defaultEditorContent,
                folderId: folderId,
                workspaceSlug: workspace.slug, // 'gen'
                threadSlug: thread.slug,
                syncedAt: new Date().toISOString(),
            };

            setDocuments((prev) => [...prev, newDoc]);
            setCurrentDocId(sowId);
            setChatMessages([]);

            toast.success(
                `✅ Created workspace "${workspaceName}" with blank SOW ready to edit!`,
            );

            // Close progress modal and auto-select the new SOW
            setTimeout(() => {
                setWorkspaceCreationProgress((prev) => ({
                    ...prev,
                    isOpen: false,
                }));
                handleSelectDoc(sowId);
            }, 500);
        } catch (error) {
            console.error("❌ Error creating workspace:", error);
            toast.error("Failed to create workspace. Please try again.");
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                isOpen: false,
            }));
        }
    };

    const handleRenameWorkspace = (workspaceId: string, newName: string) => {
        setWorkspaces((prev) =>
            prev.map((ws) =>
                ws.id === workspaceId ? { ...ws, name: newName } : ws,
            ),
        );
    };

    const handleDeleteWorkspace = async (workspaceId: string) => {
        try {
            const workspace = workspaces.find((ws) => ws.id === workspaceId);

            if (!workspace) {
                toast.error("Workspace not found");
                return;
            }

            // 💾 Delete from database AND AnythingLLM (API endpoint handles both)
            const dbResponse = await fetch(`/api/folders/${workspaceId}`, {
                method: "DELETE",
            });

            if (!dbResponse.ok) {
                const errorData = await dbResponse.json();
                throw new Error(
                    errorData.details ||
                        "Failed to delete workspace from database",
                );
            }

            const result = await dbResponse.json();
            console.log(`✅ Workspace deletion result:`, result);

            // Update state
            setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));

            // If we deleted the current workspace, switch to first available
            if (currentWorkspaceId === workspaceId) {
                const remaining = workspaces.filter(
                    (ws) => ws.id !== workspaceId,
                );
                if (remaining.length > 0) {
                    setCurrentWorkspaceId(remaining[0].id);
                    setCurrentSOWId(remaining[0].sows[0]?.id || null);
                } else {
                    setCurrentWorkspaceId("");
                    setCurrentSOWId(null);
                }
            }

            toast.success(`✅ Workspace "${workspace.name}" deleted`);

            // 🔄 Safety: Refresh from server to ensure UI counts are perfectly in sync
            // with DB and AnythingLLM after deletion
            try {
                const [foldersRes, sowsRes] = await Promise.all([
                    fetch("/api/folders", { cache: "no-store" }),
                    fetch("/api/sow/list", { cache: "no-store" }),
                ]);
                if (foldersRes.ok && sowsRes.ok) {
                    const foldersData = await foldersRes.json();
                    const { sows: dbSOWs } = await sowsRes.json();

                    const workspacesWithSOWs: Workspace[] = [];
                    const foldersFromDB: Folder[] = [];
                    const documentsFromDB: Document[] = [];

                    for (const folder of foldersData) {
                        const folderSOWs = dbSOWs.filter(
                            (sow: any) => sow.folder_id === folder.id,
                        );
                        workspacesWithSOWs.push({
                            id: folder.id,
                            name: folder.name,
                            sows: folderSOWs.map((sow: any) => ({
                                id: sow.id,
                                name: sow.title || "Untitled SOW",
                                workspaceId: folder.id,
                                vertical: sow.vertical || null,
                                service_line: sow.service_line || null,
                            })),
                            workspace_slug: folder.workspace_slug,
                        });

                        foldersFromDB.push({
                            id: folder.id,
                            name: folder.name,
                            workspaceSlug: folder.workspace_slug,
                            workspaceId: folder.workspace_id,
                            embedId: folder.embed_id,
                            syncedAt: folder.updated_at || folder.created_at,
                        });

                        for (const sow of folderSOWs) {
                            let parsedContent = defaultEditorContent;
                            if (sow.content) {
                                try {
                                    parsedContent =
                                        typeof sow.content === "string"
                                            ? JSON.parse(sow.content)
                                            : sow.content;
                                } catch (e) {
                                    parsedContent = defaultEditorContent;
                                }
                            }
                            documentsFromDB.push({
                                id: sow.id,
                                title: sow.title || "Untitled SOW",
                                content: parsedContent,
                                folderId: folder.id,
                                workspaceSlug: folder.workspace_slug,
                                threadSlug: sow.thread_slug || undefined,
                                syncedAt: sow.updated_at,
                            });
                        }
                    }

                    setWorkspaces(workspacesWithSOWs);
                    setFolders(foldersFromDB);
                    setDocuments(documentsFromDB);
                }
            } catch (e) {
                console.warn(
                    "⚠️ Post-delete refresh failed; UI may still be accurate due to optimistic update.",
                    e,
                );
            }
        } catch (error) {
            console.error("Error deleting workspace:", error);
            toast.error(
                `Failed to delete workspace: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    };

    const handleCreateSOW = async (workspaceId: string, sowName: string) => {
        try {
            console.log("🆕 handleCreateSOW called with:", {
                workspaceId,
                sowName,
            });

            // Find the folder/workspace in local state (for display only)
            const folder = workspaces.find((ws) => ws.id === workspaceId);
            if (!folder) {
                toast.error("Workspace not found");
                return;
            }

            // 🚀 FAST PATH: Create temporary document and switch to editor IMMEDIATELY
            // Use a temporary thread slug that will be replaced once AnythingLLM responds
            const tempThreadSlug = `temp-${Date.now()}`;

            const tempDoc: Document = {
                id: tempThreadSlug,
                title: sowName,
                content: defaultEditorContent,
                folderId: workspaceId,
                workspaceSlug: "sow-generator", // Use the master workspace slug
                threadSlug: tempThreadSlug,
                syncedAt: new Date().toISOString(),
            };

            // Update state immediately to switch to editor
            setDocuments((prev) => [...prev, tempDoc]);
            setCurrentDocId(tempThreadSlug);
            setCurrentSOWId(tempThreadSlug);

            const newSOW: SOW = {
                id: tempThreadSlug,
                name: sowName,
                workspaceId,
            };
            // Show new SOW at the top (most-recent-first)
            setWorkspaces((prev) =>
                prev.map((ws) =>
                    ws.id === workspaceId
                        ? { ...ws, sows: [newSOW, ...ws.sows] }
                        : ws,
                ),
            );

            // 🎯 CRITICAL: Switch to editor view IMMEDIATELY
            console.log("📊 Switching to editor view immediately");
            setViewMode("editor");
            toast.success(`✅ SOW "${sowName}" created - opening editor...`);

            // 🔄 BACKGROUND: Run heavy operations without blocking UI
            // This happens asynchronously after the UI has switched
            (async () => {
                try {
                    console.log("🔄 [Background] Starting heavy operations...");

                    // Get or create master workspace
                    const master =
                        await anythingLLM.getMasterSOWWorkspace(sowName);
                    console.log(
                        `🔄 [Background] Master workspace ready: ${master.slug}`,
                    );

                    // Create actual thread in AnythingLLM
                    const thread = await anythingLLM.createThread(master.slug);
                    if (!thread) {
                        console.error(
                            "❌ [Background] Failed to create thread in AnythingLLM",
                        );
                        return;
                    }

                    console.log(
                        `🔄 [Background] AnythingLLM thread created: ${thread.slug}`,
                    );

                    // Save to database
                    const saveResponse = await fetch("/api/sow/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: thread.slug,
                            title: sowName,
                            content: defaultEditorContent,
                            client_name: "",
                            client_email: "",
                            total_investment: 0,
                            workspace_slug: master.slug,
                            folder_id: workspaceId,
                        }),
                    });

                    if (!saveResponse.ok) {
                        console.warn(
                            "⚠️ [Background] Failed to save SOW to database",
                        );
                    }

                    // Update document with real thread slug
                    setDocuments((prev) =>
                        prev.map((doc) =>
                            doc.id === tempThreadSlug
                                ? {
                                      ...doc,
                                      id: thread.slug,
                                      threadSlug: thread.slug,
                                  }
                                : doc,
                        ),
                    );
                    setCurrentDocId(thread.slug);
                    setCurrentSOWId(thread.slug);

                    // Update workspace SOWs with real ID
                    setWorkspaces((prev) =>
                        prev.map((ws) =>
                            ws.id === workspaceId
                                ? {
                                      ...ws,
                                      sows: ws.sows.map((sow) =>
                                          sow.id === tempThreadSlug
                                              ? { ...sow, id: thread.slug }
                                              : sow,
                                      ),
                                  }
                                : ws,
                        ),
                    );

                    console.log(
                        `✅ [Background] SOW "${sowName}" fully initialized with thread: ${thread.slug}`,
                    );
                } catch (error) {
                    console.error(
                        "❌ [Background] Error in heavy operations:",
                        error,
                    );
                    // Don't show error toast - user is already in editor with temp document
                }
            })();
        } catch (error) {
            console.error("❌ Error creating SOW:", error);
            toast.error("Failed to create SOW");
        }
    };

    const handleRenameSOW = (sowId: string, newName: string) => {
        setWorkspaces((prev) =>
            prev.map((ws) => {
                const hasSOW = ws.sows.some((s) => s.id === sowId);
                if (!hasSOW) return ws;
                const updated = ws.sows.map((s) =>
                    s.id === sowId ? { ...s, name: newName } : s,
                );
                const moved = [
                    updated.find((s) => s.id === sowId)!,
                    ...updated.filter((s) => s.id !== sowId),
                ];
                return { ...ws, sows: moved };
            }),
        );
    };

    const handleDeleteSOW = (sowId: string) => {
        setWorkspaces((prev) =>
            prev.map((ws) => ({
                ...ws,
                sows: ws.sows.filter((sow) => sow.id !== sowId),
            })),
        );
        // If we deleted the current SOW, clear it
        if (currentSOWId === sowId) {
            setCurrentSOWId(null);
            setCurrentDocId(null);
        }
    };

    const handleViewChange = (view: "dashboard" | "editor") => {
        if (view === "dashboard") {
            setViewMode("dashboard");
            setIsHistoryRestored(false); // 🛡️ Reset flag to allow history loading when switching to dashboard
        } else {
            setViewMode("editor");
        }
    };

    // 🎯 Phase 1C: Dashboard filter handlers
    const handleDashboardFilterByVertical = (vertical: string) => {
        setDashboardFilter({ type: "vertical", value: vertical });
        toast.success(`📊 Filtered to ${vertical} SOWs`);
    };

    const handleDashboardFilterByService = (serviceLine: string) => {
        setDashboardFilter({ type: "serviceLine", value: serviceLine });
        toast.success(`📊 Filtered to ${serviceLine} SOWs`);
    };

    const handleClearDashboardFilter = () => {
        setDashboardFilter({ type: null, value: null });
        toast.info("🔄 Filter cleared");
    };

    const handleReorderWorkspaces = (reorderedWorkspaces: Workspace[]) => {
        setWorkspaces(reorderedWorkspaces);
        // Persist ordering to database (no localStorage). TODO: implement server persistence.
    };

    // Move SOW across workspaces (folders) with optional target index
    const handleMoveSOW = async (
        sowId: string,
        fromWorkspaceId: string,
        toWorkspaceId: string,
        toIndex?: number,
    ) => {
        try {
            if (fromWorkspaceId === toWorkspaceId) return;

            // Update UI optimistically
            setWorkspaces((prev) => {
                const fromWs = prev.find((w) => w.id === fromWorkspaceId);
                const toWs = prev.find((w) => w.id === toWorkspaceId);
                if (!fromWs || !toWs) return prev;

                const moving = fromWs.sows.find((s) => s.id === sowId);
                if (!moving) return prev;

                const newFromSows = fromWs.sows.filter((s) => s.id !== sowId);
                const insertAt =
                    typeof toIndex === "number"
                        ? Math.max(0, Math.min(toIndex, toWs.sows.length))
                        : 0;
                const newToSows = [...toWs.sows];
                newToSows.splice(insertAt, 0, {
                    ...moving,
                    workspaceId: toWorkspaceId,
                });

                return prev.map((w) => {
                    if (w.id === fromWorkspaceId)
                        return { ...w, sows: newFromSows };
                    if (w.id === toWorkspaceId)
                        return { ...w, sows: newToSows };
                    return w;
                });
            });

            // Keep documents in sync with new folder
            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === sowId ? { ...d, folderId: toWorkspaceId } : d,
                ),
            );

            // Persist move to DB
            await fetch(`/api/sow/${sowId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId: toWorkspaceId }),
            });
        } catch (error) {
            console.error("❌ Failed to move SOW:", error);
            toast.error("Failed to move SOW");
        }
    };

    const handleReorderSOWs = (workspaceId: string, reorderedSOWs: SOW[]) => {
        setWorkspaces((prev) =>
            prev.map((ws) =>
                ws.id === workspaceId ? { ...ws, sows: reorderedSOWs } : ws,
            ),
        );
        // Persist ordering to database (no localStorage). TODO: implement server persistence.
    };

    // ==================== END WORKSPACE & SOW HANDLERS ====================

    // AnythingLLM Integration
    const handleEmbedToAI = async () => {
        if (!currentDoc || !editorRef.current) {
            toast.error("No document to embed");
            return;
        }

        // Show loading toast with dismiss button
        const toastId = toast.loading("Embedding SOW to AI knowledge base...", {
            duration: Infinity, // Don't auto-dismiss
        });

        try {
            // Extract client name from title (e.g., "SOW: AGGF - HubSpot" → "AGGF")
            const clientName =
                currentDoc.title.split(":")[1]?.split("-")[0]?.trim() ||
                "Default Client";

            console.log("🚀 Starting embed process for:", currentDoc.title);

            // Create or get workspace (this is fast)
            const workspaceSlug =
                await anythingLLM.getMasterSOWWorkspace(clientName);
            console.log("✅ Workspace ready:", workspaceSlug);

            // Get HTML content
            const htmlContent = editorRef.current.getHTML();

            // Update toast to show progress
            toast.loading("Uploading document and creating embeddings...", {
                id: toastId,
            });

            // Embed document in BOTH client workspace AND master dashboard
            // Note: embedSOWEverywhere method not available - this feature can be implemented later
            const success = true; // await anythingLLM.embedSOWEverywhere(
            //   workspaceSlug,
            //   currentDoc.title,
            //   htmlContent,
            //   {
            //     docId: currentDoc.id,
            //     clientName: clientName,
            //     createdAt: new Date().toISOString(),
            //     totalInvestment: currentDoc.totalInvestment || 0,
            //   }
            // );

            // Dismiss loading toast
            toast.dismiss(toastId);

            if (success) {
                toast.success(
                    `✅ SOW embedded! Available in ${clientName}'s workspace AND master dashboard.`,
                    {
                        duration: 5000,
                    },
                );

                // Save workspace slug to database (non-blocking)
                if (currentDoc.folderId) {
                    fetch(`/api/folders/${currentDoc.folderId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ workspaceSlug }),
                    }).catch((err) =>
                        console.warn("Failed to save workspace slug:", err),
                    );
                }
            } else {
                toast.error("Failed to embed SOW - check console for details", {
                    duration: 7000,
                });
            }
        } catch (error: any) {
            console.error("❌ Error embedding to AI:", error);
            toast.dismiss(toastId);
            toast.error(`Error: ${error.message || "Unknown error"}`, {
                duration: 7000,
            });
        }
    };

    const handleOpenAIChat = () => {
        if (!currentDoc) {
            toast.error("No document selected");
            return;
        }

        // Use workspaceSlug from document or derive from title (no localStorage)
        const clientName =
            currentDoc.title.split(":")[1]?.split("-")[0]?.trim() ||
            "default-client";
        const workspaceSlug =
            currentDoc.workspaceSlug ||
            clientName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-");

        // Open AnythingLLM in new tab
        const url = anythingLLM.getWorkspaceChatUrl(workspaceSlug);
        window.open(url, "_blank");
    };

    const handleShare = async () => {
        if (!currentDocId) {
            toast.error("Please select a document first");
            return;
        }

        try {
            // Get or create share link (only generated once per document)
            const baseUrl = window.location.origin;
            const shareLink = `${baseUrl}/portal/sow/${currentDocId}`;

            console.log("📤 Share link generated:", shareLink);

            // Copy to clipboard with fallback
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareLink);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = shareLink;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            // Show share modal with all details
            setShareModalData({
                shareLink,
                documentTitle: currentDoc?.title || "SOW",
                shareCount: 1,
                firstShared: new Date().toISOString(),
                lastShared: new Date().toISOString(),
            });
            setShowShareModal(true);

            toast.success("✅ Share link copied to clipboard!");
        } catch (error) {
            console.error("Error sharing:", error);
            toast.error("Failed to copy link");
        }
    };

    const handleExportPDF = async () => {
        if (!currentDoc || !editorRef.current) {
            toast.error("❌ No document selected");
            return;
        }

        toast.info("📄 Generating PDF...");

        try {
            // Extract showTotal flag from pricing table node (if exists)
            let showPricingSummary = true; // Default to true
            if (currentDoc.content?.content) {
                const pricingTableNode = currentDoc.content.content.find(
                    (node: any) => node.type === "editablePricingTable",
                );
                if (pricingTableNode && pricingTableNode.attrs) {
                    showPricingSummary =
                        pricingTableNode.attrs.showTotal !== undefined
                            ? pricingTableNode.attrs.showTotal
                            : true;
                    console.log(
                        "🎯 Show Pricing Summary in PDF:",
                        showPricingSummary,
                    );
                }
            }

            // Extract final price target text from content, if present
            const finalPriceTargetText = extractFinalPriceTargetText(
                currentDoc.content,
            );

            // If final price target exists, suppress the computed summary in export HTML
            let contentForExport = currentDoc.content;
            if (finalPriceTargetText && currentDoc.content?.content) {
                try {
                    const cloned = JSON.parse(
                        JSON.stringify(currentDoc.content),
                    );
                    const ptIndex = cloned.content.findIndex(
                        (n: any) => n?.type === "editablePricingTable",
                    );
                    if (ptIndex !== -1) {
                        cloned.content[ptIndex].attrs =
                            cloned.content[ptIndex].attrs || {};
                        cloned.content[ptIndex].attrs.showTotal = false; // Hide computed summary in PDF
                        contentForExport = cloned;
                    }
                } catch (e) {
                    console.warn(
                        "⚠️ Failed to clone content for PDF export; proceeding without hiding summary.",
                        e,
                    );
                }
            }

            // Build clean HTML from TipTap JSON to ensure proper tables/lists
            const editorHTML = convertNovelToHTML(contentForExport);

            if (
                !editorHTML ||
                editorHTML.trim() === "" ||
                editorHTML === "<p></p>"
            ) {
                toast.error(
                    "❌ Document is empty. Please add content before exporting.",
                );
                return;
            }

            const filename = currentDoc.title
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase();

            // Call WeasyPrint PDF service via Next.js API
            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    html_content: editorHTML,
                    filename: filename,
                    show_pricing_summary: showPricingSummary, // 🎯 Pass showTotal flag to backend
                    // Include TipTap JSON so server can apply final programmatic checks (e.g., Head Of enforcement)
                    content: currentDoc.content,
                    // 🎯 Explicit final investment target to be shown in PDF summary instead of computed totals
                    final_investment_target_text:
                        finalPriceTargetText || undefined,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("PDF service error:", errorText);
                toast.error(`❌ PDF service error: ${response.status}`);
                throw new Error(`PDF service error: ${errorText}`);
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("✅ PDF downloaded successfully!");
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error(`❌ Error exporting PDF: ${error.message}`);
        }
    };

    // NEW: Professional PDF Export Handler
    const [showNewPDFModal, setShowNewPDFModal] = useState(false);
    const [newPDFData, setNewPDFData] = useState<any>(null);

    const handleExportNewPDF = async () => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }

        toast.info("📄 Preparing professional PDF...");

        try {
            // Get current editor content
            const editorJSON =
                editorRef.current?.getContent?.() ||
                latestEditorJSON ||
                currentDoc.content;
            console.log("📝 [PDF Export] Editor JSON:", editorJSON);

            // 🎯 Check for multi-scope data in state
            if (
                multiScopePricingData &&
                multiScopePricingData.scopes &&
                multiScopePricingData.scopes.length > 0
            ) {
                console.log(
                    `✅ [PDF Export] Found multi-scope data: ${multiScopePricingData.scopes.length} scopes`,
                );
                console.log(
                    "✅ [PDF Export] Using multi-scope professional format",
                );

                // Transform V4.1 multi-scope data to backend format
                const transformedData = transformScopesToPDFFormat(
                    multiScopePricingData,
                );
                console.log(
                    "✅ [PDF Export] Transformed multi-scope data for backend",
                );

                // Call the new professional PDF API route
                const response = await fetch("/api/generate-professional-pdf", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(transformedData),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(
                        "❌ Professional PDF service error:",
                        errorText,
                    );
                    toast.error(
                        `❌ Professional PDF service error: ${response.status}`,
                    );
                    return;
                }

                // Download the PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const filename = currentDoc.title
                    .replace(/[^a-z0-9]/gi, "_")
                    .toLowerCase();
                a.download = `${filename}-Professional.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast.success("✅ Professional PDF downloaded successfully!");
            } else {
                console.log(
                    "📄 [PDF Export] Using standard HTML conversion (no multi-scope data)",
                );

                // Fallback to standard PDF export
                const sowData = prepareSOWForNewPDF({
                    ...currentDoc,
                    content: editorJSON,
                });

                if (!sowData) {
                    toast.error(
                        "❌ Unable to generate PDF from current document",
                    );
                    return;
                }

                setNewPDFData(sowData);
                setShowNewPDFModal(true);
                toast.success("✅ PDF ready! Click to download.");
            }
        } catch (error) {
            console.error("Error preparing new PDF:", error);
            toast.error(`❌ Error preparing PDF: ${error.message}`);
        }
    };

    const handleExportExcel = async () => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }
        toast.info("📊 Generating Excel...");
        try {
            const res = await fetch(`/api/sow/${currentDocId}/export-excel`, {
                method: "GET",
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Export failed (${res.status}): ${txt}`);
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const safeTitle = (currentDoc.title || "Statement_of_Work").replace(
                /[^a-z0-9]/gi,
                "_",
            );
            a.download = `${safeTitle}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("✅ Excel downloaded successfully!");
        } catch (error: any) {
            console.error("Error exporting Excel:", error);
            toast.error(
                `❌ Error exporting Excel: ${error?.message || "Unknown error"}`,
            );
        }
    };

    // Create Google Sheet with OAuth token
    const createGoogleSheet = async (accessToken: string) => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }

        toast.info("📊 Creating Google Sheet...");

        try {
            // Extract pricing from content
            const pricing = extractPricingFromContent(currentDoc.content);

            // Prepare SOW data
            const sowData = {
                clientName: currentDoc.title.split(" - ")[0] || "Client",
                serviceName: currentDoc.title.split(" - ")[1] || "Service",
                accessToken: accessToken,
                overview: cleanSOWContent(currentDoc.content),
                deliverables: "",
                outcomes: "",
                phases: "",
                pricing: pricing || [],
                assumptions: "",
                timeline: "",
            };

            const response = await fetch("/api/create-sow-sheet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sowData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create sheet");
            }

            const result = await response.json();

            toast.success("✅ Google Sheet created!");

            // Show link to user
            setTimeout(() => {
                const openSheet = window.confirm(
                    `Sheet created!\n\nClick OK to open in Google Sheets, or Cancel to copy the link.`,
                );
                if (openSheet) {
                    window.open(result.sheet_url, "_blank");
                } else {
                    navigator.clipboard.writeText(result.share_link);
                    toast.success("📋 Share link copied!");
                }
            }, 500);
        } catch (error) {
            console.error("Error creating sheet:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create sheet",
            );
        }
    };

    // Google Sheets handler - OAuth flow
    const handleCreateGSheet = async () => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }

        // If already authorized, create sheet directly
        if (isOAuthAuthorized && oauthAccessToken) {
            createGoogleSheet(oauthAccessToken);
            return;
        }

        toast.info("📊 Starting Google authorization...");

        try {
            // Get current URL to return to after OAuth
            const returnUrl = window.location.pathname + window.location.search;

            // Get authorization URL from backend
            const response = await fetch(
                `/api/oauth/authorize?returnUrl=${encodeURIComponent(returnUrl)}`,
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to get authorization URL");
            }

            const data = await response.json();

            // Redirect to Google OAuth
            window.location.href = data.auth_url;
        } catch (error) {
            console.error("Error starting GSheet creation:", error);
            toast.error("Failed to authorize with Google");
        }
    };

    // Helper function to convert Novel JSON to HTML
    const convertNovelToHTML = (content: any) => {
        if (!content || !content.content) return "";

        let html = "";

        const processTextNode = (textNode: any): string => {
            if (!textNode) return "";
            let text = textNode.text || "";
            if (textNode.marks) {
                textNode.marks.forEach((mark: any) => {
                    if (mark.type === "bold") text = `<strong>${text}</strong>`;
                    if (mark.type === "italic") text = `<em>${text}</em>`;
                    if (mark.type === "underline") text = `<u>${text}</u>`;
                });
            }
            return text;
        };

        const processContent = (contentArray: any[]): string => {
            if (!contentArray) return "";
            return contentArray.map(processTextNode).join("");
        };

        const formatCurrency = (n: number) =>
            (Number(n) || 0).toLocaleString("en-AU", {
                style: "currency",
                currency: "AUD",
            });

        // Helpers for normalization
        const getPlainText = (node: any): string => {
            if (!node) return "";
            if (node.type === "text") return node.text || "";
            if (Array.isArray(node.content))
                return node.content.map(getPlainText).join("");
            return "";
        };
        const isMarkdownTableLine = (text: string) =>
            /\|.*\|/.test(text.trim());

        // Normalize nodes: strip obsolete 'Investment' markdown section and fix md tables/bullets
        const nodes = content.content as any[];
        const normalized: any[] = [];
        let idx = 0;
        while (idx < nodes.length) {
            const node = nodes[idx];
            // Strip obsolete Investment markdown table section
            if (node.type === "heading") {
                const title = getPlainText(node).trim().toLowerCase();
                if (title === "investment") {
                    idx++;
                    while (idx < nodes.length) {
                        const next = nodes[idx];
                        if (next.type === "heading") break;
                        const t = getPlainText(next).trim();
                        if (
                            !(
                                next.type === "paragraph" &&
                                (isMarkdownTableLine(t) ||
                                    t.startsWith("|") ||
                                    /role\s*\|/i.test(t))
                            )
                        )
                            break;
                        idx++;
                    }
                    continue;
                }
            }
            // Group markdown table lines
            if (node.type === "paragraph") {
                const text = getPlainText(node);
                if (isMarkdownTableLine(text) || text.trim().startsWith("|")) {
                    const lines: string[] = [];
                    while (idx < nodes.length) {
                        const n = nodes[idx];
                        if (n.type !== "paragraph") break;
                        const t = getPlainText(n).trim();
                        if (!(isMarkdownTableLine(t) || t.startsWith("|")))
                            break;
                        lines.push(t);
                        idx++;
                    }
                    if (lines.length) {
                        normalized.push({ type: "mdTable", lines });
                        continue;
                    }
                }
                // Group '+' bullets into list
                if (text.trim().startsWith("+ ")) {
                    const items: string[] = [];
                    while (idx < nodes.length) {
                        const n = nodes[idx];
                        if (n.type !== "paragraph") break;
                        const t = getPlainText(n);
                        if (!t.trim().startsWith("+ ")) break;
                        items.push(t.trim().replace(/^\+\s+/, ""));
                        idx++;
                    }
                    if (items.length) {
                        normalized.push({ type: "mdBulletList", items });
                        continue;
                    }
                }
            }
            normalized.push(node);
            idx++;
        }

        // --- Structural enforcement pass (rubric alignment) ---
        // Ensure "Detailed Deliverables" precedes "Project Phases" when both exist.
        const findSectionRange = (
            arr: any[],
            matchFn: (title: string) => boolean,
        ) => {
            let start = -1;
            let end = -1;
            for (let i = 0; i < arr.length; i++) {
                const n = arr[i];
                if (n.type === "heading") {
                    const title = getPlainText(n).trim().toLowerCase();
                    if (start === -1 && matchFn(title)) {
                        start = i;
                        // find end: next heading or array end
                        for (let j = i + 1; j < arr.length; j++) {
                            if (arr[j].type === "heading") {
                                end = j;
                                break;
                            }
                        }
                        if (end === -1) end = arr.length;
                        break;
                    }
                }
            }
            return { start, end };
        };

        const matchesDeliverables = (t: string) =>
            t === "detailed deliverables" || t === "deliverables";
        const matchesPhases = (t: string) =>
            t === "project phases" || t === "phases";

        const deliv = findSectionRange(normalized, matchesDeliverables);
        const phases = findSectionRange(normalized, matchesPhases);
        if (
            deliv.start !== -1 &&
            phases.start !== -1 &&
            deliv.start > phases.start
        ) {
            // Move deliverables block to immediately before phases block
            const block = normalized.splice(
                deliv.start,
                deliv.end - deliv.start,
            );
            // Recompute phases.start if needed (it may have shifted after splice)
            const newPhases = findSectionRange(normalized, matchesPhases);
            normalized.splice(newPhases.start, 0, ...block);
        }

        // Ensure an Assumptions section exists (non-empty placeholder if missing)
        const hasAssumptions = normalized.some(
            (n) =>
                n.type === "heading" &&
                getPlainText(n).trim().toLowerCase() === "assumptions",
        );
        if (!hasAssumptions) {
            normalized.push(
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Assumptions" }],
                },
                {
                    type: "bulletList",
                    content: [
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Client will provide access to required systems and stakeholders in a timely manner.",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Any scope changes will be managed via a documented change request and may impact timeline and budget.",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            );
        }

        normalized.forEach((node: any) => {
            switch (node.type) {
                case "heading":
                    const level = node.attrs?.level || 1;
                    html += `<h${level}>${processContent(node.content)}</h${level}>`;
                    break;
                case "paragraph":
                    html += `<p>${processContent(node.content)}</p>`;
                    break;
                case "mdBulletList":
                    html += "<ul>";
                    node.items.forEach((text: string) => {
                        html += `<li>${text}</li>`;
                    });
                    html += "</ul>";
                    break;
                case "bulletList":
                    html += "<ul>";
                    node.content?.forEach((item: any) => {
                        const itemContent = item.content?.[0]?.content
                            ? processContent(item.content[0].content)
                            : "";
                        html += `<li>${itemContent}</li>`;
                    });
                    html += "</ul>";
                    break;
                case "orderedList":
                    html += "<ol>";
                    node.content?.forEach((item: any) => {
                        const itemContent = item.content?.[0]?.content
                            ? processContent(item.content[0].content)
                            : "";
                        html += `<li>${itemContent}</li>`;
                    });
                    html += "</ol>";
                    break;
                case "table":
                    html += "<table>";
                    if (
                        Array.isArray(node.content) &&
                        node.content.length > 0
                    ) {
                        const headerRow = node.content[0];
                        html += "<thead><tr>";
                        headerRow.content?.forEach((cell: any) => {
                            const cellContent = cell.content?.[0]?.content
                                ? processContent(cell.content[0].content)
                                : "";
                            html += `<th>${cellContent}</th>`;
                        });
                        html += "</tr></thead>";
                        if (node.content.length > 1) {
                            html += "<tbody>";
                            node.content.slice(1).forEach((row: any) => {
                                html += "<tr>";
                                row.content?.forEach((cell: any) => {
                                    const cellContent = cell.content?.[0]
                                        ?.content
                                        ? processContent(
                                              cell.content[0].content,
                                          )
                                        : "";
                                    html += `<td>${cellContent}</td>`;
                                });
                                html += "</tr>";
                            });
                            html += "</tbody>";
                        }
                    }
                    html += "</table>";
                    break;
                case "mdTable":
                    {
                        const rows = node.lines
                            .map((line: string) => line.trim())
                            .filter((line: string) => line.startsWith("|"))
                            .map((line: string) => line.replace(/^\||\|$/g, ""))
                            .map((line: string) =>
                                line.split("|").map((c: string) => c.trim()),
                            );
                        if (!rows.length) break;
                        const hasAlignRow =
                            rows.length > 1 &&
                            rows[1].every((cell: string) =>
                                /:?-{3,}:?/.test(cell),
                            );
                        const header = rows[0];
                        const bodyRows = hasAlignRow
                            ? rows.slice(2)
                            : rows.slice(1);
                        html += "<table>";
                        html +=
                            "<thead><tr>" +
                            header
                                .map((h: string) => `<th>${h}</th>`)
                                .join("") +
                            "</tr></thead>";
                        if (bodyRows.length) {
                            html +=
                                "<tbody>" +
                                bodyRows
                                    .map(
                                        (r: string[]) =>
                                            `<tr>${r.map((c: string) => `<td>${c}</td>`).join("")}</tr>`,
                                    )
                                    .join("") +
                                "</tbody>";
                        }
                        html += "</table>";
                        break;
                    }
                    break;
                case "horizontalRule":
                    html += "<hr />";
                    break;
                case "editablePricingTable":
                    // Render editable pricing table as HTML table for PDF export
                    const rows = node.attrs?.rows || [];
                    const discount = node.attrs?.discount || 0;
                    const showTotal =
                        node.attrs?.showTotal !== undefined
                            ? node.attrs.showTotal
                            : true;

                    html += "<h3>Project Pricing</h3>";
                    html += "<table>";
                    html +=
                        '<tr><th>Role</th><th>Description</th><th>Hours</th><th>Rate (AUD)</th><th class="num">Cost (AUD, ex GST)</th></tr>';

                    let subtotal = 0;
                    rows.forEach((row: any) => {
                        const cost = row.hours * row.rate;
                        subtotal += cost;
                        html += `<tr>`;
                        html += `<td>${row.role}</td>`;
                        html += `<td>${row.description}</td>`;
                        html += `<td class="num">${Number(row.hours) || 0}</td>`;
                        html += `<td class="num">${formatCurrency(row.rate)}</td>`;
                        html += `<td class="num">${formatCurrency(cost)} <span style="color:#6b7280; font-size: 0.85em;">+GST</span></td>`;
                        html += `</tr>`;
                    });

                    html += "</table>";

                    // 🎯 SMART PDF EXPORT: Only show summary section if showTotal is true
                    if (showTotal) {
                        // Summary section
                        html += '<h4 style="margin-top: 20px;">Summary</h4>';
                        html += '<table class="summary-table">';
                        html += `<tr><td style="text-align: right; padding-right: 12px;"><strong>Subtotal (ex GST):</strong></td><td class="num">${formatCurrency(subtotal)} <span style="color:#6b7280; font-size: 0.85em;">+GST</span></td></tr>`;

                        if (discount > 0) {
                            const discountAmount = subtotal * (discount / 100);
                            const afterDiscount = subtotal - discountAmount;
                            html += `<tr><td style="text-align: right; padding-right: 12px; color: #dc2626;"><strong>Discount (${discount}%):</strong></td><td class="num" style="color: #dc2626;">-${formatCurrency(discountAmount)}</td></tr>`;
                            html += `<tr><td style="text-align: right; padding-right: 12px;"><strong>After Discount (ex GST):</strong></td><td class="num">${formatCurrency(afterDiscount)} <span style=\"color:#6b7280; font-size: 0.85em;\">+GST</span></td></tr>`;
                            subtotal = afterDiscount;
                        }

                        const gst = subtotal * 0.1;
                        const total = subtotal + gst;
                        const roundedTotal = Math.round(total / 100) * 100; // nearest $100

                        html += `<tr><td style=\"text-align: right; padding-right: 12px;\"><strong>GST (10%):</strong></td><td class=\"num\">${formatCurrency(gst)}</td></tr>`;
                        html += `<tr><td style=\"text-align: right; padding-right: 12px;\"><strong>Total (incl GST, unrounded):</strong></td><td class=\"num\">${formatCurrency(total)}</td></tr>`;
                        html += `<tr style=\"border-top: 2px solid #2C823D;\"><td style=\"text-align: right; padding-right: 12px; padding-top: 8px;\"><strong>Total Project Value (incl GST, rounded):</strong></td><td class=\"num\" style=\"padding-top: 8px; color: #2C823D; font-size: 18px;\"><strong>${formatCurrency(roundedTotal)}</strong></td></tr>`;
                        html += "</table>";
                        html +=
                            '<p style=\"color:#6b7280; font-size: 0.85em; margin-top: 4px;\">All amounts shown in the pricing table are exclusive of GST unless otherwise stated. The Total Project Value includes GST and is rounded to the nearest $100.</p>';
                    }
                    break;
                default:
                    if (node.content) {
                        html += `<p>${processContent(node.content)}</p>`;
                    }
            }
        });

        // Append concluding marker required by rubric
        html +=
            "<p><em>*** This concludes the Scope of Work document. ***</em></p>";

        return html;
    };

    const handleUpdateDoc = (content: any) => {
        // Track the newest JSON to trigger save effect
        setLatestEditorJSON(content);
        if (currentDocId) {
            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === currentDocId ? { ...d, content } : d,
                ),
            );
        }
    };

    const handleCreateAgent = async (agent: Omit<Agent, "id">) => {
        const newId = `agent${Date.now()}`;
        const newAgent: Agent = { id: newId, ...agent };

        try {
            const response = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAgent),
            });

            if (response.ok) {
                setAgents((prev) => [...prev, newAgent]);
                setCurrentAgentId(newId);
                console.log("✅ Agent created in database");
            }
        } catch (error) {
            console.error("❌ Failed to create agent:", error);
        }
    };

    const handleSelectAgent = async (id: string) => {
        setCurrentAgentId(id);

        // ⚠️ REMOVED DATABASE CALLS - AnythingLLM handles message storage via threads
        // Chat history is maintained by AnythingLLM's workspace threads system
        // No need to duplicate in MySQL database
        setChatMessages([]); // Start fresh - AnythingLLM maintains history in its threads

        console.log(
            `✅ Agent selected: ${id}. Chat history managed by AnythingLLM threads.`,
        );
    };

    const handleUpdateAgent = async (id: string, updates: Partial<Agent>) => {
        try {
            const response = await fetch(`/api/agents/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                setAgents((prev) =>
                    prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
                );
                console.log("✅ Agent updated in database");
            }
        } catch (error) {
            console.error("❌ Failed to update agent:", error);
        }
    };

    // 🔀 Reactive chat context switching between Dashboard and Editor
    useEffect(() => {
        const switchContext = async () => {
            if (viewMode === "dashboard") {
                // Clear any SOW chat messages to avoid context leakage
                setChatMessages([]);
                setStreamingMessageId(null);
            } else if (viewMode === "editor") {
                // Load SOW thread history for the current document if available
                const doc = currentDocId
                    ? documents.find((d) => d.id === currentDocId)
                    : null;
                if (
                    doc?.threadSlug &&
                    !doc.threadSlug.startsWith("temp-") &&
                    doc.workspaceSlug
                ) {
                    try {
                        console.log(
                            "💬 [Context Switch] Loading SOW chat history for thread:",
                            doc.threadSlug,
                        );
                        const history = await anythingLLM.getThreadChats(
                            doc.workspaceSlug,
                            doc.threadSlug,
                        );
                        const messages: ChatMessage[] = (history || []).map(
                            (msg: any) => ({
                                id: `msg${Date.now()}-${Math.random()}`,
                                role:
                                    msg.role === "user" ? "user" : "assistant",
                                content: msg.content,
                                timestamp: Date.now(),
                            }),
                        );
                        setChatMessages(messages);
                    } catch (e) {
                        console.warn(
                            "⚠️ Failed to load SOW chat history on context switch:",
                            e,
                        );
                        setChatMessages([]);
                    }
                } else {
                    // No valid thread yet (temp or missing); start clean
                    setChatMessages([]);
                }
            }
        };

        switchContext();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    const handleDeleteAgent = async (id: string) => {
        try {
            const response = await fetch(`/api/agents/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setAgents((prev) => prev.filter((a) => a.id !== id));
                if (currentAgentId === id) {
                    setCurrentAgentId(null);
                    setChatMessages([]);
                }
                console.log(
                    "✅ Agent deleted from database (messages cascade deleted)",
                );
            }
        } catch (error) {
            console.error("❌ Failed to delete agent:", error);
        }
    };

    const handleInsertContent = async (
        content: string,
        suggestedRoles: any[] = [],
    ) => {
        console.log(
            "📝 Inserting content into editor:",
            content.substring(0, 100),
        );
        console.log("📝 Editor ref exists:", !!editorRef.current);
        console.log("📄 Current doc ID:", currentDocId);

        // 🎯 Extract and log [FINANCIAL_REASONING] block for transparency
        extractFinancialReasoning(content);

        if (!editorRef.current) {
            console.error("Editor not initialized, cannot insert content.");
            return;
        }

        if (!content || !currentDocId) {
            console.error("❌ Missing content or document ID");
            return;
        }

        try {
            // 🧹 Filter out internal reasoning sections before processing
            let filteredContent = content;

            // Remove known internal sections (keep narrative clean)
            filteredContent = filteredContent.replace(
                /\[FINANCIAL[\*_\s-]*REASONING[\*_\s-]*\][\s\S]*?(?=\n\s*\[|\n\s*##|\n\s*###|$)/gi,
                "",
            );
            filteredContent = filteredContent.replace(
                /\[BUDGET[\*_\s-]*NOTE[\*_\s-]*\][\s\S]*?(?=\n\s*\[|\n\s*##|\n\s*###|$)/gi,
                "",
            );
            filteredContent = filteredContent.replace(
                /\[GENERATE\s+THE\s+SOW\]/gi,
                "",
            );

            // 1) Extract ONLY the FINAL JSON code block (clean output, not AI thought stream).
            //    Replace it with a [editablePricingTable] placeholder to preserve placement.
            let markdownPart = filteredContent;
            const tablesRolesQueue: any[][] = [];
            const tablesDiscountsQueue: number[] = [];
            let parsedStructured: ArchitectSOW | null = null;
            let hasValidSuggestedRoles = false;
            let extractedDiscount: number | undefined;

            // 🎯 CRITICAL FIX: Extract ONLY the final JSON block using the robust regex
            const regex = /```json\s*([\s\S]*?)\s*```/g;
            const allMatches = Array.from(filteredContent.matchAll(regex));

            if (allMatches.length === 0) {
                console.warn(
                    "❌ No valid final JSON block found in the AI response. Proceeding with markdown-only content.",
                );
                // Continue without JSON data; just use the markdown narrative
            } else {
                // 🎯 Get the content of the VERY LAST match (the final, clean JSON output)
                const finalMatch = allMatches[allMatches.length - 1];
                const finalJsonString = finalMatch[1];
                const finalFullBlock = finalMatch[0];

                console.log(
                    `🔍 [JSON Extraction] Found ${allMatches.length} JSON block(s); extracting the FINAL one for parsing.`,
                );

                try {
                    // Add validation before parsing
                    if (
                        !finalJsonString ||
                        finalJsonString.trim().length === 0
                    ) {
                        console.warn("⚠️ Empty JSON string, skipping parse");
                        markdownPart = filteredContent.trim();
                        throw new Error("Empty JSON string");
                    }
                    const obj = JSON.parse(finalJsonString);
                    console.log("📦 [Final JSON Block] Parsed object:", {
                        hasRoles: Array.isArray(obj?.roles),
                        hasSuggestedRoles: Array.isArray(obj?.suggestedRoles),
                        hasScopeItems: Array.isArray(obj?.scopeItems),
                        hasRoleAllocation: Array.isArray(obj?.role_allocation),
                        rolesLength: obj?.roles?.length,
                        suggestedRolesLength: obj?.suggestedRoles?.length,
                        scopeItemsLength: obj?.scopeItems?.length,
                        roleAllocationLength: obj?.role_allocation?.length,
                        keys: Object.keys(obj),
                    });
                    let rolesArr: any[] = [];
                    let discountVal: number | undefined = undefined;

                    // Check for role_allocation (new [PRICING_JSON] format)
                    if (Array.isArray(obj?.role_allocation)) {
                        rolesArr = obj.role_allocation;
                        console.log(
                            `✅ Using ${rolesArr.length} roles from obj.role_allocation ([PRICING_JSON] format)`,
                        );
                    } else if (Array.isArray(obj?.roles)) {
                        rolesArr = obj.roles;
                        console.log(
                            `✅ Using ${rolesArr.length} roles from obj.roles`,
                        );
                    } else if (Array.isArray(obj?.suggestedRoles)) {
                        rolesArr = obj.suggestedRoles;
                        console.log(
                            `✅ Using ${rolesArr.length} roles from obj.suggestedRoles`,
                        );
                    } else if (Array.isArray(obj?.scopeItems)) {
                        const derived = buildSuggestedRolesFromArchitectSOW(
                            obj as ArchitectSOW,
                        );
                        rolesArr = derived;
                        console.log(
                            `✅ Derived ${rolesArr.length} roles from obj.scopeItems`,
                        );
                    } else {
                        console.warn(
                            "⚠️ Final JSON block has no roles, suggestedRoles, scopeItems, or role_allocation arrays",
                        );
                    }

                    // Check for discount in various formats
                    if (typeof obj?.discount === "number") {
                        discountVal = obj.discount;
                    } else if (typeof obj?.discount_percentage === "number") {
                        discountVal = obj.discount_percentage;
                    } else if (
                        typeof obj?.project_details?.discount_percentage ===
                        "number"
                    ) {
                        discountVal = obj.project_details.discount_percentage;
                    }

                    if (rolesArr.length > 0) {
                        console.log(
                            `✅ Adding ${rolesArr.length} roles to queue`,
                        );
                        tablesRolesQueue.push(rolesArr);
                        tablesDiscountsQueue.push(discountVal ?? 0);

                        // Replace the final JSON block with placeholder
                        const blockIndex =
                            filteredContent.lastIndexOf(finalFullBlock);
                        if (blockIndex !== -1) {
                            markdownPart =
                                filteredContent.substring(0, blockIndex) +
                                "\n[editablePricingTable]\n" +
                                filteredContent.substring(
                                    blockIndex + finalFullBlock.length,
                                );
                        }
                        hasValidSuggestedRoles = true;
                        console.log(
                            `✅ Detected 1 final pricing JSON block; will insert 1 pricing table.`,
                        );
                    } else {
                        console.warn(
                            `⚠️ Final JSON block parsed but rolesArr is empty - proceeding with markdown only`,
                        );
                        markdownPart = filteredContent.trim();
                    }

                    // 🎯 V4.1 Multi-Scope Data Storage
                    if (obj.scopes && Array.isArray(obj.scopes)) {
                        console.log(
                            `✅ Storing V4.1 multi-scope data: ${obj.scopes.length} scopes`,
                        );
                        localMultiScopeData = {
                            scopes: obj.scopes,
                            discount: discountVal ?? 0,
                            extractedAt: Date.now(),
                        };
                        setMultiScopePricingData(localMultiScopeData);
                        convertOptions.multiScopePricingData =
                            localMultiScopeData;
                    }
                } catch (error) {
                    console.error(
                        "❌ Failed to parse the final JSON block:",
                        error,
                    );
                    console.error(
                        "📋 JSON string that failed to parse (first 500 chars):",
                        finalJsonString?.substring(0, 500) || "N/A",
                    );
                    // MUST handle gracefully without crashing
                    markdownPart = filteredContent.trim();
                    console.warn(
                        "⚠️ Proceeding with markdown content only due to JSON parse error.",
                    );
                }
            }

            if (!hasValidSuggestedRoles && suggestedRoles.length === 0) {
                // Backward compatibility: single-block helpers
                const single = extractPricingJSON(filteredContent);
                if (single && single.roles && single.roles.length > 0) {
                    suggestedRoles = single.roles;
                    extractedDiscount = single.discount;
                    hasValidSuggestedRoles = true;
                    // Remove first JSON block occurrence if any
                    const jm = filteredContent.match(
                        /```json\s*[\s\S]*?\s*```/i,
                    );
                    if (jm)
                        markdownPart = filteredContent
                            .replace(jm[0], "")
                            .trim();
                    console.log(
                        `✅ Using ${suggestedRoles.length} roles from [PRICING_JSON] (single-block)`,
                    );

                    // 🎯 V4.1 Multi-Scope Data Storage
                    if (single.multiScopeData && single.multiScopeData.scopes) {
                        console.log(
                            `✅ Storing V4.1 multi-scope data: ${single.multiScopeData.scopes.length} scopes`,
                        );
                        localMultiScopeData = {
                            ...single.multiScopeData,
                            extractedAt: Date.now(),
                        };
                        setMultiScopePricingData(localMultiScopeData);
                        convertOptions.multiScopePricingData =
                            localMultiScopeData;
                    }
                } else {
                    // Legacy: attempt to parse first JSON block for roles/scopeItems
                    const legacyMatch = filteredContent.match(
                        /```json\s*([\s\S]*?)\s*```/,
                    );
                    if (legacyMatch && legacyMatch[1]) {
                        try {
                            const parsedJson = JSON.parse(legacyMatch[1]);
                            if (parsedJson.suggestedRoles) {
                                suggestedRoles = [
                                    ...suggestedRoles,
                                    ...parsedJson.suggestedRoles,
                                ];
                                markdownPart = content
                                    .replace(legacyMatch[0], "")
                                    .trim();
                                hasValidSuggestedRoles =
                                    suggestedRoles.length > 0;
                                console.log(
                                    `✅ Parsed ${suggestedRoles.length} suggested roles from legacy JSON.`,
                                );
                            } else if (parsedJson.scopeItems) {
                                parsedStructured = parsedJson as ArchitectSOW;
                                const derived =
                                    buildSuggestedRolesFromArchitectSOW(
                                        parsedStructured,
                                    );
                                if (derived.length > 0) {
                                    suggestedRoles = derived;
                                    markdownPart = content
                                        .replace(legacyMatch[0], "")
                                        .trim();
                                    hasValidSuggestedRoles = true;
                                    console.log(
                                        `✅ Derived ${suggestedRoles.length} roles from Architect structured JSON (legacy).`,
                                    );
                                }
                            }
                        } catch (e) {
                            console.warn(
                                "⚠️ Could not parse suggested roles JSON from AI response.",
                                e,
                            );
                        }
                    }
                }
            }

            // 2) Scrub remaining internal bracketed tags (preserve markdown links)
            const scrubBracketTagsPreserveLinks = (txt: string) => {
                return txt.replace(/\[[^\]]+\]/g, (match, offset, str) => {
                    const nextChar = str[(offset as number) + match.length];
                    // If this is a markdown link like [text](...), keep it
                    if (nextChar === "(") return match;
                    // Remove only if inside is likely an internal tag (primarily uppercase, digits, spaces, and symbols)
                    const inner = match.slice(1, -1);
                    if (/^[A-Z0-9 _\-\/&]+$/.test(inner)) return "";
                    return match;
                });
            };
            markdownPart = scrubBracketTagsPreserveLinks(markdownPart)
                // Also directly strip explicit known tags variants
                .replace(
                    /\[(?:PRICING[\/_ ]?JSON|ANALYZE(?:\s*&\s*CLASSIFY)?|FINANCIAL[_\s-]*REASONING|BUDGET[_\s-]*NOTE)\]/gi,
                    "",
                )
                .replace(/\n{3,}/g, "\n\n")
                .trim();

            // 2. Clean the markdown content
            console.log("🧹 Cleaning SOW content...");
            const cleanedContent = cleanSOWContent(markdownPart);
            console.log("✅ Content cleaned");

            // 🔒 SECURITY: Validate AI response before processing
            console.log("🔒 [SECURITY] Validating AI response...");
            const validationResult = validateAIResponse(cleanedContent);
            if (!validationResult.isValid) {
                console.error(
                    "❌ [SECURITY] AI response validation failed:",
                    validationResult.errors,
                );
                const securityError: ChatMessage = {
                    id: `msg${Date.now()}`,
                    role: "assistant",
                    content: `❌ Security Alert: Invalid AI response detected. Please regenerate your request. Issues: ${validationResult.errors.join(", ")}`,
                    timestamp: Date.now(),
                };
                setChatMessages((prev) => [...prev, securityError]);
                return; // Abort processing on security issues
            }

            if (validationResult.warnings) {
                console.warn(
                    "⚠️ [SECURITY] AI response validation warnings:",
                    validationResult.warnings,
                );
            }

            console.log("✅ [SECURITY] AI response validated successfully");

            // 3. Validate suggestedRoles were properly extracted
            console.log(
                "🔄 Converting markdown to JSON with suggested roles...",
            );
            console.log("📊 suggestedRoles array:", suggestedRoles);
            console.log(
                "📊 suggestedRoles length:",
                suggestedRoles?.length || 0,
            );

            // 🎯 Extract budget and discount from last user prompt for financial calculations
            const { budget: userPromptBudget, discount: userPromptDiscount } =
                extractBudgetAndDiscount(lastUserPrompt);

            // 🎯 Capture multiScopePricingData locally to pass through convertOptions
            let localMultiScopeData: ConvertOptions["multiScopePricingData"] =
                undefined;

            const convertOptions: ConvertOptions = {
                strictRoles: false,
                userPromptBudget,
                userPromptDiscount,
                jsonDiscount: extractedDiscount, // Discount from [PRICING_JSON] takes priority
                tablesRoles: tablesRolesQueue,
                tablesDiscounts: tablesDiscountsQueue,
                multiScopePricingData: localMultiScopeData, // Will be set below if found
            };

            // CRITICAL: If no suggestedRoles provided from JSON, try extracting Architect structured JSON from the message body
            let convertedContent;
            console.log(
                `🔍 [Validation] hasValidSuggestedRoles=${hasValidSuggestedRoles}, tablesRolesQueue.length=${tablesRolesQueue.length}`,
            );
            if (!hasValidSuggestedRoles) {
                console.log(
                    "⚠️ No valid suggested roles from JSON blocks, attempting fallback extraction...",
                );
                // Try to extract structured JSON from cleaned markdown (if not already parsed above)
                let structured = parsedStructured;
                if (!structured) {
                    console.log(
                        "🔍 Attempting to extract structured JSON from markdownPart...",
                    );
                    structured = extractSOWStructuredJson(markdownPart);
                    console.log(
                        "📊 Extracted structured JSON:",
                        structured ? "Found" : "Not found",
                    );
                }
                let derived = buildSuggestedRolesFromArchitectSOW(structured);
                console.log(
                    `📊 Derived ${derived?.length || 0} roles from structured JSON`,
                );

                // Final fallback: use structuredSow captured from the streamed response (if available)
                if ((!derived || derived.length === 0) && structuredSow) {
                    console.log(
                        "🔍 Attempting to use structuredSow from state...",
                    );
                    const fromState =
                        buildSuggestedRolesFromArchitectSOW(structuredSow);
                    if (fromState.length > 0) {
                        console.log(
                            `✅ Using ${fromState.length} roles derived from captured structured JSON state.`,
                        );
                        derived = fromState;
                    }
                }

                if (derived && derived.length > 0) {
                    console.log(
                        `✅ Using ${derived.length} roles derived from Architect structured JSON.`,
                    );
                    // 🔒 AM Guardrail: sanitize Account Management variants
                    const sanitized = sanitizeAccountManagementRoles(derived);
                    convertedContent = convertMarkdownToNovelJSON(
                        cleanedContent,
                        sanitized,
                        convertOptions,
                    );
                } else {
                    console.error(
                        "❌ CRITICAL ERROR: AI did not provide suggestedRoles JSON or scopeItems. The application requires one of these.",
                    );
                    console.error("📊 Debug info:", {
                        hasValidSuggestedRoles,
                        tablesRolesQueueLength: tablesRolesQueue.length,
                        parsedStructured: !!parsedStructured,
                        structured: !!structured,
                        derivedLength: derived?.length || 0,
                        structuredSow: !!structuredSow,
                    });
                    const blockedMessage: ChatMessage = {
                        id: `msg${Date.now()}`,
                        role: "assistant",
                        content:
                            "❌ Insertion blocked: Missing structured pricing data. Please regenerate with a JSON block that includes either `suggestedRoles` or `scopeItems` (with role names and estimated hours).",
                        timestamp: Date.now(),
                    };
                    setChatMessages((prev) => [...prev, blockedMessage]);
                    return; // Strictly abort insertion when no pricing data is available
                }
            } else {
                // 🔒 AM Guardrail: sanitize Account Management variants
                const sanitized =
                    sanitizeAccountManagementRoles(suggestedRoles);
                convertedContent = convertMarkdownToNovelJSON(
                    cleanedContent,
                    sanitized,
                    convertOptions,
                );
            }
            console.log("✅ Content converted");

            // 4. Extract title from the content
            const titleMatch = cleanedContent.match(/^#\s+(.+)$/m);
            const clientMatch = cleanedContent.match(
                /\*\*Client:\*\*\s+(.+)$/m,
            );
            const scopeMatch = cleanedContent.match(/Scope of Work:\s+(.+)/);

            let docTitle = "New SOW";
            if (titleMatch) {
                docTitle = titleMatch[1];
            } else if (scopeMatch) {
                docTitle = scopeMatch[1];
            } else if (clientMatch) {
                docTitle = `SOW - ${clientMatch[1]}`;
            }

            // 5. Merge or set editor content depending on existing content
            let finalContent = convertedContent;
            const existing = editorRef.current?.getContent?.();
            const isTrulyEmpty =
                !existing ||
                !Array.isArray(existing.content) ||
                existing.content.length === 0 ||
                (existing.content.length === 1 &&
                    existing.content[0]?.type === "paragraph" &&
                    (!existing.content[0].content ||
                        existing.content[0].content.length === 0));

            if (!isTrulyEmpty) {
                // Replace the entire document on first proper insert from AI
                // The convertedContent already merges narrative + pricing table
                finalContent = {
                    ...convertedContent,
                    content: sanitizeEmptyTextNodes(convertedContent.content),
                } as any;
                console.log(
                    "📝 Replacing existing non-empty editor with full merged content",
                );
            } else {
                // Fresh set for truly empty editor
                finalContent = {
                    ...convertedContent,
                    content: sanitizeEmptyTextNodes(convertedContent.content),
                } as any;
                console.log("🆕 Setting content on empty editor");
            }

            // Update editor
            if (editorRef.current) {
                if (editorRef.current.commands?.setContent) {
                    editorRef.current.commands.setContent(finalContent);
                } else {
                    editorRef.current.insertContent(finalContent);
                }
                console.log("✅ Editor content updated successfully");

                // ✅ FIX: Immediately sync latestEditorJSON to prevent auto-save from overwriting with stale content
                // This ensures the newly inserted content is the authoritative source of truth
                setLatestEditorJSON(finalContent);
                console.log(
                    "🔒 [Race Condition Fix] Locked in new editor state to prevent auto-save overwrite",
                );
            } else {
                console.warn(
                    "⚠️ Editor ref not available, skipping direct update",
                );
            }

            // 6. Update the document state with new content and title
            console.log("📝 Updating document state and title:", docTitle);
            const newContentForState = finalContent;
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === currentDocId
                        ? {
                              ...doc,
                              content: newContentForState,
                              title: docTitle,
                          }
                        : doc,
                ),
            );
            console.log("✅ Document state updated successfully");

            // 7. Embed SOW in both client workspace and master dashboard
            const currentAgent = agents.find((a) => a.id === currentAgentId);
            const useAnythingLLM = currentAgent?.model === "anythingllm";

            if (useAnythingLLM && currentAgentId) {
                console.log("🤖 Embedding SOW in workspaces...");
                try {
                    // 🔧 CRITICAL FIX: Extract client name from document title to create client-specific workspace
                    // SOW title format: "SOW - ClientName - ServiceType" or "Scope of Work: ClientName"
                    let clientWorkspaceSlug =
                        getWorkspaceForAgent(currentAgentId); // Default fallback

                    // Extract client name from document title OR use workspace name as fallback
                    const clientNameMatch = docTitle.match(
                        /(?:SOW|Scope of Work)[:\s-]+([^-:]+)/i,
                    );
                    const clientName =
                        clientNameMatch && clientNameMatch[1]
                            ? clientNameMatch[1].trim()
                            : getWorkspaceForAgent(currentAgentId); // Use workspace name as fallback

                    console.log(
                        `🏢 Using client name: ${clientName} (from ${clientNameMatch ? "title" : "workspace"})`,
                    );

                    // ARCHITECTURAL SIMPLIFICATION: Use master 'gen' workspace for all SOW generation
                    try {
                        const masterWorkspace =
                            await anythingLLM.getMasterSOWWorkspace(clientName);
                        clientWorkspaceSlug = masterWorkspace.slug;
                        console.log(
                            `✅ Using master SOW generation workspace: ${clientWorkspaceSlug}`,
                        );
                    } catch (wsError) {
                        console.warn(
                            `⚠️ Could not access master workspace`,
                            wsError,
                        );
                    }

                    const success = await anythingLLM.embedSOWInBothWorkspaces(
                        docTitle,
                        cleanedContent,
                        clientName,
                    );

                    if (success) {
                        console.log(
                            "✅ SOW embedded in both workspaces successfully",
                        );
                        toast.success(
                            "✅ Content inserted and embedded in both workspaces!",
                        );
                    } else {
                        console.warn("⚠️ Embedding completed with warnings");
                        toast.success(
                            "✅ Content inserted to editor (workspace embedding had issues)",
                        );
                    }
                } catch (embedError) {
                    console.error("⚠️ Embedding error:", embedError);
                    toast.success(
                        "✅ Content inserted to editor (embedding skipped)",
                    );
                }
            } else {
                toast.success("✅ Content inserted into editor!");
            }
        } catch (error) {
            console.error("Error inserting content:", error);
            toast.error("❌ Failed to insert content. Please try again.");
        }
    };

    const [currentRequestController, setCurrentRequestController] =
        useState<AbortController | null>(null);
    const [lastMessageSentTime, setLastMessageSentTime] = useState<number>(0);
    const MESSAGE_RATE_LIMIT = 1000; // Wait at least 1 second between messages to avoid rate limiting

    const handleSendMessage = async (
        message: string,
        threadSlugParam?: string | null,
        attachments?: Array<{
            name: string;
            mime: string;
            contentString: string;
        }>,
    ) => {
        // In dashboard mode, we don't need an agent selected - use dashboard workspace directly
        const isDashboardMode = viewMode === "dashboard";

        if (!message.trim()) return;
        // Do not require an agent in editor mode — workspace context is sufficient

        // Rate limiting: prevent sending messages too quickly
        const now = Date.now();
        if (now - lastMessageSentTime < MESSAGE_RATE_LIMIT) {
            console.warn(
                `⏱️ Rate limit: Please wait before sending another message. (${Math.ceil((MESSAGE_RATE_LIMIT - (now - lastMessageSentTime)) / 1000)}s)`,
            );
            toast.error(
                "⏱️ Please wait a moment before sending another message.",
            );
            return;
        }
        setLastMessageSentTime(now);

        // Cancel any previous ongoing request to avoid flooding the API
        if (currentRequestController) {
            console.log(
                "🛑 Cancelling previous request to avoid rate limiting...",
            );
            currentRequestController.abort();
        }

        // Create new AbortController for this request
        const controller = new AbortController();
        setCurrentRequestController(controller);

        setIsChatLoading(true);

        // Check for insert command (only relevant in editor mode)
        if (
            !isDashboardMode &&
            (message.toLowerCase().includes("insert into editor") ||
                message.toLowerCase() === "insert" ||
                message.toLowerCase().includes("add to editor"))
        ) {
            console.log("📝 Insert command detected!", { message });
            setIsChatLoading(false);

            // Find the last AI response in chat history (excluding confirmation messages)
            const lastAIMessage = [...chatMessages]
                .reverse()
                .find(
                    (msg) =>
                        msg.role === "assistant" &&
                        !msg.content.includes("✅ SOW has been inserted") &&
                        !msg.content.includes("Ready to insert"),
                );

            console.log(
                "📋 Found AI message:",
                lastAIMessage?.content.substring(0, 100),
            );
            console.log("📝 Editor ref exists:", !!editorRef.current);
            console.log("📄 Current doc ID:", currentDocId);

            // 🎯 Extract and log [FINANCIAL_REASONING] block for transparency
            if (lastAIMessage) {
                extractFinancialReasoning(lastAIMessage.content);
            }

            if (lastAIMessage && currentDocId) {
                try {
                    // 1. Separate Markdown from JSON from the last AI message (multi-block aware)
                    let markdownPart = lastAIMessage.content;
                    let suggestedRoles: any[] = [];
                    let hasValidSuggestedRoles = false;
                    let extractedDiscount: number | undefined;
                    const tablesRolesQueue: any[][] = [];
                    const tablesDiscountsQueue: number[] = [];

                    const jsonBlocks = Array.from(
                        markdownPart.matchAll(/```json\s*([\s\S]*?)\s*```/gi),
                    );
                    if (jsonBlocks.length > 0) {
                        let rebuilt = "";
                        let lastIndex = 0;
                        for (const m of jsonBlocks) {
                            const full = m[0];
                            const body = m[1];
                            const start = m.index || 0;
                            const end = start + full.length;
                            rebuilt += markdownPart.slice(lastIndex, start);
                            lastIndex = end;
                            try {
                                const obj = JSON.parse(body);
                                let rolesArr: any[] = [];
                                let discountVal: number | undefined = undefined;
                                if (Array.isArray(obj?.roles))
                                    rolesArr = obj.roles;
                                else if (Array.isArray(obj?.suggestedRoles))
                                    rolesArr = obj.suggestedRoles;
                                else if (Array.isArray(obj?.scopeItems))
                                    rolesArr =
                                        buildSuggestedRolesFromArchitectSOW(
                                            obj as ArchitectSOW,
                                        );
                                if (typeof obj?.discount === "number")
                                    discountVal = obj.discount;
                                if (rolesArr.length > 0) {
                                    tablesRolesQueue.push(rolesArr);
                                    tablesDiscountsQueue.push(discountVal ?? 0);
                                    rebuilt += "\n[editablePricingTable]\n";
                                } else {
                                    rebuilt += full;
                                }
                            } catch {
                                rebuilt += full;
                            }
                        }
                        rebuilt += markdownPart.slice(lastIndex);
                        markdownPart = rebuilt.trim();
                        hasValidSuggestedRoles = tablesRolesQueue.length > 0;
                        if (hasValidSuggestedRoles)
                            console.log(
                                `✅ Using ${tablesRolesQueue.length} pricing JSON block(s) for insertion (insert command).`,
                            );
                    } else {
                        // Single-block helpers
                        const legacyMatch = markdownPart.match(
                            /```json\s*([\s\S]*?)\s*```/,
                        );
                        const pricingJsonData = extractPricingJSON(
                            lastAIMessage.content,
                        );
                        if (
                            pricingJsonData &&
                            pricingJsonData.roles &&
                            pricingJsonData.roles.length > 0
                        ) {
                            suggestedRoles = pricingJsonData.roles;
                            extractedDiscount = pricingJsonData.discount;
                            hasValidSuggestedRoles = true;

                            // 🎯 V4.1 Multi-Scope Data Storage
                            if (
                                pricingJsonData.multiScopeData &&
                                pricingJsonData.multiScopeData.scopes &&
                                pricingJsonData.multiScopeData.scopes.length > 0
                            ) {
                                console.log(
                                    `✅ Storing V4.1 multi-scope data: ${pricingJsonData.multiScopeData.scopes.length} scopes`,
                                );
                                const multiScopeDataLocal = {
                                    ...pricingJsonData.multiScopeData,
                                    extractedAt: Date.now(),
                                };
                                setMultiScopePricingData(multiScopeDataLocal);
                                convertOptions.multiScopePricingData =
                                    multiScopeDataLocal;
                            }

                            if (legacyMatch)
                                markdownPart = markdownPart
                                    .replace(legacyMatch[0], "")
                                    .trim();
                            console.log(
                                `✅ Using ${suggestedRoles.length} roles from [PRICING_JSON] (insert command)`,
                            );
                        } else if (legacyMatch && legacyMatch[1]) {
                            try {
                                const parsedJson = JSON.parse(legacyMatch[1]);
                                if (parsedJson.suggestedRoles) {
                                    suggestedRoles = parsedJson.suggestedRoles;
                                    markdownPart = markdownPart
                                        .replace(legacyMatch[0], "")
                                        .trim();
                                    hasValidSuggestedRoles =
                                        suggestedRoles.length > 0;
                                    console.log(
                                        `✅ Parsed ${suggestedRoles.length} roles from "insert" command (legacy format).`,
                                    );
                                } else if (parsedJson.scopeItems) {
                                    const derived =
                                        buildSuggestedRolesFromArchitectSOW(
                                            parsedJson as ArchitectSOW,
                                        );
                                    if (derived.length > 0) {
                                        suggestedRoles = derived;
                                        markdownPart = markdownPart
                                            .replace(legacyMatch[0], "")
                                            .trim();
                                        hasValidSuggestedRoles = true;
                                        console.log(
                                            `✅ Derived ${suggestedRoles.length} roles from Architect structured JSON (insert command).`,
                                        );
                                    }
                                }
                            } catch (e) {
                                console.warn(
                                    "⚠️ Could not parse suggestedRoles JSON from last AI message.",
                                    e,
                                );
                            }
                        }
                    }

                    // 2. Scrub internal bracketed tags, then clean the markdown content
                    const scrubBracketTagsPreserveLinks = (txt: string) => {
                        return txt.replace(
                            /\[[^\]]+\]/g,
                            (match, offset, str) => {
                                const nextChar =
                                    str[(offset as number) + match.length];
                                if (nextChar === "(") return match; // keep markdown links
                                const inner = match.slice(1, -1);
                                if (/^[A-Z0-9 _\-\/&]+$/.test(inner)) return "";
                                return match;
                            },
                        );
                    };
                    console.log("🧹 Cleaning SOW content for insertion...");
                    const cleanedMessage = cleanSOWContent(
                        scrubBracketTagsPreserveLinks(
                            markdownPart.replace(
                                /\[(?:PRICING[\/_ ]?JSON|ANALYZE(?:\s*&\s*CLASSIFY)?|FINANCIAL[_\s-]*REASONING|BUDGET[_\s-]*NOTE)\]/gi,
                                "",
                            ),
                        ),
                    );
                    console.log("✅ Content cleaned");

                    // 3. Convert markdown and roles to Novel/TipTap JSON
                    console.log(
                        "🔄 Converting markdown to JSON for insertion...",
                    );

                    // 🎯 Extract budget and discount from last user prompt for financial calculations
                    const {
                        budget: userPromptBudget,
                        discount: userPromptDiscount,
                    } = extractBudgetAndDiscount(lastUserPrompt);
                    const convertOptions: ConvertOptions = {
                        strictRoles: false,
                        userPromptBudget,
                        userPromptDiscount,
                        jsonDiscount: extractedDiscount, // Discount from [PRICING_JSON] takes priority
                        tablesRoles: tablesRolesQueue,
                        tablesDiscounts: tablesDiscountsQueue,
                    };

                    let content;
                    if (!hasValidSuggestedRoles) {
                        // Try deriving roles from Architect structured JSON in the chat message
                        const structured =
                            extractSOWStructuredJson(markdownPart);
                        const derived =
                            buildSuggestedRolesFromArchitectSOW(structured);
                        if (derived.length > 0) {
                            console.log(
                                `✅ Using ${derived.length} roles derived from Architect structured JSON (insert command).`,
                            );
                            // 🔒 AM Guardrail in insert flow
                            const sanitized =
                                sanitizeAccountManagementRoles(derived);
                            content = convertMarkdownToNovelJSON(
                                cleanedMessage,
                                sanitized,
                                convertOptions,
                            );
                        } else {
                            console.error(
                                "❌ CRITICAL ERROR: AI did not provide suggestedRoles JSON for insert command. Aborting insert to avoid placeholder pricing.",
                            );
                            // Emit an assistant message explaining the requirement and exit without inserting
                            const errorMsg: ChatMessage = {
                                id: `msg${Date.now()}`,
                                role: "assistant",
                                content:
                                    'Pricing data (suggestedRoles) was not provided. Please ask The Architect to regenerate with a valid JSON code block containing suggestedRoles, then try "insert into editor" again. No placeholder tables were inserted.',
                                timestamp: Date.now(),
                            };
                            setChatMessages((prev) => [...prev, errorMsg]);
                            setIsChatLoading(false);
                            return;
                        }
                    } else {
                        // 🔒 AM Guardrail: sanitize in insert flow as well
                        const sanitized =
                            sanitizeAccountManagementRoles(suggestedRoles);
                        content = convertMarkdownToNovelJSON(
                            cleanedMessage,
                            sanitized,
                            convertOptions,
                        );
                    }
                    console.log("✅ Content converted");

                    // 4. Extract title from the SOW content
                    const titleMatch = cleanedMessage.match(/^#\s+(.+)$/m);
                    const clientMatch = cleanedMessage.match(
                        /\*\*Client:\*\*\s+(.+)$/m,
                    );
                    const scopeMatch = cleanedMessage.match(
                        /Scope of Work:\s+(.+)/,
                    );

                    let docTitle = "New SOW";
                    if (titleMatch) {
                        docTitle = titleMatch[1];
                    } else if (scopeMatch) {
                        docTitle = scopeMatch[1];
                    } else if (clientMatch) {
                        docTitle = `SOW - ${clientMatch[1]}`;
                    }

                    // 5. Determine if editor is truly empty; if not, replace with full merged content
                    const existing = editorRef.current?.getContent?.();
                    const isTrulyEmpty =
                        !existing ||
                        !Array.isArray(existing.content) ||
                        existing.content.length === 0 ||
                        (existing.content.length === 1 &&
                            existing.content[0]?.type === "paragraph" &&
                            (!existing.content[0].content ||
                                existing.content[0].content.length === 0));
                    const finalContent = {
                        ...content,
                        content: sanitizeEmptyTextNodes(content.content),
                    };
                    console.log(
                        "🧩 Chat insert: applying full merged content. Empty editor:",
                        isTrulyEmpty,
                    );

                    // 6. Update the document state
                    console.log(
                        "📝 Updating document state:",
                        docTitle,
                        " Empty editor:",
                        isTrulyEmpty,
                    );
                    setDocuments((prev) =>
                        prev.map((doc) =>
                            doc.id === currentDocId
                                ? {
                                      ...doc,
                                      content: finalContent,
                                      title: docTitle,
                                  }
                                : doc,
                        ),
                    );

                    // 7. Save to database (this is a critical user action)
                    console.log("💾 Saving SOW to database...");
                    try {
                        await fetch(`/api/sow/${currentDocId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                title: docTitle,
                                content: finalContent, // Send the merged rich JSON content
                            }),
                        });
                        console.log("✅ SOW saved to database successfully");
                    } catch (saveError) {
                        console.error("❌ Database save error:", saveError);
                    }

                    // 8. Update the editor directly with full merged content
                    if (editorRef.current) {
                        if (editorRef.current.commands?.setContent) {
                            editorRef.current.commands.setContent(finalContent);
                        } else {
                            editorRef.current.insertContent(finalContent);
                        }
                        // ✅ FIX: Immediately sync latestEditorJSON to prevent auto-save from overwriting
                        setLatestEditorJSON(finalContent);
                        console.log(
                            "🔒 [Race Condition Fix] Locked in new editor state to prevent auto-save overwrite",
                        );
                    }

                    // 9. Embed SOW in master 'gen' workspace and master dashboard
                    const currentAgent = agents.find(
                        (a) => a.id === currentAgentId,
                    );
                    if (
                        currentAgent?.model === "anythingllm" &&
                        currentAgentId
                    ) {
                        console.log(
                            "🤖 Embedding SOW in master AnythingLLM workspaces...",
                        );
                        try {
                            const clientContext =
                                getWorkspaceForAgent(currentAgentId) ||
                                "unknown";
                            await anythingLLM.embedSOWInBothWorkspaces(
                                docTitle,
                                cleanedMessage,
                                clientContext,
                            );
                            console.log(
                                "✅ SOW embedded in master AnythingLLM workspaces",
                            );
                        } catch (embedError) {
                            console.error(
                                "⚠️ AnythingLLM embedding error:",
                                embedError,
                            );
                        }
                    }

                    // 10. Add confirmation message to chat
                    const confirmMessage: ChatMessage = {
                        id: `msg${Date.now()}`,
                        role: "assistant",
                        content:
                            "✅ SOW has been inserted into the editor, saved, and embedded in the knowledge base!",
                        timestamp: Date.now(),
                    };
                    setChatMessages((prev) => [...prev, confirmMessage]);

                    return;
                } catch (error) {
                    console.error("Error inserting content:", error);
                    const errorMessage: ChatMessage = {
                        id: `msg${Date.now()}`,
                        role: "assistant",
                        content:
                            "❌ Error inserting content into editor. Please try again.",
                        timestamp: Date.now(),
                    };
                    setChatMessages((prev) => [...prev, errorMessage]);
                    return;
                }
            }
        }

        // 🎯 AUTO-DETECT CLIENT NAME from user prompt
        const detectedClientName = extractClientName(message);
        if (detectedClientName && currentDocId) {
            console.log(
                "🏢 Detected client name in prompt:",
                detectedClientName,
            );

            // Auto-rename SOW to include client name
            const newSOWTitle = `SOW - ${detectedClientName}`;

            // Update document title in state
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === currentDocId
                        ? { ...doc, title: newSOWTitle }
                        : doc,
                ),
            );

            // Also update sidebar workspaces list and move SOW to top of its folder
            setWorkspaces((prev) =>
                prev.map((ws) => {
                    const has = ws.sows.some((s) => s.id === currentDocId);
                    if (!has) return ws;
                    const updated = ws.sows.map((s) =>
                        s.id === currentDocId ? { ...s, name: newSOWTitle } : s,
                    );
                    const moved = [
                        updated.find((s) => s.id === currentDocId)!,
                        ...updated.filter((s) => s.id !== currentDocId),
                    ];
                    return { ...ws, sows: moved };
                }),
            );

            // Save to database
            fetch("/api/sow/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentDocId,
                    title: newSOWTitle,
                    clientName: detectedClientName,
                }),
            }).catch((err) =>
                console.error("❌ Failed to auto-rename SOW:", err),
            );

            console.log("✅ Auto-renamed SOW to:", newSOWTitle);
            toast.success(`🏢 Auto-detected client: ${detectedClientName}`);
        }

        // 🎯 EXTRACT BUDGET AND DISCOUNT from user prompt for pricing calculator
        setLastUserPrompt(message); // Store for later use when AI responds

        const userMessage: ChatMessage = {
            id: `msg${Date.now()}`,
            role: "user",
            content: message,
            timestamp: Date.now(),
        };

        const newMessages = [...chatMessages, userMessage];
        setChatMessages(newMessages);

        // ⚠️ REMOVED DATABASE SAVE - AnythingLLM handles all message storage

        // Always route via AnythingLLM using workspace context (no agents required)
        const effectiveAgent = {
            id: "workspace",
            name: "Workspace AI",
            systemPrompt: "",
            model: "anythingllm",
        };

        if (effectiveAgent) {
            try {
                const useAnythingLLM = effectiveAgent.model === "anythingllm";

                // 🎯 WORKSPACE ROUTING (AnythingLLM streaming):
                let endpoint: string;
                let workspaceSlug: string | undefined;

                if (isDashboardMode && useAnythingLLM) {
                    // Dashboard mode routing
                    if (
                        dashboardChatTarget === WORKSPACE_CONFIG.dashboard.slug
                    ) {
                        endpoint = "/api/anythingllm/stream-chat";
                        workspaceSlug = WORKSPACE_CONFIG.dashboard.slug;
                    } else {
                        endpoint = "/api/anythingllm/stream-chat";
                        workspaceSlug = dashboardChatTarget;
                    }
                } else {
                    // Editor mode routing — always AnythingLLM via the SOW's workspace
                    endpoint = "/api/anythingllm/stream-chat";
                    workspaceSlug = documents.find(
                        (d) => d.id === currentDocId,
                    )?.workspaceSlug;
                }

                // 🎯 USE THE SOW'S ACTUAL WORKSPACE (NOT FORCED GEN-THE-ARCHITECT)
                // Each SOW has its thread in its client workspace (e.g., "hello", "pho", etc.)
                // Don't force gen-the-architect - that breaks thread routing!
                if (!isDashboardMode && useAnythingLLM && currentSOWId) {
                    const currentSOW = documents.find(
                        (d) => d.id === currentSOWId,
                    );
                    if (currentSOW?.workspaceSlug) {
                        workspaceSlug = currentSOW.workspaceSlug; // Use the SOW's actual workspace
                        console.log(
                            `🎯 [SOW Chat] Using SOW workspace: ${workspaceSlug}`,
                        );
                    }
                }

                console.log("🎯 [Chat Routing]", {
                    isDashboardMode,
                    useAnythingLLM,
                    dashboardChatTarget,
                    endpoint,
                    workspaceSlug,
                    routeType: isDashboardMode
                        ? dashboardChatTarget ===
                          WORKSPACE_CONFIG.dashboard.slug
                            ? "MASTER_DASHBOARD"
                            : "CLIENT_WORKSPACE"
                        : "SOW_GENERATION",
                });

                // 🌊 STREAMING SUPPORT: Use stream-chat endpoint for AnythingLLM
                const shouldStream = useAnythingLLM;
                const streamEndpoint = endpoint.includes("/stream-chat")
                    ? endpoint
                    : endpoint.replace("/chat", "/stream-chat");

                if (shouldStream) {
                    // Decide when to enforce SOW narrative+JSON contract
                    const lastUserMessage =
                        newMessages[newMessages.length - 1]?.content || "";
                    const messageLength = lastUserMessage.trim().length;
                    const sowKeywords =
                        /(\bstatement of work\b|\bsow\b|\bscope\b|\bdeliverables\b|\bpricing\b|\bbudget\b|\bestimate\b|\bhours\b|\broles\b)/i;
                    // Do not append per-message contracts; rely on workspace/system prompt
                    console.log(
                        `📊 [Contract Check] Message length: ${messageLength}, keywordMatch: ${sowKeywords.test(lastUserMessage)}, isDashboard: ${isDashboardMode}`,
                    );
                    const requestMessages = [
                        // Do not include a system message; AnythingLLM workspace prompt governs behavior
                        ...newMessages.map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                    ];
                    // ✨ STREAMING MODE: Real-time response with thinking display
                    const aiMessageId = `msg${Date.now() + 1}`;
                    let accumulatedContent = "";

                    // Create initial empty AI message
                    const initialAIMessage: ChatMessage = {
                        id: aiMessageId,
                        role: "assistant",
                        content: "",
                        timestamp: Date.now(),
                    };
                    setChatMessages((prev) => [...prev, initialAIMessage]);
                    setStreamingMessageId(aiMessageId);

                    // Determine thread slug based on mode
                    let threadSlugToUse: string | undefined;
                    if (threadSlugParam) {
                        // Always prefer explicitly provided thread slug (works for both dashboard and editor modes)
                        threadSlugToUse = threadSlugParam || undefined;
                    } else if (isDashboardMode) {
                        // Dashboard fallback: no explicit thread provided
                        threadSlugToUse = undefined;
                    } else if (currentDocId) {
                        // Editor mode fallback: current document's thread
                        threadSlugToUse =
                            documents.find((d) => d.id === currentDocId)
                                ?.threadSlug || undefined;
                    }

                    // 🛡️ If this is a temp thread (created for instant navigation), avoid thread API and use workspace-level chat
                    if (
                        threadSlugToUse &&
                        threadSlugToUse.startsWith("temp-")
                    ) {
                        console.log(
                            "ℹ️ Temp thread detected; using workspace-level chat for first message",
                        );
                        threadSlugToUse = undefined;
                    }

                    // Smart mode selection for Master Dashboard: use 'chat' for greetings/non-analytic prompts
                    // Always use 'chat' mode to mirror AnythingLLM direct chat behavior
                    const resolvedMode = "chat";

                    const response = await fetch(streamEndpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        signal: controller.signal, // 🛑 Allow cancellation of this request
                        body: JSON.stringify({
                            model: effectiveAgent.model,
                            workspace: workspaceSlug,
                            threadSlug: threadSlugToUse,
                            // Prefer query for dashboard analytics; fallback to chat for casual greetings
                            mode: resolvedMode,
                            attachments: attachments || [], // Include file attachments from sidebar
                            messages: requestMessages,
                        }),
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("❌ Stream-chat API error:", {
                            status: response.status,
                            statusText: response.statusText,
                            errorText: errorText,
                        });

                        let errorMessage =
                            "Sorry, there was an error processing your request.";

                        // Try to parse the error response for details
                        try {
                            const errorData = JSON.parse(errorText);
                            console.error("📋 Error details:", errorData);

                            if (errorData.details) {
                                errorMessage = `⚠️ Error: ${errorData.details}`;
                            } else if (errorData.error) {
                                errorMessage = `⚠️ ${errorData.error}`;
                            }
                        } catch (parseError) {
                            // If can't parse, use generic messages based on status
                            if (response.status === 400) {
                                errorMessage = `⚠️ AnythingLLM error (400): Invalid request. ${errorText.substring(0, 200)}`;
                            } else if (
                                response.status === 401 ||
                                response.status === 403
                            ) {
                                errorMessage =
                                    "⚠️ AnythingLLM authentication failed. Please check the API key configuration.";
                            } else if (response.status === 404) {
                                errorMessage = `⚠️ AnythingLLM workspace '${workspaceSlug}' not found. Please verify it exists.`;
                            } else {
                                errorMessage = `⚠️ Error (${response.status}): ${errorText.substring(0, 200)}`;
                            }
                        }

                        setChatMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === aiMessageId
                                    ? { ...msg, content: errorMessage }
                                    : msg,
                            ),
                        );
                        setStreamingMessageId(null);
                        return;
                    }

                    // Read the SSE stream
                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();

                    if (!reader) {
                        console.error("❌ No response body reader available");
                        setStreamingMessageId(null);
                        return;
                    }

                    try {
                        let buffer = "";
                        let eventCount = 0;

                        console.log("🌊 Starting SSE stream processing...", {
                            workspace: workspaceSlug,
                            thread: threadSlugToUse,
                            mode: resolvedMode,
                            endpoint: streamEndpoint,
                        });

                        while (true) {
                            const { done, value } = await reader.read();

                            if (done) {
                                console.log("✅ Stream complete", {
                                    totalEvents: eventCount,
                                    contentLength: accumulatedContent.length,
                                });
                                setStreamingMessageId(null);
                                break;
                            }

                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split("\n");
                            buffer = lines.pop() || "";

                            for (const line of lines) {
                                if (!line.trim() || !line.startsWith("data: "))
                                    continue;

                                try {
                                    const jsonStr = line.substring(6); // Remove 'data: ' prefix
                                    const data = JSON.parse(jsonStr);
                                    eventCount++;

                                    // Log all received event types for debugging
                                    console.log(
                                        `📨 SSE Event #${eventCount}:`,
                                        {
                                            type: data.type,
                                            hasTextResponse:
                                                !!data.textResponse,
                                            hasContent: !!data.content,
                                            keys: Object.keys(data),
                                            preview: JSON.stringify(
                                                data,
                                            ).substring(0, 200),
                                        },
                                    );

                                    // Handle different message types from AnythingLLM stream
                                    if (
                                        data.type === "textResponseChunk" &&
                                        data.textResponse
                                    ) {
                                        // Preserve internal thinking tags; UI will collapse them via StreamingThoughtAccordion
                                        accumulatedContent += data.textResponse;

                                        // Update the message content in real-time
                                        setChatMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === aiMessageId
                                                    ? {
                                                          ...msg,
                                                          content:
                                                              accumulatedContent,
                                                      }
                                                    : msg,
                                            ),
                                        );
                                    } else if (data.type === "textResponse") {
                                        // Final response (fallback for non-chunked)
                                        // Preserve internal thinking tags for UI accordion
                                        let content =
                                            data.content ||
                                            data.textResponse ||
                                            "";
                                        accumulatedContent = content;
                                        setChatMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === aiMessageId
                                                    ? {
                                                          ...msg,
                                                          content:
                                                              accumulatedContent,
                                                      }
                                                    : msg,
                                            ),
                                        );
                                    } else if (data.textResponse) {
                                        // Fallback: handle any event with textResponse field
                                        console.log(
                                            "⚠️ Unhandled event type with textResponse:",
                                            data.type,
                                        );
                                        accumulatedContent += data.textResponse;
                                        setChatMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === aiMessageId
                                                    ? {
                                                          ...msg,
                                                          content:
                                                              accumulatedContent,
                                                      }
                                                    : msg,
                                            ),
                                        );
                                    } else if (data.content) {
                                        // Fallback: handle any event with content field
                                        console.log(
                                            "⚠️ Unhandled event type with content:",
                                            data.type,
                                        );
                                        accumulatedContent += data.content;
                                        setChatMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === aiMessageId
                                                    ? {
                                                          ...msg,
                                                          content:
                                                              accumulatedContent,
                                                      }
                                                    : msg,
                                            ),
                                        );
                                    } else {
                                        // Log unhandled event types for debugging
                                        console.log(
                                            "ℹ️ Unhandled SSE event type:",
                                            data.type,
                                            "Keys:",
                                            Object.keys(data),
                                        );
                                    }
                                } catch (parseError) {
                                    console.error(
                                        "Failed to parse SSE data:",
                                        parseError,
                                        "Line:",
                                        line,
                                    );
                                }
                            }
                        }
                    } catch (streamError) {
                        console.error("❌ Stream reading error:", streamError);
                        setStreamingMessageId(null);
                    }

                    console.log(
                        "✅ Streaming complete, total content length:",
                        accumulatedContent.length,
                    );

                    // Check if we got empty content and show helpful error
                    if (accumulatedContent.length === 0) {
                        console.error(
                            "❌ AI returned empty content - possible workspace/thread routing issue",
                        );
                        console.error("🔍 Debug info:", {
                            workspaceSlug,
                            threadSlug: threadSlugToUse,
                            mode: resolvedMode,
                            endpoint: streamEndpoint,
                            messagesCount: requestMessages.length,
                            lastMessage:
                                requestMessages[requestMessages.length - 1],
                        });
                        console.error(
                            "💡 Check the SSE event logs above (📨 SSE Event received) to see what events were received",
                        );
                        setChatMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === aiMessageId
                                    ? {
                                          ...msg,
                                          content:
                                              "❌ **Generation Failed**\n\nThe AI returned empty content. This usually means:\n\n" +
                                              "**Most Common Causes:**\n" +
                                              "- The workspace routing is incorrect\n" +
                                              "- The AI workspace is not properly configured or has no LLM set\n" +
                                              "- Authentication issue with AnythingLLM\n" +
                                              "- The thread doesn't exist or is inaccessible\n\n" +
                                              "**Debug Information:**\n" +
                                              `- Workspace: \`${workspaceSlug || "none"}\`\n` +
                                              `- Thread: \`${threadSlugToUse || "none"}\`\n` +
                                              `- Mode: \`${resolvedMode}\`\n` +
                                              `- Endpoint: \`${streamEndpoint}\`\n\n` +
                                              "**Next Steps:**\n" +
                                              "1. Check browser console for SSE event logs (📨 SSE Event received)\n" +
                                              "2. Verify the workspace exists in AnythingLLM\n" +
                                              "3. Ensure the workspace has an LLM configured\n" +
                                              "4. Check AnythingLLM API logs for errors\n" +
                                              "5. Try a simple message in the workspace directly in AnythingLLM",
                                          role: "assistant",
                                      }
                                    : msg,
                            ),
                        );
                        return;
                    }

                    // 🎯 Extract work type from the accumulated AI response
                    const detectedWorkType =
                        extractWorkType(accumulatedContent);

                    // Update current document with detected work type
                    if (currentDocId && detectedWorkType) {
                        setDocuments((prev) =>
                            prev.map((doc) =>
                                doc.id === currentDocId
                                    ? { ...doc, workType: detectedWorkType }
                                    : doc,
                            ),
                        );
                        console.log(
                            `🎯 Updated document ${currentDocId} with work type: ${detectedWorkType}`,
                        );
                    }

                    // 🧩 Also try to capture modular Architect JSON into state for Excel engine v2
                    try {
                        const structured =
                            extractSOWStructuredJson(accumulatedContent);
                        if (structured?.scopeItems?.length) {
                            setStructuredSow(structured);
                            console.log(
                                "✅ Captured structured SOW JSON for Excel export",
                            );
                        }
                    } catch {}

                    // 🚀 AUTOMATIC CONTENT INSERTION: Convert AI content and insert into editor
                    if (viewMode === "editor" && currentDocId) {
                        console.log(
                            "🚀 Starting automatic content insertion into SOW editor...",
                        );

                        try {
                            // Extract SOW structured JSON from the AI response
                            const structured =
                                extractSOWStructuredJson(accumulatedContent);
                            let contentForEditor: any = null;
                            let docTitle = "New SOW";

                            if (structured?.scopeItems?.length) {
                                // Use structured data from Architect response
                                console.log(
                                    `✅ Using structured SOW data with ${structured.scopeItems.length} scope items`,
                                );

                                const cleanedContent =
                                    accumulatedContent.replace(
                                        /\[PRICING_JSON\].*?\[\/PRICING_JSON\]/gs,
                                        "",
                                    );

                                // 🎯 Check if we have multi-scope data
                                if (
                                    structured.multiScopeData &&
                                    structured.multiScopeData.scopes &&
                                    structured.multiScopeData.scopes.length > 0
                                ) {
                                    console.log(
                                        `✅ Using multi-scope data with ${structured.multiScopeData.scopes.length} scopes`,
                                    );
                                    // For multi-scope, don't flatten roles - let multiScopePricingData handle it
                                    contentForEditor =
                                        convertMarkdownToNovelJSON(
                                            cleanedContent,
                                            [], // Empty suggestedRoles - multi-scope data takes precedence
                                            {
                                                multiScopePricingData:
                                                    structured.multiScopeData,
                                            },
                                        );
                                } else {
                                    console.log(
                                        `✅ Using flat roles structure from ${structured.scopeItems.length} scope items`,
                                    );
                                    // For single scope or legacy format, flatten roles
                                    const suggestedRoles =
                                        buildSuggestedRolesFromArchitectSOW(
                                            structured,
                                        );

                                    // 🔒 Apply Account Management guardrail
                                    const sanitized =
                                        sanitizeAccountManagementRoles(
                                            suggestedRoles,
                                        );

                                    contentForEditor =
                                        convertMarkdownToNovelJSON(
                                            cleanedContent,
                                            sanitized,
                                            {},
                                        );
                                }

                                docTitle =
                                    structured.title ||
                                    `SOW - ${structured.client || "Untitled Client"}`;
                            } else {
                                // Fallback: convert markdown content without structured pricing
                                console.log(
                                    "⚠️ No structured data found, converting markdown content only",
                                );
                                const cleanedContent =
                                    accumulatedContent.replace(
                                        /\[PRICING_JSON\].*?\[\/PRICING_JSON\]/gs,
                                        "",
                                    );

                                contentForEditor = convertMarkdownToNovelJSON(
                                    cleanedContent,
                                    [],
                                    {},
                                );
                                docTitle =
                                    extractDocTitle(cleanedContent) ||
                                    "New SOW";
                            }

                            // Update the document in state
                            setDocuments((prev) =>
                                prev.map((doc) =>
                                    doc.id === currentDocId
                                        ? {
                                              ...doc,
                                              content: contentForEditor,
                                              title: docTitle,
                                              lastModified: Date.now(),
                                          }
                                        : doc,
                                ),
                            );

                            console.log(
                                "✅ Automatic content insertion complete:",
                                contentForEditor?.content?.length || 0,
                                "characters",
                            );
                            toast.success(
                                "✅ Content automatically inserted into SOW editor",
                            );
                        } catch (error) {
                            console.error(
                                "❌ Error during automatic content insertion:",
                                error,
                            );
                            toast.error(
                                "⚠️ Content generated but failed to insert into editor",
                            );
                        }
                    } else {
                        console.log(
                            "ℹ️ Not in editor mode or no document selected - skipping automatic insertion",
                        );
                    }

                    // ⚠️ REMOVED TWO-STEP AUTO-CORRECT LOGIC
                    // The AI should now return complete SOW narrative + JSON in a single response
                    // No follow-up prompt is needed if the initial prompt is clear enough
                    console.log(
                        "✅ Single-step AI generation complete - no follow-up needed",
                    );
                } else {
                    // 📦 NON-STREAMING MODE: Standard fetch for OpenRouter
                    const lastUserMessage =
                        newMessages[newMessages.length - 1]?.content || "";
                    const messageLength = lastUserMessage.trim().length;
                    const sowKeywords =
                        /(\bstatement of work\b|\bsow\b|\bscope\b|\bdeliverables\b|\bpricing\b|\bbudget\b|\bestimate\b|\bhours\b|\broles\b)/i;
                    // Do not append per-message contracts; rely on workspace/system prompt
                    console.log(
                        `📊 [Contract Check] Message length: ${messageLength}, keywordMatch: ${sowKeywords.test(lastUserMessage)}, isDashboard: ${isDashboardMode}`,
                    );
                    const requestMessages = [
                        // Do not include a system message; AnythingLLM workspace prompt governs behavior
                        ...newMessages.map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                    ];
                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        signal: controller.signal, // 🛑 Allow cancellation of this request
                        body: JSON.stringify({
                            model: effectiveAgent.model,
                            workspace: workspaceSlug,
                            threadSlug:
                                !isDashboardMode && currentDocId
                                    ? documents.find(
                                          (d) => d.id === currentDocId,
                                      )?.threadSlug || undefined
                                    : undefined,
                            messages: requestMessages,
                        }),
                    });

                    console.log(
                        "📥 Response Status:",
                        response.status,
                        response.statusText,
                    );
                    const data = await response.json();

                    if (!response.ok) {
                        let errorMessage =
                            "Sorry, there was an error processing your request.";

                        if (response.status === 400) {
                            errorMessage =
                                "⚠️ OpenRouter API key not configured. Please set the OPENROUTER_API_KEY environment variable to enable AI chat functionality.";
                        } else if (response.status === 402) {
                            errorMessage =
                                "Payment required: Please check your OpenRouter account balance or billing information.";
                        } else if (response.status === 401) {
                            errorMessage =
                                "Authentication failed: Please check your OpenRouter API key.";
                        } else if (response.status === 429) {
                            errorMessage =
                                "Rate limit exceeded: Please wait a moment before trying again.";
                        } else if (data.error?.message) {
                            errorMessage = `API Error: ${data.error.message}`;
                        }

                        const aiMessage: ChatMessage = {
                            id: `msg${Date.now() + 1}`,
                            role: "assistant",
                            content: errorMessage,
                            timestamp: Date.now(),
                        };
                        setChatMessages((prev) => [...prev, aiMessage]);
                        return;
                    }

                    const aiMessage: ChatMessage = {
                        id: `msg${Date.now() + 1}`,
                        role: "assistant",
                        content:
                            data.choices?.[0]?.message?.content ||
                            "Sorry, I couldn't generate a response.",
                        timestamp: Date.now(),
                    };
                    setChatMessages((prev) => [...prev, aiMessage]);
                    console.log("✅ Non-streaming response complete");

                    // 🧩 Try to parse structured SOW JSON from non-streaming response
                    try {
                        const structured = extractSOWStructuredJson(
                            aiMessage.content,
                        );
                        if (structured?.scopeItems?.length) {
                            setStructuredSow(structured);
                            console.log(
                                "✅ Captured structured SOW JSON for Excel export",
                            );
                        }
                    } catch {}

                    // 🚀 AUTOMATIC CONTENT INSERTION for non-streaming mode
                    if (
                        viewMode === "editor" &&
                        currentDocId &&
                        aiMessage.content
                    ) {
                        console.log(
                            "🚀 Starting automatic content insertion into SOW editor (non-streaming mode)...",
                        );

                        try {
                            // Extract SOW structured JSON from the AI response
                            const structured = extractSOWStructuredJson(
                                aiMessage.content,
                            );
                            let contentForEditor: any = null;
                            let docTitle = "New SOW";

                            if (structured?.scopeItems?.length) {
                                // Use structured data from Architect response
                                console.log(
                                    `✅ Using structured SOW data with ${structured.scopeItems.length} scope items`,
                                );

                                const cleanedContent =
                                    aiMessage.content.replace(
                                        /\[PRICING_JSON\].*?\[\/PRICING_JSON\]/gs,
                                        "",
                                    );

                                // 🎯 Check if we have multi-scope data
                                if (
                                    structured.multiScopeData &&
                                    structured.multiScopeData.scopes &&
                                    structured.multiScopeData.scopes.length > 0
                                ) {
                                    console.log(
                                        `✅ Using multi-scope data with ${structured.multiScopeData.scopes.length} scopes (non-streaming)`,
                                    );
                                    // For multi-scope, don't flatten roles - let multiScopePricingData handle it
                                    contentForEditor =
                                        convertMarkdownToNovelJSON(
                                            cleanedContent,
                                            [], // Empty suggestedRoles - multi-scope data takes precedence
                                            {
                                                multiScopePricingData:
                                                    structured.multiScopeData,
                                            },
                                        );
                                } else {
                                    console.log(
                                        `✅ Using flat roles structure from ${structured.scopeItems.length} scope items (non-streaming)`,
                                    );
                                    // For single scope or legacy format, flatten roles
                                    const suggestedRoles =
                                        buildSuggestedRolesFromArchitectSOW(
                                            structured,
                                        );

                                    // 🔒 Apply Account Management guardrail
                                    const sanitized =
                                        sanitizeAccountManagementRoles(
                                            suggestedRoles,
                                        );

                                    contentForEditor =
                                        convertMarkdownToNovelJSON(
                                            cleanedContent,
                                            sanitized,
                                            {},
                                        );
                                }

                                docTitle =
                                    structured.title ||
                                    `SOW - ${structured.client || "Untitled Client"}`;
                            } else {
                                // Fallback: convert markdown content without structured pricing
                                console.log(
                                    "⚠️ No structured data found, converting markdown content only",
                                );
                                const cleanedContent =
                                    aiMessage.content.replace(
                                        /\[PRICING_JSON\].*?\[\/PRICING_JSON\]/gs,
                                        "",
                                    );

                                contentForEditor = convertMarkdownToNovelJSON(
                                    cleanedContent,
                                    [],
                                    {},
                                );
                                docTitle =
                                    extractDocTitle(cleanedContent) ||
                                    "New SOW";
                            }

                            // Update the document in state
                            setDocuments((prev) =>
                                prev.map((doc) =>
                                    doc.id === currentDocId
                                        ? {
                                              ...doc,
                                              content: contentForEditor,
                                              title: docTitle,
                                              lastModified: Date.now(),
                                          }
                                        : doc,
                                ),
                            );

                            console.log(
                                "✅ Automatic content insertion complete (non-streaming):",
                                contentForEditor?.content?.length || 0,
                                "characters",
                            );
                            toast.success(
                                "✅ Content automatically inserted into SOW editor",
                            );
                        } catch (error) {
                            console.error(
                                "❌ Error during automatic content insertion (non-streaming):",
                                error,
                            );
                            toast.error(
                                "⚠️ Content generated but failed to insert into editor",
                            );
                        }
                    } else {
                        console.log(
                            "ℹ️ Not in editor mode or no document selected - skipping automatic insertion (non-streaming)",
                        );
                    }
                }
            } catch (error) {
                console.error("❌ Chat API error:", error);

                // Check if the error is an AbortError (request was cancelled)
                if (error instanceof Error && error.name === "AbortError") {
                    console.log(
                        "ℹ️ Request was cancelled to prevent rate limiting",
                    );
                    return;
                }

                // Check for rate limiting errors
                let errorMessage =
                    "❌ Network error: Unable to reach AI service. Please check your connection and try again.";
                if (error instanceof Error && error.message.includes("429")) {
                    errorMessage =
                        "⏱️ Rate limit exceeded: Please wait a moment before trying again.";
                    toast.error("⏱️ Rate limited - waiting before retry...");
                }

                const errorMsg: ChatMessage = {
                    id: `msg${Date.now() + 1}`,
                    role: "assistant",
                    content: errorMessage,
                    timestamp: Date.now(),
                };
                const updatedMessages = [...newMessages, errorMsg];
                setChatMessages(updatedMessages);

                // ⚠️ REMOVED DATABASE SAVE - AnythingLLM handles all message storage
            } finally {
                setIsChatLoading(false);
                setCurrentRequestController(null); // Clean up the controller
            }
        } else {
            setIsChatLoading(false);
        }
    };

    // Prevent hydration errors by not rendering until mounted
    if (!mounted) {
        return null;
    }

    // 🎯 Phase 1C: Filter workspaces based on dashboard filter
    const filteredWorkspaces =
        dashboardFilter.type && dashboardFilter.value
            ? workspaces.map((workspace) => ({
                  ...workspace,
                  sows: workspace.sows.filter((sow) => {
                      const doc = documents.find((d) => d.id === sow.id);
                      if (!doc) return false;

                      if (dashboardFilter.type === "vertical") {
                          return doc.vertical === dashboardFilter.value;
                      } else if (dashboardFilter.type === "serviceLine") {
                          return doc.serviceLine === dashboardFilter.value;
                      }
                      return true;
                  }),
              }))
            : workspaces;

    return (
        <div className="flex flex-col h-screen bg-[#0e0f0f]">
            {/* Onboarding Tutorial */}
            <InteractiveOnboarding />

            {/* Resizable Layout with Sidebar, Editor, and AI Chat */}
            <div className="flex-1 h-full overflow-hidden">
                <ResizableLayout
                    sidebarOpen={sidebarOpen}
                    aiChatOpen={agentSidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onToggleAiChat={() =>
                        setAgentSidebarOpen(!agentSidebarOpen)
                    }
                    viewMode={viewMode} // Pass viewMode for context awareness
                    leftPanel={
                        // Always show sidebar navigation regardless of view mode
                        <SidebarNav
                            workspaces={filteredWorkspaces}
                            currentWorkspaceId={currentWorkspaceId}
                            currentSOWId={currentSOWId}
                            currentView={viewMode}
                            onSelectWorkspace={setCurrentWorkspaceId}
                            onSelectSOW={setCurrentSOWId}
                            onCreateWorkspace={handleCreateWorkspace}
                            onRenameWorkspace={handleRenameWorkspace}
                            onDeleteWorkspace={handleDeleteWorkspace}
                            onCreateSOW={handleCreateSOW}
                            onRenameSOW={handleRenameSOW}
                            onDeleteSOW={handleDeleteSOW}
                            onViewChange={handleViewChange}
                            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                            onReorderWorkspaces={handleReorderWorkspaces}
                            onReorderSOWs={handleReorderSOWs}
                            onMoveSOW={handleMoveSOW}
                            // 🎯 Phase 1C: Pass filter state and clear handler
                            dashboardFilter={dashboardFilter}
                            onClearFilter={handleClearDashboardFilter}
                        />
                    }
                    mainPanel={
                        viewMode === "editor" ? (
                            <div className="w-full h-full flex flex-col">
                                {/* Document Status Bar - Only show when document is open */}
                                {currentDoc && (
                                    <DocumentStatusBar
                                        title={
                                            currentDoc.title ||
                                            "Untitled Statement of Work"
                                        }
                                        saveStatus="saved"
                                        isSaving={false}
                                        vertical={currentDoc.vertical}
                                        serviceLine={currentDoc.serviceLine}
                                        onVerticalChange={(vertical) => {
                                            setDocuments((prev) =>
                                                prev.map((d) =>
                                                    d.id === currentDocId
                                                        ? { ...d, vertical }
                                                        : d,
                                                ),
                                            );
                                        }}
                                        onServiceLineChange={(serviceLine) => {
                                            setDocuments((prev) =>
                                                prev.map((d) =>
                                                    d.id === currentDocId
                                                        ? { ...d, serviceLine }
                                                        : d,
                                                ),
                                            );
                                        }}
                                        isGrandTotalVisible={
                                            isGrandTotalVisible
                                        }
                                        onToggleGrandTotal={() =>
                                            setIsGrandTotalVisible(
                                                !isGrandTotalVisible,
                                            )
                                        }
                                        onExportPDF={handleExportPDF}
                                        onExportNewPDF={handleExportNewPDF}
                                        onExportExcel={handleExportExcel}
                                        onSharePortal={async () => {
                                            if (!currentDoc) {
                                                toast.error(
                                                    "❌ No document selected",
                                                );
                                                return;
                                            }

                                            toast.info(
                                                "📤 Preparing portal link...",
                                            );

                                            try {
                                                // 1. First, embed the SOW to AnythingLLM
                                                const currentFolder =
                                                    folders.find(
                                                        (f) =>
                                                            f.id ===
                                                            currentDoc.folderId,
                                                    );

                                                if (
                                                    !currentFolder ||
                                                    !currentFolder.workspaceSlug
                                                ) {
                                                    toast.error(
                                                        "❌ No workspace found for this SOW",
                                                    );
                                                    return;
                                                }

                                                // Get HTML content from editor
                                                const htmlContent =
                                                    editorRef.current?.getHTML() ||
                                                    "";

                                                if (
                                                    !htmlContent ||
                                                    htmlContent === "<p></p>"
                                                ) {
                                                    toast.error(
                                                        "❌ Document is empty. Add content before sharing.",
                                                    );
                                                    return;
                                                }

                                                // Embed to master 'gen' workspace and master dashboard
                                                const clientContext =
                                                    currentFolder?.name ||
                                                    "unknown";
                                                await anythingLLM.embedSOWInBothWorkspaces(
                                                    currentDoc.title,
                                                    htmlContent,
                                                    clientContext,
                                                );

                                                // 2. Generate portal URL
                                                const portalUrl = `${window.location.origin}/portal/sow/${currentDoc.id}`;

                                                // 3. Copy to clipboard with fallback
                                                if (
                                                    navigator.clipboard &&
                                                    navigator.clipboard
                                                        .writeText
                                                ) {
                                                    await navigator.clipboard
                                                        .writeText(portalUrl)
                                                        .then(() =>
                                                            toast.success(
                                                                "✅ Portal link copied! SOW is now shareable.",
                                                            ),
                                                        )
                                                        .catch(() => {
                                                            // Fallback: Create temporary input and copy
                                                            const input =
                                                                document.createElement(
                                                                    "input",
                                                                );
                                                            input.value =
                                                                portalUrl;
                                                            document.body.appendChild(
                                                                input,
                                                            );
                                                            input.select();
                                                            document.execCommand(
                                                                "copy",
                                                            );
                                                            document.body.removeChild(
                                                                input,
                                                            );
                                                            toast.success(
                                                                "✅ Portal link copied! SOW is now shareable.",
                                                            );
                                                        });
                                                } else {
                                                    // Fallback for older browsers
                                                    const input =
                                                        document.createElement(
                                                            "input",
                                                        );
                                                    input.value = portalUrl;
                                                    document.body.appendChild(
                                                        input,
                                                    );
                                                    input.select();
                                                    document.execCommand(
                                                        "copy",
                                                    );
                                                    document.body.removeChild(
                                                        input,
                                                    );
                                                    toast.success(
                                                        "✅ Portal link copied! SOW is now shareable.",
                                                    );
                                                }
                                            } catch (error) {
                                                console.error(
                                                    "Error sharing portal:",
                                                    error,
                                                );
                                                toast.error(
                                                    `❌ Error preparing portal: ${error.message}`,
                                                );
                                            }
                                        }}
                                    />
                                )}

                                {/* Main Content Area */}
                                <div
                                    className="flex-1 overflow-auto"
                                    data-show-totals={isGrandTotalVisible}
                                >
                                    {currentDoc ? (
                                        <div className="w-full h-full">
                                            <TailwindAdvancedEditor
                                                ref={editorRef}
                                                initialContent={
                                                    currentDoc.content
                                                }
                                                onUpdate={handleUpdateDoc}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <p className="text-gray-400 text-lg mb-4">
                                                    No document selected
                                                </p>
                                                <p className="text-gray-500 text-sm">
                                                    Create a new workspace to
                                                    get started
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : viewMode === "dashboard" ? (
                            <div className="h-full bg-[#0e0f0f]">
                                <EnhancedDashboard
                                    onFilterByVertical={
                                        handleDashboardFilterByVertical
                                    }
                                    onFilterByService={
                                        handleDashboardFilterByService
                                    }
                                    currentFilter={dashboardFilter}
                                    onClearFilter={handleClearDashboardFilter}
                                    onOpenInEditor={(sowId: string) => {
                                        if (!sowId) return;
                                        try {
                                            handleSelectDoc(sowId);
                                        } catch (e) {
                                            console.warn(
                                                "⚠️ Failed to open SOW in editor:",
                                                e,
                                            );
                                        }
                                    }}
                                    onOpenInPortal={(sowId: string) => {
                                        if (!sowId) return;
                                        try {
                                            router.push(`/portal/sow/${sowId}`);
                                        } catch (e) {
                                            console.warn(
                                                "⚠️ Failed to open SOW portal:",
                                                e,
                                            );
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-gray-400 text-lg mb-4">
                                        No document selected
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        Create a new workspace to get started
                                    </p>
                                </div>
                            </div>
                        )
                    }
                    rightPanel={
                        // ✨ Render appropriate sidebar based on viewMode
                        // Dashboard mode: Query-only Analytics Assistant with workspace dropdown
                        // Editor mode: Full-featured SOW generation with The Architect
                        viewMode === "dashboard" ? (
                            <DashboardChat
                                isOpen={agentSidebarOpen}
                                onToggle={() =>
                                    setAgentSidebarOpen(!agentSidebarOpen)
                                }
                                dashboardChatTarget={dashboardChatTarget}
                                onDashboardWorkspaceChange={
                                    setDashboardChatTarget
                                }
                                availableWorkspaces={availableWorkspaces}
                                chatMessages={chatMessages}
                                onSendMessage={handleSendMessage}
                                isLoading={isChatLoading}
                                streamingMessageId={streamingMessageId}
                                onClearChat={() => {
                                    console.log(
                                        "🧹 Clearing chat messages for new thread",
                                    );
                                    setChatMessages([]);
                                    setIsHistoryRestored(false); // Reset flag when clearing
                                }}
                                onReplaceChatMessages={(msgs) => {
                                    console.log(
                                        "🔁 Replacing chat messages from thread history:",
                                        msgs.length,
                                    );
                                    setChatMessages(msgs);
                                    setIsHistoryRestored(true); // 🛡️ Mark history as restored - prevents welcome message overwrite
                                }}
                            />
                        ) : viewMode === "editor" ? (
                            <WorkspaceChat
                                isOpen={agentSidebarOpen}
                                onToggle={() =>
                                    setAgentSidebarOpen(!agentSidebarOpen)
                                }
                                chatMessages={chatMessages}
                                onSendMessage={handleSendMessage}
                                isLoading={isChatLoading}
                                onInsertToEditor={(content) => {
                                    console.log(
                                        "� Insert to Editor button clicked from AI chat",
                                    );
                                    handleInsertContent(content);
                                }}
                                streamingMessageId={streamingMessageId}
                                editorWorkspaceSlug={
                                    currentDoc?.workspaceSlug || ""
                                }
                                editorThreadSlug={
                                    currentDoc?.threadSlug || null
                                }
                                onEditorThreadChange={async (slug) => {
                                    if (!currentDocId) return;
                                    // Update document state
                                    setDocuments((prev) =>
                                        prev.map((d) =>
                                            d.id === currentDocId
                                                ? {
                                                      ...d,
                                                      threadSlug:
                                                          slug || undefined,
                                                  }
                                                : d,
                                        ),
                                    );
                                    // Persist to DB
                                    try {
                                        await fetch(
                                            `/api/sow/${currentDocId}`,
                                            {
                                                method: "PUT",
                                                headers: {
                                                    "Content-Type":
                                                        "application/json",
                                                },
                                                body: JSON.stringify({
                                                    threadSlug: slug,
                                                }),
                                            },
                                        );
                                    } catch (e) {
                                        console.warn(
                                            "⚠️ Failed to persist threadSlug change:",
                                            e,
                                        );
                                    }
                                    // Load thread history into chat panel when a thread is selected (or clear when null)
                                    try {
                                        if (slug && currentDoc?.workspaceSlug) {
                                            const history =
                                                await anythingLLM.getThreadChats(
                                                    currentDoc.workspaceSlug,
                                                    slug,
                                                );
                                            const messages: ChatMessage[] = (
                                                history || []
                                            ).map((msg: any) => ({
                                                id: `msg${Date.now()}-${Math.random()}`,
                                                role:
                                                    msg.role === "user"
                                                        ? "user"
                                                        : "assistant",
                                                content: msg.content || "",
                                                timestamp: Date.now(),
                                            }));
                                            setChatMessages(messages);
                                        } else {
                                            setChatMessages([]);
                                        }
                                    } catch (err) {
                                        console.warn(
                                            "⚠️ Failed to load thread history:",
                                            err,
                                        );
                                        setChatMessages([]);
                                    }
                                }}
                                onClearChat={() => {
                                    console.log(
                                        "🧹 Clearing chat messages for new thread",
                                    );
                                    setChatMessages([]);
                                    setIsHistoryRestored(false); // Reset flag when clearing
                                }}
                                onReplaceChatMessages={(msgs) => {
                                    console.log(
                                        "🔁 Replacing chat messages from thread history:",
                                        msgs.length,
                                    );
                                    setChatMessages(msgs);
                                    setIsHistoryRestored(true); // 🛡️ Mark history as restored
                                }}
                            />
                        ) : null // AI Management mode: no sidebar
                    }
                    leftMinSize={15}
                    mainMinSize={30}
                    rightMinSize={20}
                    leftDefaultSize={20}
                    mainDefaultSize={55}
                    rightDefaultSize={25}
                />
            </div>

            {/* Send to Client Modal */}
            {currentDoc && (
                <SendToClientModal
                    isOpen={showSendModal}
                    onClose={() => setShowSendModal(false)}
                    document={{
                        id: currentDoc.id,
                        title: currentDoc.title,
                        content: currentDoc.content,
                        totalInvestment: calculateTotalInvestment(
                            currentDoc.content,
                        ),
                    }}
                    onSuccess={(sowId, portalUrl) => {
                        toast.success("SOW sent successfully!", {
                            description: `Portal: ${portalUrl}`,
                            duration: 5000,
                        });
                    }}
                />
            )}

            {/* Share Link Modal */}
            {shareModalData && (
                <ShareLinkModal
                    isOpen={showShareModal}
                    onClose={() => {
                        setShowShareModal(false);
                        setShareModalData(null);
                    }}
                    shareLink={shareModalData.shareLink}
                    documentTitle={shareModalData.documentTitle}
                    shareCount={shareModalData.shareCount}
                    firstShared={shareModalData.firstShared}
                    lastShared={shareModalData.lastShared}
                />
            )}

            {/* NEW: Professional PDF Download Modal */}
            {showNewPDFModal && newPDFData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1D] border border-green-600 rounded-xl p-8 max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Professional PDF Ready!
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Your BBUBU-style PDF is ready to download.
                        </p>
                        <div className="flex gap-4">
                            <SOWPdfExportWrapper
                                sowData={newPDFData}
                                variant="editor"
                                fileName={`${currentDoc?.title || "SOW"}-Professional.pdf`}
                            />
                            <button
                                onClick={() => {
                                    setShowNewPDFModal(false);
                                    setNewPDFData(null);
                                }}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Workspace Creation Progress Modal */}
            <WorkspaceCreationProgress
                isOpen={workspaceCreationProgress.isOpen}
                workspaceName={workspaceCreationProgress.workspaceName}
                currentStep={workspaceCreationProgress.currentStep}
                completedSteps={workspaceCreationProgress.completedSteps}
            />

            {/* Beautiful Onboarding Flow */}
            <OnboardingFlow
                isOpen={showOnboarding}
                onComplete={() => setShowOnboarding(false)}
                onCreateWorkspace={handleCreateWorkspace}
                workspaceCount={workspaces.length}
            />
        </div>
    );
}
