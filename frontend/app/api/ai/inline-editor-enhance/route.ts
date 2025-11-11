import { NextRequest, NextResponse } from 'next/server';

/**
 * Inline Editor Enhancement Proxy
 * Routes text improvement requests to the utility-inline-editor workspace in AnythingLLM
 * 
 * IMPORTANT: This is SEPARATE from the prompt enhancer (✨ Enhance button):
 * - ✨ Enhance button (workspace creation) → utility-prompt-enhancer workspace
 * - Inline editor (selection + slash /ai) → utility-inline-editor workspace
 * 
 * Each has different prompts optimized for their use case.
 */
export async function POST(req: NextRequest) {
  try {
    const anythingLLMURL = process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL;
    const anythingLLMKey = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;
    const configuredWorkspace = process.env.INLINE_EDITOR_WORKSPACE || process.env.NEXT_PUBLIC_INLINE_EDITOR_WORKSPACE;
    
    if (!anythingLLMURL || !anythingLLMKey) {
      console.error('[inline-editor-enhance] Missing AnythingLLM configuration');
      return NextResponse.json(
        { error: 'AnythingLLM not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'No text provided. Must provide text as a string.' },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Selected text is empty.' },
        { status: 400 }
      );
    }

    console.log('[inline-editor-enhance] Improving text:', {
      textLength: text.length,
      preview: text.substring(0, 100),
    });

    // Resolve candidate workspaces in order of preference
    // 1) Body override (workspaceSlug), 2) ENV, 3) known slugs, 4) fallback to editor workspace
    const { workspaceSlug: bodyWorkspaceSlug } = body as { workspaceSlug?: string };
    const candidates = Array.from(
      new Set(
        [
          bodyWorkspaceSlug,
          configuredWorkspace,
          'inline-editor',            // PRIMARY: dedicated inline editor workspace
          'utility-inline-editor',    // FALLBACK: alternative inline editor workspace
          'pop',                      // FALLBACK: editor assistant workspace (general-purpose)
        ].filter(Boolean) as string[]
      )
    );

    let response: Response | null = null;
    let lastNon404Error: { status: number; statusText: string; body?: string } | null = null;

    for (const slug of candidates) {
      const endpoint = `${anythingLLMURL.replace(/\/$/, '')}/api/v1/workspace/${slug}/stream-chat`;
      console.log('[inline-editor-enhance] Trying workspace:', slug, '→', endpoint);
      const attempt = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anythingLLMKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          mode: 'chat',
        }),
      });

      if (attempt.ok) {
        response = attempt;
        break;
      }

      const errBody = await attempt.text().catch(() => '');
      console.warn('[inline-editor-enhance] Workspace failed:', {
        slug,
        status: attempt.status,
        statusText: attempt.statusText,
        bodyPreview: errBody.substring(0, 200),
      });

      if (attempt.status !== 404 && !lastNon404Error) {
        lastNon404Error = {
          status: attempt.status,
          statusText: attempt.statusText,
          body: errBody.substring(0, 200),
        };
      }
      // If 404, try next candidate
    }

    if (!response) {
      if (lastNon404Error) {
        return NextResponse.json(
          {
            error: `AnythingLLM API error: ${lastNon404Error.statusText}`,
            details: lastNon404Error.body || '',
          },
          { status: lastNon404Error.status }
        );
      }
      // All attempts returned 404
      return NextResponse.json(
        {
          error: 'Inline editor enhancement workspace not found in AnythingLLM',
          details:
            'Tried workspaces: ' + candidates.join(', ') +
            '. Create one of these or set INLINE_ENHANCER_WORKSPACE in environment.',
        },
        { status: 404 }
      );
    }

    // Consume the SSE stream and accumulate the improved text
    let improvedText = '';
    
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
                improvedText += json.textResponse;
              }
            } catch (e) {
              // Skip JSON parse errors in stream
              console.log('[inline-editor-enhance] Skipping line:', line.substring(0, 50));
            }
          }
        }
      }

      // Final flush of any remaining buffer
      if (buffer && buffer.trim() && buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim();
        if (data !== '[DONE]') {
          try {
            const json = JSON.parse(data);
            if (json.textResponse) {
              improvedText += json.textResponse;
            }
          } catch (e) {
            // Final buffer parse error
          }
        }
      }

      improvedText = improvedText.trim();

      if (!improvedText) {
        console.warn('[inline-editor-enhance] Enhancement returned empty text');
        return NextResponse.json(
          { error: 'Enhancement returned empty text. Try again.' },
          { status: 400 }
        );
      }

      console.log('[inline-editor-enhance] Text improved successfully:', {
        originalLength: text.length,
        improvedLength: improvedText.length,
        preview: improvedText.substring(0, 100),
      });

      return NextResponse.json({
        success: true,
        improvedText,
        enhancedText: improvedText, // Alias for compatibility
        original: text,
        originalLength: text.length,
        improvedLength: improvedText.length,
      });

    } catch (e: any) {
      console.error('[inline-editor-enhance] Stream reading error:', e);
      return NextResponse.json(
        { error: 'Failed to read enhancement stream', details: e.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[inline-editor-enhance] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
