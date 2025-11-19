import React, { useState, useRef, useEffect } from "react";
import {
    Send,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    Bot,
    User,
    Paperclip,
    Mic,
    Settings,
    History,
    Loader2,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage } from "@/types";
import { Button } from "@/components/tailwind/ui/button";
import { Textarea } from "@/components/tailwind/ui/textarea";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/tailwind/ui/dialog";
import { ScrollArea } from "@/components/tailwind/ui/scroll-area";
import { Badge } from "@/components/tailwind/ui/badge";
import { handleDocumentUploadAndPin } from "@/lib/document-pinning";

const MessageContent = ({ content }: { content: string }) => {
    const [expandedJSON, setExpandedJSON] = useState<Record<number, boolean>>({});

    // Hide the "Insert into editor" marker for display
    // We perform a non-destructive check first
    const hasMarker = content.includes("*** Insert into editor:");
    const displayContent = content.replace(/\*\*\* Insert into editor:[\s\S]*/, "").trim();
    
    // Split by JSON blocks
    const parts = displayContent.split(/(```json[\s\S]*?```)/g);

    return (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {parts.map((part, index) => {
                if (part.startsWith("```json")) {
                    const isExpanded = expandedJSON[index];
                    // Extract JSON content for display
                    const jsonContent = part.replace(/```json\s*|\s*```/g, "");
                    
                    return (
                        <div key={index} className="my-2 border rounded-md overflow-hidden bg-gray-50 w-full">
                            <button 
                                onClick={() => setExpandedJSON(prev => ({...prev, [index]: !isExpanded}))}
                                className="w-full flex items-center justify-between p-2 bg-gray-100 hover:bg-gray-200 text-xs font-mono text-gray-600 transition-colors"
                            >
                                <span className="flex items-center font-semibold">
                                    {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                                    Generated SOW Data (JSON)
                                </span>
                                <span className="text-[10px] uppercase opacity-70">{isExpanded ? "Hide" : "Show"}</span>
                            </button>
                            {isExpanded && (
                                <div className="p-2 overflow-x-auto bg-white">
                                    <pre className="text-xs font-mono text-gray-800 whitespace-pre">{jsonContent}</pre>
                                </div>
                            )}
                        </div>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
            {hasMarker && (
                <div className="mt-2 text-xs text-green-600 italic flex items-center border-t pt-2">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Content automatically inserted into editor
                </div>
            )}
        </div>
    );
};

const ChatInterface = ({
    workspaceSlug,
    documentId,
    onEnhanceDocument,
    messages: messagesProp,
    onSendMessage: onSendMessageProp,
    isLoading: isLoadingProp,
    streamingMessageId: streamingMessageIdProp,
    onReplaceChatMessages,
}: {
    workspaceSlug: string;
    documentId?: string;
    onEnhanceDocument: (enhancements: string[]) => void;
    messages?: ChatMessage[];
    onSendMessage?: (message: string) => void;
    isLoading?: boolean;
    streamingMessageId?: string | null;
    onReplaceChatMessages?: (messages: ChatMessage[]) => void;
}) => {
    const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([
        {
            id: "1",
            role: "assistant",
            content:
                "Hello! I'm here to help you create and enhance your Statement of Work. What would you like to work on today?",
            timestamp: Date.now(),
        },
    ]);
    const messages = messagesProp ?? internalMessages;
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [selectedModel, setSelectedModel] = useState("gpt-4");
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue,
            timestamp: Date.now(),
        };

        if (onReplaceChatMessages) {
            onReplaceChatMessages([...(messagesProp ?? []), userMessage]);
        } else {
            setInternalMessages((prev) => [...prev, userMessage]);
        }
        setInputValue("");
        setIsTyping(true);

        try {
            // Simulate API call - replace with actual API call
            setTimeout(() => {
                const assistantMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: generateMockResponse(inputValue),
                    timestamp: Date.now(),
                };

                if (onReplaceChatMessages) {
                    onReplaceChatMessages([...(messagesProp ?? []), assistantMessage]);
                } else {
                    setInternalMessages((prev) => [...prev, assistantMessage]);
                }
                setIsTyping(false);
            }, 1500);
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsTyping(false);

            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content:
                    "I apologize, but I encountered an error while processing your request. Please try again.",
                timestamp: Date.now(),
            };

            if (onReplaceChatMessages) {
                onReplaceChatMessages([...(messagesProp ?? []), errorMessage]);
            } else {
                setInternalMessages((prev) => [...prev, errorMessage]);
            }
        }
    };

    const generateMockResponse = (userInput: string): string => {
        // This is a mock function - replace with actual AI API call
        const lowerInput = userInput.toLowerCase();

        if (lowerInput.includes("enhance") || lowerInput.includes("improve")) {
            return "I can help enhance your SOW. Based on your document, here are some suggestions:\n\n1. Add more specific deliverables with clear timelines\n2. Include detailed assumptions and constraints\n3. Add a change management process\n4. Include payment terms and conditions\n5. Add a section for client responsibilities\n\nWould you like me to implement any of these enhancements?";
        }

        if (
            lowerInput.includes("scope") ||
            lowerInput.includes("requirements")
        ) {
            return "To define the scope of work, consider the following:\n\n1. Objectives: What are the main goals of this project?\n2. Deliverables: What tangible outcomes will be provided?\n3. Timeline: What are the key milestones and deadlines?\n4. Resources: Who will be involved and what is needed?\n5. Constraints: What are the limitations or boundaries?\n\nCan you provide more details about your project?";
        }

        if (lowerInput.includes("pricing") || lowerInput.includes("cost")) {
            return "For accurate pricing in your SOW, I recommend:\n\n1. Break down the project into phases or tasks\n2. Estimate hours for each role involved\n3. Apply the appropriate rates for each role\n4. Include any third-party costs or expenses\n5. Consider adding a contingency buffer (usually 10-15%)\n\nWould you like me to help create a detailed pricing breakdown?";
        }

        return "I understand you need help with your SOW. Could you provide more specific details about what you'd like to work on? For example, are you looking to:\n\n1. Create a new SOW from scratch\n2. Enhance an existing SOW\n3. Review and improve pricing\n4. Define project scope\n5. Add deliverables and timelines";
    };

    const handleCopyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        // In a real implementation, you might show a toast notification here
    };

    const handleRegenerateResponse = (messageId: string) => {
        // Find the user message that triggered this response
        const messageIndex = messages.findIndex((m) => m.id === messageId);
        if (messageIndex > 0 && messages[messageIndex - 1].role === "user") {
            const userMessage = messages[messageIndex - 1].content;

            // Remove the current assistant message
            if (onReplaceChatMessages) {
                onReplaceChatMessages((messagesProp ?? []).filter((m) => m.id !== messageId));
            } else {
                setInternalMessages((prev) => prev.filter((m) => m.id !== messageId));
            }
            setIsTyping(true);

            // Generate a new response
            setTimeout(() => {
                const newAssistantMessage: ChatMessage = {
                    id: (Date.now() + 2).toString(),
                    role: "assistant",
                    content: generateMockResponse(userMessage),
                    timestamp: Date.now(),
                };

                if (onReplaceChatMessages) {
                    onReplaceChatMessages([...(messagesProp ?? []), newAssistantMessage]);
                } else {
                    setInternalMessages((prev) => [...prev, newAssistantMessage]);
                }
                setIsTyping(false);
            }, 1500);
        }
    };

    const handleFeedback = (messageId: string, isPositive: boolean) => {
        // In a real implementation, you would send this feedback to your API
        console.log(
            `Feedback for message ${messageId}: ${isPositive ? "Positive" : "Negative"}`,
        );
    };

    const handleEnhanceDocument = () => {
        // Extract the most recent assistant response that contains enhancement suggestions
        const enhancementMessages = messages
            .filter((m) => m.role === "assistant")
            .filter(
                (m) =>
                    m.content.includes("enhance") ||
                    m.content.includes("suggestion"),
            );

        if (enhancementMessages.length > 0) {
            const latestEnhancements =
                enhancementMessages[enhancementMessages.length - 1].content;
            const enhancements = latestEnhancements
                .split("\n")
                .filter(
                    (line) =>
                        line.trim().startsWith("1.") ||
                        line.trim().startsWith("2.") ||
                        line.trim().startsWith("3.") ||
                        line.trim().startsWith("4.") ||
                        line.trim().startsWith("5."),
                )
                .map((line) => line.replace(/^\d+\.\s/, "").trim());

            onEnhanceDocument(enhancements);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const maxSize = 50 * 1024 * 1024; // 50MB limit

        if (file.size > maxSize) {
            toast.error("File size exceeds 50MB limit");
            return;
        }

        // Validate file type
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
        ];
        const allowedExtensions = [".pdf", ".doc", ".docx", ".txt", ".md"];

        const isValidType =
            allowedTypes.includes(file.type) ||
            allowedExtensions.some((ext) =>
                file.name.toLowerCase().endsWith(ext),
            );

        if (!isValidType) {
            toast.error(
                "Unsupported file type. Please upload PDF, Word, or text files.",
            );
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("workspaceSlug", workspaceSlug);

            // Add metadata
            const metadata = {
                title: file.name,
                docAuthor: "User Upload",
                description: `Document uploaded via chat interface`,
                docSource: "Chat Upload",
            };
            formData.append("metadata", JSON.stringify(metadata));

            const response = await fetch("/api/anythingllm/document/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error ||
                        `Upload failed: ${response.status} ${response.statusText}`,
                );
            }

            const data = await response.json();

            if (data.success && data.documents && data.documents.length > 0) {
                const doc = data.documents[0];

                // Step 2: Pin the document to the workspace (Step 1 was the upload)
                const { pinned } = await handleDocumentUploadAndPin(
                    data,
                    workspaceSlug,
                );

                toast.success(
                    `Document "${doc.title || file.name}" uploaded successfully${pinned ? " and pinned" : ""} to workspace!`,
                );

                // Add a system message to the chat
                const uploadMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: `✅ Document "${doc.title || file.name}" has been uploaded${pinned ? " and pinned" : ""} and is now available in the knowledge base. You can ask questions about it!`,
                    timestamp: Date.now(),
                };

                if (onReplaceChatMessages) {
                    onReplaceChatMessages([...(messagesProp ?? []), uploadMessage]);
                } else {
                    setInternalMessages((prev) => [...prev, uploadMessage]);
                }
            } else {
                throw new Error("Upload succeeded but no document was returned");
            }
        } catch (error) {
            console.error("File upload error:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to upload document";
            toast.error(errorMessage);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h3 className="font-medium">AI Assistant</h3>
                    {documentId && (
                        <Badge variant="outline" className="text-xs">
                            Document Context
                        </Badge>
                    )}
                </div>
                <div className="flex items-center space-x-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => setShowSettings(true)}
                            >
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setShowHistory(true)}
                            >
                                <History className="h-4 w-4 mr-2" />
                                Chat History
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                Clear Conversation
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`flex space-x-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                            >
                                <div
                                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                        message.role === "user"
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                >
                                    {message.role === "user" ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        <Bot className="h-4 w-4" />
                                    )}
                                </div>
                                <div
                                    className={`p-3 rounded-lg ${
                                        message.role === "user"
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 text-gray-900"
                                    }`}
                                >
                                    <div className="w-full">
                                        <MessageContent content={message.content} />
                                    </div>
                                    {message.role === "assistant" && (
                                        <div className="flex items-center space-x-1 mt-2 text-gray-500">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() =>
                                                    handleCopyMessage(
                                                        message.content,
                                                    )
                                                }
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() =>
                                                    handleRegenerateResponse(
                                                        message.id,
                                                    )
                                                }
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() =>
                                                    handleFeedback(
                                                        message.id,
                                                        true,
                                                    )
                                                }
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() =>
                                                    handleFeedback(
                                                        message.id,
                                                        false,
                                                    )
                                                }
                                            >
                                                <ThumbsDown className="h-3 w-3" />
                                            </Button>
                                            {message.content.includes(
                                                "enhance",
                                            ) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs"
                                                    onClick={
                                                        handleEnhanceDocument
                                                    }
                                                >
                                                    Apply
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {(isLoadingProp ?? isTyping) && (
                        <div className="flex justify-start">
                            <div className="flex space-x-2 max-w-[80%]">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="p-3 rounded-lg bg-gray-100 text-gray-900">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: "0.2s" }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: "0.4s" }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="p-3 border-t">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                    disabled={uploading}
                />
                <div className="flex items-end space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={handleUploadClick}
                        disabled={uploading}
                        title="Upload document (PDF, Word, Text)"
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Paperclip className="h-4 w-4" />
                        )}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Mic className="h-4 w-4" />
                    </Button>
                    <Textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        className="resize-none min-h-[40px] max-h-[120px]"
                        rows={1}
                    />
                    <Button
                        onClick={() => {
                            if (onSendMessageProp) {
                                onSendMessageProp(inputValue);
                                setInputValue("");
                            } else {
                                handleSendMessage();
                            }
                        }}
                        disabled={!inputValue.trim() || (isLoadingProp ?? isTyping)}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>AI Settings</DialogTitle>
                        <DialogDescription>
                            Configure your AI assistant preferences
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="model-select"
                                    className="text-sm font-medium mb-2 block"
                                >
                                    AI Model
                                </label>
                                <select
                                    id="model-select"
                                    className="w-full p-2 border rounded-md"
                                    value={selectedModel}
                                    onChange={(e) =>
                                        setSelectedModel(e.target.value)
                                    }
                                >
                                    <option value="gpt-4">GPT-4</option>
                                    <option value="gpt-3.5-turbo">
                                        GPT-3.5 Turbo
                                    </option>
                                    <option value="claude-3">Claude 3</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="temperature-slider"
                                    className="text-sm font-medium mb-2 block"
                                >
                                    Creativity (Temperature)
                                </label>
                                <input
                                    id="temperature-slider"
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    defaultValue="0.7"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="max-tokens"
                                    className="text-sm font-medium mb-2 block"
                                >
                                    Max Response Length
                                </label>
                                <input
                                    id="max-tokens"
                                    type="number"
                                    defaultValue="2000"
                                    min="100"
                                    max="4000"
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Chat History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chat History</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="font-medium">
                                    SOW for ABC Company
                                </div>
                                <div className="text-xs text-gray-500">
                                    2 days ago • 15 messages
                                </div>
                            </div>
                            <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="font-medium">
                                    Pricing for XYZ Project
                                </div>
                                <div className="text-xs text-gray-500">
                                    5 days ago • 8 messages
                                </div>
                            </div>
                            <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="font-medium">
                                    Scope for DEF Initiative
                                </div>
                                <div className="text-xs text-gray-500">
                                    1 week ago • 22 messages
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ChatInterface;
