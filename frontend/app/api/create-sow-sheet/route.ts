import { NextRequest, NextResponse } from 'next/server';

const PDF_SERVICE_URL = process.env.NEXT_PUBLIC_PDF_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientName,
      serviceName,
      overview,
      deliverables,
      outcomes,
      phases,
      pricing,
      assumptions,
      timeline,
      accessToken,
    } = body;

    // Validate required fields
    if (!clientName || !serviceName) {
      return NextResponse.json(
        { error: 'Client name and service name are required' },
        { status: 400 }
      );
    }

    // Use OAuth endpoint if accessToken provided, otherwise use service account
    const endpoint = accessToken ? '/create-sheet-oauth' : '/create-sheet';

    // Call backend sheet creation service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const payload: any = {
        client_name: clientName,
        service_name: serviceName,
        overview: overview || '',
        deliverables: deliverables || '',
        outcomes: outcomes || '',
        phases: phases || '',
        pricing: pricing || [],
        assumptions: assumptions || '',
        timeline: timeline || '',
      };

      // Add OAuth token if provided
      if (accessToken) {
        payload.access_token = accessToken;
      }

      const response = await fetch(`${PDF_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', errorData);
        return NextResponse.json(
          { error: errorData.detail || 'Failed to create sheet' },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result, { status: 200 });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Sheet creation timed out. Please try again.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error creating sheet:', error);
    return NextResponse.json(
      { error: 'Failed to create sheet' },
      { status: 500 }
    );
  }
}
