import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // OpenRouter free models for AI Writing Assistant
  const models = [
    {
      id: 'z-ai/glm-4.5-air:free',
      name: 'GLM-4.5 Air (Free)',
      provider: 'openrouter',
      pricing: { prompt: '0', completion: '0' }
    },
    {
      id: 'google/gemini-2.0-flash-exp:free',
      name: 'Gemini 2.0 Flash (Free)',
      provider: 'openrouter',
      pricing: { prompt: '0', completion: '0' }
    },
    {
      id: 'meta-llama/llama-3.2-3b-instruct:free',
      name: 'Llama 3.2 3B (Free)',
      provider: 'openrouter',
      pricing: { prompt: '0', completion: '0' }
    },
    {
      id: 'qwen/qwen-2-7b-instruct:free',
      name: 'Qwen 2 7B (Free)',
      provider: 'openrouter',
      pricing: { prompt: '0', completion: '0' }
    },
  ];

  return NextResponse.json(models);
}