/**
 * Enhanced Streaming Progress Component
 *
 * This component displays real-time progress during SOW generation,
 * showing intermediate results and keeping users engaged during long processes.
 */

import React from 'react';
import { Loader2, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import {
  StreamingUIState,
  updateUIStateFromContent,
  generateProgressMessage,
  formatCurrency
} from '@/lib/streaming-enhancements/streaming-ui-updater';

interface StreamingProgressProps {
  content: string;
  isStreaming: boolean;
  onComplete?: () => void;
}

export function StreamingProgress({ content, isStreaming, onComplete }: StreamingProgressProps) {
  const [uiState, setUiState] = React.useState<StreamingUIState>({
    content: '',
    isStreaming: true,
    hasValidJSON: false,
    jsonCount: 0,
    statusMessage: 'Initializing...',
    progress: 0,
    phase: 'initializing'
  });

  // Update UI state when content changes
  React.useEffect(() => {
    if (isStreaming) {
      setUiState(prev => updateUIStateFromContent(prev, content));
    } else if (uiState.isStreaming) {
      // Streaming just completed
      setUiState(prev => ({ ...prev, isStreaming: false, progress: 100, phase: 'complete' }));
      onComplete?.();
    }
  }, [content, isStreaming, onComplete, uiState.isStreaming]);

  // Phase-specific icons and colors
  const getPhaseIcon = () => {
    switch (uiState.phase) {
      case 'initializing':
      case 'analyzing':
      case 'generating':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'refining':
        return <DollarSign className="h-5 w-5 text-amber-500" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProgressColor = () => {
    switch (uiState.phase) {
      case 'initializing':
        return 'bg-blue-500';
      case 'analyzing':
        return 'bg-indigo-500';
      case 'generating':
        return 'bg-purple-500';
      case 'refining':
        return 'bg-amber-500';
      case 'complete':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Don't render if not streaming and no content
  if (!isStreaming && !content) return null;

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-3">
        {getPhaseIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {generateProgressMessage(uiState)}
            </h3>
            {uiState.totalInvestment && (
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {formatCurrency(uiState.totalInvestment)}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className={`h-full transition-all duration-500 ease-out ${getProgressColor()}`}
              style={{ width: `${uiState.progress}%` }}
            />
          </div>

          {/* Additional status information */}
          {uiState.jsonCount > 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {uiState.jsonCount === 1
                ? "Pricing proposal generated"
                : `AI has refined the pricing ${uiState.jsonCount - 1} time(s) to better match your budget`
              }
            </div>
          )}

          {/* Estimated time remaining for long processes */}
          {uiState.phase === 'refining' && uiState.progress < 90 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              This usually takes 30-60 seconds more to ensure optimal pricing...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
