import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Cleanup API - Removes old/orphaned folders
 * WARNING: This deletes data! Use with caution.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { confirm, keepRecent = false } = body;

        if (confirm !== "CLEANUP_ALL") {
            return NextResponse.json(
                {
                    error: "Confirmation required. Send { confirm: 'CLEANUP_ALL' }",
                },
                { status: 400 },
            );
        }

        console.log("🧹 Starting folder cleanup...");

        // Get all folders
        const allFolders = await query(
            "SELECT id, name, workspace_slug, created_at FROM folders ORDER BY created_at DESC",
        );

        console.log(`📊 Found ${allFolders.length} folders`);

        // Option 1: Delete all folders (except Unfiled if it exists)
        let deletedCount = 0;
        const deletedFolders = [];

        for (const folder of allFolders) {
            // Skip Unfiled folder
            if (folder.id === "unfiled" || folder.name === "Unfiled") {
                console.log(`⏭️  Skipping Unfiled folder: ${folder.id}`);
                continue;
            }

            // Check if folder has SOWs
            const [sows] = await query(
                "SELECT COUNT(*) as count FROM sows WHERE folder_id = ?",
                [folder.id],
            );

            if (sows[0].count > 0) {
                console.log(
                    `⚠️  Skipping folder "${folder.name}" - has ${sows[0].count} SOW(s)`,
                );
                continue;
            }

            // Delete the folder
            await query("DELETE FROM folders WHERE id = ?", [folder.id]);
            deletedCount++;
            deletedFolders.push(folder.name);
            console.log(`✅ Deleted folder: ${folder.name} (${folder.id})`);
        }

        console.log(`✅ Cleanup completed! Deleted ${deletedCount} folder(s)`);

        return NextResponse.json({
            success: true,
            deleted: deletedCount,
            deletedFolders,
            message: `Successfully deleted ${deletedCount} empty folder(s)`,
        });
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
        return NextResponse.json(
            {
                error: "Cleanup failed",
                details: String(error),
            },
            { status: 500 },
        );
    }
}

/**
 * GET - List folders that can be cleaned up (dry run)
 */
export async function GET(request: NextRequest) {
    try {
        const allFolders = await query(
            "SELECT id, name, workspace_slug, created_at FROM folders ORDER BY created_at DESC",
        );

        const canDelete = [];
        const cannotDelete = [];

        for (const folder of allFolders) {
            // Skip Unfiled folder
            if (folder.id === "unfiled" || folder.name === "Unfiled") {
                cannotDelete.push({
                    ...folder,
                    reason: "Unfiled folder (protected)",
                });
                continue;
            }

            // Check if folder has SOWs
            const [sows] = await query(
                "SELECT COUNT(*) as count FROM sows WHERE folder_id = ?",
                [folder.id],
            );

            if (sows[0].count > 0) {
                cannotDelete.push({
                    ...folder,
                    reason: `Has ${sows[0].count} SOW(s)`,
                });
            } else {
                canDelete.push({
                    ...folder,
                    reason: "Empty folder (no SOWs)",
                });
            }
        }

        return NextResponse.json({
            total: allFolders.length,
            canDelete: canDelete.length,
            cannotDelete: cannotDelete.length,
            folders: {
                canDelete,
                cannotDelete,
            },
        });
    } catch (error) {
        console.error("❌ Failed to analyze folders:", error);
        return NextResponse.json(
            {
                error: "Failed to analyze folders",
                details: String(error),
            },
            { status: 500 },
        );
    }
}

