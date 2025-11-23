import { NextRequest, NextResponse } from "next/server";

// 🎯 CRITICAL FIX: Discount validation function to prevent calculation errors
function validateDiscount(discount: any): number {
    console.log(
        `🔍 [PDF API] Validating discount: ${discount} (type: ${typeof discount})`,
    );

    // Convert to number if possible
    let discountValue: number;
    try {
        discountValue =
            typeof discount === "number"
                ? discount
                : parseFloat(discount || "0");
    } catch {
        console.warn(
            `⚠️ [PDF API] Invalid discount format: ${discount}, defaulting to 0%`,
        );
        return 0;
    }

    // Validate range
    if (isNaN(discountValue) || discountValue < 0) {
        console.warn(
            `⚠️ [PDF API] Invalid discount value: ${discountValue}, setting to 0%`,
        );
        return 0;
    }

    if (discountValue > 100) {
        console.error(
            `❌ [PDF API] Impossible discount: ${discountValue}%, setting to 0%`,
        );
        return 0;
    }

    if (discountValue > 50) {
        console.warn(
            `⚠️ [PDF API] High discount: ${discountValue}%, capping at 50%`,
        );
        return 50;
    }

    console.log(`✅ [PDF API] Validated discount: ${discountValue}%`);
    return discountValue;
}

// Backend service URL
const BACKEND_PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || process.env.NEXT_PUBLIC_PDF_SERVICE_URL || "";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log("🔄 [PDF API Route] Request received");
        console.log("📊 Request body keys:", Object.keys(body));

        // Check if this is a multi-scope request
        if (body.scopes && Array.isArray(body.scopes)) {
            console.log(
                "✅ [PDF API Route] Multi-scope request detected:",
                body.scopes.length,
                "scopes",
            );

            // Route to professional PDF endpoint
            if (!BACKEND_PDF_SERVICE_URL) {
                throw new Error("PDF service not configured. Set PDF_SERVICE_URL or NEXT_PUBLIC_PDF_SERVICE_URL");
            }
            const response = await fetch(
                `${BACKEND_PDF_SERVICE_URL}/generate-professional-pdf`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        company: body.company || { name: "Social Garden" },
                        clientName: body.clientName,
                        projectTitle: body.projectTitle,
                        projectSubtitle: body.projectSubtitle || "",
                        projectOverview: body.projectOverview || "",
                        budgetNotes: body.budgetNotes || "",
                        scopes: body.scopes,
                        currency: body.currency || "AUD",
                        gstApplicable:
                            body.gstApplicable !== undefined
                                ? body.gstApplicable
                                : true,
                        generatedDate:
                            body.generatedDate || new Date().toISOString(),
                        discount: validateDiscount(body.discount),
                        show_pricing_summary:
                            body.showPricingSummary !== undefined
                                ? body.showPricingSummary
                                : true, // 🎯 Pass showTotal flag to backend for professional PDF
                    }),
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "❌ [PDF API Route] Backend professional PDF error:",
                    response.status,
                    errorText,
                );
                throw new Error(
                    `Professional PDF generation failed: ${response.status} ${errorText}`,
                );
            }

            console.log(
                "✅ [PDF API Route] Professional PDF generated successfully",
            );

            // Return the PDF file
            const pdfBuffer = await response.arrayBuffer();
            return new NextResponse(pdfBuffer, {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${body.filename || "SOW-Professional.pdf"}"`,
                },
            });
        } else {
            console.log("📄 [PDF API Route] Standard HTML request detected");

            // Route to standard PDF endpoint
            const response = await fetch(
                `${BACKEND_PDF_SERVICE_URL}/generate-pdf`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        html_content: body.html_content,
                        filename: body.filename || "SOW",
                        show_pricing_summary: body.show_pricing_summary || true,
                        final_investment_target_text:
                            body.final_investment_target_text,
                    }),
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "❌ [PDF API Route] Backend standard PDF error:",
                    response.status,
                    errorText,
                );
                throw new Error(
                    `Standard PDF generation failed: ${response.status} ${errorText}`,
                );
            }

            console.log(
                "✅ [PDF API Route] Standard PDF generated successfully",
            );

            // Return the PDF file
            const pdfBuffer = await response.arrayBuffer();
            return new NextResponse(pdfBuffer, {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${body.filename || "SOW.pdf"}"`,
                },
            });
        }
    } catch (error) {
        console.error("❌ [PDF API Route] Error:", error);

        return NextResponse.json(
            {
                error: "PDF generation failed",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
