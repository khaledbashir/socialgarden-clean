"use client";

import { useState, useEffect } from "react";
import type { Agent } from "@/lib/types/sow";

export function useAgentState({
    mounted,
    viewMode,
    currentDocId,
}: {
    mounted: boolean;
    viewMode: "dashboard" | "editor";
    currentDocId: string | null;
}) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

    useEffect(() => {
        if (!mounted) return;

        const loadAgents = async () => {
            try {
                // First try to load agents
                const response = await fetch("/api/agents");
                if (response.ok) {
                    const agentsData = await response.json();
                    
                    // If no agents exist, initialize defaults
                    if (agentsData.length === 0) {
                        console.log("ℹ️ No agents found, initializing defaults...");
                        const initResponse = await fetch("/api/agents/init", {
                            method: "POST"
                        });
                        
                        if (initResponse.ok) {
                            const initData = await initResponse.json();
                            setAgents(initData.agents);
                            console.log(`✅ Initialized ${initData.agents.length} default agents`);
                        } else {
                            console.error("Failed to initialize agents");
                        }
                    } else {
                        setAgents(agentsData);
                        console.log(`✅ Loaded ${agentsData.length} agents`);
                    }
                } else {
                    console.error("Failed to load agents");
                }
            } catch (error) {
                console.error("Error loading agents:", error);
            }
        };

        loadAgents();
    }, [mounted]);

    useEffect(() => {
        if (agents.length === 0 || !mounted) return;

        const determineAndSetAgent = async () => {
            let agentIdToUse: string | null = null;

            if (viewMode === "dashboard") {
                console.log(
                    "🎯 [Agent Selection] In DASHBOARD mode - agent managed by dashboard component",
                );
                setCurrentAgentId(null);
            } else if (viewMode === "editor" && currentDocId) {
                try {
                    const prefResponse = await fetch(
                        "/api/preferences/current_agent_id",
                    );
                    if (prefResponse.ok) {
                        const { value } = await prefResponse.json();
                        if (value && agents.find((a) => a.id === value)) {
                            agentIdToUse = value;
                            console.log(
                                `🎯 [Agent Selection] Using saved agent preference: ${value}`,
                            );
                        }
                    }
                } catch (err) {
                    console.error("Failed to load agent preference:", err);
                }

                if (!agentIdToUse) {
                    // First try to find "architect" agent, then "GEN - The Architect", then any agent
                    const architectAgent = agents.find((a) => a.id === "architect");
                    const genArchitect = agents.find(
                        (a) =>
                            a.name === "GEN - The Architect" ||
                            a.id === "gen-the-architect",
                    );
                    agentIdToUse = architectAgent?.id || genArchitect?.id || agents[0]?.id || null;
                    console.log(
                        `🎯 [Agent Selection] In EDITOR mode - using default agent: ${agentIdToUse}`,
                    );
                }

                setCurrentAgentId(agentIdToUse);
            } else {
                console.log(
                    "🎯 [Agent Selection] No context yet - deferring agent selection",
                );
                setCurrentAgentId(null);
            }
        };

        determineAndSetAgent();
    }, [agents, viewMode, currentDocId, mounted]);

    useEffect(() => {
        if (currentAgentId) {
            fetch("/api/preferences/current_agent_id", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value: currentAgentId }),
            }).catch((err) =>
                console.error("Failed to save agent preference:", err),
            );
        }
    }, [currentAgentId]);

    return {
        agents,
        setAgents,
        currentAgentId,
        setCurrentAgentId,
    };
}
