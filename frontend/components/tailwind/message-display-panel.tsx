/**
 * Message Display Panel Component
 * Main chat window showing messages for selected conversation
 * Distinguishes between user and assistant messages
 */

import { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { StreamingThoughtAccordion } from './streaming-thought-accordion';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface MessageDisplayPanelProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => Promise<void>;
  conversationTitle?: string;
  isEmpty?: boolean;
}

export function MessageDisplayPanel({
  messages,
  isLoading = false,
  onSendMessage,
  conversationTitle = 'Dashboard Chat',
  isEmpty = false
}: MessageDisplayPanelProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(inputValue);
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 p-4 bg-slate-950">
        <h3 className="font-semibold text-white">{conversationTitle}</h3>
        <p className="text-xs text-gray-400 mt-1">
          {messages.length} messages in this conversation
        </p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="bg-emerald-600/10 p-4 rounded-full mb-4">
              <Send className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Start the conversation by typing your question below. The AI will analyze your SOW data and provide insights.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-gray-100'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    // Hide <think>/<thinking> content and show accordion with reasoning
                    <div className="space-y-2 w-full">
                      <StreamingThoughtAccordion 
                        content={message.content} 
                        messageId={message.id}
                        isStreaming={false}
                      />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  <p className="text-xs opacity-60 mt-2">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span className="text-sm text-gray-300">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={scrollRef} />
          </>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-slate-800 p-4 bg-slate-950">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your dashboard..."
            disabled={isSending || isLoading}
            className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || isLoading || !inputValue.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add React import for useState
import React from 'react';
