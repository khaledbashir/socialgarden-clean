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
                <h2 className="mt-6 text-2xl font-semibold text-gray-900">
                    Welcome back!
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                    The dashboard is currently hidden. You can create a new workspace, open an existing document, or run the guided onboarding to get started.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                    <Button onClick={onCreateWorkspace} variant="default">
                        Create Workspace
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onOpenOnboarding}
                        title="Open the onboarding flow"
                    >
                        Guided Tour
                    </Button>
                </div>

                <div className="mt-6 text-xs text-gray-400">
                    <p>
                        Tip: Use workspaces to organise your projects and the
                        World Architect to generate high-quality SOWs.
                    </p>
                </div>
            </div>
        </div>
    );
}
