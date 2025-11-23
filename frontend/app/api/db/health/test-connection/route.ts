import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

/**
 * Test database connection and verify which database is actually connected
 */
export async function GET(request: NextRequest) {
    try {
        // Create a fresh connection with the same config as the app
        const dbConfig = {
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT || "3306"),
            user: process.env.DB_USER || "sg_sow_user",
            password: process.env.DB_PASSWORD || "SG_sow_2025_SecurePass!",
            database: process.env.DB_NAME || "socialgarden_sow",
        };

        console.log("🔍 [DB TEST] Connection config:", {
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            database: dbConfig.database,
            passwordSet: !!dbConfig.password,
        });

        // Create connection
        const connection = await mysql.createConnection(dbConfig);

        try {
            // Test 1: Check what database we're actually connected to
            const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
            const currentDb = (dbResult as any[])[0]?.current_db;

            // Test 2: Check if user_preferences table exists in this database
            const [tableExists] = await connection.execute(
                "SHOW TABLES LIKE 'user_preferences'"
            );
            const tableExistsStatus = (tableExists as any[]).length > 0;

            // Test 3: If table exists, check its structure
            let tableStructure = null;
            if (tableExistsStatus) {
                const [columns] = await connection.execute('DESCRIBE user_preferences');
                tableStructure = (columns as any[]).map((col: any) => ({
                    field: col.Field,
                    type: col.Type,
                    null: col.Null
                }));
            }

            // Test 4: Try the exact query that's failing in user preferences API
            let testQueryResult = null;
            let testQueryError = null;
            try {
                const [rows] = await connection.execute(
                    'SELECT preference_key, preference_value FROM user_preferences WHERE user_id = ?',
                    ['test-user']
                );
                testQueryResult = { success: true, rows: (rows as any[]).length };
            } catch (error: any) {
                testQueryError = { message: error.message, code: error.code };
            }

            return NextResponse.json({
                status: "success",
                config: {
                    configuredDatabase: dbConfig.database,
                    actualDatabase: currentDb,
                    databaseMatch: dbConfig.database === currentDb
                },
                table: {
                    exists: tableExistsStatus,
                    structure: tableStructure
                },
                testQuery: {
                    result: testQueryResult,
                    error: testQueryError
                }
            });
        } finally {
            await connection.end();
        }
    } catch (error: any) {
        console.error("❌ [DB TEST] Error:", error);
        return NextResponse.json(
            {
                status: "error",
                message: error.message,
                code: error.code
            },
            { status: 500 }
        );
    }
}
