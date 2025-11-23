import { EditorBubble, useEditor } from "novel";
import { removeAIHighlight } from "novel/extensions";
import { Fragment, type ReactNode, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import Magic from "../ui/icons/magic";
import { AISelector } from "./ai-selector";

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();
  const hasCompletionRef = useRef(false);

  useEffect(() => {
    console.log("🔍 [ASK AI POPUP] State changed - open:", open);
    if (!open) {
      removeAIHighlight(editor);
      hasCompletionRef.current = false;
    }
  }, [open, editor]);

  const handleOpenChange = (newOpen: boolean) => {
    console.log("🎯 [ASK AI POPUP] Open change requested - from:", open, "to:", newOpen);
    onOpenChange(newOpen);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    console.log("🎨 [ASK AI BUTTON] Clicked!");
    e.preventDefault();
    e.stopPropagation();
    handleOpenChange(!open);
  };

  const handleButtonMouseDown = (e: React.MouseEvent) => {
    console.log("🎨 [ASK AI BUTTON] Mouse down");
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top",
        
        // CRITICAL: Prevent hiding when interacting
        hideOnClick: false,
        interactive: true,
        appendTo: () => document.body,
        
        // Reasonable delay before hiding
        delay: [0, 300], // Shorter delay
        
        // Large interaction area
        interactiveBorder: 15,
        
        // Manual trigger
        trigger: 'manual',
        
        // Smooth animations
        duration: [200, 150],
        
        // Better positioning
        popperOptions: {
          modifiers: [
            {
              name: 'preventOverflow',
              options: {
                padding: 8,
                altAxis: true,
                tether: false,
              },
            },
          ],
        },
        
        // Prevent unwanted hiding
        onHide: (instance) => {
          console.log("❌ [ASK AI POPUP] Hide attempt");
          return false; // Never auto-hide
        },
        
        onHidden: () => {
          console.log("🔒 [ASK AI POPUP] Fully hidden");
          if (!open) {
            editor?.chain().unsetHighlight().run();
          }
        },
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && (
        <div>
          <AISelector open={open} onOpenChange={handleOpenChange} />
        </div>
      )}
      {!open && (
        <Fragment>
          <Button
            className="gap-1 rounded-none text-purple-500"
            variant="ghost"
            onClick={handleButtonClick}
            onMouseDown={handleButtonMouseDown}
            size="sm"
          >
            <Magic className="h-5 w-5" />
            Ask AI
          </Button>
          {children}
        </Fragment>
      )}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;
