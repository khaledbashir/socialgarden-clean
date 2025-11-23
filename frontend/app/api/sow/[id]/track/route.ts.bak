/**
 * API Route: Track SOW activity
 * POST /api/sow/[id]/track
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, formatDateForMySQL } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sowId } = await params;
    const body = await req.json();
    
    const {
      eventType,
      metadata = {},
    } = body;

    // Validate event type
    const validEventTypes = [
      'sow_opened',
      'section_viewed',
      'pricing_viewed',
      'comment_added',
      'ai_message_sent',
      'accept_initiated',
      'sow_accepted',
      'sow_declined',
      'pdf_downloaded',
      'link_shared',
    ];

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Enrich metadata
    const enrichedMetadata = {
      ...metadata,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    // Log activity
    await query(
      `INSERT INTO sow_activities (sow_id, event_type, metadata) VALUES (?, ?, ?)`,
      [sowId, eventType, JSON.stringify(enrichedMetadata)]
    );

    // Update SOW status based on event
    if (eventType === 'sow_opened') {
      const sow = await queryOne(`SELECT status, first_viewed_at FROM sows WHERE id = ?`, [sowId]);
      
      if (sow) {
        const now = formatDateForMySQL(new Date());
        
        // Update status to 'viewed' if currently 'sent'
        if (sow.status === 'sent') {
          await query(
            `UPDATE sows SET status = 'viewed', first_viewed_at = ?, last_viewed_at = ? WHERE id = ?`,
            [now, now, sowId]
          );
        } else {
          // Just update last_viewed_at
          await query(
            `UPDATE sows SET last_viewed_at = ? WHERE id = ?`,
            [now, sowId]
          );
        }
      }
    }

    // Check for buying signals in AI messages
    if (eventType === 'ai_message_sent' && metadata.message) {
      const message = metadata.message.toLowerCase();
      const buyingSignals = [
        'how do we start',
        'let\'s proceed',
        'ready to move forward',
        'accept',
        'yes, let\'s do it',
        'sign up',
        'get started',
        'when can we begin',
      ];

      const hasBuyingSignal = buyingSignals.some(signal => message.includes(signal));

      if (hasBuyingSignal) {
        // TODO: Send notification to agency owner
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Activity tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    return NextResponse.json(
      { error: 'Failed to track activity', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
