import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const DEFAULT_AGENTS = [
  {
    id: 'architect',
    name: 'The Architect',
    systemPrompt: `You are The Architect, a professional SOW (Statement of Work) generator. You help create comprehensive, well-structured Statements of Work for various business needs.

When generating a SOW, ensure it includes:
- Clear project objectives and scope
- Detailed deliverables
- Timeline and milestones
- Pricing and payment terms
- Acceptance criteria
- Assumptions and constraints

Always ask for clarification if the client's requirements are unclear, and provide professional, business-appropriate responses.`,
    model: 'gpt-4'
  },
  {
    id: 'gen-the-architect',
    name: 'GEN - The Architect',
    systemPrompt: `You are GEN - The Architect, an advanced AI assistant specialized in generating comprehensive Statements of Work (SOWs) for digital projects.

Your expertise includes:
- CRM implementations
- Marketing automation
- Revenue operations strategy
- Managed services
- Consulting projects
- Training programs

When creating SOWs, ensure they are:
- Detailed and specific
- Professionally formatted
- Comprehensive in scope
- Clear on deliverables and timelines
- Transparent on pricing

Always structure your responses in a way that can be easily converted to a formal SOW document.`,
    model: 'gpt-4'
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Initializing default agents...');
    
    for (const agent of DEFAULT_AGENTS) {
      // Check if agent already exists
      const existing = await query(
        'SELECT id FROM agents WHERE id = ? LIMIT 1',
        [agent.id]
      );
      
      if (!existing || existing.length === 0) {
        // Insert new agent
        await query(
          'INSERT INTO agents (id, name, systemPrompt, model) VALUES (?, ?, ?, ?)',
          [agent.id, agent.name, agent.systemPrompt, agent.model]
        );
        console.log(`✅ Created agent: ${agent.name} (${agent.id})`);
      } else {
        console.log(`ℹ️ Agent already exists: ${agent.name} (${agent.id})`);
      }
    }
    
    // Return all agents after initialization
    const allAgents = await query('SELECT * FROM agents ORDER BY name ASC');
    
    return NextResponse.json({
      message: 'Default agents initialized successfully',
      agents: allAgents
    });
  } catch (error) {
    console.error('Failed to initialize agents:', error);
    return NextResponse.json(
      { error: 'Failed to initialize agents' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET to check if agents are initialized
  try {
    const agents = await query('SELECT * FROM agents ORDER BY name ASC');
    
    return NextResponse.json({
      initialized: agents.length > 0,
      agents: agents
    });
  } catch (error) {
    console.error('Failed to check agents:', error);
    return NextResponse.json(
      { error: 'Failed to check agents' },
      { status: 500 }
    );
  }
}