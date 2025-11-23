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
 * GET /api/admin/services
 * List all services in the catalog
 * Query params:
 * - category: Filter by category (optional)
 * - active: Filter by is_active status (optional, default: true)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const activeParam = searchParams.get('active');
  const isActive = activeParam !== null ? activeParam === 'true' : true;

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    let query = 'SELECT * FROM service_catalog WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (activeParam !== null) {
      query += ' AND is_active = ?';
      params.push(isActive);
    }

    query += ' ORDER BY category, name';

    const [rows] = await connection.execute(query, params);

    return NextResponse.json({
      success: true,
      services: rows,
    });
  } catch (error: any) {
    console.error('❌ [GET /api/admin/services] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch services',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * POST /api/admin/services
 * Create a new service in the catalog
 * Body: { name, description, base_price, pricing_unit, category, icon_url }
 */
export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json();
    const { name, description, base_price, pricing_unit, category, icon_url } = body;

    // Validation
    if (!name || !base_price) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'name and base_price are required',
        },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(base_price)) || parseFloat(base_price) < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid price',
          message: 'base_price must be a positive number',
        },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Generate UUID for service ID
    const serviceId = `service-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const query = `
      INSERT INTO service_catalog 
      (id, name, description, base_price, pricing_unit, category, icon_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `;

    const params = [
      serviceId,
      name,
      description || null,
      parseFloat(base_price),
      pricing_unit || 'month',
      category || 'general',
      icon_url || null,
    ];

    await connection.execute(query, params);

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      serviceId,
    });
  } catch (error: any) {
    console.error('❌ [POST /api/admin/services] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create service',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
