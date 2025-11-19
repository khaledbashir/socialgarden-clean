"use client";

// ✍️ Workspace SOW Editor Sidebar - Full-featured SOW generation with The Architect
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import {
    ChevronRight,
    Send,
    Bot,
    Plus,
    Loader2,
    Paperclip,
    X,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Copy,
    Check,
    Save,
    Undo2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StreamingThoughtAccordion } from "./streaming-thought-accordion";
import { cleanSOWContent } from "@/lib/export-utils";
import {
    handleDocumentUploadAndPin,
    uploadAndPinSingleFile,
    type FileUploadProgress,
} from "@/lib/document-pinning";

interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: number;
}

interface WorkspaceChatProps {
    isOpen: boolean;
    onToggle: () => void;
    chatMessages: ChatMessage[];
    onSendMessage: (
        message: string,
        threadSlug?: string | null,
        attachments?: Array<{
            name: string;
            mime: string;
            contentString: string;
        }>,
    ) => void;
    isLoading?: boolean;
    onInsertToEditor: (content: string) => void;
    streamingMessageId?: string | null;
    editorWorkspaceSlug: string; // Workspace slug for currently open SOW
    editorThreadSlug?: string | null; // Current thread for the open SOW
    onEditorThreadChange: (slug: string | null) => void;
    onClearChat: () => void;
    onReplaceChatMessages: (
        messages: Array<{
            id: string;
            role: "user" | "assistant";
            content: string;
            timestamp: number;
        }>,
    ) => void;
    lastUserPrompt?: string; // Last user message for retry functionality
}

export default function WorkspaceChat({
    isOpen,
    onToggle,
    chatMessages,
    onSendMessage,
    isLoading = false,
    onInsertToEditor,
    streamingMessageId,
    editorWorkspaceSlug,
    editorThreadSlug,
    onEditorThreadChange,
    onClearChat,
    onReplaceChatMessages,
    lastUserPrompt = "",
}: WorkspaceChatProps) {
    const [chatInput, setChatInput] = useState("");
    const [workspacePrompt, setWorkspacePrompt] = useState<string>("");
    const [loadingPrompt, setLoadingPrompt] = useState(false);

    // 🧵 THREAD MANAGEMENT STATE
    const [threads, setThreads] = useState<
        Array<{ slug: string; name: string; id: number; createdAt: string }>
    >([]);
    const [currentThreadSlug, setCurrentThreadSlug] = useState<string | null>(
        null,
    );
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [showThreadList, setShowThreadList] = useState(false);

    // 📎 ATTACHMENT STATE
    const [attachments, setAttachments] = useState<
        Array<{ name: string; mime: string; contentString: string }>
    >([]);
    const [uploading, setUploading] = useState(false);

    // 📄 DOCUMENT UPLOAD STATE (Multi-file support)
    const [pendingFiles, setPendingFiles] = useState<FileUploadProgress[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploadAreaCollapsed, setIsUploadAreaCollapsed] = useState(false);

    // ⚙️ ADVANCED FEATURES STATE
    const [showSettings, setShowSettings] = useState(false);
    const [showSlashCommands, setShowSlashCommands] = useState(false);
    const [selectedModelForAgent, setSelectedModelForAgent] = useState("");

    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const documentUploadInputRef = useRef<HTMLInputElement>(null);
    const [showAllMessages, setShowAllMessages] = useState(false);
    const MAX_MESSAGES = 100; // windowing to reduce render cost
    
    // 🎯 Copy button state
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [copiedJsonId, setCopiedJsonId] = useState<string | null>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [chatMessages]);

    // 🎯 Auto-collapse upload area when all files complete
    useEffect(() => {
        if (pendingFiles.length === 0) {
            setIsUploadAreaCollapsed(false);
            return;
        }

        const allComplete = pendingFiles.every(
            (f) => f.status === "success" || f.status === "error"
        );
        const hasActiveUploads = pendingFiles.some(
            (f) => f.status === "uploading" || f.status === "pinning" || f.status === "pending"
        );

        // Auto-collapse after all files complete (with delay to show completion state)
        if (allComplete && !hasActiveUploads && !isUploadAreaCollapsed) {
            const timer = setTimeout(() => {
                setIsUploadAreaCollapsed(true);
            }, 2000); // 2 second delay to show success state

            return () => clearTimeout(timer);
        }
    }, [pendingFiles, isUploadAreaCollapsed]);

    // Load workspace system prompt
    useEffect(() => {
        const loadPrompt = async () => {
            if (!editorWorkspaceSlug) return;
            setLoadingPrompt(true);
            try {
                const res = await fetch(
                    `/api/anythingllm/workspace?slug=${encodeURIComponent(editorWorkspaceSlug)}`,
                );
                if (!res.ok) {
                    setWorkspacePrompt("");
                    return;
                }
                const data = await res.json();
                const prompt =
                    data?.workspace?.openAiPrompt ||
                    data?.workspace?.prompt ||
                    "";
                setWorkspacePrompt(prompt || "");
            } catch (e) {
                setWorkspacePrompt("");
            } finally {
                setLoadingPrompt(false);
            }
        };
        loadPrompt();
    }, [editorWorkspaceSlug]);
    // Load threads on mount and when workspace changes
    // � NO LOCALSTORAGE - Thread persistence managed by database (sow.threadSlug)
    useEffect(() => {
        const initializeThreads = async () => {
            if (!editorWorkspaceSlug) return;

            // Load all threads for this workspace
            await loadThreads(editorWorkspaceSlug);

            // Use thread from parent (persisted in database)
            if (editorThreadSlug) {
                setCurrentThreadSlug(editorThreadSlug);

                // Only load thread history if we don't already have messages
                if (chatMessages.length === 0) {
                    try {
                        const response = await fetch(
                            `/api/anythingllm/thread?workspace=${encodeURIComponent(editorWorkspaceSlug)}&thread=${encodeURIComponent(editorThreadSlug)}`,
                        );
                        if (response.ok) {
                            const data = await response.json();
                            const mapped = (data.history || []).map((msg: any) => ({
                                id: `msg-${msg.id || Date.now()}-${Math.random()}`,
                                role: msg.role === "user" ? "user" : "assistant",
                                content: msg.content || "",
                                timestamp: new Date(
                                    msg.createdAt || Date.now(),
                                ).getTime(),
                            }));
                            onReplaceChatMessages(mapped);
                            console.log(
                                "✅ Loaded thread history from AnythingLLM:",
                                mapped.length,
                                "messages",
                            );
                        }
                    } catch (error) {
                        console.warn("⚠️ Failed to load thread history:", error);
                    }
                }
            }
        };

        initializeThreads();
    }, [editorWorkspaceSlug, editorThreadSlug, chatMessages.length]);

    // Focus input when component mounts or thread changes
    useEffect(() => {
        setTimeout(() => chatInputRef.current?.focus(), 50);
    }, [editorThreadSlug]);

    const loadThreads = async (workspaceSlug: string) => {
        console.log("📂 Loading threads for workspace:", workspaceSlug);
        setLoadingThreads(true);

        try {
            const response = await fetch(
                `/api/anythingllm/threads?workspace=${encodeURIComponent(workspaceSlug)}`,
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("❌ Failed to load threads:", {
                    status: response.status,
                    workspace: workspaceSlug,
                    error: errorData,
                });

                // Don't throw - just set empty threads and let the user continue
                setThreads([]);
                return;
            }

            const data = await response.json();
            const threadList = data?.threads || [];

            console.log("✅ Threads loaded:", {
                workspace: workspaceSlug,
                count: threadList.length,
            });

            setThreads(threadList);
        } catch (error: any) {
            console.error("❌ Exception loading threads:", error);
            setThreads([]);
        } finally {
            setLoadingThreads(false);
        }
    };

    const handleNewThread = async (): Promise<string | null> => {
        if (!editorWorkspaceSlug) {
            toast.error("No workspace available");
            return null;
        }

        console.log(
            "🆕 Creating new thread for workspace:",
            editorWorkspaceSlug,
        );
        setLoadingThreads(true);

        try {
            const response = await fetch(
                `/api/anythingllm/thread?workspace=${encodeURIComponent(editorWorkspaceSlug)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workspace: editorWorkspaceSlug }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("❌ Thread creation failed:", {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData,
                });
                throw new Error(
                    `Failed to create thread: ${response.status} ${response.statusText}`,
                );
            }

            const data = await response.json();
            const newThreadSlug = data.thread?.slug;

            if (!newThreadSlug) {
                console.error("❌ No thread slug in response:", data);
                throw new Error("No thread slug returned from server");
            }

            console.log("✅ New thread created:", newThreadSlug);

            // Add to local state
            const newThread = {
                slug: newThreadSlug,
                name: data.thread?.name || "New Chat",
                id: data.thread?.id || Date.now(),
                createdAt: new Date().toISOString(),
            };
            setThreads((prev) => [newThread, ...prev]);
            setCurrentThreadSlug(newThreadSlug);

            // Notify parent
            onEditorThreadChange(newThreadSlug);

            // Clear chat for new thread
            onClearChat();

            return newThreadSlug;
        } catch (error) {
            console.error("❌ Failed to create thread:", error);
            toast.error(
                `Failed to create thread: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
            return null;
        } finally {
            setLoadingThreads(false);
        }
    };

    const handleToggleThreads = () => {
        setShowThreadList((prev) => !prev);
    };

    const handleSelectThread = async (threadSlug: string) => {
        console.log("📂 Switching to thread:", threadSlug);
        setCurrentThreadSlug(threadSlug);
        setShowThreadList(false);
        setLoadingThreads(true);

        try {
            const response = await fetch(
                `/api/anythingllm/thread?workspace=${encodeURIComponent(editorWorkspaceSlug)}&thread=${encodeURIComponent(threadSlug)}`,
            );

            if (!response.ok) {
                throw new Error("Failed to load thread history");
            }

            const data = await response.json();
            console.log(
                "✅ Loaded thread history:",
                data.history?.length || 0,
                "messages",
            );

            const mapped = (data.history || []).map((msg: any) => ({
                id: `msg-${msg.id || Date.now()}-${Math.random()}`,
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content || "",
                timestamp: new Date(msg.createdAt || Date.now()).getTime(),
            }));

            onReplaceChatMessages(mapped);
            onEditorThreadChange(threadSlug);
        } catch (error) {
            console.error("❌ Failed to load thread history:", error);
        } finally {
            setLoadingThreads(false);
        }
    };

    const handleDeleteThread = async (threadSlug: string) => {
        if (!confirm("Delete this chat? This cannot be undone.")) return;

        console.log("🗑️ Deleting thread:", threadSlug);

        try {
            const response = await fetch(
                `/api/anythingllm/thread?workspace=${encodeURIComponent(editorWorkspaceSlug)}&thread=${encodeURIComponent(threadSlug)}`,
                {
                    method: "DELETE",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to delete thread");
            }

            setThreads((prev) => prev.filter((t) => t.slug !== threadSlug));

            if (currentThreadSlug === threadSlug) {
                const remainingThreads = threads.filter(
                    (t) => t.slug !== threadSlug,
                );
                if (remainingThreads.length > 0) {
                    handleSelectThread(remainingThreads[0].slug);
                } else {
                    const newSlug = await handleNewThread();
                    if (newSlug) onEditorThreadChange(newSlug);
                }
            }

            // Notify parent if current thread was deleted
            const stillExists = threads.some((t) => t.slug === threadSlug);
            if (!stillExists) onEditorThreadChange(null);

            console.log("✅ Thread deleted successfully");
        } catch (error) {
            console.error("❌ Failed to delete thread:", error);
            toast.error("Failed to delete thread");
        }
    };

    // 🎯 Retry handler - resend last user message
    const handleRetry = async () => {
        // Get the last user message from chat history (more reliable than lastUserPrompt)
        const lastUserMessage = [...chatMessages]
            .reverse()
            .find((m) => m.role === "user");
        
        const messageToRetry = lastUserMessage?.content || lastUserPrompt;
        
        if (!messageToRetry.trim() || isLoading) {
            if (!messageToRetry.trim()) {
                toast.error("No previous message to retry");
            }
            return;
        }

        // 🔥 CRITICAL FIX: Auto-create thread if none exists
        let threadSlug = currentThreadSlug;
        if (!threadSlug) {
            console.log(
                "🆕 No thread exists - creating one automatically before retry",
            );
            threadSlug = await handleNewThread();
            if (!threadSlug) {
                toast.error("Failed to create chat thread");
                return;
            }
        }

        console.log("🔄 Retrying last message:", {
            message: messageToRetry,
            threadSlug,
            workspaceSlug: editorWorkspaceSlug,
        });

        onSendMessage(messageToRetry, threadSlug, []);
    };

    // 🎯 Copy prose content
    const handleCopyProse = async (content: string, messageId: string) => {
        // Remove JSON blocks and thinking tags for prose copy
        let proseContent = content;
        proseContent = proseContent.replace(/```json[\s\S]*?```/gi, '').trim();
        proseContent = proseContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
        proseContent = proseContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        proseContent = proseContent.replace(/<AI_THINK>[\s\S]*?<\/AI_THINK>/gi, '').trim();
        proseContent = proseContent.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '').trim();

        try {
            await navigator.clipboard.writeText(proseContent);
            setCopiedMessageId(messageId);
            toast.success("Prose copied to clipboard");
            setTimeout(() => setCopiedMessageId(null), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            toast.error("Failed to copy to clipboard");
        }
    };

    // 🎯 Copy JSON content
    const handleCopyJSON = async (content: string, messageId: string) => {
        // Extract JSON block
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/i);
        if (!jsonMatch || !jsonMatch[1]) {
            toast.error("No JSON block found in this message");
            return;
        }

        try {
            const jsonContent = jsonMatch[1].trim();
            await navigator.clipboard.writeText(jsonContent);
            setCopiedJsonId(messageId);
            toast.success("JSON copied to clipboard");
            setTimeout(() => setCopiedJsonId(null), 2000);
        } catch (error) {
            console.error("Failed to copy JSON:", error);
            toast.error("Failed to copy JSON to clipboard");
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isLoading) return;

        // 🔥 CRITICAL FIX: Auto-create thread if none exists
        let threadSlug = currentThreadSlug;
        if (!threadSlug) {
            console.log(
                "🆕 No thread exists - creating one automatically before sending message",
            );
            threadSlug = await handleNewThread();
            if (!threadSlug) {
                toast.error("Failed to create chat thread");
                return;
            }
        }

        console.log("📤 Sending message:", {
            message: chatInput,
            threadSlug,
            attachments: attachments.length,
            workspaceSlug: editorWorkspaceSlug,
        });

        onSendMessage(chatInput, threadSlug, attachments);
        setChatInput("");
        setAttachments([]);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Enhance prompt using AI
    const [enhancing, setEnhancing] = useState(false);
    const handleEnhanceOnly = async () => {
        if (!chatInput.trim() || isLoading || enhancing) return;
        try {
            setEnhancing(true);

            // ✅ Use dedicated enhance-prompt endpoint
            const resp = await fetch("/api/ai/enhance-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: chatInput,
                }),
            });

            if (!resp.ok) {
                const msg = await resp.text().catch(() => "");
                throw new Error(msg || `Enhancer error ${resp.status}`);
            }

            const data = await resp.json();
            const enhanced = data.enhancedPrompt;

            if (!enhanced || !enhanced.trim()) {
                toast.error("Enhancer returned empty text");
                return;
            }

            setChatInput(enhanced.trim());
            toast.success("Prompt enhanced");
        } catch (e) {
            console.error("Enhance failed:", e);
            const errorMsg = e instanceof Error ? e.message : String(e);
            if (
                errorMsg.includes(
                    "utility-prompt-enhancer is not a valid workspace",
                )
            ) {
                toast.error(
                    "Prompt enhancer workspace not found. Please check your AnythingLLM configuration.",
                );
            } else if (errorMsg.includes("400")) {
                toast.error(
                    "Invalid prompt format. Please try rephrasing your request.",
                );
            } else {
                toast.error("Failed to enhance your prompt. Please try again.");
            }
        } finally {
            setEnhancing(false);
        }
    };

    // File attachment handling
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                console.log("📎 Processing file:", file.name, file.type);

                const reader = new FileReader();
                reader.onload = (event) => {
                    const contentString = event.target?.result as string;
                    setAttachments((prev) => [
                        ...prev,
                        {
                            name: file.name,
                            mime: file.type,
                            contentString,
                        },
                    ]);
                    console.log("✅ File ready for attachment:", file.name);
                };
                reader.readAsDataURL(file);
            }
        } catch (error) {
            console.error("❌ Error processing file:", error);
            toast.error("Failed to process file");
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    // Handle file selection (multiple files)
    const handleFileSelection = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const validTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
        ];
        const validExtensions = [".pdf", ".doc", ".docx", ".txt", ".md"];
        const maxSize = 50 * 1024 * 1024; // 50MB

        const newFiles: FileUploadProgress[] = Array.from(files)
            .filter((file) => {
                const fileExtension = file.name
                    .toLowerCase()
                    .substring(file.name.lastIndexOf("."));
                const isValidType =
                    validTypes.includes(file.type) ||
                    validExtensions.includes(fileExtension);

                if (!isValidType) {
                    toast.error(
                        `"${file.name}" is not a supported file type. Please upload PDF, Word, or text files.`,
                    );
                    return false;
                }

                if (file.size > maxSize) {
                    toast.error(
                        `"${file.name}" exceeds 50MB limit and will be skipped.`,
                    );
                    return false;
                }

                return true;
            })
            .map((file) => ({
                id: `${Date.now()}-${Math.random()}`,
                file,
                status: "pending" as const,
                progress: 0,
            }));

        if (newFiles.length > 0) {
            setPendingFiles((prev) => [...prev, ...newFiles]);
            // Expand upload area when new files are added
            setIsUploadAreaCollapsed(false);
        }
    };

    // Document upload handler (legacy single-file support)
    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelection(e.target.files);
        // Reset input to allow selecting the same file again
        if (e.target) {
            e.target.value = "";
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelection(files);
        }
    };

    // Remove file from pending list
    const removePendingFile = (fileId: string) => {
        setPendingFiles((prev) => {
            const updated = prev.filter((f) => f.id !== fileId);
            // Auto-collapse if no files remaining
            if (updated.length === 0) {
                setIsUploadAreaCollapsed(false);
            }
            return updated;
        });
    };

    // Process batch upload
    const handleBatchUpload = async () => {
        if (pendingFiles.length === 0 || !editorWorkspaceSlug) return;

        const filesToUpload = pendingFiles.filter((f) => f.status === "pending");
        if (filesToUpload.length === 0) return;

        setUploading(true);

        const successMessages: string[] = [];
        const errorMessages: string[] = [];

        // Process each file sequentially
        for (const fileProgress of filesToUpload) {
            // Update status to uploading
            setPendingFiles((prev) =>
                prev.map((f) =>
                    f.id === fileProgress.id
                        ? { ...f, status: "uploading", progress: 0 }
                        : f,
                ),
            );

            const result = await uploadAndPinSingleFile(
                fileProgress.file,
                editorWorkspaceSlug,
                (progress) => {
                    // Update progress in real-time
                    setPendingFiles((prev) =>
                        prev.map((f) =>
                            f.id === fileProgress.id ? progress : f,
                        ),
                    );
                },
                fileProgress.id, // Pass the existing file ID so progress updates match correctly
            );

            if (result.success) {
                successMessages.push(fileProgress.file.name);
            } else {
                errorMessages.push(
                    `${fileProgress.file.name}: ${result.error || "Unknown error"}`,
                );
            }
        }

        // Show summary toast
        if (successMessages.length > 0) {
            toast.success(
                `${successMessages.length} document(s) uploaded and pinned successfully!`,
            );
        }
        if (errorMessages.length > 0) {
            toast.error(
                `${errorMessages.length} document(s) failed to upload. Check the file list for details.`,
            );
        }

        // Add summary message to chat
        if (successMessages.length > 0) {
            const summaryMessage: {
                id: string;
                role: "user" | "assistant";
                content: string;
                timestamp: number;
            } = {
                id: Date.now().toString(),
                role: "assistant",
                content: `✅ ${successMessages.length} document(s) have been uploaded and pinned to the workspace. They are now available in the knowledge base:\n\n${successMessages.map((name) => `• ${name}`).join("\n")}`,
                timestamp: Date.now(),
            };

            const validMessages = chatMessages
                .filter(
                    (msg) => msg.role === "user" || msg.role === "assistant",
                )
                .map((msg) => ({
                    id: msg.id,
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                    timestamp: msg.timestamp,
                }));
            onReplaceChatMessages([...validMessages, summaryMessage]);
        }

        // 🎯 Auto-collapse upload area after all files complete
        const allComplete = pendingFiles.every(
            (f) => f.status === "success" || f.status === "error"
        );
        if (allComplete) {
            // Auto-collapse after a brief delay to show completion
            setTimeout(() => {
                setIsUploadAreaCollapsed(true);
            }, 2000); // 2 second delay to show success state
        }

        // Clear completed files after a delay (longer delay to allow user to see results)
        setTimeout(() => {
            setPendingFiles((prev) =>
                prev.filter((f) => f.status !== "success" && f.status !== "error"),
            );
            // Reset collapse state when all files are cleared
            setIsUploadAreaCollapsed(false);
        }, 8000); // 8 second delay before clearing

        setUploading(false);
    };

    const handleDocumentUploadClick = () => {
        documentUploadInputRef.current?.click();
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const insertText = (text: string) => {
        setChatInput((prev) => prev + text);
        chatInputRef.current?.focus();
    };

    const slashCommands = [
        {
            command: "/reset",
            description: "Clear chat history and begin a new chat",
        },
        { command: "/help", description: "Show available commands" },
        {
            command: "/summarize",
            description: "Summarize the current conversation",
        },
    ];

    // Helper function to safely format thread dates
    const formatThreadDate = (
        dateString: string | number | null | undefined,
    ): string => {
        if (!dateString) return "Recent";

        try {
            // Handle both Unix timestamps (numbers/number strings) and ISO strings
            const timestamp =
                typeof dateString === "string" && !isNaN(Number(dateString))
                    ? Number(dateString) * 1000 // Convert Unix timestamp to milliseconds
                    : dateString;

            const date = new Date(timestamp);

            // Check if date is valid
            if (isNaN(date.getTime())) return "Recent";

            // Format as readable date
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year:
                    date.getFullYear() !== new Date().getFullYear()
                        ? "numeric"
                        : undefined,
            });
        } catch (e) {
            return "Recent";
        }
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000,
        );
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    // Return JSX
    return (
        <React.Fragment>
            <div className="h-full w-full min-w-0 bg-[#0e0f0f] border-l border-[#0E2E33] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#0E2E33] bg-[#0e0f0f] flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-white truncate">
                        Workspace Chat
                    </h2>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            onClick={handleNewThread}
                            className="bg-[#15a366] hover:bg-[#10a35a] text-white text-xs h-6 px-2 flex-shrink-0"
                            size="sm"
                            title="New chat thread for this SOW (does not create a new SOW)"
                            aria-label="New chat thread for this SOW (does not create a new SOW)"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                            onClick={handleToggleThreads}
                            className="bg-[#1c1c1c] hover:bg-[#222] text-white text-xs h-6 px-2 border border-[#2a2a2a] flex-shrink-0"
                            size="sm"
                            title="View threads"
                        >
                            📋
                        </Button>
                        <Button
                            onClick={onToggle}
                            className="bg-[#1c1c1c] hover:bg-[#222] text-white text-xs h-6 px-2 border border-[#2a2a2a] flex-shrink-0"
                            size="sm"
                            title="Hide chat panel"
                        >
                            <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Thread List */}
            {showThreadList && (
                <div className="bg-[#0E2E33] border-b border-[#0E2E33] max-h-48 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {threads.length === 0 ? (
                            <div className="text-xs text-gray-300 px-2 py-3">
                                No threads yet. Click "New Chat" to create one.
                            </div>
                        ) : (
                            threads.map((thread) => (
                                <div
                                    key={thread.slug}
                                    className={`group flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                                        currentThreadSlug === thread.slug
                                            ? "bg-[#15a366] text-white"
                                            : "text-gray-300 hover:bg-[#0e0f0f]"
                                    }`}
                                >
                                    <button
                                        onClick={() =>
                                            handleSelectThread(thread.slug)
                                        }
                                        className="flex-1 text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>
                                                {currentThreadSlug ===
                                                thread.slug
                                                    ? "●"
                                                    : "○"}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {thread.name}
                                                </div>
                                                <div className="text-[10px] opacity-60">
                                                    {formatThreadDate(
                                                        thread.createdAt,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDeleteThread(thread.slug)
                                        }
                                        className="opacity-0 group-hover:opacity-100 px-2 hover:text-red-400"
                                        title="Delete thread"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Persona Badge */}
            <div className="p-3 border-b border-[#0E2E33]">
                <div className="flex items-center gap-2 bg-[#0E2E33] px-3 py-2 rounded-md">
                    <Bot className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">
                        The Architect
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                        SOW generation
                    </span>
                </div>
            </div>

            {/* Chat Messages - Scrollable Area */}
            <ScrollArea className="flex-1 overflow-hidden">
                <div className="p-5 space-y-5">
                    {!showAllMessages && chatMessages.length > MAX_MESSAGES && (
                        <div className="flex items-center justify-between text-xs text-gray-400 bg-[#0E2E33] border border-[#1b5e5e] px-3 py-2 rounded">
                            <span>
                                Showing last {MAX_MESSAGES} of{" "}
                                {chatMessages.length} messages
                            </span>
                            <button
                                onClick={() => setShowAllMessages(true)}
                                className="underline hover:text-white"
                            >
                                Show all
                            </button>
                        </div>
                    )}
                    {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-8">
                            <Bot className="h-16 w-16 text-gray-600 mb-3" />
                            <p className="text-base text-gray-400">
                                No messages yet
                            </p>
                        </div>
                    ) : (
                        (showAllMessages
                            ? chatMessages
                            : chatMessages.slice(-MAX_MESSAGES)
                        ).map((msg) => {
                            const shouldShowButton = msg.role === "assistant";
                            const cleaned = cleanSOWContent(msg.content);
                            const segments =
                                msg.role === "assistant"
                                    ? []
                                    : [
                                          {
                                              type: "text" as const,
                                              content: msg.content,
                                          },
                                      ];

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`relative w-full max-w-[85%] min-w-0 rounded-lg p-4 break-words whitespace-pre-wrap overflow-x-hidden ${
                                            msg.role === "user"
                                                ? "bg-[#0E2E33]/30 text-white border border-[#1b5e5e]"
                                                : "bg-[#0E2E33] text-white border border-[#1b5e5e]"
                                        }`}
                                    >
                                        {/* Show thinking section with streaming support */}
                                        {msg.role === "assistant" && (
                                            <div className="mb-4">
                                                    <StreamingThoughtAccordion
                                                    content={msg.content}
                                                    messageId={msg.id}
                                                    isStreaming={
                                                        streamingMessageId ===
                                                        msg.id
                                                    }
                                                    onInsertClick={(
                                                        content,
                                                    ) => {
                                                        // Content already cleaned by StreamingThoughtAccordion's buildInsertPayload
                                                        console.log(
                                                            "📥 [WorkspaceChat] onInsertClick payload:",
                                                            content,
                                                        );
                                                        onInsertToEditor(
                                                            content,
                                                        );
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Content rendering for user messages only */}
                                        <div className="space-y-3">
                                            {segments.map((seg, i) => (
                                                <ReactMarkdown
                                                    key={i}
                                                    remarkPlugins={[remarkGfm]}
                                                    className="prose prose-invert max-w-none text-sm break-words whitespace-pre-wrap prose-pre:whitespace-pre-wrap prose-pre:overflow-x-auto"
                                                >
                                                    {seg.content}
                                                </ReactMarkdown>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 mt-4 items-center">
                                            <p className="text-xs mt-1 opacity-70 flex-1">
                                                {formatTimestamp(msg.timestamp)}
                                            </p>
                                            
                                            {/* 🎯 Action buttons for assistant messages */}
                                            {msg.role === "assistant" && (
                                                <div className="flex gap-1.5 items-center">
                                                    {/* Copy Prose Button */}
                                                    <button
                                                        onClick={() => handleCopyProse(msg.content, msg.id)}
                                                        className="p-1.5 hover:bg-[#1b5e5e] rounded transition-colors"
                                                        title="Copy prose content"
                                                    >
                                                        {copiedMessageId === msg.id ? (
                                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                                                        )}
                                                    </button>
                                                    
                                                    {/* Copy JSON Button (only if JSON exists) */}
                                                    {/```json/i.test(msg.content) && (
                                                        <button
                                                            onClick={() => handleCopyJSON(msg.content, msg.id)}
                                                            className="p-1.5 hover:bg-[#1b5e5e] rounded transition-colors"
                                                            title="Copy JSON block"
                                                        >
                                                            {copiedJsonId === msg.id ? (
                                                                <Check className="w-3.5 h-3.5 text-green-400" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* 🎯 Retry button for user messages (if it's the last user message) */}
                                            {msg.role === "user" && 
                                             chatMessages[chatMessages.length - 1]?.id === msg.id && (
                                                <button
                                                    onClick={handleRetry}
                                                    disabled={isLoading}
                                                    className="p-1.5 hover:bg-[#1b5e5e] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Retry this message"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>
            </ScrollArea>

            {/* Sticky Action Bar - Outside ScrollArea, Always Visible */}
            {(() => {
                const lastAssistant = [...chatMessages]
                    .reverse()
                    .find((m) => m.role === "assistant");
                if (!lastAssistant) return null;
                return (
                    <div className="flex-shrink-0 border-t border-[#1b5e5e] bg-[#0E2E33]/95 backdrop-blur-md p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Latest AI response ready
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-4 text-xs font-medium border-[#1CBF79] text-[#1CBF79] hover:text-white hover:bg-[#1CBF79] transition-all duration-200"
                                title="Insert the latest AI response into your SOW editor"
                                onClick={() => {
                                    // Strip thinking tags before inserting
                                    let cleaned = lastAssistant.content;
                                    cleaned = cleaned.replace(
                                        /<thinking>([\s\S]*?)<\/thinking>/gi,
                                        "",
                                    );
                                    cleaned = cleaned.replace(
                                        /<think>([\s\S]*?)<\/think>/gi,
                                        "",
                                    );
                                    cleaned = cleaned.replace(
                                        /<AI_THINK>([\s\S]*?)<\/AI_THINK>/gi,
                                        "",
                                    );
                                    cleaned = cleaned.replace(
                                        /<tool_call>[\s\S]*?<\/tool_call>/gi,
                                        "",
                                    );
                                    const trimmed = cleaned.trim();
                                    if (!trimmed) {
                                        toast.error("No content to insert. The AI response appears to be empty or contains only internal processing tags.");
                                        return;
                                    }
                                    onInsertToEditor(trimmed);
                                }}
                            >
                                <svg
                                    className="w-3 h-3 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                                Insert SOW
                            </Button>
                        </div>
                    </div>
                );
            })()}

            {/* Input Area */}
            <div className="p-5 border-t border-[#0E2E33] bg-[#0e0f0f] space-y-3">
                {/* Pending Files List with Drag-and-Drop */}
                {pendingFiles.length > 0 && (
                    <div className="space-y-2">
                        {/* 🎯 Collapsible Header */}
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-400 font-medium">
                                {pendingFiles.length} file(s) {isUploadAreaCollapsed ? "uploaded" : "ready to upload"}
                            </div>
                            <button
                                onClick={() => setIsUploadAreaCollapsed(!isUploadAreaCollapsed)}
                                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1"
                                title={isUploadAreaCollapsed ? "Expand upload area" : "Collapse upload area"}
                            >
                                {isUploadAreaCollapsed ? "▼ Expand" : "▲ Collapse"}
                            </button>
                        </div>
                        
                        {/* 🎯 Collapsible Content */}
                        {!isUploadAreaCollapsed && (
                            <div className="space-y-2">
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {pendingFiles.map((fileProgress) => (
                                <div
                                    key={fileProgress.id}
                                    className="flex items-center gap-2 bg-[#0E2E33] px-3 py-2 rounded text-xs border border-[#1b5e5e]"
                                >
                                    {/* Status Icon */}
                                    <div className="flex-shrink-0">
                                        {fileProgress.status === "pending" && (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
                                        )}
                                        {fileProgress.status === "uploading" && (
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                        )}
                                        {fileProgress.status === "pinning" && (
                                            <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                                        )}
                                        {fileProgress.status === "success" && (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        )}
                                        {fileProgress.status === "error" && (
                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-white font-medium">
                                                {fileProgress.file.name}
                                            </span>
                                            <span className="text-gray-400 flex-shrink-0">
                                                {formatFileSize(fileProgress.file.size)}
                                            </span>
                                        </div>
                                        {/* Progress Bar */}
                                        {(fileProgress.status === "uploading" ||
                                            fileProgress.status === "pinning") && (
                                            <div className="mt-1.5 w-full bg-[#1b1b1e] rounded-full h-1">
                                                <div
                                                    className="bg-[#15a366] h-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${fileProgress.progress}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {/* Status Text */}
                                        <div className="mt-1 text-[10px] text-gray-400">
                                            {fileProgress.status === "pending" &&
                                                "Ready to upload"}
                                            {fileProgress.status === "uploading" &&
                                                `Uploading... ${fileProgress.progress}%`}
                                            {fileProgress.status === "pinning" &&
                                                "Pinning to workspace..."}
                                            {fileProgress.status === "success" && (
                                                <span className="text-green-400">
                                                    ✅ Uploaded & pinned
                                                    {fileProgress.wordCount &&
                                                        ` • ${fileProgress.wordCount} words`}
                                                    {fileProgress.tokenCount &&
                                                        ` • ~${fileProgress.tokenCount} tokens`}
                                                </span>
                                            )}
                                            {fileProgress.status === "error" && (
                                                <span className="text-red-400">
                                                    ❌ {fileProgress.error || "Upload failed"}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    {(fileProgress.status === "pending" ||
                                        fileProgress.status === "error") && (
                                        <button
                                            onClick={() =>
                                                removePendingFile(fileProgress.id)
                                            }
                                            className="flex-shrink-0 p-1 hover:bg-[#1b1b1e] rounded transition-colors"
                                            title="Remove file"
                                        >
                                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                            {/* Upload Button */}
                            {pendingFiles.some((f) => f.status === "pending") && (
                                <Button
                                    onClick={handleBatchUpload}
                                    disabled={uploading || !editorWorkspaceSlug}
                                    size="sm"
                                    className="w-full bg-[#15a366] hover:bg-[#10a35a] text-white text-sm font-semibold"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Paperclip className="h-4 w-4 mr-2" />
                                            Upload {pendingFiles.filter((f) => f.status === "pending").length} Document(s)
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                        )}
                        
                        {/* 🎯 Collapsed Summary View */}
                        {isUploadAreaCollapsed && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#0E2E33]/30 px-3 py-2 rounded border border-[#1b5e5e]">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="flex-1">
                                    {pendingFiles.filter(f => f.status === "success").length} uploaded,{" "}
                                    {pendingFiles.filter(f => f.status === "error").length} failed
                                </span>
                                <button
                                    onClick={handleDocumentUploadClick}
                                    className="text-[#15a366] hover:underline flex items-center gap-1 flex-shrink-0"
                                >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span>Add more</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Drag and Drop Area - Hidden when collapsed, minimized when files exist, full when empty */}
                {!isUploadAreaCollapsed && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg transition-all duration-300 ${
                            pendingFiles.length > 0
                                ? "p-2 border-[#0E2E33]/30 bg-transparent"
                                : "p-4 border-[#0E2E33] bg-transparent"
                        } ${
                            isDragOver
                                ? "border-[#15a366] bg-[#0E2E33]/50"
                                : ""
                        }`}
                    >
                        <div className={`text-center text-sm text-gray-400 transition-all ${
                            pendingFiles.length > 0
                                ? "text-xs"
                                : ""
                        }`}>
                            {pendingFiles.length === 0 ? (
                                <>
                                    <Paperclip className="w-5 h-5 mx-auto mb-2 opacity-50" />
                                    <span>
                                        Drag and drop documents here, or{" "}
                                        <button
                                            onClick={handleDocumentUploadClick}
                                            className="text-[#15a366] hover:underline"
                                        >
                                            click to browse
                                        </button>
                                    </span>
                                    <div className="text-xs text-gray-500 mt-1">
                                        PDF, Word, or text files (max 50MB each)
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={handleDocumentUploadClick}
                                    className="text-[#15a366] hover:underline flex items-center gap-1 justify-center"
                                >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    <span>Add more documents</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((att, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 bg-[#0E2E33] px-3 py-1.5 rounded text-xs text-gray-300"
                            >
                                <span className="truncate max-w-[150px]">
                                    {att.name}
                                </span>
                                <button
                                    onClick={() => removeAttachment(idx)}
                                    className="hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Chat Input */}
                <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                        <div className="relative">
                            <Textarea
                                ref={chatInputRef}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type /help for commands..."
                                className="min-h-[50px] max-h-[150px] resize-none text-sm bg-[#0E2E33] border-[#0E2E33] text-white placeholder:text-gray-400 rounded-lg pr-12"
                            />

                            {/* Enhance button - positioned inside textarea */}
                            <button
                                onClick={handleEnhanceOnly}
                                disabled={
                                    !chatInput.trim() || isLoading || enhancing
                                }
                                className="absolute right-3 top-3 p-1.5 rounded-md bg-[#1b1b1e] hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-[#1CBF79]/30 hover:border-[#1CBF79]/60"
                                title="Enhance your prompt with AI"
                            >
                                {enhancing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1CBF79]" />
                                ) : (
                                    <span className="text-[#1CBF79] text-sm">
                                        ✨
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex gap-2 mt-2">
                            {/* File attachment input (for inline attachments) */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*,.pdf,.txt,.doc,.docx"
                            />

                            {/* Document upload input (for workspace document upload) - Multiple files */}
                            <input
                                ref={documentUploadInputRef}
                                type="file"
                                multiple
                                onChange={handleDocumentUpload}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                                disabled={uploading}
                            />

                            {/* Document upload button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-12 w-12 p-0 border border-[#0E2E33] hover:bg-[#1b1b1e]"
                                onClick={handleDocumentUploadClick}
                                disabled={uploading || !editorWorkspaceSlug}
                                title="Upload document to workspace (PDF, Word, Text)"
                            >
                                {uploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Paperclip className="h-5 w-5" />
                                )}
                            </Button>

                            {/* Send button - full width, prominent */}
                            <Button
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim() || isLoading}
                                size="sm"
                                className="flex-1 bg-[#15a366] hover:bg-[#10a35a] text-white h-12 font-semibold border-0 text-base"
                                title="Send message to The Architect"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    <Send className="h-5 w-5 mr-2" />
                                )}
                                {isLoading ? "Generating..." : "Send"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </React.Fragment>
    );
}
