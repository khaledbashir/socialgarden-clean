import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * PUT /api/rate-card/:id
 * Updates an existing rate card role
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
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

        // Check if role exists
        const existing = await query(
            "SELECT id FROM rate_card_roles WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Rate card role not found",
                },
                { status: 404 }
            );
        }

        // Check for duplicate role name (excluding current role)
        const duplicate = await query(
            "SELECT id FROM rate_card_roles WHERE role_name = ? AND id != ?",
            [roleName.trim(), id]
        );

        if (duplicate.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "A role with this name already exists",
                },
                { status: 409 }
            );
        }

        // Update role
        await query(
            `UPDATE rate_card_roles
             SET role_name = ?, hourly_rate = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [roleName.trim(), hourlyRate, id]
        );

        // Fetch the updated role
        const updatedRole = await query(
            `SELECT id, role_name as roleName, hourly_rate as hourlyRate, is_active as isActive, created_at as createdAt, updated_at as updatedAt
             FROM rate_card_roles
             WHERE id = ?`,
            [id]
        );

        return NextResponse.json({
            success: true,
            data: updatedRole[0],
            message: "Rate card role updated successfully",
        });
    } catch (error: any) {
        console.error("❌ Error updating rate card role:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update rate card role",
                message: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/rate-card/:id
 * Deletes a rate card role (soft delete by setting is_active = FALSE)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Check if role exists
        const existing = await query(
            "SELECT id FROM rate_card_roles WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Rate card role not found",
                },
                { status: 404 }
            );
        }

        // Soft delete (set is_active to FALSE)
        await query(
            `UPDATE rate_card_roles
             SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );

        return NextResponse.json({
            success: true,
            message: "Rate card role deleted successfully",
        });
    } catch (error: any) {
        console.error("❌ Error deleting rate card role:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete rate card role",
                message: error.message,
            },
            { status: 500 }
        );
    }
}
