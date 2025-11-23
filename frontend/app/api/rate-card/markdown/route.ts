import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/rate-card/markdown
 * Returns the rate card formatted as markdown for AI prompt injection
 */
export async function GET() {
    console.log("📋 [Rate Card API] Request received");
    console.log("📋 [Rate Card API] Environment check:");
    console.log("   DB_HOST:", process.env.DB_HOST || "NOT SET");
    console.log("   DB_PORT:", process.env.DB_PORT || "NOT SET");
    console.log("   DB_NAME:", process.env.DB_NAME || "NOT SET");
    console.log("   DB_USER:", process.env.DB_USER || "NOT SET");
    console.log(
        "   DB_PASSWORD:",
        process.env.DB_PASSWORD ? "***SET***" : "NOT SET",
    );

    try {
        console.log("📋 [Rate Card API] Attempting database query...");
        const roles = await query(
            `SELECT role_name as roleName, hourly_rate as hourlyRate
             FROM rate_card_roles
             WHERE is_active = TRUE
             ORDER BY role_name ASC`,
        );
        console.log(
            "📋 [Rate Card API] Query successful, roles found:",
            roles?.length || 0,
        );

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const version = `${yyyy}-${mm}-${dd}`;

        const header = `# Social Garden - Official Rate Card (AUD/hour)\n\n`;
        const intro = `This document is the single source of truth for hourly rates across roles.\n\n`;
        const tableHeader = `| Role | Rate (AUD/hr) |\n|---|---:|\n`;
        const rows = roles
            .map(
                (r: any) =>
                    `| ${r.roleName} | ${Number(r.hourlyRate).toFixed(2)} |`,
            )
            .join("\n");
        const guidance = `\n\n> Version: v${version}\n\n## Pricing Guidance\n- Rates are exclusive of GST.\n- Use these rates for project pricing and retainers unless client-approved custom rates apply.\n- "Head Of", "Project Coordination", and "Account Management" roles are required governance roles for delivery.\n\n## Retainer Notes\n- Show monthly breakdowns and annualized totals.\n- Define overflow: hours beyond monthly budget billed at these standard rates.\n- Typical options: Essential (lean), Standard (recommended), Premium (full team).\n`;

        const markdown = header + intro + tableHeader + rows + guidance;

        console.log("📋 [Rate Card API] Markdown generated successfully");
        console.log("   Total roles:", roles.length);
        console.log("   Markdown length:", markdown.length);

        return NextResponse.json({
            success: true,
            markdown,
            version,
            roleCount: roles.length,
        });
    } catch (error: any) {
        console.error("❌ [Rate Card API] CRITICAL ERROR:", error);
        console.error("❌ [Rate Card API] Error message:", error.message);
        console.error("❌ [Rate Card API] Error code:", error.code);
        console.error("❌ [Rate Card API] Error stack:", error.stack);
        console.error(
            "❌ [Rate Card API] Full error object:",
            JSON.stringify(error, null, 2),
        );

        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate rate card markdown",
                message: error.message,
                code: error.code,
                details: {
                    db_host: process.env.DB_HOST || "NOT SET",
                    db_port: process.env.DB_PORT || "NOT SET",
                    db_name: process.env.DB_NAME || "NOT SET",
                    db_user: process.env.DB_USER || "NOT SET",
                    timestamp: new Date().toISOString(),
                },
            },
            { status: 500 },
        );
    }
}
