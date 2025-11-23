import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  modifier?: ('Ctrl' | 'Cmd' | 'Alt' | 'Shift')[];
  description: string;
}

export interface ShortcutHandlers {
  onGenerate?: () => void;
  onCancel?: () => void;
  onOpen?: () => void;
  onFocusInput?: () => void;
  onNextModel?: () => void;
  onPrevModel?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onTogglePreview?: () => void;
  onToggleHistory?: () => void;
}

export const SHORTCUTS: Record<string, KeyboardShortcut> = {
  generate: {
    key: 'Enter',
    modifier: ['Ctrl', 'Cmd'],
    description: 'Generate with AI',
  },
  cancel: {
    key: 'Escape',
    description: 'Cancel or close',
  },
  open: {
    key: 'k',
    modifier: ['Ctrl', 'Cmd'],
    description: 'Open AI selector',
  },
  focusInput: {
    key: '/',
    description: 'Focus command input',
  },
  nextModel: {
    key: 'ArrowDown',
    description: 'Next model',
  },
  prevModel: {
    key: 'ArrowUp',
    description: 'Previous model',
  },
  accept: {
    key: 'Enter',
    modifier: ['Ctrl', 'Cmd'],
    description: 'Accept preview',
  },
  reject: {
    key: 'Escape',
    description: 'Reject preview',
  },
  togglePreview: {
    key: 'p',
    modifier: ['Ctrl', 'Cmd'],
    description: 'Toggle preview mode',
  },
  toggleHistory: {
    key: 'h',
    modifier: ['Ctrl', 'Cmd'],
    description: 'Toggle prompt history',
  },
};

function isModifierActive(e: KeyboardEvent, modifiers?: string[]): boolean {
  if (!modifiers || modifiers.length === 0) return true;
  
  return modifiers.some(mod => {
    switch (mod) {
      case 'Ctrl':
        return e.ctrlKey;
      case 'Cmd':
        return e.metaKey;
      case 'Alt':
        return e.altKey;
      case 'Shift':
        return e.shiftKey;
      default:
        return false;
    }
  });
}

function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement?.tagName === 'INPUT' ||
    activeElement?.tagName === 'TEXTAREA' ||
    activeElement?.getAttribute('contenteditable') === 'true'
  );
}

/**
 * Hook to handle keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Generate: Ctrl/Cmd + Enter
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();
        handlers.onGenerate?.();
        return;
      }

      // Cancel: Escape
      if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handlers.onCancel?.();
        return;
      }

      // Open: Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handlers.onOpen?.();
        return;
      }

      // Focus input: / (only if not already in input)
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault();
        handlers.onFocusInput?.();
        return;
      }

      // Navigate models: Arrow keys (only when in model picker)
      if (e.key === 'ArrowDown') {
        handlers.onNextModel?.();
        return;
      }

      if (e.key === 'ArrowUp') {
        handlers.onPrevModel?.();
        return;
      }

      // Toggle preview: Ctrl/Cmd + P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handlers.onTogglePreview?.();
        return;
      }

      // Toggle history: Ctrl/Cmd + H
      if ((e.ctrlKey || e.metaKey) && e.key === 'h' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handlers.onToggleHistory?.();
        return;
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get formatted shortcut string for display
 */
export function getShortcutString(shortcut: KeyboardShortcut): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const modifiers = shortcut.modifier?.map(mod => {
    if (mod === 'Cmd') return isMac ? '⌘' : 'Ctrl';
    if (mod === 'Ctrl') return isMac ? '⌃' : 'Ctrl';
    if (mod === 'Alt') return isMac ? '⌥' : 'Alt';
    if (mod === 'Shift') return '⇧';
    return mod;
  }) || [];
  
  const key = shortcut.key === 'Enter' ? '↵' : shortcut.key === 'Escape' ? 'Esc' : shortcut.key;
  
  return [...modifiers, key].join(' + ');
}
