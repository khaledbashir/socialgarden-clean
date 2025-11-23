// Emergency Safe Workspace Chat Components
// This file provides safe fallbacks for broken React components

import React from 'react';

// Safe message map component - replaces problematic message rendering
export const SafeMessageMap: React.FC<{ messages: Array<{id: string, role: string, content: string}> }> = ({ messages }) => {
  console.log('🚨 [SAFE] Rendering messages with safe component');
  
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <SafeMessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
};

// Safe message bubble component
const SafeMessageBubble: React.FC<{ message: {id: string, role: string, content: string} }> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[80%] p-3 rounded-lg ${
        isAssistant 
          ? 'bg-gray-100 text-gray-900' 
          : 'bg-blue-500 text-white'
      }`}>
        <div className="text-sm">
          {isAssistant ? '🤖 AI' : '👤 You'}
        </div>
        <div className="mt-1">{message.content}</div>
      </div>
    </div>
  );
};

// Safe streaming accordion component - replaces broken StreamingThoughtAccordion
export const SafeStreamingAccordion: React.FC<{
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
              onInsertToEditor(content);
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
          <div className="text-sm font-medium text-green-700 mb-2">✅ JSON Data Detected</div>
          <div className="text-xs bg-gray-100 p-2 rounded font-mono">
            {JSON.stringify(extractedJSON, null, 2)}
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

// Safe wrapper for anything that might fail
export const SafeWrapper: React.FC<{ children: React.ReactNode, fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = <div className="text-gray-500 text-sm">Component unavailable</div> 
}) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('🚨 [SAFE] Component failed to render:', error);
    return <>{fallback}</>;
  }
};

// Emergency fix function for workspace chat
export const emergencyFixWorkspaceChat = () => {
  console.log('🚨 [EMERGENCY] WorkspaceChat component loaded with safe fallbacks');
  
  // Add global emergency functions for debugging
  if (typeof window !== 'undefined') {
    (window as any).emergencySafeComponents = {
      SafeMessageMap,
      SafeStreamingAccordion,
      SafeWrapper
    };
  }
};