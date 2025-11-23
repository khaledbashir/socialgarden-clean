import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || '168.231.115.219',
  user: process.env.DB_USER || 'sg_sow_user',
  password: process.env.DB_PASSWORD || 'SG_sow_2025_SecurePass!',
  database: process.env.DB_NAME || 'socialgarden_sow',
  port: parseInt(process.env.DB_PORT || '3306'),
};

/**
 * GET /api/sow/[id]/recommendations
 * Fetch all AI-recommended add-ons for a specific SOW
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const sowId = params.id;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT 
        r.id,
        r.sow_id,
        r.service_id,
        r.recommended_price,
        r.is_selected,
        r.ai_reasoning,
        r.relevance_score,
        r.client_insights,
        r.created_at,
        s.name as service_name,
        s.description as service_description,
        s.pricing_unit,
        s.category,
        s.icon_url
      FROM sow_recommendations r
      INNER JOIN service_catalog s ON r.service_id = s.id
      WHERE r.sow_id = ?
      ORDER BY r.relevance_score DESC, r.created_at DESC
    `;

    const [rows] = await connection.execute(query, [sowId]);

    return NextResponse.json({
      success: true,
      recommendations: rows,
    });
  } catch (error: any) {
    console.error(`❌ [GET /api/sow/${sowId}/recommendations] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recommendations',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * PUT /api/sow/[id]/recommendations
 * Update selection status of recommendations (when client checks/unchecks add-ons)
 * Body: { recommendationIds: string[], isSelected: boolean }
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const routeParams = await context.params;
  const sowId = routeParams.id;
  let connection;

  try {
    const body = await request.json();
    const { recommendationIds, isSelected } = body;

    if (!Array.isArray(recommendationIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'recommendationIds must be an array',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    const query = `
      UPDATE sow_recommendations
      SET is_selected = ?
      WHERE id IN (${recommendationIds.map(() => '?').join(',')})
      AND sow_id = ?
    `;

    const queryParams = [isSelected, ...recommendationIds, sowId];
    const [result]: any = await connection.execute(query, queryParams);

    return NextResponse.json({
      success: true,
      message: `Updated ${result.affectedRows} recommendations`,
      affectedRows: result.affectedRows,
    });
  } catch (error: any) {
    console.error(`❌ [PUT /api/sow/${sowId}/recommendations] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update recommendations',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
