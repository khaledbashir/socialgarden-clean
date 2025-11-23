import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Danger zone: wipe all SOW analytics/state so the dashboard reads zero
// Protection: require X-Admin-Key header to match process.env.ADMIN_API_KEY
// Query params: ?filter=test to only delete test clients
export async function POST(req: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY;
  const provided = req.headers.get('x-admin-key') || '';

  if (!adminKey) {
    return NextResponse.json(
      { error: 'ADMIN_API_KEY not set on server' },
      { status: 403 }
    );
  }
  if (provided !== adminKey) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter'); // 'test' or null
    
    // Delete in safe order (children first)
    const results: Record<string, number> = {};

    const tables = [
      'sow_activities',
      'sow_comments',
      'sow_acceptances',
      'sow_rejections',
      'ai_conversations',
      'sow_snapshots',
      'sows',
    ];

    for (const table of tables) {
      try {
        const r: any = await query<any>(`SELECT COUNT(*) as count FROM ${table}`);
        results[`${table}_before`] = Number(r?.[0]?.count || 0);
      } catch {}
    }

    if (filter === 'test') {
      // Filtered delete: only test clients
      console.log('🧪 Deleting test SOWs only (client_name LIKE "%Test%")');
      
      // Get test SOW IDs first
      const testSOWs: any = await query<any>(`SELECT id FROM sows WHERE client_name LIKE '%Test%'`);
      const testIds = testSOWs.map((s: any) => s.id);
      
      if (testIds.length === 0) {
        return NextResponse.json({ success: true, message: 'No test SOWs found', ...results });
      }
      
      const placeholders = testIds.map(() => '?').join(',');
      
      await query(`DELETE FROM sow_activities WHERE sow_id IN (${placeholders})`, testIds);
      await query(`DELETE FROM sow_comments WHERE sow_id IN (${placeholders})`, testIds);
      await query(`DELETE FROM sow_acceptances WHERE sow_id IN (${placeholders})`, testIds);
      await query(`DELETE FROM sow_rejections WHERE sow_id IN (${placeholders})`, testIds);
      await query(`DELETE FROM ai_conversations WHERE sow_id IN (${placeholders})`, testIds);
      await query(`DELETE FROM sow_snapshots WHERE sow_id IN (${placeholders})`, testIds);
      await query(`DELETE FROM sows WHERE client_name LIKE '%Test%'`);
      
      results['test_sows_deleted'] = testIds.length;
    } else {
      // Full delete: all SOWs
      console.log('💥 Deleting ALL SOWs and related data');
      
      await query('DELETE FROM sow_activities');
      await query('DELETE FROM sow_comments');
      await query('DELETE FROM sow_acceptances');
      await query('DELETE FROM sow_rejections');
      await query('DELETE FROM ai_conversations');
      await query('DELETE FROM sow_snapshots');
      await query('DELETE FROM sows');
    }

    for (const table of tables) {
      try {
        const r: any = await query<any>(`SELECT COUNT(*) as count FROM ${table}`);
        results[`${table}_after`] = Number(r?.[0]?.count || 0);
      } catch {}
    }

    return NextResponse.json({ 
      success: true, 
      filter: filter || 'all',
      ...results 
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
