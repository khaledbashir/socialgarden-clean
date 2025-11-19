import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to upload raw text documents to AnythingLLM
// POST /api/anythingllm/document/raw-text
// Accepts JSON with textContent, workspaceSlug, and metadata (title is required)

function getEnv() {
  const baseUrl = process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
  const apiKey = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, apiKey } = getEnv();
    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'AnythingLLM not configured' },
        { status: 500 }
      );
    }

    // Parse JSON body
    const body = await req.json();
    const { textContent, workspaceSlug, metadata } = body;

    if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text content provided' },
        { status: 400 }
      );
    }

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: 'No workspace slug provided' },
        { status: 400 }
      );
    }

    // Validate metadata - title is required
    if (!metadata || !metadata.title || typeof metadata.title !== 'string' || metadata.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Metadata with title is required' },
        { status: 400 }
      );
    }

    // Prepare request body for AnythingLLM
    const requestBody = {
      textContent,
      addToWorkspaces: workspaceSlug,
      metadata,
    };

    // Forward to AnythingLLM
    const upstream = await fetch(`${baseUrl}/api/v1/document/raw-text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const responseBody = contentType.includes('application/json')
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      console.error('AnythingLLM raw-text error:', {
        status: upstream.status,
        statusText: upstream.statusText,
        body: responseBody,
      });
      return NextResponse.json(
        {
          error: 'Failed to upload raw text document',
          details: responseBody,
        },
        { status: upstream.status || 502 }
      );
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err: any) {
    console.error('Document raw-text error:', err);
    return NextResponse.json(
      {
        error: 'Document raw-text error',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

