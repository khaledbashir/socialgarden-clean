/**
 * API Route: Get SOW by ID
 * GET /api/sow/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { calculateTotalInvestment, enforceHeadOfRole } from '@/lib/sow-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sowId } = await params;
    console.log(`🔍 [GET /api/sow/${sowId}] Request received`);

    // Fetch SOW
    console.log(`📄 [GET /api/sow/${sowId}] Fetching SOW from database`);
    const sow = await queryOne(
      `SELECT * FROM sows WHERE id = ?`,
      [sowId]
    );

    if (!sow) {
      console.log(`❌ [GET /api/sow/${sowId}] SOW not found`);
      return NextResponse.json(
        { error: 'SOW not found' },
        { status: 404 }
      );
    }

    // Fetch engagement metrics
    console.log(`📊 [GET /api/sow/${sowId}] Fetching engagement metrics`);
    const metrics = await queryOne<{
      view_count: number;
      comment_count: number;
      ai_message_count: number;
      buying_signals: number;
    }>(
      `SELECT 
        COALESCE((SELECT COUNT(*) FROM sow_activities WHERE sow_id = ? AND event_type = 'sow_opened'), 0) as view_count,
        COALESCE((SELECT COUNT(*) FROM sow_comments WHERE sow_id = ?), 0) as comment_count,
        COALESCE((SELECT COUNT(*) FROM ai_conversations WHERE sow_id = ?), 0) as ai_message_count,
        COALESCE((SELECT COUNT(*) FROM ai_conversations WHERE sow_id = ? AND buying_signal_detected = TRUE), 0) as buying_signals
      `,
      [sowId, sowId, sowId, sowId]
    );

    // Fetch latest comments (limit 5)
    console.log(`💬 [GET /api/sow/${sowId}] Fetching recent comments`);
    const recentComments = await query(
      `SELECT * FROM sow_comments 
       WHERE sow_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [sowId]
    );

    // Fetch acceptance record if exists
    console.log(`✅ [GET /api/sow/${sowId}] Fetching acceptance record`);
    const acceptance = await queryOne(
      `SELECT * FROM sow_acceptances WHERE sow_id = ?`,
      [sowId]
    );

    // Fetch rejection record if exists
    console.log(`❌ [GET /api/sow/${sowId}] Fetching rejection record`);
    const rejection = await queryOne(
      `SELECT * FROM sow_rejections WHERE sow_id = ? ORDER BY rejected_at DESC LIMIT 1`,
      [sowId]
    );

    console.log(`✅ [GET /api/sow/${sowId}] Successfully fetched all SOW data`);
    return NextResponse.json({
      sow,
      metrics,
      recentComments,
      acceptance,
      rejection,
    });
  } catch (error) {
    const sowId = 'unknown';
    console.error(`❌ [GET /api/sow/${sowId}] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ [GET /api/sow/${sowId}] Details:`, errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch SOW', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Update SOW
 * PUT /api/sow/[id]
 * 
 * ⚡ PROACTIVE FINANCIAL DATA INTEGRITY:
 * On every SOW update, this endpoint automatically parses the content,
 * calculates the total_investment from pricing tables, and saves it to the database.
 * This eliminates the need for manual financial migrations going forward.
 */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sowId } = await params;
    console.log(`🔍 [PUT /api/sow/${sowId}] Request received`);
    
    const body = await req.json();
    console.log(`📦 [PUT /api/sow/${sowId}] Body keys:`, Object.keys(body));
    console.log(`📦 [PUT /api/sow/${sowId}] Has content:`, !!body.content);

    let {
      title,
      clientName,
      clientEmail,
      content,
      totalInvestment,
      workspaceSlug,
      threadSlug,
      embedId,
      vertical,
      serviceLine,
    } = body;
    
    // 🚨 CRITICAL ENFORCEMENT: Ensure Head Of role exists in pricing table
    console.log(`🚨 [PUT /api/sow/${sowId}] About to enforce Head Of role, content exists: ${!!content}`);
    if (content) {
      console.log(`🚨 [PUT /api/sow/${sowId}] CALLING enforceHeadOfRole NOW`);
      const enforcedContent = enforceHeadOfRole(content);
      const serializedContent = typeof enforcedContent === 'string'
        ? enforcedContent
        : JSON.stringify(enforcedContent);

      try {
        const parsed = typeof enforcedContent === 'string'
          ? JSON.parse(enforcedContent)
          : enforcedContent;
        const pricingNode = Array.isArray(parsed?.content)
          ? parsed.content.find((node: any) => node?.type === 'editablePricingTable')
          : null;
        const rows = pricingNode?.attrs?.rows || [];
        const hasHeadOf = rows.some((row: any) =>
          String(row?.role || '').toLowerCase().includes('head of')
        );
        const firstRow = rows[0] || null;
        console.log(`✅ [PUT /api/sow/${sowId}] Head Of enforcement report:`, {
          tableFound: !!pricingNode,
          rowCount: rows.length,
          headOfPresent: hasHeadOf,
          firstRow,
        });
      } catch (logError) {
        console.warn(`⚠️ [PUT /api/sow/${sowId}] Failed to log enforcement details:`, logError);
      }

      console.log(`✅ [PUT /api/sow/${sowId}] Head Of role enforcement applied`, {
        originalType: typeof content,
        enforcedType: typeof enforcedContent,
        serializedLength: serializedContent.length,
      });

      content = serializedContent;
    } else {
      console.warn(`⚠️ [PUT /api/sow/${sowId}] NO CONTENT - skipping enforcement`);
    }

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
    
    // ⚡ PROACTIVE FINANCIAL CALCULATION
    // When content is provided, automatically calculate total_investment
    // This ensures financial data is always synchronized with pricing tables
    if (content !== undefined) {
      const calculatedInvestment = calculateTotalInvestment(content);
      console.log(`💰 [SOW ${sowId}] Auto-calculated total_investment: ${calculatedInvestment}`);
      updates.push('total_investment = ?');
      values.push(calculatedInvestment);
    } else if (totalInvestment !== undefined) {
      // Only use the provided totalInvestment if content is not being updated
      updates.push('total_investment = ?');
      values.push(totalInvestment);
    }
    
    if (workspaceSlug !== undefined) {
      updates.push('workspace_slug = ?');
      values.push(workspaceSlug);
    }
    if (threadSlug !== undefined) {
      updates.push('thread_slug = ?');
      values.push(threadSlug);
    }
    if (embedId !== undefined) {
      updates.push('embed_id = ?');
      values.push(embedId);
    }
    if (vertical !== undefined) {
      updates.push('vertical = ?');
      values.push(vertical);
    }
    if (serviceLine !== undefined) {
      updates.push('service_line = ?');
      values.push(serviceLine);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(sowId);

    try {
      await query(
        `UPDATE sows SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    } catch (updateError: any) {
      // Fallback: if columns don't exist yet, remove vertical/service_line from update
      if (updateError?.message?.includes('Unknown column')) {
        console.warn(' [SOW UPDATE] Phase 1A columns not ready, removing from update');
        const fallbackUpdates = updates.filter(u => !u.includes('vertical') && !u.includes('service_line'));
        const fallbackValues = values.slice(0, -1).filter((_, i) => 
          !updates[i]?.includes('vertical') && !updates[i]?.includes('service_line')
        );
        fallbackValues.push(sowId);
        
        if (fallbackUpdates.length > 0) {
          await query(
            `UPDATE sows SET ${fallbackUpdates.join(', ')} WHERE id = ?`,
            fallbackValues
          );
        }
      } else {
        throw updateError;
      }
    }

    // � EMBED SOW IN ANYTHINGLLM (best-effort, non-blocking)
    if (content && workspaceSlug) {
      try {
        console.log(`📚 [SOW ${sowId}] Embedding SOW in workspace: ${workspaceSlug}`);
        
        // Import AnythingLLM service and HTML converter
        const { AnythingLLMService } = await import('@/lib/anythingllm');
        const { sowContentToHTML } = await import('@/lib/export-utils');
        const anythingLLM = new AnythingLLMService();
        
        // Convert JSON content to HTML for embedding
        const contentObj = typeof content === 'string' ? JSON.parse(content) : content;
        const htmlContent = sowContentToHTML(contentObj);
        
        // Embed in individual workspace
        const embedded = await anythingLLM.embedSOWDocument(
          workspaceSlug,
          title || `SOW ${sowId}`,
          htmlContent,
          {
            docId: sowId,
            createdAt: new Date().toISOString(),
            clientName,
            vertical,
            serviceLine,
          }
        );
        
        if (embedded) {
          console.log(`✅ [SOW ${sowId}] Successfully embedded in workspace: ${workspaceSlug}`);
          
          // Also embed in master dashboard for analytics
          try {
            await anythingLLM.embedSOWDocument(
              'sow-master-dashboard-63003769',
              `[${workspaceSlug}] ${title || `SOW ${sowId}`}`,
              htmlContent,
              {
                docId: sowId,
                workspace: workspaceSlug,
                createdAt: new Date().toISOString(),
                clientName,
                vertical,
                serviceLine,
              }
            );
            console.log(`✅ [SOW ${sowId}] Also embedded in master dashboard for analytics`);
          } catch (dashboardError) {
            console.warn(`⚠️ [SOW ${sowId}] Failed to embed in master dashboard:`, dashboardError);
          }
        } else {
          console.warn(`⚠️ [SOW ${sowId}] Failed to embed SOW in workspace`);
        }
      } catch (embedError) {
        console.error(`❌ [SOW ${sowId}] Error embedding SOW:`, embedError);
        // Non-blocking - don't fail the update if embedding fails
      }
    }

    // �🔒 Invisible background snapshot (best-effort)
    try {
      const host = req.headers.get('host') || 'localhost:3333';
      const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      const origin = `${proto}://${host}`;
      await fetch(`${origin}/api/sow/${sowId}/snapshots`, { method: 'POST' }).catch(() => {});
    } catch {
      // non-blocking
    }

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
