/**
 * Database connection utility for Social Garden SOW Generator
 * Uses connection pooling for better performance
 */

import mysql from "mysql2/promise";

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "sg_sow_user",
    password: process.env.DB_PASSWORD || "SG_sow_2025_SecurePass!",
    database: process.env.DB_NAME || "socialgarden_sow",
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    multipleStatements: false,
};

// Log database configuration (without password)
console.log("🔧 [DB CONFIG]", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? "***SET***" : "***NOT SET***",
});

// Create connection pool
let pool: mysql.Pool | null = null;

/**
 * Get database connection pool (singleton pattern)
 */
export function getPool(): mysql.Pool {
    if (!pool) {
        console.log("🔄 [DB] Creating new connection pool...");
        pool = mysql.createPool(dbConfig);
        console.log("✅ [DB] Connection pool created successfully");

        // Test connection immediately
        pool.getConnection()
            .then((conn) => {
                console.log("✅ [DB] Test connection successful");
                conn.release();
            })
            .catch((err) => {
                console.error("❌ [DB] Test connection FAILED:", err.message);
                console.error("❌ [DB] Full error:", err);
            });
    }
    return pool;
}

/**
 * Force refresh connection pool to get fresh metadata
 */
export function refreshPool(): mysql.Pool {
    console.log("🔄 [DB] Refreshing connection pool...");
    if (pool) {
        pool.end().then(() => {
            console.log("✅ [DB] Old connection pool closed");
        });
        pool = null;
    }
    return getPool();
}

/**
 * Execute a query with automatic connection handling
 */
export async function query<T = any>(
    sql: string,
    params?: any[],
): Promise<T[]> {
    console.log("🔍 [DB QUERY] Executing:", sql.substring(0, 100) + "...");
    console.log("🔍 [DB QUERY] Params:", params);

    try {
        const pool = getPool();
        const [rows] = await pool.execute(sql, params);
        console.log(
            "✅ [DB QUERY] Success, rows:",
            Array.isArray(rows) ? rows.length : "N/A",
        );
        return rows as T[];
    } catch (error) {
        console.error("❌ [DB QUERY] ERROR:", error);
        throw error;
    }
}

/**
 * Execute a single query and return first row
 */
export async function queryOne<T = any>(
    sql: string,
    params?: any[],
): Promise<T | null> {
    const rows = await query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
    try {
        const pool = getPool();
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log("✅ Database connection test successful");
        return true;
    } catch (error) {
        console.error("❌ Database connection test failed:", error);
        return false;
    }
}

/**
 * Close database connection pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
        console.log("✅ Database connection pool closed");
    }
}

/**
 * Helper: Generate unique SOW ID
 */
export function generateSOWId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `sow-${timestamp}-${random}`;
}

/**
 * Helper: Format date for MySQL
 */
export function formatDateForMySQL(date: Date): string {
    return date.toISOString().slice(0, 19).replace("T", " ");
}

// Types for database operations
export interface SOW {
    id: string;
    title: string;
    client_name: string;
    client_email: string | null;
    content: string;
    total_investment: number;
    status: "draft" | "sent" | "viewed" | "accepted" | "declined";
    workspace_slug: string | null;
    embed_id: string | null;
    created_at: Date;
    updated_at: Date;
    sent_at: Date | null;
    first_viewed_at: Date | null;
    last_viewed_at: Date | null;
    expires_at: Date | null;
    accepted_at: Date | null;
    declined_at: Date | null;
    folder_id: string | null;
    creator_email: string | null;
    vertical?:
        | "property"
        | "education"
        | "finance"
        | "healthcare"
        | "retail"
        | "hospitality"
        | "professional-services"
        | "technology"
        | "other"
        | null;
    service_line?:
        | "crm-implementation"
        | "marketing-automation"
        | "revops-strategy"
        | "managed-services"
        | "consulting"
        | "training"
        | "other"
        | null;
}

export interface SOWActivity {
    id: number;
    sow_id: string;
    event_type: string;
    metadata: any;
    created_at: Date;
}

export interface SOWComment {
    id: number;
    sow_id: string;
    author_type: "client" | "agency";
    author_name: string;
    author_email: string;
    section_id: string | null;
    section_title: string | null;
    content: string;
    parent_comment_id: number | null;
    is_read: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface SOWAcceptance {
    id: number;
    sow_id: string;
    signer_name: string;
    signer_email: string;
    signer_company: string | null;
    signer_title: string | null;
    signature_data: string;
    signature_method: "canvas" | "typed" | "uploaded";
    ip_address: string;
    user_agent: string | null;
    terms_accepted: boolean;
    signed_at: Date;
}

export interface SOWRejection {
    id: number;
    sow_id: string;
    reason: string;
    details: string | null;
    ai_response: string | null;
    client_replied: boolean;
    client_reply: string | null;
    follow_up_scheduled: boolean;
    follow_up_date: Date | null;
    follow_up_notes: string | null;
    rejected_at: Date;
}

export interface AIConversation {
    id: number;
    sow_id: string;
    role: "client" | "ai";
    message: string;
    buying_signal_detected: boolean;
    objection_detected: boolean;
    objection_type: string | null;
    sentiment: string | null;
    metadata: any;
    created_at: Date;
}
