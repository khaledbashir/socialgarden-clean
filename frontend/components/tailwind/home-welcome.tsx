import React from "react";
import { Button } from "@/components/tailwind/ui/button";
import { Sparkles, Info, ExternalLink, FolderOpen, FileText } from "lucide-react";

export default function HomeWelcome({
    onCreateWorkspace,
    onOpenOnboarding,
    workspaceCount = 0,
    isLoading = false,
}: {
    onCreateWorkspace?: () => void;
    onOpenOnboarding?: () => void;
    workspaceCount?: number;
    isLoading?: boolean;
}) {
    const hasWorkspaces = !isLoading && workspaceCount > 0;

    return (
        <div className="flex flex-col items-start justify-start h-full w-full">
            <div className="max-w-2xl text-left px-0 py-8">
                <div className="flex items-center justify-center">
                    <div className="rounded-full bg-indigo-50 p-3">
                        <Sparkles className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">
                    {hasWorkspaces ? "Select a Client Workspace" : "Welcome to Social Garden SOW Generator"}
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {hasWorkspaces 
                        ? `You have ${workspaceCount} workspace${workspaceCount > 1 ? 's' : ''}. Select one from the sidebar to create or edit SOWs.`
                        : "Get started by creating a workspace for each client. Then you can create as many SOWs as you need within each workspace."
                    }
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1CBF79]"></div>
                            <span>Loading workspaces...</span>
                        </div>
                    ) : !hasWorkspaces ? (
                        <>
                            <Button 
                                onClick={onCreateWorkspace} 
                                className="bg-[#1CBF79] hover:bg-[#15a366] text-white"
                            >
                                Create Your First Workspace
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onOpenOnboarding}
                                title="Open the onboarding flow"
                                className="dark:text-gray-300"
                            >
                                Guided Tour
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FolderOpen className="h-4 w-4" />
                            <span>Select a workspace from the sidebar</span>
                        </div>
                            <Button 
                                onClick={onCreateWorkspace} 
                                variant="outline"
                                className="mt-2"
                            >
                                Create New Workspace
                            </Button>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                    <p>
                        💡 <strong>Best Practice:</strong> Create one workspace per client. 
                        Then use the <strong>+</strong> button next to the workspace name to create SOWs for that client.
                    </p>
                </div>
            </div>
        </div>
    );
}
