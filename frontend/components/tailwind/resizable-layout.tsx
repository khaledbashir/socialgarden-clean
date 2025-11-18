"use client";

import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Menu, Sparkles } from "lucide-react";

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  mainPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  children?: React.ReactNode;
  leftMinSize?: number;
  mainMinSize?: number;
  rightMinSize?: number;
  leftDefaultSize?: number;
  mainDefaultSize?: number;
  rightDefaultSize?: number;
  sidebarOpen?: boolean;
  aiChatOpen?: boolean;
  onToggleSidebar?: () => void;
  onToggleAiChat?: () => void;
  viewMode?: 'editor' | 'dashboard' | 'ai-management'; // NEW: Context awareness
}

export function ResizableLayout({
  leftPanel,
  mainPanel,
  rightPanel,
  children,
  leftMinSize = 15,
  mainMinSize = 30,
  rightMinSize = 20,
  leftDefaultSize = 20,
  mainDefaultSize = 55,
  rightDefaultSize = 25,
  sidebarOpen = true,
  aiChatOpen = true,
  onToggleSidebar,
  onToggleAiChat,
  viewMode = 'editor', // Default to editor mode
}: ResizableLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [chatWidth, setChatWidth] = useState(384); // w-96 = 384px
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = chatWidth;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = resizeStartXRef.current - e.clientX; // Negative = wider
      const newWidth = Math.max(320, resizeStartWidthRef.current + delta); // Min 320px
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!mounted) return null;

  return (
    <div className="h-screen w-screen flex flex-col relative">
      {/* PERSISTENT LEFT SIDEBAR TOGGLE TAB - ALWAYS VISIBLE */}
      {!sidebarOpen && (
        <button
          onClick={onToggleSidebar}
          className="fixed left-0 top-20 z-40 bg-[#1CBF79] hover:bg-[#15a366] text-black p-2 rounded-r-lg transition-all duration-300 shadow-lg"
          title="Open sidebar"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* PERSISTENT RIGHT SIDEBAR TOGGLE TAB - HIDDEN WHEN NO RIGHT PANEL OR IN AI MANAGEMENT */}
      {rightPanel && !aiChatOpen && viewMode !== 'ai-management' && (
        <button
          onClick={onToggleAiChat}
          className="fixed right-0 top-20 z-40 bg-[#1CBF79] hover:bg-[#15a366] text-black p-2 rounded-l-lg transition-all duration-300 shadow-lg"
          title="Open AI chat"
          aria-label="Open AI chat"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* MAIN FLEX CONTAINER - LEFT | EDITOR | CHAT - NO GAP */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - FIXED WIDTH OR 0 */}
        <div 
          className={`h-full overflow-y-auto overflow-x-hidden flex-shrink-0 border-r border-gray-700 transition-all duration-300 ${
            sidebarOpen ? 'w-80' : 'w-0 border-r-0'
          }`}
        >
          {sidebarOpen && leftPanel}
        </div>

        {/* MIDDLE EDITOR - GROWS TO FILL SPACE - NO LEFT MARGIN/PADDING */}
        <div 
          className={`flex-1 h-full overflow-hidden min-w-0 flex flex-col transition-all duration-300 ml-0`}
        >
          {mainPanel || children}
        </div>

        {/* RESIZABLE RIGHT CHAT PANEL */}
        {rightPanel && (
          <div className="relative flex">
            {/* Drag Handle */}
            {aiChatOpen && (
              <div
                onMouseDown={handleResizeStart}
                className={`w-1 bg-[#1CBF79] hover:bg-[#10a35a] cursor-col-resize transition-colors ${
                  isResizing ? 'bg-[#10a35a]' : ''
                }`}
                title="Drag to resize chat panel"
              />
            )}
            {/* Chat Panel */}
            <div 
              className={`h-full overflow-hidden flex-shrink-0 border-l border-gray-700 transition-all duration-300 bg-gray-950 ${
                aiChatOpen ? 'border-l' : 'w-0 border-l-0'
              }`}
              style={{
                width: aiChatOpen ? `${chatWidth}px` : '0px',
              }}
            >
              {aiChatOpen && rightPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
