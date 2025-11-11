import { NextRequest, NextResponse } from 'next/server';

const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = process.env.ANYTHINGLLM_API_KEY || '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

export async function POST(request: NextRequest) {
  try {
    const { messages, workspaceSlug, workspace, threadSlug, mode = 'chat' } = await request.json();
    
    // ARCHITECTURAL SIMPLIFICATION: Default to master 'gen' workspace
    // Single workspace for all SOW generation
    const effectiveWorkspaceSlug = workspace || workspaceSlug || 'gen';
    
    console.log('🔍 [AnythingLLM API] Chat Debug:', {
      receivedWorkspace: workspace,
      receivedWorkspaceSlug: workspaceSlug,
      effectiveWorkspaceSlug,
      threadSlug,
      mode,
      isThreadChat: !!threadSlug,
      isUsingDefault: !workspace && !workspaceSlug
    });
    
    // If no workspace specified, use the default 'gen' workspace
    if (!effectiveWorkspaceSlug) {
      return NextResponse.json(
        { error: 'No workspace specified. Defaulting to master "gen" workspace.' },
        { status: 400 }
      );
    }
    
    // Get the system prompt (if provided)
    const systemMessage = messages.find((m: any) => m.role === 'system');
    const systemPrompt = systemMessage?.content || '';
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'No user message provided' },
        { status: 400 }
      );
    }

    // Send the user message directly WITHOUT combining with system prompt
    // AnythingLLM handles system prompt via workspace config
    // Preserving the raw message allows @agent mentions and other syntax to work
    const messageToSend = lastMessage.content;

    // Determine the endpoint based on whether this is thread-based chat
    let endpoint: string;
    if (threadSlug) {
      // Thread-based chat (saves to SOW's thread)
      endpoint = `${ANYTHINGLLM_URL}/api/v1/workspace/${effectiveWorkspaceSlug}/thread/${threadSlug}/chat`;
      console.log(`🧵 [AnythingLLM API] Sending to THREAD: ${effectiveWorkspaceSlug}/${threadSlug}`);
    } else {
      // Workspace-level chat (legacy behavior)
      endpoint = `${ANYTHINGLLM_URL}/api/v1/workspace/${effectiveWorkspaceSlug}/chat`;
      console.log(`💬 [AnythingLLM API] Sending to WORKSPACE: ${effectiveWorkspaceSlug}`);
    }

    console.log(`📨 [AnythingLLM API] User message:`, messageToSend.substring(0, 100));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANYTHINGLLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageToSend,
        mode, // 'chat' or 'query'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(' [AnythingLLM Chat] Error:', response.status, errorText);
      return NextResponse.json(
        { error: `AnythingLLM API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format response to match OpenAI structure
    return NextResponse.json({
      id: data.id || Date.now().toString(),
      object: 'chat.completion',
      created: Date.now(),
      model: 'anythingllm',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: data.textResponse || 'No response',
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: data.metrics?.prompt_tokens || 0,
        completion_tokens: data.metrics?.completion_tokens || 0,
        total_tokens: data.metrics?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error(' [AnythingLLM Chat] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
