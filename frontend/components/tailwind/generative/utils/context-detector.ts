export type TextType = 'paragraph' | 'list' | 'table' | 'code' | 'heading' | 'mixed';
export type Tone = 'professional' | 'casual' | 'technical' | 'creative';

export interface TextContext {
  type: TextType;
  wordCount: number;
  charCount: number;
  hasNumbers: boolean;
  hasBullets: boolean;
  hasMarkdown: boolean;
  tone: Tone;
  readabilityScore: number;
  estimatedReadingTime: number; // in seconds
}

/**
 * Detect the type of text selected
 */
export function detectTextType(text: string): TextType {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Check for code blocks
  if (text.includes('```') || /^(\s{4}|\t)/.test(text)) {
    return 'code';
  }
  
  // Check for headings
  if (/^#{1,6}\s/.test(text)) {
    return 'heading';
  }
  
  // Check for lists (bullets or numbers)
  const bulletPattern = /^[\s]*[-*•]/;
  const numberPattern = /^[\s]*\d+\./;
  const listLines = lines.filter(line => 
    bulletPattern.test(line) || numberPattern.test(line)
  );
  
  if (listLines.length > 0) {
    return listLines.length === lines.length ? 'list' : 'mixed';
  }
  
  // Check for tables
  if (text.includes('|') && lines.some(line => line.includes('|--'))) {
    return 'table';
  }
  
  // Multiple paragraphs
  if (lines.length > 3) {
    return 'mixed';
  }
  
  return 'paragraph';
}

/**
 * Analyze the tone of the text
 */
export function analyzeTone(text: string): Tone {
  const lowerText = text.toLowerCase();
  
  // Technical indicators
  const technicalWords = ['algorithm', 'function', 'api', 'database', 'server', 'code', 'implementation'];
  const technicalCount = technicalWords.filter(word => lowerText.includes(word)).length;
  
  if (technicalCount >= 2) return 'technical';
  
  // Professional indicators
  const professionalWords = ['deliverable', 'objective', 'timeline', 'scope', 'stakeholder', 'milestone'];
  const professionalCount = professionalWords.filter(word => lowerText.includes(word)).length;
  
  if (professionalCount >= 2) return 'professional';
  
  // Casual indicators (contractions, informal language)
  if (/\b(don't|won't|can't|you're|we'll|let's)\b/.test(lowerText)) {
    return 'casual';
  }
  
  // Creative indicators (descriptive language, metaphors)
  const creativeWords = ['imagine', 'envision', 'picture', 'feel', 'experience'];
  const creativeCount = creativeWords.filter(word => lowerText.includes(word)).length;
  
  if (creativeCount >= 2) return 'creative';
  
  // Default to professional for business documents
  return 'professional';
}

/**
 * Calculate Flesch-Kincaid readability score
 * Score: 0-100 (higher = easier to read)
 * 90-100: Very easy (5th grade)
 * 60-70: Standard (8th-9th grade)
 * 0-30: Very difficult (college graduate)
 */
export function calculateFleschKincaid(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in a word (approximate)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Main context detection function
 */
export function detectContext(text: string): TextContext {
  if (!text || text.trim().length === 0) {
    return {
      type: 'paragraph',
      wordCount: 0,
      charCount: 0,
      hasNumbers: false,
      hasBullets: false,
      hasMarkdown: false,
      tone: 'professional',
      readabilityScore: 0,
      estimatedReadingTime: 0,
    };
  }
  
  const type = detectTextType(text);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const wordCount = words.length;
  const charCount = text.length;
  
  // Pattern detection
  const hasNumbers = /\d/.test(text);
  const hasBullets = /^[\s]*[-*•]/m.test(text);
  const hasMarkdown = /[#*_`[\](){}]/.test(text);
  
  // Analysis
  const tone = analyzeTone(text);
  const readabilityScore = calculateFleschKincaid(text);
  
  // Average reading speed: 200 words per minute = 3.33 words per second
  const estimatedReadingTime = Math.ceil(wordCount / 3.33);
  
  return {
    type,
    wordCount,
    charCount,
    hasNumbers,
    hasBullets,
    hasMarkdown,
    tone,
    readabilityScore,
    estimatedReadingTime,
  };
}

/**
 * Format readability score to human-readable level
 */
export function getReadabilityLevel(score: number): string {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10-12th grade)';
  if (score >= 30) return 'Difficult (College)';
  return 'Very Difficult (College graduate)';
}

/**
 * Format reading time to human-readable string
 */
export function formatReadingTime(seconds: number): string {
  if (seconds < 60) return `${seconds} sec read`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min read`;
}
