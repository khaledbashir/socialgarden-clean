import { NextRequest, NextResponse } from 'next/server';
import { getPool, queryOne } from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Ensure table exists once per cold start
let ensured = false;
async function ensureTable() {
  if (ensured) return;
  const pool = getPool();
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sow_snapshots (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      sow_id VARCHAR(64) NOT NULL,
      content_json LONGTEXT NOT NULL,
      content_hash VARCHAR(64) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX (sow_id),
      INDEX (created_at)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);
  ensured = true;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTable();
    const { id } = await params;
    const url = new URL(_req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);

    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, sow_id, content_hash, created_at FROM sow_snapshots WHERE sow_id = ? ORDER BY created_at DESC LIMIT ?',[id, limit]
    );

    return NextResponse.json({ success: true, snapshots: rows });
  } catch (error) {
    console.error('❌ [snapshots.GET] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to list snapshots' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureTable();
    const { id } = await params;
    const pool = getPool();

    // Load SOW
    const sow = await queryOne<any>(
      'SELECT id, title, client_name, content, total_investment, workspace_slug, updated_at FROM sows WHERE id = ?',
      [id]
    );
    if (!sow) {
      return NextResponse.json({ success: false, message: 'SOW not found' }, { status: 404 });
    }

    const payload = {
      id: sow.id,
      title: sow.title,
      client_name: sow.client_name,
      content: typeof sow.content === 'string' ? sow.content : JSON.stringify(sow.content || {}),
      total_investment: sow.total_investment,
      workspace_slug: sow.workspace_slug,
      updated_at: sow.updated_at,
    };

    const bodyString = typeof payload.content === 'string' ? payload.content : JSON.stringify(payload.content);
    const contentHash = crypto.createHash('sha256').update(bodyString).digest('hex');

    // Optional: de-dup by last hash
    const [last] = await pool.execute(
      'SELECT content_hash FROM sow_snapshots WHERE sow_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    const lastHash = Array.isArray(last) && last.length > 0 ? (last as any)[0].content_hash : null;
    if (lastHash && lastHash === contentHash) {
      return NextResponse.json({ success: true, skipped: true, reason: 'No content change' });
    }

    await pool.execute(
      'INSERT INTO sow_snapshots (sow_id, content_json, content_hash) VALUES (?, ?, ?)',
      [id, JSON.stringify(payload), contentHash]
    );

    return NextResponse.json({ success: true, hash: contentHash });
  } catch (error) {
    console.error('❌ [snapshots.POST] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create snapshot' }, { status: 500 });
  }
}
