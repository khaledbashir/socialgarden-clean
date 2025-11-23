/**
 * API Route: SOW Analytics by Vertical
 * GET /api/analytics/by-vertical
 * Returns pipeline breakdown by client vertical (Property, Education, Finance, etc.)
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('📊 [Analytics/Vertical] Fetching vertical breakdown');

    const results = await query<{
      vertical: string;
      sow_count: number;
      total_value: number;
      avg_deal_size: number;
      win_rate: number;
    }>(
      `SELECT 
        COALESCE(vertical, 'other') as vertical,
        COUNT(*) as sow_count,
        SUM(total_investment) as total_value,
        AVG(total_investment) as avg_deal_size,
        ROUND(
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
          1
        ) as win_rate
      FROM sows
      GROUP BY vertical
      ORDER BY total_value DESC`
    );

    console.log(`✅ [Analytics/Vertical] Found ${results.length} verticals`);

    return NextResponse.json({
      success: true,
      verticals: results,
      total: results.reduce((sum, v) => sum + Number(v.total_value), 0),
    });
  } catch (error) {
    console.error('❌ [Analytics/Vertical] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vertical analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
