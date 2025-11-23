import { NextResponse } from 'next/server';
import { testConnection, getPool } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ok = await testConnection();
    const pool: any = getPool();
    const config = (pool as any)?.config?.connectionConfig || {};

    return NextResponse.json({
      ok,
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user ? '***SET***' : '***UNKNOWN***',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
