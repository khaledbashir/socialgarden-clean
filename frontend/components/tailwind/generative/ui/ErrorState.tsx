"use client";

import { AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "../../ui/button";

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, onDismiss, className = "" }: ErrorStateProps) {
  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div
      className={`flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-in shake ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-red-900 mb-1">Generation failed</p>
        <p className="text-sm text-red-700">{errorMessage}</p>
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-100"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-8 px-2 text-red-600 hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
