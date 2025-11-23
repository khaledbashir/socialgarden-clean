import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [API] /api/dashboard/stats - Fetching dashboard stats');
    
    // Get basic stats
    const sowCount = await query<any>('SELECT COUNT(*) as count FROM sows');
    console.log('✅ [API] SOW count result:', sowCount);
    
    const totalValue = await query<any>('SELECT SUM(total_investment) as total FROM sows WHERE total_investment IS NOT NULL');
    console.log('✅ [API] Total value result:', totalValue);
    
    // Get recent activity (last 5 SOWs)
    const recentActivity = await query<any>(`
      SELECT 
        id,
        client_name as clientName,
        title as sowTitle,
        total_investment as value,
        created_at as date
      FROM sows
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    // Get top clients by total investment
    const topClients = await query<any>(`
      SELECT 
        client_name as name,
        SUM(total_investment) as totalValue,
        COUNT(*) as sowCount
      FROM sows
      WHERE client_name IS NOT NULL
      GROUP BY client_name
      ORDER BY totalValue DESC
      LIMIT 5
    `);
    
    // Get active SOWs (status = 'draft' or 'sent')
    const activeSOWsResult = await query<any>(`
      SELECT COUNT(*) as count 
      FROM sows 
      WHERE status IN ('draft', 'sent')
    `);
    
    // Get this month's SOWs
    const thisMonthResult = await query<any>(`
      SELECT COUNT(*) as count 
      FROM sows 
      WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
    `);
    
    const result = {
      totalSOWs: sowCount[0]?.count || 0,
      totalValue: totalValue[0]?.total || 0,
      masterDashboard: 'sow-master-dashboard',
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        clientName: activity.clientName || 'Unknown Client',
        sowTitle: activity.sowTitle || 'Untitled SOW',
        value: parseFloat(activity.value) || 0,
        date: activity.date,
      })),
      topClients: topClients.map((client: any) => ({
        name: client.name || 'Unknown Client',
        totalValue: parseFloat(client.totalValue) || 0,
        sowCount: client.sowCount || 0,
      })),
      popularServices: [], // TODO: Add services analysis from SOW content
      activeSOWs: activeSOWsResult[0]?.count || 0,
      thisMonthSOWs: thisMonthResult[0]?.count || 0,
    };
    
    console.log('✅ [API] Dashboard stats response:', result);
    
    // Add cache-control headers to prevent caching
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error: any) {
    console.error('❌ [API] Dashboard stats error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      stack: error.stack
    });
    
    // Return empty dashboard with error status instead of 500
    return NextResponse.json({
      error: 'Failed to fetch dashboard stats',
      message: error.message,
      totalSOWs: 0,
      totalValue: 0,
      recentActivity: [],
      topClients: [],
      popularServices: [],
      activeSOWs: 0,
      thisMonthSOWs: 0,
      isEmpty: true,
      status: 'error'
    }, { status: 200 }); // Return 200 so dashboard can still load with empty state
  }
}
