"use client";

interface ThinkingIndicatorProps {
  label?: string;
  className?: string;
}

export function ThinkingIndicator({ 
  label = "AI is thinking", 
  className = "" 
}: ThinkingIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="status" aria-label={label}>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
  );
}
