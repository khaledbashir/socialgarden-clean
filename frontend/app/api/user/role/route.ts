import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * GET /api/user/role
 * Fetch user role for the authenticated user
 * 
 * Headers:
 *   x-user-id: User identifier (required)
 * 
 * Returns:
 *   { role: "admin" | "editor" | "viewer", userId: string }
 * 
 * Note: This is a placeholder implementation. In production, this should:
 * 1. Authenticate the user via session/JWT
 * 2. Fetch role from user database table
 * 3. Return appropriate role based on user record
 */
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id") || "default-user";

        console.log("📥 [USER ROLE] Fetching role for user:", userId);

        // TODO: Replace with actual database query
        // For now, we'll use a simple mapping or default to viewer
        // In production, query: SELECT role FROM users WHERE id = ?
        
        const pool = getPool();
        const connection = await pool.getConnection();
        
        try {
            // Check if users table exists and has role column
            // Try to find user by id first, then by username
            let [rows] = await connection.execute(
                `SELECT role FROM users WHERE id = ? OR username = ? LIMIT 1`,
                [userId, userId]
            );

            let role = "viewer"; // Default role

            if (Array.isArray(rows) && rows.length > 0) {
                const user = rows[0] as any;
                role = user.role || "viewer";
                console.log(`✅ [USER ROLE] Found user in database with role: ${role}`);
            } else {
                // User not found in database - check for admin key or default
                // For development: allow admin key in header
                const adminKey = request.headers.get("x-admin-key");
                if (adminKey === process.env.ADMIN_API_KEY) {
                    role = "admin";
                    console.log("✅ [USER ROLE] Using admin key authentication");
                } else {
                    // Default to viewer for unknown users
                    role = "viewer";
                    console.log(`⚠️ [USER ROLE] User '${userId}' not found in database, defaulting to viewer`);
                }
            }

            // Validate role
            if (!["admin", "editor", "viewer"].includes(role)) {
                role = "viewer";
            }

            console.log("✅ [USER ROLE] User role:", role);

            return NextResponse.json({
                role,
                userId,
            });
        } catch (dbError: any) {
            // If users table doesn't exist, return default role
            console.warn("⚠️ [USER ROLE] Database query failed, defaulting to viewer:", dbError.message);
            
            // Check for admin key as fallback
            const adminKey = request.headers.get("x-admin-key");
            const role = adminKey === process.env.ADMIN_API_KEY ? "admin" : "viewer";
            
            return NextResponse.json({
                role,
                userId,
            });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("❌ [USER ROLE] Error fetching role:", error);
        return NextResponse.json(
            {
                role: "viewer", // Default to most restrictive
                error: "Failed to fetch user role",
                message: error.message,
            },
            { status: 500 }
        );
    }
}

