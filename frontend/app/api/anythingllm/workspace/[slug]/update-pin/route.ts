import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to pin/unpin documents in AnythingLLM workspace
// POST /api/anythingllm/workspace/[slug]/update-pin
// Accepts JSON body with docPath and pinStatus

function getEnv() {
  const baseUrl = process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
  const apiKey = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { baseUrl, apiKey } = getEnv();
    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'AnythingLLM not configured' },
        { status: 500 }
      );
    }

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { error: 'Workspace slug is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { docPath, pinStatus } = body;

    if (!docPath) {
      return NextResponse.json(
        { error: 'docPath is required' },
        { status: 400 }
      );
    }

    if (typeof pinStatus !== 'boolean') {
      return NextResponse.json(
        { error: 'pinStatus must be a boolean' },
        { status: 400 }
      );
    }

    // Forward to AnythingLLM
    const upstream = await fetch(`${baseUrl}/api/v1/workspace/${slug}/update-pin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        docPath,
        pinStatus,
      }),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const responseBody = contentType.includes('application/json')
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      console.error('AnythingLLM pin update error:', {
        status: upstream.status,
        statusText: upstream.statusText,
        body: responseBody,
      });
      return NextResponse.json(
        {
          error: 'Failed to update pin status',
          details: responseBody,
        },
        { status: upstream.status || 502 }
      );
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err: any) {
    console.error('Pin update error:', err);
    return NextResponse.json(
      {
        error: 'Pin update error',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

