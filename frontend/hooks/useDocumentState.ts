"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type {
    Document,
    Folder,
    Agent,
    Workspace,
    SOW,
    ChatMessage,
} from "@/lib/types/sow";
import { anythingLLM } from "@/lib/anythingllm";
import { toast } from "sonner";
import { defaultEditorContent } from "@/lib/content";
import {
    ensureUnfiledFolder,
    UNFILED_FOLDER_ID,
    UNFILED_FOLDER_NAME,
} from "@/lib/ensure-unfiled-folder";
import { extractPricingFromContent } from "@/lib/export-utils";

// Environment configuration with validation
const getBackendConfig = () => {
    let backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        `${typeof window !== "undefined" ? window.location.origin : "https://sow.qandu.me"}/api`;

    // Normalize to HTTPS and public /api to avoid mixed-content and internal Docker host leakage
    try {
        const original = backendUrl;
        const isHttp = /^http:\/\//i.test(backendUrl);
        const containsInternalHost = /sow-qandu-me:3001|localhost:3001|127\.0\.0\.1:\d+/i.test(backendUrl);
        const origin = typeof window !== "undefined" ? window.location.origin : "https://sow.qandu.me";

        if (isHttp || containsInternalHost) {
            backendUrl = `${origin}/api`;
        }

        // Ensure https scheme
        backendUrl = backendUrl.replace(/^http:\/\//i, "https://");

        // Ensure /api path present once
        const u = new URL(backendUrl);
        if (!/\bapi\b/i.test(u.pathname)) {
            u.pathname = (u.pathname.replace(/\/*$/, "") || "") + "/api";
        }
        backendUrl = u.toString().replace(/\/$/, "");

        console.log("🔧 Backend configuration:", {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "not set",
            NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "not set",
            normalizedFrom: original,
            resolved: backendUrl,
        });
    } catch (e) {
        // Fallback to window origin /api if parsing fails
        const origin = typeof window !== "undefined" ? window.location.origin : "https://sow.qandu.me";
        backendUrl = `${origin}/api`;
    }

    return { backendUrl };
};

// Infrastructure health check function
const checkBackendHealth = async (backendUrl: string): Promise<boolean> => {
    try {
        console.log(`🏥 Checking backend health: ${backendUrl}`);
        const healthEndpoint = `${backendUrl}/health`;
        const response = await fetch(healthEndpoint, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        const isHealthy = response.ok;
        console.log(
            `🏥 Backend health check: ${isHealthy ? "✅ HEALTHY" : "❌ UNHEALTHY"} (${response.status})`,
        );
        return isHealthy;
    } catch (error) {
        console.error(`🚨 Backend health check failed:`, error);
        return false;
    }
};

export function useDocumentState({
    mounted,
    viewMode,
    setShowOnboarding,
    setShowGuidedSetup,
}: {
    mounted: boolean;
    viewMode: "dashboard" | "editor";
    setShowOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
    setShowGuidedSetup: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [documents, setDocuments] = useState<Document[]>([]);
    // Removed folders state - using workspaces only (folders and workspaces are the same)
    const [currentDocId, setCurrentDocId] = useState<string | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
    const [currentSOWId, setCurrentSOWId] = useState<string | null>(null);
    const [latestEditorJSON, setLatestEditorJSON] = useState<any | null>(null);
    const editorRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

    useEffect(() => {
        console.log("Loading workspace data, mounted:", mounted);
        if (!mounted) return;

        const abortController = new AbortController();

        const loadData = async () => {
            setIsLoading(true);
            console.log("📂 Loading folders and SOWs from database...");

            // Perform startup health check
            const { backendUrl } = getBackendConfig();
            const isHealthy = await checkBackendHealth(backendUrl);
            setBackendHealthy(isHealthy);

            await ensureUnfiledFolder();

            const urlParams = new URLSearchParams(window.location.search);
            const initialDocId = urlParams.get("docId");
            const hasCompletedSetup = undefined;

            try {
                const foldersResponse = await fetch("/api/folders", {
                    signal: abortController.signal,
                });
                const foldersData = await foldersResponse.json();
                console.log(
                    "✅ Loaded folders from database:",
                    foldersData.length,
                );

                const sowsResponse = await fetch("/api/sow/list", {
                    signal: abortController.signal,
                });
                const { sows } = await sowsResponse.json();
                const dbSOWs = sows;
                console.log("✅ Loaded SOWs from database:", dbSOWs.length);

                const workspacesWithSOWs: Workspace[] = [];
                const documentsFromDB: Document[] = [];

                // Convert folders from database to workspaces (they're the same thing)
                for (const folder of foldersData) {
                    console.log(
                        `📁 Processing workspace: ${folder.name} (ID: ${folder.id})`,
                    );

                    const folderSOWs = dbSOWs
                        .filter((sow: any) => sow.folder_id === folder.id)
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
                        `   ✓ Found ${sows.length} SOWs in this workspace`,
                    );

                    // Create workspace with all metadata
                    const workspace: Workspace = {
                        id: folder.id,
                        name: folder.name,
                        sows: sows,
                        workspace_slug: folder.workspace_slug,
                        slug: folder.workspace_slug,
                        workspaceSlug: folder.workspace_slug,
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
                            threadSlug: sow.thread_slug || undefined,
                            syncedAt: sow.updated_at,
                            vertical: sow.vertical || null,
                            service_line: sow.service_line || null,
                        });
                    }
                }

                console.log(
                    "✅ Total workspaces loaded:",
                    workspacesWithSOWs.length,
                );
                console.log("✅ Total SOWs loaded:", documentsFromDB.length);

                setWorkspaces(workspacesWithSOWs);
                // Folders and workspaces are the same - use workspaces only
                setDocuments(documentsFromDB);

                if (workspacesWithSOWs.length > 0 && !currentWorkspaceId) {
                    setCurrentWorkspaceId(workspacesWithSOWs[0].id);
                }

                if (workspacesWithSOWs.length === 0) {
                    setTimeout(() => {
                        setShowOnboarding(true);
                    }, 500);
                }

                if (!hasCompletedSetup && workspacesWithSOWs.length === 0) {
                    setTimeout(() => setShowGuidedSetup(true), 1000);
                }
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    console.log(
                        "📂 Data loading cancelled (previous request superseded)",
                    );
                    return;
                }
                console.error("❌ Error loading data:", error);
                toast.error("Failed to load workspaces and SOWs");
            }
            setIsLoading(false);
            if (initialDocId) {
                setCurrentDocId(initialDocId);
                setCurrentSOWId(initialDocId);
            }
        };

        loadData();

        return () => {
            console.log("🧹 Cleaning up workspace data loading");
            abortController.abort();
        };
    }, [mounted]);

    useEffect(() => {
        if (!currentSOWId) return;

        console.log("📄 Loading document for SOW:", currentSOWId);

        const doc = documents.find((d) => d.id === currentSOWId);

        if (doc) {
            console.log("✅ Found document:", doc.title);
            setCurrentDocId(doc.id);
        } else {
            console.warn("⚠️ Document not found for SOW:", currentSOWId);
            toast.error(
                "Document not found. It may have been deleted or moved.",
            );
            setCurrentDocId(null);
        }
    }, [currentSOWId, documents]);

    useEffect(() => {
        if (!currentDocId || latestEditorJSON === null) return;

        const timer = setTimeout(async () => {
            try {
                // Validate currentDocId exists and is valid
                if (!currentDocId || currentDocId.startsWith("temp-")) {
                    console.log(
                        "⏭️ Skipping auto-save for temporary or invalid document:",
                        currentDocId,
                    );
                    return;
                }

                const editorContent =
                    editorRef.current?.getContent?.() || latestEditorJSON;

                if (!editorContent) {
                    console.warn(
                        "⚠️ No editor content to save for:",
                        currentDocId,
                    );
                    return;
                }

                // Validate document exists in local state
                const currentDoc = documents.find((d) => d.id === currentDocId);
                if (!currentDoc) {
                    console.warn(
                        "⚠️ Document not found in state, skipping auto-save:",
                        currentDocId,
                    );
                    return;
                }

                const pricingRows = extractPricingFromContent(editorContent);

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

                // Ensure content is properly serialized as JSON string
                const contentToSave =
                    typeof editorContent === "string"
                        ? editorContent
                        : JSON.stringify(editorContent);

                console.log(`💾 Auto-saving SOW ${currentDocId}...`);

                // Prefer local Next.js API route for save; fallback to remote if needed
                const localEndpoint = `/api/sow/${currentDocId}`;
                console.log(`🔗 Auto-save endpoint (local): ${localEndpoint}`);

                let response = await fetch(localEndpoint, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        content: contentToSave,
                        title: currentDoc.title || "Untitled SOW",
                        total_investment: isNaN(totalInvestment)
                            ? 0
                            : totalInvestment,
                        vertical: currentDoc.vertical || null,
                        service_line: currentDoc.service_line || null,
                    }),
                });

                if (!response.ok) {
                    // Fallback to remote backend if local fails
                    const { backendUrl } = getBackendConfig();
                    const remoteEndpoint = `${backendUrl}/api/sow/${currentDocId}`;
                    console.warn(
                        "⚠️ Local save failed, attempting remote endpoint:",
                        remoteEndpoint,
                    );
                    try {
                        response = await fetch(remoteEndpoint, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "application/json",
                            },
                            body: JSON.stringify({
                                content: contentToSave,
                                title: currentDoc.title || "Untitled SOW",
                                total_investment: isNaN(totalInvestment)
                                    ? 0
                                    : totalInvestment,
                                vertical: currentDoc.vertical || null,
                                service_line: currentDoc.service_line || null,
                            }),
                        });
                    } catch (fallbackErr) {
                        console.error(
                            "❌ Remote save attempt failed:",
                            fallbackErr,
                        );
                    }
                }

                if (!response.ok) {
                    const errorText = await response
                        .text()
                        .catch(() => "Unknown error");
                    console.error(
                        "❌ Auto-save failed for SOW:",
                        currentDocId,
                        "Status:",
                        response.status,
                        "URL:",
                        response.url || localEndpoint,
                        "Error:",
                        errorText,
                    );

                    // Enhanced error handling for different failure modes
                    if (response.status === 404) {
                        console.warn(
                            "📄 Document not found in backend, may need to be created first",
                        );
                    } else if (response.status >= 500) {
                        console.error("🚨 Backend service error detected");
                        toast.error(
                            "Backend service unavailable - auto-save failed",
                        );
                    } else if (
                        response.status === 401 ||
                        response.status === 403
                    ) {
                        console.error("🔒 Authentication/authorization error");
                        toast.error("Authentication error - please refresh");
                    } else {
                        toast.error(`Auto-save failed: ${response.status}`);
                    }
                } else {
                    console.log(
                        "✅ Auto-save success for",
                        currentDocId,
                        `(Total: $${(isNaN(totalInvestment) ? 0 : totalInvestment).toFixed(2)})`,
                        "to",
                        localEndpoint,
                    );
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                console.error(
                    "❌ CRITICAL: Auto-save network failure:",
                    errorMessage,
                );
                const { backendUrl } = getBackendConfig();
                const failedEndpoint = `${backendUrl}/api/sow/${currentDocId}`;

                console.error("🔍 Failed endpoint:", failedEndpoint);
                console.error("🔧 Backend config:", getBackendConfig());
                console.error("📊 Error details:", error);

                // Enhanced error categorization for infrastructure failures
                if (
                    errorMessage.includes("Failed to fetch") ||
                    errorMessage.includes("NetworkError") ||
                    errorMessage.includes("ERR_NETWORK") ||
                    errorMessage.includes("ERR_INTERNET_DISCONNECTED")
                ) {
                    console.error(
                        "🚨 INFRASTRUCTURE FAILURE: Backend service unreachable",
                        {
                            ...getBackendConfig(),
                            currentDocId,
                            failedEndpoint,
                            error: errorMessage,
                        },
                    );
                    toast.error(
                        "🚨 Backend service unreachable - check infrastructure",
                    );
                } else if (errorMessage.includes("TypeError")) {
                    console.error(
                        "🔧 ENDPOINT CONSTRUCTION ERROR:",
                        errorMessage,
                    );
                    toast.error("Configuration error - invalid API endpoint");
                } else {
                    console.error("❓ UNKNOWN AUTO-SAVE ERROR:", errorMessage);
                    toast.error("Auto-save error occurred");
                }
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [latestEditorJSON, currentDocId]);

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

    const currentDoc = documents.find((d) => d.id === currentDocId);

    useEffect(() => {
        if (currentDoc && editorRef.current) {
            console.log("📄 Loading content for SOW", currentDocId, "...");
            editorRef.current.commands?.setContent
                ? editorRef.current.commands.setContent(currentDoc.content)
                : editorRef.current.insertContent(currentDoc.content);
            console.log("✅ LOAD SUCCESS for", currentDocId);
        }
    }, [currentDocId]);

    return {
        documents,
        setDocuments,
        // Removed folders - using workspaces only
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
        isLoading,
    };
}
