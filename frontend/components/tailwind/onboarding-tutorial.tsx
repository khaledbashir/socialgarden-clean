"use client";

import { useState, useEffect } from "react";
import { X, Folder, FileText, Plus, MousePointerClick, Info } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "sidebar" | "center" | "top-right";
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to SOW Generator! 🎉",
    description: "Let's take a quick tour to show you how everything works. This will only take 30 seconds!",
    icon: <Sparkles className="h-8 w-8 text-[#20e28f]" />,
    position: "center"
  },
  {
    id: "create-folder",
    title: "Step 1: Create a Folder",
    description: "Click the '📁 New Folder' button on the left sidebar. Each folder creates a Workspace in your AI system where all related SOWs will be organized.",
    icon: <Folder className="h-8 w-8 text-blue-500" />,
    position: "sidebar"
  },
  {
    id: "create-sow",
    title: "Step 2: Create a SOW",
    description: "Look for the green '+' button next to your folder name (it's slightly visible and gets brighter on hover). Click it to create a new SOW document inside that folder's workspace.",
    icon: <FileText className="h-8 w-8 text-purple-500" />,
    position: "sidebar"
  },
  {
    id: "edit-rename",
    title: "Step 3: Rename & Delete",
    description: "Hover over any folder or document to see the ✏️ rename and 🗑️ delete buttons. Keep your workspace organized!",
    icon: <MousePointerClick className="h-8 w-8 text-yellow-500" />,
    position: "sidebar"
  },
  {
    id: "ai-features",
    title: "Step 4: Use AI Features",
    description: "Select any text in your document and click 'Ask AI' to edit with AI. Use the AI Chat sidebar on the right to ask questions about your SOW!",
    icon: <Sparkles className="h-8 w-8 text-purple-500" />,
    position: "top-right"
  }
];

function Sparkles({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
      <path d="M5 3v4"></path>
      <path d="M19 17v4"></path>
      <path d="M3 5h4"></path>
      <path d="M17 19h4"></path>
    </svg>
  );
}

export function OnboardingTutorial() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

  useEffect(() => {
    // Check if user has completed tutorial before
    const completed = localStorage.getItem("sow-tutorial-completed");
    if (!completed) {
      // Show tutorial after 1 second delay
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      setHasCompletedTutorial(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem("sow-tutorial-completed", "true");
    setHasCompletedTutorial(true);
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem("sow-tutorial-completed", "true");
    setHasCompletedTutorial(true);
    toast.success("Tutorial completed! You're all set! 🎉");
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsVisible(true);
  };

  if (!isVisible && hasCompletedTutorial) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border hover:bg-accent"
        onClick={handleRestart}
        title="Restart Tutorial"
      >
        <Info className="h-4 w-4 mr-2" />
        Show Tutorial
      </Button>
    );
  }

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  // Position classes based on step position
  const positionClasses = {
    sidebar: "left-[280px] top-1/2 -translate-y-1/2",
    center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-right": "right-[500px] top-24"
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm" onClick={handleSkip} />

      {/* Tutorial Card */}
      <div className={`fixed ${positionClasses[step.position]} z-[101] w-[400px] bg-background border-2 border-[#20e28f] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300`}>
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-[#20e28f] to-[#0e2e33] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0e2e33] to-[#0a2328] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step.icon}
            <div>
              <div className="text-xs text-white/70 font-medium">
                Step {currentStep + 1} of {tutorialSteps.length}
              </div>
              <h3 className="text-lg font-bold text-white">{step.title}</h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-muted-foreground leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip Tutorial
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                className="bg-[#0e2e33] hover:bg-[#0e2e33]/90 text-white"
                onClick={handleNext}
              >
                {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </div>

        {/* Arrow pointer for sidebar steps */}
        {step.position === "sidebar" && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[12px] border-r-[#20e28f]" />
          </div>
        )}

        {/* Arrow pointer for top-right steps */}
        {step.position === "top-right" && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[12px] border-l-[#20e28f]" />
          </div>
        )}
      </div>
    </>
  );
}
