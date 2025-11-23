import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to fetch workspace details from AnythingLLM
// GET /api/anythingllm/workspace?slug={workspaceSlug}

function getEnv() {
  const baseUrl = process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || '';
  const apiKey = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || '';
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

export async function GET(req: NextRequest) {
  try {
    const { baseUrl, apiKey } = getEnv();
    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: 'AnythingLLM not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get('slug') || '').toString();
    if (!slug) {
      return NextResponse.json({ error: 'Missing required query param: slug' }, { status: 400 });
    }

    const upstream = await fetch(`${baseUrl}/api/v1/workspace/${encodeURIComponent(slug)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      // No cache to always reflect latest prompt/settings
      cache: 'no-store',
    });

    const contentType = upstream.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await upstream.json() : await upstream.text();
    if (!upstream.ok || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Failed to load workspace', details: body }, { status: upstream.status || 502 });
    }

    return NextResponse.json(body, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Workspace fetch error', details: err?.message || String(err) }, { status: 500 });
  }
}
