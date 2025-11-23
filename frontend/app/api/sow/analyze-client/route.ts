import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || '168.231.115.219',
  user: process.env.DB_USER || 'sg_sow_user',
  password: process.env.DB_PASSWORD || 'SG_sow_2025_SecurePass!',
  database: process.env.DB_NAME || 'socialgarden_sow',
  port: parseInt(process.env.DB_PORT || '3306'),
};

const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
const ANYTHINGLLM_API_KEY = process.env.ANYTHINGLLM_API_KEY || 'process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY';

/**
 * POST /api/sow/analyze-client
 * Uses AnythingLLM @agent search to scrape client website and extract insights
 * Body: { sowId, clientWebsite, clientName }
 */
export async function POST(request: NextRequest) {
  let connection;
  
  try {
    const body = await request.json();
    const { sowId, clientWebsite, clientName } = body;

    if (!sowId || !clientWebsite) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'sowId and clientWebsite are required',
        },
        { status: 400 }
      );
    }

    console.log(`🔍 [AI Scraping] Starting analysis for: ${clientWebsite}`);

    // Step 1: Use AnythingLLM @agent search to scrape website
    const analysisPrompt = `
I need you to analyze this website: ${clientWebsite}

Please use @agent search to visit the website and extract the following information:

1. **Industry/Niche**: What industry does this business operate in?
2. **Marketing Channels**: What marketing channels are they currently using? (social media, blog, email, ads, etc.)
3. **Content Gaps**: What content types are missing or underutilized? (video, case studies, blog posts, etc.)
4. **Target Audience**: Who is their target audience?
5. **Current Services**: What products/services do they offer?
6. **Website Quality**: Rate their website quality (modern/outdated, mobile-friendly, fast/slow)
7. **Social Media Presence**: Which social platforms are they active on? How engaged is their audience?
8. **SEO Analysis**: Is their website optimized for search engines?

Return your findings in JSON format like this:
{
  "industry": "real estate",
  "marketing_channels": ["facebook", "instagram", "website"],
  "content_gaps": ["video tours", "case studies", "email newsletter"],
  "target_audience": "first-time home buyers, investors",
  "current_services": ["property listings", "buyer consultations"],
  "website_quality": "modern but slow, mobile-friendly",
  "social_presence": "active on Facebook (500 followers), Instagram (200 followers), low engagement",
  "seo_status": "poor - missing meta descriptions, no blog"
}
`;

    // Call AnythingLLM with @agent search capability
    const anythingllmResponse = await fetch(
      `${ANYTHINGLLM_URL}/api/v1/workspace/pop/stream-chat`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ANYTHINGLLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: analysisPrompt,
          mode: 'query', // Use query mode for agent search
        }),
      }
    );

    if (!anythingllmResponse.ok) {
      throw new Error(`AnythingLLM API error: ${anythingllmResponse.status}`);
    }

    console.log('✅ [AI Scraping] AnythingLLM responded, parsing stream...');

    // Parse SSE stream
    const reader = anythingllmResponse.body?.getReader();
    const decoder = new TextDecoder();
    let aiResponse = '';

    if (reader) {
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.textResponse) {
                  aiResponse += parsed.textResponse;
                }
              } catch (e) {
                // Not JSON, skip
              }
            }
          }
        }
      }
    }

    console.log('📊 [AI Scraping] AI Response received:', aiResponse.substring(0, 200));

    // Step 2: Parse AI response to extract JSON
    let clientInsights;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        clientInsights = JSON.parse(jsonStr);
      } else {
        // If no JSON found, create structured insights from text
        clientInsights = {
          industry: 'unknown',
          marketing_channels: [],
          content_gaps: [],
          target_audience: 'unknown',
          current_services: [],
          website_quality: 'unknown',
          social_presence: 'unknown',
          seo_status: 'unknown',
          raw_analysis: aiResponse,
        };
      }
    } catch (parseError) {
      console.error('⚠️ [AI Scraping] Failed to parse JSON, using raw response');
      clientInsights = {
        raw_analysis: aiResponse,
        parsing_failed: true,
      };
    }

    // Step 3: Load service catalog from database
    connection = await mysql.createConnection(dbConfig);
    const [services]: any = await connection.execute(
      'SELECT * FROM service_catalog WHERE is_active = TRUE'
    );

    console.log(`📦 [AI Scraping] Loaded ${services.length} active services from catalog`);

    // Step 4: Use AI to match insights to services
    const matchingPrompt = `
Based on this client analysis:
${JSON.stringify(clientInsights, null, 2)}

And these available services:
${services.map((s: any) => `- ${s.name}: ${s.description} ($${s.base_price}/${s.pricing_unit})`).join('\n')}

Recommend 3-5 services that would be most valuable for this client.
For each recommendation, provide:
1. Service name (must match exactly from the list above)
2. Relevance score (0.0 to 1.0)
3. Reasoning (why this service matters for THIS specific client based on their gaps/needs)

Return in JSON format:
{
  "recommendations": [
    {
      "service_name": "Video Production & Editing",
      "relevance_score": 0.95,
      "reasoning": "Your website has 0 video content, but video gets 3x higher engagement in real estate. Video tours would showcase properties better and increase lead quality."
    }
  ]
}
`;

    const matchingResponse = await fetch(
      `${ANYTHINGLLM_URL}/api/v1/workspace/pop/stream-chat`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ANYTHINGLLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: matchingPrompt,
          mode: 'chat',
        }),
      }
    );

    if (!matchingResponse.ok) {
      throw new Error(`AnythingLLM matching API error: ${matchingResponse.status}`);
    }

    // Parse matching stream
    const matchReader = matchingResponse.body?.getReader();
    let matchingAiResponse = '';

    if (matchReader) {
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await matchReader.read();
        done = streamDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.textResponse) {
                  matchingAiResponse += parsed.textResponse;
                }
              } catch (e) {
                // Not JSON, skip
              }
            }
          }
        }
      }
    }

    console.log('🎯 [AI Matching] Matching response received');

    // Parse recommendations
    let recommendations: any[] = [];
    try {
      const jsonMatch = matchingAiResponse.match(/```json\n([\s\S]*?)\n```/) ||
                       matchingAiResponse.match(/\{[\s\S]*"recommendations"[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        recommendations = parsed.recommendations || [];
      }
    } catch (parseError) {
      console.error('⚠️ [AI Matching] Failed to parse recommendations');
    }

    // Step 5: Save recommendations to database
    for (const rec of recommendations) {
      // Find matching service in catalog
      const service = services.find(
        (s: any) => s.name.toLowerCase() === rec.service_name.toLowerCase()
      );

      if (!service) {
        console.log(`⚠️ Service not found in catalog: ${rec.service_name}`);
        continue;
      }

      const insertQuery = `
        INSERT INTO sow_recommendations 
        (sow_id, service_id, recommended_price, ai_reasoning, relevance_score, client_insights, is_selected)
        VALUES (?, ?, ?, ?, ?, ?, FALSE)
      `;

      await connection.execute(insertQuery, [
        sowId,
        service.id,
        service.base_price,
        rec.reasoning,
        rec.relevance_score,
        JSON.stringify(clientInsights),
      ]);

      console.log(`✅ Saved recommendation: ${service.name} (${rec.relevance_score})`);
    }

    return NextResponse.json({
      success: true,
      message: 'Client analysis complete',
      insights: clientInsights,
      recommendations: recommendations.length,
    });
  } catch (error: any) {
    console.error('❌ [POST /api/sow/analyze-client] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze client website',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
