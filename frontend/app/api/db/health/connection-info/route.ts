import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * Database connection diagnostic endpoint
 * Access via: GET /api/db/health/connection-info
 * This will show which database the local dev environment is connecting to
 */
export async function GET(request: NextRequest) {
    try {
        console.log(
            "🔍 [DB INFO] Collecting database connection information...",
        );

        // Get database config (without password)
        const dbConfig = {
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT || "3306"),
            user: process.env.DB_USER || "sg_sow_user",
            database: process.env.DB_NAME || "socialgarden_sow",
            passwordSet: !!process.env.DB_PASSWORD,
        };

        const pool = getPool();
        const connection = await pool.getConnection();

        try {
            // Get actual database name we're connected to
            const [currentDbResult] = await connection.execute(
                "SELECT DATABASE() as current_db",
            );
            const currentDb = (currentDbResult as any[])[0]?.current_db;

            // Get server info
            const [serverInfo] = await connection.execute(
                "SELECT @@hostname as hostname, @@port as port",
            );
            const server = (serverInfo as any[])[0];

            // Check if user_preferences table exists in this database
            const [tableExists] = await connection.execute(
                "SHOW TABLES LIKE 'user_preferences'",
            );
            const tableExistsStatus = (tableExists as any[]).length > 0;

            // If table exists, check its structure
            let tableStructure = null;
            if (tableExistsStatus) {
                const [columns] = await connection.execute(
                    "DESCRIBE user_preferences",
                );
                tableStructure = (columns as any[]).map((col: any) => ({
                    field: col.Field,
                    type: col.Type,
                    null: col.Null,
                }));
            }

            return NextResponse.json({
                status: "success",
                connectionConfig: dbConfig,
                actualConnection: {
                    currentDatabase: currentDb,
                    serverHostname: server.hostname,
                    serverPort: server.port,
                    tableExists: tableExistsStatus,
                    tableStructure,
                },
                issue: {
                    problem:
                        "Local dev server connecting to different database than EasyPanel",
                    solution:
                        "Update .env.local to match EasyPanel database credentials",
                },
            });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("❌ [DB INFO] Database connection check failed:", error);
        return NextResponse.json(
            {
                status: "error",
                message: "Database connection check failed",
                error: error.message,
            },
            { status: 500 },
        );
    }
}
