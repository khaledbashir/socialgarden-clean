"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import type { Workspace, SOW } from "@/lib/types/sow";
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Plus,
    Trash2,
    Edit3,
    LayoutDashboard,
    Sparkles,
    ChevronLeft,
    GripVertical,
    Settings,
    CheckCircle2,
    FolderPlus,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Folder {
    id: string;
    name: string;
    workspace_slug?: string;
    slug?: string;
}

interface Document {
    id: string;
    title: string;
    folderId: string | null; // null means it's in "All Docs"
    vertical?:
    | "property"
    | "education"
    | "finance"
    | "healthcare"
    | "retail"
    | "hospitality"
    | "professional-services"
    | "technology"
    | "other"
    | null;
    service_line?:
    | "crm-implementation"
    | "marketing-automation"
    | "revops-strategy"
    | "managed-services"
    | "consulting"
    | "training"
    | "other"
    | null;
}

interface SidebarNavProps {
    // New workspace-based props (primary)
    workspaces?: Workspace[];
    documents: Document[];
    currentWorkspaceId?: string;
    currentSOWId?: string | null;

    onSelectWorkspace: (id: string) => void;
    onSelectSOW: (id: string) => void;
    onRenameSOW: (id: string, title: string) => void;
    onDeleteSOW: (id: string) => void;
    onRenameWorkspace: (id: string, name: string) => void;
    onReorderWorkspaces: (workspaces: Workspace[]) => void;
    onMoveSOW: (
        sowId: string,
        fromWorkspaceId: string,
        toWorkspaceId: string,
    ) => void;
    onReorderSOWs: (workspaceId: string, sows: SOW[]) => void;
    onViewChange: (view: "dashboard" | "editor") => void;
    currentView: "dashboard" | "editor";
    onCreateWorkspace: (
        name?: string,
        type?: "sow" | "client" | "generic",
    ) => void;
    onDeleteWorkspace: (id: string) => void;
    onCreateSOW: (workspaceId: string, sowName: string) => Promise<void>;
    onNewDoc?: () => void; // New prop for creating unfiled doc

    // Legacy props for backward compatibility
    folders?: Folder[];
    currentFolderId?: string | null;
    currentDocumentId?: string | null;
    onSelectFolder?: (id: string | null) => void;
    onSelectDocument?: (id: string) => void;
    onCreateFolder?: (name: string) => void;
    onCreateDocument?: (folderId: string | null, name: string) => void;
    onRenameFolder?: (id: string, name: string) => void;
    onDeleteFolder?: (id: string) => void;
    onRenameDocument?: (id: string, title: string) => void;
    onDeleteDocument?: (id: string) => void;
    onMoveDocument?: (
        documentId: string,
        fromFolderId: string | null,
        toFolderId: string | null,
    ) => void;
    onToggleSidebar?: () => void;
}

export default function SidebarNav({
    // New workspace-based props
    workspaces,
    documents,
    currentWorkspaceId,
    currentSOWId,
    onSelectWorkspace,
    onSelectSOW,
    onRenameSOW,
    onDeleteSOW,
    onRenameWorkspace,
    onReorderWorkspaces,
    onMoveSOW,
    onReorderSOWs,
    onViewChange,
    currentView,
    onCreateWorkspace,
    onDeleteWorkspace,
    onCreateSOW,
    onNewDoc,
    // Legacy props
    folders,
    currentFolderId,
    currentDocumentId,
    onSelectFolder,
    onSelectDocument,
    onCreateFolder,
    onCreateDocument,
    onRenameFolder,
    onDeleteFolder,
    onRenameDocument,
    onDeleteDocument,
    onMoveDocument,
    onToggleSidebar,
}: SidebarNavProps) {
    // Map new props to old props for backward compatibility
    // Ensure we always have an array, even if props are undefined
    const actualFolders = Array.isArray(folders)
        ? folders
        : Array.isArray(workspaces)
            ? workspaces
            : [];
    const actualCurrentFolderId = currentFolderId || currentWorkspaceId || null;
    const actualCurrentDocumentId = currentDocumentId || currentSOWId || null;

    // Ensure documents is always an array
    const actualDocuments = Array.isArray(documents) ? documents : [];
    const actualOnSelectFolder = onSelectFolder || onSelectWorkspace;
    const actualOnSelectDocument =
        onSelectDocument || onSelectSOW || (() => { });
    const actualOnRenameDocument = onRenameDocument || onRenameSOW;
    const actualOnDeleteDocument = onDeleteDocument || onDeleteSOW;
    // Helper functions to categorize folders (must be before usage)
    const isAgentFolder = (folder: any) => {
        const agentSlugs = [
            "gen-the-architect",
            "property-marketing-pro",
            "ad-copy-machine",
            "crm-communication-specialist",
            "case-study-crafter",
            "landing-page-persuader",
            "seo-content-strategist",
            "proposal-audit-specialist",
            "proposal-and-audit-specialist",
        ];
        const slug = folder.workspace_slug || folder.slug;
        const matchBySlug = slug && agentSlugs.includes(slug);
        const matchByName = agentSlugs.some((s) =>
            folder.name.toLowerCase().includes(s.replace(/-/g, " ")),
        );
        return matchBySlug || matchByName;
    };

    const isSystemFolder = (folder: any) => {
        const systemSlugs = [
            "default-client",
            "sow-master-dashboard",
            "gen",
            "sql",
            "sow-master-dashboard-63003769",
            "pop",
        ];
        const slug = folder.workspace_slug || folder.slug;
        const matchBySlug = slug && systemSlugs.includes(slug);
        const matchByName = systemSlugs.some((s) =>
            folder.name.toLowerCase().includes(s.replace(/-/g, " ")),
        );
        return matchBySlug || matchByName;
    };

    // 🗑️ Check if folder is protected (cannot be deleted)
    const isProtectedFolder = (folder: any) => {
        // Protect system folders
        if (isSystemFolder(folder)) return true;
        // Protect agent folders
        if (isAgentFolder(folder)) return true;
        return false;
    };

    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(
            Array.isArray(actualFolders) ? actualFolders.map((f) => f.id) : [],
        ),
    );
    const [allDocsExpanded, setAllDocsExpanded] = useState(false);
    const [foldersExpanded, setFoldersExpanded] = useState(true);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);
    const [localFolders, setLocalFolders] = useState(actualFolders);
    const [localDocuments, setLocalDocuments] = useState(documents);

    // 🗑️ Multi-select deletion states
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(
        new Set(),
    );
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // 🆕 Loading state for New Document button
    const [isCreatingDocument, setIsCreatingDocument] = useState(false);

    // Get deletable folders (not protected) - calculate inside useMemo to avoid initialization issues
    const { deletableFolders, areAllSelected } = (() => {
        const deletable = actualFolders.filter((f) => !isProtectedFolder(f));
        const allSelected =
            deletable.length > 0 &&
            deletable.every((f) => selectedFolders.has(f.id));
        return { deletableFolders: deletable, areAllSelected: allSelected };
    })();

    // Toggle folder selection for bulk delete
    const toggleFolderSelection = (folderId: string) => {
        setSelectedFolders((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            return newSet;
        });
    };

    // Bulk delete selected folders
    const handleBulkDelete = async () => {
        if (selectedFolders.size === 0) return;

        setConfirmDialog({
            open: true,
            title: `Delete ${selectedFolders.size} Folder(s)?`,
            message: `This will delete the folders and move all documents to "All Docs". This cannot be undone.`,
            onConfirm: async () => {
                // Move all documents from selected folders to "All Docs"
                const foldersToDelete = Array.from(selectedFolders);
                const docsToMove = localDocuments.filter((d) =>
                    foldersToDelete.includes(d.folderId || ""),
                );

                for (const doc of docsToMove) {
                    await onMoveDocument(doc.id, doc.folderId, null);
                }

                // Delete folders
                for (const folderId of foldersToDelete) {
                    await onDeleteFolder(folderId);
                }

                setSelectedFolders(new Set());
                toast.success(
                    `${foldersToDelete.length} folder(s) deleted, documents moved to All Docs`,
                );
            },
        });
    };

    // Toggle folder expansion
    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    // Update local folders and documents when prop changes
    useEffect(() => {
        setLocalFolders(actualFolders);
        setLocalDocuments(documents);
    }, [folders, workspaces, documents]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px of movement to start drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const toggleWorkspace = (id: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedFolders(newExpanded);
    };

    const handleRename = (id: string, isWorkspace: boolean) => {
        if (renameValue.trim()) {
            if (isWorkspace) {
                onRenameWorkspace(id, renameValue);
            } else {
                onRenameSOW(id, renameValue);
            }
            setRenamingId(null);
            setRenameValue("");
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        // Check if dragging folder or document
        const activeFolder = localFolders.find((f) => f.id === active.id);
        const overFolder = localFolders.find((f) => f.id === over.id);
        const activeDocument = localDocuments.find((d) => d.id === active.id);

        if (activeFolder && overFolder) {
            // Reordering folders
            const oldIndex = localFolders.findIndex((f) => f.id === active.id);
            const newIndex = localFolders.findIndex((f) => f.id === over.id);
            const reordered = arrayMove(localFolders, oldIndex, newIndex);
            setLocalFolders(reordered);
            // TODO: Add reorder folders callback if needed
        } else if (activeDocument) {
            // Moving document to a folder or to "All Docs"
            let targetFolderId: string | null = null;

            if (overFolder) {
                targetFolderId = overFolder.id;
            } else if (over.id === "all-docs") {
                targetFolderId = null;
            }

            if (targetFolderId !== activeDocument.folderId) {
                // Update local state optimistically
                setLocalDocuments((prev) =>
                    prev.map((d) =>
                        d.id === activeDocument.id
                            ? { ...d, folderId: targetFolderId }
                            : d,
                    ),
                );
                onMoveDocument(
                    activeDocument.id,
                    activeDocument.folderId,
                    targetFolderId,
                );
            }
        }
    };

    // Sortable Folder Component
    function SortableFolderItem({ folder }: { folder: Folder }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: folder.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        const isExpanded = expandedFolders.has(folder.id);
        const folderDocuments = localDocuments.filter(
            (d) => d.folderId === folder.id,
        );

        return (
            <div ref={setNodeRef} style={style}>
                {/* Folder Item */}
                <div className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800/50 rounded-lg group relative">
                    {/* 🗑️ Multi-select Checkbox (only for client folders in delete mode) */}
                    {isDeleteMode && !isProtectedFolder(folder) && (
                        <input
                            type="checkbox"
                            checked={selectedFolders.has(folder.id)}
                            onChange={() => toggleFolderSelection(folder.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 cursor-pointer flex-shrink-0"
                            title="Select for deletion"
                        />
                    )}

                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-100"
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Toggle Arrow */}
                    <button
                        onClick={() => toggleFolder(folder.id)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                    </button>

                    {/* Folder Name (truncated to 5 chars max) */}
                    <div className="flex-1 min-w-0 max-w-[80px]">
                        {renamingId === folder.id ? (
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => handleRename(folder.id, true)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                        handleRename(folder.id, true);
                                }}
                                className="h-6 py-0 text-xs bg-gray-800 border-gray-600"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    onSelectFolder(folder.id);
                                }}
                                className={`w-full text-left px-2 py-1 text-sm transition-colors flex items-center gap-1 ${currentFolderId === folder.id
                                        ? "text-[#1CBF79] font-medium"
                                        : "text-gray-300 hover:text-white"
                                    }`}
                                title={folder.name}
                            >
                                <span>
                                    {folder.name.length > 5
                                        ? folder.name.substring(0, 5) + "..."
                                        : folder.name}
                                </span>
                                <span className="ml-1 text-xs text-gray-500">
                                    ({folderDocuments.length})
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Action Buttons - ALWAYS VISIBLE with guaranteed space */}
                    <div className="flex gap-1.5 flex-shrink-0 ml-2">
                        {/* Add New Doc in Folder */}
                        {!isDeleteMode && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        if (typeof onCreateSOW === "function") {
                                            await onCreateSOW(
                                                folder.id,
                                                "Untitled SOW",
                                            );
                                            return;
                                        }
                                        if (typeof onCreateDocument === "function") {
                                            onCreateDocument(
                                                folder.id,
                                                "Untitled Document",
                                            );
                                            return;
                                        }
                                        toast.error(
                                            "Create action not available",
                                        );
                                    } catch (err) {
                                        toast.error(
                                            `Failed to create: ${err instanceof Error ? err.message : "Unknown error"}`,
                                        );
                                    }
                                }}
                                className="p-1.5 bg-gray-700/50 hover:bg-green-500/30 rounded text-green-400 hover:text-white transition-all"
                                title="New document in this folder"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}

                        {/* Rename */}
                        {!isDeleteMode && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingId(folder.id);
                                    setRenameValue(folder.name);
                                }}
                                className="p-1.5 bg-gray-700/50 hover:bg-blue-500/30 rounded text-blue-400 hover:text-white transition-all"
                                title="Rename"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}

                        {/* Delete (single delete when not in delete mode) */}
                        {!isDeleteMode && !isProtectedFolder(folder) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDialog({
                                        open: true,
                                        title: `Delete Folder?`,
                                        message: `Delete "${folder.name}" and move all documents to "All Docs"? This cannot be undone.`,
                                        onConfirm: () => {
                                            // Move documents to "All Docs" and delete folder
                                            const folderDocs =
                                                localDocuments.filter(
                                                    (d) =>
                                                        d.folderId ===
                                                        folder.id,
                                                );
                                            folderDocs.forEach((doc) => {
                                                onMoveDocument(
                                                    doc.id,
                                                    folder.id,
                                                    null,
                                                );
                                            });
                                            setLocalFolders((prev) =>
                                                prev.filter(
                                                    (f) => f.id !== folder.id,
                                                ),
                                            );
                                            onDeleteFolder(folder.id);
                                            toast.success(
                                                "Folder deleted, documents moved to All Docs",
                                            );
                                        },
                                    });
                                }}
                                className="p-1.5 bg-gray-700/50 hover:bg-red-500/30 rounded text-red-400 hover:text-white transition-all"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}

                        {/* Protected Badge */}
                        {isProtectedFolder(folder) && (
                            <div className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded">
                                🔒 Protected
                            </div>
                        )}
                    </div>
                </div>

                {/* Documents in Folder (when expanded) */}
                {isExpanded && (
                    <div className="ml-6 space-y-0.5">
                        <SortableContext
                            items={folderDocuments.map((d) => d.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {folderDocuments.map((doc) => (
                                <SortableDocumentItem
                                    key={doc.id}
                                    document={doc}
                                />
                            ))}
                        </SortableContext>
                    </div>
                )}
            </div>
        );
    }

    // Sortable Document Component
    function SortableDocumentItem({ document }: { document: Document }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: document.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.5 : 1,
        };

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`space-y-1 px-2 py-1.5 rounded-lg group transition-colors ${currentDocumentId === document.id
                        ? "bg-[#0e2e33] text-white"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                    }`}
            >
                {/* Document Item Row */}
                <div className="flex items-center gap-2">
                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-100"
                        title="Drag to move"
                    >
                        <GripVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Doc Icon */}
                    <FileText className="w-4 h-4 flex-shrink-0" />

                    {/* Document Name - Clickable, max 5 chars with "..." */}
                    <div className="flex-1 min-w-0 max-w-[60px]">
                        {renamingId === document.id ? (
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => handleRename(document.id, false)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                        handleRename(document.id, false);
                                }}
                                className="h-6 py-0 text-xs bg-gray-800 border-gray-600"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    console.log(
                                        "🔍 Document clicked:",
                                        document.id,
                                        document.title,
                                    );
                                    actualOnSelectDocument(document.id);
                                }}
                                className="w-full text-left text-xs hover:text-[#1CBF79] transition-colors"
                                title={document.title}
                            >
                                {document.title.length > 5
                                    ? document.title.substring(0, 5) + "..."
                                    : document.title}
                            </button>
                        )}
                    </div>

                    {/* Action Buttons - ALWAYS VISIBLE */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                        {/* Rename */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setRenamingId(document.id);
                                setRenameValue(document.title);
                            }}
                            className="p-1 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 rounded transition-all flex-shrink-0"
                            title="Rename Document"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDialog({
                                    open: true,
                                    title: `Delete Document?`,
                                    message: `Delete "${document.title}"? This cannot be undone.`,
                                    onConfirm: () => {
                                        onDeleteDocument(document.id);
                                        toast.success("Document deleted");
                                    },
                                });
                            }}
                            className="p-1 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded transition-all flex-shrink-0"
                            title="Delete Document"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 h-full bg-[#0E0F0F] flex flex-col relative sidebar-nav-container">
            {/* COLLAPSE BUTTON - Top Right Corner */}
            {onToggleSidebar && (
                <button
                    onClick={onToggleSidebar}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-gray-300 z-10"
                    title="Collapse sidebar"
                    aria-label="Collapse sidebar"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}

            {/* LOGO HEADER */}
            <div className="flex-shrink-0 p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Social Garden</h2>
            </div>

            {/* STATIC LINKS SECTION */}
            <div className="flex-shrink-0 p-4 space-y-2 border-b border-gray-800">
                {/* Primary Actions */}
                <div className="px-4 pb-3 flex gap-2">
                    {/* New Doc Button (Primary) */}
                    <button
                        onClick={() => {
                            console.log("🆕 New Doc button clicked");
                            onNewDoc?.();
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1CBF79] hover:bg-[#16a366] text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Doc
                    </button>

                    {/* New Folder Button (Secondary) */}
                    <button
                        onClick={() => {
                            console.log("🆕 New Folder button clicked");
                            onCreateWorkspace?.();
                        }}
                        className="inline-flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors"
                        title="New Folder"
                    >
                        <FolderPlus className="w-5 h-5" />
                    </button>
                </div>

                {/* Reset All Button - Dangerous Action */}
                <div className="px-4 pb-3">
                    <button
                        onClick={async () => {
                            if (
                                !confirm(
                                    "⚠️ DANGER: This will delete ALL workspaces and SOWs!\n\nThis action cannot be undone. Are you absolutely sure?",
                                )
                            ) {
                                return;
                            }

                            if (
                                !confirm(
                                    "🚨 FINAL WARNING: This will permanently delete:\n\n- All workspaces\n- All SOWs\n- All AnythingLLM workspaces\n\nType 'RESET' to confirm:",
                                )
                            ) {
                                return;
                            }

                            try {
                                const response = await fetch(
                                    "/api/admin/reset-all",
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            confirm: "RESET_ALL_DATA",
                                        }),
                                    },
                                );

                                if (response.ok) {
                                    const result = await response.json();
                                    toast.success(
                                        `✅ Reset complete! Deleted ${result.results.folders_deleted} workspaces and ${result.results.sows_before} SOWs`,
                                    );
                                    // Reload the page to show clean state
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 1500);
                                } else {
                                    const error = await response.json();
                                    toast.error(
                                        `❌ Reset failed: ${error.error || "Unknown error"}`,
                                    );
                                }
                            } catch (error) {
                                toast.error(`❌ Reset failed: ${error}`);
                            }
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-900/60 hover:bg-red-800/80 text-red-300 hover:text-red-200 text-xs font-semibold rounded-lg transition-colors border border-red-800/50"
                        title="Reset all data - DANGEROUS!"
                    >
                        <Trash2 className="w-4 h-4" />
                        Reset All Data
                    </button>
                </div>

                {/* Requirements link hidden per request */}
            </div>

            {/* WORKSPACES SECTION */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800">
                    <Input
                        placeholder="Search folders and documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 text-xs bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-600"
                    />
                </div>

                {/* Documents Header */}
                <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Documents
                    </h3>
                </div>

                {/* Documents List */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-2">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            {/* ALL DOCS SECTION */}
                            {(() => {
                                const allDocs = localDocuments.filter(
                                    (d) =>
                                        d.folderId === null &&
                                        d.title
                                            .toLowerCase()
                                            .includes(
                                                searchQuery.toLowerCase(),
                                            ),
                                );

                                return (
                                    <div className="space-y-1">
                                        <div
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${currentFolderId === null
                                                    ? "text-[#1CBF79] bg-[#0e2e33]"
                                                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                                                }`}
                                            onClick={() =>
                                                setAllDocsExpanded(
                                                    !allDocsExpanded,
                                                )
                                            }
                                        >
                                            {allDocsExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-[#1CBF79]" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-[#1CBF79]" />
                                            )}
                                            <FileText className="w-4 h-4 text-[#1CBF79]" />
                                            <span>All Documents</span>
                                            <span className="ml-auto text-xs text-gray-500">
                                                ({allDocs.length})
                                            </span>
                                        </div>

                                        {/* Show documents in All Docs when expanded */}
                                        {allDocsExpanded &&
                                            allDocs.length > 0 && (
                                                <div className="ml-6 space-y-0.5">
                                                    <SortableContext
                                                        items={allDocs.map(
                                                            (d) => d.id,
                                                        )}
                                                        strategy={
                                                            verticalListSortingStrategy
                                                        }
                                                    >
                                                        {allDocs.map((doc) => (
                                                            <SortableDocumentItem
                                                                key={doc.id}
                                                                document={doc}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </div>
                                            )}

                                        {allDocsExpanded &&
                                            allDocs.length === 0 && (
                                                <div className="px-4 py-4 text-center">
                                                    <p className="text-xs text-gray-500">
                                                        Create a workspace to
                                                        get started
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                );
                            })()}

                            {/* FOLDERS SECTION */}
                            {(() => {
                                const clientFolders = localFolders.filter(
                                    (f) =>
                                        !isAgentFolder(f) &&
                                        !isSystemFolder(f) &&
                                        (f.name
                                            .toLowerCase()
                                            .includes(
                                                searchQuery.toLowerCase(),
                                            ) ||
                                            localDocuments
                                                .filter(
                                                    (d) => d.folderId === f.id,
                                                )
                                                .some((d) =>
                                                    d.title
                                                        .toLowerCase()
                                                        .includes(
                                                            searchQuery.toLowerCase(),
                                                        ),
                                                )),
                                );

                                return (
                                    <div className="space-y-1">
                                        <div
                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer"
                                            onClick={() =>
                                                setFoldersExpanded(
                                                    !foldersExpanded,
                                                )
                                            }
                                        >
                                            {foldersExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-[#1CBF79]" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-[#1CBF79]" />
                                            )}
                                            <LayoutDashboard className="w-4 h-4 text-[#1CBF79]" />
                                            <span>Folders</span>
                                            <span className="ml-auto text-xs text-gray-500">
                                                ({clientFolders.length})
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCreateFolder(
                                                        "New Folder",
                                                    );
                                                }}
                                                className="p-1.5 hover:bg-gray-800/60 rounded-md text-gray-300 hover:text-white ml-2"
                                                title="New folder"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {foldersExpanded &&
                                            clientFolders.length > 0 && (
                                                <div className="ml-6 space-y-0.5">
                                                    <SortableContext
                                                        items={clientFolders.map(
                                                            (f) => f.id,
                                                        )}
                                                        strategy={
                                                            verticalListSortingStrategy
                                                        }
                                                    >
                                                        {clientFolders.map(
                                                            (folder) => (
                                                                <SortableFolderItem
                                                                    key={
                                                                        folder.id
                                                                    }
                                                                    folder={
                                                                        folder
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </SortableContext>
                                                </div>
                                            )}

                                        {foldersExpanded &&
                                            clientFolders.length === 0 && (
                                                <div className="px-4 py-4 text-center">
                                                    <p className="text-xs text-gray-600">
                                                        No folders yet
                                                    </p>
                                                </div>
                                            )}
                                    </div>
                                );
                            })()}
                        </DndContext>
                    </div>
                </ScrollArea>
            </div>

            {/* Confirmation Dialog - No "localhost:3001 says" */}
            <Dialog
                open={confirmDialog?.open || false}
                onOpenChange={(open) => {
                    if (!open) setConfirmDialog(null);
                }}
            >
                <DialogContent className="sm:max-w-sm bg-[#1A1A1D] border border-[#2A2A2D]">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {confirmDialog?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-300 text-sm">
                            {confirmDialog?.message}
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setConfirmDialog(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#2A2A2D] hover:bg-[#3A3A3D] rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                confirmDialog?.onConfirm();
                                setConfirmDialog(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
