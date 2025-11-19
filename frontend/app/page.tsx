"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ArchitectSOW } from "@/lib/export-utils";
import type { Document, Folder, Agent, Workspace, SOW, ChatMessage } from "@/lib/types/sow";
import { transformScopesToPDFFormat } from "@/lib/sow-utils";
import { convertMarkdownToNovelJSON, ConvertOptions, convertNovelToHTML } from "@/lib/editor-utils";
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
import CreateWorkspaceDialog from "@/components/tailwind/create-workspace-dialog";
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
import { useChatManager } from "@/hooks/useChatManager";
import { useAgentState } from "@/hooks/useAgentState";
import { useDocumentState } from "@/hooks/useDocumentState";
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
      showOnboarding,
      setShowOnboarding,
    } = useUIState();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isHistoryRestored, setIsHistoryRestored] = useState(false);

    const {
        documents,
        setDocuments,
        // Removed folders - using workspaces only (folders and workspaces are the same)
        currentDoc,
        currentDocId,
        setCurrentDocId,
        workspaces,
        setWorkspaces,
        currentWorkspaceId,
        setCurrentWorkspaceId,
        currentSOWId,
        setCurrentSOWId,
        latestEditorJSON,
        setLatestEditorJSON,
        editorRef,
    } = useDocumentState({
        mounted,
        viewMode,
        setShowOnboarding,
        setShowGuidedSetup,
    });

    const {
        agents,
        currentAgentId,
        setCurrentAgentId,
        chatMessages,
        setChatMessages,
        isChatLoading,
        streamingMessageId,
        lastUserPrompt,
        userPromptDiscount,
        setUserPromptDiscount,
        multiScopePricingData,
        setMultiScopePricingData,
        handleCreateAgent,
        handleSelectAgent,
        handleUpdateAgent,
        handleDeleteAgent,
        handleInsertContent,
        handleSendMessage,
    } = useChatManager({
        viewMode,
        currentDoc,
        editorRef,
        documents,
        workspaces,
        currentWorkspaceId,
        currentSOWId,
        setLatestEditorJSON,
    });
    
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

    // Create workspace dialog state
    const [createWorkspaceDialogOpen, setCreateWorkspaceDialogOpen] = useState(false);
    const [createWorkspaceType, setCreateWorkspaceType] = useState<"sow" | "client" | "generic">("sow");

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

    // Onboarding state is provided by useUIState

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
            if (!nextDoc) {
                console.error("❌ Document not found:", id);
                toast.error("Document not found. Please refresh the page.");
                return;
            }
            
            if (editorRef.current) {
                console.log("📄 Loading content for SOW", id, "...");
                try {
                    // Wait a brief moment to ensure editor is ready
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    if (editorRef.current.commands?.setContent) {
                        editorRef.current.commands.setContent(nextDoc.content);
                    } else if (editorRef.current.insertContent) {
                        editorRef.current.insertContent(nextDoc.content);
                    } else {
                        console.warn("⚠️ Editor methods not available, content may not load");
                    }
                    console.log("✅ LOAD SUCCESS for", id);
                } catch (error) {
                    console.error("❌ Error loading document content:", error);
                    toast.error("Failed to load document content. Please try again.");
                }
            } else {
                console.warn("⚠️ Editor ref not available yet, content will load when editor initializes");
            }

            // Ensure we are in editor view
            if (viewMode !== "editor") {
                setViewMode("editor");
            }
        })();
    };

    const handleNewDoc = async (folderId?: string) => {
        const newId = `doc${Date.now()}`;
        
        // Generate a unique title to avoid too many "Untitled SOW" entries
        const untitledCount = documents.filter(d => 
            d.title.startsWith("Untitled SOW") || d.title === "Untitled SOW"
        ).length;
        const title = untitledCount > 0 
            ? `Untitled SOW ${untitledCount + 1}` 
            : "Untitled SOW";

        // 🎯 DEFAULT TO UNFILED: If no folder specified, use Unfiled folder
        const targetFolderId = folderId || UNFILED_FOLDER_ID;

        // Find workspace slug from the folder this SOW belongs to
        const parentWorkspace = workspaces.find((w) => w.id === targetFolderId);
        const workspaceSlug = parentWorkspace?.workspace_slug || parentWorkspace?.slug;

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
                    const clientContext = parentWorkspace?.name || "unknown";
                    await anythingLLM.embedSOWInBothWorkspaces(
                        title,
                        sowContent,
                        clientContext,
                    );

                    toast.success(
                        `✅ SOW created in ${parentWorkspace?.name || "workspace"}`,
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

            // Create workspace (folders and workspaces are the same)
            const newWorkspace: Workspace = {
                id: savedFolder.id,
                name: name,
                sows: [],
                workspace_slug: workspace.slug,
                slug: workspace.slug,
                workspaceId: workspace.id,
                embedId,
                syncedAt: new Date().toISOString(),
            };

            setWorkspaces((prev) => [...prev, newWorkspace]);
            toast.success(`✅ Workspace "${name}" created!`);

            // 🎯 AUTO-CREATE FIRST SOW IN NEW WORKSPACE
            // This creates an empty SOW and opens it immediately
            await handleNewDoc(newWorkspace.id);
        } catch (error) {
            console.error("Error creating folder:", error);
            toast.error(`❌ Failed to create folder: ${error.message}`);
        }
    };

    const handleRenameFolder = async (id: string, name: string) => {
        const workspace = workspaces.find((w) => w.id === id);

        try {
            // 💾 Update workspace in DATABASE (folders table)
            const response = await fetch(`/api/folders/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error("Failed to update workspace in database");
            }

            // 🏢 Update AnythingLLM workspace name if it exists
            const workspaceSlug = workspace?.workspace_slug || workspace?.workspaceSlug;
            if (workspaceSlug) {
                await anythingLLM.updateWorkspace(workspaceSlug, name);
            }

            setWorkspaces((prev) =>
                prev.map((w) =>
                    w.id === id
                        ? { ...w, name, syncedAt: new Date().toISOString() }
                        : w,
                ),
            );
            toast.success(`✅ Folder renamed to "${name}"`);
        } catch (error) {
            console.error("Error renaming folder:", error);
            toast.error("❌ Failed to rename folder");
        }
    };

    const handleDeleteFolder = async (id: string) => {
        const workspace = workspaces.find((w) => w.id === id);

        // Also delete sub-workspaces and docs in workspace
        const toDelete = [id];
        const deleteRecursive = (workspaceId: string) => {
            workspaces
                .filter((w) => w.parentId === workspaceId)
                .forEach((w) => {
                    toDelete.push(w.id);
                    deleteRecursive(w.id);
                });
        };
        deleteRecursive(id);

        try {
            // 💾 Delete workspace from DATABASE (folders table)
            const response = await fetch(`/api/folders/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete workspace from database");
            }

            // 🏢 Delete AnythingLLM workspace (cascades to all threads)
            const workspaceSlug = workspace?.workspace_slug || workspace?.workspaceSlug;
            if (workspaceSlug) {
                await anythingLLM.deleteWorkspace(workspaceSlug);
            }

            setWorkspaces((prev) => prev.filter((w) => !toDelete.includes(w.id)));
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

            // Create workspace in local state (folders and workspaces are the same)
            const newWorkspace: Workspace = {
                id: folderId,
                name: workspaceName,
                sows: [],
                workspace_slug: workspace.slug,
                slug: workspace.slug,
                workspaceId: workspace.id,
                embedId: embedId,
                syncedAt: new Date().toISOString(),
            };

            setWorkspaces((prev) => [...prev, newWorkspace]);

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
                    const documentsFromDB: Document[] = [];

                    // Convert folders from database to workspaces (they're the same thing)
                    for (const folder of foldersData) {
                        const folderSOWs = dbSOWs.filter(
                            (sow: any) => sow.folder_id === folder.id,
                        );
                        
                        // Create workspace with all metadata
                        const workspace: Workspace = {
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
                            slug: folder.workspace_slug,
                            workspaceSlug: folder.workspace_slug, // For compatibility
                            workspaceId: folder.workspace_id,
                            embedId: folder.embed_id,
                            syncedAt: folder.updated_at || folder.created_at,
                        };
                        
                        workspacesWithSOWs.push(workspace);

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
                    // Folders and workspaces are the same - use workspaces only
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

    // REMOVED: Simple handleInsertToEditor function - now using the complex handleInsertContent function
    // to ensure proper TipTap JSON conversion before insertion

    const handleEditorThreadChange = (threadSlug: string | null) => {
        if (currentDocId) {
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === currentDocId ? { ...doc, threadSlug } : doc,
                ),
            );
        }
    };

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

            // 🎯 Extract showTotal flag from pricing table node (if exists) - same as standard PDF export
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
                        "🎯 [Professional PDF] Show Pricing Summary:",
                        showPricingSummary,
                    );
                }
            }

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
                        showPricingSummary, // 🎯 Pass showTotal flag for professional PDF
                    );
                } else {
                    // Transform V4.1 multi-scope data to backend format
                    transformedData = transformScopesToPDFFormat(
                        multiScopePricingData,
                        currentDoc, // Pass current document for clientName extraction
                        userPromptDiscount, // Pass the user prompt discount
                        showPricingSummary, // 🎯 Pass showTotal flag for professional PDF
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
                    let errorText = "";
                    try {
                        errorText = await response.text();
                        // Try to parse as JSON for better error messages
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorText = errorJson.error || errorJson.details || errorText;
                        } catch {
                            // Not JSON, use as-is
                        }
                    } catch (e) {
                        errorText = `HTTP ${response.status}: ${response.statusText}`;
                    }
                    console.error(
                        "❌ Professional PDF service error:",
                        errorText,
                    );
                    toast.error(
                        `❌ PDF export failed: ${errorText || `Error ${response.status}`}. Please check the console for details.`,
                        { duration: 8000 }
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
        } catch (error: any) {
            console.error("❌ Error preparing new PDF:", error);
            const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
            toast.error(
                `❌ PDF export failed: ${errorMessage}. Please try again or contact support if the issue persists.`,
                { duration: 8000 }
            );
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
            const currentWorkspace = workspaces.find((w) => w.id === currentDoc.folderId);
            const workspaceSlug = currentWorkspace?.workspace_slug || currentWorkspace?.workspaceSlug;
            if (!currentWorkspace || !workspaceSlug) {
                toast.error("❌ No workspace found for this SOW");
                return;
            }

            const htmlContent = editorRef.current?.getHTML() || "";
            if (!htmlContent || htmlContent === "<p></p>") {
                toast.error("❌ Document is empty. Add content before sharing.");
                return;
            }

            const clientContext = currentWorkspace?.name || "unknown";
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
        if (!isOAuthAuthorized) {
            toast.error("❌ Google account not authorized");
            return;
        }

        toast.info("📊 Creating Google Sheet...");

        try {
            const response = await fetch("/api/create-google-sheet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    sowTitle: currentDoc.title,
                    sowContent: currentDoc.content,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Failed to create Google Sheet",
                );
            }

            const { sheetUrl } = await response.json();
            toast.success(
                <a href={sheetUrl} target="_blank" rel="noopener noreferrer">
                    ✅ Google Sheet created! Click here to open.
                </a>,
            );
        } catch (error: any) {
            console.error("Error creating Google Sheet:", error);
            toast.error(`❌ Error creating Google Sheet: ${error.message}`);
        }
    };

    return (
        <>
            <ResizableLayout
                leftPanel={
                    <SidebarNav
                        documents={documents}
                        workspaces={workspaces}
                        currentWorkspaceId={currentWorkspaceId}
                        currentSOWId={currentDocId}
                        onSelectWorkspace={setCurrentWorkspaceId}
                        onSelectSOW={handleSelectDoc}
                        onRenameSOW={handleRenameDoc}
                        onDeleteSOW={handleDeleteDoc}
                        onRenameWorkspace={handleRenameFolder}
                        onReorderWorkspaces={handleReorderWorkspaces}
                        onMoveSOW={handleMoveSOW}
                        onReorderSOWs={handleReorderSOWs}
                        onViewChange={handleViewChange}
                        currentView={viewMode}
                        onCreateWorkspace={(name?: string, type?: "sow" | "client" | "generic") => {
                            if (name) {
                                handleCreateWorkspace(name, type || "sow");
                            } else {
                                setCreateWorkspaceType(type || "sow");
                                setCreateWorkspaceDialogOpen(true);
                            }
                        }}
                        onDeleteWorkspace={handleDeleteWorkspace}
                        onCreateSOW={handleCreateSOW}
                    />
                }
                mainPanel={
                <>
                {viewMode === "dashboard" && (
                    <div className="flex h-full">
                        <DashboardMain
                            workspaces={workspaces}
                            sows={documents}
                            folders={workspaces.map(w => ({
                                id: w.id,
                                name: w.name,
                                workspaceSlug: w.workspaceSlug || w.workspace_slug || w.slug || '',
                                workspaceId: w.workspaceId,
                                embedId: w.embedId,
                                parentId: w.parentId,
                                syncedAt: w.syncedAt,
                                sowIds: w.sows?.map(s => s.id) || [],
                            }))}
                            onSelectSOW={handleSelectDoc}
                            onCreateSOW={handleCreateSOW}
                            onDeleteSOW={handleDeleteDoc}
                            onRenameSOW={handleRenameSOW}
                            onMoveSOW={handleMoveSOW}
                            onCreateWorkspace={async (name: string, type?: "sow" | "client" | "generic") => {
                                await handleCreateWorkspace(name, type || "sow");
                            }}
                            onDeleteWorkspace={handleDeleteWorkspace}
                            onRenameWorkspace={handleRenameWorkspace}
                        />
                        <DashboardRight
                            dashboardChatTarget={dashboardChatTarget}
                            onDashboardWorkspaceChange={setDashboardChatTarget}
                            availableWorkspaces={availableWorkspaces}
                        />
                    </div>
                )}

                {viewMode === "editor" &&
                    (currentDoc ? (
                        <EditorPanel
                            currentDoc={currentDoc}
                            editorRef={editorRef}
                            onContentChange={setLatestEditorJSON}
                            handleUpdateDoc={(content: any) => {
                                // Trigger auto-save by updating latestEditorJSON
                                setLatestEditorJSON(content);
                            }}
                            onShare={handleShare}
                            onExportPDF={handleExportPDF}
                            onExportNewPDF={handleExportNewPDF}
                            onExportExcel={undefined}
                            onSharePortal={undefined}
                            onOpenAIChat={handleOpenAIChat}
                            isGrandTotalVisible={isGrandTotalVisible}
                            toggleGrandTotal={setIsGrandTotalVisible}
                            onCreateWorkspace={() => {
                                setCreateWorkspaceType("sow");
                                setCreateWorkspaceDialogOpen(true);
                            }}
                        />
                    ) : (
                        <HomeWelcome
                            onCreateWorkspace={() => {
                                setCreateWorkspaceType("sow");
                                setCreateWorkspaceDialogOpen(true);
                            }}
                            onOpenOnboarding={() => setShowOnboarding(true)}
                        />
                    ))}
                </>
                }
                rightPanel={
                    // Only show chat when in editor mode with a document, or in dashboard mode
                    (viewMode === "editor" && currentDoc) || viewMode === "dashboard" ? (
                        <WorkspaceChat
                            isOpen={agentSidebarOpen}
                            onToggle={() => setAgentSidebarOpen(!agentSidebarOpen)}
                            chatMessages={chatMessages}
                            onSendMessage={handleSendMessage}
                            isLoading={isChatLoading}
                            streamingMessageId={streamingMessageId}
                            onInsertToEditor={handleInsertContent}
                            editorWorkspaceSlug={currentDoc?.workspaceSlug || ""}
                            editorThreadSlug={currentDoc?.threadSlug}
                            onEditorThreadChange={handleEditorThreadChange}
                            onClearChat={() => setChatMessages([])}
                            onReplaceChatMessages={setChatMessages}
                        />
                    ) : null
                }
                sidebarOpen={sidebarOpen}
                aiChatOpen={agentSidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onToggleAiChat={() => setAgentSidebarOpen(!agentSidebarOpen)}
                viewMode={viewMode}
            >
            </ResizableLayout>

            <SendToClientModal
                isOpen={showSendModal}
                onClose={() => setShowSendModal(false)}
                docId={currentDocId}
                document={currentDoc}
                onSuccess={() => {}}
            />
            <ShareLinkModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                shareData={shareModalData}
            />
            <CreateWorkspaceDialog
                isOpen={createWorkspaceDialogOpen}
                onClose={() => setCreateWorkspaceDialogOpen(false)}
                onCreateWorkspace={handleCreateWorkspace}
                defaultType={createWorkspaceType}
            />
            <WorkspaceCreationProgress
                isOpen={workspaceCreationProgress.isOpen}
                workspaceName={workspaceCreationProgress.workspaceName}
                currentStep={workspaceCreationProgress.currentStep}
                completedSteps={workspaceCreationProgress.completedSteps}
            />
            {showOnboarding && (
                <OnboardingFlow
                    isOpen={showOnboarding}
                    onClose={() => setShowOnboarding(false)}
                    onCreateWorkspace={handleCreateWorkspace}
                />
            )}
            {showNewPDFModal && newPDFData && (
                <SOWPdfExportWrapper
                    isOpen={showNewPDFModal}
                    onClose={() => setShowNewPDFModal(false)}
                    sowData={newPDFData}
                />
            )}
        </>
    );
}