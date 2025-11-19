import React from "react";
import { Button } from "@/components/tailwind/ui/button";
import { Sparkles, Info, ExternalLink } from "lucide-react";

export default function HomeWelcome({
    onCreateWorkspace,
    onOpenOnboarding,
}: {
    onCreateWorkspace?: () => void;
    onOpenOnboarding?: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="max-w-xl text-center px-6 py-8">
                <div className="flex items-center justify-center">
                    <div className="rounded-full bg-indigo-50 p-3">
                        <Sparkles className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">
                    Welcome to Social Garden SOW Generator
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Get started by creating a workspace for each client. Then you can create as many SOWs as you need within each workspace.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
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
