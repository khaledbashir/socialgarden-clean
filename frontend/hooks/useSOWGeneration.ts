/**
 * React Hook for SOW Generation with Streaming Support
 *
 * This hook provides a clean interface for generating SOWs with streaming,
 * specifically addressing the latency and output logic issues.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  generateSOWWithStreaming,
  cancelSOWGeneration,
  createSOWGenerationStateManager,
  type SOWGenerationOptions,
  type SOWGenerationState
} from '@/lib/sow-generation-handler';

export interface UseSOWGenerationOptions {
  workspaceSlug: string;
  threadSlug?: string;
  onContentUpdate?: (content: string) => void;
  onJSONUpdate?: (jsonData: any) => void;
  onComplete?: (content: string, finalJSON?: any) => void;
  onError?: (error: Error) => void;
}

export interface UseSOWGenerationReturn {
  // State
  isGenerating: boolean;
  content: string;
  finalJSON?: any;
  progress: number;
  statusMessage: string;
  error?: Error;

  // Actions
  generateSOW: (message: string) => Promise<void>;
  cancelGeneration: () => void;
  reset: () => void;

  // Additional state for better UX
  hasValidJSON: boolean;
  jsonCount: number;
  totalInvestment?: number;
  isRefining: boolean;
  estimatedTimeRemaining?: number;
}

/**
 * Hook for managing SOW generation with streaming support
 *
 * This hook handles the entire SOW generation process with:
 * 1. Real-time streaming updates
 * 2. Multiple JSON block handling (uses the LAST valid JSON)
 * 3. Progress tracking and user feedback
 * 4. Error handling and recovery
 * 5. Cancellation support
 *
 * @param options - SOW generation options
 * @returns Hook API with state and actions
 */
export function useSOWGeneration(options: UseSOWGenerationOptions): UseSOWGenerationReturn {
  const {
    workspaceSlug,
    threadSlug,
    onContentUpdate,
    onJSONUpdate,
    onComplete,
    onError
  } = options;

  // Initialize state manager
  const stateManagerRef = useRef(createSOWGenerationStateManager());
  const [state, setState] = useState<SOWGenerationState>(() => stateManagerRef.current.getState());
  const startTimeRef = useRef<Date | null>(null);
  const progressHistoryRef = useRef<Array<{ time: number; progress: number }>>([]);

  // Subscribe to state manager updates
  useEffect(() => {
    const unsubscribe = stateManagerRef.current?.subscribe((newState) => {
      setState(newState);

      // Extract additional data for better UX
      if (newState.content) {
        const hasJSON = newState.content.includes('"currency"');
        const jsonMatches = newState.content.match(/\{[\s\S]*?"currency"[\s\S]*?\}/gi) || [];
        const jsonCount = jsonMatches.length;
        const isRefining = jsonCount > 1;

        // Extract total investment if available
        let totalInvestment;
        try {
          const matches = [...newState.content.matchAll(/"grand_total":\s*(\d+)/gi)];
          if (matches.length > 0) {
            totalInvestment = parseInt(matches[matches.length - 1][1], 10);
          }
        } catch (e) {
          // Ignore extraction errors
        }

        // Calculate estimated time remaining
        let estimatedTimeRemaining;
        if (isRefining && newState.progress > 30 && newState.progress < 90) {
          // For refinement phase, estimate based on typical refinement time
          const typicalRefinementTime = 60; // 60 seconds typical
          const progressInRefinement = (newState.progress - 30) / 60; // 60% of progress is refinement
          estimatedTimeRemaining = typicalRefinementTime * (1 - progressInRefinement);
        }

        // Update state with additional data
        setState(prev => ({
          ...prev,
          hasValidJSON: hasJSON,
          jsonCount,
          isRefining,
          totalInvestment,
          estimatedTimeRemaining
        }));
      }

      // Call callbacks
      if (onContentUpdate && newState.content !== state.content) {
        onContentUpdate(newState.content);
      }

      if (onJSONUpdate && newState.finalJSON !== state.finalJSON) {
        onJSONUpdate(newState.finalJSON);
      }

      if (!newState.isGenerating && state.isGenerating && newState.finalJSON) {
        on_complete?.(newState.content, newState.finalJSON);
      }
    });

    return unsubscribe;
  }, [state.content, state.finalJSON, state.isGenerating, onContentUpdate, onJSONUpdate, on_complete]);

  // Handle completion separately to avoid duplicate calls
  const handleComplete = useCallback((content: string, finalJSON?: any) => {
    if (onComplete) {
      onComplete(content, finalJSON);
    }
  }, [onComplete]);

  // Handle errors separately to avoid duplicate calls
  const handleError = useCallback((error: Error) => {
    if (onError) {
      onError(error);
    }
  }, [onError]);

  // Generate SOW with streaming
  const generateSOW = useCallback(async (message: string) => {
    // Record start time for progress tracking
    startTimeRef.current = new Date();
    progressHistoryRef.current = [];

    // Start generation through state manager
    await stateManagerRef.current?.startGeneration({
      workspaceSlug,
      threadSlug,
      message,
      onComplete: (content, finalJSON) => {
        handleComplete(content, finalJSON);
      },
      onError: handleError
    });
  }, [workspaceSlug, threadSlug, handleComplete, handleError]);

  // Cancel current generation
  const cancelGeneration = useCallback(() => {
    stateManagerRef.current?.cancelGeneration();
  }, []);

  // Reset state
  const reset = useCallback(() => {
    stateManagerRef.current?.reset();
    startTimeRef.current = null;
    progressHistoryRef.current = [];
  }, []);

  return {
    // Core state
    isGenerating: state.isGenerating,
    content: state.content,
    finalJSON: state.finalJSON,
    progress: state.progress,
    statusMessage: state.statusMessage,
    error: state.error,

    // Actions
    generateSOW,
    cancelGeneration,
    reset,

    // Additional state for better UX
    hasValidJSON: (state as any).hasValidJSON || false,
    jsonCount: (state as any).jsonCount || 0,
    totalInvestment: (state as any).totalInvestment,
    isRefining: (state as any).isRefining || false,
    estimatedTimeRemaining: (state as any).estimatedTimeRemaining
  };
}
```

<file_path>
the11-dev-clean/frontend/hooks/useSOWGeneration.ts</file_path>
