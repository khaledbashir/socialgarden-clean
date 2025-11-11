import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, formatDateForMySQL } from '@/lib/db';
import { anythingLLM } from '@/lib/anythingllm';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const sowId = params.id;
    const body = await request.json();
    const { clientEmail, expiryDays = 30 } = body;

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

    const clientName = sow.client_name || 'Client';
    const workspace = await anythingLLM.getMasterSOWWorkspace(clientName);
    
    const htmlContent = typeof sow.content === 'string' && sow.content.startsWith('<') 
      ? sow.content 
      : `<h1>${sow.title}</h1><p>${sow.description || 'No description'}</p>`;

    const title = sow.title || 'Statement of Work';
    const metadata = {
      sowId: sowId,
      clientName: sow.client_name,
      totalInvestment: sow.total_investment,
      dateCreated: new Date().toISOString(),
    };

    await anythingLLM.embedSOWDocument(
      workspace.slug,
      title,
      htmlContent,
      metadata
    );

    const embedId = await anythingLLM.getOrCreateEmbedId(workspace.slug);

    await query(
      `UPDATE sows 
       SET workspace_slug = ?, 
           embed_id = ?,
           status = 'sent',
           sent_at = ?
       WHERE id = ?`,
      [workspace.slug, embedId, formatDateForMySQL(new Date()), sowId]
    );

    const portalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/portal/sow/${sowId}`;

    return NextResponse.json({
      success: true,
      portalUrl,
      embedId,
      workspaceSlug: workspace.slug,
      message: 'SOW sent to client successfully'
    });

  } catch (error: any) {
    console.error('Error sending SOW:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SOW' },
      { status: 500 }
    );
  }
}
