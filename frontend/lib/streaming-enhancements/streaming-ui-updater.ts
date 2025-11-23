/**
 * UI Updater for Streaming SOW Generation
 *
 * This module provides utilities to update the UI with intermediate results
 * during the streaming process, keeping the user informed of progress.
 */

import { extractStreamingJSON, cleanStreamContent, isAIStillWorking } from './json-extractor';

export interface StreamingUIState {
  content: string;
  isStreaming: boolean;
  hasValidJSON: boolean;
  jsonCount: number;
  totalInvestment?: number;
  statusMessage: string;
  progress: number; // 0-100
  phase: 'initializing' | 'analyzing' | 'generating' | 'refining' | 'complete';
}

/**
 * Create an initial UI state for streaming
 * @returns Initial streaming UI state
 */
export function createInitialUIState(): StreamingUIState {
  return {
    content: '',
    isStreaming: true,
    hasValidJSON: false,
    jsonCount: 0,
    statusMessage: 'Initializing AI generation...',
    progress: 0,
    phase: 'initializing'
  };
}

/**
 * Update the UI state based on current streaming content
 * @param currentState - Current UI state
 * @param content - Latest streaming content
 * @returns Updated UI state
 */
export function updateUIStateFromContent(
  currentState: StreamingUIState,
  content: string
): StreamingUIState {
  // Extract JSON data and metadata from content
  const streamUpdate = extractStreamingJSON(content);

  // Determine the current phase
  let phase: StreamingUIState['phase'] = 'analyzing';
  let progress = Math.min(30, content.length / 10); // Base progress on content length

  if (streamUpdate.hasValidJSON) {
    if (streamUpdate.jsonCount > 1) {
      // AI is refining the pricing (multiple JSON blocks)
      phase = 'refining';
      progress = 60 + (streamUpdate.jsonCount * 10); // Incremental progress
      progress = Math.min(90, progress); // Cap at 90% until complete
    } else {
      phase = 'generating';
      progress = 50;
    }
  } else if (isAIStillWorking(content)) {
    phase = 'analyzing';
    progress = 30;
  } else if (content.length > 500) {
    phase = 'generating';
    progress = 40;
  }

  return {
    ...currentState,
    content,
    isStreaming: true,
    hasValidJSON: streamUpdate.hasValidJSON,
    jsonCount: streamUpdate.jsonCount,
    totalInvestment: streamUpdate.totalInvestment,
    statusMessage: streamUpdate.statusMessage,
    progress,
    phase
  };
}

/**
 * Finalize the UI state when streaming is complete
 * @param currentState - Current UI state
 * @returns Finalized UI state
 */
export function finalizeUIState(
  currentState: StreamingUIState
): StreamingUIState {
  return {
    ...currentState,
    isStreaming: false,
    statusMessage: 'SOW generation complete',
    progress: 100,
    phase: 'complete'
  };
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'AUD'
): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Generate a progress message based on the current phase
 * @param state - Current UI state
 * @returns User-friendly progress message
 */
export function generateProgressMessage(state: StreamingUIState): string {
  if (!state.isStreaming) return state.statusMessage;

  const { phase, jsonCount, totalInvestment } = state;

  switch (phase) {
    case 'initializing':
      return 'Initializing AI generation...';

    case 'analyzing':
      return 'AI is analyzing your requirements and preparing pricing...';

    case 'generating':
      return 'AI is generating your Statement of Work...';

    case 'refining':
      if (jsonCount > 1) {
        const investmentText = totalInvestment
          ? ` (Current estimate: ${formatCurrency(totalInvestment)})`
          : '';
        return `AI is refining the pricing to match your budget${investmentText}...`;
      }
      return 'AI is refining the Statement of Work...';

    case 'complete':
      return 'SOW generation complete!';

    default:
      return 'Processing your request...';
  }
}
