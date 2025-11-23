/**
 * Improved SOW Generation Handler
 *
 * This module provides enhanced handling for SOW generation with streaming,
 * specifically addressing the latency and output logic issues.
 */

import {
  extractStreamingJSON,
  cleanStreamContent,
  isAIStillWorking
} from './streaming-enhancements/json-extractor';
import {
  StreamingUIState,
  createInitialUIState,
  updateUIStateFromContent,
  finalizeUIState,
  formatCurrency
} from './streaming-enhancements/streaming-ui-updater';

export interface SOWGenerationOptions {
  workspaceSlug: string;
  threadSlug?: string;
  message: string;
  onStreamingUpdate?: (state: StreamingUIState) => void;
  onComplete?: (content: string, finalJSON?: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number, message: string) => void;
}

export interface SOWGenerationState {
  isGenerating: boolean;
  content: string;
  finalJSON?: any;
  progress: number;
  statusMessage: string;
  error?: Error;
}

/**
 * Enhanced SOW Generation with Streaming Support
 *
 * This function handles the entire SOW generation process with:
 * 1. Real-time streaming updates
 * 2. Multiple JSON block handling (uses the LAST valid JSON)
 * 3. Progress tracking and user feedback
 * 4. Error handling and recovery
 *
 * @param options - SOW generation options
 * @returns Promise that resolves when generation is complete
 */
export async function generateSOWWithStreaming(options: SOWGenerationOptions): Promise<void> {
  const {
    workspaceSlug,
    threadSlug,
    message,
    onStreamingUpdate,
    onComplete,
    onError,
    onProgress
  } = options;

  let uiState = createInitialUIState();
  let accumulatedContent = '';
  let currentRequestController: AbortController | null = null;

  try {
    // Create a new AbortController for this request
    currentRequestController = new AbortController();

    // Initial state update
    uiState = updateUIStateFromContent(uiState, '');
    onStreamingUpdate?.(uiState);
    onProgress?.(uiState.progress, uiState.statusMessage);

    // Build the streaming endpoint URL
    const streamEndpoint = threadSlug
      ? `/api/anythingllm/stream-chat?thread=${encodeURIComponent(threadSlug)}`
      : `/api/anythingllm/stream-chat`;

    console.log("🚀 [SOW-GEN] Starting streaming SOW generation:", {
      workspaceSlug,
      threadSlug,
      streamEndpoint
    });

    // Start streaming request
    const streamResponse = await fetch(streamEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceSlug,
        message,
        mode: "chat"
      }),
      signal: currentRequestController.signal,
    });

    if (!streamResponse.ok) {
      throw new Error(`Stream request failed: ${streamResponse.status} ${streamResponse.statusText}`);
    }

    if (!streamResponse.body) {
      throw new Error("No response body for streaming");
    }

    // Process the streaming response
    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "textResponseChunk" && data.textResponse) {
                // Append the new chunk to accumulated content
                accumulatedContent += data.textResponse;

                // Update UI state with new content
                uiState = updateUIStateFromContent(uiState, accumulatedContent);
                onStreamingUpdate?.(uiState);
                onProgress?.(uiState.progress, uiState.statusMessage);

                // Check if we have multiple JSON blocks and the AI is recalculating
                const streamData = extractStreamingJSON(accumulatedContent);
                if (streamData.jsonCount > 1) {
                  console.log(`🔄 [SOW-GEN] AI is refining pricing (iteration ${streamData.jsonCount})`);
                }
              } else if (data.type === "textResponse" && data.textResponse) {
                // Final response - use the complete text
                accumulatedContent = data.textResponse;
              }
            } catch (parseError) {
              console.warn("⚠️ [SOW-GEN] Failed to parse SSE data:", parseError);
            }
          }
        }
      }

      // Final processing when stream completes
      console.log("✅ [SOW-GEN] Stream completed, processing final content");

      // Finalize UI state
      uiState = finalizeUIState(uiState);
      onStreamingUpdate?.(uiState);
      onProgress?.(100, "SOW generation complete");

      // Extract the final JSON (the LAST valid one)
      const streamData = extractStreamingJSON(accumulatedContent);
      let finalJSON = null;
      let cleanedContent = accumulatedContent;

      if (streamData.hasValidJSON && streamData.latestJSON) {
        finalJSON = streamData.latestJSON;
        cleanedContent = cleanStreamContent(accumulatedContent);

        console.log(`✅ [SOW-GEN] Successfully extracted final JSON (found ${streamData.jsonCount} total)`);
        const totalForLog = (finalJSON.grandTotal ?? finalJSON.grand_total) as number;
        if (typeof totalForLog === 'number') {
          console.log(`💰 [SOW-GEN] Total investment: ${formatCurrency(totalForLog)}`);
          try {
            window.dispatchEvent(new CustomEvent('sow:grandTotalUpdate', { detail: { grandTotal: totalForLog } }));
          } catch {}
        }
      } else {
        console.log("⚠️ [SOW-GEN] No valid JSON found in final content");
      }

      // Call completion callback with final results
      onComplete?.(cleanedContent, finalJSON);
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.log("🛑 [SOW-GEN] SOW generation was cancelled");
      return;
    }

    const errorMessage = error instanceof Error ? error : new Error("Unknown error occurred");
    console.error("❌ [SOW-GEN] Error in SOW generation:", errorMessage);

    // Update state with error
    uiState = {
      ...uiState,
      isStreaming: false,
      statusMessage: "Error generating SOW",
      phase: 'complete' as const
    };
    onStreamingUpdate?.(uiState);
    onError?.(errorMessage);
  } finally {
    // Clean up
    currentRequestController = null;
  }
}

/**
 * Cancel an ongoing SOW generation
 * @param controller - The AbortController for the generation request
 */
export function cancelSOWGeneration(controller?: AbortController): void {
  if (controller) {
    controller.abort();
    console.log("🛑 [SOW-GEN] Generation cancelled");
  }
}

/**
 * Create a state manager for SOW generation
 * @returns Object with state management methods
 */
export function createSOWGenerationStateManager() {
  let state: SOWGenerationState = {
    isGenerating: false,
    content: '',
    progress: 0,
    statusMessage: 'Ready to generate'
  };
  let abortController: AbortController | null = null;

  const listeners: Array<(state: SOWGenerationState) => void> = [];

  const notifyListeners = () => {
    listeners.forEach(listener => listener({ ...state }));
  };

  return {
    // Get current state
    getState: () => ({ ...state }),

    // Subscribe to state changes
    subscribe: (listener: (state: SOWGenerationState) => void) => {
      listeners.push(listener);
      listener({ ...state }); // Immediately send current state

      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    },

    // Start generation
    startGeneration: async (options: Omit<SOWGenerationOptions, 'onStreamingUpdate' | 'onProgress' | 'onComplete' | 'onError'>) => {
      if (state.isGenerating && abortController) {
        cancelSOWGeneration(abortController);
      }

      abortController = new AbortController();
      state = {
        isGenerating: true,
        content: '',
        progress: 0,
        statusMessage: 'Initializing...'
      };
      notifyListeners();

      try {
        await generateSOWWithStreaming({
          ...options,
          onStreamingUpdate: (uiState) => {
            if (uiState.content !== state.content || uiState.progress !== state.progress) {
              state = {
                ...state,
                content: uiState.content,
                progress: uiState.progress,
                statusMessage: uiState.statusMessage
              };
              notifyListeners();
            }
          },
          onProgress: (progress, message) => {
            if (progress !== state.progress || message !== state.statusMessage) {
              state = {
                ...state,
                progress,
                statusMessage: message
              };
              notifyListeners();
            }
          },
          onComplete: (content, finalJSON) => {
            state = {
              isGenerating: false,
              content,
              finalJSON,
              progress: 100,
              statusMessage: 'SOW generation complete'
            };
            notifyListeners();
          },
          onError: (error) => {
            state = {
              ...state,
              isGenerating: false,
              error,
              statusMessage: `Error: ${error.message}`
            };
            notifyListeners();
          }
        });
      } catch (error) {
        state = {
          ...state,
          isGenerating: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
          statusMessage: 'Failed to generate SOW'
        };
        notifyListeners();
      } finally {
        abortController = null;
      }
    },

    // Cancel current generation
    cancelGeneration: () => {
      if (abortController) {
        cancelSOWGeneration(abortController);
        abortController = null;
        state = {
          ...state,
          isGenerating: false,
          statusMessage: 'Generation cancelled'
        };
        notifyListeners();
      }
    },

    // Reset state
    reset: () => {
      if (abortController) {
        cancelSOWGeneration(abortController);
        abortController = null;
      }
      state = {
        isGenerating: false,
        content: '',
        progress: 0,
        statusMessage: 'Ready to generate'
      };
      notifyListeners();
    }
  };
}
