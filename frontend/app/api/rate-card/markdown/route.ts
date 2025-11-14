import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/rate-card/markdown
 * Returns the rate card formatted as markdown for AI prompt injection
 */
export async function GET() {
    try {
        const roles = await query(
            `SELECT role_name as roleName, hourly_rate as hourlyRate
             FROM rate_card_roles
             WHERE is_active = TRUE
             ORDER BY role_name ASC`
        );

        // Build markdown table
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const version = `${yyyy}-${mm}-${dd}`;

        const header = `# Social Garden - Official Rate Card (AUD/hour)\n\n`;
        const intro = `This document is the single source of truth for hourly rates across roles.\n\n`;
        const tableHeader = `| Role | Rate (AUD/hr) |\n|---|---:|\n`;
        const rows = roles
            .map((r: any) => `| ${r.roleName} | ${r.hourlyRate.toFixed(2)} |`)
            .join("\n");
        const guidance = `\n\n> Version: v${version}\n\n## Pricing Guidance\n- Rates are exclusive of GST.\n- Use these rates for project pricing and retainers unless client-approved custom rates apply.\n- "Head Of", "Project Coordination", and "Account Management" roles are required governance roles for delivery.\n\n## Retainer Notes\n- Show monthly breakdowns and annualized totals.\n- Define overflow: hours beyond monthly budget billed at these standard rates.\n- Typical options: Essential (lean), Standard (recommended), Premium (full team).\n`;

        const markdown = header + intro + tableHeader + rows + guidance;

        return NextResponse.json({
            success: true,
            markdown,
            version,
            roleCount: roles.length,
        });
    } catch (error: any) {
        console.error("❌ Error generating rate card markdown:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate rate card markdown",
                message: error.message,
            },
            { status: 500 }
        );
    }
}
