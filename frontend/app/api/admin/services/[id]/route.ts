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
 * PUT /api/admin/services/[id]
 * Update an existing service
 * Body: { name?, description?, base_price?, pricing_unit?, category?, icon_url?, is_active? }
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const serviceId = params.id;
  let connection;

  try {
    const body = await request.json();
    const { name, description, base_price, pricing_unit, category, icon_url, is_active } = body;

    // Validation
    if (base_price !== undefined) {
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
    }

    connection = await mysql.createConnection(dbConfig);

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (base_price !== undefined) {
      updates.push('base_price = ?');
      params.push(parseFloat(base_price));
    }
    if (pricing_unit !== undefined) {
      updates.push('pricing_unit = ?');
      params.push(pricing_unit);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (icon_url !== undefined) {
      updates.push('icon_url = ?');
      params.push(icon_url);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No fields to update',
          message: 'Provide at least one field to update',
        },
        { status: 400 }
      );
    }

    params.push(serviceId);

    const query = `
      UPDATE service_catalog 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    const [result]: any = await connection.execute(query, params);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service not found',
          message: `No service found with ID: ${serviceId}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
    });
  } catch (error: any) {
    console.error(`❌ [PUT /api/admin/services/${serviceId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update service',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * DELETE /api/admin/services/[id]
 * Delete a service from the catalog
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const serviceId = params.id;
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    const query = 'DELETE FROM service_catalog WHERE id = ?';
    const [result]: any = await connection.execute(query, [serviceId]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service not found',
          message: `No service found with ID: ${serviceId}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error: any) {
    console.error(`❌ [DELETE /api/admin/services/${serviceId}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete service',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
