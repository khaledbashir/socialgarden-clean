// Safe date formatter to avoid "Invalid Date"
const safeDate = (v: any): string => {
  if (!v) return 'Recent';
  try {
    const ts = (typeof v === 'string' && !isNaN(Number(v))) ? Number(v) * 1000 : v; // unix seconds or ISO
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recent';
  }
};
/**
 * Conversation History Panel Component
 * Displays list of all conversations with +New Chat button
 * Allows clicking on past conversations to load history
 */

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Plus, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { Input } from './ui/input';

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface ConversationHistoryPanelProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
  onRenameConversation?: (conversationId: string, newTitle: string) => Promise<void>;
  isLoading?: boolean;
}

export function ConversationHistoryPanel({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  isLoading = false
}: ConversationHistoryPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleRenameClick = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveRename = async (conversationId: string) => {
    if (editTitle.trim() && onRenameConversation) {
      try {
        await onRenameConversation(conversationId, editTitle);
        setEditingId(null);
      } catch (error) {
        console.error('Failed to rename conversation:', error);
      }
    }
  };

  const handleDelete = async (conversationId: string) => {
    if (onDeleteConversation && window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await onDeleteConversation(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-3">Chats</h2>
        <Button
          onClick={onNewConversation}
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading && !conversations.length ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-gray-500 mt-2">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conversation, index) => (
              <div
                key={`${conversation.id}-${index}`}
                className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                  activeConversationId === conversation.id
                    ? 'bg-emerald-600/30 border border-emerald-600'
                    : 'hover:bg-slate-800 border border-transparent'
                }`}
              >
                {editingId === conversation.id ? (
                  // Edit mode
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Conversation title..."
                      className="bg-slate-900 text-white border-slate-700 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveRename(conversation.id)}
                        className="flex-1 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="flex-1 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <>
                    <div
                      onClick={() => onSelectConversation(conversation.id)}
                      className="flex items-start gap-2 min-w-0"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.message_count || 0} messages
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {safeDate(conversation.updated_at)}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons on hover */}
                    <div className="absolute top-2 right-2 gap-1 hidden group-hover:flex">
                      {onRenameConversation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameClick(conversation);
                          }}
                          className="p-1 hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(conversation.id);
                          }}
                          className="p-1 hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
