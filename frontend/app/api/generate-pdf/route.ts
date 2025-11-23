import { NextRequest, NextResponse } from "next/server";
import { tiptapToHTML } from "@/lib/export-utils";

// Support both GET and POST methods
// PDF generation endpoint for SOW documents
// REBUILD TRIGGER: 2025-10-23 Forcing cache invalidation on EasyPanel deployment
export async function GET(req: NextRequest) {
    console.log("🔍 [GET /api/generate-pdf] Request received");
    const searchParams = req.nextUrl.searchParams;

    // Enable debug checks with ?debug=1 or ?debug=true
    const debugParam = (searchParams.get("debug") || "").toLowerCase();
    if (debugParam === "1" || debugParam === "true") {
        const pdfServiceUrl =
            process.env.NEXT_PUBLIC_PDF_SERVICE_URL ||
            process.env.PDF_SERVICE_URL ||
            "";
        console.log("🔗 [PDF Service] Using URL (debug):", pdfServiceUrl);
        try {
            const healthResp = await fetch(`${pdfServiceUrl}/health`);
            const healthBody = await (healthResp.ok
                ? healthResp.json()
                : healthResp.text());
            return NextResponse.json({
                serviceUrl: pdfServiceUrl,
                healthOk: healthResp.ok,
                status: healthResp.status,
                health: healthBody,
            });
        } catch (err) {
            console.error("❌ [PDF Debug] Health check failed:", err);
            return NextResponse.json(
                { error: "Health check failed", detail: String(err) },
                { status: 500 },
            );
        }
    }

    const sowId = searchParams.get("sowId");

    if (!sowId) {
        console.error("❌ [GET /api/generate-pdf] Missing sowId");
        return NextResponse.json(
            { error: "sowId is required" },
            { status: 400 },
        );
    }

    // Call POST handler with sowId in body
    return handlePDFGeneration({ sowId });
}

export async function POST(req: NextRequest) {
    console.log("🔍 [POST /api/generate-pdf] Request received");
    try {
        const body = await req.json();
        console.log("📄 [POST /api/generate-pdf] Request body:", body);
        return handlePDFGeneration(body);
    } catch (error: any) {
        console.error(
            "❌ [POST /api/generate-pdf] Error:",
            error.message,
            error.cause,
        );
        return NextResponse.json(
            { error: `fetch failed: ${error.message}` },
            { status: 500 },
        );
    }
}

async function handlePDFGeneration(body: any) {
    try {
        console.log("📋 [PDF Export] Body keys:", Object.keys(body));
        console.log("📋 [PDF Export] Has content:", !!body.content);
        console.log(
            "📋 [PDF Export] Has html_content (incoming):",
            !!body.html_content,
        );
        console.log("📋 [PDF Export] Has sowId:", !!body.sowId);

        // Always (re)generate HTML from TipTap JSON when available to ensure latest filtering (e.g., zero-cost rows removed)
        if (body?.content) {
            try {
                const contentObj =
                    typeof body.content === "string"
                        ? JSON.parse(body.content)
                        : body.content;
                body.html_content = tiptapToHTML(contentObj);
                console.log(
                    "🧩 [PDF Export] Re-generated html_content from TipTap JSON",
                );
            } catch (e) {
                console.warn(
                    "⚠️ [PDF Export] Failed to parse TipTap JSON, falling back to provided html_content",
                );
            }
        }

        // PDF generation handler - converts SOW documents to PDF via backend service
        // Use environment variable with fallback to EasyPanel backend URL
        const pdfServiceUrl =
            process.env.NEXT_PUBLIC_PDF_SERVICE_URL ||
            process.env.PDF_SERVICE_URL ||
            "";
        console.log("🔗 [PDF Service] Using URL:", pdfServiceUrl);

        // If client asks for a debug POST (body.debug = true), run a lightweight health check
        // and return the configured backend URL and health status.
        if (body && body.debug) {
            try {
                console.log(
                    "🔍 [PDF Debug] POST debug requested, checking backend health at:",
                    `${pdfServiceUrl}/health`,
                );
                const healthResp = await fetch(`${pdfServiceUrl}/health`);
                const healthBody = await (healthResp.ok
                    ? healthResp.json()
                    : healthResp.text());
                return NextResponse.json({
                    serviceUrl: pdfServiceUrl,
                    healthOk: healthResp.ok,
                    status: healthResp.status,
                    health: healthBody,
                });
            } catch (err) {
                console.error(
                    "❌ [PDF Debug] Health check failed during POST debug:",
                    err,
                );
                return NextResponse.json(
                    { error: "Health check failed", detail: String(err) },
                    { status: 500 },
                );
            }
        }

        // Forward request to PDF service with timeout (increased to 60s for large documents)
        const controller = new AbortController();
        const timeoutMs = 60000; // 60 second timeout (increased from 30s)
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            if (!pdfServiceUrl) {
                throw new Error(
                    "PDF service not configured. Set PDF_SERVICE_URL or NEXT_PUBLIC_PDF_SERVICE_URL",
                );
            }
            console.log(
                "📨 [PDF Service] Sending request to:",
                `${pdfServiceUrl}/generate-pdf`,
            );
            const response = await fetch(`${pdfServiceUrl}/generate-pdf`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const error = await response.text();
                console.error("❌ [PDF Service] Error response:", error);
                return NextResponse.json(
                    {
                        error: `PDF service error: ${error}`,
                        status: response.status,
                        serviceUrl: pdfServiceUrl,
                        timestamp: new Date().toISOString(),
                        details:
                            "This error means the PDF service is not responding correctly. Check if backend is running.",
                    },
                    { status: response.status },
                );
            }

            // Get PDF bytes and return them as a raw Buffer for correct binary forwarding.
            const arrayBuffer = await response.arrayBuffer();
            console.log(
                "✅ [PDF Service] PDF generated successfully; bytes:",
                arrayBuffer.byteLength,
            );

            const contentType =
                response.headers.get("content-type") || "application/pdf";
            const contentDisposition =
                response.headers.get("content-disposition") ||
                `attachment; filename="${body.filename || "document"}.pdf"`;
            const contentLength =
                response.headers.get("content-length") || String(arrayBuffer.byteLength);

            return new NextResponse(arrayBuffer, {
                status: 200,
                headers: {
                    "Content-Type": contentType,
                    "Content-Disposition": contentDisposition,
                    "Content-Length": contentLength,
                },
            });
        } catch (fetchError: any) {
            clearTimeout(timeout);
            console.error("❌ Fetch error:", fetchError.message);

            // Provide detailed error information for debugging
            const errorDetails = {
                message: fetchError.message,
                name: fetchError.name,
                isTimeout: fetchError.name === "AbortError",
                timeoutMs: timeoutMs,
                serviceUrl: pdfServiceUrl,
                timestamp: new Date().toISOString(),
            };

            if (fetchError.name === "AbortError") {
                console.error(
                    "❌ PDF generation timeout after",
                    timeoutMs / 1000,
                    "seconds",
                );
            }

            throw fetchError;
        }
    } catch (error: any) {
        console.error("❌ PDF generation error:", error.message, error.cause);
        return NextResponse.json(
            {
                error: `fetch failed: ${error.message}`,
                details: {
                    message: error.message,
                    name: error.name,
                    cause: error.cause?.toString(),
                    timestamp: new Date().toISOString(),
                },
            },
            { status: 500 },
        );
    }
}
