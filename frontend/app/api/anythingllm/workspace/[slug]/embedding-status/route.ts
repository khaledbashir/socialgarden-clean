import { NextRequest, NextResponse } from "next/server";

function getEnv() {
    const baseUrl =
        process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || "";
    const apiKey =
        process.env.ANYTHINGLLM_API_KEY ||
        process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY ||
        "";
    return { baseUrl, apiKey };
}

/**
 * GET /api/anythingllm/workspace/[slug]/embedding-status
 * 
 * Checks if documents are fully embedded in the workspace
 * Returns: { ready: boolean, documentsCount: number, embeddedCount: number }
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { baseUrl, apiKey } = getEnv();
        if (!baseUrl || !apiKey) {
            return NextResponse.json(
                { error: "AnythingLLM not configured" },
                { status: 500 }
            );
        }

        const params = await context.params;
        const workspaceSlug = params.slug;

        if (!workspaceSlug) {
            return NextResponse.json(
                { error: "Workspace slug is required" },
                { status: 400 }
            );
        }

        // Get workspace details including document status
        const workspaceResponse = await fetch(
            `${baseUrl}/api/v1/workspace/${workspaceSlug}`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!workspaceResponse.ok) {
            return NextResponse.json(
                { error: "Failed to fetch workspace status" },
                { status: workspaceResponse.status }
            );
        }

        const workspaceData = await workspaceResponse.json();
        const workspace = workspaceData.workspace;

        // Check document embedding status
        // AnythingLLM returns documents array with embedding status
        const documents = workspace?.documents || [];
        const totalDocs = documents.length;

        // Documents are considered embedded if they have been processed
        // Check for 'cached' or 'embedded' status
        const embeddedDocs = documents.filter(
            (doc: any) => doc.cached === true || doc.status === "ready"
        );
        const embeddedCount = embeddedDocs.length;

        const ready = totalDocs > 0 && embeddedCount === totalDocs;

        return NextResponse.json({
            ready,
            documentsCount: totalDocs,
            embeddedCount,
            workspace: workspaceSlug,
        });
    } catch (error: any) {
        console.error("Error checking embedding status:", error);
        return NextResponse.json(
            {
                error: "Failed to check embedding status",
                details: error?.message || String(error),
            },
            { status: 500 }
        );
    }
}
