"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Document, Folder, Workspace, SOW, MultiScopeData } from "@/types";
import { anythingLLM } from "@/lib/anythingllm";
import { defaultEditorContent } from "@/lib/content";
import {
    ensureUnfiledFolder,
    UNFILED_FOLDER_ID,
} from "@/lib/ensure-unfiled-folder";
import { extractPricingFromContent, calculateTotals } from "@/lib/export-utils";

interface UseWorkspacesProps {
    editorRef?: any;
    latestEditorJSON?: any;
    agents?: any[];
}

export function useWorkspaces({
    editorRef,
    latestEditorJSON,
    agents,
}: UseWorkspacesProps = {}) {
    // State variables
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentDocId, setCurrentDocId] = useState<string | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
    const [currentSOWId, setCurrentSOWId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load workspaces, folders, and documents
    useEffect(() => {
        if (!mounted) return;

        const loadData = async () => {
            try {
                setIsLoading(true);
                // Load folders
                const foldersResponse = await fetch("/api/folders");
                if (foldersResponse.ok) {
                    const foldersData = await foldersResponse.json();
                    setFolders(foldersData);
                }

                // Load workspaces with SOWs
                const workspacesResponse = await fetch("/api/workspaces");
                if (workspacesResponse.ok) {
                    const workspacesData = await workspacesResponse.json();
                    setWorkspaces(workspacesData);
                }

                // Load documents
                const documentsResponse = await fetch("/api/documents");
                if (documentsResponse.ok) {
                    const documentsData = await documentsResponse.json();
                    setDocuments(documentsData);
                }
            } catch (error) {
                console.error("Error loading data:", error);
                setError(error as Error);
                toast.error("Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [mounted]);

    // Create a new document
    const handleNewDoc = useCallback(
        async (folderId: string, agentId?: string) => {
            const newId = `doc_${Date.now()}`;
            const title = "New Document";
            const targetFolderId = folderId || UNFILED_FOLDER_ID;

            // Find the target folder
            const parentFolder = folders.find((f) => f.id === targetFolderId);
            if (!parentFolder) {
                toast.error("Folder not found");
                return;
            }

            const workspaceSlug = parentFolder.workspaceSlug;
            const isUnfiledFolder = targetFolderId === UNFILED_FOLDER_ID;

            // Create the new document
            let newDoc: Document = {
                id: newId,
                title,
                content: defaultEditorContent,
                folderId: targetFolderId,
                workspaceSlug,
                threadSlug: null,
                syncedAt: null,
            };

            // Create a thread if we're not in the unfiled folder and have an agent
            if (!isUnfiledFolder && agentId) {
                try {
                    const thread =
                        await anythingLLM.createThread(workspaceSlug);
                    if (thread?.slug) {
                        const threadSlug = thread.slug;
                        const threadId = thread.id;
                        const syncedAt = new Date().toISOString();

                        // Update document with thread info
                        newDoc = {
                            ...newDoc,
                            threadSlug,
                            syncedAt,
                        };
                    }
                } catch (error) {
                    console.error("Error creating thread:", error);
                    toast.error("Failed to create thread");
                }
            }

            // Create initial SOW content if architect agent
            if (agentId) {
                const agent = agents.find((a) => a.id === agentId);
                if (agent?.name?.toLowerCase().includes("architect")) {
                    // Create initial SOW content with architect
                    try {
                        // Architect generation isn't implemented via AnythingLLM service method name in this refactor.
                        // We'll keep default editor content for now and skip server SOW generation.
                        // Future improvement: call correct anythingLLM API to generate initial SOW content.
                    } catch (error) {
                        console.error("Error generating initial SOW:", error);
                        toast.error("Failed to generate initial SOW");
                    }
                }
            }

            // Save the document
            try {
                const saveResponse = await fetch("/api/documents", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: newDoc.title,
                        content: newDoc.content,
                        folder_id: newDoc.folderId,
                        workspace_slug: newDoc.workspaceSlug,
                        client_name: newDoc.clientName,
                        client_email: newDoc.clientEmail,
                        total_investment: newDoc.totalInvestment,
                    }),
                });

                if (saveResponse.ok) {
                    const savedDoc = await saveResponse.json();

                    // Update state with the saved document
                    setDocuments((prev) => [...prev, savedDoc]);

                    // Select the new document
                    setCurrentDocId(savedDoc.id);

                    // Update folders to include the new SOW
                    if (newDoc.folderId) {
                        setFolders((prev) =>
                            prev.map((folder) => {
                                if (folder.id === newDoc.folderId) {
                                    return {
                                        ...folder,
                                        sowIds: [
                                            ...(folder.sowIds || []),
                                            savedDoc.id,
                                        ],
                                    };
                                }
                                return folder;
                            }),
                        );
                    }

                    toast.success("Document created successfully");
                } else {
                    toast.error("Failed to save document");
                }
            } catch (error) {
                console.error("Error creating document:", error);
                toast.error("Failed to create document");
            }
        },
        [folders, agents],
    );

    // Select a document
    const handleSelectDoc = useCallback(
        async (docId: string | null) => {
            if (docId === currentDocId) return;

            // Save current document if there is one
            if (currentDocId) {
                await saveCurrentSOWNow();
            }

            // Update current document ID
            setCurrentDocId(docId);

            // Update URL params
            const url = new URL(window.location.href);
            if (docId) {
                url.searchParams.set("doc", docId);
            } else {
                url.searchParams.delete("doc");
            }
            window.history.replaceState({}, "", url.toString());

            // Load chat history if document has a thread
            if (docId) {
                const doc = documents.find((d) => d.id === docId);
                if (doc?.threadSlug) {
                    try {
                        // This would load chat history from the API
                        // Implementation depends on your chat system
                        console.log(
                            "Loading chat history for thread:",
                            doc.threadSlug,
                        );
                    } catch (error) {
                        console.error("Error loading chat history:", error);
                    }
                }
            }
        },
        [currentDocId, documents],
    );

    // Save current SOW
    const saveCurrentSOWNow = useCallback(async () => {
        if (!currentDocId) return;

        try {
            // Get content from editor
            const editorContent = editorRef.current?.getEditor?.()?.getJSON();

            if (!editorContent) {
                console.warn("No editor content available");
                return;
            }

            const contentType = editorRef.current?.getContentType?.();
            const isDoc = contentType === "doc";

            if (!isDoc) {
                console.warn("Not a document, skipping save");
                return;
            }

            // Extract pricing data from content
            const pricingRows = extractPricingFromContent(editorContent);
            const priceTotals = calculateTotals(pricingRows || []);

            // Get current document
            const doc = documents.find((d) => d.id === currentDocId);
            if (!doc) return;

            // Prepare update data
            const updateData = {
                content: editorContent,
                lastModified: Date.now(),
            };

            // Add pricing data if available
            if (pricingRows && pricingRows.length > 0) {
                Object.assign(updateData, {
                    totalInvestment: priceTotals.grandTotal,
                    vertical: "",
                    serviceLine: "",
                });
            }

            // Save to API
            const response = await fetch(`/api/documents/${currentDocId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                const updatedDoc = await response.json();

                // Update documents state
                setDocuments((prev) =>
                    prev.map((d) => (d.id === currentDocId ? updatedDoc : d)),
                );

                console.log("Document saved successfully");
            } else {
                toast.error("Failed to save document");
            }
        } catch (error) {
            console.error("Error saving document:", error);
            toast.error("Failed to save document");
        }
    }, [currentDocId, documents, editorRef]);

    // Create a new folder

    // Create a new workspace with SOW
    const handleCreateWorkspace = useCallback(
        async (workspaceName: string, sowTitle: string) => {
            const workspaceId = `ws_${Date.now()}`;
            const folderId = `folder_${Date.now()}`;

            try {
                // Create workspace in AnythingLLM
                const workspace =
                    await anythingLLM.createOrGetClientFacingWorkspace(
                        workspaceName,
                    );
                if (!workspace?.slug) {
                    throw new Error("Failed to create workspace");
                }

                const embedId = workspace.slug;

                // Create folder in our DB
                const folderResponse = await fetch("/api/folders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: folderId,
                        workspaceSlug: workspace.slug,
                        workspaceId,
                        embedId,
                    }),
                });

                if (!folderResponse.ok) {
                    const errorData = await folderResponse.json();
                    throw new Error(
                        errorData.error || "Failed to create folder",
                    );
                }

                const folderData = await folderResponse.json();

                // Create SOW
                const sowResponse = await fetch("/api/sows", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: sowTitle,
                        content: defaultEditorContent,
                        folderId,
                    }),
                });

                if (!sowResponse.ok) {
                    throw new Error("Failed to create SOW");
                }

                const sowData = await sowResponse.json();
                const sowId = sowData.id;

                // Create thread in AnythingLLM
                const thread = await anythingLLM.createThread(workspace.slug);
                if (!thread?.slug) {
                    throw new Error("Failed to create thread");
                }

                // Update folder with SOW
                setFolders((prev) =>
                    prev.map((f) =>
                        f.id === folderId ? { ...f, sowIds: [sowId] } : f,
                    ),
                );

                // Create new document
                const newDoc: Document = {
                    id: sowId,
                    title: sowTitle,
                    content: defaultEditorContent,
                    folderId,
                    workspaceSlug: workspace.slug,
                    threadSlug: thread.slug,
                    syncedAt: new Date().toISOString(),
                };

                // Add document to state
                setDocuments((prev) => [...prev, newDoc]);

                // Create new workspace in state
                const newWorkspace: Workspace = {
                    id: workspaceId,
                    name: workspaceName,
                    sows: [
                        {
                            id: sowId,
                            name: sowTitle,
                            workspaceId,
                        },
                    ],
                    workspace_slug: workspace.slug,
                };

                setWorkspaces((prev) => [...prev, newWorkspace]);

                // Set current workspace and SOW
                setCurrentWorkspaceId(workspaceId);
                setCurrentSOWId(sowId);

                toast.success("Workspace created successfully");
                return newWorkspace;
            } catch (error) {
                console.error("Error creating workspace:", error);
                toast.error("Failed to create workspace");
            }
        },
        [],
    );

    const createWorkspaceCompat = useCallback(
        async (payload: any) => {
            if (!payload) return null;
            if (typeof payload === "string") {
                return await handleCreateWorkspace(payload, "");
            }
            if (typeof payload === "object" && payload.name) {
                return await handleCreateWorkspace(
                    payload.name,
                    payload.sowTitle || "",
                );
            }
            return null;
        },
        [handleCreateWorkspace],
    );

    // Rename a workspace
    const handleRenameWorkspace = useCallback(
        async (workspaceId: string, newName: string) => {
            try {
                const response = await fetch(`/api/workspaces/${workspaceId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: newName }),
                });

                if (response.ok) {
                    // Update workspace in state
                    setWorkspaces((prev) =>
                        prev.map((w) =>
                            w.id === workspaceId ? { ...w, name: newName } : w,
                        ),
                    );

                    toast.success("Workspace renamed successfully");
                } else {
                    toast.error("Failed to rename workspace");
                }
            } catch (error) {
                console.error("Error renaming workspace:", error);
                toast.error("Failed to rename workspace");
            }
        },
        [],
    );

    // Delete a workspace
    const handleDeleteWorkspace = useCallback(
        async (workspaceId: string) => {
            try {
                const workspace = workspaces.find((w) => w.id === workspaceId);
                if (!workspace) return;

                // Delete workspace from database
                const dbResponse = await fetch(
                    `/api/workspaces/${workspaceId}`,
                    {
                        method: "DELETE",
                    },
                );

                if (!dbResponse.ok) {
                    throw new Error("Failed to delete workspace from database");
                }

                // Delete from AnythingLLM
                if (workspace.workspace_slug) {
                    await anythingLLM.deleteWorkspace(workspace.workspace_slug);
                }

                // Remove workspace from state
                setWorkspaces((prev) =>
                    prev.filter((w) => w.id !== workspaceId),
                );

                // If this was the current workspace, reset current workspace
                if (currentWorkspaceId === workspaceId) {
                    setCurrentWorkspaceId("");
                    setCurrentSOWId(null);
                }

                toast.success("Workspace deleted successfully");
            } catch (error) {
                console.error("Error deleting workspace:", error);
                toast.error("Failed to delete workspace");
            }
        },
        [workspaces, currentWorkspaceId],
    );

    // Create a new SOW in a workspace
    const handleCreateSOW = useCallback(
        async (workspaceId: string, sowTitle: string) => {
            const folder = folders.find((f) => f.workspaceId === workspaceId);
            if (!folder) {
                toast.error("Workspace folder not found");
                return;
            }

            const isUnfiledFolder = folder.id === UNFILED_FOLDER_ID;

            try {
                // Create a temporary thread slug for the SOW
                const tempThreadSlug = `sow_${Date.now()}`;

                // Create a temporary document
                const tempDoc: Document = {
                    id: `temp_${Date.now()}`,
                    title: sowTitle,
                    content: defaultEditorContent,
                    folderId: folder.id,
                    workspaceSlug: folder.workspaceSlug,
                    threadSlug: tempThreadSlug,
                    syncedAt: new Date().toISOString(),
                };

                // Add to documents temporarily
                setDocuments((prev) => [...prev, tempDoc]);

                // Create SOW in database
                const newSOW: SOW = {
                    id: tempDoc.id,
                    name: sowTitle,
                    workspaceId,
                };

                // Update workspace SOWs
                setWorkspaces((prev) =>
                    prev.map((w) =>
                        w.id === workspaceId
                            ? { ...w, sows: [...(w.sows || []), newSOW] }
                            : w,
                    ),
                );

                // Create thread in AnythingLLM if not unfiled
                if (!isUnfiledFolder && folder.workspaceSlug) {
                    const thread = await anythingLLM.createThread(
                        folder.workspaceSlug,
                    );
                    if (thread?.slug) {
                        // Update document with actual thread slug
                        setDocuments((prev) =>
                            prev.map((d) =>
                                d.id === tempDoc.id
                                    ? {
                                          ...d,
                                          threadSlug: thread.slug,
                                          syncedAt: new Date().toISOString(),
                                      }
                                    : d,
                            ),
                        );
                    }
                }

                // Update folder SOWs
                setFolders((prev) =>
                    prev.map((f) =>
                        f.id === folder.id
                            ? {
                                  ...f,
                                  sowIds: [...(f.sowIds || []), tempDoc.id],
                              }
                            : f,
                    ),
                );

                // Set current SOW
                setCurrentSOWId(tempDoc.id);
                setCurrentDocId(tempDoc.id);

                toast.success("SOW created successfully");
            } catch (error) {
                console.error("Error creating SOW:", error);
                toast.error("Failed to create SOW");
            }
        },
        [folders],
    );

    // Rename a SOW
    const handleRenameSOW = useCallback(
        async (sowId: string, newName: string) => {
            try {
                // Update document
                const response = await fetch(`/api/documents/${sowId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title: newName }),
                });

                if (response.ok) {
                    // Update document in state
                    setDocuments((prev) =>
                        prev.map((d) =>
                            d.id === sowId ? { ...d, title: newName } : d,
                        ),
                    );

                    // Update SOW in workspaces
                    setWorkspaces((prev) =>
                        prev.map((w) => {
                            if (!w.sows) return w;

                            const hasSOW = w.sows.some((s) => s.id === sowId);
                            if (hasSOW) {
                                return {
                                    ...w,
                                    sows: w.sows.map((s) =>
                                        s.id === sowId
                                            ? { ...s, name: newName }
                                            : s,
                                    ),
                                };
                            }

                            return w;
                        }),
                    );

                    toast.success("SOW renamed successfully");
                } else {
                    toast.error("Failed to rename SOW");
                }
            } catch (error) {
                console.error("Error renaming SOW:", error);
                toast.error("Failed to rename SOW");
            }
        },
        [],
    );

    // Delete a SOW
    const handleDeleteSOW = useCallback(
        async (sowId: string) => {
            try {
                // Delete document
                const response = await fetch(`/api/documents/${sowId}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    // Remove document from state
                    setDocuments((prev) => prev.filter((d) => d.id !== sowId));

                    // Update workspaces
                    setWorkspaces((prev) =>
                        prev.map((w) => {
                            if (!w.sows) return w;

                            return {
                                ...w,
                                sows: w.sows.filter((s) => s.id !== sowId),
                            };
                        }),
                    );

                    // Update folders
                    setFolders((prev) =>
                        prev.map((f) => {
                            if (!f.sowIds) return f;

                            return {
                                ...f,
                                sowIds: f.sowIds.filter((id) => id !== sowId),
                            };
                        }),
                    );

                    // If this was the current SOW, reset current SOW
                    if (currentSOWId === sowId) {
                        setCurrentSOWId(null);
                        if (currentDocId === sowId) {
                            setCurrentDocId(null);
                        }
                    }

                    toast.success("SOW deleted successfully");
                } else {
                    toast.error("Failed to delete SOW");
                }
            } catch (error) {
                console.error("Error deleting SOW:", error);
                toast.error("Failed to delete SOW");
            }
        },
        [currentSOWId, currentDocId],
    );

    // Move a SOW between workspaces
    const handleMoveSOW = useCallback(
        async (
            sowId: string,
            fromWorkspaceId: string,
            toWorkspaceId: string,
            insertAt?: number,
        ) => {
            try {
                const fromWs = workspaces.find((w) => w.id === fromWorkspaceId);
                const toWs = workspaces.find((w) => w.id === toWorkspaceId);

                if (!fromWs || !toWs) {
                    toast.error("Workspace not found");
                    return;
                }

                // Remove SOW from source workspace
                const newFromSows =
                    fromWs.sows?.filter((s) => s.id !== sowId) || [];

                // Insert SOW into target workspace
                let newToSows = [...(toWs.sows || [])];
                const movingSOW = fromWs.sows?.find((s) => s.id === sowId);

                if (movingSOW) {
                    movingSOW.workspaceId = toWorkspaceId;

                    if (insertAt !== undefined && insertAt >= 0) {
                        newToSows.splice(insertAt, 0, movingSOW);
                    } else {
                        newToSows.push(movingSOW);
                    }
                }

                // Update workspace SOWs in state
                setWorkspaces((prev) =>
                    prev.map((w) => {
                        if (w.id === fromWorkspaceId) {
                            return { ...w, sows: newFromSows };
                        }

                        if (w.id === toWorkspaceId) {
                            return { ...w, sows: newToSows };
                        }

                        return w;
                    }),
                );

                // Update document in database
                const toFolder = folders.find(
                    (f) => f.workspaceId === toWorkspaceId,
                );
                if (toFolder) {
                    const response = await fetch(`/api/documents/${sowId}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ folderId: toFolder.id }),
                    });

                    if (!response.ok) {
                        toast.error("Failed to update document folder");
                        return;
                    }
                }

                // Update document in state
                setDocuments((prev) =>
                    prev.map((d) =>
                        d.id === sowId ? { ...d, folderId: toFolder?.id } : d,
                    ),
                );

                // Update folder SOWs
                setFolders((prev) =>
                    prev.map((f) => {
                        let updatedFolder = { ...f };

                        if (f.workspaceId === fromWorkspaceId) {
                            updatedFolder.sowIds =
                                f.sowIds?.filter((id) => id !== sowId) || [];
                        }

                        if (f.workspaceId === toWorkspaceId) {
                            updatedFolder.sowIds = [...(f.sowIds || []), sowId];
                        }

                        return updatedFolder;
                    }),
                );

                toast.success("SOW moved successfully");
            } catch (error) {
                console.error("Error moving SOW:", error);
                toast.error("Failed to move SOW");
            }
        },
        [workspaces, folders],
    );

    // Reorder SOWs within a workspace
    const handleReorderSOWs = useCallback(
        (workspaceId: string, sowIds: string[]) => {
            // Update workspace with new SOW order
            setWorkspaces((prev) =>
                prev.map((w) => {
                    if (w.id === workspaceId) {
                        const newSows = sowIds
                            .map((id) => w.sows?.find((s) => s.id === id))
                            .filter(Boolean) as SOW[];
                        return { ...w, sows: newSows };
                    }
                    return w;
                }),
            );

            toast.success("SOWs reordered successfully");
        },
        [],
    );

    // Handle document actions
    const handleRenameDoc = useCallback(
        async (docId: string, newName: string) => {
            try {
                const doc = documents.find((d) => d.id === docId);
                if (!doc) return;

                const response = await fetch(`/api/documents/${docId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title: newName }),
                });

                if (response.ok) {
                    const syncedAt = new Date().toISOString();

                    // Update document in state
                    setDocuments((prev) =>
                        prev.map((d) =>
                            d.id === docId
                                ? { ...d, title: newName, syncedAt }
                                : d,
                        ),
                    );

                    // Update SOW in workspaces
                    setWorkspaces((prev) =>
                        prev.map((w) => {
                            if (!w.sows) return w;

                            const hasSOW = w.sows.some((s) => s.id === docId);
                            if (hasSOW) {
                                return {
                                    ...w,
                                    sows: w.sows.map((s) =>
                                        s.id === docId
                                            ? { ...s, name: newName }
                                            : s,
                                    ),
                                };
                            }

                            return w;
                        }),
                    );

                    toast.success("Document renamed successfully");
                } else {
                    toast.error("Failed to rename document");
                }
            } catch (error) {
                console.error("Error renaming document:", error);
                toast.error("Failed to rename document");
            }
        },
        [documents],
    );

    const handleDeleteDoc = useCallback(
        async (docId: string) => {
            try {
                const doc = documents.find((d) => d.id === docId);
                if (!doc) return;

                const response = await fetch(`/api/documents/${docId}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    // Remove document from state
                    setDocuments((prev) => prev.filter((d) => d.id !== docId));

                    // Update workspaces
                    setWorkspaces((prev) =>
                        prev.map((w) => {
                            if (!w.sows) return w;

                            return {
                                ...w,
                                sows: w.sows.filter((s) => s.id !== docId),
                            };
                        }),
                    );

                    // Update folders
                    setFolders((prev) =>
                        prev.map((f) => {
                            if (!f.sowIds) return f;

                            return {
                                ...f,
                                sowIds: f.sowIds.filter((id) => id !== docId),
                            };
                        }),
                    );

                    // If this was the current document, reset current document
                    if (currentDocId === docId) {
                        setCurrentDocId(null);
                        if (currentSOWId === docId) {
                            setCurrentSOWId(null);
                        }
                    }

                    toast.success("Document deleted successfully");
                } else {
                    toast.error("Failed to delete document");
                }
            } catch (error) {
                console.error("Error deleting document:", error);
                toast.error("Failed to delete document");
            }
        },
        [documents, currentDocId, currentSOWId],
    );

    const handleNewFolder = useCallback(
        async (name: string, parentId?: string) => {
            const newId = `folder_${Date.now()}`;
            try {
                // Create an AnythingLLM workspace for this folder
                const workspace =
                    await anythingLLM.createOrGetClientFacingWorkspace(name);
                if (!workspace?.slug) {
                    throw new Error("Failed to create workspace");
                }

                const embedId = workspace.slug;

                // Create a corresponding folder in our DB
                const response = await fetch("/api/folders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: newId,
                        name,
                        parentId: parentId || null,
                        workspaceSlug: workspace.slug,
                        workspaceId: workspace.id,
                        embedId,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || "Failed to create folder",
                    );
                }

                const savedFolder = await response.json();

                const newFolder: Folder = {
                    id: savedFolder.id || newId,
                    name,
                    parentId: parentId || undefined,
                    workspaceSlug: workspace.slug,
                    workspaceId: workspace.id,
                    embedId,
                    syncedAt: savedFolder.syncedAt || new Date().toISOString(),
                } as Folder;

                // Update local state
                setFolders((prev) => [...prev, newFolder]);

                toast.success("Folder created successfully");

                // Optionally auto create a document in the new folder
                await handleNewDoc(newFolder.id);

                return savedFolder;
            } catch (error) {
                console.error("Error creating folder:", error);
                toast.error("Failed to create folder");
                return null;
            }
        },
        [handleNewDoc, setFolders],
    );

    const handleRenameFolder = useCallback(
        async (folderId: string, newName: string) => {
            try {
                const folder = folders.find((f) => f.id === folderId);
                if (!folder) return;

                const response = await fetch(`/api/folders/${folderId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: newName }),
                });

                if (response.ok) {
                    const syncedAt = new Date().toISOString();

                    // Update folder in state
                    setFolders((prev) =>
                        prev.map((f) =>
                            f.id === folderId
                                ? { ...f, name: newName, syncedAt }
                                : f,
                        ),
                    );

                    toast.success("Folder renamed successfully");
                } else {
                    toast.error("Failed to rename folder");
                }
            } catch (error) {
                console.error("Error renaming folder:", error);
                toast.error("Failed to rename folder");
            }
        },
        [folders],
    );

    const handleDeleteFolder = useCallback(
        async (folderId: string) => {
            try {
                const folder = folders.find((f) => f.id === folderId);
                if (!folder) return;

                // Check if folder has SOWs
                const toDelete = folder.sowIds?.length || 0;
                if (toDelete > 0) {
                    const confirmDelete = confirm(
                        `This folder contains ${toDelete} document(s). Are you sure you want to delete it?`,
                    );
                    if (!confirmDelete) return;

                    // Delete all SOWs in the folder
                    const deleteRecursive = async () => {
                        if (folder.sowIds) {
                            for (const sowId of folder.sowIds) {
                                await handleDeleteSOW(sowId);
                            }
                        }
                    };

                    await deleteRecursive();
                }

                // Delete folder from API
                const response = await fetch(`/api/folders/${folderId}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    // Remove folder from state
                    setFolders((prev) => prev.filter((f) => f.id !== folderId));

                    toast.success("Folder deleted successfully");
                } else {
                    toast.error("Failed to delete folder");
                }
            } catch (error) {
                console.error("Error deleting folder:", error);
                toast.error("Failed to delete folder");
            }
        },
        [folders, handleDeleteSOW],
    );

    const handleMoveDoc = useCallback(
        (docId: string, fromFolderId: string, toFolderId: string) => {
            try {
                // Update document folder
                setDocuments((prev) =>
                    prev.map((d) =>
                        d.id === docId ? { ...d, folderId: toFolderId } : d,
                    ),
                );

                // Update source folder SOWs
                setFolders((prev) =>
                    prev.map((f) => {
                        if (f.id === fromFolderId) {
                            return {
                                ...f,
                                sowIds:
                                    f.sowIds?.filter((id) => id !== docId) ||
                                    [],
                            };
                        }

                        if (f.id === toFolderId) {
                            return {
                                ...f,
                                sowIds: [...(f.sowIds || []), docId],
                            };
                        }

                        return f;
                    }),
                );

                // Save to API
                fetch(`/api/documents/${docId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ folderId: toFolderId }),
                });

                toast.success("Document moved successfully");
            } catch (error) {
                console.error("Error moving document:", error);
                toast.error("Failed to move document");
            }
        },
        [],
    );

    return {
        // State
        documents,
        setDocuments,
        folders,
        setFolders,
        currentDocId,
        setCurrentDocId,
        workspaces,
        setWorkspaces,
        currentWorkspaceId,
        setCurrentWorkspaceId,
        currentSOWId,
        setCurrentSOWId,

        // Handlers
        saveCurrentSOWNow,
        handleSelectDoc,
        handleNewDoc,
        handleRenameDoc,
        handleDeleteDoc,
        handleNewFolder,
        handleRenameFolder,
        handleDeleteFolder,
        handleMoveDoc,
        handleCreateWorkspace,
        // Aliases for backward compatibility
        createWorkspace: createWorkspaceCompat,
        deleteWorkspace: handleDeleteWorkspace,
        handleRenameWorkspace,
        handleDeleteWorkspace,
        handleCreateSOW,
        handleRenameSOW,
        handleDeleteSOW,
        handleMoveSOW,
        handleReorderSOWs,
        isLoading,
        error,
    };
}

// Export as default for compatibility
export default useWorkspaces;
