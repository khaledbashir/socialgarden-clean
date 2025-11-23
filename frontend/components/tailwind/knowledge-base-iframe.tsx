"use client";

import { useState, useEffect } from "react";

interface KnowledgeBaseIframeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KnowledgeBaseIframe({ isOpen, onClose }: KnowledgeBaseIframeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-primary">📚</span>
          Knowledge Base
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Loading knowledge base...
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center text-red-600">
            <p className="font-medium">Failed to load knowledge base</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
              }}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* iframe */}
      <div className="h-[calc(100vh-65px)]">
        <iframe
          src="https://ahmad-anything-llm.840tjq.easypanel.host/"
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError("Unable to load the knowledge base iframe");
          }}
          title="Knowledge Base"
        />
      </div>
    </div>
  );
}
