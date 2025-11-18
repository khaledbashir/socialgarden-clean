import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { ChatMessage, Document } from '@/types';
import { anythingLLM } from '@/lib/anythingllm';
import { WORKSPACE_CONFIG, getWorkspaceForAgent } from '@/lib/workspace-config';
import type { ArchitectSOW } from '@/lib/export-utils';
import { extractBudgetAndDiscount, extractClientName } from '@/lib/page-utils';
import { extractSOWStructuredJson } from '@/lib/export-utils';
import { sanitizeEmptyTextNodes, extractPricingJSON } from '@/lib/page-utils';
import { ROLES } from '@/lib/rateCard';
import { calculatePricingTable } from "@/lib/pricingCalculator";
import {
    extractPricingFromContent,
    exportToExcel,
    exportToPDF,
    cleanSOWContent,
} from "@/lib/export-utils";

// Interfaces
interface MultiScopeData {
    scopes: Array < {
        scope_name: string;
        scope_description?: string;
        deliverables?: string[];
        assumptions?: string[];
        discount?: number;
        role_allocation: Array < {
            role: string;
            hours: number;
            rate?: number;
            cost?: number;
        }>;
    }>;
    discount?: number;
    projectTitle?: string;
    clientName?: string;
    company?: any;
    projectSubtitle?: string;
    projectOverview?: string;
    budgetNotes?: string;
    currency?: string;
    gstApplicable?: boolean;
    generatedDate?: string;
    authoritativeTotal?: number;
}

interface ConvertOptions {
    strictRoles?: boolean;
    userPromptBudget?: number;
    userPromptDiscount?: number;
    jsonDiscount?: number;
    tablesRoles?: any[][];
    tablesDiscounts?: number[];
    multiScopePricingData?: {
        scopes: Array < {
            scope_name: string;
            scope_description?: string;
            deliverables?: string[];
            assumptions?: string[];
            discount?: number;
            role_allocation: Array < {
                role: string;
                hours: number;
                rate?: number;
                cost?: number;
            }>;
        }>;
        discount?: number;
        extractedAt?: number;
        authoritativeTotal?: number;
    };
}


interface UseChatProps {
  viewMode: 'editor' | 'dashboard';
  currentDocId: string | null;
  currentSOWId: string | null;
  documents: Document[];
  agents: any[];
  currentAgentId: string | null;
  dashboardChatTarget: string;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  lastUserPrompt: string;
  setLastUserPrompt: React.Dispatch<React.SetStateAction<string>>;
  userPromptDiscount: number;
  setUserPromptDiscount: React.Dispatch<React.SetStateAction<number>>;
  multiScopePricingData: MultiScopeData | null;
  setMultiScopePricingData: React.Dispatch<React.SetStateAction<MultiScopeData | null>>;
  structuredSow: ArchitectSOW | null;
  setStructuredSow: React.Dispatch<React.SetStateAction<ArchitectSOW | null>>;
  editorRef: React.RefObject<any>;
  latestEditorJSON: any;
  setLatestEditorJSON: React.Dispatch<React.SetStateAction<any>>;
  isHistoryRestored: boolean;
  setIsHistoryRestored: React.Dispatch<React.SetStateAction<boolean>>;
  onInsertContent: (content: string, suggestedRoles?: any[]) => Promise<void>;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setWorkspaces: React.Dispatch<React.SetStateAction<any[]>>;
  setCurrentDocId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useChat = (props: UseChatProps) => {
  const {
    viewMode,
    currentDocId,
    currentSOWId,
    documents,
    agents,
    currentAgentId,
    dashboardChatTarget,
    chatMessages,
    setChatMessages,
    lastUserPrompt,
    setLastUserPrompt,
    userPromptDiscount,
    setUserPromptDiscount,
    multiScopePricingData,
    setMultiScopePricingData,
    structuredSow,
    setStructuredSow,
    editorRef,
    latestEditorJSON,
    setLatestEditorJSON,
    isHistoryRestored,
    setIsHistoryRestored,
    onInsertContent,
    setDocuments,
    setWorkspaces,
    setCurrentDocId,
  } = props;

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [currentRequestController, setCurrentRequestController] = useState<AbortController | null>(null);
  const [lastMessageSentTime, setLastMessageSentTime] = useState<number>(0);
  const MESSAGE_RATE_LIMIT = 1000;

  const handleSendMessage = async (
    message: string,
    threadSlugParam?: string | null,
    attachments?: Array < {
        name: string;
        mime: string;
        contentString: string;
    }>,
) => {
    // In dashboard mode, we don't need an agent selected - use dashboard workspace directly
    const isDashboardMode = viewMode === "dashboard";

    if (!message.trim()) return;
    // Do not require an agent in editor mode — workspace context is sufficient

    // Rate limiting: prevent sending messages too quickly
    const now = Date.now();
    if (now - lastMessageSentTime < MESSAGE_RATE_LIMIT) {
        console.warn(
            `⏱️ Rate limit: Please wait before sending another message. (${Math.ceil((MESSAGE_RATE_LIMIT - (now - lastMessageSentTime)) / 1000)}s)`,
        );
        toast.error(
            "⏱️ Please wait a moment before sending another message.",
        );
        return;
    }
    setLastMessageSentTime(now);

    // Cancel any previous ongoing request to avoid flooding the API
    if (currentRequestController) {
        console.log(
            "🛑 Cancelling previous request to avoid rate limiting...",
        );
        currentRequestController.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    setCurrentRequestController(controller);

    setIsChatLoading(true);

    // Check for insert command (only relevant in editor mode)
    if (
        !isDashboardMode &&
        (message.toLowerCase().includes("insert into editor") ||
            message.toLowerCase() === "insert" ||
            message.toLowerCase().includes("add to editor"))
    ) {
        console.log("📝 Insert command detected!", { message });
        setIsChatLoading(false);

        // Find the last AI response in chat history (excluding confirmation messages)
        const lastAIMessage = [...chatMessages]
            .reverse()
            .find(
                (msg) =>
                    msg.role === "assistant" &&
                    !msg.content.includes("✅ SOW has been inserted") &&
                    !msg.content.includes("Ready to insert"),
            );

        console.log(
            "📋 Found AI message:",
            lastAIMessage?.content.substring(0, 100),
        );
        console.log("📝 Editor ref exists:", !!editorRef.current);
        console.log("📄 Current doc ID:", currentDocId);

        // 🎯 Extract and log [FINANCIAL_REASONING] block for transparency
        if (lastAIMessage) {
            extractFinancialReasoning(lastAIMessage.content);
        }

        if (lastAIMessage && currentDocId) {
            try {
                // 1. Separate Markdown from JSON from the last AI message (multi-block aware)
                let markdownPart = lastAIMessage.content;
                let suggestedRoles: any[] = [];
                let hasValidSuggestedRoles = false;
                let extractedDiscount: number | undefined;
                const tablesRolesQueue: any[][] = [];
                const tablesDiscountsQueue: number[] = [];

                const jsonBlocks = Array.from(
                    markdownPart.matchAll(/```json\s*([\s\S]*?)\s*```/gi),
                );
                if (jsonBlocks.length > 0) {
                    let rebuilt = "";
                    let lastIndex = 0;
                    for (const m of jsonBlocks) {
                        const full = m[0];
                        const body = m[1];
                        const start = (m as RegExpMatchArray).index || 0;
                        const end = start + full.length;
                        rebuilt += markdownPart.slice(lastIndex, start);
                        lastIndex = end;
                        try {
                            const obj = JSON.parse(body);
                            let rolesArr: any[] = [];
                            let discountVal: number | undefined = undefined;
                            if (Array.isArray(obj?.roles))
                                rolesArr = obj.roles;
                            else if (Array.isArray(obj?.suggestedRoles))
                                rolesArr = obj.suggestedRoles;
                            else if (Array.isArray(obj?.scopeItems))
                                rolesArr =
                                    buildSuggestedRolesFromArchitectSOW(
                                        obj as ArchitectSOW,
                                    );
                            if (typeof obj?.discount === "number")
                                discountVal = obj.discount;
                            if (rolesArr.length > 0) {
                                tablesRolesQueue.push(rolesArr);
                                tablesDiscountsQueue.push(discountVal ?? 0);
                                rebuilt += "\n[editablePricingTable]\n";
                            } else {
                                rebuilt += full;
                            }
                        } catch {
                            rebuilt += full;
                        }
                    }
                    rebuilt += markdownPart.slice(lastIndex);
                    markdownPart = rebuilt.trim();
                    hasValidSuggestedRoles = tablesRolesQueue.length > 0;
                    if (hasValidSuggestedRoles)
                        console.log(
                            `✅ Using ${tablesRolesQueue.length} pricing JSON block(s) for insertion (insert command).`,
                        );
                } else {
                    // Single-block helpers
                    const legacyMatch = markdownPart.match(
                        /```json\s*([\s\S]*?)\s*```/,
                    );
                    const pricingJsonData = extractPricingJSON(
                        lastAIMessage.content,
                    );
                    if (
                        pricingJsonData &&
                        pricingJsonData.roles &&
                        pricingJsonData.roles.length > 0
                    ) {
                        suggestedRoles = pricingJsonData.roles;
                        extractedDiscount = pricingJsonData.discount;
                        hasValidSuggestedRoles = true;

                        // 🎯 V4.1 Multi-Scope Data Storage
                        if (
                            pricingJsonData.multiScopeData &&
                            pricingJsonData.multiScopeData.scopes &&
                            pricingJsonData.multiScopeData.scopes.length > 0
                        ) {
                            console.log(
                                `✅ Storing V4.1 multi-scope data: ${pricingJsonData.multiScopeData.scopes.length} scopes`,
                            );
                            const multiScopeDataLocal = {
                                scopes: pricingJsonData.multiScopeData.scopes.map(
                                    (scope: any) => ({
                                        scope_name:
                                            scope.scope_name ||
                                            "Unnamed Scope",
                                        scope_description:
                                            scope.scope_description || "",
                                        deliverables: 
                                            scope.deliverables || [],
                                        assumptions: 
                                            scope.assumptions || [],
                                        role_allocation: 
                                            scope.role_allocation || [],
                                    }),
                                ),
                                discount:
                                    pricingJsonData.multiScopeData
                                        .discount || 0,
                                extractedAt: Date.now(),
                            };
                            setMultiScopePricingData(multiScopeDataLocal);
                        }

                        if (legacyMatch)
                            markdownPart = markdownPart
                                .replace(legacyMatch[0], "")
                                .trim();
                        console.log(
                            `✅ Using ${suggestedRoles.length} roles from [PRICING_JSON] (insert command)`,
                        );
                    } else if (legacyMatch && legacyMatch[1]) {
                        try {
                            const parsedJson = JSON.parse(legacyMatch[1]);
                            if (parsedJson.suggestedRoles) {
                                suggestedRoles = parsedJson.suggestedRoles;
                                markdownPart = markdownPart
                                    .replace(legacyMatch[0], "")
                                    .trim();
                                hasValidSuggestedRoles =
                                    suggestedRoles.length > 0;
                                console.log(
                                    `✅ Parsed ${suggestedRoles.length} roles from "insert" command (legacy format).`,
                                );
                            } else if (parsedJson.scopeItems) {
                                const derived = 
                                    buildSuggestedRolesFromArchitectSOW(
                                        parsedJson as ArchitectSOW,
                                    );
                                if (derived.length > 0) {
                                    suggestedRoles = derived;
                                    markdownPart = markdownPart
                                        .replace(legacyMatch[0], "")
                                        .trim();
                                    hasValidSuggestedRoles = true;
                                    console.log(
                                        `✅ Derived ${suggestedRoles.length} roles from Architect structured JSON (insert command).`,
                                    );
                                }
                            }
                        } catch (e) {
                            console.warn(
                                "⚠️ Could not parse suggestedRoles JSON from last AI message.",
                                e,
                            );
                        }
                    }
                }

                // 2. Scrub internal bracketed tags, then clean the markdown content
                const scrubBracketTagsPreserveLinks = (txt: string) => {
                    return txt.replace(
                        /\\[[^\\]]+\\]/g,
                        (match, offset, str) => {
                            const nextChar = 
                                str[(offset as number) + match.length];
                            if (nextChar === "(") return match; // keep markdown links
                            const inner = match.slice(1, -1);
                            if (/^[A-Z0-9 _\-\/&]+$/.test(inner)) return "";
                            return match;
                        },
                    );
                };
                console.log("🧹 Cleaning SOW content for insertion...");
                const cleanedMessage = cleanSOWContent(
                    scrubBracketTagsPreserveLinks(
                        markdownPart.replace(
                            /\\[(?:PRICING[\/_ ]?JSON|ANALYZE(?:\s*&\s*CLASSIFY)?|FINANCIAL[_\]s-]*REASONING|BUDGET[_\]s-]*NOTE)\\]/gi,
                            "",
                        ),
                    ),
                );
                console.log("✅ Content cleaned");

                // 3. Convert markdown and roles to Novel/TipTap JSON
                console.log(
                    "🔄 Converting markdown to JSON for insertion...",
                );

                // 🎯 Extract budget and discount from last user prompt for financial calculations
                const { 
                    budget: userPromptBudget,
                    discount: extractedUserPromptDiscount,
                } = extractBudgetAndDiscount(lastUserPrompt);

                // 🎯 CRITICAL FIX: Store user prompt discount to override AI-generated discount
                setUserPromptDiscount(extractedUserPromptDiscount);

                // Store user prompt discount in state to override AI-generated discount
                setUserPromptDiscount(extractedUserPromptDiscount);
                console.log(
                    `💰 [DISCOUNT] Stored user prompt discount: ${extractedUserPromptDiscount}%`,
                );
                const convertOptions: ConvertOptions = {
                    strictRoles: false,
                    userPromptBudget,
                    userPromptDiscount,
                    jsonDiscount: extractedDiscount, // Discount from [PRICING_JSON] takes priority
                    tablesRoles: tablesRolesQueue,
                    tablesDiscounts: tablesDiscountsQueue,
                };

                let content;
                if (!hasValidSuggestedRoles) {
                    // Try deriving roles from Architect structured JSON in the chat message
                    const structured = 
                        extractSOWStructuredJson(markdownPart);
                    const derived = 
                        buildSuggestedRolesFromArchitectSOW(structured);
                    if (derived.length > 0) {
                        console.log(
                            `✅ Using ${derived.length} roles derived from Architect structured JSON (insert command).`,
                        );
                        // 🔒 AM Guardrail in insert flow
                        const sanitized = 
                            sanitizeAccountManagementRoles(derived);
                        content = convertMarkdownToNovelJSON(
                            cleanedMessage,
                            sanitized,
                            convertOptions,
                        );
                    } else {
                        console.error(
                            "❌ CRITICAL ERROR: AI did not provide suggestedRoles JSON for insert command. Aborting insert to avoid placeholder pricing.",
                        );
                        // Emit an assistant message explaining the requirement and exit without inserting
                        const errorMsg: ChatMessage = {
                            id: `msg${Date.now()}`,
                            role: "assistant",
                            content:
                                'Pricing data (suggestedRoles) was not provided. Please ask The Architect to regenerate with a valid JSON code block containing suggestedRoles, then try "insert into editor" again. No placeholder tables were inserted.',
                            timestamp: Date.now(),
                        };
                        setChatMessages((prev) => [...prev, errorMsg]);
                        setIsChatLoading(false);
                        return;
                    }
                } else {
                    // 🔒 AM Guardrail: sanitize in insert flow as well
                    const sanitized = 
                        sanitizeAccountManagementRoles(suggestedRoles);
                    content = convertMarkdownToNovelJSON(
                        cleanedMessage,
                        sanitized,
                        convertOptions,
                    );
                }
                console.log("✅ Content converted");

                // 4. Extract title from the SOW content
                const titleMatch = cleanedMessage.match(/^#\s+(.+)$/m);
                const clientMatch = cleanedMessage.match(
                    /\\*\\*Client:\\*\\*\s+(.+)$/m,
                );
                const scopeMatch = cleanedMessage.match(
                    /Scope of Work:\s+(.+)/,
                );

                let docTitle = "New SOW";
                if (titleMatch) {
                    docTitle = titleMatch[1];
                } else if (scopeMatch) {
                    docTitle = scopeMatch[1];
                } else if (clientMatch) {
                    docTitle = `SOW - ${clientMatch[1]}`;
                }

                // 5. Determine if editor is truly empty; if not, replace with full merged content
                const existing = editorRef.current?.getContent?.();
                const isTrulyEmpty = 
                    !existing ||
                    !Array.isArray(existing.content) ||
                    existing.content.length === 0 ||
                    (existing.content.length === 1 &&
                        existing.content[0]?.type === "paragraph" &&
                        (!existing.content[0].content ||
                            existing.content[0].content.length === 0));
                const finalContent = { 
                    ...content,
                    content: sanitizeEmptyTextNodes(content.content),
                };
                console.log(
                    "🧩 Chat insert: applying full merged content. Empty editor:",
                    isTrulyEmpty,
                );

                // 6. Update the document state
                console.log(
                    "📝 Updating document state:",
                    docTitle, " Empty editor:",
                    isTrulyEmpty,
                );
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === currentDocId
                            ? {
                                  ...doc,
                                  content: finalContent,
                                  title: docTitle,
                              }
                            : doc,
                    ),
                );

                // 7. Save to database (this is a critical user action)
                console.log("💾 Saving SOW to database...");
                try {
                    await fetch(`/api/sow/${currentDocId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: docTitle,
                            content: finalContent, // Send the merged rich JSON content
                        }),
                    });
                    console.log("✅ SOW saved to database successfully");
                } catch (saveError) {
                    console.error("❌ Database save error:", saveError);
                }

                // 8. Update the editor directly with full merged content
                if (editorRef.current) {
                    if (editorRef.current.commands?.setContent) {
                        editorRef.current.commands.setContent(finalContent);
                    } else {
                        editorRef.current.insertContent(finalContent);
                    }
                    // ✅ FIX: Immediately sync latestEditorJSON to prevent auto-save from overwriting
                    setLatestEditorJSON(finalContent);
                    console.log(
                        "🔒 [Race Condition Fix] Locked in new editor state to prevent auto-save overwrite",
                    );
                }

                // 9. Embed SOW in master 'gen' workspace and master dashboard
                const currentAgent = agents.find(
                    (a) => a.id === currentAgentId,
                );
                if (
                    currentAgent?.model === "anythingllm" &&
                    currentAgentId
                ) {
                    console.log(
                        "🤖 Embedding SOW in master AnythingLLM workspaces...",
                    );
                    try {
                        const clientContext = 
                            getWorkspaceForAgent(currentAgentId) ||
                            "unknown";
                        await anythingLLM.embedSOWInBothWorkspaces(
                            docTitle,
                            cleanedMessage,
                            clientContext,
                        );
                        console.log(
                            "✅ SOW embedded in master AnythingLLM workspaces",
                        );
                    } catch (embedError) {
                        console.error(
                            "⚠️ AnythingLLM embedding error:",
                            embedError,
                        );
                    }
                }

                // 10. Add confirmation message to chat
                const confirmMessage: ChatMessage = {
                    id: `msg${Date.now()}`,
                    role: "assistant",
                    content:
                        "✅ SOW has been inserted into the editor, saved, and embedded in the knowledge base!",
                    timestamp: Date.now(),
                };
                setChatMessages((prev) => [...prev, confirmMessage]);

                return;
            } catch (error) {
                console.error("Error inserting content:", error);
                const errorMessage: ChatMessage = {
                    id: `msg${Date.now()}`,
                    role: "assistant",
                    content:
                        "❌ Error inserting content into editor. Please try again.",
                    timestamp: Date.now(),
                };
                setChatMessages((prev) => [...prev, errorMessage]);
                return;
            }
        }
    }

    // 🎯 AUTO-DETECT CLIENT NAME from user prompt
    const detectedClientName = extractClientName(message);
    if (detectedClientName && currentDocId) {
        console.log(
            "🏢 Detected client name in prompt:",
            detectedClientName,
        );

        // Auto-rename SOW to include client name
        const newSOWTitle = `SOW - ${detectedClientName}`;

        // Update document title in state
        setDocuments((prev) =>
            prev.map((doc) =>
                doc.id === currentDocId
                    ? { ...doc, title: newSOWTitle }
                    : doc,
            ),
        );

        // Also update sidebar workspaces list and move SOW to top of its folder
        setWorkspaces((prev) =>
            prev.map((ws) => {
                const has = ws.sows.some((s) => s.id === currentDocId);
                if (!has) return ws;
                const updated = ws.sows.map((s) =>
                    s.id === currentDocId ? { ...s, name: newSOWTitle } : s,
                );
                const moved = [
                    updated.find((s) => s.id === currentDocId)!, 
                    ...updated.filter((s) => s.id !== currentDocId),
                ];
                return { ...ws, sows: moved };
            }),
        );

        // Save to database
        fetch("/api/sow/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: currentDocId,
                title: newSOWTitle,
                clientName: detectedClientName,
            }),
        }).catch((err) =>
            console.error("❌ Failed to auto-rename SOW:", err),
        );

        console.log("✅ Auto-renamed SOW to:", newSOWTitle);
        toast.success(`🏢 Auto-detected client: ${detectedClientName}`);
    }

    // 🎯 EXTRACT BUDGET AND DISCOUNT from user prompt for pricing calculator
    setLastUserPrompt(message); // Store for later use when AI responds

    const userMessage: ChatMessage = {
        id: `msg${Date.now()}`,
        role: "user",
        content: message,
        timestamp: Date.now(),
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);

    // ⚠️ REMOVED DATABASE SAVE - AnythingLLM handles all message storage

    // Always route via AnythingLLM using workspace context (no agents required)
    const effectiveAgent = {
        id: "workspace",
        name: "Workspace AI",
        systemPrompt: "",
        model: "anythingllm",
    };

    if (effectiveAgent) {
        try {
            const useAnythingLLM = effectiveAgent.model === "anythingllm";

            // 🎯 WORKSPACE ROUTING (AnythingLLM streaming):
            let endpoint: string;
            let workspaceSlug: string | undefined;

            if (isDashboardMode && useAnythingLLM) {
                // Dashboard mode routing
                if (
                    dashboardChatTarget === WORKSPACE_CONFIG.dashboard.slug
                ) {
                    endpoint = "/api/anythingllm/stream-chat";
                    workspaceSlug = WORKSPACE_CONFIG.dashboard.slug;
                } else {
                    endpoint = "/api/anythingllm/stream-chat";
                    workspaceSlug = dashboardChatTarget;
                }
            } else {
                // Editor mode routing — always AnythingLLM via the SOW's workspace
                endpoint = "/api/anythingllm/stream-chat";
                workspaceSlug = documents.find(
                    (d) => d.id === currentDocId,
                )?.workspaceSlug;
            }

            // 🎯 USE THE SOW'S ACTUAL WORKSPACE (NOT FORCED GEN-THE-ARCHITECT)
            // Each SOW has its thread in its client workspace (e.g., "hello", "pho", etc.)
            // Don't force gen-the-architect - that breaks thread routing!
            if (!isDashboardMode && useAnythingLLM && currentSOWId) {
                const currentSOW = documents.find(
                    (d) => d.id === currentSOWId,
                );
                if (currentSOW?.workspaceSlug) {
                    workspaceSlug = currentSOW.workspaceSlug; // Use the SOW's actual workspace
                    console.log(
                        "🎯 [SOW Chat] Using SOW workspace: ", workspaceSlug,
                    );
                }
            }

            console.log("🎯 [Chat Routing]", {
                isDashboardMode,
                useAnythingLLM,
                dashboardChatTarget,
                endpoint,
                workspaceSlug,
                routeType: isDashboardMode
                    ? dashboardChatTarget ===
                      WORKSPACE_CONFIG.dashboard.slug
                        ? "MASTER_DASHBOARD"
                        : "CLIENT_WORKSPACE"
                    : "SOW_GENERATION",
            });

            // 🌊 STREAMING SUPPORT: Use stream-chat endpoint for AnythingLLM
            const shouldStream = useAnythingLLM;
            const streamEndpoint = endpoint.includes("/stream-chat")
                ? endpoint
                : endpoint.replace("/chat", "/stream-chat");

            if (shouldStream) {
                // Decide when to enforce SOW narrative+JSON contract
                const lastUserMessage = 
                    newMessages[newMessages.length - 1]?.content || "";
                const messageLength = lastUserMessage.trim().length;
                const sowKeywords =
                    /(\bstatement of work\b|\bsow\b|\bscope\b|\bdeliverables\b|\bpricing\b|\bbudget\b|\bestimate\b|\bhours\b|\broles\b)/i;
                // Do not append per-message contracts; rely on workspace/system prompt
                console.log(
                    `📊 [Contract Check] Message length: ${messageLength}, keywordMatch: ${sowKeywords.test(lastUserMessage)}, isDashboard: ${isDashboardMode}`,
                );
                const requestMessages = [
                    // Do not include a system message; AnythingLLM workspace prompt governs behavior
                    ...newMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                ];
                // ✨ STREAMING MODE: Real-time response with thinking display
                const aiMessageId = `msg${Date.now() + 1}`;
                let accumulatedContent = "";

                // Create initial empty AI message
                const initialAIMessage: ChatMessage = {
                    id: aiMessageId,
                    role: "assistant",
                    content: "",
                    timestamp: Date.now(),
                };
                setChatMessages((prev) => [...prev, initialAIMessage]);
                setStreamingMessageId(aiMessageId);

                // Determine thread slug based on mode
                let threadSlugToUse: string | undefined;
                if (threadSlugParam) {
                    // Always prefer explicitly provided thread slug (works for both dashboard and editor modes)
                    threadSlugToUse = threadSlugParam || undefined;
                } else if (isDashboardMode) {
                    // Dashboard fallback: no explicit thread provided
                    threadSlugToUse = undefined;
                } else if (currentDocId) {
                    // Editor mode fallback: current document's thread
                    threadSlugToUse =
                        documents.find((d) => d.id === currentDocId)
                            ?.threadSlug || undefined;
                }

                // 🛡️ If this is a temp thread (created for instant navigation), avoid thread API and use workspace-level chat
                if (
                    threadSlugToUse &&
                    threadSlugToUse.startsWith("temp-")
                ) {
                    console.log(
                        "ℹ️ Temp thread detected; using workspace-level chat for first message",
                    );
                    threadSlugToUse = undefined;
                }

                // Smart mode selection for Master Dashboard: use 'chat' for greetings/non-analytic prompts
                // Always use 'chat' mode to mirror AnythingLLM direct chat behavior
                const resolvedMode = "chat";

                const response = await fetch(streamEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    signal: controller.signal, // 🛑 Allow cancellation of this request
                    body: JSON.stringify({
                        model: effectiveAgent.model,
                        workspace: workspaceSlug,
                        threadSlug: threadSlugToUse,
                        // Prefer query for dashboard analytics; fallback to chat for casual greetings
                        mode: resolvedMode,
                        attachments: attachments || [], // Include file attachments from sidebar
                        messages: requestMessages,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("❌ Stream-chat API error:", {
                        status: response.status,
                        statusText: response.statusText,
                        errorText: errorText,
                    });

                    let errorMessage =
                        "Sorry, there was an error processing your request.";

                    // Try to parse the error response for details
                    try {
                        const errorData = JSON.parse(errorText);
                        console.error("📋 Error details:", errorData);

                        if (errorData.details) {
                            errorMessage = `⚠️ Error: ${errorData.details}`;
                        } else if (errorData.error) {
                            errorMessage = `⚠️ ${errorData.error}`;
                        }
                    } catch (parseError) {
                        // If can't parse, use generic messages based on status
                        if (response.status === 400) {
                            errorMessage = `⚠️ AnythingLLM error (400): Invalid request. ${errorText.substring(0, 200)}`;
                        } else if (
                            response.status === 401 ||
                            response.status === 403
                        ) {
                            errorMessage =
                                "⚠️ AnythingLLM authentication failed. Please check the API key configuration.";
                        } else if (response.status === 404) {
                            errorMessage = `⚠️ AnythingLLM workspace '${workspaceSlug}' not found. Please verify it exists.`;
                        } else {
                            errorMessage = `⚠️ Error (${response.status}): ${errorText.substring(0, 200)}`;
                        }
                    }

                    try {
                        toast.error(
                            "AI returned empty content (workspace/thread may be misconfigured). Check console SSE logs and workspace settings.",
                        );
                    } catch (e) {}
                    setChatMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === aiMessageId
                                ? { ...msg, content: errorMessage }
                                : msg,
                        ),
                    );
                    setStreamingMessageId(null);
                    return;
                }

                // Read the SSE stream
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    console.error("❌ No response body reader available");
                    setStreamingMessageId(null);
                    return;
                }

                try {
                    let buffer = "";
                    let eventCount = 0;

                    console.log("🌊 Starting SSE stream processing...", {
                        workspace: workspaceSlug,
                        thread: threadSlugToUse,
                        mode: resolvedMode,
                        endpoint: streamEndpoint,
                    });

                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            console.log("✅ Stream complete", {
                                totalEvents: eventCount,
                                contentLength: accumulatedContent.length,
                            });
                            setStreamingMessageId(null);
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            if (!line.trim() || !line.startsWith("data: "))
                                continue;

                            try {
                                const jsonStr = line.substring(6); // Remove 'data: ' prefix
                                const data = JSON.parse(jsonStr);
                                eventCount++;

                                // Log all received event types for debugging
                                console.log(
                                    `📨 SSE Event #${eventCount}:`,
                                    {
                                        type: data.type,
                                        hasTextResponse: 
                                            !!data.textResponse,
                                        hasContent: !!data.content,
                                        keys: Object.keys(data),
                                        preview: JSON.stringify(
                                            data,
                                        ).substring(0, 200),
                                    },
                                );

                                // Handle different message types from AnythingLLM stream
                                if (
                                    data.type === "textResponseChunk" &&
                                    data.textResponse
                                ) {
                                    // Preserve internal thinking tags; UI will collapse them via StreamingThoughtAccordion
                                    accumulatedContent += data.textResponse;

                                    // Update the message content in real-time
                                    setChatMessages((prev) =>
                                        prev.map((msg) =>
                                            msg.id === aiMessageId
                                                ? {
                                                      ...msg,
                                                      content:
                                                          accumulatedContent,
                                                  }
                                                : msg,
                                        ),
                                    );
                                } else if (data.type === "textResponse") {
                                    // Final response (fallback for non-chunked)
                                    // Preserve internal thinking tags for UI accordion
                                    let content = 
                                        data.content ||
                                        data.textResponse ||
                                        "";
                                    accumulatedContent = content;
                                    setChatMessages((prev) =>
                                        prev.map((msg) =>
                                            msg.id === aiMessageId
                                                ? {
                                                      ...msg,
                                                      content:
                                                          accumulatedContent,
                                                  }
                                                : msg,
                                        ),
                                    );
                                } else if (data.textResponse) {
                                    // Fallback: handle any event with textResponse field
                                    console.log(
                                        "⚠️ Unhandled event type with textResponse:",
                                        data.type,
                                    );
                                    accumulatedContent += data.textResponse;
                                    setChatMessages((prev) =>
                                        prev.map((msg) =>
                                            msg.id === aiMessageId
                                                ? {
                                                      ...msg,
                                                      content:
                                                          accumulatedContent,
                                                  }
                                                : msg,
                                        ),
                                    );
                                } else if (data.content) {
                                    // Fallback: handle any event with content field
                                    console.log(
                                        "⚠️ Unhandled event type with content:",
                                        data.type,
                                    );
                                    accumulatedContent += data.content;
                                    setChatMessages((prev) =>
                                        prev.map((msg) =>
                                            msg.id === aiMessageId
                                                ? {
                                                      ...msg,
                                                      content:
                                                          accumulatedContent,
                                                  }
                                                : msg,
                                        ),
                                    );
                                } else if (data.type === "abort") {
                                    // Explicitly handle abort events for diagnostics
                                    console.warn(
                                        "⚠️ SSE abort event received from AnythingLLM stream",
                                        data,
                                    );
                                    try {
                                        toast.error(
                                            "AI generation aborted (workspace/thread may be misconfigured). Check the workspace and thread routing.",
                                        );
                                    } catch (e) {}
                                }
                                 else {
                                    // Log unhandled event types for debugging
                                    console.log(
                                        "ℹ️ Unhandled SSE event type:",
                                        data.type,
                                        "Keys:",
                                        Object.keys(data),
                                    );
                                }
                            } catch (parseError) {
                                console.error(
                                    "Failed to parse SSE data:",
                                    parseError,
                                    "Line:",
                                    line,
                                );
                            }
                        }
                    }
                } catch (streamError) {
                    console.error("❌ Stream reading error:", streamError);
                    setStreamingMessageId(null);
                }

                console.log(
                    "✅ Streaming complete, total content length:",
                    accumulatedContent.length,
                );

                // Check if we got empty content and show helpful error
                if (accumulatedContent.length === 0) {
                    console.error(
                        "❌ AI returned empty content - possible workspace/thread routing issue",
                    );
                    console.error("🔍 Debug info:", {
                        workspaceSlug,
                        threadSlug: threadSlugToUse,
                        mode: resolvedMode,
                        endpoint: streamEndpoint,
                        messagesCount: requestMessages.length,
                        lastMessage:
                            requestMessages[requestMessages.length - 1],
                    });
                    console.error(
                        "💡 Check the SSE event logs above (📨 SSE Event received) to see what events were received",
                    );
                    setChatMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === aiMessageId
                                ? {
                                      ...msg,
                                      content:
                                          "❌ **Generation Failed**\n\n" +
                                          "The AI returned empty content. This usually means:\n\n" +
                                          "**Most Common Causes:**\n" +
                                          "- The workspace routing is incorrect\n" +
                                          "- The AI workspace is not properly configured or has no LLM set\n" +
                                          "- Authentication issue with AnythingLLM\n" +
                                          "- The thread doesn't exist or is inaccessible\n\n" +
                                          "**Debug Information:**\n" +
                                          `- Workspace: 
${workspaceSlug || "none"}
` +
                                          `- Thread: 
${threadSlugToUse || "none"}
` +
                                          `- Mode: 
${resolvedMode}
` +
                                          `- Endpoint: 
${streamEndpoint}
` +
                                          "\n" +
                                          "**Next Steps:**\n" +
                                          "1. Check browser console for SSE event logs (📨 SSE Event received)\n" +
                                          "2. Verify the workspace exists in AnythingLLM\n" +
                                          "3. Ensure the workspace has an LLM configured\n" +
                                          "4. Check AnythingLLM API logs for errors\n" +
                                          "5. Try a simple message in the workspace directly in AnythingLLM",
                                      role: "assistant",
                                  }
                                : msg,
                        ),
                    );
                    return;
                }

                // 🎯 Extract work type from the accumulated AI response
                const detectedWorkType = 
                    extractWorkType(accumulatedContent);

                // Update current document with detected work type
                if (currentDocId && detectedWorkType) {
                    setDocuments((prev) =>
                        prev.map((doc) =>
                            doc.id === currentDocId
                                ? { ...doc, workType: detectedWorkType }
                                : doc,
                        ),
                    );
                    console.log(
                        `🎯 Updated document ${currentDocId} with work type: ${detectedWorkType}`,
                    );
                }

                // 🧩 Also try to capture modular Architect JSON into state for Excel engine v2
                try {
                    const structured = 
                        extractSOWStructuredJson(accumulatedContent);
                    if (structured?.scopeItems?.length) {
                        setStructuredSow(structured);
                        console.log(
                            "✅ Captured structured SOW JSON for Excel export",
                        );
                    }
                } catch {}

                // 🚀 AUTOMATIC CONTENT INSERTION: Convert AI content and insert into editor
                if (viewMode === "editor" && currentDocId) {
                    console.log(
                        "🚀 Starting automatic content insertion into SOW editor...",
                    );

                    try {
                        // Extract SOW structured JSON from the AI response
                        const structured = 
                            extractSOWStructuredJson(accumulatedContent);
                        let contentForEditor: any = null;
                        let docTitle = "New SOW";

                        if (structured?.scopeItems?.length) {
                            // Use structured data from Architect response
                            console.log(
                                `✅ Using structured SOW data with ${structured.scopeItems.length} scope items`,
                            );

                            const cleanedContent = 
                                accumulatedContent.replace(
                                    /\\[PRICING_JSON\\](.*?)\\[\/PRICING_JSON\\]/gs,
                                    "",
                                );

                            // 🎯 Check if we have multi-scope data
                            if (
                                structured.multiScopeData &&
                                structured.multiScopeData.scopes &&
                                structured.multiScopeData.scopes.length > 0
                            ) {
                                console.log(
                                    `✅ Using multi-scope data with ${structured.multiScopeData.scopes.length} scopes`,
                                );
                                // For multi-scope, don't flatten roles - let multiScopePricingData handle it
                                contentForEditor =
                                    convertMarkdownToNovelJSON(
                                        cleanedContent,
                                        [], // Empty suggestedRoles - multi-scope data takes precedence
                                        {
                                            multiScopePricingData:
                                                structured.multiScopeData,
                                        },
                                    );
                            } else {
                                console.log(
                                    `✅ Using flat roles structure from ${structured.scopeItems.length} scope items`,
                                );
                                // For single scope or legacy format, flatten roles
                                const suggestedRoles =
                                    buildSuggestedRolesFromArchitectSOW(
                                        structured,
                                    );

                                // 🔒 Apply Account Management guardrail
                                const sanitized =
                                    sanitizeAccountManagementRoles(
                                        suggestedRoles,
                                    );

                                contentForEditor =
                                    convertMarkdownToNovelJSON(
                                        cleanedContent,
                                        sanitized,
                                        {},
                                    );
                            }

                            docTitle =
                                structured.title ||
                                `SOW - ${structured.client || "Untitled Client"}`;
                        } else {
                            // Fallback: convert markdown content without structured pricing
                            console.log(
                                "⚠️ No structured data found, converting markdown content only",
                            );
                            const cleanedContent =
                                accumulatedContent.replace(
                                    /\\[PRICING_JSON\\](.*?)\\[\/PRICING_JSON\\]/gs,
                                    "",
                                );

                            contentForEditor = convertMarkdownToNovelJSON(
                                cleanedContent,
                                [],
                                {},
                            );
                            docTitle =
                                extractDocTitle(cleanedContent) || "New SOW";
                        }

                        // Update the document in state
                        setDocuments((prev) =>
                            prev.map((doc) =>
                                doc.id === currentDocId
                                    ? {
                                          ...doc,
                                          content: contentForEditor,
                                          title: docTitle,
                                          lastModified: Date.now(),
                                      }
                                    : doc,
                            ),
                        );

                        console.log(
                            "✅ Automatic content insertion complete:",
                            contentForEditor?.content?.length || 0,
                            "characters",
                        );
                        toast.success(
                            "✅ Content automatically inserted into SOW editor",
                        );
                    } catch (error) {
                        console.error(
                            "❌ Error during automatic content insertion:",
                            error,
                        );
                        toast.error(
                            "⚠️ Content generated but failed to insert into editor",
                        );
                    }
                } else {
                    console.log(
                        "ℹ️ Not in editor mode or no document selected - skipping automatic insertion",
                    );
                }
            } else {
                // 📦 NON-STREAMING MODE: Standard fetch for OpenRouter
                const lastUserMessage =
                    newMessages[newMessages.length - 1]?.content || "";
                const messageLength = lastUserMessage.trim().length;
                const sowKeywords =
                    /(\bstatement of work\b|\bsow\b|\bscope\b|\bdeliverables\b|\bpricing\b|\bbudget\b|\bestimate\b|\bhours\b|\broles\b)/i;
                // Do not append per-message contracts; rely on workspace/system prompt
                console.log(
                    `📊 [Contract Check] Message length: ${messageLength}, keywordMatch: ${sowKeywords.test(lastUserMessage)}, isDashboard: ${isDashboardMode}`,
                );
                const requestMessages = [
                    // Do not include a system message; AnythingLLM workspace prompt governs behavior
                    ...newMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                ];
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    signal: controller.signal, // 🛑 Allow cancellation of this request
                    body: JSON.stringify({
                        model: effectiveAgent.model,
                        workspace: workspaceSlug,
                        threadSlug:
                            !isDashboardMode && currentDocId
                                ? documents.find(
                                      (d) => d.id === currentDocId,
                                  )?.threadSlug || undefined
                                : undefined,
                        messages: requestMessages,
                    }),
                });

                console.log(
                    "📥 Response Status:",
                    response.status,
                    response.statusText,
                );
                const data = await response.json();

                if (!response.ok) {
                    let errorMessage =
                        "Sorry, there was an error processing your request.";

                    if (response.status === 400) {
                        errorMessage =
                            "⚠️ OpenRouter API key not configured. Please set the OPENROUTER_API_KEY environment variable to enable AI chat functionality.";
                    } else if (response.status === 402) {
                        errorMessage =
                            "Payment required: Please check your OpenRouter account balance or billing information.";
                    } else if (response.status === 401) {
                        errorMessage =
                            "Authentication failed: Please check your OpenRouter API key.";
                    } else if (response.status === 429) {
                        errorMessage =
                            "Rate limit exceeded: Please wait a moment before trying again.";
                    } else if (data.error?.message) {
                        errorMessage = `API Error: ${data.error.message}`;
                    }

                    const aiMessage: ChatMessage = {
                        id: `msg${Date.now() + 1}`,
                        role: "assistant",
                        content: errorMessage,
                        timestamp: Date.now(),
                    };
                    setChatMessages((prev) => [...prev, aiMessage]);
                    return;
                }

                const aiMessage: ChatMessage = {
                    id: `msg${Date.now() + 1}`,
                    role: "assistant",
                    content:
                        data.choices?.[0]?.message?.content ||
                        "Sorry, I couldn't generate a response.",
                    timestamp: Date.now(),
                };
                setChatMessages((prev) => [...prev, aiMessage]);
                console.log("✅ Non-streaming response complete");

                // 🧩 Try to parse structured SOW JSON from non-streaming response
                try {
                    const structured = extractSOWStructuredJson(
                        aiMessage.content,
                    );
                    if (structured?.scopeItems?.length) {
                        setStructuredSow(structured);
                        console.log(
                            "✅ Captured structured SOW JSON for Excel export",
                        );
                    }
                } catch {}

                // 🚀 AUTOMATIC CONTENT INSERTION for non-streaming mode
                if (
                    viewMode === "editor" &&
                    currentDocId &&
                    aiMessage.content
                ) {
                    console.log(
                        "🚀 Starting automatic content insertion into SOW editor (non-streaming mode)...",
                    );

                    try {
                        // Extract SOW structured JSON from the AI response
                        const structured = extractSOWStructuredJson(
                            aiMessage.content,
                        );
                        let contentForEditor: any = null;
                        let docTitle = "New SOW";

                        if (structured?.scopeItems?.length) {
                            // Use structured data from Architect response
                            console.log(
                                `✅ Using structured SOW data with ${structured.scopeItems.length} scope items`,
                            );

                            const cleanedContent =
                                aiMessage.content.replace(
                                    /\\[PRICING_JSON\\](.*?)\\[\/PRICING_JSON\\]/gs,
                                    "",
                                );

                            // 🎯 Check if we have multi-scope data
                            if (
                                structured.multiScopeData &&
                                structured.multiScopeData.scopes &&
                                structured.multiScopeData.scopes.length > 0
                            ) {
                                console.log(
                                    `✅ Using multi-scope data with ${structured.multiScopeData.scopes.length} scopes (non-streaming)`,
                                );
                                // For multi-scope, don't flatten roles - let multiScopePricingData handle it
                                contentForEditor =
                                    convertMarkdownToNovelJSON(
                                        cleanedContent,
                                        [], // Empty suggestedRoles - multi-scope data takes precedence
                                        {
                                            multiScopePricingData:
                                                structured.multiScopeData,
                                        },
                                    );
                            } else {
                                console.log(
                                    `✅ Using flat roles structure from ${structured.scopeItems.length} scope items (non-streaming)`,
                                );
                                // For single scope or legacy format, flatten roles
                                const suggestedRoles =
                                    buildSuggestedRolesFromArchitectSOW(
                                        structured,
                                    );

                                // 🔒 Apply Account Management guardrail
                                const sanitized =
                                    sanitizeAccountManagementRoles(
                                        suggestedRoles,
                                    );

                                contentForEditor =
                                    convertMarkdownToNovelJSON(
                                        cleanedContent,
                                        sanitized,
                                        {},
                                    );
                            }

                            docTitle =
                                structured.title ||
                                `SOW - ${structured.client || "Untitled Client"}`;
                        } else {
                            // Fallback: convert markdown content without structured pricing
                            console.log(
                                "⚠️ No structured data found, converting markdown content only",
                            );
                            const cleanedContent =
                                aiMessage.content.replace(
                                    /\\[PRICING_JSON\\](.*?)\\[\/PRICING_JSON\\]/gs,
                                    "",
                                );

                            contentForEditor = convertMarkdownToNovelJSON(
                                cleanedContent,
                                [],
                                {},
                            );
                            docTitle =
                                extractDocTitle(cleanedContent) || "New SOW";
                        }

                        // Update the document in state
                        setDocuments((prev) =>
                            prev.map((doc) =>
                                doc.id === currentDocId
                                    ? {
                                          ...doc,
                                          content: contentForEditor,
                                          title: docTitle,
                                          lastModified: Date.now(),
                                      }
                                    : doc,
                            ),
                        );

                        console.log(
                            "✅ Automatic content insertion complete (non-streaming):",
                            contentForEditor?.content?.length || 0,
                            "characters",
                        );
                        toast.success(
                            "✅ Content automatically inserted into SOW editor",
                        );
                    } catch (error) {
                        console.error(
                            "❌ Error during automatic content insertion (non-streaming):",
                            error,
                        );
                        toast.error(
                            "⚠️ Content generated but failed to insert into editor",
                        );
                    }
                } else {
                    console.log(
                        "ℹ️ Not in editor mode or no document selected - skipping automatic insertion (non-streaming)",
                    );
                }
            }
        } catch (error) {
            console.error("❌ Chat API error:", error);
            
            // Log detailed error information for debugging
            if (error instanceof Error) {
                console.error("Error details:", {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                });
            }

            // Check if the error is an AbortError (request was cancelled)
            if (error instanceof Error && error.name === "AbortError") {
                console.log(
                    "ℹ️ Request was cancelled to prevent rate limiting",
                );
                return;
            }

            // Check for rate limiting errors
            let errorMessage =
                "❌ Network error: Unable to reach AI service. Please check your connection and try again.";
            if (error instanceof Error && error.message.includes("429")) {
                errorMessage =
                    "⏱️ Rate limit exceeded: Please wait a moment before trying again.";
                toast.error("⏱️ Rate limited - waiting before retry...");
            } else if (error instanceof Error) {
                // Show actual error message for better debugging
                errorMessage = `❌ Error: ${error.message}`;
                toast.error(`Chat error: ${error.message}`);
            }

            const errorMsg: ChatMessage = {
                id: `msg${Date.now() + 1}`,
                role: "assistant",
                content: errorMessage,
                timestamp: Date.now(),
            };
            const updatedMessages = [...newMessages, errorMsg];
            setChatMessages(updatedMessages);

            // ⚠️ REMOVED DATABASE SAVE - AnythingLLM handles all message storage
        } finally {
            setIsChatLoading(false);
            setCurrentRequestController(null); // Clean up the controller
        }
    }
  };

  return {
    isChatLoading,
    streamingMessageId,
    handleSendMessage,
    setStreamingMessageId,
  };
};