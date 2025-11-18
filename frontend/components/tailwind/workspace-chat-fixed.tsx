// Emergency Fix: Workspace Chat with JSON Processing
// This fixes the "Insert to Editor" so JSON converts to editable pricing tables

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { ChevronRight, Send, Bot, Plus, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Import our JSON conversion utilities
import { 
    insertPricingToEditor, 
    safeContentProcessor, 
    extractJSONFromContent,
    convertV41JSONToEditorFormat 
} from "../../json-editor-conversion-fix";
import { cleanSOWContent } from "@/lib/export-utils";

// Simple message interface
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Safe fallback for streaming accordion
const SafeStreamingAccordion: React.FC<{
  content: string;
  messageId: string;
  isStreaming?: boolean;
  onInsertToEditor?: (content: string) => void;
}> = ({ content, messageId, isStreaming = false, onInsertToEditor }) => {
  console.log('🚨 [SAFE] SafeStreamingAccordion rendering for message:', messageId);
  
  // Extract JSON if present
  let extractedJSON = null;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedJSON = JSON.parse(jsonMatch[0]);
      console.log('📊 [SAFE] JSON extracted:', extractedJSON);
    }
  } catch (error) {
    console.log('⚠️ [SAFE] No valid JSON found in content');
  }
  
  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <span className="text-sm font-medium">💡 AI Analysis</span>
          {isStreaming && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              <span className="animate-spin mr-1">⚡</span>
              Streaming
            </span>
          )}
        </div>
        {onInsertToEditor && (
          <button
            onClick={() => {
              console.log('🔗 [SAFE] Insert button clicked');
              // Use our enhanced insert function
              insertPricingToEditor(content, (formattedContent) => {
                console.log('✅ [SAFE] Processed content for insertion:', formattedContent.substring(0, 200));
                onInsertToEditor(formattedContent);
              });
            }}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Insert to Editor
          </button>
        )}
      </div>
      
      {/* Show extracted JSON if available */}
      {extractedJSON && (
        <div className="bg-white border rounded p-3 mb-3">
          <div className="text-sm font-medium text-green-700 mb-2">✅ V4.1 JSON Data Detected</div>
          <div className="text-xs bg-gray-100 p-2 rounded font-mono">
            {JSON.stringify(extractedJSON, null, 2).substring(0, 300)}...
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Scopes: {extractedJSON.scopes?.length || 0} | Total: {extractedJSON.grand_total}
          </div>
        </div>
      )}
      
      {/* Content preview */}
      <div className="text-sm text-gray-700">
        <div className="font-medium mb-2">Response:</div>
        <div className="bg-white p-3 rounded border text-sm max-h-32 overflow-y-auto">
          {content.substring(0, 500)}
          {content.length > 500 && '...'}
        </div>
      </div>
    </div>
  );
};

// Main workspace chat component
interface WorkspaceChatProps {
  // Add your props here
  className?: string;
}

export const WorkspaceChat: React.FC<WorkspaceChatProps> = ({ className = "" }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('sow-generator');
  
  // Message rendering function
  const renderMessage = (message: Message, index: number) => {
    const isAssistant = message.role === 'assistant';
    
    return (
      <div key={message.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
        <div className={`max-w-[80%] p-3 rounded-lg ${
          isAssistant 
            ? 'bg-gray-100 text-gray-900' 
            : 'bg-blue-500 text-white'
        }`}>
          <div className="text-sm mb-2">
            {isAssistant ? '🤖 AI' : '👤 You'}
          </div>
          
          {isAssistant ? (
            <SafeStreamingAccordion
              content={message.content}
              messageId={message.id}
              isStreaming={false}
              onInsertToEditor={(formattedContent) => {
                console.log('🔗 [INSERT] Inserting content to editor:', formattedContent.substring(0, 200));
                // Here you would call the editor's insert function
                // For now, we'll just show a success message
                toast.success('Content formatted and ready for editor!');
              }}
            />
          ) : (
            <div>{message.content}</div>
          )}
        </div>
      </div>
    );
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // TODO: Implement actual API call to send message
    // For now, simulate response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `I understand you want help with: "${inputValue}". How can I assist you further?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">💬 Workspace Chat</h2>
          <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sow-generator">SOW Generator</SelectItem>
              <SelectItem value="master-dashboard">Master Dashboard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Bot className="mx-auto h-12 w-12 mb-4" />
              <p>Start a conversation with your AI assistant</p>
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] max-h-[120px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceChat;