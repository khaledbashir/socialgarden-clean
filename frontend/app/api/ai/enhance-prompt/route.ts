import { NextRequest, NextResponse } from 'next/server';

/**
 * Prompt Enhancement Proxy
 * Routes enhancement requests to the utility-prompt-enhancer workspace in AnythingLLM
 */
export async function POST(req: NextRequest) {
  try {
    const anythingLLMURL = process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL;
    const anythingLLMKey = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;
    
    if (!anythingLLMURL || !anythingLLMKey) {
      console.error('[enhance-prompt] Missing AnythingLLM configuration');
      return NextResponse.json(
        { error: 'AnythingLLM not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { prompt, mode = 'enhance' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'No prompt provided. Must provide prompt as a string.' },
        { status: 400 }
      );
    }

    console.log('[enhance-prompt] Enhancing prompt:', {
      promptLength: prompt.length,
      mode,
    });

    // Route to the SOW Generation Factory workspace via stream-chat (main SOW generation workspace)
    // Using the most recent SOW Generation Factory workspace without numeric suffix
    const endpoint = `${anythingLLMURL.replace(/\/$/, '')}/api/v1/workspace/utility-prompt-enhancer/stream-chat`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anythingLLMKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: prompt,
        mode: 'chat',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[enhance-prompt] AnythingLLM error:', {
        status: response.status,
        error: errorText.substring(0, 200),
      });
      
      return NextResponse.json(
        { 
          error: `AnythingLLM API error: ${response.statusText}`,
          details: errorText.substring(0, 200),
        },
        { status: response.status }
      );
    }

    // CRITICAL FIX: Frontend expects JSON with enhancedPrompt field, not SSE stream
    // We need to consume the entire SSE stream and return the accumulated text
    let enhancedPrompt = '';
    
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ 
        error: 'No response body from AnythingLLM' 
      }, { status: 500 });
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            
            try {
              const json = JSON.parse(data);
              if (json.textResponse) {
                enhancedPrompt += json.textResponse;
              }
            } catch (e) {
              // Not JSON, ignore
            }
          }
        }
      }
    } catch (error) {
      console.error('[enhance-prompt] Stream reading error:', error);
      return NextResponse.json({ 
        error: 'Failed to read enhancement stream' 
      }, { status: 500 });
    }

    // 🧹 CRITICAL SANITIZATION: Remove <think> tags, questions, and conversational fluff
    let sanitized = enhancedPrompt.trim();

    // 1. Strip all thinking/reasoning tags and their content
    sanitized = sanitized.replace(/<think>[\s\S]*?<\/think>/gi, '');
    sanitized = sanitized.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    sanitized = sanitized.replace(/<AI_THINK>[\s\S]*?<\/AI_THINK>/gi, '');
    
    // 2. Remove any remaining orphaned tags
    sanitized = sanitized.replace(/<\/?think>/gi, '');
    sanitized = sanitized.replace(/<\/?thinking>/gi, '');
    sanitized = sanitized.replace(/<\/?AI_THINK>/gi, '');

    // 3. Remove conversational prefixes and meta-commentary
    const conversationalPatterns = [
      /^(here'?s|here is) (the|an?) (enhanced|improved|rewritten|refined|optimized) (prompt|version)[\s:]+/i,
      /^(i'?ve|i have) (enhanced|improved|rewritten|refined) (your prompt|it)[\s:]+/i,
      /^(i'?ll|i will) (help you|create|provide)[\s\S]*$/i,
      /^(please (provide|add|include|specify)|could you (provide|add|include|specify))[\s\S]*$/i,
      /^(let me know if|feel free to|don't hesitate)[\s\S]*$/i,
      /^(to provide|in order to|to answer)[\s\S]*$/i,
      /^what (industry|business|specific|features)[\s\S]*\?$/im,
    ];

    for (const pattern of conversationalPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    // 4. Remove question blocks at the end (common AI behavior)
    sanitized = sanitized.replace(/\n\n[\s\S]*\?\s*$/m, '');
    sanitized = sanitized.replace(/\*\*Data Source Questions:\*\*[\s\S]*$/i, '');
    sanitized = sanitized.replace(/\*\*Information Needed:\*\*[\s\S]*$/i, '');
    sanitized = sanitized.replace(/\*\*.*Questions.*:\*\*[\s\S]*$/i, '');

    // 5. Clean up extra whitespace
    sanitized = sanitized.trim();

    console.log('[enhance-prompt] Enhanced successfully:', {
      originalLength: prompt.length,
      enhancedLength: enhancedPrompt.length,
      sanitizedLength: sanitized.length,
    });

    // Return JSON in the format the frontend expects
    return NextResponse.json({ 
      enhancedPrompt: sanitized 
    });

  } catch (error: any) {
    console.error('[enhance-prompt] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Enhancement request failed',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'prompt-enhancer',
    workspace: 'utility-prompt-enhancer'
  });
}
