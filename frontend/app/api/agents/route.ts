import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const agents = await query('SELECT * FROM agents ORDER BY name ASC');
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name, systemPrompt, model } = await request.json();
    
    const agentId = id || `agent_${Date.now()}`;
    
    await query(
      'INSERT INTO agents (id, name, systemPrompt, model) VALUES (?, ?, ?, ?)',
      [agentId, name || 'New Agent', systemPrompt || '', model || 'gpt-4']
    );

    const created = await query('SELECT * FROM agents WHERE id = ? LIMIT 1', [agentId]);
    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
