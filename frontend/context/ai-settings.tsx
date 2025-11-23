import { createContext, useContext, useEffect, useState } from 'react';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  visible: boolean;
  icon: string;
}

export interface AISettings {
  aiModel: string;
  quickActionsEnabled: boolean;
  quickActions: QuickAction[];
}

interface AISettingsContextType {
  settings: AISettings;
  updateSettings: (settings: Partial<AISettings>) => void;
  updateModel: (model: string) => void;
  getVisibleQuickActions: () => QuickAction[];
}

const defaultSettings: AISettings = {
  aiModel: process.env.NEXT_PUBLIC_DEFAULT_AI_MODEL || 'openai/gpt-oss-20b:free',
  quickActionsEnabled: true,
  quickActions: [
    { id: '1', label: 'Improve Writing', prompt: 'Improve the writing quality and clarity', visible: true, icon: 'Sparkles' },
    { id: '2', label: 'Shorten', prompt: 'Make this shorter and more concise', visible: true, icon: 'ArrowDownWideNarrow' },
    { id: '3', label: 'Elaborate', prompt: 'Add more details and expand this', visible: true, icon: 'WrapText' },
    { id: '4', label: 'More formal', prompt: 'Rewrite in a more formal, professional tone', visible: true, icon: 'Briefcase' },
    { id: '5', label: 'More casual', prompt: 'Rewrite in a casual, friendly tone', visible: true, icon: 'MessageCircle' },
    { id: '6', label: 'Bulletize', prompt: 'Convert this into bullet points', visible: true, icon: 'List' },
    { id: '7', label: 'Summarize', prompt: 'Create a concise summary', visible: true, icon: 'FileText' },
    { id: '8', label: 'Rewrite', prompt: 'Rewrite this in a different way', visible: true, icon: 'RotateCcw' },
  ],
};

const AISettingsContext = createContext<AISettingsContextType | undefined>(undefined);

export function AISettingsProvider({ children }: { children: React.ReactNode }) {
  // Use database-backed preferences instead of localStorage
  const { preferences, updatePreferences, loading } = useUserPreferences();
  
  // Merge preferences with defaults
  const settings: AISettings = {
    aiModel: preferences['ai-settings-model'] || defaultSettings.aiModel,
    quickActionsEnabled: preferences['ai-settings-quickActionsEnabled'] !== undefined 
      ? preferences['ai-settings-quickActionsEnabled'] 
      : defaultSettings.quickActionsEnabled,
    quickActions: preferences['ai-settings-quickActions'] || defaultSettings.quickActions,
  };

  const updateSettings = async (newSettings: Partial<AISettings>) => {
    // Convert to preference keys and save to database
    const updates: Record<string, any> = {};
    if (newSettings.aiModel !== undefined) {
      updates['ai-settings-model'] = newSettings.aiModel;
    }
    if (newSettings.quickActionsEnabled !== undefined) {
      updates['ai-settings-quickActionsEnabled'] = newSettings.quickActionsEnabled;
    }
    if (newSettings.quickActions !== undefined) {
      updates['ai-settings-quickActions'] = newSettings.quickActions;
    }
    
    await updatePreferences(updates);
  };

  const updateModel = (model: string) => {
    updateSettings({ aiModel: model });
  };

  const getVisibleQuickActions = () => {
    if (!settings.quickActionsEnabled) return [];
    return settings.quickActions.filter(a => a.visible);
  };

  // Wait for preferences to load
  if (loading) {
    return <>{children}</>;
  }

  return (
    <AISettingsContext.Provider value={{ settings, updateSettings, updateModel, getVisibleQuickActions }}>
      {children}
    </AISettingsContext.Provider>
  );
}

export function useAISettings() {
  const context = useContext(AISettingsContext);
  if (!context) {
    throw new Error('useAISettings must be used within AISettingsProvider');
  }
  return context;
}
