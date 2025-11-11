"use client";

// 📊 Dashboard Analytics Sidebar - Query-only mode for embedded SOW analytics
import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from 'sonner';
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ChevronRight, Send, Bot, Plus, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StreamingThoughtAccordion } from "./streaming-thought-accordion";
import { cleanSOWContent } from "@/lib/export-utils";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface DashboardChatProps {
  isOpen: boolean;
  onToggle: () => void;
  dashboardChatTarget: string;
  onDashboardWorkspaceChange: (workspace: string) => void;
  availableWorkspaces: Array<{ slug: string; name: string }>;
  chatMessages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: number }>;
  onSendMessage: (message: string, threadSlug?: string | null, attachments?: Array<{name: string; mime: string; contentString: string}>) => void;
  isLoading?: boolean;
  streamingMessageId?: string | null;
  onClearChat: () => void;
  onReplaceChatMessages: (messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: number }>) => void;
}

export default function DashboardChat({
  isOpen,
  onToggle,
  chatMessages,
  onSendMessage,
  isLoading = false,
  streamingMessageId,
  dashboardChatTarget,
  onDashboardWorkspaceChange,
  availableWorkspaces,
  onClearChat,
  onReplaceChatMessages,
}: DashboardChatProps) {
  const [chatInput, setChatInput] = useState("");
  
  // 🧵 THREAD MANAGEMENT STATE
  const [threads, setThreads] = useState<Array<{ slug: string; name: string; id: number; createdAt: string }>>([]);
  const [currentThreadSlug, setCurrentThreadSlug] = useState<string | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [showThreadList, setShowThreadList] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const MAX_MESSAGES = 100; // windowing to reduce render cost

  // Auto-scroll to bottom when new messages arrive (lighter behavior for performance)
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [chatMessages]);

  // 🛡️ FIXED: Refactored into two separate, chained useEffects to fix race condition

  // Step 1: Load the list of available threads when the workspace target changes.
  useEffect(() => {
    if (dashboardChatTarget) {
      loadThreads(dashboardChatTarget);
    }
  }, [dashboardChatTarget]);

  // Step 2: When the threads list is updated, automatically load the most recent one.
  // This hook runs after the one above has successfully updated the `threads` state.
  useEffect(() => {
    // 🎯 Always load most recent thread (AnythingLLM returns sorted by updated_at DESC)
    if (threads.length > 0) {
      const mostRecentThread = threads[0];
      console.log('🎯 Loading most recent thread history:', mostRecentThread.slug);
      setCurrentThreadSlug(mostRecentThread.slug);
      loadThreadHistory(mostRecentThread.slug, dashboardChatTarget);
    } else {
      // No threads exist - this is the initial state, not a "clear" action
      // Don't call onClearChat() as that resets the isHistoryRestored flag
      // Instead, just ensure the local thread state is cleared
      console.log('ℹ️ No threads found for this workspace. Ready for first message.');
      setCurrentThreadSlug(null);
      // The parent's welcome message effect will handle showing the welcome
    }
  }, [threads]); // Dependency on `threads` is the key to the fix.

  // Helper function to load thread chat history from AnythingLLM
  const loadThreadHistory = async (threadSlug: string, workspaceSlug: string) => {
    try {
      const response = await fetch(`/api/anythingllm/thread?workspace=${encodeURIComponent(workspaceSlug)}&thread=${encodeURIComponent(threadSlug)}`);

      if (!response.ok) {
        throw new Error('Failed to load thread history');
      }

      const data = await response.json();
      console.log('✅ Loaded thread history:', data.history?.length || 0, 'messages');
      
      const mapped = (data.history || []).map((msg: any) => ({
        id: `msg-${msg.id || Date.now()}-${Math.random()}`,
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || '',
        timestamp: new Date(msg.createdAt || Date.now()).getTime(),
      }));
      
      onReplaceChatMessages(mapped);
    } catch (error) {
      console.error('❌ Failed to load thread history:', error);
      toast.error('Failed to load chat history');
    }
  };

  const loadThreads = async (workspaceSlug: string) => {
    console.log('📂 Loading threads for workspace:', workspaceSlug);
    setLoadingThreads(true);
    
    try {
      const response = await fetch(`/api/anythingllm/threads?workspace=${encodeURIComponent(workspaceSlug)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to load threads:', {
          status: response.status,
          workspace: workspaceSlug,
          error: errorData,
        });
        
        // Don't throw - just set empty threads and let the user continue
        setThreads([]);
        return;
      }

      const data = await response.json();
      const threadList = data?.threads || [];
      
      console.log('✅ Threads loaded:', {
        workspace: workspaceSlug,
        count: threadList.length,
      });
      
      setThreads(threadList);
    } catch (error: any) {
      console.error('❌ Exception loading threads:', error);
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  };

  const handleNewThread = async (): Promise<string | null> => {
    if (!dashboardChatTarget) {
      toast.error('No workspace selected');
      return null;
    }
    
    console.log('🆕 Creating new thread for workspace:', dashboardChatTarget);
    setLoadingThreads(true);
    
    try {
      const response = await fetch(`/api/anythingllm/thread?workspace=${encodeURIComponent(dashboardChatTarget)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: dashboardChatTarget }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('❌ Thread creation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });
        throw new Error(`Failed to create thread: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Thread creation response:', data);
      
      const newThreadSlug = data.thread?.slug;
      
      if (!newThreadSlug) {
        console.error('❌ No thread slug in response:', data);
        throw new Error('No thread slug returned from server');
      }

      console.log('✅ New thread created successfully:', {
        slug: newThreadSlug,
        name: data.thread?.name,
        id: data.thread?.id,
      });
      
      // Add to local state
      const newThread = {
        slug: newThreadSlug,
        name: data.thread?.name || 'New Chat',
        id: data.thread?.id || Date.now(),
        createdAt: new Date().toISOString(),
      };
      setThreads(prev => [newThread, ...prev]);
      setCurrentThreadSlug(newThreadSlug);
      
      console.log('📋 Updated threads list. New count:', threads.length + 1);
      
      // Clear chat for new thread (no localStorage - server handles persistence)
      onClearChat();
      
      return newThreadSlug;
    } catch (error) {
      console.error('❌ Failed to create thread:', error);
      toast.error('Failed to create new chat thread');
      return null;
    } finally {
      setLoadingThreads(false);
    }
  };

  const handleToggleThreads = () => {
    setShowThreadList(prev => !prev);
  };

  const handleSelectThread = async (threadSlug: string) => {
    console.log('📂 Switching to thread:', threadSlug);
    setCurrentThreadSlug(threadSlug);
    setShowThreadList(false);
    setLoadingThreads(true);
    
    // Load thread history from server (no localStorage - AnythingLLM persists everything)
    await loadThreadHistory(threadSlug, dashboardChatTarget);
    setLoadingThreads(false);
  };

  const handleDeleteThread = async (threadSlug: string) => {
    if (!confirm('Delete this chat? This cannot be undone.')) return;
    
    console.log('🗑️ Deleting thread:', threadSlug);
    
    try {
      const response = await fetch(`/api/anythingllm/thread?workspace=${encodeURIComponent(dashboardChatTarget)}&thread=${encodeURIComponent(threadSlug)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete thread');
      }

      setThreads(prev => prev.filter(t => t.slug !== threadSlug));
      
      if (currentThreadSlug === threadSlug) {
        const remainingThreads = threads.filter(t => t.slug !== threadSlug);
        if (remainingThreads.length > 0) {
          handleSelectThread(remainingThreads[0].slug);
        } else {
          handleNewThread();
        }
      }
      
      console.log('✅ Thread deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete thread:', error);
      toast.error('Failed to delete thread');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    // Ensure a thread exists before sending (for persistence)
    let threadToUse = currentThreadSlug;
    if (!threadToUse) {
      const created = await handleNewThread();
      if (!created) return;
      threadToUse = created;
    }

    console.log('📤 Sending message:', {
      message: chatInput,
      threadSlug: threadToUse,
      workspaceSlug: dashboardChatTarget,
    });

    onSendMessage(chatInput, threadToUse);
    setChatInput("");
  };

  // Enhance prompt using AI
  const [enhancing, setEnhancing] = useState(false);
  const handleEnhanceOnly = async () => {
    if (!chatInput.trim() || isLoading || enhancing) return;
    try {
      setEnhancing(true);
      
      // ✅ Use dedicated enhance-prompt endpoint
      const resp = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: chatInput,
        })
      });
      
      if (!resp.ok) {
        const msg = await resp.text().catch(() => '');
        throw new Error(msg || `Enhancer error ${resp.status}`);
      }
      
      const data = await resp.json();
      const enhanced = data.enhancedPrompt;
      
      if (!enhanced || !enhanced.trim()) {
        toast.error('Enhancer returned empty text');
        return;
      }
      
      setChatInput(enhanced.trim());
      toast.success('Prompt enhanced');
    } catch (e) {
      console.error('Enhance failed:', e);
      toast.error('Failed to enhance your prompt.');
    } finally {
      setEnhancing(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Helper function to safely format thread dates
  const formatThreadDate = (dateString: string | number | null | undefined): string => {
    if (!dateString) return 'Recent';
    
    try {
      // Handle both Unix timestamps (numbers/number strings) and ISO strings
      const timestamp = typeof dateString === 'string' && !isNaN(Number(dateString))
        ? Number(dateString) * 1000 // Convert Unix timestamp to milliseconds
        : dateString;
      
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Recent';
      
      // Format as readable date
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
      });
    } catch (e) {
      return 'Recent';
    }
  };

  const currentWorkspaceName = availableWorkspaces.find(w => w.slug === dashboardChatTarget)?.name || '🎯 All SOWs (Master)';
  const isMasterView = dashboardChatTarget === 'sow-master-dashboard';
  const personaName = isMasterView ? 'Analytics Assistant' : 'The Architect';
  const personaSubtitle = isMasterView ? 'Master Dashboard' : 'Client Workspace';

  return (
    <div className="h-full w-full min-w-0 bg-[#0e0f0f] border-l border-[#0E2E33] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#0E2E33] bg-[#0e0f0f] flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white truncate">Dashboard Chat</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleNewThread}
              className="bg-[#15a366] hover:bg-[#10a35a] text-white text-xs h-6 px-2 flex-shrink-0"
              size="sm"
              title="New analytics chat thread (Master Dashboard)"
              aria-label="New analytics chat thread (Master Dashboard)"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              onClick={handleToggleThreads}
              className="bg-[#1c1c1c] hover:bg-[#222] text-white text-xs h-6 px-2 border border-[#2a2a2a] flex-shrink-0"
              size="sm"
              title="View threads"
            >
              📋
            </Button>
            <Button
              onClick={onToggle}
              className="bg-[#1c1c1c] hover:bg-[#222] text-white text-xs h-6 px-2 border border-[#2a2a2a] flex-shrink-0"
              size="sm"
              title="Hide chat panel"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Workspace Selector */}
        <div className="mt-3">
          <Select
            value={dashboardChatTarget}
            onValueChange={onDashboardWorkspaceChange}
            disabled={loadingThreads}
          >
            <SelectTrigger className="w-full bg-[#1c1c1c] border-[#2a2a2a] text-white h-8 text-xs">
              <SelectValue placeholder="Select workspace..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1c1c1c] border-[#2a2a2a] text-white">
              {availableWorkspaces.map((workspace) => (
                <SelectItem key={workspace.slug} value={workspace.slug}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Thread List */}
      {showThreadList && (
        <div className="bg-[#0E2E33] border-b border-[#0E2E33] max-h-48 overflow-y-auto">
          <div className="p-2 space-y-1">
            {threads.length === 0 ? (
              <div className="text-xs text-gray-300 px-2 py-3">
                No threads yet. Click the "+" to create one.
              </div>
            ) : threads.map(thread => (
              <div
                key={thread.slug}
                className={`group flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                  currentThreadSlug === thread.slug 
                    ? 'bg-[#0E2E33] text-white' 
                    : 'text-gray-300 hover:bg-[#0e0f0f]'
                }`}
              >
                <button
                  onClick={() => handleSelectThread(thread.slug)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span>{currentThreadSlug === thread.slug ? '●' : '○'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{thread.name}</div>
                      <div className="text-[10px] opacity-60">{formatThreadDate(thread.createdAt)}</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteThread(thread.slug)}
                  className="opacity-0 group-hover:opacity-100 px-2 hover:text-red-400"
                  title="Delete thread"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persona Badge */}
      <div className="p-3 border-b border-[#0E2E33]">
        <div className="flex items-center gap-2 bg-[#0E2E33] px-3 py-2 rounded-md">
          <Bot className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-white">{personaName}</span>
          <span className="ml-2 text-xs text-gray-400">{personaSubtitle}</span>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {(!showAllMessages && chatMessages.length > MAX_MESSAGES) && (
            <div className="flex items-center justify-between text-xs text-gray-400 bg-[#0E2E33] border border-[#1b5e5e] px-3 py-2 rounded">
              <span>
                Showing last {MAX_MESSAGES} of {chatMessages.length} messages
              </span>
              <button
                onClick={() => setShowAllMessages(true)}
                className="underline hover:text-white"
              >
                Show all
              </button>
            </div>
          )}
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <Bot className="h-16 w-16 text-gray-600 mb-3" />
              <h3 className="text-xl font-semibold text-white mb-2">Master SOW Analytics</h3>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                Query your embedded SOWs and get business insights. I cannot create new SOWs.
              </p>
            </div>
          ) : (
            (showAllMessages ? chatMessages : chatMessages.slice(-MAX_MESSAGES)).map((msg) => {
              const cleaned = cleanSOWContent(msg.content);
              const segments = msg.role === 'assistant' ? [] : [{ type: 'text' as const, content: msg.content }];
              return (
                <div key={msg.id} className={`flex min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative w-full max-w-[85%] min-w-0 rounded-xl px-4 py-3 break-words whitespace-pre-wrap overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-[#0E2E33]/30 text-white border border-[#1b5e5e]'
                      : 'bg-[#1b1b1e] text-white border border-[#0E2E33]'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="mb-4">
                        <StreamingThoughtAccordion 
                          content={msg.content}
                          messageId={msg.id}
                          isStreaming={streamingMessageId === msg.id}
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      {segments.map((seg, i) => (
                        <div
                          key={i}
                          className="prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 break-words whitespace-pre-wrap prose-pre:whitespace-pre-wrap prose-pre:overflow-x-auto"
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {seg.content}
                          </ReactMarkdown>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2 sticky bottom-0 z-10 bg-[#1b1b1e]/80 backdrop-blur-sm px-2 py-1 rounded-md border-t border-[#0E2E33]">
                      <span className="text-xs opacity-60 flex-1">{formatTimestamp(msg.timestamp)}</span>
                      {/* NO INSERT BUTTON IN DASHBOARD MODE - Query only */}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-5 border-t border-[#0E2E33] bg-[#0e0f0f]">
        <div className="flex items-end gap-3">
          <Textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (chatInput.trim() && !isLoading) {
                  handleSendMessage();
                }
              }
            }}
            placeholder="Ask a question about an existing SOW..."
            className="min-h-[80px] resize-none bg-[#1b1b1e] border-[#0E2E33] text-white placeholder:text-gray-500"
            disabled={isLoading}
          />
          {/* Dashboard Analytics: Only Send button, NO enhance */}
          <Button 
            onClick={() => {
              if (chatInput.trim() && !isLoading) {
                handleSendMessage();
              }
            }}
            disabled={!chatInput.trim() || isLoading}
            className="self-end bg-[#15a366] hover:bg-[#10a35a] text-white border-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
