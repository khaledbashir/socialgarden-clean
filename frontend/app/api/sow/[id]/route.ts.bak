/**
 * API Route: Get SOW by ID
 * GET /api/sow/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sowId } = await params;

    // Fetch SOW
    const sow = await queryOne(
      `SELECT * FROM sows WHERE id = ?`,
      [sowId]
    );

    if (!sow) {
      return NextResponse.json(
        { error: 'SOW not found' },
        { status: 404 }
      );
    }

    // Fetch engagement metrics
    const metrics = await queryOne<{
      view_count: number;
      comment_count: number;
      ai_message_count: number;
      buying_signals: number;
    }>(
      `SELECT 
        (SELECT COUNT(*) FROM sow_activities WHERE sow_id = ? AND event_type = 'sow_opened') as view_count,
        (SELECT COUNT(*) FROM sow_comments WHERE sow_id = ?) as comment_count,
        (SELECT COUNT(*) FROM ai_conversations WHERE sow_id = ?) as ai_message_count,
        (SELECT COUNT(*) FROM ai_conversations WHERE sow_id = ? AND buying_signal_detected = TRUE) as buying_signals
      `,
      [sowId, sowId, sowId, sowId]
    );

    // Fetch latest comments (limit 5)
    const recentComments = await query(
      `SELECT * FROM sow_comments 
       WHERE sow_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [sowId]
    );

    // Fetch acceptance record if exists
    const acceptance = await queryOne(
      `SELECT * FROM sow_acceptances WHERE sow_id = ?`,
      [sowId]
    );

    // Fetch rejection record if exists
    const rejection = await queryOne(
      `SELECT * FROM sow_rejections WHERE sow_id = ? ORDER BY rejected_at DESC LIMIT 1`,
      [sowId]
    );

    return NextResponse.json({
      sow,
      metrics,
      recentComments,
      acceptance,
      rejection,
    });
  } catch (error) {
    console.error('Error fetching SOW:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SOW', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Update SOW
 * PUT /api/sow/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sowId } = await params;
    const body = await req.json();

    const {
      title,
      clientName,
      clientEmail,
      content,
      totalInvestment,
      workspaceSlug,
      embedId,
    } = body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (clientName !== undefined) {
      updates.push('client_name = ?');
      values.push(clientName);
    }
    if (clientEmail !== undefined) {
      updates.push('client_email = ?');
      values.push(clientEmail);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (totalInvestment !== undefined) {
      updates.push('total_investment = ?');
      values.push(totalInvestment);
    }
    if (workspaceSlug !== undefined) {
      updates.push('workspace_slug = ?');
      values.push(workspaceSlug);
    }
    if (embedId !== undefined) {
      updates.push('embed_id = ?');
      values.push(embedId);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(sowId);

    await query(
      `UPDATE sows SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'SOW updated successfully',
    });
  } catch (error) {
    console.error('Error updating SOW:', error);
    return NextResponse.json(
      { error: 'Failed to update SOW', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Delete SOW
 * DELETE /api/sow/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sowId } = await params;

    await query(
      `DELETE FROM sows WHERE id = ?`,
      [sowId]
    );

    return NextResponse.json({
      success: true,
      message: 'SOW deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting SOW:', error);
    return NextResponse.json(
      { error: 'Failed to delete SOW', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
