import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const sowId = params.id;
    const body = await request.json();
    const { clientName, totalInvestment, selectedServices, addOns } = body;

    // Update SOW status to accepted
    await query(
      `UPDATE sows 
       SET status = 'accepted', 
           accepted_at = NOW(),
           total_investment = ?
       WHERE id = ?`,
      [totalInvestment, sowId]
    );

    // Log acceptance in activities table
    await query(
      `INSERT INTO sow_activities (sow_id, activity_type, description, created_at)
       VALUES (?, 'accepted', ?, NOW())`,
      [sowId, `Proposal accepted by ${clientName} for $${totalInvestment.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`]
    );

    // TODO: Send email notifications
    // TODO: Create onboarding task in project management system
    // TODO: Notify sales team via Slack/webhook

    return NextResponse.json({
      success: true,
      message: 'Proposal accepted successfully!',
      data: {
        sowId,
        acceptedAt: new Date().toISOString(),
        totalInvestment,
      },
    });
  } catch (error) {
    console.error('Error accepting SOW:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to accept proposal' },
      { status: 500 }
    );
  }
}
