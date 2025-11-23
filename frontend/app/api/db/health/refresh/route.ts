import { NextRequest, NextResponse } from "next/server";
import { refreshPool } from "@/lib/db";

/**
 * Refresh database connection pool to clear any cached metadata
 * Access via: GET /api/db/health/refresh
 */
export async function GET(request: NextRequest) {
    try {
        console.log("🔄 [DB REFRESH] Refreshing connection pool to clear cached metadata...");

        // Refresh the connection pool
        const newPool = refreshPool();

        console.log("✅ [DB REFRESH] Connection pool refreshed successfully");

        return NextResponse.json({
            status: "success",
            message: "Database connection pool refreshed successfully",
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("❌ [DB REFRESH] Error refreshing connection pool:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "Failed to refresh connection pool",
                error: error.message
            },
            { status: 500 }
        );
    }
}
