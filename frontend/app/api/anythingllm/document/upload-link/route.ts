import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to upload documents via URL to AnythingLLM
// POST /api/anythingllm/document/upload-link
// Accepts JSON with link, workspaceSlug, optional scraperHeaders, and optional metadata

function getEnv() {
  const baseUrl = (process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || '').replace(/\/$/, '');
  const apiKey = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '';
  return { baseUrl, apiKey };
}

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, apiKey } = getEnv();
    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'AnythingLLM not configured. Set ANYTHINGLLM_URL and ANYTHINGLLM_API_KEY in environment.' },
        { status: 500 }
      );
    }

    // Parse JSON body
    const body = await req.json();
    const { link, workspaceSlug, scraperHeaders, metadata } = body;

    if (!link) {
      return NextResponse.json(
        { error: 'No link provided' },
        { status: 400 }
      );
    }

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: 'No workspace slug provided' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(link);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Prepare request body for AnythingLLM
    const requestBody: any = {
      link,
      addToWorkspaces: workspaceSlug,
    };

    // Add optional scraperHeaders if provided
    if (scraperHeaders && typeof scraperHeaders === 'object') {
      requestBody.scraperHeaders = scraperHeaders;
    }

    // Add optional metadata if provided
    if (metadata && typeof metadata === 'object') {
      requestBody.metadata = metadata;
    }

    // Forward to AnythingLLM
    const upstream = await fetch(`${baseUrl}/api/v1/document/upload-link`, {
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
      console.error('AnythingLLM upload-link error:', {
        status: upstream.status,
        statusText: upstream.statusText,
        body: responseBody,
      });
      return NextResponse.json(
        {
          error: 'Failed to upload document from URL',
          details: responseBody,
        },
        { status: upstream.status || 502 }
      );
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (err: any) {
    console.error('Document upload-link error:', err);
    return NextResponse.json(
      {
        error: 'Document upload-link error',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

