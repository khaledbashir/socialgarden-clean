import type { TextContext } from './context-detector';

export interface PromptTemplate {
  id: string;
  category: 'sow' | 'format' | 'improve' | 'transform' | 'custom';
  name: string;
  prompt: string;
  icon: string;
  description: string;
  contextTypes: ('paragraph' | 'list' | 'table' | 'code' | 'heading' | 'mixed')[];
}

// SOW-Specific Templates
export const SOW_TEMPLATES: PromptTemplate[] = [
  {
    id: 'sow-convert',
    category: 'sow',
    name: 'Convert to SOW',
    prompt: 'Convert this into a professional Statement of Work with sections: Executive Summary, Objectives, Scope, Deliverables, Timeline, Pricing, Payment Terms, and Acceptance Criteria. Use markdown formatting with proper headers.',
    icon: '📋',
    description: 'Transform text into complete SOW document',
    contextTypes: ['paragraph', 'mixed'],
  },
  {
    id: 'sow-pricing',
    category: 'sow',
    name: 'Add Pricing Table',
    prompt: 'Create a professional pricing table with columns: Service, Description, Hours, Rate, Total. Format as a markdown table with proper alignment. Include subtotal, GST (10%), and grand total rows.',
    icon: '💰',
    description: 'Generate formatted pricing breakdown',
    contextTypes: ['list', 'paragraph', 'mixed'],
  },
  {
    id: 'sow-timeline',
    category: 'sow',
    name: 'Generate Timeline',
    prompt: 'Create a detailed project timeline table with columns: Phase, Duration, Start Date, End Date, Key Deliverables, and Milestones. Format as a professional markdown table.',
    icon: '📅',
    description: 'Build detailed project schedule',
    contextTypes: ['list', 'paragraph', 'mixed'],
  },
  {
    id: 'sow-deliverables',
    category: 'sow',
    name: 'List Deliverables',
    prompt: 'Extract and format all deliverables as a detailed checklist with descriptions and clear acceptance criteria for each item. Use markdown checkboxes and proper formatting.',
    icon: '✅',
    description: 'Create comprehensive deliverables list',
    contextTypes: ['paragraph', 'mixed', 'list'],
  },
  {
    id: 'sow-executive-summary',
    category: 'sow',
    name: 'Executive Summary',
    prompt: 'Create a concise executive summary (2-3 paragraphs, ~150 words) highlighting: project goals, key deliverables, timeline overview, and total investment. Use professional language.',
    icon: '📝',
    description: 'Generate high-level overview',
    contextTypes: ['paragraph', 'mixed'],
  },
  {
    id: 'sow-payment-terms',
    category: 'sow',
    name: 'Payment Terms',
    prompt: 'Generate standard payment terms including: payment schedule (e.g., 50% upfront, 50% on completion), accepted payment methods, invoice details, late payment policy, and refund conditions.',
    icon: '💳',
    description: 'Create payment terms section',
    contextTypes: ['paragraph', 'mixed'],
  },
  {
    id: 'sow-scope',
    category: 'sow',
    name: 'Define Scope',
    prompt: 'Create a detailed scope section with: In-Scope items (what is included), Out-of-Scope items (what is excluded), Assumptions, and Dependencies. Use bullet points and clear formatting.',
    icon: '🎯',
    description: 'Define project boundaries',
    contextTypes: ['paragraph', 'list', 'mixed'],
  },
];

// General Purpose Templates
export const GENERAL_TEMPLATES: PromptTemplate[] = [
  {
    id: 'improve-writing',
    category: 'improve',
    name: 'Improve Writing',
    prompt: 'Improve the clarity, flow, and professionalism of this text while maintaining the original meaning and tone. Fix any grammar or style issues.',
    icon: '✨',
    description: 'Enhance overall quality',
    contextTypes: ['paragraph', 'mixed'],
  },
  {
    id: 'fix-grammar',
    category: 'improve',
    name: 'Fix Grammar',
    prompt: 'Correct all grammar, spelling, punctuation, and syntax errors. Make minimal changes to preserve the original voice.',
    icon: '✏️',
    description: 'Fix errors only',
    contextTypes: ['paragraph', 'mixed', 'list'],
  },
  {
    id: 'summarize',
    category: 'transform',
    name: 'Summarize',
    prompt: 'Create a concise summary of the key points in 2-3 sentences. Focus on the most important information.',
    icon: '📄',
    description: 'Extract main ideas',
    contextTypes: ['paragraph', 'mixed'],
  },
  {
    id: 'expand',
    category: 'transform',
    name: 'Expand Details',
    prompt: 'Expand this text by adding more detail, context, and explanation. Increase the depth while maintaining accuracy.',
    icon: '📈',
    description: 'Add more information',
    contextTypes: ['paragraph', 'list'],
  },
  {
    id: 'format-table',
    category: 'format',
    name: 'Format as Table',
    prompt: 'Convert this into a well-formatted markdown table with appropriate headers and columns. Ensure proper alignment.',
    icon: '📊',
    description: 'Create structured table',
    contextTypes: ['list', 'paragraph', 'mixed'],
  },
  {
    id: 'add-bullets',
    category: 'format',
    name: 'Add Bullet Points',
    prompt: 'Restructure this as a clear, organized bullet point list. Each point should be concise and actionable.',
    icon: '•',
    description: 'Convert to list format',
    contextTypes: ['paragraph', 'mixed'],
  },
  {
    id: 'make-professional',
    category: 'improve',
    name: 'Make Professional',
    prompt: 'Rewrite this in a more professional, business-appropriate tone. Remove casual language while keeping it friendly.',
    icon: '👔',
    description: 'Increase formality',
    contextTypes: ['paragraph', 'mixed'],
  },
  {
    id: 'simplify',
    category: 'improve',
    name: 'Simplify Language',
    prompt: 'Rewrite this using simpler language and shorter sentences. Make it easier to understand without losing important details.',
    icon: '💡',
    description: 'Make easier to read',
    contextTypes: ['paragraph', 'mixed'],
  },
  {
    id: 'add-examples',
    category: 'transform',
    name: 'Add Examples',
    prompt: 'Add relevant examples and use cases to illustrate the concepts. Make it more concrete and relatable.',
    icon: '🔍',
    description: 'Include practical examples',
    contextTypes: ['paragraph', 'mixed'],
  },
];

/**
 * Get smart suggestions based on text context
 */
export function getSmartSuggestions(context: TextContext): PromptTemplate[] {
  const suggestions: PromptTemplate[] = [];

  // SOW-specific suggestions for professional tone documents
  if (context.tone === 'professional' && context.wordCount > 50) {
    suggestions.push(SOW_TEMPLATES.find(t => t.id === 'sow-convert')!);
  }

  // Table suggestions for lists with numbers
  if ((context.type === 'list' || context.hasNumbers) && context.hasBullets) {
    suggestions.push(GENERAL_TEMPLATES.find(t => t.id === 'format-table')!);
    suggestions.push(SOW_TEMPLATES.find(t => t.id === 'sow-pricing')!);
  }

  // Readability improvements
  if (context.readabilityScore < 50 && context.wordCount > 30) {
    suggestions.push(GENERAL_TEMPLATES.find(t => t.id === 'simplify')!);
  }

  // Long text needs summary
  if (context.wordCount > 100) {
    suggestions.push(GENERAL_TEMPLATES.find(t => t.id === 'summarize')!);
    suggestions.push(SOW_TEMPLATES.find(t => t.id === 'sow-executive-summary')!);
  }

  // Short text can be expanded
  if (context.wordCount < 50 && context.wordCount > 5) {
    suggestions.push(GENERAL_TEMPLATES.find(t => t.id === 'expand')!);
  }

  // General improvements for any paragraph
  if (context.type === 'paragraph') {
    if (!suggestions.some(s => s.id === 'improve-writing')) {
      suggestions.push(GENERAL_TEMPLATES.find(t => t.id === 'improve-writing')!);
    }
  }

  // Unformatted lists
  if (context.type === 'paragraph' && context.wordCount > 20) {
    suggestions.push(GENERAL_TEMPLATES.find(t => t.id === 'add-bullets')!);
  }

  // Casual tone in professional context
  if (context.tone === 'casual' && context.wordCount > 20) {
    suggestions.push(GENERAL_TEMPLATES.find(t => t.id === 'make-professional')!);
  }

  // Always suggest grammar fixes
  if (context.wordCount > 10) {
    suggestions.push(GENERAL_TEMPLATES.find(t => t.id === 'fix-grammar')!);
  }

  // Remove duplicates and limit to top 4-5
  return [...new Set(suggestions)].filter(Boolean).slice(0, 5);
}

/**
 * Get all templates by category
 */
export function getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return [...SOW_TEMPLATES, ...GENERAL_TEMPLATES].filter(t => t.category === category);
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): PromptTemplate[] {
  const lowerQuery = query.toLowerCase();
  return [...SOW_TEMPLATES, ...GENERAL_TEMPLATES].filter(
    t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.prompt.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all templates
 */
export function getAllTemplates(): PromptTemplate[] {
  return [...SOW_TEMPLATES, ...GENERAL_TEMPLATES];
}
