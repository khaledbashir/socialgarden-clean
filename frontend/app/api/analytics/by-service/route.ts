/**
 * API Route: SOW Analytics by Service Line
 * GET /api/analytics/by-service
 * Returns pipeline breakdown by service line (CRM Implementation, Marketing Automation, etc.)
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log('📊 [Analytics/Service] Fetching service line breakdown');

    const results = await query<{
      service_line: string;
      sow_count: number;
      total_value: number;
      avg_deal_size: number;
      win_rate: number;
    }>(
      `SELECT 
        COALESCE(service_line, 'other') as service_line,
        COUNT(*) as sow_count,
        SUM(total_investment) as total_value,
        AVG(total_investment) as avg_deal_size,
        ROUND(
          SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
          1
        ) as win_rate
      FROM sows
      GROUP BY service_line
      ORDER BY total_value DESC`
    );

    console.log(`✅ [Analytics/Service] Found ${results.length} service lines`);

    return NextResponse.json({
      success: true,
      services: results,
      total: results.reduce((sum, s) => sum + Number(s.total_value), 0),
    });
  } catch (error) {
    console.error('❌ [Analytics/Service] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service line analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
