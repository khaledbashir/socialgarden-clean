"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { SHORTCUTS, getShortcutString } from "../utils/shortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">General</h4>
            <div className="space-y-2">
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.open)}
                description={SHORTCUTS.open.description}
              />
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.generate)}
                description={SHORTCUTS.generate.description}
              />
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.cancel)}
                description={SHORTCUTS.cancel.description}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Navigation</h4>
            <div className="space-y-2">
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.focusInput)}
                description={SHORTCUTS.focusInput.description}
              />
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.nextModel)}
                description={SHORTCUTS.nextModel.description}
              />
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.prevModel)}
                description={SHORTCUTS.prevModel.description}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
            <div className="space-y-2">
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.togglePreview)}
                description={SHORTCUTS.togglePreview.description}
              />
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.accept)}
                description={SHORTCUTS.accept.description}
              />
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.reject)}
                description={SHORTCUTS.reject.description}
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Other</h4>
            <div className="space-y-2">
              <ShortcutItem
                shortcut={getShortcutString(SHORTCUTS.toggleHistory)}
                description={SHORTCUTS.toggleHistory.description}
              />
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t text-xs text-gray-500">
          <p>💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">?</kbd> anytime to see this help</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutItem({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-700">{description}</span>
      <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
        {shortcut}
      </kbd>
    </div>
  );
}
