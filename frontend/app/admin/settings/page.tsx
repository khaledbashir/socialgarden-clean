'use client';

import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Eye, EyeOff, Search, Filter as FilterIcon, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  visible: boolean;
  icon: string;
}

interface AIModel {
  id: string;
  name: string;
  isFree: boolean;
}

export default function SettingsPage() {
  // Inline Editor AI (uses OpenRouter directly)
  const [inlineEditorModel, setInlineEditorModel] = useState('openai/gpt-oss-20b:free');
  const [quickActionsEnabled, setQuickActionsEnabled] = useState(true);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([
    { id: '1', label: 'Improve Writing', prompt: 'Improve the writing quality and clarity', visible: true, icon: 'Sparkles' },
    { id: '2', label: 'Shorten', prompt: 'Make this shorter and more concise', visible: true, icon: 'ArrowDownWideNarrow' },
    { id: '3', label: 'Elaborate', prompt: 'Add more details and expand this', visible: true, icon: 'WrapText' },
    { id: '4', label: 'More formal', prompt: 'Rewrite in a more formal, professional tone', visible: true, icon: 'Briefcase' },
    { id: '5', label: 'More casual', prompt: 'Rewrite in a casual, friendly tone', visible: true, icon: 'MessageCircle' },
    { id: '6', label: 'Bulletize', prompt: 'Convert this into bullet points', visible: true, icon: 'List' },
    { id: '7', label: 'Summarize', prompt: 'Create a concise summary', visible: true, icon: 'FileText' },
    { id: '8', label: 'Rewrite', prompt: 'Rewrite this in a different way', visible: true, icon: 'RotateCcw' },
  ]);
  const [newActionLabel, setNewActionLabel] = useState('');
  const [newActionPrompt, setNewActionPrompt] = useState('');
  const [showNewActionForm, setShowNewActionForm] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  
  // Model Selector States (only for Inline Editor)
  const [inlineShowFreeOnly, setInlineShowFreeOnly] = useState(false);
  const [inlineSearchQuery, setInlineSearchQuery] = useState('');
  const [allModels, setAllModels] = useState<AIModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  // Fetch all available models from API
  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const modelsData = await response.json();
      
      // Transform API response to AIModel format
      const transformed: AIModel[] = Array.isArray(modelsData) 
        ? modelsData.map((model: any) => ({
            id: model.id || model.model_id || '',
            name: model.name || model.id || '',
            isFree: model.pricing?.input === 0 || model.free === true || model.id?.includes(':free')
          }))
        : [];
      
      setAllModels(transformed.length > 0 ? transformed : getDefaultModels());
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setAllModels(getDefaultModels());
    } finally {
      setLoadingModels(false);
    }
  };

  const getDefaultModels = (): AIModel[] => [
    { id: 'openai/gpt-oss-20b:free', name: 'OpenAI GPT OSS 20B (Free)', isFree: true },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', isFree: true },
    { id: 'meta-llama/llama-3.1-70b-instruct:free', name: 'Llama 3.1 70B (Free)', isFree: true },
    { id: 'mistralai/mistral-large:free', name: 'Mistral Large (Free)', isFree: true },
    { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek Chat (Free)', isFree: true },
  ];

  // Load settings and fetch models on mount
  useEffect(() => {
    fetchModels();
    
    const saved = localStorage.getItem('ai-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setInlineEditorModel(settings.inlineEditorModel || 'openai/gpt-oss-20b:free');
        setQuickActionsEnabled(settings.quickActionsEnabled !== false);
        setQuickActions(settings.quickActions || quickActions);
      } catch (e) {
        console.log('Failed to load settings');
      }
    }
  }, []);

  const handleSaveSettings = () => {
    const settings = {
      inlineEditorModel,
      quickActionsEnabled,
      quickActions,
    };
    localStorage.setItem('ai-settings', JSON.stringify(settings));
    setIsSaved(true);
    toast.success('Settings saved!');
  };

  const handleAddAction = () => {
    if (!newActionLabel.trim() || !newActionPrompt.trim()) {
      toast.error('Please fill in both label and prompt');
      return;
    }

    const newAction: QuickAction = {
      id: Date.now().toString(),
      label: newActionLabel,
      prompt: newActionPrompt,
      visible: true,
      icon: 'Sparkles',
    };

    setQuickActions([...quickActions, newAction]);
    setNewActionLabel('');
    setNewActionPrompt('');
    setShowNewActionForm(false);
    setIsSaved(false);
    toast.success('Action added!');
  };

  const handleDeleteAction = (id: string) => {
    setQuickActions(quickActions.filter(a => a.id !== id));
    setIsSaved(false);
    toast.success('Action removed');
  };

  const handleToggleVisible = (id: string) => {
    setQuickActions(quickActions.map(a =>
      a.id === id ? { ...a, visible: !a.visible } : a
    ));
    setIsSaved(false);
  };

  const handleModelChange = (newModel: string, target: 'inline') => {
    if (target === 'inline') {
      setInlineEditorModel(newModel);
    }
    setIsSaved(false);
  };

  const handleQuickActionsToggle = (enabled: boolean) => {
    setQuickActionsEnabled(enabled);
    setIsSaved(false);
  };

  // Model Selector Component - Proper Dropdown
  const ModelSelector = ({ 
    selectedModel, 
    onModelChange, 
    searchQuery, 
    onSearchChange,
    showFreeOnly,
    onToggleFreeOnly
  }: {
    selectedModel: string;
    onModelChange: (model: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    showFreeOnly: boolean;
    onToggleFreeOnly: (show: boolean) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const filteredModels = allModels.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           model.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFree = !showFreeOnly || model.isFree;
      return matchesSearch && matchesFree;
    });

    const selectedModelData = allModels.find(m => m.id === selectedModel);

    return (
      <div className="relative w-full">
        {/* Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loadingModels}
          className="w-full px-4 py-3 bg-zinc-900 border border-[#1FE18E]/20 rounded-lg text-white text-left flex items-center justify-between hover:border-[#1FE18E]/50 transition-all disabled:opacity-50"
        >
          <div className="flex-1 min-w-0">
            {loadingModels ? (
              <>
                <p className="font-medium text-gray-400">Loading models...</p>
                <p className="text-xs text-gray-600">Fetching available AI models</p>
              </>
            ) : (
              <>
                <p className="font-medium truncate">{selectedModelData?.name || 'Select a model'}</p>
                <p className="text-xs text-gray-500 truncate">{selectedModelData?.id}</p>
              </>
            )}
          </div>
          <div className={`ml-2 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-[#1FE18E]/20 rounded-lg shadow-2xl z-50">
            {/* Search Bar */}
            <div className="p-3 border-b border-[#1FE18E]/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black border border-[#1FE18E]/20 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#1FE18E]"
                  autoFocus
                />
              </div>
            </div>

            {/* Free Filter Toggle */}
            <div className="px-3 py-2 border-b border-[#1FE18E]/10 flex items-center gap-2">
              <button
                onClick={() => onToggleFreeOnly(!showFreeOnly)}
                className={`px-3 py-1 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium ${
                  showFreeOnly
                    ? 'bg-[#1FE18E]/20 border-[#1FE18E] text-[#1FE18E]'
                    : 'bg-transparent border-[#1FE18E]/20 text-gray-400 hover:border-[#1FE18E]/50'
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                Free Only
              </button>
              {showFreeOnly && (
                <span className="text-xs text-gray-500 ml-auto">
                  {filteredModels.length} / {allModels.filter(m => m.isFree).length} free
                </span>
              )}
              {!showFreeOnly && (
                <span className="text-xs text-gray-500 ml-auto">
                  {filteredModels.length} / {allModels.length} total
                </span>
              )}
            </div>

            {/* Model List */}
            <div className="max-h-[320px] overflow-y-auto">
              {filteredModels.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No models found</p>
                </div>
              ) : (
                filteredModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                      onSearchChange('');
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-[#1FE18E]/5 transition-all flex items-center gap-3 hover:bg-black/50 ${
                      selectedModel === model.id
                        ? 'bg-[#1FE18E]/10 text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {selectedModel === model.id && (
                      <CheckCircle2 className="w-5 h-5 text-[#1FE18E] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{model.name}</p>
                      <p className="text-xs text-gray-500 truncate">{model.id}</p>
                    </div>
                    {model.isFree && (
                      <span className="px-2 py-1 bg-[#1FE18E]/20 text-[#1FE18E] rounded text-xs font-medium flex-shrink-0">
                        Free
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Close dropdown when clicking outside */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-[#1FE18E]/20 shadow-lg">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1FE18E]/20 rounded-lg">
              <Settings className="h-8 w-8 text-[#1FE18E]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">AI Settings</h1>
              <p className="text-gray-500 mt-2">Configure your AI models and inline editor preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12 space-y-8">
        
        {/* SECTION: Inline Editor AI */}
        <div className="bg-zinc-900 border border-[#1FE18E]/20 rounded-lg shadow-lg p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Inline Editor AI</h2>
            <p className="text-gray-500 mb-6">Select the AI model and configure quick actions for the inline editor</p>
          </div>

          {/* Model Selection */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">AI Model</h3>
            <ModelSelector
              selectedModel={inlineEditorModel}
              onModelChange={(model) => handleModelChange(model, 'inline')}
              searchQuery={inlineSearchQuery}
              onSearchChange={setInlineSearchQuery}
              showFreeOnly={inlineShowFreeOnly}
              onToggleFreeOnly={setInlineShowFreeOnly}
            />
          </div>

          <div className="border-t border-[#1FE18E]/10 pt-6">
            {/* Quick Actions Settings */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quickActionsEnabled}
                  onChange={(e) => handleQuickActionsToggle(e.target.checked)}
                  className="w-4 h-4 accent-[#1FE18E] rounded"
                />
                <span className="text-sm font-medium text-gray-300">Enable quick actions</span>
              </label>
            </div>

            <p className="text-gray-500 mb-6">Manage the quick action buttons that appear in the inline editor:</p>

            {/* Actions List */}
            <div className="space-y-3 mb-8">
              {quickActions.map(action => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-[#1FE18E]/10 hover:border-[#1FE18E]/30 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{action.label}</p>
                    <p className="text-sm text-gray-500 mt-1">{action.prompt}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={() => handleToggleVisible(action.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        action.visible
                          ? 'bg-[#1FE18E]/20 text-[#1FE18E]'
                          : 'bg-gray-700/30 text-gray-500'
                      }`}
                      title={action.visible ? 'Hide action' : 'Show action'}
                    >
                      {action.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteAction(action.id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      title="Delete action"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Action Form */}
            {!showNewActionForm ? (
              <button
                onClick={() => setShowNewActionForm(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-[#1FE18E] text-[#1FE18E] rounded-lg hover:bg-[#1FE18E]/5 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Custom Action
              </button>
            ) : (
              <div className="p-4 bg-black/50 rounded-lg border border-[#1FE18E]/20">
                <h4 className="font-medium text-white mb-4">Create New Action</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Action Label</label>
                    <input
                      type="text"
                      value={newActionLabel}
                      onChange={(e) => setNewActionLabel(e.target.value)}
                      placeholder="e.g., Make it funny"
                      className="w-full px-4 py-2 border border-[#1FE18E]/20 bg-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1FE18E] focus:border-transparent text-white placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prompt/Command</label>
                    <textarea
                      value={newActionPrompt}
                      onChange={(e) => setNewActionPrompt(e.target.value)}
                      placeholder="e.g., Rewrite this to be funny and entertaining"
                      rows={3}
                      className="w-full px-4 py-2 border border-[#1FE18E]/20 bg-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1FE18E] focus:border-transparent text-white placeholder-gray-600 resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddAction}
                      className="flex-1 px-4 py-2 bg-[#1FE18E] text-black rounded-lg hover:bg-[#1FE18E]/90 transition-colors font-medium"
                    >
                      Add Action
                    </button>
                    <button
                      onClick={() => {
                        setShowNewActionForm(false);
                        setNewActionLabel('');
                        setNewActionPrompt('');
                      }}
                      className="flex-1 px-4 py-2 border border-[#1FE18E]/30 text-[#1FE18E] rounded-lg hover:bg-[#1FE18E]/5 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          {!isSaved && (
            <p className="text-sm text-orange-400 font-medium">You have unsaved changes</p>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={isSaved}
            className="ml-auto px-8 py-3 bg-[#1FE18E] text-black rounded-lg hover:bg-[#1FE18E]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSaved ? 'Settings Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
