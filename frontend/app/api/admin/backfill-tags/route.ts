/**
 * API Route: Backfill missing vertical and service_line tags for all SOWs
 * GET /api/admin/backfill-tags
 * 
 * This is a one-time migration endpoint to analyze all untagged SOWs
 * using AnythingLLM's Dashboard AI (sow-master-dashboard workspace)
 * and automatically assign vertical and service_line based on analysis.
 * 
 * Architecture: Uses established AnythingLLM infrastructure (Dashboard AI system)
 * which is purpose-built for cross-SOW analytics and classification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// Vertical options from schema
type Vertical = 'property' | 'education' | 'finance' | 'healthcare' | 'retail' | 'hospitality' | 'professional-services' | 'technology' | 'other';

// Service line options from schema
type ServiceLine = 'crm-implementation' | 'marketing-automation' | 'revops-strategy' | 'managed-services' | 'consulting' | 'training' | 'other';

interface AIAnalysisResult {
  vertical: Vertical;
  service_line: ServiceLine;
  confidence: number;
  reasoning: string;
}

/**
 * Use AnythingLLM Dashboard AI to analyze SOW and determine classification.
 * Follows established anythingllm.ts patterns via chatWithThread.
 */
async function analyzeSOWWithAnythingLLM(title: string, content: string): Promise<AIAnalysisResult> {
  try {
    // Get AnythingLLM configuration from environment
    const anythingLLMUrl = process.env.NEXT_PUBLIC_ANYTHINGLLM_URL || 'https://ahmad-anything-llm.840tjq.easypanel.host';
    const anythingLLMApiKey = process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY || 'process.env.NEXT_PUBLIC_ANYTHINGLLM_API_KEY';
    
    const workspaceSlug = 'sow-master-dashboard'; // Dashboard AI workspace
    
    // Extract first 2000 chars of content to avoid token limits
    const contentPreview = content.substring(0, 2000);

    const analysisPrompt = `Classify this Statement of Work into ONE vertical and ONE service line.

SOW Title: ${title}

SOW Content (excerpt): ${contentPreview}

Respond ONLY with valid JSON in this exact format:
{
  "vertical": "property" | "education" | "finance" | "healthcare" | "retail" | "hospitality" | "professional-services" | "technology" | "other",
  "service_line": "crm-implementation" | "marketing-automation" | "revops-strategy" | "managed-services" | "consulting" | "training" | "other",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation"
}

Rules:
- If unsure, use "other" as fallback
- Confidence should be 0.0-1.0 (1.0 = very confident)
- Only include the JSON, no other text`;

    // Create a temporary thread for this analysis (no persistent history needed)
    const threadResponse = await fetch(`${anythingLLMUrl}/api/v1/workspace/${workspaceSlug}/thread/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anythingLLMApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `backfill-analysis-${Date.now()}`,
      }),
    });

    if (!threadResponse.ok) {
      console.error(`Failed to create thread: ${threadResponse.status}`);
      return {
        vertical: 'other',
        service_line: 'other',
        confidence: 0,
        reasoning: 'AnythingLLM thread creation failed',
      };
    }

    const threadData = await threadResponse.json();
    const threadSlug = threadData.thread?.slug;

    if (!threadSlug) {
      console.error('No thread slug returned from AnythingLLM');
      return {
        vertical: 'other',
        service_line: 'other',
        confidence: 0,
        reasoning: 'AnythingLLM thread creation failed - no slug',
      };
    }

    // Send analysis request to AnythingLLM Dashboard AI
    const chatResponse = await fetch(
      `${anythingLLMUrl}/api/v1/workspace/${workspaceSlug}/thread/${threadSlug}/chat`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anythingLLMApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: analysisPrompt,
          mode: 'query', // Query mode for specific classification task
        }),
      }
    );

    if (!chatResponse.ok) {
      console.error(`Failed to get analysis from AnythingLLM: ${chatResponse.status}`);
      return {
        vertical: 'other',
        service_line: 'other',
        confidence: 0,
        reasoning: 'AnythingLLM chat failed',
      };
    }

    const chatData = await chatResponse.json();
    const aiResponse = chatData.response || '';

    // Parse JSON response from AnythingLLM
    try {
      const result = JSON.parse(aiResponse);
      // Validate the result
      if (
        result.vertical &&
        result.service_line &&
        typeof result.confidence === 'number'
      ) {
        console.log(`✅ Classification from AnythingLLM: ${result.vertical} / ${result.service_line} (confidence: ${result.confidence})`);
        return result as AIAnalysisResult;
      }
    } catch (parseError) {
      console.warn('Failed to parse AnythingLLM JSON response:', aiResponse);
    }

    // Fallback
    return {
      vertical: 'other',
      service_line: 'other',
      confidence: 0,
      reasoning: 'Could not parse AnythingLLM response',
    };
  } catch (error) {
    console.error('Error in analyzeSOWWithAnythingLLM:', error);
    return {
      vertical: 'other',
      service_line: 'other',
      confidence: 0,
      reasoning: 'AnythingLLM analysis error',
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('🔄 Starting SOW tag backfill...');

    // Fetch all SOWs where vertical is NULL
    const untaggedSOWs = await query(
      `SELECT id, title, content FROM sows WHERE vertical IS NULL ORDER BY created_at DESC`
    ) as Array<{ id: string; title: string; content: string }>;

    console.log(`📊 Found ${untaggedSOWs.length} untagged SOWs`);

    if (untaggedSOWs.length === 0) {
      return NextResponse.json({
        success: true,
        updated_sows: 0,
        message: 'All SOWs are already tagged!',
      });
    }

    const results: Array<{
      sow_id: string;
      title: string;
      vertical: Vertical;
      service_line: ServiceLine;
      confidence: number;
      success: boolean;
      error?: string;
    }> = [];

    // Process each untagged SOW
    for (const sow of untaggedSOWs) {
      try {
        console.log(`🤖 Analyzing SOW with AnythingLLM: ${sow.title}`);

        // Get AI analysis from AnythingLLM Dashboard
        const analysis = await analyzeSOWWithAnythingLLM(sow.title, sow.content);

        // Update database
        await query(
          `UPDATE sows SET vertical = ?, service_line = ? WHERE id = ?`,
          [analysis.vertical, analysis.service_line, sow.id]
        );

        results.push({
          sow_id: sow.id,
          title: sow.title,
          vertical: analysis.vertical,
          service_line: analysis.service_line,
          confidence: analysis.confidence,
          success: true,
        });

        console.log(
          `✅ Updated SOW "${sow.title}": ${analysis.vertical} / ${analysis.service_line}`
        );

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to process SOW ${sow.id}:`, error);
        results.push({
          sow_id: sow.id,
          title: sow.title,
          vertical: 'other',
          service_line: 'other',
          confidence: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate summary
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    const summary = {
      success: true,
      updated_sows: successCount,
      failed_sows: failureCount,
      total_processed: results.length,
      message: `Successfully backfilled tags for ${successCount} SOWs${
        failureCount > 0 ? ` (${failureCount} failures)` : ''
      }. Dashboard widgets will now display data from historical SOWs.`,
      details: results,
    };

    console.log('✅ Backfill complete:', summary);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ Error in backfill-tags:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Backfill failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
