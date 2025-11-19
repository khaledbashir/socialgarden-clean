import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy to upload documents to AnythingLLM
// POST /api/anythingllm/document/upload
// Accepts multipart/form-data with file, workspaceSlug, and optional metadata

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

    // Parse multipart/form-data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const workspaceSlug = formData.get('workspaceSlug') as string | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!workspaceSlug) {
      return NextResponse.json(
        { error: 'No workspace slug provided' },
        { status: 400 }
      );
    }

    // Create new FormData for forwarding to AnythingLLM
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('addToWorkspaces', workspaceSlug);

    // Parse and add metadata as individual form fields
    // For multipart/form-data, nested objects are typically sent as individual fields
    if (metadataStr) {
      try {
        const metadata = JSON.parse(metadataStr);
        // Send metadata fields individually (standard multipart/form-data approach)
        Object.entries(metadata).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            uploadFormData.append(`metadata[${key}]`, value);
          }
        });
      } catch (e) {
        console.warn('Failed to parse metadata, skipping:', e);
      }
    }

    // Forward to AnythingLLM
    const upstream = await fetch(`${baseUrl}/api/v1/document/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // Don't set Content-Type - let fetch set it with boundary for multipart/form-data
      },
      body: uploadFormData,
    });

    const contentType = upstream.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      console.error('AnythingLLM upload error:', {
        status: upstream.status,
        statusText: upstream.statusText,
        body,
      });
      return NextResponse.json(
        {
          error: 'Failed to upload document',
          details: body,
        },
        { status: upstream.status || 502 }
      );
    }

    return NextResponse.json(body, { status: 200 });
  } catch (err: any) {
    console.error('Document upload error:', err);
    return NextResponse.json(
      {
        error: 'Document upload error',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

