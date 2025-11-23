"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface SuccessAnimationProps {
  message?: string;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export function SuccessAnimation({
  message = "Generated successfully!",
  onComplete,
  duration = 2000,
  className = "",
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />
      <div className="flex-1">
        <p className="font-medium text-green-900">{message}</p>
      </div>
      <Sparkles className="h-4 w-4 text-green-400 animate-pulse" />
    </div>
  );
}
