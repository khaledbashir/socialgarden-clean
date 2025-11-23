"use client";
import React, { useState } from "react";
import {
    Plus,
    Settings,
    Users,
    FileText,
    MoreVertical,
    Trash2,
    Edit,
} from "lucide-react";
import type { Workspace } from "@/types";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/tailwind/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/tailwind/ui/tabs";
// Use the correct path alias
import { useWorkspaces } from "@/hooks/useWorkspaces";

const WorkspaceManager = ({
    onWorkspaceSelect,
    activeWorkspaceSlug,
}: {
    onWorkspaceSelect: (workspaceSlug: string) => void;
    activeWorkspaceSlug?: string;
}) => {
    const [createWorkspaceDialogOpen, setCreateWorkspaceDialogOpen] =
        useState(false);
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceType, setWorkspaceType] = useState<
        "sow" | "inline-editor" | "utility"
    >("sow");
    const [workspaceDescription, setWorkspaceDescription] = useState("");
    const [workspaceProgress, setWorkspaceProgress] = useState<{
        isOpen: boolean;
        workspaceName: string;
        currentStep: number;
        completedSteps: string[];
    }>({
        isOpen: false,
        workspaceName: "",
        currentStep: 1,
        completedSteps: [],
    });

    const { workspaces, isLoading, error, createWorkspace, deleteWorkspace } =
        useWorkspaces();

    const handleCreateWorkspace = async () => {
        if (!workspaceName.trim()) return;

        try {
            setWorkspaceProgress({
                isOpen: true,
                workspaceName: workspaceName,
                currentStep: 1,
                completedSteps: ["Initializing workspace"],
            });

            const newWorkspace = await createWorkspace({
                name: workspaceName,
                type: workspaceType,
                description: workspaceDescription,
            });

            setWorkspaceProgress((prev) => ({
                ...prev,
                currentStep: 2,
                completedSteps: [...prev.completedSteps, "Workspace created"],
            }));

            // Close both dialogs
            setCreateWorkspaceDialogOpen(false);
            setWorkspaceName("");
            setWorkspaceDescription("");

            // Select the new workspace
            onWorkspaceSelect(newWorkspace.workspace_slug);

            // Close progress dialog after a short delay
            setTimeout(() => {
                setWorkspaceProgress((prev) => ({
                    ...prev,
                    isOpen: false,
                }));
            }, 1500);
        } catch (error) {
            console.error("Failed to create workspace:", error);
            setWorkspaceProgress((prev) => ({
                ...prev,
                isOpen: false,
            }));
        }
    };

    const handleDeleteWorkspace = async (workspaceId: string) => {
        if (window.confirm("Are you sure you want to delete this workspace?")) {
            try {
                await deleteWorkspace(workspaceId);
            } catch (error) {
                console.error("Failed to delete workspace:", error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error loading workspaces: {error.message}
            </div>
        );
    }

    return (
        <>
            <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Workspaces</h2>
                        <Dialog
                            open={createWorkspaceDialogOpen}
                            onOpenChange={setCreateWorkspaceDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    New Workspace
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Create New Workspace
                                    </DialogTitle>
                                    <DialogDescription>
                                        Create a new workspace for managing
                                        documents and AI interactions
                                    </DialogDescription>
                                </DialogHeader>
                                <Tabs
                                    value={workspaceType}
                                    onValueChange={(value) =>
                                        setWorkspaceType(value as any)
                                    }
                                >
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="sow">
                                            SOW
                                        </TabsTrigger>
                                        <TabsTrigger value="inline-editor">
                                            Editor
                                        </TabsTrigger>
                                        <TabsTrigger value="utility">
                                            Utility
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent
                                        value="sow"
                                        className="space-y-4 pt-4"
                                    >
                                        <div>
                                            <Input
                                                placeholder="Workspace name"
                                                value={workspaceName}
                                                onChange={(e) =>
                                                    setWorkspaceName(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Create a workspace for generating
                                            and managing Statements of Work
                                            (SOWs)
                                        </p>
                                    </TabsContent>
                                    <TabsContent
                                        value="inline-editor"
                                        className="space-y-4 pt-4"
                                    >
                                        <div>
                                            <Input
                                                placeholder="Workspace name"
                                                value={workspaceName}
                                                onChange={(e) =>
                                                    setWorkspaceName(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Create a workspace with an inline
                                            editor for document editing
                                        </p>
                                    </TabsContent>
                                    <TabsContent
                                        value="utility"
                                        className="space-y-4 pt-4"
                                    >
                                        <div>
                                            <Input
                                                placeholder="Workspace name"
                                                value={workspaceName}
                                                onChange={(e) =>
                                                    setWorkspaceName(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                placeholder="Description (optional)"
                                                value={workspaceDescription}
                                                onChange={(e) =>
                                                    setWorkspaceDescription(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Create a utility workspace for
                                            specific tasks and operations
                                        </p>
                                    </TabsContent>
                                </Tabs>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setCreateWorkspaceDialogOpen(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateWorkspace}
                                        disabled={!workspaceName.trim()}
                                    >
                                        Create
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="p-2">
                        {workspaces?.length > 0 ? (
                            <div className="space-y-2">
                                {workspaces.map((workspace) => (
                                    <div
                                        key={workspace.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer ${
                                            activeWorkspaceSlug ===
                                            workspace.workspace_slug
                                                ? "bg-blue-50 border-blue-200"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            onWorkspaceSelect(
                                                workspace.workspace_slug,
                                            )
                                        }
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded bg-blue-100">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium">
                                                    {workspace.name}
                                                </h3>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span>
                                                        {
                                                            workspace.workspace_slug
                                                        }
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {workspace.sows
                                                            ?.length || 0}{" "}
                                                        SOWs
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="p-1 h-8 w-8"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Settings
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Share
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleDeleteWorkspace(
                                                            workspace.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium mb-1">
                                    No workspaces yet
                                </h3>
                                <p className="text-sm text-gray-500 mb-4 text-center px-8">
                                    Create your first workspace to start
                                    managing documents and AI interactions
                                </p>
                                <Button
                                    onClick={() =>
                                        setCreateWorkspaceDialogOpen(true)
                                    }
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Create Workspace
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Workspace Creation Progress Dialog */}
            <Dialog open={workspaceProgress.isOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Creating Workspace</DialogTitle>
                        <DialogDescription>
                            Setting up your workspace "
                            {workspaceProgress.workspaceName}"
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            {workspaceProgress.completedSteps.map(
                                (step, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                            <svg
                                                className="w-2 h-2 text-white"
                                                fill="currentColor"
                                                viewBox="0 0 8 8"
                                            >
                                                <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm">{step}</span>
                                    </div>
                                ),
                            )}
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                </div>
                                <span className="text-sm text-blue-600">
                                    Processing...
                                </span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default WorkspaceManager;
