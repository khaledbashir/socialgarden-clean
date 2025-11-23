"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/tailwind/ui/dialog";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";

interface CreateWorkspaceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateWorkspace: (name: string, type?: "sow" | "client" | "generic") => void;
    defaultType?: "sow" | "client" | "generic";
}

export default function CreateWorkspaceDialog({
    isOpen,
    onClose,
    onCreateWorkspace,
    defaultType = "sow",
}: CreateWorkspaceDialogProps) {
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceType, setWorkspaceType] = useState<"sow" | "client" | "generic">(defaultType);

    // Reset form when dialog opens/closes or defaultType changes
    React.useEffect(() => {
        if (isOpen) {
            setWorkspaceName("");
            setWorkspaceType(defaultType);
        }
    }, [isOpen, defaultType]);

    const handleSubmit = () => {
        if (workspaceName.trim()) {
            onCreateWorkspace(workspaceName.trim(), workspaceType);
            setWorkspaceName("");
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && workspaceName.trim()) {
            handleSubmit();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-background border border-border max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Create New Workspace</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Enter a name for your workspace. This will help you organize your SOWs.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="workspace-name" className="text-foreground">
                            Workspace Name
                        </Label>
                        <Input
                            id="workspace-name"
                            placeholder="e.g., Acme Corporation, Q3 Projects"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            Use your client's name or a descriptive project name
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="workspace-type" className="text-foreground">
                            Workspace Type
                        </Label>
                        <select
                            id="workspace-type"
                            value={workspaceType}
                            onChange={(e) => setWorkspaceType(e.target.value as "sow" | "client" | "generic")}
                            className="w-full bg-card border border-border text-foreground rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        >
                            <option value="sow">SOW Generation</option>
                            <option value="client">Client Folder</option>
                            <option value="generic">Generic Workspace</option>
                        </select>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-border text-foreground hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!workspaceName.trim()}
                            className="bg-sg-green hover:bg-[#15a366] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Workspace
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

