"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ChevronRight, ChevronLeft, Sparkles, Zap, MessageSquare, ArrowRight, CheckCircle2, X } from "lucide-react";

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (name: string) => void;
  workspaceCount?: number;
}

export default function OnboardingFlow({
  isOpen,
  onClose,
  onCreateWorkspace,
  workspaceCount = 0,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  const steps = [
    {
      id: "welcome",
      title: "Welcome to SOW Generator",
      subtitle: "Your AI-powered Statement of Work creation platform",
      icon: "✨",
    },
    {
      id: "features",
      title: "What You Can Do",
      subtitle: "Powered by Enterprise AI",
    },
    {
      id: "create-workspace",
      title: "Create Your First Workspace",
      subtitle: "Let's get started with your first client workspace",
    },
    {
      id: "success",
      title: "You're All Set!",
      subtitle: "Your workspace is ready to go",
    },
  ];

  const handleNext = () => {
    if (currentStep === 2 && workspaceName.trim()) {
      setIsCreatingWorkspace(true);
      onCreateWorkspace(workspaceName);
      setTimeout(() => {
        setIsCreatingWorkspace(false);
        setCurrentStep(currentStep + 1);
      }, 1000);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Close the onboarding modal and call provided onClose handler
    onClose();
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-800 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header with progress */}
        <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border-b border-gray-800 px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{currentStepData.title}</h1>
              <p className="text-sm text-gray-400">{currentStepData.subtitle}</p>
            </div>
            {currentStepData.icon && <span className="text-4xl">{currentStepData.icon}</span>}
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  index < currentStep
                    ? "bg-green-500"
                    : index === currentStep
                      ? "bg-blue-500"
                      : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 min-h-80">
          {currentStep === 0 && (
            <div className="space-y-6">
              <p className="text-lg text-gray-300 leading-relaxed">
                Generate professional Statements of Work in minutes, not hours. Powered by enterprise-grade AI that understands your business context.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Sparkles className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">AI-Generated Content</h3>
                    <p className="text-sm text-gray-400">Create professional SOWs with smart templates and AI suggestions</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Zap className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Multi-Workspace Management</h3>
                    <p className="text-sm text-gray-400">Manage SOWs for multiple clients in one centralized dashboard</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Interactive AI Chat</h3>
                    <p className="text-sm text-gray-400">Refine and iterate with AI agents specialized in SOW generation</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <p className="text-base text-gray-300 mb-6">
                Take advantage of our powerful features to streamline your SOW creation process:
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Smart Content Generation</h4>
                    <p className="text-sm text-gray-400 mt-1">AI crafts SOW sections based on your project details</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Real-Time Collaboration</h4>
                    <p className="text-sm text-gray-400 mt-1">Share SOWs with clients and gather feedback in one place</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Enterprise-Grade AI</h4>
                    <p className="text-sm text-gray-400 mt-1">Specialist agents for different SOW types and industries</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">One-Click Exports</h4>
                    <p className="text-sm text-gray-400 mt-1">Download as PDF or share via portal link instantly</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <p className="text-base text-gray-300 mb-6">
                Create a workspace for your first client. You can add more clients later.
              </p>

              <div className="space-y-2">
                <Label htmlFor="workspace-name" className="text-white font-semibold">
                  Workspace Name
                </Label>
                <p className="text-xs text-gray-500 mb-2">Use your client's name or company name</p>
                <Input
                  id="workspace-name"
                  placeholder="e.g., Acme Corporation"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && workspaceName.trim()) {
                      handleNext();
                    }
                  }}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12 rounded-lg"
                  disabled={isCreatingWorkspace}
                />
              </div>

              {isCreatingWorkspace && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-3">
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-sm text-blue-300">Creating workspace...</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">You're Ready to Go!</h3>
                <p className="text-gray-300 mb-4">
                  Your workspace has been created and is ready for use.
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Next Steps:
                </h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>✓ Chat with The Architect to generate your first SOW</li>
                  <li>✓ Customize the content to match your project details</li>
                  <li>✓ Share with your client using a secure portal link</li>
                  <li>✓ Track changes and gather feedback in real-time</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-gray-800 px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
              >
                Start Creating SOWs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentStep === 2 && !workspaceName.trim()}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white disabled:opacity-50"
              >
                {currentStep === 2 ? "Create Workspace" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
