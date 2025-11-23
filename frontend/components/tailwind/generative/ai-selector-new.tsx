"use client";

import { useCompletion } from "ai/react";
import { 
  Sparkles, 
  Loader2,
  Check,
  Search,
  X,
  Zap,
  ArrowUp,
  Briefcase,
  MessageCircle,
  Code2
} from "lucide-react";
import { useEditor } from "novel";
import { addAIHighlight } from "novel/extensions";
import { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import AICompletionCommands from "./ai-completion-command";
import { Input } from "../ui/input";
import { useUserPreferences } from "@/hooks/use-user-preferences";

interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

interface AISelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISelector({ onOpenChange }: AISelectorProps) {
  const { editor } = useEditor();
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use database-backed preferences instead of localStorage
  const { preferences, updatePreference, loading: prefsLoading } = useUserPreferences();
  
  const selectedModel = preferences['ai-selector-model'] || "anthropic/claude-3.5-sonnet";
  const showFreeOnly = preferences['ai-selector-free-only'] === true;

  const { completion, complete, isLoading } = useCompletion({
    api: "/api/generate",
    onResponse: (response) => {
      if (response.status === 429) {
        toast.error("Rate limit reached. Please try again later.");
        return;
      }
    },
    onError: (e) => {
      console.error("AI Error:", e);
      toast.error(e.message || "Failed to generate. Please try again.");
    },
  });

  const hasCompletion = completion.length > 0;

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current && !hasCompletion) {
      inputRef.current.focus();
    }
  }, [hasCompletion]);

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch("/api/models");
      if (!response.ok) throw new Error("Failed to fetch models");
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error("Model fetch error:", error);
      setModels([
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
        { id: "openai/gpt-4o", name: "GPT-4o" },
        { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo" },
      ]);
    } finally {
      setLoadingModels(false);
    }
  };

  const filteredModels = models
    .filter((model) => {
      const isFree = !model.pricing?.prompt || parseFloat(model.pricing.prompt) === 0;
      return !showFreeOnly || isFree;
    })
    .filter((model) => 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleModelSelect = (modelId: string) => {
    // Save to database instead of localStorage
    updatePreference('ai-selector-model', modelId);
    setShowModelPicker(false);
    const modelName = models.find(m => m.id === modelId)?.name;
    toast.success(`Switched to ${modelName}`);
  };

  const toggleFreeFilter = () => {
    // Save to database instead of localStorage
    const newValue = !showFreeOnly;
    updatePreference('ai-selector-free-only', newValue);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      const slice = editor.state.selection.content();
      const selectedText = editor.storage.markdown.serializer.serialize(slice.content);

      await complete(selectedText, {
        body: { 
          option: "zap", 
          command: prompt, 
          model: selectedModel 
        },
      });

      setPrompt("");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate. Please try again.");
    }
  };

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="w-[500px] bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Completion Display */}
      {hasCompletion && (
        <div className="max-h-[350px] border-b">
          <ScrollArea className="h-full">
            <div className="prose prose-sm dark:prose-invert p-4 max-w-none">
              <Markdown>{completion}</Markdown>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-3 px-4 py-4 bg-purple-500/5 border-b">
          <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
          <span className="text-sm text-purple-500 font-medium">AI is generating...</span>
        </div>
      )}

      {/* Main Input Area */}
      {!isLoading && (
        <div className="p-4 space-y-3">
          {/* Tone Quick Actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Quick Tone:</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 flex-1"
              onClick={() => {
                setPrompt("Rewrite this in a corporate, professional, and business-appropriate tone. Use formal language and maintain authority.");
                handleGenerate();
              }}
            >
              <Briefcase className="h-3 w-3" />
              Corporate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 flex-1"
              onClick={() => {
                setPrompt("Rewrite this in a friendly, casual, conversational tone. Make it warm and approachable while staying clear.");
                handleGenerate();
              }}
            >
              <MessageCircle className="h-3 w-3" />
              Casual
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 flex-1"
              onClick={() => {
                setPrompt("Rewrite this in a precise, technical tone. Use industry terminology and be specific and analytical.");
                handleGenerate();
              }}
            >
              <Code2 className="h-3 w-3" />
              Technical
            </Button>
          </div>

          {/* Prompt Input */}
          <div className="relative">
            <Input
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Tell AI what to do... (e.g., 'turn this into a table', 'make it funny', 'fix grammar')"
              className="pr-10 h-11"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-purple-500 hover:bg-purple-600"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1 justify-between h-9 text-xs"
              onClick={() => setShowModelPicker(!showModelPicker)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                <span className="truncate">{selectedModelData?.name || "Select Model"}</span>
              </div>
              <span className="text-muted-foreground text-[10px]">
                {filteredModels.length} models
              </span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Model Picker Dropdown */}
          {showModelPicker && (
            <div className="border rounded-lg bg-background shadow-lg">
              {/* Search & Filter */}
              <div className="p-3 space-y-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
                <Button
                  variant={showFreeOnly ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFreeFilter}
                  className="w-full h-7 text-xs"
                >
                  {showFreeOnly ? <Check className="h-3 w-3 mr-1" /> : null}
                  {showFreeOnly ? "Showing Free Only" : "Show Free Models"}
                </Button>
              </div>

              {/* Models List */}
              <ScrollArea className="h-[250px]">
                <div className="p-2">
                  {loadingModels ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredModels.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground py-8">
                      No models found
                    </p>
                  ) : (
                    filteredModels.map((model) => {
                      const isSelected = model.id === selectedModel;
                      const isFree = !model.pricing?.prompt || parseFloat(model.pricing.prompt) === 0;
                      
                      return (
                        <button
                          key={model.id}
                          onClick={() => handleModelSelect(model.id)}
                          className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                            isSelected 
                              ? 'bg-purple-500/10 border border-purple-500/50' 
                              : 'hover:bg-accent'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isSelected && <Check className="h-3 w-3 text-purple-500 shrink-0" />}
                              <span className="font-medium truncate">{model.name}</span>
                            </div>
                            {isFree ? (
                              <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded shrink-0">
                                FREE
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                ${parseFloat(model.pricing?.prompt || "0").toFixed(4)}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {model.id}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Completion Actions */}
          {hasCompletion && (
            <AICompletionCommands
              onDiscard={() => {
                editor.chain().unsetHighlight().focus().run();
                onOpenChange(false);
              }}
              completion={completion}
            />
          )}

          {/* Help Text */}
          {!hasCompletion && !showModelPicker && (
            <p className="text-[10px] text-muted-foreground text-center">
              Type anything in natural language • Press Enter to generate
            </p>
          )}
        </div>
      )}
    </div>
  );
}
