import React from "react";
import { Button } from "@/components/tailwind/ui/button";
import { Sparkles, Info, ExternalLink, FolderOpen, FileText } from "lucide-react";

export default function HomeWelcome({
    onCreateWorkspace,
    onOpenOnboarding,
    workspaceCount = 0,
    isLoading = false,
    debug = false,
}: {
    onCreateWorkspace?: () => void;
    onOpenOnboarding?: () => void;
    workspaceCount?: number;
    isLoading?: boolean;
    debug?: boolean;
}) {
    const hasWorkspaces = !isLoading && workspaceCount > 0;

    return (
        <div className={`flex h-full w-full overflow-auto px-6 sm:px-8 ${debug ? 'bg-black/20' : ''}`}>
            <div className={`mx-auto max-w-2xl sm:max-w-3xl w-full text-center py-10 sm:py-12 ${debug ? 'border border-yellow-500' : ''}`}>
                <div className="flex items-center justify-center">
                    <div className="rounded-full bg-indigo-50 p-3">
                        <Sparkles className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {hasWorkspaces ? "Select a Client Workspace" : "Welcome to Social Garden SOW Generator"}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed break-words">
                    {hasWorkspaces 
                        ? `You have ${workspaceCount} workspace${workspaceCount > 1 ? 's' : ''}. Select one from the sidebar to create or edit SOWs.`
                        : "Get started by creating a workspace for each client. Then you can create as many SOWs as you need within each workspace." 
                    }
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
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

                <div className="mt-8 text-xs sm:text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
                    <p>
                        💡 <strong>Best Practice:</strong> Create one workspace per client. 
                        Then use the <strong>+</strong> button next to the workspace name to create SOWs for that client.
                    </p>
                </div>
            </div>
        </div>
    );
}
