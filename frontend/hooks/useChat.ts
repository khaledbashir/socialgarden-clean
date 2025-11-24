"use client";

import { useState, useEffect } from "react";
import type { ChatMessage, Document } from "@/lib/types/sow";
import { anythingLLM } from "@/lib/anythingllm";
import { toast } from "sonner";

export function useChat({
    viewMode,
    isHistoryRestored,
    currentAgentId,
    currentDoc,
    editorRef,
}: {
    viewMode: "dashboard" | "editor";
    isHistoryRestored: boolean;
    currentAgentId: string | null;
    currentDoc: Document | undefined;
    editorRef: React.RefObject<any>;
}) {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
        null,
    );
    const [lastUserPrompt, setLastUserPrompt] = useState<string>("");
    const [userPromptDiscount, setUserPromptDiscount] = useState<number>(0);
    const [multiScopePricingData, setMultiScopePricingData] = useState<
        any | null
    >(null);

    useEffect(() => {
        // Load thread history when document context changes
        const loadThreadHistory = async () => {
            if (!currentDoc?.threadSlug || !currentDoc?.workspaceSlug) {
                setChatMessages([]);
                return;
            }

            try {
                const history = await anythingLLM.getThreadChats(
                    currentDoc.workspaceSlug,
                    currentDoc.threadSlug,
                );

                if (history && history.length > 0) {
                    const messages: ChatMessage[] = history.map(
                        (msg: any, index: number) => ({
                            id: `msg-${msg.id || Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                            role: msg.role === "user" ? "user" : "assistant",
                            content: msg.content,
                            timestamp: Date.now(),
                        }),
                    );
                    setChatMessages(messages);
                } else {
                    setChatMessages([]);
                }
            } catch (error) {
                console.error("❌ Failed to load chat history:", error);
                setChatMessages([]);
            }
        };

        // Only load history if we don't already have messages AND not currently streaming
        // This prevents overwriting messages during active conversations
        if (chatMessages.length === 0 && !streamingMessageId) {
            loadThreadHistory();
        }

        // Show welcome message for new documents with temporary threads
        if (
            viewMode === "editor" &&
            currentDoc?.threadSlug?.startsWith("temp-") &&
            chatMessages.length === 0
        ) {
            const welcomeMessage: ChatMessage = {
                id: `welcome-${Date.now()}`,
                role: "assistant",
                content: `🔗 **Setting up your SOW workspace...**

I'm creating a dedicated thread in the SOW Generator workspace for this document. This will only take a moment.

Once ready, you can ask me to:
• Generate complete SOWs from brief descriptions
• Enhance and refine existing content
• Add detailed scope items and pricing
• Format content for professional delivery

Please wait while the connection is established...`,
                timestamp: Date.now(),
            };

            setChatMessages((prev) => prev.concat(welcomeMessage));
        } else if (
            viewMode === "dashboard" &&
            chatMessages.length === 0 &&
            !isHistoryRestored
        ) {
            const welcomeMessage: ChatMessage = {
                id: `welcome-${Date.now()}`,
                role: "assistant",
                content: `Welcome to the Master SOW Analytics assistant. I have access to all embedded SOWs.

Ask me questions to get business insights, such as:
• "What is our total revenue from HubSpot projects?"
• "Which services were included in the RealEstateTT SOW?"
• "How many SOWs did we create this month?"
• "What's the breakdown of services across all clients?"`,
                timestamp: Date.now(),
            };

            setChatMessages((prev) => prev.concat(welcomeMessage));
        }
    }, [
        viewMode,
        isHistoryRestored,
        currentDoc?.threadSlug,
        currentDoc?.workspaceSlug,
    ]);

    // Clear temporary welcome message when real thread is ready
    useEffect(() => {
        if (
            currentDoc?.threadSlug &&
            !currentDoc.threadSlug.startsWith("temp-") &&
            chatMessages.length > 0
        ) {
            const welcomeMessage = chatMessages.find(
                (msg) =>
                    msg.id.startsWith("welcome-") &&
                    msg.content.includes("Setting up your SOW workspace"),
            );

            if (welcomeMessage) {
                setChatMessages((prev) => {
                    const filtered = prev.filter(
                        (msg) => msg.id !== welcomeMessage.id,
                    );

                    // Add a ready message
                    const readyMessage: ChatMessage = {
                        id: `ready-${Date.now()}`,
                        role: "assistant",
                        content: `✅ **Ready to collaborate!**

Your SOW thread is now connected to SOW Generator workspace. I'm ready to help you create and enhance your Statement of Work.

What would you like to work on today?`,
                        timestamp: Date.now(),
                    };

                    return [...filtered, readyMessage];
                });
            }
        }
    }, [currentDoc?.threadSlug]);

    // Clear messages when switching to a different document/thread
    useEffect(() => {
        // Only clear if we're switching to a different document (not just re-rendering)
        // and we don't already have messages for this document
        // and we're not currently streaming (to avoid interrupting conversations)
        if (currentDoc && chatMessages.length > 0 && !streamingMessageId) {
            // Check if current messages are from a different document
            const firstMessage = chatMessages[0];
            if (firstMessage && !firstMessage.id.includes(currentDoc.id)) {
                setChatMessages([]);
            }
        }
    }, [currentDoc?.id, streamingMessageId]); // Include streamingMessageId to prevent clearing during streaming

    const handleSend = async (message: string) => {
        if (!currentAgentId) {
            toast.error("Please select an agent first.");
            return;
        }

        if (!currentDoc?.workspaceSlug) {
            toast.error("No workspace configured for this document.");
            return;
        }

        const workspaceSlug = currentDoc.workspaceSlug;
        const threadSlug = currentDoc?.threadSlug;

        // Check if thread is a temporary one (starts with "temp-")
        if (!threadSlug || threadSlug.startsWith("temp-")) {
            toast.error(
                "Please wait a moment while the SOW thread is being created...",
            );
            return;
        }

        const newUserMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: message,
            timestamp: Date.now(),
        };

        setChatMessages((prev) => [...prev, newUserMessage]);
        setIsChatLoading(true);

        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
        setStreamingMessageId(assistantMessageId);

        try {
            await anythingLLM.streamChatWithThread(
                workspaceSlug,
                threadSlug,
                message,
                (chunk) => {
                    try {
                        const data = JSON.parse(chunk);
                        if (data.type === "text") {
                            setChatMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMessageId
                                        ? {
                                            ...msg,
                                            content: msg.content + data.text,
                                        }
                                        : msg,
                                ),
                            );
                        }
                    } catch (error) {
                        //
                    }
                },
            );
        } catch (error) {
            console.error("Error streaming chat:", error);
            toast.error("Failed to get response from AI.");
        } finally {
            setIsChatLoading(false);
            setStreamingMessageId(null);
        }
    };

    return {
        chatMessages,
        setChatMessages,
        isChatLoading,
        setIsChatLoading,
        streamingMessageId,
        setStreamingMessageId,
        lastUserPrompt,
        setLastUserPrompt,
        userPromptDiscount,
        setUserPromptDiscount,
        multiScopePricingData,
        setMultiScopePricingData,
        handleSend,
    };
}
