"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SelectionToolbarProps {
  onAskAI: () => void;
  isVisible: boolean;
}

export function SelectionToolbar({ onAskAI, isVisible }: SelectionToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Update toolbar position based on selection
  useEffect(() => {
    if (!isVisible || !toolbarRef.current) return;

    const updatePosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position toolbar above the selection, centered
      setPosition({
        top: rect.top + window.scrollY - 60,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-in fade-in duration-200 pointer-events-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      {/* Toolbar container - integrated design with button as part of the bar */}
      <div className="bg-[#0E0F0F] rounded-lg shadow-2xl border border-[#1FE18E]/30 overflow-hidden backdrop-blur-md pointer-events-auto">
        <button
          onClick={onAskAI}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`
            flex items-center gap-2 px-4 py-2.5 w-full
            font-semibold text-sm
            transition-all duration-300
            ${isHovering 
              ? 'bg-[#1FE18E] text-[#0E0F0F]' 
              : 'bg-[#0E0F0F] text-white'
            }
          `}
          title="Ask AI to help with selected text (Press Alt+A)"
        >
          <Sparkles className={`h-4 w-4 ${isHovering ? 'text-[#0E0F0F]' : 'text-[#1FE18E]'}`} />
          <span>ASK THE AI</span>
        </button>
      </div>
    </div>
  );
}
