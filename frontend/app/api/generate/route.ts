import { NextRequest } from 'next/server';
import { match } from "ts-pattern";
import { AnythingLLMService } from '@/lib/anythingllm';

export const runtime = "edge";

export async function POST(req: NextRequest): Promise<Response> {
  // Edge runtime needs explicit env var access
  const anythingLLMURL = process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || '';
  const anythingLLMKey = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '';
  
  console.log('[/api/generate] Configuration check:', {
    hasURL: !!anythingLLMURL,
    hasKey: !!anythingLLMKey,
    urlPreview: anythingLLMURL?.substring(0, 30) + '...',
  });
  
  if (!anythingLLMURL || !anythingLLMKey) {
    console.error('[/api/generate] Missing AnythingLLM configuration');
    return new Response(
      JSON.stringify({ 
        error: "AnythingLLM not configured on server",
        details: {
          hasURL: !!anythingLLMURL,
          hasKey: !!anythingLLMKey,
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { prompt, option, command, model } = await req.json();

  const userMessage = match(option)
    .with("continue", () => `Continue: ${prompt}`)
    .with("generate", () => command || prompt)
    .with("improve", () => `Improve: ${prompt}`)
    .with("shorter", () => `Shorter: ${prompt}`)
    .with("longer", () => `Longer: ${prompt}`)
    .with("fix", () => `Fix: ${prompt}`)
    .with("zap", () => `${command}\n\n${prompt}`)
    .otherwise(() => prompt);

  try {
    const endpoint = `${anythingLLMURL.replace(/\/$/, '')}/api/v1/workspace/utility-inline-editor/stream-chat`;
    
    console.log('[/api/generate] Sending to AnythingLLM:', {
      endpoint,
      option,
      messageLength: userMessage.length,
      model,
    });

    // Set the model provider for the utility workspace
    const anythingLLM = new AnythingLLMService(anythingLLMURL, anythingLLMKey);
    const success = await anythingLLM.setWorkspaceLLMProvider('utility-inline-editor', 'openrouter', model);
    if (!success) {
      console.warn('[/api/generate] Failed to set LLM provider, proceeding anyway');
    }
    
    const response = await fetch(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anythingLLMKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          mode: 'chat',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[/api/generate] AnythingLLM error:', {
        status: response.status,
        statusText: response.statusText,
        errorPreview: errorText.substring(0, 200),
      });
      
      return new Response(
        JSON.stringify({ 
          error: `AnythingLLM error: ${response.statusText}`,
          status: response.status,
          details: errorText.substring(0, 200),
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line) continue;
              // SSE-ish lines prefixed with `data: ` or raw JSON lines
              const candidate = line.startsWith('data: ') ? line.slice(6).trim() : line.trim();
              if (!candidate || candidate === '[DONE]') continue;

              try {
                const json = JSON.parse(candidate);

                // Common shapes handled by different LLM backends
                // 1) { type: 'textResponse', textResponse: '...' }
                if (typeof json?.textResponse === 'string') {
                  controller.enqueue(encoder.encode(json.textResponse));
                  continue;
                }

                // 2) OpenAI-like choices: { choices: [{ delta: { content: '...' } }, ...] }
                if (Array.isArray(json?.choices)) {
                  for (const ch of json.choices) {
                    const content = ch?.delta?.content || ch?.text || ch?.message?.content?.text || ch?.message?.content;
                    if (content) controller.enqueue(encoder.encode(String(content)));
                  }
                  continue;
                }

                // 3) Some GLM or custom outputs use `output_text` or `content`
                if (typeof json?.output_text === 'string') {
                  controller.enqueue(encoder.encode(json.output_text));
                  continue;
                }

                if (typeof json?.content === 'string') {
                  controller.enqueue(encoder.encode(json.content));
                  continue;
                }

                // 4) Fallback: if top-level is an array of strings
                if (Array.isArray(json) && json.every(i => typeof i === 'string')) {
                  for (const s of json) controller.enqueue(encoder.encode(s));
                  continue;
                }

                // 5) If the payload is an object with nested text fields, try to stringify useful parts
                const textFields = ['text', 'message', 'textResponse', 'output_text'];
                let found = false;
                for (const f of textFields) {
                  const v = json[f];
                  if (typeof v === 'string') {
                    controller.enqueue(encoder.encode(v));
                    found = true;
                    break;
                  }
                }
                if (found) continue;

                // If we get here, nothing matched: surface a debug log for later inspection
                console.warn('[/api/generate] Unrecognized stream JSON shape:', { preview: candidate.substring(0, 200) });
              } catch (err) {
                // Not JSON - treat as raw text
                if (candidate) controller.enqueue(encoder.encode(candidate + '\n'));
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error('[/api/generate] Exception:', error);
    return new Response(
      JSON.stringify({ 
        error: 'AnythingLLM request failed',
        details: error?.message || String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
