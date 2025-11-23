/**
 * API Route: Get Conversation History
 * GET /api/dashboard/conversations
 * 
 * Returns all conversations for the current user,
 * ordered by most recently updated first
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DASHBOARD CONVERSATIONS] GET request');

    // TODO: Get user_id from session/auth
    // For now, using a placeholder that should be replaced with actual auth
    const user_id = request.headers.get('x-user-id') || 'default-user';

    console.log(`📋 [DASHBOARD CONVERSATIONS] Fetching conversations for user: ${user_id}`);

    // Fetch all conversations for this user, ordered by most recently updated
    const conversations = await query(
      `SELECT 
        id,
        user_id,
        title,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM dashboard_messages WHERE conversation_id = dashboard_conversations.id) as message_count
      FROM dashboard_conversations 
      WHERE user_id = ? 
      ORDER BY updated_at DESC`,
      [user_id]
    );

    console.log(`✅ [DASHBOARD CONVERSATIONS] Found ${conversations.length} conversations`);

    return NextResponse.json({
      success: true,
      count: conversations.length,
      conversations: conversations as Conversation[]
    });

  } catch (error) {
    console.error('❌ [DASHBOARD CONVERSATIONS] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('✏️ [DASHBOARD CONVERSATIONS] POST request - Creating new conversation');

    // TODO: Get user_id from session/auth
    const user_id = request.headers.get('x-user-id') || 'default-user';

    const body = await request.json();
    const { title } = body;

    const conversationId = uuidv4();
    const defaultTitle = title || 'New Conversation';

    console.log(`📝 [DASHBOARD CONVERSATIONS] Creating conversation: ${conversationId} with title: "${defaultTitle}"`);

    // Create new conversation
    await query(
      `INSERT INTO dashboard_conversations (id, user_id, title, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`,
      [conversationId, user_id, defaultTitle]
    );

    console.log(`✅ [DASHBOARD CONVERSATIONS] Conversation created successfully`);

    // Fetch and return the newly created conversation
    const newConversation = await query(
      `SELECT id, user_id, title, created_at, updated_at FROM dashboard_conversations WHERE id = ?`,
      [conversationId]
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Conversation created successfully',
        conversation: newConversation[0] || {
          id: conversationId,
          user_id,
          title: defaultTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ [DASHBOARD CONVERSATIONS] Error creating conversation:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create conversation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
