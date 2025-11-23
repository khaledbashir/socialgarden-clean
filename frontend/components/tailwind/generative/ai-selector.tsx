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
  Info,
  Keyboard,
  History,
  BookOpen,
  AlertCircle,
  Lightbulb,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
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
import { Badge } from "../ui/badge";
import { useUserPreferences } from "@/hooks/use-user-preferences";

// Smart Suggestions and Keyboard Shortcuts
import { SmartSuggestions } from "./ui/SmartSuggestions";
import { KeyboardShortcutsHelp } from "./ui/KeyboardShortcutsHelp";
import { detectContext, formatReadingTime, getReadabilityLevel } from "./utils/context-detector";
import { useKeyboardShortcuts } from "./utils/shortcuts";
import { getSmartSuggestions, type PromptTemplate } from "./utils/templates";

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
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use database-backed preferences instead of localStorage
  const { preferences, updatePreference, loading: prefsLoading } = useUserPreferences();
  
  const selectedModel = preferences['ai-selector-model'] || "z-ai/glm-4.5-air:free";
  const showFreeOnly = preferences['ai-selector-free-only'] === true;

  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"thinking" | "generating" | "formatting" | "finishing">("thinking");
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [textContext, setTextContext] = useState<ReturnType<typeof detectContext> | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<PromptTemplate[]>([]);

  const hasCompletion = completion.length > 0;

  // Client-side mount flag
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Analyze selected text on mount
  useEffect(() => {
    if (!editor) {
      console.log("⚠️ Editor not available yet");
      return;
    }
    
    try {
      const slice = editor.state?.selection?.content();
      if (slice && editor.storage?.markdown?.serializer) {
        const text = editor.storage.markdown.serializer.serialize(slice.content);
        setSelectedText(text);
        
        // Detect context and get smart suggestions
        const context = detectContext(text);
        setTextContext(context);
        const suggestions = getSmartSuggestions(context);
        setSmartSuggestions(suggestions);
        
        console.log("📊 Text analysis:", context);
        console.log("💡 Smart suggestions:", suggestions.map(s => s.name));
      }
    } catch (err) {
      console.warn("Could not analyze text:", err);
      // Continue without analysis - not critical
    }
  }, [editor]);

  // Helper function to check if element is input
  const isInputElement = (target: EventTarget | null) => {
    if (!target) return false;
    const element = target as HTMLElement;
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.getAttribute('contenteditable') === 'true';
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onGenerate: () => {
      if (!isLoading && prompt.trim() && editor) {
        handleGenerate();
      }
    },
    onCancel: () => {
      if (isLoading) {
        // Future: cancel request
      } else if (hasCompletion) {
        setCompletion("");
      } else {
        onOpenChange(false);
      }
    },
    onFocusInput: () => {
      inputRef.current?.focus();
    },
  });

  // Add "?" shortcut for help
  useEffect(() => {
    const handleQuestionMark = (e: KeyboardEvent) => {
      if (e.key === '?' && !isInputElement(e.target)) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
    };
    
    window.addEventListener('keydown', handleQuestionMark);
    return () => window.removeEventListener('keydown', handleQuestionMark);
  }, []);

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

    // Safety checks
    if (!editor) {
      console.error("❌ Editor not available");
      toast.error("Editor not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setCompletion("");
    setError(null);
    setShowSuccess(false);
    setLoadingStage("thinking");

    try {
      // Safely get selected text
      let textToProcess = selectedText;
      if (!textToProcess) {
        try {
          const slice = editor.state?.selection?.content();
          if (slice && editor.storage?.markdown?.serializer) {
            textToProcess = editor.storage.markdown.serializer.serialize(slice.content);
          }
        } catch (err) {
          console.warn("Could not get selected text:", err);
          textToProcess = "";
        }
      }

      console.log("🚀 Generating with:", { 
        selectedText: textToProcess.substring(0, 50), 
        command: prompt,
        model: selectedModel 
      });

      // Stage 2: Generating
      setLoadingStage("generating");

      // Custom streaming fetch - more robust than useCompletion
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textToProcess || " ",
          option: "zap",
          command: prompt,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedText += chunk;
        setCompletion(accumulatedText);
        
        chunkCount++;
        // Stage 3: Formatting (after first chunks arrive)
        if (chunkCount === 3) {
          setLoadingStage("formatting");
        }
      }

      // Stage 4: Finishing
      setLoadingStage("finishing");
      
      console.log("✅ Generation complete:", accumulatedText.length, "characters");
      
      // Show success animation
      setShowSuccess(true);
      setPrompt("");
      
      // Hide success after 2 seconds
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error("❌ Generation error:", error);
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      setError(errorObj);
      toast.error(`Failed to generate: ${errorObj.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    setPrompt(template.prompt);
    toast.success(`Template selected: ${template.name}`);
    // Auto-generate after template selection
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  const handleRetry = () => {
    setError(null);
    handleGenerate();
  };

  const selectedModelData = models.find(m => m.id === selectedModel);

  // Comprehensive quick action templates for every editing scenario
  const quickActions: Array<{ icon: React.ReactNode; label: string; prompt: string }> = [
    { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Improve", prompt: "Make this better and more polished" },
    { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Expand", prompt: "Expand on this with more detail and examples" },
    { icon: <Zap className="h-3.5 w-3.5" />, label: "Simplify", prompt: "Make this simpler and easier to understand" },
    { icon: <AlertCircle className="h-3.5 w-3.5" />, label: "Fix", prompt: "Fix any grammar, spelling, or style issues" },
    { icon: <Copy className="h-3.5 w-3.5" />, label: "Summarize", prompt: "Create a concise summary of this content" },
    { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Bullets → Table", prompt: "Convert these bullet points into a well-formatted table" },
    { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Add Examples", prompt: "Add relevant real-world examples to illustrate these points" },
    { icon: <Zap className="h-3.5 w-3.5" />, label: "Make Professional", prompt: "Rewrite in a professional, business-appropriate tone" },
    { icon: <Copy className="h-3.5 w-3.5" />, label: "Make Casual", prompt: "Rewrite in a casual, friendly, conversational tone" },
    { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Add Numbers", prompt: "Add specific statistics, percentages, and data points to support these claims" },
    { icon: <AlertCircle className="h-3.5 w-3.5" />, label: "Make Detailed", prompt: "Expand this significantly with comprehensive details, explanations, and context" },
    { icon: <RotateCcw className="h-3.5 w-3.5" />, label: "Rewrite", prompt: "Completely rewrite this with a fresh approach while keeping the core message" },
  ];

  // Safety check
  if (!editor) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay - click to close, press Esc to close */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Bottom-center modal - Sleek, minimal design */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300 w-full px-4 sm:px-0">
        <div className="w-full sm:w-[650px] lg:w-[700px] max-w-[95vw] mx-auto bg-gradient-to-br from-[#0F1117] to-[#1C1F26] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden">
          {/* Minimal header with status */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#21262D] bg-[#0D1117]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#1CBF79] to-[#0e2e33] rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-gray-100 tracking-wide">AI WRITING ASSISTANT</span>
              </div>
              {selectedText && (
                <span className="text-xs text-gray-500 ml-2">
                  {textContext?.wordCount || 0} {textContext?.wordCount === 1 ? 'word' : 'words'} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex px-2 py-0.5 bg-[#161B22] border border-[#30363D] rounded text-[10px] text-gray-400 font-mono">ESC</kbd>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-[#21262D] text-gray-500 hover:text-gray-200 rounded-md transition-colors"
                onClick={() => onOpenChange(false)}
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main content area */}
          {/* Completion Display - Beautiful, readable text */}
          {hasCompletion && (
            <div className="max-h-[320px] border-b border-[#21262D] bg-[#0D1117]">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2 text-sm leading-relaxed">
                  <Markdown 
                    className="text-gray-100"
                    components={{
                      p: ({node, ...props}) => <p className="text-gray-100 my-1.5" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-gray-100 font-bold text-lg mt-3 mb-1" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-gray-100 font-bold text-base mt-2.5 mb-1" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-gray-100 font-semibold text-sm mt-2 mb-1" {...props} />,
                      ul: ({node, ...props}) => <ul className="text-gray-100 list-disc pl-4 my-1.5 space-y-0.5" {...props} />,
                      ol: ({node, ...props}) => <ol className="text-gray-100 list-decimal pl-4 my-1.5 space-y-0.5" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-100" {...props} />,
                      code: ({node, inline, ...props}: any) => 
                        inline 
                          ? <code className="text-gray-100 bg-[#161B22] px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                          : <code className="text-gray-100 bg-[#161B22] block p-2.5 rounded my-1.5 overflow-x-auto text-xs font-mono" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="text-gray-400 border-l-2 border-[#30363D] pl-3 italic my-1.5" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                      em: ({node, ...props}) => <em className="text-gray-100 italic" {...props} />,
                    }}
                  >
                    {completion}
                  </Markdown>
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Success Animation */}
          {showSuccess && !isLoading && (
            <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-b border-green-500/30 px-4 py-3 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400 animate-bounce" />
              <span className="text-xs font-medium text-green-300">Content generated successfully!</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-red-500/30 px-4 py-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-red-300">{error.message}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleRetry}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-red-500/30 text-red-300 hover:bg-red-500/10"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-6 flex flex-col items-center justify-center space-y-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#1CBF79] to-[#0e2e33] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#1CBF79] to-[#0e2e33] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#1CBF79] to-[#0e2e33] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-300">
                  {loadingStage === 'thinking' && 'Thinking...'}
                  {loadingStage === 'generating' && 'Generating...'}
                  {loadingStage === 'formatting' && 'Formatting...'}
                  {loadingStage === 'finishing' && 'Finishing up...'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Using {selectedModelData?.name || 'selected model'}</p>
              </div>
            </div>
          )}

          {/* Main Input Area - Clean, focused */}
          {!isLoading && (
            <div className="bg-[#0D1117] p-4 space-y-3">
              {/* Completion Actions - Easy to read buttons */}
              {hasCompletion && (
                <div className="flex gap-2 pb-2 border-b border-[#21262D]">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(completion);
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs gap-1.5 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => {
                      // Apply to document - replace selection
                      if (editor) {
                        const selection = editor.view.state.selection;
                        editor
                          .chain()
                          .focus()
                          .insertContentAt(
                            {
                              from: selection.from,
                              to: selection.to,
                            },
                            completion,
                          )
                          .run();
                        toast.success("Applied to document");
                        onOpenChange(false);
                      }
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-[#30363D] text-gray-400 hover:bg-[#161B22]"
                    onClick={() => setCompletion("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Smart Suggestions - Quick templates */}
              {!hasCompletion && smartSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-0.5">Suggestions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {smartSuggestions.slice(0, 4).map((template) => (
                      <Button
                        key={template.id}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-[#30363D] text-gray-300 hover:bg-[#161B22] hover:border-[#1CBF79] transition-colors"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <Lightbulb className="h-3 w-3 mr-1" />
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions - Common operations */}
              {!hasCompletion && selectedText && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-0.5">Quick Actions</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {quickActions.map((action, idx) => (
                      <Button
                        key={`ai-action-${idx}-${action.prompt.substring(0, 15)}`}
                        size="sm"
                        className="h-8 text-xs flex flex-col items-center justify-center gap-0.5 bg-[#161B22] hover:bg-[#21262D] text-gray-300 hover:text-white border border-[#30363D] transition-colors"
                        onClick={() => {
                          setPrompt(action.prompt);
                          setTimeout(() => {
                            handleGenerate();
                          }, 50);
                        }}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tone Quick Actions - New Feature */}
              {!hasCompletion && selectedText && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-0.5">Change Tone</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-[#30363D] text-gray-300 hover:bg-[#161B22] hover:border-[#1CBF79] transition-colors"
                      onClick={() => {
                        setPrompt("Rewrite this in a corporate, professional, and business-appropriate tone. Use formal language and maintain authority.");
                        setTimeout(() => handleGenerate(), 50);
                      }}
                    >
                      <Briefcase className="h-3 w-3" />
                      Corporate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-[#30363D] text-gray-300 hover:bg-[#161B22] hover:border-[#1CBF79] transition-colors"
                      onClick={() => {
                        setPrompt("Rewrite this in a friendly, casual, conversational tone. Make it warm and approachable while staying clear.");
                        setTimeout(() => handleGenerate(), 50);
                      }}
                    >
                      <MessageCircle className="h-3 w-3" />
                      Casual
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-[#30363D] text-gray-300 hover:bg-[#161B22] hover:border-[#1CBF79] transition-colors"
                      onClick={() => {
                        setPrompt("Rewrite this in a precise, technical tone. Use industry terminology and be specific and analytical.");
                        setTimeout(() => handleGenerate(), 50);
                      }}
                    >
                      <Code2 className="h-3 w-3" />
                      Technical
                    </Button>
                  </div>
                </div>
              )}

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
                    } else if (e.key === 'Escape') {
                      onOpenChange(false);
                    }
                  }}
                  placeholder="What do you want to do? (e.g., 'make it sound professional', 'fix typos')"
                  className="pr-10 h-10 bg-[#161B22] text-gray-100 border border-[#30363D] placeholder:text-gray-600 focus:border-[#1CBF79] focus:ring-1 focus:ring-[#1CBF79]/30 transition-colors"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-gradient-to-r from-[#1CBF79] to-teal-500 hover:from-[#15a565] hover:to-teal-600 text-white shadow-lg"
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isLoading}
                  title="Send (Enter)"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>

              {/* Model Selector */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 justify-between h-8 text-xs border-[#30363D] text-gray-300 hover:bg-[#161B22]"
                  onClick={() => setShowModelPicker(!showModelPicker)}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-[#1CBF79]" />
                    <span className="truncate">{selectedModelData?.name || "Select Model"}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {filteredModels.length}
                  </span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-[#161B22] text-gray-500 hover:text-gray-300"
                  onClick={() => setShowKeyboardHelp(true)}
                  title="Keyboard shortcuts"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </div>

              {/* Model Picker Dropdown - Improved design */}
              {showModelPicker && (
                <div className="border border-[#30363D] rounded-lg bg-[#0D1117] shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Search & Filter */}
                  <div className="p-2.5 space-y-2 border-b border-[#21262D] bg-[#161B22]">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                      <Input
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs bg-[#0D1117] text-gray-100 border border-[#30363D] placeholder:text-gray-600 focus:border-[#1CBF79] focus:ring-1 focus:ring-[#1CBF79]/30"
                      />
                    </div>
                    <Button
                      variant={showFreeOnly ? "default" : "outline"}
                      size="sm"
                      onClick={toggleFreeFilter}
                      className={`w-full h-7 text-xs ${
                        showFreeOnly 
                          ? 'bg-[#1CBF79] hover:bg-[#15a565] text-white' 
                          : 'bg-[#0D1117] text-gray-300 border border-[#30363D] hover:bg-[#161B22]'
                      }`}
                    >
                      {showFreeOnly && <Check className="h-3 w-3 mr-1" />}
                      {showFreeOnly ? "Free Models Only" : "Show Free Models"}
                    </Button>
                  </div>

                  {/* Models List */}
                  <ScrollArea className="h-[280px]">
                    <div className="p-2">
                      {loadingModels ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                        </div>
                      ) : filteredModels.length === 0 ? (
                        <p className="text-xs text-center text-gray-500 py-8">
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
                              className={`w-full text-left p-2.5 rounded-md text-xs transition-all duration-150 mb-1 ${
                                isSelected 
                                  ? 'bg-[#1CBF79]/15 border border-[#1CBF79]/50' 
                                  : 'hover:bg-[#161B22] border border-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isSelected && <Check className="h-3 w-3 text-[#1CBF79] flex-shrink-0" />}
                                  <span className={`font-medium truncate ${isSelected ? 'text-[#1CBF79]' : 'text-gray-100'}`}>
                                    {model.name}
                                  </span>
                                </div>
                                {isFree ? (
                                  <span className="text-[10px] bg-[#1CBF79]/15 text-[#1CBF79] px-2 py-0.5 rounded-full flex-shrink-0">
                                    FREE
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-600 flex-shrink-0">
                                    ${parseFloat(model.pricing?.prompt || "0").toFixed(4)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-gray-600 mt-1 truncate">
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
              {!hasCompletion && !showModelPicker && smartSuggestions.length === 0 && (
                <p className="text-[10px] text-gray-500 text-center py-2">
                  <kbd className="px-1.5 py-0.5 bg-[#161B22] border border-[#30363D] rounded text-[9px] font-mono">?</kbd>
                  {' '}for shortcuts
                </p>
              )}
            </div>
          )}

          {/* Keyboard Shortcuts Help Modal */}
          <KeyboardShortcutsHelp 
            open={showKeyboardHelp}
            onOpenChange={setShowKeyboardHelp}
          />
        </div>
      </div>
    </>
  );
}
