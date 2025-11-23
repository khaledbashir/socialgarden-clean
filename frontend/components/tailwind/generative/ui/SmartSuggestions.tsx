"use client";

import { Button } from "../../ui/button";
import { type PromptTemplate } from "../utils/templates";
import { Sparkles } from "lucide-react";

interface SmartSuggestionsProps {
  suggestions: PromptTemplate[];
  onSelectTemplate: (template: PromptTemplate) => void;
  className?: string;
}

export function SmartSuggestions({
  suggestions,
  onSelectTemplate,
  className = "",
}: SmartSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span>Suggested Actions</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            size="sm"
            onClick={() => onSelectTemplate(template)}
            className="h-auto py-2 px-3 flex flex-col items-start gap-1 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center gap-2 w-full">
              <span className="text-lg">{template.icon}</span>
              <span className="text-xs font-medium text-left flex-1">
                {template.name}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 text-left">
              {template.description}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
