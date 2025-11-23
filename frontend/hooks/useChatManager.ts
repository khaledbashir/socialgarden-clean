"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { anythingLLM } from "@/lib/anythingllm";
import type { Agent, ChatMessage, Document } from "@/types";
import {
    extractFinancialReasoning,
    extractBudgetAndDiscount,
    extractClientName,
    extractPricingJSON,
    buildSuggestedRolesFromArchitectSOW,
} from "@/lib/page-utils";
import { WORKSPACE_CONFIG, getWorkspaceForAgent } from "@/lib/workspace-config";
import { ROLES } from "@/lib/rateCard";
import { sanitizeEmptyTextNodes } from "@/lib/page-utils";
import { extractSOWStructuredJson } from "@/lib/export-utils";
import { convertMarkdownToNovelJSON } from "@/lib/editor-utils";
import {
    extractJSONFromContent,
    convertV41JSONToEditorFormat,
} from "@/json-editor-conversion-fix";

interface UseChatManagerProps {
    viewMode: "editor" | "dashboard";
    currentDoc?: Document | null;
    documents?: Document[];
    editorRef?: React.RefObject<any>;
    workspaces?: any[];
    currentWorkspaceId?: string;
    currentSOWId?: string;
    setLatestEditorJSON?: (content: any) => void;
    // Optional SOW UI locking status and setter injected from parent
    sowStatus?: "idle" | "processing" | "done";
    setSowStatus?: (status: "idle" | "processing" | "done") => void;
}

export function useChatManager({
    viewMode,
    currentDoc = null,
    documents = [],
    editorRef = undefined,
    setLatestEditorJSON,
    // Receive optional sowStatus and setter from caller; provide safe defaults
    sowStatus = "idle",
    setSowStatus = (_: "idle" | "processing" | "done") => {},
}: UseChatManagerProps) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
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

    const currentRequestControllerRef = useRef<AbortController | null>(null);
    const lastMessageSentTimeRef = useRef<number>(0);
    const MESSAGE_RATE_LIMIT = 1000;
    const generationTimeoutRef = useRef<number | null>(null);
    const pendingQueueRef = useRef<
        Array<{
            message: string;
            threadSlug?: string | null;
            attachments?: Array<{
                name: string;
                mime: string;
                contentString: string;
            }>;
        }>
    >([]);

    const log = useCallback((...args: any[]) => {
        if (process.env.NODE_ENV === "development") {
            console.log(...args);
        }
    }, []);

    const handleCreateAgent = useCallback(
        async (agent: Omit<Agent, "id">) => {
            const newId = `agent${Date.now()}`;
            const newAgent: Agent = { id: newId, ...agent };

            try {
                const response = await fetch("/api/agents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newAgent),
                });

                if (response.ok) {
                    setAgents((prev) => [...prev, newAgent]);
                    setCurrentAgentId(newId);
                    log("✅ Agent created in database");
                }
            } catch (error) {
                log("❌ Failed to create agent:", error);
            }
        },
        [log],
    );

    const cancelCurrentGeneration = useCallback(() => {
        if (currentRequestControllerRef.current) {
            try {
                currentRequestControllerRef.current.abort();
            } catch {}
            currentRequestControllerRef.current = null;
        }
        setIsChatLoading(false);
        setStreamingMessageId(null);
        try {
            setSowStatus("idle");
        } catch {}
        toast.warning("Generation cancelled");
        if (generationTimeoutRef.current) {
            try {
                clearTimeout(generationTimeoutRef.current);
            } catch {}
            generationTimeoutRef.current = null;
        }
    }, [setSowStatus]);

    const handleSelectAgent = useCallback(
        async (id: string) => {
            setCurrentAgentId(id);
            setChatMessages([]);
            log(
                `✅ Agent selected: ${id}. Chat history managed by AnythingLLM threads.`,
            );
        },
        [setChatMessages, log],
    );

    const handleUpdateAgent = useCallback(
        async (id: string, updates: Partial<Agent>) => {
            try {
                const response = await fetch(`/api/agents/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updates),
                });

                if (response.ok) {
                    setAgents((prev) =>
                        prev.map((a) =>
                            a.id === id ? { ...a, ...updates } : a,
                        ),
                    );
                    log("✅ Agent updated in database");
                }
            } catch (error) {
                log("❌ Failed to update agent:", error);
            }
        },
        [log],
    );

    const handleDeleteAgent = useCallback(
        async (id: string) => {
            try {
                const response = await fetch(`/api/agents/${id}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    setAgents((prev) => prev.filter((a) => a.id !== id));
                    if (currentAgentId === id) {
                        setCurrentAgentId(null);
                        setChatMessages([]);
                    }
                    log(
                        "✅ Agent deleted from database (messages cascade deleted)",
                    );
                }
            } catch (error) {
                log("❌ Failed to delete agent:", error);
            }
        },
        [currentAgentId, log],
    );

    const handleInsertContent = useCallback(
        async (content: string, suggestedRoles: any[] = []) => {
            let localMultiScopeData: any = undefined;

            // If SOW generation is already running, block manual insertion to avoid UI duplication
            if (sowStatus === "processing") {
                log("⚠️ Insert blocked: SOW generation in progress");
                toast.error(
                    "SOW generation in progress. Please wait for the current result.",
                );
                return;
            }

            // Trim content to check if it's actually empty
            const trimmedContent = content?.trim() || "";

            log(
                "📝 Inserting content into editor:",
                trimmedContent.substring(0, 100),
            );
            log("📝 Content length:", trimmedContent.length);
            log("📝 Editor ref exists:", !!editorRef?.current);
            log("📄 Current doc ID:", currentDoc?.id || null);

            if (!editorRef?.current) {
                log("❌ Editor not initialized, cannot insert content.");
                toast.error(
                    "Editor not ready. Please wait a moment and try again.",
                );
                // Ensure UI unlock in case upstream logic expected this insertion
                setSowStatus("idle");
                return;
            }

            if (!trimmedContent) {
                log("❌ Content is empty after cleaning");
                toast.error(
                    "No content to insert. The AI response appears to be empty or contains only internal processing tags.",
                );
                setSowStatus("idle");
                return;
            }

            if (!currentDoc?.id) {
                log("❌ Missing document ID");
                toast.error(
                    "No document is open. Please open a document first.",
                );
                setSowStatus("idle");
                return;
            }

            extractFinancialReasoning(trimmedContent);

            try {
                let filteredContent = trimmedContent;
                filteredContent = filteredContent.replace(
                    /<thinking>([\s\S]*?)<\/thinking>/gi,
                    "",
                );
                filteredContent = filteredContent.replace(
                    /<think>([\s\S]*?)<\/think>/gi,
                    "",
                );

                // Enhanced JSON detection for manual insertion
                let processedContent = filteredContent;
                let extractedJSONData = null;

                // Try to extract V4.1 JSON format from the content
                extractedJSONData = extractJSONFromContent(filteredContent);
                if (extractedJSONData) {
                    log("🎯 [Manual Insert] Detected V4.1 JSON in content");
                    // Convert JSON to markdown format for processing
                    processedContent =
                        convertV41JSONToEditorFormat(extractedJSONData);
                }

                // Complex content conversion logic with proper TipTap JSON structure
                let convertedContent: any;
                let finalContent: any;

                // Extract budget and discount information
                const { budget, discount } =
                    extractBudgetAndDiscount(processedContent);

                // Convert markdown to TipTap JSON structure
                const convertOptions: any = {
                    preserveFormatting: true,
                    extractPricing: true,
                };

                // Sanitize roles if provided
                const sanitized =
                    suggestedRoles && suggestedRoles.length > 0
                        ? sanitizeEmptyTextNodes(suggestedRoles)
                        : [];

                try {
                    convertedContent = convertMarkdownToNovelJSON(
                        processedContent,
                        sanitized,
                        convertOptions,
                    );
                    finalContent = convertedContent;
                } catch (error) {
                    console.error("Error converting content:", error);
                    finalContent = { type: "doc", content: [] };
                }

                // CRITICAL DIAGNOSTIC: Check content type before insertion
                console.log("🧩 Final Content Type Check:");
                console.log(
                    "FinalContent is object:",
                    typeof finalContent === "object" && finalContent !== null,
                );
                console.log("FinalContent type attribute:", finalContent?.type);
                if (
                    typeof finalContent === "string" ||
                    !finalContent ||
                    finalContent.type !== "doc"
                ) {
                    console.error(
                        "❌ CRITICAL INSERTION FAILURE: Final content is not a valid TipTap JSON object (type: 'doc'). Inserting raw string is blocked.",
                    );
                    toast.error("Insertion failed: Content conversion error.");
                    setSowStatus("idle");
                    return; // Block insertion of invalid data
                }

                // Update editor with properly structured content
                if (editorRef.current) {
                    if (editorRef.current.commands?.setContent) {
                        editorRef.current.commands.setContent(finalContent);
                    } else {
                        editorRef.current.insertContent(finalContent);
                    }
                    // Sync with parent component state
                    if (setLatestEditorJSON) {
                        setLatestEditorJSON(finalContent);
                    }
                    log(
                        "✅ Content inserted successfully with proper TipTap structure",
                    );
                }

                // Attempt to embed to AnythingLLM workspace if configured (non-blocking)
                // This runs asynchronously and won't block content insertion
                const workspaceForAgent = getWorkspaceForAgent(
                    currentAgentId || "",
                );
                if (workspaceForAgent && currentDoc?.id) {
                    // Run embedding in background - don't await to avoid blocking insertion
                    (async () => {
                        try {
                            // Get HTML content from editor if available, otherwise use filtered markdown
                            let htmlContent = processedContent;
                            if (editorRef.current?.getHTML) {
                                htmlContent = editorRef.current.getHTML();
                            } else if (editorRef.current?.view?.dom) {
                                // Fallback: try to get HTML from editor DOM
                                htmlContent =
                                    editorRef.current.view.dom.innerHTML ||
                                    processedContent;
                            }

                            // Fix parameter order: workspaceSlug, sowTitle, htmlContent, metadata
                            const success = await anythingLLM.embedSOWDocument(
                                workspaceForAgent,
                                currentDoc?.title ||
                                    currentDoc?.id ||
                                    "Untitled SOW",
                                htmlContent,
                                {
                                    clientContext: currentDoc?.clientName || "",
                                    source: "chat_insertion",
                                },
                            );
                            if (success) {
                                log(
                                    "✅ Document embedded in AnythingLLM workspace",
                                );
                            } else {
                                log(
                                    "⚠️ Embedding completed with warnings (non-critical)",
                                );
                            }
                        } catch (embedError) {
                            // Log but don't throw - embedding is optional
                            log(
                                "⚠️ Embedding error (non-critical):",
                                embedError,
                            );
                            console.warn(
                                "⚠️ Failed to embed document to AnythingLLM (this is non-critical):",
                                embedError,
                            );
                        }
                    })();
                }

                // Mark SOW result as ready now that insertion completed
                try {
                    setSowStatus("done");
                } catch (e) {
                    // ignore if setter unavailable
                }

                toast.success("✅ Content inserted into editor!");
            } catch (error) {
                log("Error inserting content:", error);
                setSowStatus("idle");
                toast.error("❌ Failed to insert content. Please try again.");
            }
        },
        [
            currentDoc,
            currentAgentId,
            editorRef,
            log,
            sowStatus,
            setSowStatus,
            setLatestEditorJSON,
        ],
    );

    const handleSendMessage = useCallback(
        async (
            message: string,
            threadSlugParam?: string | null,
            attachments?: Array<{
                name: string;
                mime: string;
                contentString: string;
            }>,
        ) => {
            const isDashboardMode = viewMode === "dashboard";

            if (!message.trim()) return;

            if (message.trim().toLowerCase() === "/help") {
                const assistantMessage: ChatMessage = {
                    id: `msg${Date.now()}-assistant`,
                    role: "assistant",
                    content: "Commands: /new, /rename, /export, /share",
                    timestamp: Date.now(),
                };
                setChatMessages((prev) => [...prev, assistantMessage]);
                return;
            }

            // Prevent duplicate submissions if a SOW generation is already running
            if (sowStatus === "processing") {
                pendingQueueRef.current.push({
                    message,
                    threadSlug: threadSlugParam,
                    attachments,
                });
                toast.info("Queued. Will run after current generation.");
                return;
            }

            const now = Date.now();
            if (now - lastMessageSentTimeRef.current < MESSAGE_RATE_LIMIT) {
                log(
                    `⏱️ Rate limit: Please wait before sending another message.`,
                );
                toast.error(
                    "⏱️ Please wait a moment before sending another message.",
                );
                return;
            }
            lastMessageSentTimeRef.current = now;

            if (currentRequestControllerRef.current) {
                log("🛑 Cancelling previous request to avoid rate limiting...");
                currentRequestControllerRef.current.abort();
            }

            const controller = new AbortController();
            currentRequestControllerRef.current = controller;

            setIsChatLoading(true);

            // Mark SOW status as processing to lock UI
            try {
                setSowStatus("processing");
            } catch (e) {
                // ignore if setter unavailable
            }

            if (generationTimeoutRef.current) {
                try {
                    clearTimeout(generationTimeoutRef.current);
                } catch {}
                generationTimeoutRef.current = null;
            }
            generationTimeoutRef.current = setTimeout(() => {
                const stillProcessing = isChatLoading || !!streamingMessageId;
                if (stillProcessing) {
                    cancelCurrentGeneration();
                    toast.error("Generation timed out");
                }
            }, 60000) as unknown as number;

            // Remove auto-insert command path; insertion is only via explicit UI

            setLastUserPrompt(message);

            const userMessage: ChatMessage = {
                id: `msg${Date.now()}`,
                role: "user",
                content: message,
                timestamp: Date.now(),
            };

            const newMessages = [...chatMessages, userMessage];
            setChatMessages(newMessages);

            try {
                // Simplified flow: call AnythingLLM API for a response
                const workspace =
                    currentDoc?.workspaceSlug ||
                    getWorkspaceForAgent(currentAgentId || "");
                const threadSlug =
                    threadSlugParam ||
                    currentDoc?.threadSlug ||
                    `temp-${Date.now()}`;

                // Validate required parameters
                if (!workspace) {
                    log("❌ [Chat] No workspace available");
                    toast.error(
                        "No workspace configured. Please ensure a workspace is set up.",
                    );
                    setIsChatLoading(false);
                    currentRequestControllerRef.current = null;
                    try {
                        setSowStatus("idle");
                    } catch {}
                    return;
                }

                if (!threadSlug || threadSlug.startsWith("temp-")) {
                    log(
                        "⚠️ [Chat] Using temporary thread slug - thread may not be persisted",
                    );
                }

                log("📤 [Chat] Sending message:", {
                    workspace,
                    threadSlug,
                    messageLength: message.length,
                    hasCurrentDoc: !!currentDoc,
                });

                // Create initial assistant message for streaming
                const assistantMessageId = `msg${Date.now()}-assistant`;
                const assistantMessage: ChatMessage = {
                    id: assistantMessageId,
                    role: "assistant",
                    content: "", // Start empty, will be filled by streaming
                    timestamp: Date.now(),
                };

                // Add the assistant message to state immediately for streaming
                setChatMessages((prev) => [...prev, assistantMessage]);
                setStreamingMessageId(assistantMessageId);

                // Build the streaming endpoint URL
                const streamEndpoint = threadSlug
                    ? `/api/anythingllm/stream-chat?thread=${encodeURIComponent(threadSlug)}`
                    : `/api/anythingllm/stream-chat`;

                log("📡 [Chat] Starting SSE stream:", {
                    streamEndpoint,
                    threadSlug,
                    workspace,
                });

                // Start streaming request
                const streamResponse = await fetch(streamEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        workspaceSlug: workspace,
                        message: message,
                        mode: "chat",
                        // Include any additional context from current document
                        ...(currentDoc && {
                            context: {
                                documentTitle: currentDoc.title,
                                documentContent: currentDoc.content,
                            },
                        }),
                    }),
                    signal: controller.signal,
                });

                if (!streamResponse.ok) {
                    const errorText = await streamResponse
                        .text()
                        .catch(() => "Unknown error");
                    log("❌ [Chat] Stream response failed:", {
                        status: streamResponse.status,
                        error: errorText,
                    });
                    toast.error(
                        `Stream failed: ${streamResponse.status} ${errorText}`,
                    );

                    // Remove the empty assistant message
                    setChatMessages((prev) =>
                        prev.filter((msg) => msg.id !== assistantMessageId),
                    );
                    setStreamingMessageId(null);
                    setIsChatLoading(false);
                    currentRequestControllerRef.current = null;
                    try {
                        setSowStatus("idle");
                    } catch {}
                    return;
                }

                if (!streamResponse.body) {
                    log("❌ [Chat] No response body for streaming");
                    toast.error("Streaming not supported by the server");

                    // Remove the empty assistant message
                    setChatMessages((prev) =>
                        prev.filter((msg) => msg.id !== assistantMessageId),
                    );
                    setStreamingMessageId(null);
                    setIsChatLoading(false);
                    currentRequestControllerRef.current = null;
                    try {
                        setSowStatus("idle");
                    } catch {}
                    return;
                }

                // Process the streaming response
                const reader = streamResponse.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedContent = "";
                let buffer = "";

                log("🔄 [Chat] Starting to read stream...");

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                try {
                                    const data = JSON.parse(line.slice(6));

                                    if (
                                        data.type === "textResponseChunk" &&
                                        data.textResponse
                                    ) {
                                        // Append the new chunk to accumulated content
                                        accumulatedContent += data.textResponse;

                                        // Update the assistant message in real-time
                                        setChatMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === assistantMessageId
                                                    ? {
                                                          ...msg,
                                                          content:
                                                              accumulatedContent,
                                                      }
                                                    : msg,
                                            ),
                                        );

                                        // Dispatch thinking update event for editor accordion
                                        if (
                                            accumulatedContent.includes(
                                                "<thinking>",
                                            ) ||
                                            accumulatedContent.includes(
                                                "let me",
                                            )
                                        ) {
                                            window.dispatchEvent(
                                                new CustomEvent(
                                                    "thinking-updated",
                                                    {
                                                        detail: {
                                                            messageId:
                                                                assistantMessageId,
                                                            thinking:
                                                                accumulatedContent,
                                                            isStreaming: true,
                                                        },
                                                    },
                                                ),
                                            );
                                        }
                                    } else if (
                                        data.type === "textResponse" &&
                                        data.textResponse
                                    ) {
                                        // Final response
                                        accumulatedContent = data.textResponse;
                                        setChatMessages((prev) =>
                                            prev.map((msg) =>
                                                msg.id === assistantMessageId
                                                    ? {
                                                          ...msg,
                                                          content:
                                                              accumulatedContent,
                                                      }
                                                    : msg,
                                            ),
                                        );
                                    }
                                } catch (parseError) {
                                    log(
                                        "⚠️ [Chat] Failed to parse SSE data:",
                                        line,
                                        parseError,
                                    );
                                }
                            }
                        }
                    }

                    log(
                        "✅ [Chat] Stream completed, total content length:",
                        accumulatedContent.length,
                    );

                    // Final thinking update
                    window.dispatchEvent(
                        new CustomEvent("thinking-updated", {
                            detail: {
                                messageId: assistantMessageId,
                                thinking: accumulatedContent,
                                isStreaming: false,
                            },
                        }),
                    );
                } catch (streamError) {
                    log("❌ [Chat] Stream reading error:", streamError);
                    if (streamError.name !== "AbortError") {
                        toast.error("Error reading stream response");
                    }
                } finally {
                    reader.releaseLock();
                }

                // Use the final accumulated content for processing
                const responseContent = accumulatedContent;

                // Clear streaming state
                setStreamingMessageId(null);

                // Enhanced JSON detection and auto-insertion logic
                const hasMarker =
                    assistantMessage.content &&
                    assistantMessage.content.includes(
                        "*** Insert into editor:",
                    );
                const hasFencedJSON =
                    assistantMessage.content &&
                    assistantMessage.content.includes("```json");

                // Check for unfenced JSON that might be a pricing response
                let hasUnfencedJSON = false;
                let extractedJSONData = null;
                let formattedMarkdownContent = assistantMessage.content;

                // Try to extract V4.1 JSON format from the response
                if (assistantMessage.content) {
                    extractedJSONData = extractJSONFromContent(
                        assistantMessage.content,
                    );
                    if (extractedJSONData) {
                        hasUnfencedJSON = true;
                        console.log(
                            "🎯 [Auto-Insert] Detected unfenced V4.1 JSON in AI response",
                        );
                        // Convert JSON to markdown format for processing
                        formattedMarkdownContent =
                            convertV41JSONToEditorFormat(extractedJSONData);
                    }
                }

                if (
                    !isDashboardMode &&
                    (hasMarker || hasFencedJSON || hasUnfencedJSON)
                ) {
                    let contentToInsert = formattedMarkdownContent;

                    if (hasMarker && !hasUnfencedJSON) {
                        contentToInsert = assistantMessage.content.replace(
                            /\*\*\* Insert into editor:\s*/,
                            "",
                        );
                    }

                    // Process content through conversion logic
                    let filteredContent = contentToInsert;
                    filteredContent = filteredContent.replace(
                        /<thinking>([\s\S]*?)<\/thinking>/gi,
                        "",
                    );
                    filteredContent = filteredContent.replace(
                        /<think>([\s\S]*?)<\/think>/gi,
                        "",
                    );

                    // Convert to TipTap JSON structure
                    let convertedContent: any;
                    let finalContent: any;

                    const convertOptions: any = {
                        preserveFormatting: true,
                        extractPricing: true,
                    };

                    try {
                        convertedContent = convertMarkdownToNovelJSON(
                            filteredContent,
                            [],
                            convertOptions,
                        );
                        finalContent = convertedContent;
                    } catch (error) {
                        console.error("Error converting content:", error);
                        finalContent = { type: "doc", content: [] };
                    }

                    // CRITICAL DIAGNOSTIC: Check content type before insertion
                    console.log(
                        "🧩 [Automatic Insertion] Final Content Type Check:",
                    );
                    console.log(
                        "FinalContent is object:",
                        typeof finalContent === "object" &&
                            finalContent !== null,
                    );
                    console.log(
                        "FinalContent type attribute:",
                        finalContent?.type,
                    );
                    if (
                        typeof finalContent === "string" ||
                        !finalContent ||
                        finalContent.type !== "doc"
                    ) {
                        console.error(
                            "❌ CRITICAL INSERTION FAILURE: Final content is not a valid TipTap JSON object (type: 'doc'). Inserting raw string is blocked.",
                        );
                        toast.error(
                            "Insertion failed: Content conversion error.",
                        );
                        return; // Block insertion of invalid data
                    }

                    // [INJECT FIX HERE: Direct Editor Update]
                    if (editorRef.current) {
                        if (editorRef.current.commands?.setContent) {
                            editorRef.current.commands.setContent(finalContent);
                        } else {
                            editorRef.current.insertContent(finalContent);
                        }
                        // Sync latestEditorJSON immediately after insertion
                        if (setLatestEditorJSON) {
                            setLatestEditorJSON(finalContent);
                        }
                        console.log(
                            "🔒 [Automatic Fix] Editor updated and state locked.",
                        );
                    }
                    // [END FIX]

                    toast.success(
                        "✅ Content automatically inserted into SOW editor",
                    );
                }

                setIsChatLoading(false);
                currentRequestControllerRef.current = null;
                try {
                    setSowStatus("done");
                } catch {}
                try {
                    toast.success("✅ Generation complete");
                } catch {}
                if (generationTimeoutRef.current) {
                    try {
                        clearTimeout(generationTimeoutRef.current);
                    } catch {}
                    generationTimeoutRef.current = null;
                }

                // Process next queued request if available
                const next = pendingQueueRef.current.shift();
                if (next && next.message) {
                    setTimeout(() => {
                        handleSendMessage(
                            next.message,
                            next.threadSlug,
                            next.attachments,
                        );
                    }, 0);
                }
            } catch (error) {
                log("Error sending message:", error);
                setIsChatLoading(false);
                currentRequestControllerRef.current = null;
                try {
                    setSowStatus("idle");
                } catch {}
                if (generationTimeoutRef.current) {
                    try {
                        clearTimeout(generationTimeoutRef.current);
                    } catch {}
                    generationTimeoutRef.current = null;
                }
            }
        },
        [
            viewMode,
            currentDoc,
            currentAgentId,
            chatMessages,
            handleInsertContent,
            log,
            sowStatus,
            setSowStatus,
            cancelCurrentGeneration,
        ],
    );

    // Effect: agent selection based on view context
    useEffect(() => {
        if (agents.length === 0) return;

        const determineAndSetAgent = async () => {
            let agentIdToUse: string | null = null;

            if (viewMode === "dashboard") {
                log(
                    "🎯 [Agent Selection] In DASHBOARD mode - agent managed by dashboard component",
                );
                setCurrentAgentId(null);
            } else if (viewMode === "editor" && currentDoc?.id) {
                try {
                    const prefResponse = await fetch(
                        "/api/preferences/current_agent_id",
                    );
                    if (prefResponse.ok) {
                        const { value } = await prefResponse.json();
                        if (value && agents.find((a) => a.id === value)) {
                            agentIdToUse = value;
                            log(
                                `🎯 [Agent Selection] Using saved agent preference: ${value}`,
                            );
                        }
                    }
                } catch (err) {
                    log("Failed to load agent preference:", err);
                }

                if (!agentIdToUse) {
                    const genArchitect = agents.find(
                        (a) =>
                            a.name === "GEN - The Architect" ||
                            a.id === "gen-the-architect",
                    );
                    agentIdToUse = genArchitect?.id || agents[0]?.id || null;
                    log(
                        `🎯 [Agent Selection] In EDITOR mode - using default agent: ${agentIdToUse}`,
                    );
                }

                setCurrentAgentId(agentIdToUse);
            } else {
                log(
                    "🎯 [Agent Selection] No context yet - deferring agent selection",
                );
                setCurrentAgentId(null);
            }
        };

        determineAndSetAgent();
    }, [agents, viewMode, currentDoc]);

    // Effect: persist current agent to preferences
    useEffect(() => {
        if (currentAgentId) {
            fetch("/api/preferences/current_agent_id", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value: currentAgentId }),
            }).catch((err) => log("Failed to save agent preference:", err));
        }
    }, [currentAgentId]);

    // Effect: reactive chat context switching between Dashboard and Editor
    useEffect(() => {
        const switchContext = async () => {
            if (viewMode === "dashboard") {
                setChatMessages([]);
                setStreamingMessageId(null);
            } else if (viewMode === "editor") {
                const doc = currentDoc;
                if (
                    doc?.threadSlug &&
                    !doc.threadSlug.startsWith("temp-") &&
                    doc.workspaceSlug
                ) {
                    try {
                        log(
                            "💬 [Context Switch] Loading SOW chat history for thread:",
                            doc.threadSlug,
                        );
                        const history = await anythingLLM.getThreadChats(
                            doc.workspaceSlug,
                            doc.threadSlug,
                        );
                        const messages: ChatMessage[] = (history || []).map(
                            (msg: any, index: number) => ({
                                id: `msg-${msg.id || Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                                role:
                                    msg.role === "user" ? "user" : "assistant",
                                content: msg.content,
                                timestamp: Date.now(),
                            }),
                        );
                        // Guard: only set history if there are no local messages and no active streaming message
                        if (chatMessages.length === 0 && !streamingMessageId) {
                            setChatMessages(messages);
                        } else {
                            log(
                                "⚠️ [Context Switch] Skipping history load to avoid overwriting local messages.",
                            );
                        }
                    } catch (e) {
                        log(
                            "⚠️ Failed to load SOW chat history on context switch:",
                            e,
                        );
                        setChatMessages([]);
                    }
                } else {
                    setChatMessages([]);
                }
            }
        };

        switchContext();
    }, [viewMode, currentDoc, documents]);

    return {
        agents,
        currentAgentId,
        setCurrentAgentId,
        chatMessages,
        isChatLoading,
        streamingMessageId,
        lastUserPrompt,
        userPromptDiscount,
        setUserPromptDiscount,
        multiScopePricingData,
        setMultiScopePricingData,
        setChatMessages,
        handleCreateAgent,
        handleSelectAgent,
        handleUpdateAgent,
        handleDeleteAgent,
        handleInsertContent,
        handleSendMessage,
        cancelCurrentGeneration,
    };
}
