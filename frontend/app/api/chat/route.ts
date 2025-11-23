import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  
  const { messages, model } = await request.json();
  console.log('📨 Chat endpoint called', {
    model, 
    messageCount: messages?.length,
    hasApiKey: !!process.env.OPENROUTER_API_KEY 
  });

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error(' [API /api/chat] No API key configured');
    return NextResponse.json(
      { error: 'OpenRouter API key not configured' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://socialgarden.com.au',
        'X-Title': 'Social Garden SOW Generator',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenRouter API error:', response.status, errorData);
      return NextResponse.json(
        { 
          error: `API error: ${response.status} ${response.statusText}`,
          details: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI service. Please check your API key.' },
      { status: 500 }
    );
  }
}