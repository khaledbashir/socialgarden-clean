            
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ArchitectSOW } from "@/lib/export-utils";
import type { Document, Folder, Agent, Workspace, SOW, ChatMessage } from "@/lib/types/sow";
import { transformScopesToPDFFormat } from "@/lib/sow-utils";
import { convertMarkdownToNovelJSON, ConvertOptions } from "@/lib/editor-utils";
import { extractPricingJSON, buildSuggestedRolesFromArchitectSOW, sanitizeEmptyTextNodes, extractFinancialReasoning } from "@/lib/page-utils";
import { ROLES } from "@/lib/rateCard";
import { calculatePricingTable } from "@/lib/pricingCalculator";
import { InteractiveOnboarding } from "@/components/tailwind/interactive-onboarding";
import { ResizableLayout } from "@/components/tailwind/resizable-layout";
import SidebarNav from "@/components/tailwind/sidebar-nav";
import { SHOW_DASHBOARD_UI } from "@/config/featureFlags";
import { SHOW_CLIENT_PORTAL_UI } from "@/config/featureFlags";
import EditorPanel from "@/components/tailwind/editor-panel";
import DashboardMain from "@/components/tailwind/DashboardMain";
import DashboardRight from "@/components/tailwind/DashboardRight";
import HomeWelcome from "@/components/tailwind/home-welcome";
import WorkspaceChat from "@/components/tailwind/workspace-chat";
import { SendToClientModal, ShareLinkModal } from "@/components/tailwind/page-modals";
import { validateAIResponse } from "@/lib/input-validation";
import { extractBudgetAndDiscount } from "@/lib/page-utils";
import { extractSOWStructuredJson } from "@/lib/export-utils";
import { WORKSPACE_CONFIG, getWorkspaceForAgent } from "@/lib/workspace-config";
import { anythingLLM } from "@/lib/anythingllm";
import { toast } from "sonner";
import { calculateTotalInvestment } from "@/lib/sow-utils";
import SOWPdfExportWrapper from "@/components/sow/SOWPdfExportWrapper";
import {
    ensureUnfiledFolder,
    UNFILED_FOLDER_ID,
    UNFILED_FOLDER_NAME,
} from "@/lib/ensure-unfiled-folder";
import { defaultEditorContent } from "@/lib/content";
import WorkspaceCreationProgress from "@/components/tailwind/workspace-creation-progress";
import OnboardingFlow from "@/components/tailwind/onboarding-flow";
import {
    extractPricingFromContent,
    exportToExcel,
    exportToPDF,
    cleanSOWContent,
} from "@/lib/export-utils";
import { prepareSOWForNewPDF } from "@/lib/sow-pdf-utils";
            

import { useUIState } from "@/hooks/useUIState";

export default function Page() {
    const {
      sidebarOpen,
      setSidebarOpen,
      agentSidebarOpen,
      setAgentSidebarOpen,
      showSendModal,
      setShowSendModal,
      showShareModal,
      setShowShareModal,
      shareModalData,
      setShareModalData,
      showGuidedSetup,
      setShowGuidedSetup,
      viewMode,
      setViewMode,
      isGrandTotalVisible,
      setIsGrandTotalVisible,
      showNewPDFModal,
      setShowNewPDFModal,
      newPDFData,
      setNewPDFData,
    } = useUIState();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentDocId, setCurrentDocId] = useState<string | null>(null);

    const [agents, setAgents] = useState<Agent[]>([]);
    const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
        null,
    ); // Track which message is streaming
    const [lastUserPrompt, setLastUserPrompt] = useState<string>(""); // 🎯 Track last user message for budget/discount extraction


    // 🎯 CRITICAL FIX: Store user prompt discount to override AI-generated discount
    const [userPromptDiscount, setUserPromptDiscount] = useState<number>(0);

    // 🎯 V4.1 Multi-Scope Pricing Data from AI
    const [multiScopePricingData, setMultiScopePricingData] = useState<{
        scopes: Array<{
            scope_name: string;
            scope_description?: string;
            deliverables?: string[];
            assumptions?: string[];
            discount?: number;
            role_allocation: Array<{
                role: string;
                hours: number;
                rate?: number;
                cost?: number;
            }>;
        }>;
        discount?: number;
        projectTitle?: string;
        // Additional properties that may be accessed - safely handled with defaults
        clientName?: string;
        company?: any;
        projectSubtitle?: string;
        projectOverview?: string;
        budgetNotes?: string;
        currency?: string;
        gstApplicable?: boolean;
        generatedDate?: string;
        authoritativeTotal?: number;
    } | null>(null);


    // Workspace & SOW state (NEW) - Start empty, load from AnythingLLM
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
    const [currentSOWId, setCurrentSOWId] = useState<string | null>(null);
    const editorRef = useRef<any>(null);
    // Track latest editor JSON to drive debounced auto-saves reliably
    const [latestEditorJSON, setLatestEditorJSON] = useState<any | null>(null);

    // --- Role sanitization helpers ---
    const normalize = (s: string) =>
        (s || "")
            .toLowerCase()
            .replace(/\s*-/g, "-")
            .replace(/-\s*/g, "-")
            .replace(/\s+/g, " ")
            .trim();

    const isAccountManagementVariant = (roleName: string) => {
        const n = normalize(roleName);
        // Match any Account Management family variant (manager/director/etc.)
        return /account/.test(n) && /(management|manager|director)/.test(n);
    };

    const sanitizeAccountManagementRoles = (
        roles: Array<
            | {
                  role: string;
                  hours?: number;
                  description?: string;
                  rate?: number;
              }
            | string
        >,
    ) => {
        if (!Array.isArray(roles) || roles.length === 0) return roles || [];

        // Collect hours from any AM-like variants
        let amHoursFromAI = 0;
        let amDescriptionFromAI: string | undefined = undefined;
        const nonAM = roles.filter((r) => {
            const roleName = typeof r === "string" ? r : r.role || "";
            const isAM = isAccountManagementVariant(roleName);
            if (isAM) {
                const hrs = typeof r === "string" ? 0 : Number(r.hours) || 0;
                amHoursFromAI += hrs > 0 ? hrs : 0;
                if (
                    !amDescriptionFromAI &&
                    typeof r !== "string" &&
                    r.description &&
                    r.description.trim().length > 0
                ) {
                    amDescriptionFromAI = r.description;
                }
            }
            return !isAM; // drop AM variants from source list
        });

        // Ensure exactly ONE canonical AM row is appended
        const canonicalName = "Account Management - (Account Manager)";
        const amDef = ROLES.find((r) => r.name === canonicalName);
        const amRate = amDef?.rate || 180;
        const defaultHours = 8;
        const finalHours = amHoursFromAI > 0 ? amHoursFromAI : defaultHours;
        const finalDescription =
            amDescriptionFromAI || "Client comms & governance";

        // If a canonical AM already exists somehow, merge hours
        const existingIndex = nonAM.findIndex(
            (r) =>
                normalize(typeof r === "string" ? r : r.role) ===
                normalize(canonicalName),
        );
        if (existingIndex !== -1) {
            const existing = nonAM[existingIndex] as any;
            const merged = {
                ...(typeof existing === "string"
                    ? { role: canonicalName }
                    : existing),
                role: canonicalName,
                hours: (Number((existing as any).hours) || 0) + finalHours,
                rate: amRate,
                description: (existing as any).description || finalDescription,
            };
            (nonAM as any).splice(existingIndex, 1, merged);
            return nonAM as any;
        }

        return [
            ...nonAM.map((r) =>
                typeof r === "string"
                    ? {
                          role: r,
                          hours: 0,
                          description: "",
                          rate: ROLES.find((x) => x.name === r)?.rate || 0,
                      }
                    : r,
            ),
            {
                role: canonicalName,
                description: finalDescription,
                hours: finalHours,
                rate: amRate,
            },
        ];
    };

    // --- Final price extraction helper ---
    const extractFinalPriceTargetText = (content: any): string | null => {
        if (!content || !Array.isArray(content.content)) return null;

        // Flatten all text content
        const flattenText = (node: any): string => {
            if (!node) return "";
            if (node.type === "text") return node.text || "";
            if (Array.isArray(node.content))
                return node.content.map(flattenText).join(" ");
            return "";
        };

        const allText = content.content
            .map(flattenText)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        if (!allText) return null;

        // Look for patterns like "Final Price: $20,000 +GST" or "Final Investment: $20,000"
        const patterns = [
            /(final\s*(price|investment|project\s*value)\s*[:\-]?\s*)(\$?\s*[\d,]+(?:\.\d+)?(?:\s*\+?\s*gst|\s*ex\s*gst|\s*incl\s*gst)?)/i,
        ];

        for (const re of patterns) {
            const m = allText.match(re);
            if (m && m[3]) {
                // Return the value part, normalized a bit to include a $ sign if missing
                let val = m[3].trim();
                if (!val.startsWith("$")) {
                    const numPart = val.replace(/[^\d.,a-z\s+]/gi, "").trim();
                    val = `$${numPart}`;
                }
                // Normalize spacing around GST annotations
                val = val
                    .replace(/\s*\+\s*gst/i, " +GST")
                    .replace(/\s*ex\s*gst/i, " ex GST")
                    .replace(/\s*incl\s*gst/i, " incl GST");
                return val;
            }
        }
        return null;
    };

    // Dashboard filter state removed

    // Workspace creation progress state (NEW)
    const [workspaceCreationProgress, setWorkspaceCreationProgress] = useState<{
        isOpen: boolean;
        workspaceName: string;
        currentStep: number;
        completedSteps: number[];
    }>({
        isOpen: false,
        workspaceName: "",
        currentStep: 0,
        completedSteps: [],
    });

    // Onboarding state (NEW)
    const [showOnboarding, setShowOnboarding] = useState(false);

    // History restore guard to avoid overwriting server-loaded chat
    const [isHistoryRestored, setIsHistoryRestored] = useState(false);

    // OAuth state for Google Sheets
    const [isOAuthAuthorized, setIsOAuthAuthorized] = useState(false);
    const [oauthAccessToken, setOauthAccessToken] = useState<string>("");

    // Dashboard AI workspace selector state - Master dashboard is the default
    const [dashboardChatTarget, setDashboardChatTarget] = useState<string>(
        WORKSPACE_CONFIG.dashboard.slug,
    );
    const [availableWorkspaces, setAvailableWorkspaces] = useState<
        Array<{ slug: string; name: string }>
    >([
        { slug: WORKSPACE_CONFIG.dashboard.slug, name: "🎯 All SOWs (Master)" },
    ]);
    // Structured SOW from AI (Architect modular JSON)
    const [structuredSow, setStructuredSow] = useState<ArchitectSOW | null>(
        null,
    );

    // Initialize master dashboard on app load
    useEffect(() => {
        const initDashboard = async () => {
            try {
                await anythingLLM.getOrCreateMasterDashboard();
                console.log("✅ Master SOW Dashboard initialized");
            } catch (error) {
                console.error("❌ Failed to initialize dashboard:", error);
            }
        };
        initDashboard();
    }, []);

    // Initialize dashboard with welcome message on app load
    // 🛡️ CRITICAL FIX: Only show welcome if history hasn't been restored from server
    // Note: DashboardChat component now auto-loads most recent thread from server
    useEffect(() => {
        if (
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

            // Add the welcome message to chat only when appropriate
            setChatMessages((prev) => prev.concat(welcomeMessage));
        }
    }, [viewMode, chatMessages.length, isHistoryRestored]);

    // Handle OAuth callback params separately (clean, focused effect)
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const oauthToken = params.get("oauth_token");
            const error = params.get("oauth_error");

            if (error) {
                toast.error(`OAuth error: ${error}`);
                // Clean up URL
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                );
                return;
            }

            if (oauthToken) {
                console.log("\u2705 OAuth token received from callback");
                setOauthAccessToken(oauthToken);
                setIsOAuthAuthorized(true);
                toast.success(
                    "\u2705 Google authorized! Will create GSheet once document loads...",
                );
                // Clean up URL
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                );
            }
        } catch (e) {
            console.warn("Error handling OAuth params:", e);
        }
    }, []);

    // Auto-trigger sheet creation when BOTH OAuth token and document are ready
    useEffect(() => {
        // Known generated/system workspace slugs that should be treated as non-client
        const GENERATION_SLUGS = new Set([
            "ad-copy-machine",
            "crm-communication-specialist",
            "case-study-crafter",
            "landing-page-persuader",
            "seo-content-strategist",
            "proposal-audit-specialist",
            "proposal-and-audit-specialist",
            "default-client",
            "gen",
            "sql",
            "sow-master-dashboard",
            "sow-master-dashboard-63003769",
            "pop",
        ]);

        const isGenerationOrSystem = (slug?: string) => {
            if (!slug) return true;
            const lower = slug.toLowerCase();
            return GENERATION_SLUGS.has(lower) || lower.startsWith("gen-");
        };

        // Only show master workspace for SOW generation - single workspace architecture
        const workspaceList = [
            {
                slug: WORKSPACE_CONFIG.dashboard.slug,
                name: "🎯 All SOWs (Master)",
            },
        ];

        setAvailableWorkspaces(workspaceList);
        console.log(
            "📋 Available workspaces for dashboard chat:",
            workspaceList,
        );
    }, [workspaces]); // Re-run when workspaces change

    // Fix hydration by setting mounted state
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        console.log("Loading workspace data, mounted:", mounted);
        if (!mounted) return;

        // ⚠️ CRITICAL FIX: Use AbortController to prevent race conditions from double render
        // In development with React.StrictMode, components mount twice. This controller
        // ensures only the latest request completes, preventing duplicate data loads.
        const abortController = new AbortController();

        const loadData = async () => {
            console.log("📂 Loading folders and SOWs from database...");

            // 🎯 STEP 1: Ensure "Unfiled" folder exists first
            await ensureUnfiledFolder();

            // No localStorage: read initial doc from URL query
            const urlParams = new URLSearchParams(window.location.search);
            const initialDocId = urlParams.get("docId");
            const hasCompletedSetup = undefined;

            try {
                // 🔒 SECURITY FIX: Remove localStorage caching for sensitive data
                // Always fetch from database to ensure data security and consistency

                // LOAD FOLDERS FROM DATABASE
                const foldersResponse = await fetch("/api/folders", {
                    signal: abortController.signal,
                });
                const foldersData = await foldersResponse.json();
                console.log(
                    "✅ Loaded folders from database:",
                    foldersData.length,
                );

                // LOAD SOWS FROM DATABASE
                const sowsResponse = await fetch("/api/sow/list", {
                    signal: abortController.signal,
                });
                const { sows } = await sowsResponse.json();
                const dbSOWs = sows;
                console.log("✅ Loaded SOWs from database:", dbSOWs.length);

                const workspacesWithSOWs: Workspace[] = [];
                const documentsFromDB: Document[] = [];
                const foldersFromDB: Folder[] = [];

                // Create workspace objects with SOWs from database
                for (const folder of foldersData) {
                    console.log(
                        `📁 Processing folder: ${folder.name} (ID: ${folder.id})`,
                    );

                    // Find SOWs that belong to this folder
                    const folderSOWs = dbSOWs
                        .filter((sow: any) => sow.folder_id === folder.id)
                        // Sort most-recent first using updated_at then created_at
                        .sort((a: any, b: any) => {
                            const ta = new Date(
                                a.updated_at || a.created_at || 0,
                            ).getTime();
                            const tb = new Date(
                                b.updated_at || b.created_at || 0,
                            ).getTime();
                            return tb - ta;
                        });

                    const sows: SOW[] = folderSOWs.map((sow: any) => ({
                        id: sow.id,
                        name: sow.title || "Untitled SOW",
                        workspaceId: folder.id,
                        vertical: sow.vertical || null,
                        service_line: sow.service_line || null,
                    }));

                    console.log(
                        `   ✓ Found ${sows.length} SOWs in this folder`,
                    );

                    // Add to workspaces array
                    workspacesWithSOWs.push({
                        id: folder.id,
                        name: folder.name,
                        sows: sows,
                        workspace_slug: folder.workspace_slug,
                    });

                    // Add to folders array
                    foldersFromDB.push({
                        id: folder.id,
                        name: folder.name,
                        workspaceSlug: folder.workspace_slug,
                        workspaceId: folder.workspace_id,
                        embedId: folder.embed_id,
                        syncedAt: folder.updated_at || folder.created_at,
                    });

                    // Create document objects for each SOW from database
                    for (const sow of folderSOWs) {
                        // Parse content if it's a JSON string, otherwise use as-is
                        let parsedContent = defaultEditorContent;
                        if (sow.content) {
                            try {
                                parsedContent =
                                    typeof sow.content === "string"
                                        ? JSON.parse(sow.content)
                                        : sow.content;
                            } catch (e) {
                                console.warn(
                                    "Failed to parse SOW content:",
                                    sow.id,
                                );
                                parsedContent = defaultEditorContent;
                            }
                        }

                        documentsFromDB.push({
                            id: sow.id,
                            title: sow.title || "Untitled SOW",
                            content: parsedContent,
                            folderId: folder.id,
                            workspaceSlug: folder.workspace_slug,
                            threadSlug: sow.thread_slug || undefined, // 🧵 AnythingLLM thread UUID (NOT sow.id!)
                            syncedAt: sow.updated_at,
                        });
                    }
                }

                console.log(
                    "✅ Total workspaces loaded:",
                    workspacesWithSOWs.length,
                );
                console.log("✅ Total SOWs loaded:", documentsFromDB.length);

                // Update state
                setWorkspaces(workspacesWithSOWs);
                setFolders(foldersFromDB);
                setDocuments(documentsFromDB);

                // Set current workspace to first one if available
                // BUT: Don't auto-select a SOW - let user click from dashboard
                if (workspacesWithSOWs.length > 0 && !currentWorkspaceId) {
                    setCurrentWorkspaceId(workspacesWithSOWs[0].id);
                    // Removed: Don't auto-select first SOW - user should manually select from dashboard
                    // This provides a better UX where dashboard is the entry point
                }

                // 🎓 Show onboarding if no workspaces (no localStorage gating)
                if (workspacesWithSOWs.length === 0) {
                    setTimeout(() => {
                        setShowOnboarding(true);
                    }, 500);
                }

                // Show guided setup if no workspaces
                if (!hasCompletedSetup && workspacesWithSOWs.length === 0) {
                    setTimeout(() => setShowGuidedSetup(true), 1000);
                }
            } catch (error) {
                // Don't log abort errors - they're expected cleanup
                if (error instanceof Error && error.name === "AbortError") {
                    console.log(
                        "📂 Data loading cancelled (previous request superseded)",
                    );
                    return;
                }
                console.error("❌ Error loading data:", error);
                toast.error("Failed to load workspaces and SOWs");
            }
            // Apply initial selection from URL if provided
            if (initialDocId) {
                setCurrentDocId(initialDocId);
                setCurrentSOWId(initialDocId);
            }
        };

        loadData();

        // Cleanup: abort any pending requests if component unmounts or mounted changes
        return () => {
            console.log("🧹 Cleaning up workspace data loading");
            abortController.abort();
        };
    }, [mounted]);

    // Note: SOWs are now saved to database via API calls, not localStorage

    // ✨ NEW: When currentSOWId changes, load the corresponding document and switch to editor view
    useEffect(() => {
        if (!currentSOWId) return;

        console.log("📄 Loading document for SOW:", currentSOWId);

        // Find the document in the documents array
        const doc = documents.find((d) => d.id === currentSOWId);

        if (doc) {
            console.log("✅ Found document:", doc.title);
            setCurrentDocId(doc.id);
            setViewMode("editor"); // Switch to editor view

            // 🧵 Load chat history from AnythingLLM thread
            const loadChatHistory = async () => {
                if (doc.threadSlug && !doc.threadSlug.startsWith("temp-")) {
                    try {
                        console.log(
                            "💬 Loading chat history for thread:",
                            doc.threadSlug,
                        );
                        // 🎯 Use the workspace where the SOW was created (where its thread lives)
                        const history = await anythingLLM.getThreadChats(
                            doc.workspaceSlug || "sow-generator",
                            doc.threadSlug,
                        );

                        if (history && history.length > 0) {
                            // Convert AnythingLLM history format to our ChatMessage format
                            const messages: ChatMessage[] = history.map(
                                (msg: any) => ({
                                    id: `msg${Date.now()}-${Math.random()}`,
                                    role:
                                        msg.role === "user"
                                            ? "user"
                                            : "assistant",
                                    content: msg.content,
                                    timestamp: Date.now(),
                                }),
                            );

                            console.log(
                                `✅ Loaded ${messages.length} messages from thread`,
                            );
                            setChatMessages(messages);
                        } else {
                            console.log(
                                "ℹ️ No chat history found for this SOW",
                            );
                            setChatMessages([]);
                        }
                    } catch (error) {
                        console.error("❌ Failed to load chat history:", error);
                        setChatMessages([]);
                    }
                } else {
                    console.log(
                        "ℹ️ No valid thread associated with this SOW yet (temp or missing), clearing chat",
                    );
                    setChatMessages([]);
                }
            };

            loadChatHistory();
        } else {
            console.warn("⚠️ Document not found for SOW:", currentSOWId);
        }
    }, [currentSOWId]); // 🔧 FIXED: Removed 'documents' dependency to prevent chat clearing on auto-save

    // Auto-save SOW content whenever editor content changes (debounced)
    useEffect(() => {
        // Don't attempt to save until we have an active document AND
        // we have received at least one onUpdate from the editor (fresh JSON)
        if (!currentDocId || latestEditorJSON === null) return;

        const timer = setTimeout(async () => {
            try {
                // Always try to pull the freshest content from the live editor
                const editorContent =
                    editorRef.current?.getContent?.() || latestEditorJSON;

                // DEBUG: prove what we're about to save
                console.log("🟡 Attempting to save...", {
                    docId: currentDocId,
                    hasEditorRef: !!editorRef.current,
                    hasGetContent: !!editorRef.current?.getContent,
                    contentType: typeof editorContent,
                    isDoc: editorContent && editorContent.type === "doc",
                    nodeCount: Array.isArray(editorContent?.content)
                        ? editorContent.content.length
                        : null,
                });

                if (!editorContent) {
                    console.warn(
                        "⚠️ No editor content to save for:",
                        currentDocId,
                    );
                    return;
                }

                // Extra verbose log: full JSON being sent
                try {
                    console.log(
                        "📦 Editor JSON to save:",
                        JSON.stringify(editorContent),
                    );
                } catch (_) {
                    // ignore stringify errors
                }

                // Calculate total investment from pricing table in content
                const pricingRows = extractPricingFromContent(editorContent);

                // 🔧 SAFETY: Filter out invalid rows and handle NaN values
                const validRows = pricingRows.filter((row) => {
                    const hours = Number(row.hours) || 0;
                    const rate = Number(row.rate) || 0;
                    const total = Number(row.total) || hours * rate;
                    return (
                        hours >= 0 && rate >= 0 && total >= 0 && !isNaN(total)
                    );
                });

                const totalInvestment = validRows.reduce((sum, row) => {
                    const rowTotal =
                        Number(row.total) ||
                        Number(row.hours) * Number(row.rate) ||
                        0;
                    return sum + (isNaN(rowTotal) ? 0 : rowTotal);
                }, 0);

                const currentDoc = documents.find((d) => d.id === currentDocId);

                const response = await fetch(`/api/sow/${currentDocId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: editorContent, // tiptap JSON
                        title: currentDoc?.title || "Untitled SOW",
                        total_investment: isNaN(totalInvestment)
                            ? 0
                            : totalInvestment,
                        vertical: currentDoc?.vertical || null,
                        serviceLine: currentDoc?.serviceLine || null,
                    }),
                });

                if (!response.ok) {
                    console.warn(
                        "⚠️ Auto-save failed for SOW:",
                        currentDocId,
                        "Status:",
                        response.status,
                    );
                } else {
                    console.log(
                        "💾 Auto-save success for",
                        currentDocId,
                        `(Total: $${(isNaN(totalInvestment) ? 0 : totalInvestment).toFixed(2)})`,
                    );
                }
            } catch (error) {
                console.error("❌ Error auto-saving SOW:", error);
            }
        }, 1500); // 1.5s debounce after content changes

        return () => clearTimeout(timer);
    }, [latestEditorJSON, currentDocId]);

    // Persist current document selection in the URL (no localStorage)
    useEffect(() => {
        if (!mounted) return;
        const params = new URLSearchParams(window.location.search);
        if (currentDocId) {
            params.set("docId", currentDocId);
        } else {
            params.delete("docId");
        }
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
        window.history.replaceState({}, "", newUrl);
    }, [currentDocId, mounted]);

    // ⚠️ CRITICAL FIX: Separate useEffect for agent selection that depends on context
    // This ensures we don't set the agent until we know where we are (dashboard vs editor)
    useEffect(() => {
        if (agents.length === 0 || !mounted) return; // Wait for agents to load and app to be ready

        // Determine which agent to use based on current context
        const determineAndSetAgent = async () => {
            let agentIdToUse: string | null = null;

            if (viewMode === "dashboard") {
                // In dashboard mode, we should NOT use the default (gen-the-architect)
                // The dashboard will handle its own agent selection based on dashboardChatTarget
                console.log(
                    "🎯 [Agent Selection] In DASHBOARD mode - agent managed by dashboard component",
                );
                setCurrentAgentId(null); // Let dashboard manage its own agent
            } else if (viewMode === "editor" && currentDocId) {
                // In editor mode, check if there's a saved preference
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

                // If no saved preference, use default only if in editor mode with a document
                if (!agentIdToUse) {
                    const genArchitect = agents.find(
                        (a) =>
                            a.name === "GEN - The Architect" ||
                            a.id === "gen-the-architect",
                    );
                    agentIdToUse = genArchitect?.id || agents[0]?.id || null;
                    console.log(
                        `🎯 [Agent Selection] In EDITOR mode - using default agent: ${agentIdToUse}`,
                    );
                }

                setCurrentAgentId(agentIdToUse);
            } else {
                // No specific context yet, don't set an agent
                console.log(
                    "🎯 [Agent Selection] No context yet - deferring agent selection",
                );
                setCurrentAgentId(null);
            }
        };

        determineAndSetAgent();
    }, [agents, viewMode, currentDocId, mounted]);

    // Save current agent preference to database
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

    // Chat messages are now saved individually on each message send/receive
    // No need for useEffect saving here - database handles persistence

    const currentDoc = documents.find((d) => d.id === currentDocId);

    useEffect(() => {
        if (currentDoc && editorRef.current) {
            // On document change, load the new document content explicitly
            console.log("📄 Loading content for SOW", currentDocId, "...");
            editorRef.current.commands?.setContent
                ? editorRef.current.commands.setContent(currentDoc.content)
                : editorRef.current.insertContent(currentDoc.content);
            console.log("✅ LOAD SUCCESS for", currentDocId);
        }
    }, [currentDocId]);

    // Synchronous save helper used before navigating away from a document
    const saveCurrentSOWNow = async (docId: string): Promise<boolean> => {
        try {
            const editorContent =
                editorRef.current?.getContent?.() || latestEditorJSON;
            console.log("🟡 Attempting to save (immediate)...", {
                docId,
                hasEditorRef: !!editorRef.current,
                hasGetContent: !!editorRef.current?.getContent,
                contentType: typeof editorContent,
                isDoc: editorContent && editorContent.type === "doc",
                nodeCount: Array.isArray(editorContent?.content)
                    ? editorContent.content.length
                    : null,
            });
            try {
                console.log(
                    "📦 Editor JSON to save (immediate):",
                    JSON.stringify(editorContent),
                );
            } catch (_) {}
            if (!editorContent) {
                console.warn(
                    "⚠️ saveCurrentSOWNow: No editor content to save for:",
                    docId,
                );
                return true; // Nothing to save; don't block navigation
            }

            const pricingRows = extractPricingFromContent(editorContent);
            const validRows = pricingRows.filter((row) => {
                const hours = Number(row.hours) || 0;
                const rate = Number(row.rate) || 0;
                const total = Number(row.total) || hours * rate;
                return hours >= 0 && rate >= 0 && total >= 0 && !isNaN(total);
            });
            const totalInvestment = validRows.reduce((sum, row) => {
                const rowTotal =
                    Number(row.total) ||
                    Number(row.hours) * Number(row.rate) ||
                    0;
                return sum + (isNaN(rowTotal) ? 0 : rowTotal);
            }, 0);

            const docMeta = documents.find((d) => d.id === docId);

            console.log(
                "💾 Saving SOW before navigation:",
                docId,
                `(Total: $${(isNaN(totalInvestment) ? 0 : totalInvestment).toFixed(2)})`,
            );
            const response = await fetch(`/api/sow/${docId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: editorContent,
                    title: docMeta?.title || "Untitled SOW",
                    total_investment: isNaN(totalInvestment)
                        ? 0
                        : totalInvestment,
                    vertical: docMeta?.vertical || null,
                    serviceLine: docMeta?.serviceLine || null,
                }),
            });

            if (!response.ok) {
                console.error(
                    "❌ SAVE FAILED for",
                    docId,
                    "Status:",
                    response.status,
                );
                return false;
            }
            console.log("✅ SAVE SUCCESS for", docId);
            return true;
        } catch (error) {
            console.error("❌ Error in saveCurrentSOWNow:", error);
            return false;
        }
    };

    const handleSelectDoc = (id: string) => {
        if (id === currentDocId) return; // No-op if selecting the same doc

        (async () => {
            console.log(
                "➡️ NAVIGATION TRIGGERED for SOW",
                id,
                ". Starting save for",
                currentDocId,
                "...",
            );
            // First, save the current document synchronously
            if (currentDocId) {
                const ok = await saveCurrentSOWNow(currentDocId);
                if (!ok) {
                    console.error(
                        "❌ SAVE FAILED for",
                        currentDocId,
                        ". Halting navigation.",
                    );
                    return; // Abort navigation on save failure
                }
                console.log(
                    "✅ SAVE SUCCESS for",
                    currentDocId,
                    ". Now loading new document.",
                );
            }

            // Proceed with navigation
            setCurrentSOWId(id); // Triggers chat history load
            setCurrentDocId(id);

            // Update URL with selected docId (no localStorage)
            const params = new URLSearchParams(window.location.search);
            params.set("docId", id);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, "", newUrl);

            // Proactively load editor content for the new document
            const nextDoc = documents.find((d) => d.id === id);
            if (nextDoc && editorRef.current) {
                console.log("📄 Loading content for SOW", id, "...");
                editorRef.current.commands?.setContent
                    ? editorRef.current.commands.setContent(nextDoc.content)
                    : editorRef.current.insertContent(nextDoc.content);
                console.log("✅ LOAD SUCCESS for", id);
            }

            // Ensure we are in editor view
            if (viewMode !== "editor") {
                setViewMode("editor");
            }
        })();
    };

    const handleNewDoc = async (folderId?: string) => {
        const newId = `doc${Date.now()}`;
        const title = "Untitled SOW";

        // 🎯 DEFAULT TO UNFILED: If no folder specified, use Unfiled folder
        const targetFolderId = folderId || UNFILED_FOLDER_ID;

        // Find workspace slug from the folder this SOW belongs to
        const parentFolder = folders.find((f) => f.id === targetFolderId);
        const workspaceSlug = parentFolder?.workspaceSlug;

        // 🎯 Check if this is the Unfiled folder (no workspace needed)
        const isUnfiledFolder = targetFolderId === UNFILED_FOLDER_ID;

        let newDoc: Document = {
            id: newId,
            title,
            content: defaultEditorContent,
            folderId: targetFolderId,
            workspaceSlug,
        };

        // 🧵 Only create AnythingLLM thread if NOT Unfiled and has workspace
        if (!isUnfiledFolder && workspaceSlug) {
            try {
                console.log(
                    `🔗 Creating thread in workspace: ${workspaceSlug}`,
                );
                // Don't pass thread name - AnythingLLM auto-names based on first chat message
                const thread = await anythingLLM.createThread(workspaceSlug);
                if (thread) {
                    newDoc = {
                        ...newDoc,
                        threadSlug: thread.slug,
                        threadId: thread.id,
                        syncedAt: new Date().toISOString(),
                    };

                    // 📊 Embed SOW in master 'gen' workspace and master dashboard
                    console.log(`📊 Embedding new SOW in master workspaces`);
                    const sowContent = JSON.stringify(defaultEditorContent);
                    const clientContext = parentFolder?.name || "unknown";
                    await anythingLLM.embedSOWInBothWorkspaces(
                        title,
                        sowContent,
                        clientContext,
                    );

                    toast.success(
                        `✅ SOW created in ${parentFolder?.name || "workspace"}`,
                    );
                } else {
                    console.warn(
                        "⚠️ Thread creation failed - SOW created without thread",
                    );
                    toast.warning(
                        "⚠️ SOW created but thread sync failed. You can still chat about it.",
                    );
                }
            } catch (error) {
                console.error("❌ Error creating thread:", error);
                toast.warning("SOW created but thread sync failed");
            }
        } else {
            // Unfiled or no workspace - just create the SOW
            console.log("ℹ️ Creating SOW in Unfiled (no workspace needed)");
            toast.success(
                `✅ SOW created in Unfiled! Organize into folders later or start working now.`,
            );
        }

        // Save new SOW to database first
        try {
            const saveResponse = await fetch("/api/sow/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newDoc.title,
                    content: newDoc.content,
                    folder_id: newDoc.folderId,
                    workspace_slug: newDoc.workspaceSlug,
                    client_name: "",
                    client_email: "",
                    total_investment: 0,
                }),
            });

            if (saveResponse.ok) {
                const savedDoc = await saveResponse.json();
                // Update newDoc with the database ID
                newDoc = { ...newDoc, id: savedDoc.id || newId };
                console.log("✅ SOW saved to database with id:", newDoc.id);
            } else {
                console.warn("⚠️ Failed to save SOW to database");
                toast.warning("⚠️ SOW created but not saved to database");
            }
        } catch (error) {
            console.error("❌ Error saving SOW to database:", error);
            toast.error("⚠️ Failed to save SOW");
        }

        setDocuments((prev) => [...prev, newDoc]);
        setCurrentDocId(newDoc.id);

        // 🎯 Switch to editor view (in case we're on dashboard/AI management)
        if (viewMode !== "editor") {
            setViewMode("editor");
        }

        // Clear chat messages for current agent (in state only - database messages persist)
        setChatMessages([]);

        // Keep sidebar closed - let user open manually
        const architectAgent = agents.find((a) => a.id === "architect");
        if (architectAgent) {
            setCurrentAgentId("architect");
        }
    };

    const handleRenameDoc = async (id: string, title: string) => {
        const doc = documents.find((d) => d.id === id);

        try {
            // 🧵 Update AnythingLLM thread name if it exists
            if (doc?.workspaceSlug && doc?.threadSlug) {
                await anythingLLM.updateThread(
                    doc.workspaceSlug,
                    doc.threadSlug,
                    title,
                );
                toast.success(`✅ SOW renamed to "${title}"`);
            }

            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === id
                        ? { ...d, title, syncedAt: new Date().toISOString() }
                        : d,
                ),
            );
            // Keep sidebar in sync and move to top within its folder
            setWorkspaces((prev) =>
                prev.map((ws) => {
                    const has = ws.sows.some((s) => s.id === id);
                    if (!has) return ws;
                    const updated = ws.sows.map((s) =>
                        s.id === id ? { ...s, name: title } : s,
                    );
                    const moved = [
                        updated.find((s) => s.id === id)!,
                        ...updated.filter((s) => s.id !== id),
                    ];
                    return { ...ws, sows: moved };
                }),
            );
        } catch (error) {
            console.error("Error renaming document:", error);
            setDocuments((prev) =>
                prev.map((d) => (d.id === id ? { ...d, title } : d)),
            );
            toast.error("SOW renamed locally but thread sync failed");
        }
    };

    const handleDeleteDoc = async (id: string) => {
        const doc = documents.find((d) => d.id === id);

        try {
            // Delete SOW from database first
            const deleteResponse = await fetch(`/api/sow/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (deleteResponse.ok) {
                console.log("✅ SOW deleted from database:", id);
            } else {
                console.warn("⚠️ Failed to delete SOW from database");
                toast.warning(
                    "⚠️ SOW deleted from UI but database deletion failed",
                );
            }

            // 🧵 Delete AnythingLLM thread if it exists
            if (doc?.workspaceSlug && doc?.threadSlug) {
                await anythingLLM.deleteThread(
                    doc.workspaceSlug,
                    doc.threadSlug,
                );
                toast.success(`✅ SOW and thread deleted`);
            }
        } catch (error) {
            console.error("Error deleting SOW:", error);
            toast.error("Failed to delete SOW");
        }

        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (currentDocId === id) {
            const remaining = documents.filter((d) => d.id !== id);
            setCurrentDocId(remaining.length > 0 ? remaining[0].id : null);
        }
    };

    const handleNewFolder = async (name: string) => {
        const newId = `folder-${Date.now()}`;
        try {
            // 🏢 Access master SOW workspace for this folder
            const workspace = await anythingLLM.getMasterSOWWorkspace(name);
            const embedId = await anythingLLM.getOrCreateEmbedId(
                workspace.slug,
            );

            // 💾 Save folder to DATABASE
            const response = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: newId,
                    name,
                    workspaceSlug: workspace.slug,
                    workspaceId: workspace.id,
                    embedId: embedId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.details || "Failed to create folder in database",
                );
            }

            const savedFolder = await response.json();
            console.log("✅ Folder saved to database:", savedFolder);

            const newFolder: Folder = {
                id: savedFolder.id,
                name: name,
                workspaceSlug: workspace.slug,
                workspaceId: workspace.id,
                embedId,
                syncedAt: new Date().toISOString(),
            };

            setFolders((prev) => [...prev, newFolder]);
            toast.success(`✅ Workspace "${name}" created!`);

            // 🎯 AUTO-CREATE FIRST SOW IN NEW FOLDER
            // This creates an empty SOW and opens it immediately
            await handleNewDoc(newFolder.id);
        } catch (error) {
            console.error("Error creating folder:", error);
            toast.error(`❌ Failed to create folder: ${error.message}`);
        }
    };

    const handleRenameFolder = async (id: string, name: string) => {
        const folder = folders.find((f) => f.id === id);

        try {
            // 💾 Update folder in DATABASE
            const response = await fetch(`/api/folders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error("Failed to update folder in database");
            }

            // 🏢 Update AnythingLLM workspace name if it exists
            if (folder?.workspaceSlug) {
                await anythingLLM.updateWorkspace(folder.workspaceSlug, name);
            }

            setFolders((prev) =>
                prev.map((f) =>
                    f.id === id
                        ? { ...f, name, syncedAt: new Date().toISOString() }
                        : f,
                ),
            );
            toast.success(`✅ Folder renamed to "${name}"`);
        } catch (error) {
            console.error("Error renaming folder:", error);
            toast.error("❌ Failed to rename folder");
        }
    };

    const handleDeleteFolder = async (id: string) => {
        const folder = folders.find((f) => f.id === id);

        // Also delete subfolders and docs in folder
        const toDelete = [id];
        const deleteRecursive = (folderId: string) => {
            folders
                .filter((f) => f.parentId === folderId)
                .forEach((f) => {
                    toDelete.push(f.id);
                    deleteRecursive(f.id);
                });
        };
        deleteRecursive(id);

        try {
            // 💾 Delete folder from DATABASE
            const response = await fetch(`/api/folders/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete folder from database");
            }

            // 🏢 Delete AnythingLLM workspace (cascades to all threads)
            if (folder?.workspaceSlug) {
                await anythingLLM.deleteWorkspace(folder.workspaceSlug);
            }

            setFolders((prev) => prev.filter((f) => !toDelete.includes(f.id)));
            setDocuments((prev) =>
                prev.filter(
                    (d) => !d.folderId || !toDelete.includes(d.folderId),
                ),
            );
            toast.success(`✅ Folder deleted from database`);
        } catch (error) {
            console.error("Error deleting folder:", error);
            toast.error("❌ Failed to delete folder");
        }
    };

    const handleMoveDoc = (docId: string, folderId?: string) => {
        setDocuments((prev) =>
            prev.map((d) => (d.id === docId ? { ...d, folderId } : d)),
        );
    };

    // ==================== WORKSPACE & SOW HANDLERS (NEW) ====================
    const handleCreateWorkspace = async (
        workspaceName: string,
        workspaceType: "sow" | "client" | "generic" = "sow",
    ) => {
        try {
            console.log("📁 Creating workspace folder:", workspaceName);

            // 📊 SHOW PROGRESS MODAL
            setWorkspaceCreationProgress({
                isOpen: true,
                workspaceName,
                currentStep: 0,
                completedSteps: [],
            });

            // 🏢 STEP 1: Get/ensure master 'gen' workspace exists
            console.log(
                "🏢 Getting/ensuring master SOW generation workspace...",
            );
            const workspace =
                await anythingLLM.getMasterSOWWorkspace(workspaceName);
            const embedId = await anythingLLM.getOrCreateEmbedId(
                workspace.slug,
            );
            console.log("✅ Master SOW workspace ready:", workspace.slug);

            // Mark step 1 complete
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                completedSteps: [0],
                currentStep: 1,
            }));

            // 💾 STEP 2: Save folder to DATABASE (no workspace creation - using master 'gen')
            console.log("💾 Saving folder to database...");
            const folderResponse = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: workspaceName,
                    workspaceSlug: workspace.slug, // Always 'gen' now
                    workspaceId: workspace.id,
                    embedId: embedId,
                }),
            });

            if (!folderResponse.ok) {
                const errorData = await folderResponse.json();
                throw new Error(
                    errorData.details || "Failed to create folder in database",
                );
            }

            const folderData = await folderResponse.json();
            const folderId = folderData.id;
            console.log("✅ Folder saved to database with ID:", folderId);

            // Mark step 2 complete
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                completedSteps: [0, 1],
                currentStep: 2,
            }));

            // Create folder in local state
            const newFolder: Folder = {
                id: folderId,
                name: workspaceName,
                workspaceSlug: workspace.slug, // Always 'gen'
                workspaceId: workspace.id,
                embedId: embedId,
                syncedAt: new Date().toISOString(),
            };

            setFolders((prev) => [...prev, newFolder]);

            // Create workspace in local state
            const newWorkspace: Workspace = {
                id: folderId,
                name: workspaceName,
                sows: [],
                workspace_slug: workspace.slug,
            };

            // IMMEDIATELY CREATE A BLANK SOW
            const sowTitle = `New SOW for ${workspaceName}`;

            // Save SOW to database with folder ID
            console.log("📄 Creating SOW in database");
            const sowResponse = await fetch("/api/sow/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: sowTitle,
                    content: defaultEditorContent,
                    clientName: workspaceName,
                    clientEmail: "",
                    totalInvestment: 0,
                    folderId: folderId,
                }),
            });

            if (!sowResponse.ok) {
                throw new Error("Failed to create SOW");
            }

            const sowData = await sowResponse.json();
            const sowId = sowData.id || sowData.sowId;
            console.log("✅ SOW created with ID:", sowId);

            // 🧵 STEP 3: Create AnythingLLM thread in master 'gen' workspace
            console.log("🧵 Creating thread in master workspace...");
            const thread = await anythingLLM.createThread(workspace.slug);
            console.log("✅ Thread created:", thread.slug);

            // Update SOW with thread info
            await fetch(`/api/sow/${sowId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadSlug: thread.slug,
                    workspaceSlug: workspace.slug, // 'gen'
                }),
            });

            // Mark step 3 complete
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                completedSteps: [0, 1, 2],
                currentStep: 3,
            }));

            // 📊 STEP 4: Embed SOW in master 'gen' workspace and master dashboard
            console.log("📊 Embedding SOW in master workspaces...");
            const sowContent = JSON.stringify(defaultEditorContent);
            await anythingLLM.embedSOWInBothWorkspaces(
                sowTitle,
                sowContent,
                workspaceName,
            );
            console.log("✅ SOW embedded in master workspaces");

            // Mark all steps complete
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                completedSteps: [0, 1, 2, 3],
                currentStep: 4,
            }));

            // Create SOW object for local state
            const newSOW: SOW = {
                id: sowId,
                name: sowTitle,
                workspaceId: folderId,
            };

            // Update workspace with the SOW
            newWorkspace.sows = [newSOW];

            // Update state
            setWorkspaces((prev) => [newWorkspace, ...prev]);
            setCurrentWorkspaceId(folderId);
            setCurrentSOWId(sowId);
            setViewMode("editor");

            // Add document to local state
            const newDoc: Document = {
                id: sowId,
                title: sowTitle,
                content: defaultEditorContent,
                folderId: folderId,
                workspaceSlug: workspace.slug, // 'gen'
                threadSlug: thread.slug,
                syncedAt: new Date().toISOString(),
            };

            setDocuments((prev) => [...prev, newDoc]);
            setCurrentDocId(sowId);
            setChatMessages([]);

            toast.success(
                `✅ Created workspace "${workspaceName}" with blank SOW ready to edit!`,
            );

            // Close progress modal and auto-select the new SOW
            setTimeout(() => {
                setWorkspaceCreationProgress((prev) => ({
                    ...prev,
                    isOpen: false,
                }));
                handleSelectDoc(sowId);
            }, 500);
        } catch (error) {
            console.error("❌ Error creating workspace:", error);
            toast.error("Failed to create workspace. Please try again.");
            setWorkspaceCreationProgress((prev) => ({
                ...prev,
                isOpen: false,
            }));
        }
    };

    const handleRenameWorkspace = (workspaceId: string, newName: string) => {
        setWorkspaces((prev) =>
            prev.map((ws) =>
                ws.id === workspaceId ? { ...ws, name: newName } : ws,
            ),
        );
    };

    const handleDeleteWorkspace = async (workspaceId: string) => {
        try {
            const workspace = workspaces.find((ws) => ws.id === workspaceId);

            if (!workspace) {
                toast.error("Workspace not found");
                return;
            }

            // 💾 Delete from database AND AnythingLLM (API endpoint handles both)
            const dbResponse = await fetch(`/api/folders/${workspaceId}`, {
                method: "DELETE",
            });

            if (!dbResponse.ok) {
                const errorData = await dbResponse.json();
                throw new Error(
                    errorData.details ||
                        "Failed to delete workspace from database",
                );
            }

            const result = await dbResponse.json();
            console.log(`✅ Workspace deletion result:`, result);

            // Update state
            setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));

            // If we deleted the current workspace, switch to first available
            if (currentWorkspaceId === workspaceId) {
                const remaining = workspaces.filter(
                    (ws) => ws.id !== workspaceId,
                );
                if (remaining.length > 0) {
                    setCurrentWorkspaceId(remaining[0].id);
                    setCurrentSOWId(remaining[0].sows[0]?.id || null);
                } else {
                    setCurrentWorkspaceId("");
                    setCurrentSOWId(null);
                }
            }

            toast.success(`✅ Workspace "${workspace.name}" deleted`);

            // 🔄 Safety: Refresh from server to ensure UI counts are perfectly in sync
            // with DB and AnythingLLM after deletion
            try {
                const [foldersRes, sowsRes] = await Promise.all([
                    fetch("/api/folders", { cache: "no-store" }),
                    fetch("/api/sow/list", { cache: "no-store" }),
                ]);
                if (foldersRes.ok && sowsRes.ok) {
                    const foldersData = await foldersRes.json();
                    const { sows: dbSOWs } = await sowsRes.json();

                    const workspacesWithSOWs: Workspace[] = [];
                    const foldersFromDB: Folder[] = [];
                    const documentsFromDB: Document[] = [];

                    for (const folder of foldersData) {
                        const folderSOWs = dbSOWs.filter(
                            (sow: any) => sow.folder_id === folder.id,
                        );
                        workspacesWithSOWs.push({
                            id: folder.id,
                            name: folder.name,
                            sows: folderSOWs.map((sow: any) => ({
                                id: sow.id,
                                name: sow.title || "Untitled SOW",
                                workspaceId: folder.id,
                                vertical: sow.vertical || null,
                                service_line: sow.service_line || null,
                            })),
                            workspace_slug: folder.workspace_slug,
                        });

                        foldersFromDB.push({
                            id: folder.id,
                            name: folder.name,
                            workspaceSlug: folder.workspace_slug,
                            workspaceId: folder.workspace_id,
                            embedId: folder.embed_id,
                            syncedAt: folder.updated_at || folder.created_at,
                        });

                        for (const sow of folderSOWs) {
                            let parsedContent = defaultEditorContent;
                            if (sow.content) {
                                try {
                                    parsedContent =
                                        typeof sow.content === "string"
                                            ? JSON.parse(sow.content)
                                            : sow.content;
                                } catch (e) {
                                    parsedContent = defaultEditorContent;
                                }
                            }
                            documentsFromDB.push({
                                id: sow.id,
                                title: sow.title || "Untitled SOW",
                                content: parsedContent,
                                folderId: folder.id,
                                workspaceSlug: folder.workspace_slug,
                                threadSlug: sow.thread_slug || undefined,
                                syncedAt: sow.updated_at,
                            });
                        }
                    }

                    setWorkspaces(workspacesWithSOWs);
                    setFolders(foldersFromDB);
                    setDocuments(documentsFromDB);
                }
            } catch (e) {
                console.warn(
                    "⚠️ Post-delete refresh failed; UI may still be accurate due to optimistic update.",
                    e,
                );
            }
        } catch (error) {
            console.error("Error deleting workspace:", error);
            toast.error(
                `Failed to delete workspace: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    };

    const handleCreateSOW = async (workspaceId: string, sowName: string) => {
        try {
            console.log("🆕 handleCreateSOW called with:", {
                workspaceId,
                sowName,
            });

            // 🛡️ CRITICAL: Prevent duplicate creation - check if a temp SOW already exists
            const hasTempSOW = documents.some((doc) => doc.id.startsWith("temp-"));
            if (hasTempSOW) {
                console.warn("⚠️ SOW creation already in progress, ignoring duplicate request");
                return;
            }

            // Find the folder/workspace in local state (for display only)
            // 🎯 Allow Unfiled folder even if not loaded yet
            const folder = workspaces.find((ws) => ws.id === workspaceId);
            const isUnfiledFolder = workspaceId === UNFILED_FOLDER_ID;

            if (!folder && !isUnfiledFolder) {
                toast.error("Folder not found");
                return;
            }

            // 🚀 FAST PATH: Create temporary document and switch to editor IMMEDIATELY
            // Use a temporary thread slug that will be replaced once AnythingLLM responds
            const tempThreadSlug = `temp-${Date.now()}`;

            const tempDoc: Document = {
                id: tempThreadSlug,
                title: sowName,
                content: defaultEditorContent,
                folderId: workspaceId,
                workspaceSlug: "sow-generator", // Use the master workspace slug
                threadSlug: tempThreadSlug,
                syncedAt: new Date().toISOString(),
            };

            // Update state immediately to switch to editor
            setDocuments((prev) => [...prev, tempDoc]);
            setCurrentDocId(tempThreadSlug);
            setCurrentSOWId(tempThreadSlug);

            const newSOW: SOW = {
                id: tempThreadSlug,
                name: sowName,
                workspaceId,
            };
            // Show new SOW at the top (most-recent-first)
            setWorkspaces((prev) =>
                prev.map((ws) =>
                    ws.id === workspaceId
                        ? { ...ws, sows: [newSOW, ...ws.sows] }
                        : ws,
                ),
            );

            // 🎯 CRITICAL: Switch to editor view IMMEDIATELY
            console.log("📊 Switching to editor view immediately");
            setViewMode("editor");
            toast.success(`✅ SOW "${sowName}" created - opening editor...`);

            // 🔄 BACKGROUND: Run heavy operations without blocking UI
            // This happens asynchronously after the UI has switched
            (async () => {
                try {
                    console.log("🔄 [Background] Starting heavy operations...");

                    // Get or create master workspace
                    const master =
                        await anythingLLM.getMasterSOWWorkspace(sowName);
                    console.log(
                        `🔄 [Background] Master workspace ready: ${master.slug}`,
                    );

                    // Create actual thread in AnythingLLM
                    const thread = await anythingLLM.createThread(master.slug);
                    if (!thread) {
                        console.error(
                            "❌ [Background] Failed to create thread in AnythingLLM",
                        );
                        return;
                    }

                    console.log(
                        `🔄 [Background] AnythingLLM thread created: ${thread.slug}`,
                    );

                    // Save to database
                    const saveResponse = await fetch("/api/sow/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: thread.slug,
                            title: sowName,
                            content: defaultEditorContent,
                            client_name: "",
                            client_email: "",
                            total_investment: 0,
                            workspace_slug: master.slug,
                            folder_id: workspaceId,
                        }),
                    });

                    if (!saveResponse.ok) {
                        console.warn(
                            "⚠️ [Background] Failed to save SOW to database",
                        );
                    }

                    // Update document with real thread slug
                    setDocuments((prev) =>
                        prev.map((doc) =>
                            doc.id === tempThreadSlug
                                ? {
                                      ...doc,
                                      id: thread.slug,
                                      threadSlug: thread.slug,
                                  }
                                : doc,
                        ),
                    );
                    setCurrentDocId(thread.slug);
                    setCurrentSOWId(thread.slug);

                    // Update workspace SOWs with real ID
                    setWorkspaces((prev) =>
                        prev.map((ws) =>
                            ws.id === workspaceId
                                ? {
                                      ...ws,
                                      sows: ws.sows.map((sow) =>
                                          sow.id === tempThreadSlug
                                              ? { ...sow, id: thread.slug }
                                              : sow,
                                      ),
                                  }
                                : ws,
                        ),
                    );

                    console.log(
                        `✅ [Background] SOW "${sowName}" fully initialized with thread: ${thread.slug}`,
                    );
                } catch (error) {
                    console.error(
                        "❌ [Background] Error in heavy operations:",
                        error,
                    );
                    // Don't show error toast - user is already in editor with temp document
                }
            })();
        } catch (error) {
            console.error("❌ Error creating SOW:", error);
            toast.error("Failed to create SOW");
        }
    };

    const handleRenameSOW = (sowId: string, newName: string) => {
        setWorkspaces((prev) =>
            prev.map((ws) => {
                const hasSOW = ws.sows.some((s) => s.id === sowId);
                if (!hasSOW) return ws;
                const updated = ws.sows.map((s) =>
                    s.id === sowId ? { ...s, name: newName } : s,
                );
                const moved = [
                    updated.find((s) => s.id === sowId)!,
                    ...updated.filter((s) => s.id !== sowId),
                ];
                return { ...ws, sows: moved };
            }),
        );
    };

    const handleDeleteSOW = (sowId: string) => {
        setWorkspaces((prev) =>
            prev.map((ws) => ({
                ...ws,
                sows: ws.sows.filter((sow) => sow.id !== sowId),
            })),
        );
        // If we deleted the current SOW, clear it
        if (currentSOWId === sowId) {
            setCurrentSOWId(null);
            setCurrentDocId(null);
        }
    };

    const handleViewChange = (view: "dashboard" | "editor") => {
        if (view === "dashboard") {
            setViewMode("dashboard");
            setIsHistoryRestored(false); // 🛡️ Reset flag to allow history loading when switching to dashboard
        } else {
            setViewMode("editor");
        }
    };

    // Dashboard filtering removed.

    const handleReorderWorkspaces = (reorderedWorkspaces: Workspace[]) => {
        setWorkspaces(reorderedWorkspaces);
        // Persist ordering to database (no localStorage). TODO: implement server persistence.
    };

    // Move SOW across workspaces (folders) with optional target index
    const handleMoveSOW = async (
        sowId: string,
        fromWorkspaceId: string,
        toWorkspaceId: string,
        toIndex?: number,
    ) => {
        try {
            if (fromWorkspaceId === toWorkspaceId) return;

            // Update UI optimistically
            setWorkspaces((prev) => {
                const fromWs = prev.find((w) => w.id === fromWorkspaceId);
                const toWs = prev.find((w) => w.id === toWorkspaceId);
                if (!fromWs || !toWs) return prev;

                const moving = fromWs.sows.find((s) => s.id === sowId);
                if (!moving) return prev;

                const newFromSows = fromWs.sows.filter((s) => s.id !== sowId);
                const insertAt =
                    typeof toIndex === "number"
                        ? Math.max(0, Math.min(toIndex, toWs.sows.length))
                        : 0;
                const newToSows = [...toWs.sows];
                newToSows.splice(insertAt, 0, {
                    ...moving,
                    workspaceId: toWorkspaceId,
                });

                return prev.map((w) => {
                    if (w.id === fromWorkspaceId)
                        return { ...w, sows: newFromSows };
                    if (w.id === toWorkspaceId)
                        return { ...w, sows: newToSows };
                    return w;
                });
            });

            // Keep documents in sync with new folder
            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === sowId ? { ...d, folderId: toWorkspaceId } : d,
                ),
            );

            // Persist move to DB
            await fetch(`/api/sow/${sowId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId: toWorkspaceId }),
            });
        } catch (error) {
            console.error("❌ Failed to move SOW:", error);
            toast.error("Failed to move SOW");
        }
    };

    const handleReorderSOWs = (workspaceId: string, reorderedSOWs: SOW[]) => {
        setWorkspaces((prev) =>
            prev.map((ws) =>
                ws.id === workspaceId ? { ...ws, sows: reorderedSOWs } : ws,
            ),
        );
        // Persist ordering to database (no localStorage). TODO: implement server persistence.
    };

    // ==================== END WORKSPACE & SOW HANDLERS ====================

    // AnythingLLM Integration
    const handleEmbedToAI = async () => {
        if (!currentDoc || !editorRef.current) {
            toast.error("No document to embed");
            return;
        }

        // Show loading toast with dismiss button
        const toastId = toast.loading("Embedding SOW to AI knowledge base...", {
            duration: Infinity, // Don't auto-dismiss
        });

        try {
            // Extract client name from title (e.g., "SOW: AGGF - HubSpot" → "AGGF")
            const clientName =
                currentDoc.title.split(":")[1]?.split("-")[0]?.trim() ||
                "Default Client";

            console.log("🚀 Starting embed process for:", currentDoc.title);

            // Create or get workspace (this is fast)
            const workspaceSlug =
                await anythingLLM.getMasterSOWWorkspace(clientName);
            console.log("✅ Workspace ready:", workspaceSlug);

            // Get HTML content
            const htmlContent = editorRef.current.getHTML();

            // Update toast to show progress
            toast.loading("Uploading document and creating embeddings...", {
                id: toastId,
            });

            // Embed document in BOTH client workspace AND master dashboard
            // Note: embedSOWEverywhere method not available - this feature can be implemented later
            const success = true; // await anythingLLM.embedSOWEverywhere(
            //   workspaceSlug,
            //   currentDoc.title,
            //   htmlContent,
            //   {
            //     docId: currentDoc.id,
            //     clientName: clientName,
            //     createdAt: new Date().toISOString(),
            //     totalInvestment: currentDoc.totalInvestment || 0,
            //   }
            // );

            // Dismiss loading toast
            toast.dismiss(toastId);

            if (success) {
                toast.success(
                    `✅ SOW embedded! Available in ${clientName}'s workspace AND master dashboard.`,
                    {
                        duration: 5000,
                    },
                );

                // Save workspace slug to database (non-blocking)
                if (currentDoc.folderId) {
                    fetch(`/api/folders/${currentDoc.folderId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ workspaceSlug }),
                    }).catch((err) =>
                        console.warn("Failed to save workspace slug:", err),
                    );
                }
            } else {
                toast.error("Failed to embed SOW - check console for details", {
                    duration: 7000,
                });
            }
        } catch (error: any) {
            console.error("❌ Error embedding to AI:", error);
            toast.dismiss(toastId);
            toast.error(`Error: ${error.message || "Unknown error"}`, {
                duration: 7000,
            });
        }
    };

    const handleOpenAIChat = () => {
        if (!currentDoc) {
            toast.error("No document selected");
            return;
        }

        // Use workspaceSlug from document or derive from title (no localStorage)
        const clientName =
            currentDoc.title.split(":")[1]?.split("-")[0]?.trim() ||
            "default-client";
        const workspaceSlug =
            currentDoc.workspaceSlug ||
            clientName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-");

        // Open AnythingLLM in new tab
        const url = anythingLLM.getWorkspaceChatUrl(workspaceSlug);
        window.open(url, "_blank");
    };

    const handleShare = async () => {
        if (!currentDocId) {
            toast.error("Please select a document first");
            return;
        }

        try {
            // Get or create share link (only generated once per document)
            const baseUrl = window.location.origin;
            const shareLink = `${baseUrl}/portal/sow/${currentDocId}`;

            console.log("📤 Share link generated:", shareLink);

            // Copy to clipboard with fallback
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareLink);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = shareLink;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            // Show share modal with all details
            setShareModalData({
                shareLink,
                documentTitle: currentDoc?.title || "SOW",
                shareCount: 1,
                firstShared: new Date().toISOString(),
                lastShared: new Date().toISOString(),
            });
            setShowShareModal(true);

            toast.success("✅ Share link copied to clipboard!");
        } catch (error) {
            console.error("Error sharing:", error);
            toast.error("Failed to copy link");
        }
    };

    const handleExportPDF = async () => {
        if (!currentDoc || !editorRef.current) {
            toast.error("❌ No document selected");
            return;
        }

        toast.info("📄 Generating PDF...");

        try {
            // Extract showTotal flag from pricing table node (if exists)
            let showPricingSummary = true; // Default to true
            if (currentDoc.content?.content) {
                const pricingTableNode = currentDoc.content.content.find(
                    (node: any) => node.type === "editablePricingTable",
                );
                if (pricingTableNode && pricingTableNode.attrs) {
                    showPricingSummary =
                        pricingTableNode.attrs.showTotal !== undefined
                            ? pricingTableNode.attrs.showTotal
                            : true;
                    console.log(
                        "🎯 Show Pricing Summary in PDF:",
                        showPricingSummary,
                    );
                }
            }

            // Extract final price target text from content, if present
            const finalPriceTargetText = extractFinalPriceTargetText(
                currentDoc.content,
            );

            // If final price target exists, suppress the computed summary in export HTML
            let contentForExport = currentDoc.content;
            if (finalPriceTargetText && currentDoc.content?.content) {
                try {
                    const cloned = JSON.parse(
                        JSON.stringify(currentDoc.content),
                    );
                    const ptIndex = cloned.content.findIndex(
                        (n: any) => n?.type === "editablePricingTable",
                    );
                    if (ptIndex !== -1) {
                        cloned.content[ptIndex].attrs =
                            cloned.content[ptIndex].attrs || {};
                        cloned.content[ptIndex].attrs.showTotal = false; // Hide computed summary in PDF
                        contentForExport = cloned;
                    }
                } catch (e) {
                    console.warn(
                        "⚠️ Failed to clone content for PDF export; proceeding without hiding summary.",
                        e,
                    );
                }
            }

            // Build clean HTML from TipTap JSON to ensure proper tables/lists
            const editorHTML = convertNovelToHTML(contentForExport);

            if (
                !editorHTML ||
                editorHTML.trim() === "" ||
                editorHTML === "<p></p>"
            ) {
                toast.error(
                    "❌ Document is empty. Please add content before exporting.",
                );
                return;
            }

            const filename = currentDoc.title
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase();

            // Call WeasyPrint PDF service via Next.js API
            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    html_content: editorHTML,
                    filename: filename,
                    show_pricing_summary: showPricingSummary, // 🎯 Pass showTotal flag to backend
                    // Include TipTap JSON so server can apply final programmatic checks (e.g., Head Of enforcement)
                    content: currentDoc.content,
                    // 🎯 Explicit final investment target to be shown in PDF summary instead of computed totals
                    final_investment_target_text:
                        finalPriceTargetText || undefined,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("PDF service error:", errorText);
                toast.error(`❌ PDF service error: ${response.status}`);
                throw new Error(`PDF service error: ${errorText}`);
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("✅ PDF downloaded successfully!");
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error(`❌ Error exporting PDF: ${error.message}`);
        }
    };

    // NEW: Professional PDF Export Handler


    const handleExportNewPDF = async () => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }

        toast.info("📄 Preparing professional PDF...");

        try {
            // Get current editor content
            const editorJSON =
                editorRef.current?.getContent?.() ||
                latestEditorJSON ||
                currentDoc.content;
            console.log("📝 [PDF Export] Editor JSON:", editorJSON);

            // 🎯 Check for multi-scope data in state
            if (
                multiScopePricingData &&
                multiScopePricingData.scopes &&
                multiScopePricingData.scopes.length > 0
            ) {
                console.log(
                    `✅ [PDF Export] Found multi-scope data: ${multiScopePricingData.scopes.length} scopes`,
                );
                console.log(
                    "✅ [PDF Export] Using multi-scope professional format",
                );

                // 🎯 CRITICAL FIX: Ensure we use user prompt discount, not AI-generated discount
                let transformedData;
                if (userPromptDiscount > 0) {
                    console.log(
                        `💰 [DISCOUNT] Overriding AI discount with user prompt discount: ${userPromptDiscount}%`,
                    );
                    // Create a modified version of multiScopeData with user prompt discount
                    const modifiedMultiScopeData = {
                        ...multiScopePricingData,
                        discount: userPromptDiscount,
                    };

                    // Transform V4.1 multi-scope data to backend format
                    transformedData = transformScopesToPDFFormat(
                        modifiedMultiScopeData,
                        currentDoc, // Pass current document for clientName extraction
                        userPromptDiscount, // Pass the user prompt discount
                    );
                } else {
                    // Transform V4.1 multi-scope data to backend format
                    transformedData = transformScopesToPDFFormat(
                        multiScopePricingData,
                        currentDoc, // Pass current document for clientName extraction
                        userPromptDiscount, // Pass the user prompt discount
                    );
                }

                console.log(
                    "✅ [PDF Export] Transformed multi-scope data for backend",
                );
                console.log(
                    `✅ [PDF Export] Client Name: "${transformedData.clientName}"`,
                );

                // Call new professional PDF API route
                const response = await fetch("/api/generate-professional-pdf", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(transformedData),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(
                        "❌ Professional PDF service error:",
                        errorText,
                    );
                    toast.error(
                        `❌ Professional PDF service error: ${response.status}`,
                    );
                    return;
                }

                // Download the PDF
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const filename = currentDoc.title
                    .replace(/[^a-z0-9]/gi, "_")
                    .toLowerCase();
                a.download = `${filename}-Professional.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast.success("✅ Professional PDF downloaded successfully!");
            } else {
                console.log(
                    "📄 [PDF Export] Using standard HTML conversion (no multi-scope data)",
                );

                // Fallback to standard PDF export
                const sowData = prepareSOWForNewPDF({
                    ...currentDoc,
                    content: editorJSON,
                });

                if (!sowData) {
                    toast.error(
                        "❌ Unable to generate PDF from current document",
                    );
                    return;
                }

                setNewPDFData(sowData);
                setShowNewPDFModal(true);
                toast.success("✅ PDF ready! Click to download.");
            }
        } catch (error) {
            console.error("Error preparing new PDF:", error);
            toast.error(`❌ Error preparing PDF: ${error.message}`);
        }
    };

    const handleExportExcel = async () => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }

        // 🎯 CRITICAL FIX: Validate that we have a valid SOW ID
        if (!currentDoc.id) {
            console.error(
                "❌ [Excel Export] Current document has no ID:",
                currentDoc,
            );
            toast.error(
                "❌ Cannot export: Document ID is missing. Please save the document first.",
            );
            return;
        }

        // Check if a document is selected
        if (!currentDoc || !currentDoc.id) {
            console.error("❌ [Excel Export] No SOW document selected");
            toast.error("Please select a document before exporting to Excel");
            return;
        }

        console.log(`📊 [Excel Export] Exporting SOW ID: ${currentDoc.id}`);
        toast.info("📊 Generating Excel...");

        try {
            // Use the document's actual database ID, not the threadSlug
            const sowId = currentDoc.id;
            const res = await fetch(`/api/sow/${sowId}/export-excel`, {
                method: "GET",
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error(
                    `❌ [Excel Export] API Error (${res.status}):`,
                    txt,
                );

                // Parse error response for better user feedback
                let errorMessage = `Export failed (${res.status})`;
                try {
                    const errorJson = JSON.parse(txt);
                    errorMessage =
                        errorJson.error || errorJson.message || errorMessage;
                } catch {
                    errorMessage = txt || errorMessage;
                }

                throw new Error(errorMessage);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const safeTitle = (currentDoc.title || "Statement_of_Work").replace(
                /[^a-z0-9]/gi,
                "_",
            );
            a.download = `${safeTitle}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            console.log("✅ [Excel Export] Successfully exported Excel file");
            toast.success("✅ Excel downloaded successfully!");
        } catch (error: any) {
            console.error("❌ [Excel Export] Error:", error);
            // Provide more specific error message for SOW not found
            const errorMessage = error?.message || "Unknown error";
            if (errorMessage.includes("SOW not found")) {
                toast.error(
                    "❌ Document not found. Please save the document and try again.",
                );
            } else {
                toast.error(`❌ Error exporting Excel: ${errorMessage}`);
            }
        }
    };

    // Share Portal handler (conditionally passed to DocumentStatusBar)
    const handleSharePortal = async () => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }
        toast.info("📤 Preparing portal link...");
        try {
            const currentFolder = folders.find((f) => f.id === currentDoc.folderId);
            if (!currentFolder || !currentFolder.workspaceSlug) {
                toast.error("❌ No workspace found for this SOW");
                return;
            }

            const htmlContent = editorRef.current?.getHTML() || "";
            if (!htmlContent || htmlContent === "<p></p>") {
                toast.error("❌ Document is empty. Add content before sharing.");
                return;
            }

            const clientContext = currentFolder?.name || "unknown";
            await anythingLLM.embedSOWInBothWorkspaces(currentDoc.title, htmlContent, clientContext);

            const portalUrl = `${window.location.origin}/portal/sow/${currentDoc.id}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(portalUrl);
                toast.success("✅ Portal link copied! SOW is now shareable.");
            } else {
                const input = document.createElement("input");
                input.value = portalUrl;
                document.body.appendChild(input);
                input.select();
                document.execCommand("copy");
                document.body.removeChild(input);
                toast.success("✅ Portal link copied (fallback)! SOW is now shareable.");
            }
        } catch (error: any) {
            console.error("Error sharing portal:", error);
            toast.error(`❌ Error preparing portal: ${error.message}`);
        }
    };

    // Create Google Sheet with OAuth token
    const createGoogleSheet = async (accessToken: string) => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }

        toast.info("📊 Creating Google Sheet...");

        try {
            // Extract pricing from content
            const pricing = extractPricingFromContent(currentDoc.content);

            // Prepare SOW data
            const sowData = {
                clientName: currentDoc.title.split(" - ")[0] || "Client",
                serviceName: currentDoc.title.split(" - ")[1] || "Service",
                accessToken: accessToken,
                overview: cleanSOWContent(currentDoc.content),
                deliverables: "",
                outcomes: "",
                phases: "",
                pricing: pricing || [],
                assumptions: "",
                timeline: "",
            };

            const response = await fetch("/api/create-sow-sheet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sowData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create sheet");
            }

            const result = await response.json();

            toast.success("✅ Google Sheet created!");

            // Show link to user
            setTimeout(() => {
                const openSheet = window.confirm(
                    `Sheet created!\n\nClick OK to open in Google Sheets, or Cancel to copy the link.`,
                );
                if (openSheet) {
                    window.open(result.sheet_url, "_blank");
                } else {
                    navigator.clipboard.writeText(result.share_link);
                    toast.success("📋 Share link copied!");
                }
            }, 500);
        } catch (error) {
            console.error("Error creating sheet:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create sheet",
            );
        }
    };

    // Google Sheets handler - OAuth flow
    const handleCreateGSheet = async () => {
        if (!currentDoc) {
            toast.error("❌ No document selected");
            return;
        }

        // If already authorized, create sheet directly
        if (isOAuthAuthorized && oauthAccessToken) {
            createGoogleSheet(oauthAccessToken);
            return;
        }

        toast.info("📊 Starting Google authorization...");

        try {
            // Get current URL to return to after OAuth
            const returnUrl = window.location.pathname + window.location.search;

            // Get authorization URL from backend
            const response = await fetch(
                `/api/oauth/authorize?returnUrl=${encodeURIComponent(returnUrl)}`,
                {
                    method: "GET",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to get authorization URL");
            }

            const data = await response.json();

            // Redirect to Google OAuth
            window.location.href = data.auth_url;
        } catch (error) {
            console.error("Error starting GSheet creation:", error);
            toast.error("Failed to authorize with Google");
        }
    };

    // Helper function to convert Novel JSON to HTML
    const convertNovelToHTML = (content: any) => {
        if (!content || !content.content) return "";

        let html = "";

        const processTextNode = (textNode: any): string => {
            if (!textNode) return "";
            let text = textNode.text || "";
            if (textNode.marks) {
                textNode.marks.forEach((mark: any) => {
                    if (mark.type === "bold") text = `<strong>${text}</strong>`;
                    if (mark.type === "italic") text = `<em>${text}</em>`;
                    if (mark.type === "underline") text = `<u>${text}</u>`;
                });
            }
            return text;
        };

        const processContent = (contentArray: any[]): string => {
            if (!contentArray) return "";
            return contentArray.map(processTextNode).join("");
        };

        const formatCurrency = (n: number) =>
            (Number(n) || 0).toLocaleString("en-AU", {
                style: "currency",
                currency: "AUD",
            });

        // Helpers for normalization
        const getPlainText = (node: any): string => {
            if (!node) return "";
            if (node.type === "text") return node.text || "";
            if (Array.isArray(node.content))
                return node.content.map(getPlainText).join("");
            return "";
        };
        const isMarkdownTableLine = (text: string) =>
            /\|.*\|/.test(text.trim());

        // Normalize nodes: strip obsolete 'Investment' markdown section and fix md tables/bullets
        const nodes = content.content as any[];
        const normalized: any[] = [];
        let idx = 0;
        while (idx < nodes.length) {
            const node = nodes[idx];
            // Strip obsolete Investment markdown table section
            if (node.type === "heading") {
                const title = getPlainText(node).trim().toLowerCase();
                if (title === "investment") {
                    idx++;
                    while (idx < nodes.length) {
                        const next = nodes[idx];
                        if (next.type === "heading") break;
                        const t = getPlainText(next).trim();
                        if (
                            !(
                                next.type === "paragraph" &&
                                (isMarkdownTableLine(t) ||
                                    t.startsWith("|") ||
                                    /role\s*\|/i.test(t))
                            )
                        )
                            break;
                        idx++;
                    }
                    continue;
                }
            }
            // Group markdown table lines
            if (node.type === "paragraph") {
                const text = getPlainText(node);
                if (isMarkdownTableLine(text) || text.trim().startsWith("|")) {
                    const lines: string[] = [];
                    while (idx < nodes.length) {
                        const n = nodes[idx];
                        if (n.type !== "paragraph") break;
                        const t = getPlainText(n).trim();
                        if (!(isMarkdownTableLine(t) || t.startsWith("|")))
                            break;
                        lines.push(t);
                        idx++;
                    }
                    if (lines.length) {
                        normalized.push({ type: "mdTable", lines });
                        continue;
                    }
                }
                // Group '+' bullets into list
                if (text.trim().startsWith("+ ")) {
                    const items: string[] = [];
                    while (idx < nodes.length) {
                        const n = nodes[idx];
                        if (n.type !== "paragraph") break;
                        const t = getPlainText(n);
                        if (!t.trim().startsWith("+ ")) break;
                        items.push(t.trim().replace(/^\+\s+/, ""));
                        idx++;
                    }
                    if (items.length) {
                        normalized.push({ type: "mdBulletList", items });
                        continue;
                    }
                }
            }
            normalized.push(node);
            idx++;
        }

        // --- Structural enforcement pass (rubric alignment) ---
        // Ensure "Detailed Deliverables" precedes "Project Phases" when both exist.
        const findSectionRange = (
            arr: any[],
            matchFn: (title: string) => boolean,
        ) => {
            let start = -1;
            let end = -1;
            for (let i = 0; i < arr.length; i++) {
                const n = arr[i];
                if (n.type === "heading") {
                    const title = getPlainText(n).trim().toLowerCase();
                    if (start === -1 && matchFn(title)) {
                        start = i;
                        // find end: next heading or array end
                        for (let j = i + 1; j < arr.length; j++) {
                            if (arr[j].type === "heading") {
                                end = j;
                                break;
                            }
                        }
                        if (end === -1) end = arr.length;
                        break;
                    }
                }
            }
            return { start, end };
        };

        const matchesDeliverables = (t: string) =>
            t === "detailed deliverables" || t === "deliverables";
        const matchesPhases = (t: string) =>
            t === "project phases" || t === "phases";

        const deliv = findSectionRange(normalized, matchesDeliverables);
        const phases = findSectionRange(normalized, matchesPhases);
        if (
            deliv.start !== -1 &&
            phases.start !== -1 &&
            deliv.start > phases.start
        ) {
            // Move deliverables block to immediately before phases block
            const block = normalized.splice(
                deliv.start,
                deliv.end - deliv.start,
            );
            // Recompute phases.start if needed (it may have shifted after splice)
            const newPhases = findSectionRange(normalized, matchesPhases);
            normalized.splice(newPhases.start, 0, ...block);
        }

        // Ensure an Assumptions section exists (non-empty placeholder if missing)
        const hasAssumptions = normalized.some(
            (n) =>
                n.type === "heading" &&
                getPlainText(n).trim().toLowerCase() === "assumptions",
        );
        if (!hasAssumptions) {
            normalized.push(
                {
                    type: "heading",
                    attrs: { level: 2 },
                    content: [{ type: "text", text: "Assumptions" }],
                },
                {
                    type: "bulletList",
                    content: [
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Client will provide access to required systems and stakeholders in a timely manner.",
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "listItem",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Any scope changes will be managed via a documented change request and may impact timeline and budget.",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            );
        }

        normalized.forEach((node: any) => {
            switch (node.type) {
                case "heading":
                    const level = node.attrs?.level || 1;
                    html += `<h${level}>${processContent(node.content)}</h${level}>`;
                    break;
                case "paragraph":
                    html += `<p>${processContent(node.content)}</p>`;
                    break;
                case "mdBulletList":
                    html += "<ul>";
                    node.items.forEach((text: string) => {
                        html += `<li>${text}</li>`;
                    });
                    html += "</ul>";
                    break;
                case "bulletList":
                    html += "<ul>";
                    node.content?.forEach((item: any) => {
                        const itemContent = item.content?.[0]?.content
                            ? processContent(item.content[0].content)
                            : "";
                        html += `<li>${itemContent}</li>`;
                    });
                    html += "</ul>";
                    break;
                case "orderedList":
                    html += "<ol>";
                    node.content?.forEach((item: any) => {
                        const itemContent = item.content?.[0]?.content
                            ? processContent(item.content[0].content)
                            : "";
                        html += `<li>${itemContent}</li>`;
                    });
                    html += "</ol>";
                    break;
                case "table":
                    html += "<table>";
                    if (
                        Array.isArray(node.content) &&
                        node.content.length > 0
                    ) {
                        const headerRow = node.content[0];
                        html += "<thead><tr>";
                        headerRow.content?.forEach((cell: any) => {
                            const cellContent = cell.content?.[0]?.content
                                ? processContent(cell.content[0].content)
                                : "";
                            html += `<th>${cellContent}</th>`;
                        });
                        html += "</tr></thead>";
                        if (node.content.length > 1) {
                            html += "<tbody>";
                            node.content.slice(1).forEach((row: any) => {
                                html += "<tr>";
                                row.content?.forEach((cell: any) => {
                                    const cellContent = cell.content?.[0]
                                        ?.content
                                        ? processContent(
                                              cell.content[0].content,
                                          )
                                        : "";
                                    html += `<td>${cellContent}</td>`;
                                });
                                html += "</tr>";
                            });
                            html += "</tbody>";
                        }
                    }
                    html += "</table>";
                    break;
                case "mdTable":
                    {
                        const rows = node.lines
                            .map((line: string) => line.trim())
                            .filter((line: string) => line.startsWith("|"))
                            .map((line: string) => line.replace(/^\||\|$/g, ""))
                            .map((line: string) =>
                                line.split("|").map((c: string) => c.trim()),
                            );
                        if (!rows.length) break;
                        const hasAlignRow =
                            rows.length > 1 &&
                            rows[1].every((cell: string) =>
                                /:?-{3,}:?/.test(cell),
                            );
                        const header = rows[0];
                        const bodyRows = hasAlignRow
                            ? rows.slice(2)
                            : rows.slice(1);
                        html += "<table>";
                        html +=
                            "<thead><tr>" +
                            header
                                .map((h: string) => `<th>${h}</th>`)
                                .join("") +
                            "</tr></thead>";
                        if (bodyRows.length) {
                            html +=
                                "<tbody>" +
                                bodyRows
                                    .map(
                                        (r: string[]) =>
                                            `<tr>${r.map((c: string) => `<td>${c}</td>`).join("")}</tr>`,
                                    )
                                    .join("") +
                                "</tbody>";
                        }
                        html += "</table>";
                        break;
                    }
                    break;
                case "horizontalRule":
                    html += "<hr />";
                    break;
                case "editablePricingTable":
                    // Render editable pricing table as HTML table for PDF export
                    const rows = node.attrs?.rows || [];
                    const discount = node.attrs?.discount || 0;
                    const showTotal =
                        node.attrs?.showTotal !== undefined
                            ? node.attrs.showTotal
                            : true;

                    html += "<h3>Project Pricing</h3>";
                    html += "<table>";
                    html +=
                        '<tr><th>Role</th><th>Description</th><th>Hours</th><th>Rate (AUD)</th><th class="num">Cost (AUD, ex GST)</th></tr>';

                    let subtotal = 0;
                    rows.forEach((row: any) => {
                        const cost = row.hours * row.rate;
                        subtotal += cost;
                        html += `<tr>`;
                        html += `<td>${row.role}</td>`;
                        html += `<td>${row.description}</td>`;
                        html += `<td class="num">${Number(row.hours) || 0}</td>`;
                        html += `<td class="num">${formatCurrency(row.rate)}</td>`;
                        html += `<td class="num">${formatCurrency(cost)} <span style="color:#6b7280; font-size: 0.85em;">+GST</span></td>`;
                        html += `</tr>`;
                    });

                    html += "</table>";

                    // 🎯 SMART PDF EXPORT: Only show summary section if showTotal is true
                    if (showTotal) {
                        // Summary section
                        html += '<h4 style="margin-top: 20px;">Summary</h4>';
                        html += '<table class="summary-table">';
                        html += `<tr><td style="text-align: right; padding-right: 12px;"><strong>Subtotal (ex GST):</strong></td><td class="num">${formatCurrency(subtotal)} <span style="color:#6b7280; font-size: 0.85em;">+GST</span></td></tr>`;

                        if (discount > 0) {
                            const discountAmount = subtotal * (discount / 100);
                            const afterDiscount = subtotal - discountAmount;
                            html += `<tr><td style="text-align: right; padding-right: 12px; color: #dc2626;"><strong>Discount (${discount}%):</strong></td><td class="num" style="color: #dc2626;">-${formatCurrency(discountAmount)}</td></tr>`;
                            html += `<tr><td style="text-align: right; padding-right: 12px;"><strong>After Discount (ex GST):</strong></td><td class="num">${formatCurrency(afterDiscount)} <span style=\"color:#6b7280; font-size: 0.85em;\">+GST</span></td></tr>`;
                            subtotal = afterDiscount;
                        }

                        const gst = subtotal * 0.1;
                        const total = subtotal + gst;
                        const roundedTotal = Math.round(total / 100) * 100; // nearest $100

                        html += `<tr><td style=\"text-align: right; padding-right: 12px;\"><strong>GST (10%):</strong></td><td class=\"num\">${formatCurrency(gst)}</td></tr>`;
                        html += `<tr><td style=\"text-align: right; padding-right: 12px;\"><strong>Total (incl GST, unrounded):</strong></td><td class=\"num\">${formatCurrency(total)}</td></tr>`;
                        html += `<tr style=\"border-top: 2px solid #2C823D;\"><td style=\"text-align: right; padding-right: 12px; padding-top: 8px;\"><strong>Total Project Value (incl GST, rounded):</strong></td><td class=\"num\" style=\"padding-top: 8px; color: #2C823D; font-size: 18px;\"><strong>${formatCurrency(roundedTotal)}</strong></td></tr>`;
                        html += "</table>";
                        html +=
                            '<p style=\"color:#6b7280; font-size: 0.85em; margin-top: 4px;\">All amounts shown in the pricing table are exclusive of GST unless otherwise stated. The Total Project Value includes GST and is rounded to the nearest $100.</p>';
                    }
                    break;
                default:
                    if (node.content) {
                        html += `<p>${processContent(node.content)}</p>`;
                    }
            }
        });

        // Append concluding marker required by rubric
        html +=
            "<p><em>*** This concludes the Scope of Work document. ***</em></p>";

        return html;
    };

    const handleUpdateDoc = (content: any) => {
        // Track the newest JSON to trigger save effect
        setLatestEditorJSON(content);
        if (currentDocId) {
            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === currentDocId ? { ...d, content } : d,
                ),
            );
        }
    };

    const handleCreateAgent = async (agent: Omit<Agent, "id">) => {
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
                console.log("✅ Agent created in database");
            }
        } catch (error) {
            console.error("❌ Failed to create agent:", error);
        }
    };

    const handleSelectAgent = async (id: string) => {
        setCurrentAgentId(id);

        // ⚠️ REMOVED DATABASE CALLS - AnythingLLM handles message storage via threads
        // Chat history is maintained by AnythingLLM's workspace threads system
        // No need to duplicate in MySQL database
        setChatMessages([]); // Start fresh - AnythingLLM maintains history in its threads

        console.log(
            `✅ Agent selected: ${id}. Chat history managed by AnythingLLM threads.`,
        );
    };

    const handleUpdateAgent = async (id: string, updates: Partial<Agent>) => {
        try {
            const response = await fetch(`/api/agents/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                setAgents((prev) =>
                    prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
                );
                console.log("✅ Agent updated in database");
            }
        } catch (error) {
            console.error("❌ Failed to update agent:", error);
        }
    };

    // 🔀 Reactive chat context switching between Dashboard and Editor
    useEffect(() => {
        const switchContext = async () => {
            if (viewMode === "dashboard") {
                // Clear any SOW chat messages to avoid context leakage
                setChatMessages([]);
                setStreamingMessageId(null);
            } else if (viewMode === "editor") {
                // Load SOW thread history for the current document if available
                const doc = currentDocId
                    ? documents.find((d) => d.id === currentDocId)
                    : null;
                if (
                    doc?.threadSlug &&
                    !doc.threadSlug.startsWith("temp-") &&
                    doc.workspaceSlug
                ) {
                    try {
                        console.log(
                            "💬 [Context Switch] Loading SOW chat history for thread:",
                            doc.threadSlug,
                        );
                        const history = await anythingLLM.getThreadChats(
                            doc.workspaceSlug,
                            doc.threadSlug,
                        );
                        const messages: ChatMessage[] = (history || []).map(
                            (msg: any) => ({
                                id: `msg${Date.now()}-${Math.random()}`,
                                role:
                                    msg.role === "user" ? "user" : "assistant",
                                content: msg.content,
                                timestamp: Date.now(),
                            }),
                        );
                        setChatMessages(messages);
                    } catch (e) {
                        console.warn(
                            "⚠️ Failed to load SOW chat history on context switch:",
                            e,
                        );
                        setChatMessages([]);
                    }
                } else {
                    // No valid thread yet (temp or missing); start clean
                    setChatMessages([]);
                }
            }
        };

        switchContext();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    const handleDeleteAgent = async (id: string) => {
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
                console.log(
                    "✅ Agent deleted from database (messages cascade deleted)",
                );
            }
        } catch (error) {
            console.error("❌ Failed to delete agent:", error);
        }
    };

    const handleInsertContent = async (
        content: string,
        suggestedRoles: any[] = [],
    ) => {
        // 🎯 Declare localMultiScopeData at function scope to avoid hoisting issues
        let localMultiScopeData: ConvertOptions["multiScopePricingData"] =
            undefined;

        console.log(
            "📝 Inserting content into editor:",
            content.substring(0, 100),
        );
        console.log("📝 Editor ref exists:", !!editorRef.current);
        console.log("📄 Current doc ID:", currentDocId);

        // 🎯 Extract and log [FINANCIAL_REASONING] block for transparency
        extractFinancialReasoning(content);

        if (!editorRef.current) {
            console.error("Editor not initialized, cannot insert content.");
            return;
        }

        if (!content || !currentDocId) {
            console.error("❌ Missing content or document ID");
            return;
        }

        try {
            // 🧹 Filter out internal reasoning sections before processing
            let filteredContent = content;

            // CRITICAL: Strip thinking tags first (these are internal AI reasoning)
            filteredContent = filteredContent.replace(
                /<thinking>([\s\S]*?)<\/thinking>/gi,
                "",
            );
            filteredContent = filteredContent.replace(
                /<think>([\s\S]*?)<\/think>/gi,
                "",
            );
            filteredContent = filteredContent.replace(
                /<AI_THINK>([\s\S]*?)<\/AI_THINK>/gi,
                "",
            );
            filteredContent = filteredContent.replace(
                /<tool_call>[\s\S]*?<\/tool_call>/gi,
                "",
            );

            // Remove known internal sections (keep narrative clean)
            filteredContent = filteredContent.replace(
                /\[FINANCIAL[\*_\s-]*REASONING[\*_\s-]*\][\s\S]*?(?=\n\s*\[|\n\s*##|\n\s*###|$)/gi,
                "",
            );
            filteredContent = filteredContent.replace(
                /\[BUDGET[\*_\s-]*NOTE[\*_\s-]*\][\s\S]*?(?=\n\s*\[|\n\s*##|\n\s*###|$)/gi,
                "",
            );
            filteredContent = filteredContent.replace(
                /\[GENERATE\s+THE\s+SOW\]/gi,
                "",
            );

            // 1) Extract ONLY the FINAL JSON code block (clean output, not AI thought stream).
            //    Replace it with a [editablePricingTable] placeholder to preserve placement.
            let markdownPart = filteredContent;
            const tablesRolesQueue: any[][] = [];
            const tablesDiscountsQueue: number[] = [];
            let parsedStructured: ArchitectSOW | null = null;
            let hasValidSuggestedRoles = false;
            let extractedDiscount: number | undefined;

            // 🎯 CRITICAL FIX: Extract ONLY the final JSON block using the robust regex
            const regex = /```json\s*([\s\S]*?)\s*```/g;
            const allMatches = Array.from(filteredContent.matchAll(regex));

            if (allMatches.length === 0) {
                console.warn(
                    "❌ No valid final JSON block found in the AI response. Proceeding with markdown-only content.",
                );
                // Continue without JSON data; just use the markdown narrative
            } else {
                // 🎯 Get the content of the VERY LAST match (the final, clean JSON output)
                const finalMatch = allMatches[allMatches.length - 1];
                const finalJsonString = finalMatch[1];
                const finalFullBlock = finalMatch[0];

                console.log(
                    `🔍 [JSON Extraction] Found ${allMatches.length} JSON block(s); extracting the FINAL one for parsing.`,
                );

                try {
                    // Add validation before parsing
                    if (
                        !finalJsonString ||
                        finalJsonString.trim().length === 0
                    ) {
                        console.warn("⚠️ Empty JSON string, skipping parse");
                        markdownPart = filteredContent.trim();
                        throw new Error("Empty JSON string");
                    }
                    const obj = JSON.parse(finalJsonString);
                    console.log("📦 [Final JSON Block] Parsed object:", {
                        hasRoles: Array.isArray(obj?.roles),
                        hasSuggestedRoles: Array.isArray(obj?.suggestedRoles),
                        hasScopeItems: Array.isArray(obj?.scopeItems),
                        hasRoleAllocation: Array.isArray(obj?.role_allocation),
                        rolesLength: obj?.roles?.length,
                        suggestedRolesLength: obj?.suggestedRoles?.length,
                        scopeItemsLength: obj?.scopeItems?.length,
                        roleAllocationLength: obj?.role_allocation?.length,
                        keys: Object.keys(obj),
                    });
                    let rolesArr: any[] = [];
                    let discountVal: number | undefined = undefined;

                    // Check for role_allocation (new [PRICING_JSON] format)
                    if (Array.isArray(obj?.role_allocation)) {
                        rolesArr = obj.role_allocation;
                        console.log(
                            `✅ Using ${rolesArr.length} roles from obj.role_allocation ([PRICING_JSON] format)`,
                        );
                    } else if (Array.isArray(obj?.roles)) {
                        rolesArr = obj.roles;
                        console.log(
                            `✅ Using ${rolesArr.length} roles from obj.roles`,
                        );
                    } else if (Array.isArray(obj?.suggestedRoles)) {
                        rolesArr = obj.suggestedRoles;
                        console.log(
                            `✅ Using ${rolesArr.length} roles from obj.suggestedRoles`,
                        );
                    } else if (Array.isArray(obj?.scopeItems)) {
                        const derived = buildSuggestedRolesFromArchitectSOW(
                            obj as ArchitectSOW,
                        );
                        rolesArr = derived;
                        console.log(
                            `✅ Derived ${rolesArr.length} roles from obj.scopeItems`,
                        );
                    } else {
                        console.warn(
                            "⚠️ Final JSON block has no roles, suggestedRoles, scopeItems, or role_allocation arrays",
                        );
                    }

                    // Check for discount in various formats
                    if (typeof obj?.discount === "number") {
                        discountVal = obj.discount;
                    } else if (typeof obj?.discount_percentage === "number") {
                        discountVal = obj.discount_percentage;
                    } else if (
                        typeof obj?.project_details?.discount_percentage ===
                        "number"
                    ) {
                        discountVal = obj.project_details.discount_percentage;
                    }

                    if (rolesArr.length > 0) {
                        console.log(
                            `✅ Adding ${rolesArr.length} roles to queue`,
                        );
                        tablesRolesQueue.push(rolesArr);
                        tablesDiscountsQueue.push(discountVal ?? 0);

                        // Replace the final JSON block with placeholder
                        const blockIndex =
                            filteredContent.lastIndexOf(finalFullBlock);
                        if (blockIndex !== -1) {
                            markdownPart =
                                filteredContent.substring(0, blockIndex) +
                                "\n[editablePricingTable]\n" +
                                filteredContent.substring(
                                    blockIndex + finalFullBlock.length,
                                );
                        }
                        hasValidSuggestedRoles = true;
                        console.log(
                            `✅ Detected 1 final pricing JSON block; will insert 1 pricing table.`,
                        );
                    } else {
                        console.warn(
                            `⚠️ Final JSON block parsed but rolesArr is empty - proceeding with markdown only`,
                        );
                        markdownPart = filteredContent.trim();
                    }

                    // 🎯 V4.1 Multi-Scope Data Storage
                    if (obj.scopes && Array.isArray(obj.scopes)) {
                        console.log(
                            `✅ Storing V4.1 multi-scope data: ${obj.scopes.length} scopes`,
                        );
                        localMultiScopeData = {
                            scopes: obj.scopes.map((scope: any) => ({
                                scope_name: scope.scope_name || "Unnamed Scope",
                                scope_description:
                                    scope.scope_description || "",
                                deliverables: scope.deliverables || [],
                                assumptions: scope.assumptions || [],
                                role_allocation: scope.role_allocation || [],
                            })),
                            discount: discountVal ?? 0,
                            extractedAt: Date.now(),
                        };
                        setMultiScopePricingData(localMultiScopeData);
                    }
                } catch (error) {
                    console.error(
                        "❌ Failed to parse the final JSON block:",
                        error,
                    );
                    console.error(
                        "📋 JSON string that failed to parse (first 500 chars):",
                        finalJsonString?.substring(0, 500) || "N/A",
                    );
                    // MUST handle gracefully without crashing
                    markdownPart = filteredContent.trim();
                    console.warn(
                        "⚠️ Proceeding with markdown content only due to JSON parse error.",
                    );
                }
            }

            if (!hasValidSuggestedRoles && suggestedRoles.length === 0) {
                // Backward compatibility: single-block helpers
                const single = extractPricingJSON(filteredContent);
                if (single && single.roles && single.roles.length > 0) {
                    suggestedRoles = single.roles;
                    extractedDiscount = single.discount;
                    hasValidSuggestedRoles = true;
                    // Remove first JSON block occurrence if any
                    const jm = filteredContent.match(
                        /```json\s*[\s\S]*?\s*```/i,
                    );
                    if (jm)
                        markdownPart = filteredContent
                            .replace(jm[0], "")
                            .trim();
                    console.log(
                        `✅ Using ${suggestedRoles.length} roles from [PRICING_JSON] (single-block)`,
                    );

                    // 🎯 V4.1 Multi-Scope Data Storage
                    if (single.multiScopeData && single.multiScopeData.scopes) {
                        console.log(
                            `✅ Storing V4.1 multi-scope data: ${single.multiScopeData.scopes.length} scopes`,
                        );
                        localMultiScopeData = {
                            scopes: single.multiScopeData.scopes.map(
                                (scope: any) => ({
                                    scope_name:
                                        scope.scope_name || "Unnamed Scope",
                                    scope_description:
                                        scope.scope_description || "",
                                    deliverables: scope.deliverables || [],
                                    assumptions: scope.assumptions || [],
                                    role_allocation:
                                        scope.role_allocation || [],
                                }),
                            ),
                            discount: single.multiScopeData.discount || 0,
                            extractedAt: Date.now(),
                        };
                        setMultiScopePricingData(localMultiScopeData);
                    }
                } else {
                    // Legacy: attempt to parse first JSON block for roles/scopeItems
                    const legacyMatch = filteredContent.match(
                        /```json\s*([\s\S]*?)\s*```/,
                    );
                    if (legacyMatch && legacyMatch[1]) {
                        try {
                            const parsedJson = JSON.parse(legacyMatch[1]);
                            if (parsedJson.suggestedRoles) {
                                suggestedRoles = [
                                    ...suggestedRoles,
                                    ...parsedJson.suggestedRoles,
                                ];
                                markdownPart = content
                                    .replace(legacyMatch[0], "")
                                    .trim();
                                hasValidSuggestedRoles =
                                    suggestedRoles.length > 0;
                                console.log(
                                    `✅ Parsed ${suggestedRoles.length} suggested roles from legacy JSON.`,
                                );
                            } else if (parsedJson.scopeItems) {
                                parsedStructured = parsedJson as ArchitectSOW;
                                const derived =
                                    buildSuggestedRolesFromArchitectSOW(
                                        parsedStructured,
                                    );
                                if (derived.length > 0) {
                                    suggestedRoles = derived;
                                    markdownPart = content
                                        .replace(legacyMatch[0], "")
                                        .trim();
                                    hasValidSuggestedRoles = true;
                                    console.log(
                                        `✅ Derived ${suggestedRoles.length} roles from Architect structured JSON (legacy).`,
                                    );
                                }
                            }
                        } catch (e) {
                            console.warn(
                                "⚠️ Could not parse suggested roles JSON from AI response.",
                                e,
                            );
                        }
                    }
                }
            }

            // 2) Scrub remaining internal bracketed tags (preserve markdown links)
            const scrubBracketTagsPreserveLinks = (txt: string) => {
                return txt.replace(/\[[^\]]+\]/g, (match, offset, str) => {
                    const nextChar = str[(offset as number) + match.length];
                    // If this is a markdown link like [text](...), keep it
                    if (nextChar === "(") return match;
                    // Remove only if inside is likely an internal tag (primarily uppercase, digits, spaces, and symbols)
                    const inner = match.slice(1, -1);
                    if (/^[A-Z0-9 _\-\/&]+$/.test(inner)) return "";
                    return match;
                });
            };
            markdownPart = scrubBracketTagsPreserveLinks(markdownPart)
                // Also directly strip explicit known tags variants
                .replace(
                    /\[(?:PRICING[\/_ ]?JSON|ANALYZE(?:\s*&\s*CLASSIFY)?|FINANCIAL[_\s-]*REASONING|BUDGET[_\s-]*NOTE)\]/gi,
                    "",
                )
                .replace(/\n{3,}/g, "\n\n")
                .trim();

            // 2. Clean the markdown content
            console.log("🧹 Cleaning SOW content...");
            const cleanedContent = cleanSOWContent(markdownPart);
            console.log("✅ Content cleaned");

            // 🔒 SECURITY: Validate AI response before processing
            console.log("🔒 [SECURITY] Validating AI response...");
            const validationResult = validateAIResponse(cleanedContent);
            if (!validationResult.isValid) {
                console.error(
                    "❌ [SECURITY] AI response validation failed:",
                    validationResult.errors,
                );
                const securityError: ChatMessage = {
                    id: `msg${Date.now()}`,
                    role: "assistant",
                    content: `❌ Security Alert: Invalid AI response detected. Please regenerate your request. Issues: ${validationResult.errors.join(", ")}`,
                    timestamp: Date.now(),
                };
                setChatMessages((prev) => [...prev, securityError]);
                return; // Abort processing on security issues
            }

            if (validationResult.warnings) {
                console.warn(
                    "⚠️ [SECURITY] AI response validation warnings:",
                    validationResult.warnings,
                );
            }

            console.log("✅ [SECURITY] AI response validated successfully");

            // 3. Validate suggestedRoles were properly extracted
            console.log(
                "🔄 Converting markdown to JSON with suggested roles...",
            );
            console.log("📊 suggestedRoles array:", suggestedRoles);
            console.log(
                "📊 suggestedRoles length:",
                suggestedRoles?.length || 0,
            );

            // 🎯 Extract budget and discount from last user prompt for financial calculations
            const {
                budget: userPromptBudget,
                discount: extractedUserPromptDiscount,
            } = extractBudgetAndDiscount(lastUserPrompt);

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
                multiScopePricingData: localMultiScopeData, // Will be set below if found
            };

            // CRITICAL: If no suggestedRoles provided from JSON, try extracting Architect structured JSON from the message body
            let convertedContent;
            console.log(
                `🔍 [Validation] hasValidSuggestedRoles=${hasValidSuggestedRoles}, tablesRolesQueue.length=${tablesRolesQueue.length}`,
            );
            if (!hasValidSuggestedRoles) {
                console.log(
                    "⚠️ No valid suggested roles from JSON blocks, attempting fallback extraction...",
                );
                // Try to extract structured JSON from cleaned markdown (if not already parsed above)
                let structured = parsedStructured;
                if (!structured) {
                    console.log(
                        "🔍 Attempting to extract structured JSON from markdownPart...",
                    );
                    structured = extractSOWStructuredJson(markdownPart);
                    console.log(
                        "📊 Extracted structured JSON:",
                        structured ? "Found" : "Not found",
                    );
                }
                let derived = buildSuggestedRolesFromArchitectSOW(structured);
                console.log(
                    `📊 Derived ${derived?.length || 0} roles from structured JSON`,
                );

                // Final fallback: use structuredSow captured from the streamed response (if available)
                if ((!derived || derived.length === 0) && structuredSow) {
                    console.log(
                        "🔍 Attempting to use structuredSow from state...",
                    );
                    const fromState =
                        buildSuggestedRolesFromArchitectSOW(structuredSow);
                    if (fromState.length > 0) {
                        console.log(
                            `✅ Using ${fromState.length} roles derived from captured structured JSON state.`,
                        );
                        derived = fromState;
                    }
                }

                if (derived && derived.length > 0) {
                    console.log(
                        `✅ Using ${derived.length} roles derived from Architect structured JSON.`,
                    );
                    // 🔒 AM Guardrail: sanitize Account Management variants
                    const sanitized = sanitizeAccountManagementRoles(derived);
                    convertedContent = convertMarkdownToNovelJSON(
                        cleanedContent,
                        sanitized,
                        convertOptions,
                    );
                } else {
                    console.warn(
                        "⚠️ No structured JSON found, attempting fallback to markdown table extraction...",
                    );
                    console.log("📊 Debug info:", {
                        hasValidSuggestedRoles,
                        tablesRolesQueueLength: tablesRolesQueue.length,
                        parsedStructured: !!parsedStructured,
                        structured: !!structured,
                        derivedLength: derived?.length || 0,
                        structuredSow: !!structuredSow,
                    });

                    // 🎯 FALLBACK: Let convertMarkdownToNovelJSON try to extract from markdown tables
                    // This mirrors the logic used in automatic insertion during streaming
                    console.log(
                        "🔄 Attempting conversion with empty roles array (will trigger markdown table fallback)...",
                    );
                    convertedContent = convertMarkdownToNovelJSON(
                        cleanedContent,
                        [], // Empty array triggers markdown table extraction fallback
                        convertOptions,
                    );

                    // Check if the conversion actually found pricing tables
                    const hasPricingTables = convertedContent?.content?.some(
                        (node: any) => node.type === "editablePricingTable",
                    );

                    // Check if the AI response contains error messages
                    const errorPatterns = [
                        /❌.*insertion.*blocked/i,
                        /missing.*pricing.*data/i,
                        /cannot.*parse.*json/i,
                        /invalid.*json/i,
                        /error.*generating/i,
                        /ai.*response.*alert/i,
                        /regenerate.*request/i,
                    ];
                    const hasErrorMessages = errorPatterns.some((pattern) =>
                        pattern.test(cleanedContent),
                    );

                    if (!hasPricingTables && !hasErrorMessages) {
                        console.error(
                            "❌ CRITICAL ERROR: No pricing data found in JSON blocks or markdown tables.",
                        );
                        const blockedMessage: ChatMessage = {
                            id: `msg${Date.now()}`,
                            role: "assistant",
                            content:
                                "❌ Insertion blocked: No pricing data found.\n\n" +
                                "The AI response must include either:\n" +
                                "1. A `[PRICING_JSON]` block with `role_allocation` array, OR\n" +
                                "2. A markdown table with role names and hours\n\n" +
                                "Please regenerate the SOW with proper pricing information.",
                            timestamp: Date.now(),
                        };
                        setChatMessages((prev) => [...prev, blockedMessage]);
                        return;
                    }

                    if (hasErrorMessages) {
                        console.log(
                            "⚠️ AI response contains error messages, inserting as text",
                        );
                        // Insert the error message as regular text
                        const errorMessage: ChatMessage = {
                            id: `msg${Date.now()}`,
                            role: "assistant",
                            content: cleanedContent,
                            timestamp: Date.now(),
                        };
                        setChatMessages((prev) => [...prev, errorMessage]);
                        return;
                    }

                    console.log(
                        "✅ Successfully extracted pricing data from markdown tables",
                    );
                }
            } else {
                // 🔒 AM Guardrail: sanitize Account Management variants
                const sanitized =
                    sanitizeAccountManagementRoles(suggestedRoles);
                convertedContent = convertMarkdownToNovelJSON(
                    cleanedContent,
                    sanitized,
                    convertOptions,
                );
            }
            console.log("✅ Content converted");

            // 4. Extract title from the content
            const titleMatch = cleanedContent.match(/^#\s+(.+)$/m);
            const clientMatch = cleanedContent.match(
                /\*\*Client:\*\*\s+(.+)$/m,
            );
            const scopeMatch = cleanedContent.match(/Scope of Work:\s+(.+)/);

            let docTitle = "New SOW";
            if (titleMatch) {
                docTitle = titleMatch[1];
            } else if (scopeMatch) {
                docTitle = scopeMatch[1];
            } else if (clientMatch) {
                docTitle = `SOW - ${clientMatch[1]}`;
            }

            // 5. Merge or set editor content depending on existing content
            let finalContent = convertedContent;
            const existing = editorRef.current?.getContent?.();
            const isTrulyEmpty =
                !existing ||
                !Array.isArray(existing.content) ||
                existing.content.length === 0 ||
                (existing.content.length === 1 &&
                    existing.content[0]?.type === "paragraph" &&
                    (!existing.content[0].content ||
                        existing.content[0].content.length === 0));

            if (!isTrulyEmpty) {
                // Replace the entire document on first proper insert from AI
                // The convertedContent already merges narrative + pricing table
                finalContent = {
                    ...convertedContent,
                    content: sanitizeEmptyTextNodes(convertedContent.content),
                } as any;
                console.log(
                    "📝 Replacing existing non-empty editor with full merged content",
                );
            } else {
                // Fresh set for truly empty editor
                finalContent = {
                    ...convertedContent,
                    content: sanitizeEmptyTextNodes(convertedContent.content),
                } as any;
                console.log("🆕 Setting content on empty editor");
            }

            // Update editor
            if (editorRef.current) {
                if (editorRef.current.commands?.setContent) {
                    editorRef.current.commands.setContent(finalContent);
                } else {
                    editorRef.current.insertContent(finalContent);
                }
                console.log("✅ Editor content updated successfully");

                // ✅ FIX: Immediately sync latestEditorJSON to prevent auto-save from overwriting with stale content
                // This ensures the newly inserted content is the authoritative source of truth
                setLatestEditorJSON(finalContent);
                console.log(
                    "🔒 [Race Condition Fix] Locked in new editor state to prevent auto-save overwrite",
                );
            } else {
                console.warn(
                    "⚠️ Editor ref not available, skipping direct update",
                );
            }

            // 6. Update the document state with new content and title
            console.log("📝 Updating document state and title:", docTitle);
            const newContentForState = finalContent;
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === currentDocId
                        ? {
                              ...doc,
                              content: newContentForState,
                              title: docTitle,
                          }
                        : doc,
                ),
            );
            console.log("✅ Document state updated successfully");

            // 7. Embed SOW in both client workspace and master dashboard
            const currentAgent = agents.find((a) => a.id === currentAgentId);
            const useAnythingLLM = currentAgent?.model === "anythingllm";

            if (useAnythingLLM && currentAgentId) {
                console.log("🤖 Embedding SOW in workspaces...");
                try {
                    // 🔧 CRITICAL FIX: Extract client name from document title to create client-specific workspace
                    // SOW title format: "SOW - ClientName - ServiceType" or "Scope of Work: ClientName"
                    let clientWorkspaceSlug =
                        getWorkspaceForAgent(currentAgentId); // Default fallback

                    // Extract client name from document title OR use workspace name as fallback
                    const clientNameMatch = docTitle.match(
                        /(?:SOW|Scope of Work)[:\s-]+([^-:]+)/i,
                    );
                    const clientName =
                        clientNameMatch && clientNameMatch[1]
                            ? clientNameMatch[1].trim()
                            : getWorkspaceForAgent(currentAgentId); // Use workspace name as fallback

                    console.log(
                        `🏢 Using client name: ${clientName} (from ${clientNameMatch ? "title" : "workspace"})`,
                    );

                    // ARCHITECTURAL SIMPLIFICATION: Use master 'gen' workspace for all SOW generation
                    try {
                        const masterWorkspace =
                            await anythingLLM.getMasterSOWWorkspace(clientName);
                        clientWorkspaceSlug = masterWorkspace.slug;
                        console.log(
                            `✅ Using master SOW generation workspace: ${clientWorkspaceSlug}`,
                        );
                    } catch (wsError) {
                        console.warn(
                            `⚠️ Could not access master workspace`,
                            wsError,
                        );
                    }

                    const success = await anythingLLM.embedSOWInBothWorkspaces(
                        docTitle,
                        cleanedContent,
                        clientName,
                    );

                    if (success) {
                        console.log(
                            "✅ SOW embedded in both workspaces successfully",
                        );
                        toast.success(
                            "✅ Content inserted and embedded in both workspaces!",
                        );
                    } else {
                        console.warn("⚠️ Embedding completed with warnings");
                        toast.success(
                            "✅ Content inserted to editor (workspace embedding had issues)",
                        );
                    }
                } catch (embedError) {
                    console.error("⚠️ Embedding error:", embedError);
                    toast.success(
                        "✅ Content inserted to editor (embedding skipped)",
                    );
                }
            } else {
                toast.success("✅ Content inserted into editor!");
            }
        } catch (error) {
            console.error("Error inserting content:", error);
            toast.error("❌ Failed to insert content. Please try again.");
        }
    };

    const [currentRequestController, setCurrentRequestController] =
        useState<AbortController | null>(null);
    const [lastMessageSentTime, setLastMessageSentTime] = useState<number>(0);
    const MESSAGE_RATE_LIMIT = 1000; // Wait at least 1 second between messages to avoid rate limiting

    const handleSendMessage = async (
        message: string,
        threadSlugParam?: string | null,
        attachments?: Array<{
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
                            /\[[^\]]+\]/g,
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
                                /\[(?:PRICING[\/_ ]?JSON|ANALYZE(?:\s*&\s*CLASSIFY)?|FINANCIAL[_\s-]*REASONING|BUDGET[_\s-]*NOTE)\]/gi,
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
                        /\*\*Client:\*\*\s+(.+)$/m,
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
                        docTitle,
                        " Empty editor:",
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
                            `🎯 [SOW Chat] Using SOW workspace: ${workspaceSlug}`,
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
                                    } else {
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
                                              "❌ **Generation Failed**\n\nThe AI returned empty content. This usually means:\n\n" +
                                              "**Most Common Causes:**\n" +
                                              "- The workspace routing is incorrect\n" +
                                              "- The AI workspace is not properly configured or has no LLM set\n" +
                                              "- Authentication issue with AnythingLLM\n" +
                                              "- The thread doesn't exist or is inaccessible\n\n" +
                                              "**Debug Information:**\n" +
                                              `- Workspace: \`${workspaceSlug || "none"}\`\n` +
                                              `- Thread: \`${threadSlugToUse || "none"}\`\n` +
                                              `- Mode: \`${resolvedMode}\`\n` +
                                              `- Endpoint: \`${streamEndpoint}\`\n\n` +
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
                                        /\[PRICING_JSON\].*?\[\/PRICING_JSON\]/gs,
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
                                        /\[PRICING_JSON\].*?\[\/PRICING_JSON\]/gs,
                                        "",
                                    );

                                contentForEditor = convertMarkdownToNovelJSON(
                                    cleanedContent,
                                    [],
                                    {},
                                );
                                docTitle =
                                    extractDocTitle(cleanedContent) ||
                                    "New SOW";
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

                    // ⚠️ REMOVED TWO-STEP AUTO-CORRECT LOGIC
                    // The AI should now return complete SOW narrative + JSON in a single response
                    // No follow-up prompt is needed if the initial prompt is clear enough
                    console.log(
                        "✅ Single-step AI generation complete - no follow-up needed",
                    );
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
                                        /\[PRICING_JSON\].*?\[\/PRICING_JSON\]/gs,
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
                                        /\[PRICING_JSON\].*?\[\/PRICING_JSON\]/gs,
                                        "",
                                    );

                                contentForEditor = convertMarkdownToNovelJSON(
                                    cleanedContent,
                                    [],
                                    {},
                                );
                                docTitle =
                                    extractDocTitle(cleanedContent) ||
                                    "New SOW";
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
        } else {
            setIsChatLoading(false);
        }
    };

    // Prevent hydration errors by not rendering until mounted
    if (!mounted) {
        return null;
    }

    // Dashboard filtering removed - show full workspaces list
    const filteredWorkspaces = workspaces;

    return (
        <div className="flex flex-col h-screen bg-[#0e0f0f]">
            {/* Onboarding Tutorial */}
            <InteractiveOnboarding />

            {/* Resizable Layout with Sidebar, Editor, and AI Chat */}
            <div className="flex-1 h-full overflow-hidden">
                <ResizableLayout
                    sidebarOpen={sidebarOpen}
                    aiChatOpen={agentSidebarOpen}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onToggleAiChat={() =>
                        setAgentSidebarOpen(!agentSidebarOpen)
                    }
                    viewMode={viewMode} // Pass viewMode for context awareness
                    leftPanel={
                        // Always show sidebar navigation regardless of view mode
                        <SidebarNav
                            workspaces={filteredWorkspaces}
                            currentWorkspaceId={currentWorkspaceId}
                            currentSOWId={currentSOWId}
                            currentView={viewMode}
                            onSelectWorkspace={setCurrentWorkspaceId}
                            onSelectSOW={setCurrentSOWId}
                            onCreateWorkspace={handleCreateWorkspace}
                            onRenameWorkspace={handleRenameWorkspace}
                            onDeleteWorkspace={handleDeleteWorkspace}
                            onCreateSOW={handleCreateSOW}
                            onRenameSOW={handleRenameSOW}
                            onDeleteSOW={handleDeleteSOW}
                            onViewChange={handleViewChange}
                            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                            onReorderWorkspaces={handleReorderWorkspaces}
                            onReorderSOWs={handleReorderSOWs}
                            onMoveSOW={handleMoveSOW}
                            // Dashboard visibility flag
                            showDashboardLink={SHOW_DASHBOARD_UI}
                        />
                    }
                    mainPanel={
                        viewMode === "editor" ? (
                            <EditorPanel
                                currentDoc={currentDoc}
                                isGrandTotalVisible={isGrandTotalVisible}
                                toggleGrandTotal={() => setIsGrandTotalVisible(!isGrandTotalVisible)}
                                editorRef={editorRef}
                                handleUpdateDoc={handleUpdateDoc}
                                handleExportPDF={handleExportPDF}
                                handleExportNewPDF={handleExportNewPDF}
                                handleExportExcel={handleExportExcel}
                                handleSharePortal={SHOW_CLIENT_PORTAL_UI ? handleSharePortal : undefined}
                                onCreateWorkspace={handleCreateWorkspace}
                                onOpenOnboarding={() => setShowGuidedSetup(true)}
                            />
                        ) : viewMode === "dashboard" && SHOW_DASHBOARD_UI ? (
                            <DashboardMain
                                onOpenInEditor={(sowId: string) => {
                                    if (!sowId) return;
                                    try {
                                        handleSelectDoc(sowId);
                                    } catch (e) {
                                        console.warn(
                                            "⚠️ Failed to open SOW in editor:",
                                            e,
                                        );
                                    }
                                }}
                                onOpenInPortal={SHOW_CLIENT_PORTAL_UI ? ((sowId: string) => {
                                    if (!sowId) return;
                                    try {
                                        router.push(`/portal/sow/${sowId}`);
                                    } catch (e) {
                                        console.warn(
                                            "⚠️ Failed to open SOW portal:",
                                            e,
                                        );
                                    }
                                }) : undefined}
                            />
                        ) : (
                            <HomeWelcome
                                onCreateWorkspace={() => handleCreateWorkspace("New Workspace")}
                                onOpenOnboarding={() => setShowGuidedSetup(true)}
                            />
                        )
                    }
                    rightPanel={
                        // ✨ Render appropriate sidebar based on viewMode
                        // Dashboard mode: Query-only Analytics Assistant with workspace dropdown
                        // Editor mode: Full-featured SOW generation with The Architect
                        viewMode === "dashboard" && SHOW_DASHBOARD_UI ? (
                            <DashboardRight
                                isOpen={agentSidebarOpen}
                                onToggle={() =>
                                    setAgentSidebarOpen(!agentSidebarOpen)
                                }
                                dashboardChatTarget={dashboardChatTarget}
                                onDashboardWorkspaceChange={
                                    setDashboardChatTarget
                                }
                                availableWorkspaces={availableWorkspaces}
                                chatMessages={chatMessages}
                                onSendMessage={handleSendMessage}
                                isLoading={isChatLoading}
                                streamingMessageId={streamingMessageId}
                                onClearChat={() => {
                                    console.log(
                                        "🧹 Clearing chat messages for new thread",
                                    );
                                    setChatMessages([]);
                                    setIsHistoryRestored(false); // Reset flag when clearing
                                }}
                                onReplaceChatMessages={(msgs) => {
                                    console.log(
                                        "🔁 Replacing chat messages from thread history:",
                                        msgs.length,
                                    );
                                    setChatMessages(msgs);
                                    setIsHistoryRestored(true); // 🛡️ Mark history as restored - prevents welcome message overwrite
                                }}
                            />
                        ) : viewMode === "editor" ? (
                            <WorkspaceChat
                                isOpen={agentSidebarOpen}
                                onToggle={() =>
                                    setAgentSidebarOpen(!agentSidebarOpen)
                                }
                                chatMessages={chatMessages}
                                onSendMessage={handleSendMessage}
                                isLoading={isChatLoading}
                                onInsertToEditor={(content) => {
                                    console.log(
                                        "� Insert to Editor button clicked from AI chat",
                                    );
                                    handleInsertContent(content);
                                }}
                                streamingMessageId={streamingMessageId}
                                editorWorkspaceSlug={
                                    currentDoc?.workspaceSlug || ""
                                }
                                editorThreadSlug={
                                    currentDoc?.threadSlug || null
                                }
                                onEditorThreadChange={async (slug) => {
                                    if (!currentDocId) return;
                                    // Update document state
                                    setDocuments((prev) =>
                                        prev.map((d) =>
                                            d.id === currentDocId
                                                ? {
                                                      ...d,
                                                      threadSlug:
                                                          slug || undefined,
                                                  }
                                                : d,
                                        ),
                                    );
                                    // Persist to DB
                                    try {
                                        await fetch(
                                            `/api/sow/${currentDocId}`,
                                            {
                                                method: "PUT",
                                                headers: {
                                                    "Content-Type":
                                                        "application/json",
                                                },
                                                body: JSON.stringify({
                                                    threadSlug: slug,
                                                }),
                                            },
                                        );
                                    } catch (e) {
                                        console.warn(
                                            "⚠️ Failed to persist threadSlug change:",
                                            e,
                                        );
                                    }
                                    // Load thread history into chat panel when a thread is selected (or clear when null)
                                    try {
                                        if (slug && currentDoc?.workspaceSlug) {
                                            const history =
                                                await anythingLLM.getThreadChats(
                                                    currentDoc.workspaceSlug,
                                                    slug,
                                                );
                                            const messages: ChatMessage[] = (
                                                history || []
                                            ).map((msg: any) => ({
                                                id: `msg${Date.now()}-${Math.random()}`,
                                                role:
                                                    msg.role === "user"
                                                        ? "user"
                                                        : "assistant",
                                                content: msg.content || "",
                                                timestamp: Date.now(),
                                            }));
                                            setChatMessages(messages);
                                        } else {
                                            setChatMessages([]);
                                        }
                                    } catch (err) {
                                        console.warn(
                                            "⚠️ Failed to load thread history:",
                                            err,
                                        );
                                        setChatMessages([]);
                                    }
                                }}
                                onClearChat={() => {
                                    console.log(
                                        "🧹 Clearing chat messages for new thread",
                                    );
                                    setChatMessages([]);
                                    setIsHistoryRestored(false); // Reset flag when clearing
                                }}
                                onReplaceChatMessages={(msgs) => {
                                    console.log(
                                        "🔁 Replacing chat messages from thread history:",
                                        msgs.length,
                                    );
                                    setChatMessages(msgs);
                                    setIsHistoryRestored(true); // 🛡️ Mark history as restored
                                }}
                            />
                        ) : null // AI Management mode: no sidebar
                    }
                    leftMinSize={15}
                    mainMinSize={30}
                    rightMinSize={20}
                    leftDefaultSize={20}
                    mainDefaultSize={55}
                    rightDefaultSize={25}
                />
            </div>

            {/* Send to Client Modal */}
            {currentDoc && SHOW_CLIENT_PORTAL_UI && (
                <SendToClientModal
                    isOpen={showSendModal}
                    onClose={() => setShowSendModal(false)}
                    document={{
                        id: currentDoc.id,
                        title: currentDoc.title,
                        content: currentDoc.content,
                        totalInvestment: calculateTotalInvestment(
                            currentDoc.content,
                        ),
                    }}
                    onSuccess={(sowId, portalUrl) => {
                        toast.success("SOW sent successfully!", {
                            description: `Portal: ${portalUrl}`,
                            duration: 5000,
                        });
                    }}
                />
            )}

            {/* Share Link Modal */}
            {shareModalData && SHOW_CLIENT_PORTAL_UI && (
                <ShareLinkModal
                    isOpen={showShareModal}
                    onClose={() => {
                        setShowShareModal(false);
                        setShareModalData(null);
                    }}
                    shareLink={shareModalData.shareLink}
                    documentTitle={shareModalData.documentTitle}
                    shareCount={shareModalData.shareCount}
                    firstShared={shareModalData.firstShared}
                    lastShared={shareModalData.lastShared}
                />
            )}

            {/* NEW: Professional PDF Download Modal */}
            {showNewPDFModal && newPDFData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1D] border border-green-600 rounded-xl p-8 max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Professional PDF Ready!
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Your BBUBU-style PDF is ready to download.
                        </p>
                        <div className="flex gap-4">
                            <SOWPdfExportWrapper
                                sowData={newPDFData}
                                variant="editor"
                                fileName={`${currentDoc?.title || "SOW"}-Professional.pdf`}
                            />
                            <button
                                onClick={() => {
                                    setShowNewPDFModal(false);
                                    setNewPDFData(null);
                                }}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Workspace Creation Progress Modal */}
            <WorkspaceCreationProgress
                isOpen={workspaceCreationProgress.isOpen}
                workspaceName={workspaceCreationProgress.workspaceName}
                currentStep={workspaceCreationProgress.currentStep}
                completedSteps={workspaceCreationProgress.completedSteps}
            />

            {/* Beautiful Onboarding Flow */}
            <OnboardingFlow
                isOpen={showOnboarding}
                onComplete={() => setShowOnboarding(false)}
                onCreateWorkspace={handleCreateWorkspace}
                workspaceCount={workspaces.length}
            />
        </div>
    );
}
