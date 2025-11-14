import { NextRequest, NextResponse } from 'next/server';

// Small helper: fetch with timeout and limited retries (idempotent GET)
async function fetchWithTimeoutRetry(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
  retries = 2,
  backoffMs = 400
) {
  const { timeoutMs = 5000, ...opts } = options;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      // Retry on typical transient upstream failures
      if ([502, 503, 504, 429].includes(res.status) && attempt < retries) {
        clearTimeout(t);
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
      clearTimeout(t);
      return res;
    } catch (err: any) {
      clearTimeout(t);
      // Retry on network/abort errors
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspace = searchParams.get('workspace');

  if (!workspace) {
    return NextResponse.json({ error: 'workspace query param is required' }, { status: 400 });
  }

  // Prefer secure server-side env vars; avoid relying on NEXT_PUBLIC values here
  const baseUrlRaw = process.env.ANYTHINGLLM_URL || process.env.NEXT_PUBLIC_ANYTHINGLLM_URL;
  const apiKeyRaw = process.env.ANYTHINGLLM_API_KEY || process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY;
  
  // Handle cases where env vars are set to 'undefined' string
  const baseUrl = (baseUrlRaw && baseUrlRaw !== 'undefined') ? baseUrlRaw : 'https://ahmad-anything-llm.840tjq.easypanel.host';
  const apiKey = (apiKeyRaw && apiKeyRaw !== 'undefined') ? apiKeyRaw : '0G0WTZ3-6ZX4D20-H35VBRG-9059WPA';

  console.log('[/api/anythingllm/threads] Configuration check:', {
    hasBaseUrl: !!baseUrl,
    baseUrl: baseUrl?.substring(0, 30) + '...',
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
    workspace,
  });

  if (!baseUrl || !apiKey) {
    console.error('[/api/anythingllm/threads] Missing configuration');
    return NextResponse.json({ 
      error: 'AnythingLLM configuration missing on server',
      details: {
        hasBaseUrl: !!baseUrl,
        hasApiKey: !!apiKey,
      }
    }, { status: 500 });
  }

  try {
    // CRITICAL FIX: AnythingLLM doesn't have a /threads endpoint
    // Threads are returned as part of the workspace object
    const url = `${baseUrl.replace(/\/$/, '')}/api/v1/workspace/${encodeURIComponent(workspace)}`;
    console.log('[/api/anythingllm/threads] Fetching workspace to get threads:', url);
    
    const response = await fetchWithTimeoutRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      // Ensure no caching and full SSR execution
      cache: 'no-store',
      next: { revalidate: 0 },
      timeoutMs: 7000,
    }, 2, 500);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('[/api/anythingllm/threads] Upstream error:', {
        status: response.status,
        workspace,
        url,
        bodyPreview: text?.slice(0, 200)
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch workspace from AnythingLLM', 
          upstreamStatus: response.status, 
          workspace,
          upstreamUrl: url,
          bodyPreview: text?.slice(0, 500) || ''
        }, 
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Attempt to parse as text then JSON parse as a last resort
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json({ 
          error: 'Invalid content-type from AnythingLLM workspace endpoint',
          receivedContentType: contentType,
          workspace,
          upstreamUrl: url,
          bodyPreview: text?.slice(0, 500) || ''
        }, { status: 502 });
      }
    }

    const data = await response.json();
    
    // CRITICAL FIX: AnythingLLM returns workspace as an array: { workspace: [{ ...data }] }
    // Extract threads from the workspace object
    const workspaceData = Array.isArray(data?.workspace) ? data.workspace[0] : (data?.workspace || {});
    const threads = workspaceData?.threads || [];
    
    console.log('[/api/anythingllm/threads] Success:', { 
      workspace, 
      threadsCount: threads.length,
      workspaceFound: !!workspaceData.id,
      workspaceId: workspaceData.id,
      workspaceName: workspaceData.name,
    });
    
    // Return in the format our frontend expects
    return NextResponse.json({ threads });
  } catch (err: any) {
    console.error('[/api/anythingllm/threads] Exception:', err?.message || err);
    return NextResponse.json({ 
      error: 'Request to AnythingLLM failed', 
      details: err?.message || String(err),
      workspace
    }, { status: 502 });
  }
}

