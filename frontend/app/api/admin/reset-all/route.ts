import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { AnythingLLMService } from "@/lib/anythingllm";

/**
 * RESET ALL - Complete database and AnythingLLM cleanup
 * WARNING: This deletes ALL data! Use with extreme caution.
 *
 * Requires: { confirm: "RESET_ALL_DATA" } in body
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { confirm } = body;

        if (confirm !== "RESET_ALL_DATA") {
            return NextResponse.json(
                {
                    error: "Confirmation required. Send { confirm: 'RESET_ALL_DATA' }",
                },
                { status: 400 },
            );
        }

        console.log("💥 Starting complete reset - deleting ALL data...");

        // Lazily initialize AnythingLLMService (do NOT initialize at module-level)
        // This prevents build-time initialization errors when env vars are not set.
        let anythingLLM: AnythingLLMService | null = null;
        try {
            if (
                process.env.ANYTHINGLLM_URL &&
                process.env.ANYTHINGLLM_API_KEY
            ) {
                anythingLLM = new AnythingLLMService();
            } else {
                console.warn(
                    "⚠️ AnythingLLM configuration missing; skipping workspace deletion steps.",
                );
            }
        } catch (e) {
            console.warn(
                "⚠️ Failed to initialize AnythingLLMService; skipping workspace deletion steps.",
                e,
            );
            anythingLLM = null;
        }

        const results: Record<string, number> = {};

        // Step 1: Get all folders/workspaces before deletion
        const allFolders = await query(
            "SELECT id, name, workspace_slug FROM folders",
        );
        results.folders_before = allFolders.length;

        // Step 2: Delete all SOW-related data first (children before parents)
        console.log("🗑️ Deleting all SOW-related data...");

        const sowRelatedTables = [
            "sow_activities",
            "sow_comments",
            "sow_acceptances",
            "sow_rejections",
            "ai_conversations",
            "sow_snapshots",
        ];

        for (const table of sowRelatedTables) {
            try {
                await query(`DELETE FROM ${table}`);
                console.log(`✅ Deleted all records from ${table}`);
            } catch (error) {
                console.error(`⚠️ Error deleting from ${table}:`, error);
            }
        }

        // Step 3: Delete all SOWs
        const sowsBefore = await query<{ count: number }>(
            "SELECT COUNT(*) as count FROM sows",
        );
        results.sows_before = sowsBefore[0]?.count || 0;

        await query("DELETE FROM sows");
        console.log(`✅ Deleted ${results.sows_before} SOWs`);

        // Step 4: Delete all folders/workspaces (except Unfiled)
        console.log("🗑️ Deleting all folders/workspaces...");
        let deletedFolders = 0;
        const deletedWorkspaceSlugs: string[] = [];

        for (const folder of allFolders) {
            // Skip Unfiled folder
            if (folder.id === "unfiled" || folder.name === "Unfiled") {
                console.log(`⏭️  Skipping Unfiled folder: ${folder.id}`);
                continue;
            }

            // Delete AnythingLLM workspace if it exists (only if service is initialized)
            if (folder.workspace_slug) {
                if (anythingLLM) {
                    try {
                        await anythingLLM.deleteWorkspace(
                            folder.workspace_slug,
                        );
                        deletedWorkspaceSlugs.push(folder.workspace_slug);
                        console.log(
                            `✅ Deleted AnythingLLM workspace: ${folder.workspace_slug}`,
                        );
                    } catch (error: any) {
                        console.warn(
                            `⚠️ Failed to delete AnythingLLM workspace ${folder.workspace_slug}: ${error.message || error}`,
                        );
                        // Continue even if AnythingLLM deletion fails
                    }
                } else {
                    // Safe fallback: log and skip deletion if AnythingLLM is not configured or failed to initialize
                    console.warn(
                        `⚠️ Skipping AnythingLLM deletion for workspace ${folder.workspace_slug}; configuration missing or initialization failed.`,
                    );
                }
            }

            // Delete folder from database
            await query("DELETE FROM folders WHERE id = ?", [folder.id]);
            deletedFolders++;
            console.log(`✅ Deleted folder: ${folder.name} (${folder.id})`);
        }

        results.folders_deleted = deletedFolders;
        results.anythingllm_workspaces_deleted = deletedWorkspaceSlugs.length;

        // Step 5: Verify cleanup
        const foldersAfter = await query(
            "SELECT COUNT(*) as count FROM folders",
        );
        const sowsAfter = await query<{ count: number }>(
            "SELECT COUNT(*) as count FROM sows",
        );

        results.folders_after = (foldersAfter[0] as any)?.count || 0;
        results.sows_after = sowsAfter[0]?.count || 0;

        console.log("✅ Complete reset finished!");
        console.log("📊 Results:", results);

        return NextResponse.json({
            success: true,
            message: "All data reset successfully",
            results: {
                ...results,
                deletedWorkspaceSlugs,
            },
        });
    } catch (error) {
        console.error("❌ Reset failed:", error);
        return NextResponse.json(
            {
                error: "Reset failed",
                details: String(error),
            },
            { status: 500 },
        );
    }
}
