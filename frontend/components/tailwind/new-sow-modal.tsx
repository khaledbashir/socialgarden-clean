"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { ArrowRight } from "lucide-react";

interface NewSOWModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSOW: (name: string, instructions?: string) => void;
  workspaceName?: string;
}

export function NewSOWModal({
  isOpen,
  onOpenChange,
  onCreateSOW,
  workspaceName = "Workspace",
}: NewSOWModalProps) {
  const [sowName, setSowName] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = () => {
    if (sowName.trim()) {
      setShowInstructions(true);
    }
  };

  const handleSubmitWithInstructions = async () => {
    setIsSubmitting(true);
    try {
      onCreateSOW(sowName, instructions || undefined);
      setSowName("");
      setInstructions("");
      setShowInstructions(false);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (!showInstructions && sowName.trim()) {
        handleCreate();
      } else if (showInstructions && instructions.trim()) {
        handleSubmitWithInstructions();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {showInstructions ? "SOW Generation Instructions" : "New SOW"}
          </DialogTitle>
        </DialogHeader>
        
        {!showInstructions ? (
          // Step 1: Name the SOW
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">SOW Name</label>
              <Input
                placeholder="e.g., Q3 Marketing Plan SOW"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                value={sowName}
                onChange={(e) => setSowName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!sowName.trim()}
                className="bg-[#1CBF79] hover:bg-[#15a366] text-white"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          // Step 2: Enter generation instructions
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">
                Optional: How should we generate the initial SOW content?
              </label>
              <p className="text-xs text-gray-500">
                Provide specific instructions for the Generation AI to follow. Leave blank to start with a template.
              </p>
              <Textarea
                placeholder="e.g., Generate a detailed Q3 marketing plan for B2B SaaS, include budget breakdown, timeline, and success metrics..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 min-h-[120px] resize-none"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInstructions(false);
                  setInstructions("");
                }}
                disabled={isSubmitting}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitWithInstructions}
                disabled={isSubmitting}
                className="bg-[#1CBF79] hover:bg-[#15a366] text-white"
              >
                {isSubmitting ? "Creating..." : "Create SOW & Generate"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
