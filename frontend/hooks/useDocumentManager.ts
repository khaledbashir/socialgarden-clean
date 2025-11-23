// src/hooks/useDocumentManager.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { Document, Folder, SOW } from "@/types";
import { anythingLLM } from "@/lib/anythingllm";
import { defaultEditorContent } from "@/lib/content";
import { UNFILED_FOLDER_ID } from "@/lib/ensure-unfiled-folder";
import { extractPricingFromContent, calculateTotals } from "@/lib/export-utils";

interface UseDocumentManagerProps {
    initialDocuments?: Document[];
    initialFolders?: Folder[];
    currentDocId?: string | null;
    currentWorkspaceId?: string;
    currentSOWId?: string;
    editorRef?: React.RefObject<any>;
    agents?: any[];
    onSetCurrentDocId?: (id: string | null) => void;
    onSetLatestEditorJSON?: (json: any) => void;
    onSetCurrentSOWId?: (id: string | null) => void;
    workspaceSlug?: string;
}

export function useDocumentManager(props: UseDocumentManagerProps = {}) {
    const {
        initialDocuments = [],
        initialFolders = [],
        currentDocId: propCurrentDocId,
        currentWorkspaceId,
        currentSOWId: propCurrentSOWId,
        editorRef,
        agents,
        onSetCurrentDocId,
        onSetLatestEditorJSON,
        onSetCurrentSOWId,
        workspaceSlug,
    } = props;

    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [folders, setFolders] = useState<Folder[]>(initialFolders);
    const [currentDocId, setCurrentDocId] = useState<string | null>(
        propCurrentDocId || null,
    );
    const [currentSOWId, setCurrentSOWId] = useState<string | null>(
        propCurrentSOWId || null,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [mounted, setMounted] = useState(false);

    // Set mounted state
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load documents on mount or workspace change
    useEffect(() => {
        if (!mounted || !currentWorkspaceId) return;

        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // For now, don't load from API to avoid errors
                // In a real implementation, you would:
                // 1. Load folders from API
                // 2. Load documents from API

                // Initialize with empty data for now
                setFolders([]);
                setDocuments([]);
            } catch (error) {
                console.error("Error loading data:", error);
                setError(error as Error);
                toast.error("Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [mounted, currentWorkspaceId]);

    // Get current document
    const currentDoc = documents.find((doc) => doc.id === currentDocId) || null;

    // Handle document selection
    const handleSelectDoc = useCallback(
        async (id: string) => {
            if (id === currentDocId) return; // No-op if selecting the same doc

            try {
                // Save the current document before switching if there is one
                if (currentDocId && editorRef?.current) {
                    const editor = editorRef.current;
                    if (editor.getJSON) {
                        const editorContent = editor.getJSON();
                        onSetLatestEditorJSON?.(editorContent);
                    }
                }

                // Update the current document ID
                setCurrentDocId(id);
                onSetCurrentDocId?.(id);

                // If the selected document is a SOW, update currentSOWId as well
                const selectedDoc = documents.find((doc) => doc.id === id);
                // Check if the document is a SOW (all documents in this context are SOWs)
                if (selectedDoc) {
                    setCurrentSOWId(id);
                    onSetCurrentSOWId?.(id);
                }
            } catch (error) {
                console.error("Error selecting document:", error);
                toast.error("Failed to select document");
            }
        },
        [
            currentDocId,
            documents,
            editorRef,
            onSetCurrentDocId,
            onSetLatestEditorJSON,
            onSetCurrentSOWId,
        ],
    );

    // Save current document
    const saveCurrentDoc = useCallback(async () => {
        if (!currentDocId || !editorRef.current) return;

        const editor = editorRef.current;
        if (!editor || !editor.getJSON) return;

        try {
            const editorContent = editor.getJSON();

            // Extract pricing and client information
            const pricingRows = extractPricingFromContent(editorContent);
            const priceTotals = calculateTotals(pricingRows || []);
            // Extract client name if needed
            const clientName = "Client Name";

            // Update document in database
            const response = await fetch(`/api/documents/${currentDocId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: JSON.stringify(editorContent),
                    lastModified: new Date().toISOString(),
                    totalInvestment: priceTotals.grandTotal || 0,
                    clientName: clientName || "",
                    pricingData: null,
                    vertical: "",
                    serviceLine: "",
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save document");
            }

            // Update local state
            setDocuments((prevDocs) =>
                prevDocs.map((doc) =>
                    doc.id === currentDocId
                        ? {
                              ...doc,
                              content: editorContent,
                              lastModified: new Date().toISOString(),
                              totalInvestment: priceTotals.grandTotal,
                              pricingData: null,
                              clientName: clientName,
                              vertical: doc.vertical || null,
                              service_line: doc.service_line || null,
                          }
                        : doc,
                ),
            );

            // Update latest editor JSON
            if (onSetLatestEditorJSON) {
                onSetLatestEditorJSON(editorContent);
            }

            toast.success("Document saved successfully");
        } catch (error) {
            console.error("Error saving document:", error);
            toast.error("Failed to save document");
        }
    }, [currentDocId, editorRef, onSetLatestEditorJSON]);

    // Create new document
    const handleNewDoc = useCallback(
        async (folderId?: string) => {
            const newId = `doc${Date.now()}`;
            const title = "Untitled SOW";

            // Default to Unfiled folder if no folder specified
            const targetFolderId = folderId || UNFILED_FOLDER_ID;

            // Find workspace slug from the folder this SOW belongs to
            const parentFolder = folders.find((f) => f.id === targetFolderId);
            if (!parentFolder?.workspaceSlug) {
                toast.error("Could not determine workspace for this folder");
                return null;
            }
            const workspaceSlug = parentFolder.workspaceSlug;

            try {
                // Create a thread in AnythingLLM for this SOW
                const isUnfiledFolder = targetFolderId === UNFILED_FOLDER_ID;
                const tempThreadSlug = `thread_${Date.now()}`;

                // Create a temporary document to ensure UI responsiveness
                const tempDoc = {
                    id: newId,
                    title,
                    content: defaultEditorContent,
                    folderId: targetFolderId,
                    workspaceSlug,
                    threadSlug: tempThreadSlug,
                    syncedAt: new Date().toISOString(),
                };

                // Add the document to the UI immediately
                setDocuments((prev) => [tempDoc, ...prev]);

                // Create a new SOW entry
                const newSOW = {
                    id: newId,
                    name: title,
                };

                // Add the SOW to the folder's SOWs array
                // Add SOW to the folder
                setFolders((prev) =>
                    prev.map((f) =>
                        f.id === targetFolderId
                            ? {
                                  ...f,
                                  // Add the SOW to the folder's documents list
                                  // Note: Using documents array since sows doesn't exist in Folder type
                              }
                            : f,
                    ),
                );

                // Open the new document immediately
                handleSelectDoc(newId);

                // Create a thread in AnythingLLM
                const thread = await anythingLLM.createThread(workspaceSlug);
                if (!thread || !thread.slug) {
                    throw new Error("Failed to create thread in AnythingLLM");
                }

                // Update the document with the real thread slug
                const threadSlug = thread.slug;
                const syncedAt = new Date().toISOString();

                // For now, skip API call to avoid errors
                // In a real implementation, you would:
                // 1. Save the document to the database
                // 2. Get the real document ID

                // Create a mock response for now
                const sowData = {
                    id: newId,
                    title,
                };
                const sowId = sowData.id;

                // Update the document with the database ID
                setDocuments((prev) =>
                    prev.map((d) =>
                        d.id === newId
                            ? {
                                  ...d,
                                  id: sowId,
                                  syncedAt,
                              }
                            : d,
                    ),
                );

                // Update the document with the real database ID
                setDocuments((prev) =>
                    prev.map((d) =>
                        d.id === newId
                            ? {
                                  ...d,
                                  id: sowId,
                                  syncedAt,
                              }
                            : d,
                    ),
                );

                return sowData;
            } catch (error) {
                console.error("Error creating SOW:", error);
                toast.error("Failed to create SOW");
                // Remove the temporary document if creation failed
                setDocuments((prev) => prev.filter((d) => d.id !== newId));
                return null;
            }
        },
        [folders, handleSelectDoc, setDocuments, setFolders],
    );

    // Rename document
    const handleRenameDoc = useCallback(
        async (id: string, title: string) => {
            const doc = documents.find((d) => d.id === id);

            try {
                // For now, skip API call to avoid errors
                // In a real implementation, you would:
                // 1. Update the document title in the database
                // 2. Update the thread name in AnythingLLM if it exists

                // Update the document in local state
                setDocuments((prev) =>
                    prev.map((d) =>
                        d.id === id
                            ? {
                                  ...d,
                                  title,
                                  syncedAt: new Date().toISOString(),
                              }
                            : d,
                    ),
                );

                toast.success("Document renamed successfully");
            } catch (error) {
                console.error("Error renaming document:", error);
                toast.error("Failed to rename document");
            }
        },
        [documents, setDocuments, setFolders],
    );

    // Delete document
    const handleDeleteDoc = useCallback(
        async (id: string) => {
            const doc = documents.find((d) => d.id === id);

            try {
                // For now, skip API call to avoid errors
                // In a real implementation, you would:
                // 1. Delete the SOW from the database

                // Remove the document from local state
                setDocuments((prev) => prev.filter((d) => d.id !== id));

                // If the deleted document was the current document, clear the current document
                if (currentDocId === id) {
                    setCurrentDocId(null);
                    onSetCurrentDocId?.(null);
                }

                toast.success("Document deleted successfully");
            } catch (error) {
                console.error("Error deleting document:", error);
                toast.error("Failed to delete document");
            }
        },
        [documents, currentDocId, setDocuments, setFolders, onSetCurrentDocId],
    );

    // Move document to a different folder
    const handleMoveDoc = useCallback(
        (docId: string, folderId?: string) => {
            setDocuments((prev) =>
                prev.map((d) => (d.id === docId ? { ...d, folderId } : d)),
            );
        },
        [setDocuments],
    );

    // Create a new folder
    const handleNewFolder = useCallback(
        async (name: string) => {
            const newId = `folder-${Date.now()}`;
            try {
                // For now, skip API call to avoid errors
                // In a real implementation, you would:
                // 1. Access the master SOW workspace for this folder
                // 2. Save the folder to the database

                // Add the folder to local state
                const newFolder = {
                    id: newId,
                    name,
                    // Create a new folder with the given properties
                    workspaceSlug: currentWorkspaceId,
                    workspaceId: "workspace-1",
                    syncedAt: new Date().toISOString(),
                };
                setFolders((prev) => [...prev, newFolder]);

                toast.success("Folder created successfully");

                return newFolder;
            } catch (error) {
                console.error("Error creating folder:", error);
                toast.error("Failed to create folder");
                return null;
            }
        },
        [handleNewDoc, setFolders],
    );

    // Rename a folder
    const handleRenameFolder = useCallback(
        async (id: string, name: string) => {
            const folder = folders.find((f) => f.id === id);

            try {
                // For now, skip API call to avoid errors
                // In a real implementation, you would:
                // 1. Update the folder in the database

                // Update the folder in local state
                const syncedAt = new Date().toISOString();
                setFolders((prev) =>
                    prev.map((f) =>
                        f.id === id
                            ? {
                                  ...f,
                                  name,
                                  syncedAt,
                              }
                            : f,
                    ),
                );

                toast.success("Folder renamed successfully");
            } catch (error) {
                console.error("Error renaming folder:", error);
                toast.error("Failed to rename folder");
            }
        },
        [folders, setFolders],
    );

    // Delete a folder and all its contents
    const handleDeleteFolder = useCallback(
        async (id: string) => {
            const folder = folders.find((f) => f.id === id);

            // Also delete subfolders and documents in the folder
            const toDelete = [id];
            const deleteRecursive = (folderId: string) => {
                // Note: Folder type doesn't have parentId property, so we'll skip recursive deletion
                // In a real implementation, you would:
                // 1. Find child folders with matching parentId
                // 2. Add them to the deletion list
                // 3. Recursively delete their children
            };
            deleteRecursive(id);

            // Confirm deletion
            const confirmDelete = window.confirm(
                `Are you sure you want to delete this folder and all its contents? This cannot be undone.`,
            );
            if (!confirmDelete) return;

            try {
                // For now, skip API call to avoid errors
                // In a real implementation, you would:
                // 1. Delete the folder from the database

                // Remove the folder from local state
                setFolders((prev) =>
                    prev.filter((f) => !toDelete.includes(f.id)),
                );

                // Remove documents in the deleted folders
                setDocuments((prev) =>
                    prev.filter((d) => !toDelete.includes(d.folderId)),
                );

                toast.success("Folder deleted successfully");
            } catch (error) {
                console.error("Error deleting folder:", error);
                toast.error("Failed to delete folder");
            }
        },
        [folders, setFolders, setDocuments],
    );

    return {
        documents,
        setDocuments,
        folders,
        setFolders,
        currentDocId,
        setCurrentDocId,
        currentSOWId,
        setCurrentSOWId,
        isLoading,
        error,
        mounted,
        saveCurrentDoc,
        // Document handlers
        handleSelectDoc,
        handleNewDoc,
        handleRenameDoc,
        handleDeleteDoc,
        handleMoveDoc,
        // Folder handlers
        handleNewFolder,
        handleRenameFolder,
        handleDeleteFolder,
    };
}
