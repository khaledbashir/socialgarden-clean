/**
 * Stateful Dashboard Chat Container
 * Manages all conversation state and integrates with backend APIs
 */

'use client';

import { useEffect, useState } from 'react';
import { ConversationHistoryPanel } from './conversation-history-panel';
import { MessageDisplayPanel } from './message-display-panel';
import { EnhancedDashboard } from './enhanced-dashboard';
import { SHOW_DASHBOARD_UI } from '@/config/featureFlags';

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface StatefulDashboardChatProps {
  userId?: string;
}

export function StatefulDashboardChat({ userId = 'default-user' }: StatefulDashboardChatProps = {}) {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // UI state
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all conversations for the user
   */
  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      setError(null);

      const response = await fetch('/api/dashboard/conversations', {
        headers: {
          'x-user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data.conversations || []);

      // Auto-select most recent conversation (server sorts by updated_at DESC)
      // No localStorage needed - server maintains order
      if (data.conversations && data.conversations.length > 0) {
        setActiveConversationId(data.conversations[0].id);
      }

      console.log(`✅ [STATEFUL DASHBOARD] Loaded ${data.conversations?.length || 0} conversations`);
    } catch (err) {
      console.error('❌ [STATEFUL DASHBOARD] Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  /**
   * Fetch messages for a specific conversation
   */
  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      setError(null);

      const response = await fetch(`/api/dashboard/conversations/${conversationId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      setMessages(data.messages || []);

      console.log(`✅ [STATEFUL DASHBOARD] Loaded ${data.messages?.length || 0} messages`);
    } catch (err) {
      console.error('❌ [STATEFUL DASHBOARD] Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Initial load: fetch conversations and restore most recent from SERVER
  useEffect(() => {
    fetchConversations();
  }, [userId]);

  // When active conversation changes, fetch its messages (no localStorage needed)
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, userId]);

  /**
   * Create a new conversation
   */
  const handleNewConversation = async () => {
    try {
      setError(null);

      const response = await fetch('/api/dashboard/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          title: `New Conversation - ${new Date().toLocaleString()}`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
      }

      const data = await response.json();
      const newConversation = data.conversation;

      console.log(`✅ [STATEFUL DASHBOARD] Created new conversation: ${newConversation.id}`);

      // Add to conversations and select it
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      setMessages([]);
    } catch (err) {
      console.error('❌ [STATEFUL DASHBOARD] Error creating conversation:', err);
      setError('Failed to create new conversation');
    }
  };

  /**
   * Send a message in the active conversation
   */
  const handleSendMessage = async (messageText: string) => {
    if (!activeConversationId || !messageText.trim()) {
      console.warn('⚠️ [STATEFUL DASHBOARD] No active conversation or empty message');
      return;
    }

    try {
      setIsSendingMessage(true);
      setError(null);

      console.log(`📤 [STATEFUL DASHBOARD] Sending message to conversation: ${activeConversationId}`);

      const response = await fetch(
        `/api/dashboard/conversations/${activeConversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: messageText
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();

      console.log(`✅ [STATEFUL DASHBOARD] Message sent successfully`);

      // Add both user and assistant messages to the UI
      setMessages(prev => [
        ...prev,
        data.user_message,
        data.assistant_message
      ]);

      // Update conversation's updated_at by re-fetching conversations
      await fetchConversations();
    } catch (err) {
      console.error('❌ [STATEFUL DASHBOARD] Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  /**
   * Delete a conversation
   */
    const handleDeleteConversation = async (id: string) => {
    console.log(`🗑️ [STATEFUL DASHBOARD] Deleting conversation: ${id}`);
    try {
      setIsLoadingConversations(true);
      const response = await fetch(`/api/dashboard/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Delete failed: ${response.status}`);
      }

      // Remove from state
      setConversations(conversations.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }

      console.log(`✅ [STATEFUL DASHBOARD] Conversation deleted successfully`);
    } catch (error) {
      console.error(`❌ [STATEFUL DASHBOARD] Error deleting conversation:`, error);
      setError('Failed to delete conversation');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    console.log(`✏️ [STATEFUL DASHBOARD] Renaming conversation: ${id} to "${newTitle}"`);
    try {
      const response = await fetch(`/api/dashboard/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Rename failed: ${response.status}`);
      }

      // Update in state
      setConversations(conversations.map(c =>
        c.id === id ? { ...c, title: newTitle, updated_at: new Date().toISOString() } : c
      ));

      console.log(`✅ [STATEFUL DASHBOARD] Conversation renamed successfully`);
    } catch (error) {
      console.error(`❌ [STATEFUL DASHBOARD] Error renaming conversation:`, error);
      setError('Failed to rename conversation');
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-screen bg-slate-900 gap-0">
      {/* Left Sidebar: Conversation History */}
      <div className="w-64 border-r border-slate-800 flex flex-col">
        <ConversationHistoryPanel
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Right Side: Main Content Area */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="bg-red-900/30 border-b border-red-800 text-red-300 px-4 py-2 text-sm">
            ⚠️ {error}
          </div>
        )}

        {activeConversationId ? (
          // Chat view when conversation is selected
          <div className="flex-1 flex gap-0">
            {/* Chat panel */}
            <div className="flex-1 flex flex-col">
              <MessageDisplayPanel
                messages={messages}
                isLoading={isSendingMessage}
                onSendMessage={handleSendMessage}
                conversationTitle={activeConversation?.title || 'Chat'}
                isEmpty={messages.length === 0}
              />
            </div>

            {/* Dashboard stats on the side for reference */}
            <div className="w-96 border-l border-slate-800 overflow-hidden">
              {SHOW_DASHBOARD_UI && <EnhancedDashboard />}
            </div>
          </div>
        ) : (
          // Empty state when no conversation selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-slate-800 p-4 rounded-full inline-block mb-4">
                <MessageSquare className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Conversation Selected</h3>
              <p className="text-gray-400 mb-4">Create a new chat to get started</p>
              <button
                onClick={handleNewConversation}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Import MessageSquare icon
import { MessageSquare } from 'lucide-react';
