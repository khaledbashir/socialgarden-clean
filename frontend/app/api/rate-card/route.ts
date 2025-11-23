import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/rate-card
 * Fetches all active rate card roles
 */
export async function GET() {
    try {
        const roles = await query(
            `SELECT id, role_name as roleName, hourly_rate as hourlyRate, is_active as isActive, created_at as createdAt, updated_at as updatedAt
             FROM rate_card_roles
             WHERE is_active = TRUE
             ORDER BY role_name ASC`
        );

        return NextResponse.json({
            success: true,
            data: roles,
            count: roles.length,
        });
    } catch (error: any) {
        console.error("❌ Error fetching rate card roles:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch rate card roles",
                message: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/rate-card
 * Creates a new rate card role
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { roleName, hourlyRate } = body;

        // Validation
        if (!roleName || typeof roleName !== "string" || roleName.trim() === "") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Role name is required and must be a non-empty string",
                },
                { status: 400 }
            );
        }

        if (typeof hourlyRate !== "number" || hourlyRate <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Hourly rate must be a positive number",
                },
                { status: 400 }
            );
        }

        // Check for duplicate role name
        const existing = await query(
            "SELECT id FROM rate_card_roles WHERE role_name = ?",
            [roleName.trim()]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "A role with this name already exists",
                },
                { status: 409 }
            );
        }

        // Generate a unique ID
        const id = `rc-${uuidv4()}`;

        // Insert new role
        await query(
            `INSERT INTO rate_card_roles (id, role_name, hourly_rate, is_active)
             VALUES (?, ?, ?, TRUE)`,
            [id, roleName.trim(), hourlyRate]
        );

        // Fetch the newly created role
        const newRole = await query(
            `SELECT id, role_name as roleName, hourly_rate as hourlyRate, is_active as isActive, created_at as createdAt, updated_at as updatedAt
             FROM rate_card_roles
             WHERE id = ?`,
            [id]
        );

        return NextResponse.json(
            {
                success: true,
                data: newRole[0],
                message: "Rate card role created successfully",
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("❌ Error creating rate card role:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to create rate card role",
                message: error.message,
            },
            { status: 500 }
        );
    }
}
