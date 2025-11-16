import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
    exportToExcel,
    cleanSOWContent,
    extractSOWStructuredJson,
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

        // Parse the content to extract structured data
        let sowData;
        try {
            // Clean the content first
            const cleanedContent = cleanSOWContent(sow.content);
            // Extract structured JSON from the content
            const structuredData = extractSOWStructuredJson(cleanedContent);
            sowData = {
                title: sow.title,
                client: sow.client_name,
                ...structuredData,
            };
        } catch (parseError) {
            console.error("Error parsing SOW content:", parseError);
            // Fallback to basic data
            sowData = {
                title: sow.title,
                client: sow.client_name,
                pricingRows: [],
            };
        }

        // Generate filename with client name and date
        const clientName = sowData.client || "Client";
        const date = new Date().toISOString().split("T")[0];
        const filename = `${clientName.replace(/\s+/g, "-")}-SOW-${date}.xlsx`;

        // Return the Excel file
        const response = new NextResponse(new Blob(), {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });

        // This is a workaround for Next.js streaming issues
        // We'll generate the Excel client-side using a separate API call
        return NextResponse.json({
            success: true,
            sowData,
            filename,
            message: "SOW data ready for Excel export",
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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: sowId } = await params;
        const body = await request.json();
        const { sowData, filename } = body;

        // Validate required data
        if (!sowData || !filename) {
            return NextResponse.json(
                { error: "Missing required data: sowData and filename" },
                { status: 400 },
            );
        }

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

        // Get the Excel file from backend
        const excelBlob = await response.blob();

        // Return the Excel file
        return new NextResponse(excelBlob, {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
    } catch (error) {
        console.error("Error generating Excel file:", error);
        return NextResponse.json(
            {
                error: "Failed to generate Excel file",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
