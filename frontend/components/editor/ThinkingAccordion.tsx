"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/tailwind/ui/button";
import { cn } from "@/lib/utils";

interface ThinkingAccordionProps {
  className?: string;
}

export function ThinkingAccordion({ className }: ThinkingAccordionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [thinkingContent, setThinkingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);

  useEffect(() => {
    const handleThinkingUpdate = (event: CustomEvent) => {
      const { thinking, isStreaming: streaming, messageId: msgId } = event.detail;
      
      setThinkingContent(thinking);
      setIsStreaming(streaming);
      setMessageId(msgId);
      
      // Auto-open when new thinking starts
      if (streaming && !isOpen) {
        setIsOpen(true);
      }
    };

    window.addEventListener('thinking-updated', handleThinkingUpdate as EventListener);
    
    return () => {
      window.removeEventListener('thinking-updated', handleThinkingUpdate as EventListener);
    };
  }, [isOpen]);

  // Extract thinking content from the accumulated content
  const extractThinkingContent = (content: string): string => {
    if (!content) return "";
    
    // Extract content from various thinking tags
    const thinkingPatterns = [
      /<thinking>([\s\S]*?)<\/thinking>/gi,
      /<think>([\s\S]*?)<\/think>/gi,
      /<AI_THINK>([\s\S]*?)<\/AI_THINK>/gi,
    ];
    
    let extractedThinking = "";
    for (const pattern of thinkingPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        extractedThinking += matches.map(match => 
          match.replace(/<\/?thinking>|<\/?think>|<\/?AI_THINK>/gi, '')
        ).join('\n\n');
      }
    }
    
    return extractedThinking.trim();
  };

  const thinkingText = extractThinkingContent(thinkingContent);

  if (!thinkingText && !isStreaming) {
    return null;
  }

  return (
    <div className={cn(
      "border border-gray-200 rounded-lg bg-white shadow-sm",
      "dark:border-gray-700 dark:bg-gray-800",
      className
    )}>
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            AI Thinking Process
          </span>
          {isStreaming && (
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-6 w-6 p-0"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {isOpen && (
        <div className="p-3">
          <div className="space-y-2">
            {thinkingText.split('\n\n').map((paragraph, index) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {paragraph.trim()}
              </div>
            ))}
            {isStreaming && thinkingText && (
              <div className="flex items-center gap-2 mt-3 text-xs text-blue-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            {isStreaming && !thinkingText && (
              <div className="flex items-center gap-2 text-xs text-blue-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>AI is analyzing your request...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}