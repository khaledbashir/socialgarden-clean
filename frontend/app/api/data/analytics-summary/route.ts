/**
 * API Route: Analytics Summary
 * GET /api/data/analytics-summary
 * 
 * Provides live, real-time analytics data from the MySQL database
 * for the Analytics Assistant AI to consume.
 * 
 * This endpoint is the AI's "source of truth" - it MUST return
 * the exact same data that the Dashboard UI displays.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface SOW {
  id: string;
  title: string;
  client_name: string;
  total_investment: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface ClientSummary {
  client_name: string;
  sow_count: number;
  total_value: number;
  avg_value: number;
  latest_sow_date: string;
}

export async function GET(req: NextRequest) {
  try {
    console.log('📊 [Analytics Summary] Fetching live data from MySQL...');

    // Get all SOWs with their investment values
    const sows = await query<SOW>(`
      SELECT 
        id,
        title,
        client_name,
        total_investment,
        status,
        created_at,
        updated_at
      FROM sows
      ORDER BY created_at DESC
    `);

    if (!sows || !Array.isArray(sows)) {
      console.error('❌ [Analytics Summary] No SOWs returned from database');
      return NextResponse.json({
        error: 'Failed to fetch SOWs from database',
      }, { status: 500 });
    }

    // Calculate overall metrics
    const totalSOWs = sows.length;
    const totalInvestment = sows.reduce((sum, sow) => sum + (sow.total_investment || 0), 0);
    const avgInvestment = totalSOWs > 0 ? totalInvestment / totalSOWs : 0;

    // Group by client and calculate client-level metrics
    const clientMap = new Map<string, ClientSummary>();
    
    for (const sow of sows) {
      const clientName = sow.client_name || 'Unknown Client';
      
      if (!clientMap.has(clientName)) {
        clientMap.set(clientName, {
          client_name: clientName,
          sow_count: 0,
          total_value: 0,
          avg_value: 0,
          latest_sow_date: sow.updated_at.toISOString(),
        });
      }

      const client = clientMap.get(clientName)!;
      client.sow_count += 1;
      client.total_value += sow.total_investment || 0;
      
      // Update latest date if this SOW is newer
      if (new Date(sow.updated_at) > new Date(client.latest_sow_date)) {
        client.latest_sow_date = sow.updated_at.toISOString();
      }
    }

    // Calculate average values and convert to array
    const clients = Array.from(clientMap.values()).map(client => ({
      ...client,
      avg_value: client.sow_count > 0 ? client.total_value / client.sow_count : 0,
    }));

    // Sort clients by total value (descending) and get top 5
    const topClients = clients
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5);

    // Status breakdown
    const statusCounts = sows.reduce((acc, sow) => {
      acc[sow.status] = (acc[sow.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Prepare the summary response
    const summary = {
      timestamp: new Date().toISOString(),
      overview: {
        total_sows: totalSOWs,
        total_investment: totalInvestment,
        average_investment: avgInvestment,
        unique_clients: clients.length,
      },
      status_breakdown: statusCounts,
      top_clients: topClients,
      all_clients: clients.sort((a, b) => b.total_value - a.total_value),
    };

    console.log('✅ [Analytics Summary] Data fetched successfully:', {
      totalSOWs,
      totalInvestment: `$${totalInvestment.toLocaleString()}`,
      uniqueClients: clients.length,
      topClient: topClients[0]?.client_name || 'N/A',
    });

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('❌ [Analytics Summary] Exception:', error);
    return NextResponse.json({
      error: 'Failed to generate analytics summary',
      details: error?.message || String(error),
    }, { status: 500 });
  }
}
