/**
 * API Route: Manage a Specific Conversation
 * GET /api/dashboard/conversations/[id] - Fetch message history
 * PATCH /api/dashboard/conversations/[id] - Update conversation (rename)
 * DELETE /api/dashboard/conversations/[id] - Delete conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    console.log(`🔍 [DASHBOARD MESSAGES] GET request for conversation: ${conversationId}`);

    // Verify conversation exists
    const conversation = await query(
      `SELECT id FROM dashboard_conversations WHERE id = ?`,
      [conversationId]
    );

    if (!conversation || conversation.length === 0) {
      console.log(`❌ [DASHBOARD MESSAGES] Conversation not found: ${conversationId}`);
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch all messages for this conversation, ordered by creation time
    const messages = await query(
      `SELECT id, conversation_id, role, content, created_at 
       FROM dashboard_messages 
       WHERE conversation_id = ? 
       ORDER BY created_at ASC`,
      [conversationId]
    );

    console.log(`✅ [DASHBOARD MESSAGES] Found ${messages.length} messages for conversation`);

    return NextResponse.json({
      success: true,
      conversation_id: conversationId,
      message_count: messages.length,
      messages: messages as Message[]
    });

  } catch (error) {
    console.error('❌ [DASHBOARD MESSAGES] Error fetching messages:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      console.log('❌ [DASHBOARD MESSAGES] Invalid title provided');
      return NextResponse.json(
        { success: false, error: 'Title is required and must be non-empty' },
        { status: 400 }
      );
    }

    console.log(`✏️ [DASHBOARD MESSAGES] PATCH request - Renaming conversation: ${conversationId}`);

    // Verify conversation exists
    const conversation = await query(
      `SELECT id FROM dashboard_conversations WHERE id = ?`,
      [conversationId]
    );

    if (!conversation || conversation.length === 0) {
      console.log(`❌ [DASHBOARD MESSAGES] Conversation not found: ${conversationId}`);
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update conversation title
    await query(
      `UPDATE dashboard_conversations SET title = ?, updated_at = NOW() WHERE id = ?`,
      [title, conversationId]
    );

    console.log(`✅ [DASHBOARD MESSAGES] Conversation renamed successfully`);

    return NextResponse.json({
      success: true,
      message: 'Conversation renamed successfully'
    });

  } catch (error) {
    console.error('❌ [DASHBOARD MESSAGES] Error updating conversation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    console.log(`🗑️ [DASHBOARD MESSAGES] DELETE request - Deleting conversation: ${conversationId}`);

    // Verify conversation exists
    const conversation = await query(
      `SELECT id FROM dashboard_conversations WHERE id = ?`,
      [conversationId]
    );

    if (!conversation || conversation.length === 0) {
      console.log(`❌ [DASHBOARD MESSAGES] Conversation not found: ${conversationId}`);
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Delete all messages for this conversation first (foreign key cascade)
    await query(
      `DELETE FROM dashboard_messages WHERE conversation_id = ?`,
      [conversationId]
    );

    // Delete the conversation
    await query(
      `DELETE FROM dashboard_conversations WHERE id = ?`,
      [conversationId]
    );

    console.log(`✅ [DASHBOARD MESSAGES] Conversation and messages deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('❌ [DASHBOARD MESSAGES] Error deleting conversation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
