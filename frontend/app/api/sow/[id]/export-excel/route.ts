import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
    exportToExcel,
    cleanSOWContent,
    extractSOWStructuredJson,
    extractPricingFromContent,
    rolesFromArchitectSOW,
} from "@/lib/export-utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: sowId } = await params;

        // Fetch SOW from database
        const sows = await query("SELECT * FROM sows WHERE id = ?", [sowId]);

        if (!sows || sows.length === 0) {
            return NextResponse.json(
                { error: "SOW not found" },
                { status: 404 },
            );
        }

        const sow = sows[0];

        // Parse content to extract structured data
        let sowData;
        try {
            // Clean content first
            const cleanedContent = cleanSOWContent(sow.content);

            // Try to extract pricing data from TipTap JSON first
            let structuredData: any = null;
            let pricingRows = [];
            let discount = null;

            if (sow.content && typeof sow.content === "object") {
                // Content is already JSON (TipTap format)
                pricingRows = extractPricingFromContent(sow.content);
            } else if (typeof sow.content === "string") {
                try {
                    // Try to parse as JSON
                    const contentJson = JSON.parse(sow.content);
                    pricingRows = extractPricingFromContent(contentJson);
                } catch (e) {
                    // Try to extract structured JSON from markdown
                    // scoped to the outer block so it's visible below
                    structuredData = extractSOWStructuredJson(cleanedContent);
                    if (structuredData) {
                        pricingRows = rolesFromArchitectSOW(structuredData);
                        if (
                            structuredData.project_details?.discount_percentage
                        ) {
                            discount = {
                                type: "percentage" as const,
                                value: structuredData.project_details
                                    .discount_percentage,
                            };
                        }
                    }
                }
            }

            sowData = {
                title: sow.title,
                client: sow.client_name,
                pricingRows,
                discount,
                deliverables: structuredData?.deliverables || [],
                assumptions: structuredData?.assumptions || [],
            };
        } catch (parseError) {
            console.error("Error parsing SOW content:", parseError);
            // Fallback to basic data
            sowData = {
                title: sow.title,
                client: sow.client_name,
                pricingRows: [],
                deliverables: [],
                assumptions: [],
            };
        }

        // Generate filename with client name and date
        const clientName = sowData.client || "Client";
        const date = new Date().toISOString().split("T")[0];
        const filename = `${clientName.replace(/\s+/g, "-")}-SOW-${date}.xlsx`;

        // Call backend service to generate Excel
        const PDF_SERVICE_URL =
            process.env.NEXT_PUBLIC_PDF_SERVICE_URL || "http://localhost:8000";

        const response = await fetch(`${PDF_SERVICE_URL}/export-excel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sowData,
                filename,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Backend error:", errorData);
            return NextResponse.json(
                { error: errorData.detail || "Failed to generate Excel" },
                { status: response.status },
            );
        }

        // Get Excel file from backend
        const excelBlob = await response.blob();

        // Return Excel file
        return new NextResponse(excelBlob, {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
    } catch (error) {
        console.error("Error exporting SOW to Excel:", error);
        return NextResponse.json(
            {
                error: "Failed to export SOW to Excel",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}

// No longer needed POST handler since we handle everything in GET
