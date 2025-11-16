/**
 * API Route: Export SOW to PDF
 * POST /api/sow/[id]/export-pdf
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
    exportToPDF,
    parseSOWMarkdown,
    cleanSOWContent,
} from "@/lib/export-utils";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const sowId = params.id;
        const body = await request.json();
        const { elementId } = body;

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
            // Parse markdown to extract structured data
            sowData = parseSOWMarkdown(cleanedContent);
            sowData.title = sow.title;
            sowData.client = sow.client_name;
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
        const filename = `${clientName.replace(/\s+/g, "-")}-SOW-${date}.pdf`;

        // Call backend service to generate PDF
        const PDF_SERVICE_URL =
            process.env.NEXT_PUBLIC_PDF_SERVICE_URL || "http://localhost:8000";

        // Get HTML content from frontend if elementId is provided
        let htmlContent = "";
        if (elementId) {
            // In a real implementation, you would need to use a service like Puppeteer
            // to capture the HTML from the client-side DOM
            // For now, we'll generate basic HTML from the content
            htmlContent = sow.content;
        } else {
            // Generate HTML from content
            htmlContent = sow.content;
        }

        const response = await fetch(`${PDF_SERVICE_URL}/generate-pdf`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                html_content: htmlContent,
                filename: filename.substring(0, filename.length - 4), // Remove .pdf extension
                client_name: clientName,
                title: sowData.title,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Backend error:", errorData);
            return NextResponse.json(
                { error: errorData.detail || "Failed to generate PDF" },
                { status: response.status },
            );
        }

        // Get PDF file from backend
        const pdfBlob = await response.blob();

        // Return PDF file
        return new NextResponse(pdfBlob, {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Type": "application/pdf",
            },
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json(
            {
                error: "Failed to generate PDF",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
