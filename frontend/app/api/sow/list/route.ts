/**
 * API Route: List all SOWs
 * GET /api/sow/list
 * GET /api/sow/list?folderId=folder-123 (optional filter)
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Optional folder filter
    const folderId = req.nextUrl.searchParams.get('folderId');

    let sql = `
      SELECT 
        id,
        title,
        content,
        client_name,
        client_email,
        total_investment,
        status,
        folder_id,
        workspace_slug,
        created_at,
        updated_at,
        sent_at,
        first_viewed_at,
        last_viewed_at,
        expires_at,
        vertical,
        service_line
      FROM sows
    `;

    const params: any[] = [];

    if (folderId) {
      sql += ` WHERE folder_id = ?`;
      params.push(folderId);
    }

    sql += ` ORDER BY created_at DESC`;

    const sows = await query(sql, params);

    return NextResponse.json({ sows: sows || [] });
  } catch (error) {
    console.error('Error fetching SOWs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SOWs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
