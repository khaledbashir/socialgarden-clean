/**
 * Utility functions for preparing SOW data for the new PDF export
 */

import { SOWData, SOWScope, SOWItem, CURRENCIES } from "@/components/sow/types";
import { extractPricingFromContent, PricingRow } from "@/lib/export-utils";

interface Section {
    title: string;
    level: number;
    nodes: any[];
}

const safeParse = (value: any): any | null => {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn(
                "prepareSOWForNewPDF: failed to parse JSON content",
                error,
            );
            return null;
        }
    }
    return null;
};

const textFromNode = (node: any): string => {
    if (!node) return "";
    if (node.type === "text") return node.text || "";
    if (node.type === "hardBreak") return "\n";
    if (Array.isArray(node.content)) {
        return node.content.map(textFromNode).join("");
    }
    return "";
};

const collectParagraphs = (nodes: any[]): string[] => {
    return (nodes || [])
        .filter(
            (node) => node?.type === "paragraph" || node?.type === "blockquote",
        )
        .map((node) => textFromNode(node).replace(/\s+/g, " ").trim())
        .filter(Boolean);
};

const collectListItems = (nodes: any[]): string[] => {
    const items: string[] = [];

    const walk = (node: any) => {
        if (!node) return;
        if (node.type === "bulletList" || node.type === "orderedList") {
            (node.content || []).forEach((child: any) => {
                const text = textFromNode(child).replace(/\s+/g, " ").trim();
                if (text) items.push(text);
            });
            return;
        }

        if (node.type === "listItem") {
            const text = textFromNode(node).replace(/\s+/g, " ").trim();
            if (text) items.push(text);
            return;
        }

        if (node.type === "paragraph") {
            const text = textFromNode(node).trim();
            if (/^[•\-\+\*]/.test(text)) {
                const clean = text.replace(/^[•\-\+\*]\s*/, "").trim();
                if (clean) items.push(clean);
            }
        }

        if (Array.isArray(node.content)) {
            node.content.forEach(walk);
        }
    };

    (nodes || []).forEach(walk);
    return items;
};

const buildSections = (nodes: any[]): Section[] => {
    const sections: Section[] = [];
    let current: Section | null = null;

    (nodes || []).forEach((node: any) => {
        if (node?.type === "heading") {
            if (current) sections.push(current);
            const title = textFromNode(node).trim();
            current = {
                title,
                level: node?.attrs?.level ?? 0,
                nodes: [],
            };
        } else {
            if (!current) {
                current = {
                    title: "Introduction",
                    level: 1,
                    nodes: [],
                };
            }
            current.nodes.push(node);
        }
    });

    if (current) sections.push(current);
    return sections;
};

const distributePricingRows = (
    rows: PricingRow[],
    scopeCount: number,
): PricingRow[][] => {
    if (scopeCount <= 0) return [];
    const buckets = Array.from(
        { length: scopeCount },
        () => [] as PricingRow[],
    );
    rows.forEach((row, index) => {
        const bucketIndex = index % scopeCount;
        buckets[bucketIndex].push(row);
    });
    return buckets;
};

const rowToItem = (row: PricingRow): SOWItem => {
    const computedTotal = row.total || (row.hours || 0) * (row.rate || 0);
    return {
        description: row.role,
        role: row.role,
        hours: Number.isFinite(row.hours) ? Number(row.hours) : 0,
        cost: Number.isFinite(computedTotal) ? Number(computedTotal) : 0,
    };
};

const formatCurrencyValue = (amount: number, currency: string): string => {
    const config = CURRENCIES[currency?.toUpperCase()] || CURRENCIES["AUD"];
    return `${config.symbol}${Number(amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
    })}`;
};

const extractClientName = (currentDoc: any): string | null => {
    if (!currentDoc) return null;
    const candidates = [
        currentDoc.clientName,
        currentDoc.client,
        currentDoc.customer,
        currentDoc?.metadata?.clientName,
    ].filter(Boolean);
    if (candidates.length > 0) {
        const name = String(candidates[0]).trim();
        if (name.length > 1) return name;
    }

    const title: string | undefined = currentDoc?.title;
    if (title) {
        const match = title.match(/for\s+(.+)/i);
        if (match && match[1]) {
            const candidate = match[1].trim();
            if (candidate.length > 1 && candidate.length < 80) return candidate;
        }
    }

    return null;
};

const summariseParagraphs = (
    paragraphs: string[],
    maxParagraphs = 2,
): string => {
    if (!paragraphs || paragraphs.length === 0) return "";
    return paragraphs.slice(0, maxParagraphs).join("\n\n");
};

const mergeUnique = (...lists: string[][]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    lists.flat().forEach((item) => {
        const trimmed = item.trim();
        if (!trimmed) return;
        if (seen.has(trimmed.toLowerCase())) return;
        seen.add(trimmed.toLowerCase());
        result.push(trimmed);
    });
    return result;
};

/**
 * Extract discount percentage from pricing table nodes
 * Returns the discount percentage (e.g., 3 for 3%), not the dollar amount
 */
const extractDiscountPercentage = (nodes: any[]): number => {
    let discountPercent = 0;

    const walk = (node: any) => {
        if (!node) return;

        // Check if this is an editablePricingTable node with discount
        if (node.type === "editablePricingTable" && node.attrs?.discount) {
            const discount = Number(node.attrs.discount);
            if (Number.isFinite(discount) && discount > 0) {
                discountPercent = Math.max(discountPercent, discount);
                console.log(
                    `📊 [PDF Export] Extracted discount percentage: ${discount}%`,
                );
            }
        }

        // Recursively check child nodes
        if (Array.isArray(node.content)) {
            node.content.forEach(walk);
        }
    };

    nodes.forEach(walk);
    return discountPercent;
};

/**
 * Prepare SOW data from the current document for the new PDF export
 */
export function prepareSOWForNewPDF(currentDoc: any): SOWData | null {
    if (!currentDoc) return null;

    try {
        const editorDoc =
            safeParse(currentDoc.content) ||
            safeParse(currentDoc.latestEditorJSON);
        if (!editorDoc?.content) {
            console.warn(
                "prepareSOWForNewPDF: no editor content found for document",
                currentDoc?.id,
            );
        }

        const nodes = editorDoc?.content || [];
        const sections = buildSections(nodes);

        const projectOverviewSection = sections.find((section) =>
            section.title?.toLowerCase().includes("project overview"),
        );

        const deliverablesSection = sections.find((section) =>
            section.title?.toLowerCase().includes("deliverable"),
        );

        const assumptionsSection = sections.find((section) =>
            section.title?.toLowerCase().includes("assumption"),
        );

        const budgetSection = sections.find((section) => {
            const title = section.title?.toLowerCase() || "";
            return (
                title.includes("budget") ||
                title.includes("commercial") ||
                title.includes("investment") ||
                title.includes("financial")
            );
        });

        const phaseSections = sections.filter((section) => {
            const title = section.title?.toLowerCase() || "";
            if (!title) return false;
            return (
                title.includes("phase") ||
                title.includes("workstream") ||
                title.includes("scope") ||
                title.includes("pillar") ||
                title.includes("stage") ||
                title.includes("track")
            );
        });

        const globalDeliverables = deliverablesSection
            ? collectListItems(deliverablesSection.nodes)
            : [];

        const globalAssumptions = assumptionsSection
            ? collectListItems(assumptionsSection.nodes)
            : [];

        const overviewParagraphs = projectOverviewSection
            ? collectParagraphs(projectOverviewSection.nodes)
            : collectParagraphs(nodes);

        const projectOverview = summariseParagraphs(overviewParagraphs, 3);

        const pricingRows = extractPricingFromContent(editorDoc);
        const scopeCount = Math.max(phaseSections.length, 1);
        const pricingBuckets = distributePricingRows(pricingRows, scopeCount);

        // 🎯 Extract discount percentage from pricing tables
        const discountPercentage = extractDiscountPercentage(nodes);
        console.log(
            `💰 [PDF Export] Discount percentage for SOW: ${discountPercentage}%`,
        );

        const totalInvestment = pricingRows.reduce((sum, row) => {
            const rowTotal = (row.hours || 0) * (row.rate || 0);
            return sum + (rowTotal || 0);
        }, 0);

        const totalHours = pricingRows.reduce(
            (sum, row) => sum + (row.hours || 0),
            0,
        );

        const currency = (currentDoc.currency || "AUD")
            .toString()
            .toUpperCase();
        const projectSubtitleMap: Record<string, string> = {
            project: "STANDARD PROJECT DELIVERY",
            audit: "AUDIT & STRATEGY ENGAGEMENT",
            retainer: "MANAGED SERVICES RETAINER",
        };

        const projectSubtitle =
            projectSubtitleMap[currentDoc.workType as string] ||
            "PROFESSIONAL SERVICES";

        let budgetNotes = "";
        if (budgetSection) {
            budgetNotes = summariseParagraphs(
                collectParagraphs(budgetSection.nodes),
                4,
            );
        }

        if (!budgetNotes && totalInvestment) {
            budgetNotes = `Total investment: ${formatCurrencyValue(totalInvestment, currency)}${
                currency === "AUD" ? " + GST" : ""
            }. Estimated effort: ${Math.round(totalHours)} hours.`;
        }

        if (!budgetNotes) {
            budgetNotes =
                "Payment terms: Net 30 days. Pricing subject to final scheduling and approvals.";
        }

        const defaultScopeItems = pricingRows.length
            ? pricingRows.map(rowToItem)
            : [
                  {
                      description:
                          "Professional services delivery as outlined in the SOW",
                      role: "Project Team",
                      hours: 0,
                      cost: 0,
                  },
              ];

        let scopes: SOWScope[] = [];

        if (phaseSections.length > 0) {
            scopes = phaseSections.map((section, index) => {
                const paragraphs = collectParagraphs(section.nodes);
                const description =
                    summariseParagraphs(paragraphs, 4) || section.title;
                const sectionDeliverables = collectListItems(section.nodes);
                const items = pricingBuckets[index]?.length
                    ? pricingBuckets[index].map(rowToItem)
                    : index === 0
                      ? defaultScopeItems
                      : [
                            {
                                description:
                                    "Refer to scope narrative for detailed activities",
                                role: "Project Team",
                                hours: 0,
                                cost: 0,
                            },
                        ];

                const assumptions = section.title
                    ?.toLowerCase()
                    .includes("assumption")
                    ? collectListItems(section.nodes)
                    : [];

                return {
                    id: index + 1,
                    title: section.title || `Scope ${index + 1}`,
                    description,
                    items,
                    deliverables: sectionDeliverables.length
                        ? sectionDeliverables
                        : mergeUnique(globalDeliverables),
                    assumptions: assumptions.length
                        ? assumptions
                        : mergeUnique(globalAssumptions),
                } as SOWScope;
            });
        } else {
            scopes = [
                {
                    id: 1,
                    title: currentDoc.title || "Project Scope",
                    description:
                        projectOverview ||
                        "Comprehensive project delivery as outlined in the SOW.",
                    items: defaultScopeItems,
                    deliverables: mergeUnique(globalDeliverables),
                    assumptions: mergeUnique(globalAssumptions),
                },
            ];
        }

        const clientName = extractClientName(currentDoc) || "Client";

        const sowData: SOWData = {
            company: {
                name: "Social Garden",
            },
            clientName,
            projectTitle: currentDoc.title || "Statement of Work",
            projectSubtitle,
            projectOverview:
                projectOverview ||
                "Comprehensive project delivery as outlined in this proposal.",
            budgetNotes,
            scopes,
            currency,
            gstApplicable: currency === "AUD",
            generatedDate: new Date().toISOString(),
            discount: discountPercentage > 0 ? discountPercentage : undefined,
        };

        return sowData;
    } catch (error) {
        console.error("Error preparing SOW for new PDF:", error);
        return null;
    }
}
