import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/';
    
    // Get authorization URL from backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/oauth/authorize`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Failed to get authorization URL' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Append returnUrl to state for use in callback
    const stateWithReturn = `${data.state}|${encodeURIComponent(returnUrl)}`;

    return NextResponse.json({
      auth_url: data.auth_url.replace(`state=${data.state}`, `state=${stateWithReturn}`),
      state: stateWithReturn,
    });
  } catch (error) {
    console.error('OAuth authorize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
