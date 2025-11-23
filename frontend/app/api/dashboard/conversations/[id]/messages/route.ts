/**
 * API Route: Send Message to Dashboard Chat
 * POST /api/dashboard/conversations/[id]/messages
 * 
 * This endpoint:
 * 1. Accepts a conversation ID and user message
 * 2. Saves the user message to database
 * 3. Sends the message to sow-master-dashboard AnythingLLM workspace
 * 4. Saves the AI response to database
 * 5. Returns the AI response to the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const ANYTHINGLLM_URL = process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'http://localhost:3001';
const ANYTHINGLLM_API_KEY = process.env.ANYTHINGLLM_API_KEY || '';
const DASHBOARD_WORKSPACE = 'sow-master-dashboard';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      console.log('❌ [SEND MESSAGE] Invalid message provided');
      return NextResponse.json(
        { success: false, error: 'Message is required and must be non-empty' },
        { status: 400 }
      );
    }

    console.log(`💬 [SEND MESSAGE] Processing message for conversation: ${conversationId}`);
    console.log(`📝 [SEND MESSAGE] Message preview: ${message.substring(0, 100)}`);

    // 1. Verify conversation exists
    const conversation = await query(
      `SELECT id FROM dashboard_conversations WHERE id = ?`,
      [conversationId]
    );

    if (!conversation || conversation.length === 0) {
      console.log(`❌ [SEND MESSAGE] Conversation not found: ${conversationId}`);
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 2. Save user message to database
    const userMessageId = uuidv4();
    console.log(`💾 [SEND MESSAGE] Saving user message: ${userMessageId}`);

    await query(
      `INSERT INTO dashboard_messages (id, conversation_id, role, content, created_at) 
       VALUES (?, ?, 'user', ?, NOW())`,
      [userMessageId, conversationId, message]
    );

    console.log(`✅ [SEND MESSAGE] User message saved`);

    // 3. Fetch conversation history for context
    const messageHistory = await query(
      `SELECT role, content FROM dashboard_messages 
       WHERE conversation_id = ? 
       ORDER BY created_at ASC`,
      [conversationId]
    );

    // 4. Prepare messages for AnythingLLM
    const anythingllmMessages = messageHistory.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    console.log(`📤 [SEND MESSAGE] Sending to AnythingLLM with ${anythingllmMessages.length} messages in context`);

    // 5. Send to AnythingLLM
    const anythingllmResponse = await fetch(
      `${ANYTHINGLLM_URL}/api/v1/workspace/${DASHBOARD_WORKSPACE}/stream-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`
        },
        body: JSON.stringify({
          messages: anythingllmMessages
        })
      }
    );

    if (!anythingllmResponse.ok) {
      console.error(`❌ [SEND MESSAGE] AnythingLLM error: ${anythingllmResponse.status}`);
      const errorText = await anythingllmResponse.text();
      console.error(`📋 [SEND MESSAGE] Error details: ${errorText}`);
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to get response from AI',
          details: `AnythingLLM returned ${anythingllmResponse.status}`
        },
        { status: 500 }
      );
    }

    // 6. Read AI response
    let aiContent = '';

    // Check if streaming
    const contentType = anythingllmResponse.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      console.log('🔄 [SEND MESSAGE] Streaming response detected');
      
      // Read the entire stream
      const reader = anythingllmResponse.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let done = false;
        
        while (!done) {
          const { done: streamDone, value } = await reader.read();
          done = streamDone;
          
          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data && data !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices?.[0]?.delta?.content) {
                      aiContent += parsed.choices[0].delta.content;
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for streaming data
                  }
                }
              }
            }
          }
        }
      }
    } else {
      console.log('📦 [SEND MESSAGE] JSON response detected');
      const data = await anythingllmResponse.json();
      aiContent = data.textResponse || data.choices?.[0]?.message?.content || 'No response';
    }

    console.log(`💭 [SEND MESSAGE] AI response: ${aiContent.substring(0, 100)}`);

    // 7. Save AI response to database
    const assistantMessageId = uuidv4();
    console.log(`💾 [SEND MESSAGE] Saving assistant message: ${assistantMessageId}`);

    await query(
      `INSERT INTO dashboard_messages (id, conversation_id, role, content, created_at) 
       VALUES (?, ?, 'assistant', ?, NOW())`,
      [assistantMessageId, conversationId, aiContent]
    );

    console.log(`✅ [SEND MESSAGE] Assistant message saved`);

    // 8. Update conversation's updated_at timestamp
    await query(
      `UPDATE dashboard_conversations SET updated_at = NOW() WHERE id = ?`,
      [conversationId]
    );

    // 9. Return both messages to client
    return NextResponse.json({
      success: true,
      user_message: {
        id: userMessageId,
        conversation_id: conversationId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      },
      assistant_message: {
        id: assistantMessageId,
        conversation_id: conversationId,
        role: 'assistant',
        content: aiContent,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [SEND MESSAGE] Critical error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
