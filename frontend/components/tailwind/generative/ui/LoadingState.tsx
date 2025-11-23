"use client";

import { Loader2, Sparkles, Brain, Wand2 } from "lucide-react";

interface LoadingStateProps {
  stage?: "thinking" | "generating" | "formatting" | "finishing";
  className?: string;
}

const stageConfig = {
  thinking: {
    icon: Brain,
    label: "Understanding your request...",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  generating: {
    icon: Wand2,
    label: "Generating content...",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  formatting: {
    icon: Sparkles,
    label: "Formatting response...",
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  finishing: {
    icon: Sparkles,
    label: "Almost done...",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
};

export function LoadingState({ stage = "generating", className = "" }: LoadingStateProps) {
  const config = stageConfig[stage];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={config.label}
    >
      <Icon className={`h-5 w-5 ${config.color} animate-pulse`} />
      <div className="flex-1">
        <p className={`font-medium ${config.color.replace("text-", "text-").replace("500", "900")}`}>
          {config.label}
        </p>
        <div className="flex gap-1 mt-2">
          <span
            className={`w-2 h-2 ${config.color.replace("text-", "bg-")} rounded-full animate-bounce`}
            style={{ animationDelay: "0ms" }}
          />
          <span
            className={`w-2 h-2 ${config.color.replace("text-", "bg-")} rounded-full animate-bounce`}
            style={{ animationDelay: "150ms" }}
          />
          <span
            className={`w-2 h-2 ${config.color.replace("text-", "bg-")} rounded-full animate-bounce`}
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
