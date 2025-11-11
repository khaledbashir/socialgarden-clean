"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SOWTagSelector } from './sow-tag-selector';

interface SOW {
  id: string;
  name: string;
  workspaceId: string;
  vertical?: 'property' | 'education' | 'finance' | 'healthcare' | 'retail' | 'hospitality' | 'professional-services' | 'technology' | 'other' | null;
  service_line?: 'crm-implementation' | 'marketing-automation' | 'revops-strategy' | 'managed-services' | 'consulting' | 'training' | 'other' | null;
}

interface Workspace {
  id: string;
  name: string;
  sows: SOW[];
  workspace_slug?: string;
  slug?: string;
}

interface SidebarNavProps {
  currentView: "dashboard" | "editor" | "ai-management";
  onViewChange: (view: "dashboard" | "editor" | "ai-management") => void;

  workspaces: Workspace[];
  currentWorkspaceId: string;
  currentSOWId: string | null;

  onSelectWorkspace: (id: string) => void;
  onSelectSOW: (id: string) => void;
  onCreateWorkspace: (name: string, type?: "sow" | "client" | "generic") => void;
  onCreateSOW: (workspaceId: string, name: string) => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onRenameSOW: (id: string, title: string) => void;
  onDeleteSOW: (id: string) => void;
  onToggleSidebar?: () => void;
  onReorderWorkspaces?: (workspaces: Workspace[]) => void;
  onReorderSOWs?: (workspaceId: string, sows: SOW[]) => void;
  // Move SOW between workspaces (folders)
  onMoveSOW?: (sowId: string, fromWorkspaceId: string, toWorkspaceId: string, toIndex?: number) => void;

  // 🎯 Phase 1C: Dashboard filter support
  dashboardFilter?: {
    type: 'vertical' | 'serviceLine' | null;
    value: string | null;
  };
  onClearFilter?: () => void;
}

export default function SidebarNav({
  currentView,
  onViewChange,
  workspaces,
  currentWorkspaceId,
  currentSOWId,
  onSelectWorkspace,
  onSelectSOW,
  onCreateWorkspace,
  onCreateSOW,
  onRenameWorkspace,
  onDeleteWorkspace,
  onRenameSOW,
  onDeleteSOW,
  onToggleSidebar,
  onReorderWorkspaces,
  onReorderSOWs,
  onMoveSOW,
  dashboardFilter,
  onClearFilter,
}: SidebarNavProps) {
  // Helper functions to categorize workspaces (must be before usage)
  const isAgentWorkspace = (workspace: any) => {
    const agentSlugs = [
      'gen-the-architect',
      'property-marketing-pro',
      'ad-copy-machine',
      'crm-communication-specialist',
      'case-study-crafter',
      'landing-page-persuader',
      'seo-content-strategist',
      'proposal-audit-specialist',
      'proposal-and-audit-specialist'
    ];
    const slug = workspace.workspace_slug || workspace.slug;
    const matchBySlug = slug && agentSlugs.includes(slug);
    const matchByName = agentSlugs.some(s => workspace.name.toLowerCase().includes(s.replace(/-/g, ' ')));
    return matchBySlug || matchByName;
  };

  const isSystemWorkspace = (workspace: any) => {
    const systemSlugs = [
      'default-client',
      'sow-master-dashboard',
      'gen',
      'sql',
      'sow-master-dashboard-63003769',
      'pop'
    ];
    const slug = workspace.workspace_slug || workspace.slug;
    const matchBySlug = slug && systemSlugs.includes(slug);
    const matchByName = systemSlugs.some(s => workspace.name.toLowerCase().includes(s.replace(/-/g, ' ')));
    return matchBySlug || matchByName;
  };

  // 🗑️ Check if workspace is protected (cannot be deleted)
  const isProtectedWorkspace = (workspace: any) => {
    // Protect system workspaces
    if (isSystemWorkspace(workspace)) return true;
    // Protect agent workspaces
    if (isAgentWorkspace(workspace)) return true;
    return false;
  };

  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set(workspaces.map(w => w.id))
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceType, setNewWorkspaceType] = useState<"sow" | "client" | "generic">("sow"); // 🎯 Workspace type selector

  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localWorkspaces, setLocalWorkspaces] = useState(workspaces);

  // 🗑️ Multi-select deletion states
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Set<string>>(new Set());
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  // 🆕 Loading state for New SOW button
  const [isCreatingSOW, setIsCreatingSOW] = useState(false);

  // Get deletable workspaces (not protected) - calculate inside useMemo to avoid initialization issues
  const { deletableWorkspaces, areAllSelected } = (() => {
    const deletable = workspaces.filter(w => !isProtectedWorkspace(w));
    const allSelected = deletable.length > 0 && deletable.every(w => selectedWorkspaces.has(w.id));
    return { deletableWorkspaces: deletable, areAllSelected: allSelected };
  })();

  // Select/deselect all handler
  const handleSelectAll = () => {
    if (areAllSelected) {
      setSelectedWorkspaces(new Set());
    } else {
      const allDeletableIds = new Set(deletableWorkspaces.map(w => w.id));
      setSelectedWorkspaces(allDeletableIds);
    }
  };

  // Category expansion states
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    // Default: show Clients only to avoid confusion about protected counts
    new Set(['clients'])
  );

  // Update local workspaces when prop changes
  useEffect(() => {
    setLocalWorkspaces(workspaces);
  }, [workspaces]);

  // 🗑️ Handle multi-select toggle
  const toggleWorkspaceSelection = (workspaceId: string) => {
    const newSelected = new Set(selectedWorkspaces);
    if (newSelected.has(workspaceId)) {
      newSelected.delete(workspaceId);
    } else {
      newSelected.add(workspaceId);
    }
    setSelectedWorkspaces(newSelected);
  };

  // 🗑️ Handle bulk delete
  const handleBulkDelete = async () => {
    const selectedWorkspacesList = Array.from(selectedWorkspaces);

    if (selectedWorkspacesList.length === 0) {
      toast.error('No workspaces selected');
      return;
    }

    const protectedCount = selectedWorkspacesList.filter(id =>
      isProtectedWorkspace(localWorkspaces.find(w => w.id === id)!)
    ).length;

    if (protectedCount > 0) {
      toast.error(`Cannot delete ${protectedCount} protected workspace(es). Only client workspaces can be deleted.`);
      return;
    }

    setConfirmDialog({
      open: true,
      title: `Delete ${selectedWorkspacesList.length} Workspace(s)?`,
      message: `This will delete all SOWs inside, remove from AnythingLLM, and clear all chat history. This cannot be undone.`,
      onConfirm: async () => {
        // Optimistically update local UI to reflect deletions immediately
        setLocalWorkspaces(prev => prev.filter(w => !selectedWorkspacesList.includes(w.id)));

        for (const workspaceId of selectedWorkspacesList) {
          try {
            onDeleteWorkspace(workspaceId);
          } catch (error) {
            console.error(`Failed to delete workspace ${workspaceId}:`, error);
          }
        }
        setSelectedWorkspaces(new Set());
        setIsDeleteMode(false);
        toast.success(`Deleted ${selectedWorkspacesList.length} workspace(s)`);
      }
    });
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleWorkspace = (id: string) => {
    const newExpanded = new Set(expandedWorkspaces);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedWorkspaces(newExpanded);
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

    // Check if dragging workspace or SOW
    const activeWorkspace = localWorkspaces.find(w => w.id === active.id);
    const overWorkspace = localWorkspaces.find(w => w.id === over.id);

    if (activeWorkspace && overWorkspace) {
      // Reordering workspaces
      const oldIndex = localWorkspaces.findIndex(w => w.id === active.id);
      const newIndex = localWorkspaces.findIndex(w => w.id === over.id);
      const reordered = arrayMove(localWorkspaces, oldIndex, newIndex);
      setLocalWorkspaces(reordered);
      onReorderWorkspaces?.(reordered);
    } else {
      // Dragging a SOW
      const activeSOW = localWorkspaces.flatMap(w => w.sows).find(s => s.id === active.id);
      const overSOW = localWorkspaces.flatMap(w => w.sows).find(s => s.id === over.id);

      // Case A: Move SOW within the same workspace (reorder)
      if (activeSOW && overSOW && activeSOW.workspaceId === overSOW.workspaceId) {
        const workspaceId = activeSOW.workspaceId;
        const workspace = localWorkspaces.find(w => w.id === workspaceId);
        if (workspace) {
          const oldIndex = workspace.sows.findIndex(s => s.id === active.id);
          const newIndex = workspace.sows.findIndex(s => s.id === over.id);
          const reorderedSOWs = arrayMove(workspace.sows, oldIndex, newIndex);
          const updatedWorkspaces = localWorkspaces.map(w =>
            w.id === workspaceId ? { ...w, sows: reorderedSOWs } : w
          );
          setLocalWorkspaces(updatedWorkspaces);
          onReorderSOWs?.(workspaceId, reorderedSOWs);
        }
        return;
      }

      // Case B: Dropped over a workspace: move SOW across folders to top
      if (activeSOW && overWorkspace) {
        const fromId = activeSOW.workspaceId;
        const toId = overWorkspace.id;
        if (fromId !== toId) {
          const updated = localWorkspaces.map(w => {
            if (w.id === fromId) {
              return { ...w, sows: w.sows.filter(s => s.id !== activeSOW.id) };
            }
            if (w.id === toId) {
              return { ...w, sows: [{ ...activeSOW, workspaceId: toId }, ...w.sows] };
            }
            return w;
          });
          setLocalWorkspaces(updated);
          onMoveSOW?.(activeSOW.id, fromId, toId, 0);
        }
        return;
      }

      // Case C: Dropped over a SOW in a different workspace: move and position before target
      if (activeSOW && overSOW && activeSOW.workspaceId !== overSOW.workspaceId) {
        const fromId = activeSOW.workspaceId;
        const toId = overSOW.workspaceId;
        const targetWs = localWorkspaces.find(w => w.id === toId);
        if (!targetWs) return;
        const targetIndex = targetWs.sows.findIndex(s => s.id === overSOW.id);
        const updated = localWorkspaces.map(w => {
          if (w.id === fromId) {
            return { ...w, sows: w.sows.filter(s => s.id !== activeSOW.id) };
          }
          if (w.id === toId) {
            const newSows = [...w.sows];
            newSows.splice(Math.max(0, targetIndex), 0, { ...activeSOW, workspaceId: toId });
            return { ...w, sows: newSows };
          }
          return w;
        });
        setLocalWorkspaces(updated);
        onMoveSOW?.(activeSOW.id, fromId, toId, Math.max(0, targetIndex));
        return;
      }
    }
  };

  // Sortable Workspace Component
  function SortableWorkspaceItem({ workspace }: { workspace: Workspace }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: workspace.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isExpanded = expandedWorkspaces.has(workspace.id);

    return (
      <div ref={setNodeRef} style={style}>
        {/* Workspace Item */}
        <div className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800/50 rounded-lg group relative">
          {/* 🗑️ Multi-select Checkbox (only for client workspaces in delete mode) */}
          {isDeleteMode && !isProtectedWorkspace(workspace) && (
            <input
              type="checkbox"
              checked={selectedWorkspaces.has(workspace.id)}
              onChange={() => toggleWorkspaceSelection(workspace.id)}
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
            onClick={() => toggleWorkspace(workspace.id)}
            className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Workspace Name (truncated to 5 chars max) */}
          <div className="flex-1 min-w-0 max-w-[80px]">
            {renamingId === workspace.id ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRename(workspace.id, true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(workspace.id, true);
                }}
                className="h-6 py-0 text-xs bg-gray-800 border-gray-600"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                onClick={() => {
                  onSelectWorkspace(workspace.id);
                }}
                className={`w-full text-left px-2 py-1 text-sm transition-colors flex items-center gap-1 ${
                  currentWorkspaceId === workspace.id
                    ? 'text-[#1CBF79] font-medium'
                    : 'text-gray-300 hover:text-white'
                }`}
                title={workspace.name}
              >
                <span>{workspace.name.length > 5 ? workspace.name.substring(0, 5) + '...' : workspace.name}</span>
                <span className="ml-1 text-xs text-gray-500">({workspace.sows.length})</span>
              </button>
            )}
          </div>

          {/* Action Buttons - ALWAYS VISIBLE with guaranteed space */}
          <div className="flex gap-1.5 flex-shrink-0 ml-2">
            {/* Add New Doc */}
            {/* New SOW creation moved to global button in header */}

            {/* Rename */}
            {!isDeleteMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(workspace.id);
                  setRenameValue(workspace.name);
                }}
                className="p-1.5 bg-gray-700/50 hover:bg-blue-500/30 rounded text-blue-400 hover:text-white transition-all"
                title="Rename"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {/* Delete (single delete when not in delete mode) */}
            {!isDeleteMode && !isProtectedWorkspace(workspace) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDialog({
                    open: true,
                    title: `Delete Workspace?`,
                    message: `Delete "${workspace.name}" and all SOWs inside? This cannot be undone.`,
                    onConfirm: () => {
                      // Optimistic UI update to keep counts accurate immediately
                      setLocalWorkspaces(prev => prev.filter(ws => ws.id !== workspace.id));
                      onDeleteWorkspace(workspace.id);
                      toast.success('Workspace deleted');
                    }
                  });
                }}
                className="p-1.5 bg-gray-700/50 hover:bg-red-500/30 rounded text-red-400 hover:text-white transition-all"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Protected Badge */}
            {isProtectedWorkspace(workspace) && (
              <div className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded">
                🔒 Protected
              </div>
            )}
          </div>
        </div>

        {/* SOWs in Workspace (when expanded) */}
        {isExpanded && (
          <div className="ml-6 space-y-0.5">
            <SortableContext items={workspace.sows.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {workspace.sows.map((sow) => (
                <SortableSOWItem key={sow.id} sow={sow} />
              ))}
            </SortableContext>
          </div>
        )}
      </div>
    );
  }

  // Sortable SOW Component
  function SortableSOWItem({ sow }: { sow: SOW }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: sow.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`space-y-1 px-2 py-1.5 rounded-lg group transition-colors ${
          currentSOWId === sow.id
            ? "bg-[#0e2e33] text-white"
            : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
        }`}
      >
        {/* SOW Item Row */}
        <div className="flex items-center gap-2">
          {/* Doc Icon */}
          <FileText className="w-4 h-4 flex-shrink-0" />

          {/* SOW Name - Clickable, max 5 chars with "..." */}
          <div className="flex-1 min-w-0 max-w-[60px]">
            {renamingId === sow.id ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRename(sow.id, false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(sow.id, false);
                }}
                className="h-6 py-0 text-xs bg-gray-800 border-gray-600"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <button
                onClick={() => {
                  console.log('🔍 SOW clicked:', sow.id, sow.name);
                  onSelectSOW(sow.id);
                }}
                className="w-full text-left text-xs hover:text-[#1CBF79] transition-colors"
                title={sow.name}
              >
                {sow.name.length > 5 ? sow.name.substring(0, 5) + '...' : sow.name}
              </button>
            )}
          </div>

          {/* Action Buttons - ALWAYS VISIBLE */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
            {/* Rename */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenamingId(sow.id);
                setRenameValue(sow.name);
              }}
              className="p-1 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 rounded transition-all flex-shrink-0"
              title="Rename SOW"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDialog({
                  open: true,
                  title: `Delete SOW?`,
                  message: `Delete "${sow.name}"? This cannot be undone.`,
                  onConfirm: () => {
                    onDeleteSOW(sow.id);
                    toast.success('SOW deleted');
                  }
                });
              }}
              className="p-1 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded transition-all flex-shrink-0"
              title="Delete SOW"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tag Selector Row */}
        <div className="pl-6" onClick={(e) => e.stopPropagation()}>
          <SOWTagSelector
            sowId={sow.id}
            sowTitle={sow.name}
            currentVertical={sow.vertical || null}
            currentServiceLine={sow.service_line || null}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-[#0E0F0F] border-r border-gray-800 flex flex-col relative sidebar-nav-container">
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
        {/* Dashboard Link */}
        <button
          onClick={() => onViewChange("dashboard")}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
            currentView === "dashboard"
              ? "bg-[#0e2e33] text-white"
              : "text-gray-400 hover:text-gray-300 hover:bg-gray-900/50"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Dashboard</span>
          {/* 🎯 Phase 1C: Filter badge */}
          {dashboardFilter?.type && dashboardFilter?.value && (
            <span className="ml-auto px-2 py-0.5 text-xs bg-[#1CBF79] text-white rounded-full">
              Filtered
            </span>
          )}
        </button>

        {/* 🎯 Phase 1C: Clear Filter button (show when filter active) */}
        {dashboardFilter?.type && dashboardFilter?.value && onClearFilter && (
          <button
            onClick={onClearFilter}
            className="w-full flex items-center justify-center gap-2 px-4 py-1.5 text-xs text-orange-400 hover:text-orange-300 hover:bg-gray-900/50 rounded-lg transition-colors border border-orange-400/30"
          >
            <span>Clear {dashboardFilter.type === 'vertical' ? 'Vertical' : 'Service'} Filter: {dashboardFilter.value}</span>
          </button>
        )}

        {/* Primary New SOW CTA */}
        <div className="px-4 pb-3">
          <button
            onClick={async () => {
              if (isCreatingSOW) return; // Prevent duplicate clicks

              const targetId = currentWorkspaceId || (workspaces && workspaces.length > 0 ? workspaces[0].id : null);
              console.log('🆕 New SOW button clicked', { targetId, currentWorkspaceId, workspacesCount: workspaces?.length });
              if (targetId) {
                console.log('📝 Calling onCreateSOW with:', { targetId, name: 'Untitled SOW' });
                setIsCreatingSOW(true);
                try {
                  await onCreateSOW(targetId, 'Untitled SOW');
                } finally {
                  setIsCreatingSOW(false);
                }
              } else {
                toast.error('Please create a client workspace first');
              }
            }}
            disabled={isCreatingSOW}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1CBF79] hover:bg-[#16a366] disabled:bg-[#0d8c4a] disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isCreatingSOW ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                New SOW
              </>
            )}
          </button>
        </div>


        {/* Requirements link hidden per request */}
      </div>

      {/* WORKSPACES SECTION */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800">
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-600"
          />
        </div>

        {/* Workspaces Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Workspaces</h3>
          <div className="flex items-center gap-1">
            {/* 🗑️ Delete Mode Toggle */}
            {!isDeleteMode ? (
              <>
                <button
                  onClick={() => setIsDeleteMode(true)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  title="Multi-delete mode (select workspaces to delete)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </>
            ) : (
              // 🗑️ Delete Mode UI
              <>
                <button
                  onClick={() => setIsDeleteMode(false)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-gray-300"
                  title="Cancel delete mode"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Select All checkbox */}
                <label className="flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-gray-800/50 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={areAllSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-600 text-blue-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400">Select All</span>
                </label>

                {selectedWorkspaces.size > 0 && (
                  <>
                    <span className="text-xs text-gray-400 mx-1">
                      {selectedWorkspaces.size} selected
                    </span>
                    <button
                      onClick={handleBulkDelete}
                      className="p-1 hover:bg-red-900/50 rounded transition-colors text-red-400 hover:text-red-300"
                      title={`Delete ${selectedWorkspaces.size} workspace(s)`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Workspaces List - Categorized */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* CLIENT WORKSPACES CATEGORY */}
              {(() => {
                const clientWorkspaces = localWorkspaces.filter(w =>
                  !isAgentWorkspace(w) && !isSystemWorkspace(w) &&
                  (w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   w.sows.some(sow => sow.name.toLowerCase().includes(searchQuery.toLowerCase())))
                );

                if (clientWorkspaces.length === 0 && searchQuery === '') {
                  return null;
                }

                return (
                  <div className="space-y-1">
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => toggleCategory('clients')}
                        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        {expandedCategories.has('clients') ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <LayoutDashboard className="w-4 h-4 text-[#1CBF79]" />
                        <span>CLIENT WORKSPACES</span>
                        <span className="ml-auto text-xs text-gray-500">({clientWorkspaces.length})</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onCreateWorkspace("New Client Workspace", "client"); }}
                        className="p-1.5 hover:bg-gray-800/60 rounded-md text-gray-300 hover:text-white"
                        title="New client workspace"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {expandedCategories.has('clients') && (
                      <div className="ml-2 space-y-0.5">
                        <SortableContext
                          items={clientWorkspaces.map(w => w.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {clientWorkspaces.map((workspace) => (
                            <SortableWorkspaceItem key={workspace.id} workspace={workspace} />
                          ))}
                        </SortableContext>

                        {clientWorkspaces.length === 0 && (
                          <div className="px-4 py-4 text-center">
                            <p className="text-xs text-gray-600">No client workspaces yet</p>

                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* AI AGENTS CATEGORY */}
              {(() => {
                const agentWorkspaces = localWorkspaces.filter(w =>
                  isAgentWorkspace(w) &&
                  w.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (agentWorkspaces.length === 0) {
                  return null;
                }

                return (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleCategory('agents')}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                    >
                      {expandedCategories.has('agents') ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>AI AGENTS</span>
                      <span className="ml-auto text-xs text-gray-500">({agentWorkspaces.length})</span>
                    </button>

                    {expandedCategories.has('agents') && (
                      <div className="ml-2 space-y-0.5">
                        {agentWorkspaces.map((workspace) => (
                          <div key={workspace.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800/50 rounded-lg group">
                            <button
                              onClick={() => onSelectWorkspace(workspace.id)}
                              className={`flex-1 text-left text-xs transition-colors truncate ${
                                currentWorkspaceId === workspace.id
                                  ? 'text-purple-400 font-medium'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                              title={workspace.name}
                            >
                              {workspace.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SYSTEM TOOLS CATEGORY */}
              {(() => {
                const systemWorkspaces = localWorkspaces.filter(w =>
                  isSystemWorkspace(w) &&
                  w.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (systemWorkspaces.length === 0) {
                  return null;
                }

                return (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleCategory('system')}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
                    >
                      {expandedCategories.has('system') ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-blue-400">⚙️</span>
                      <span>SYSTEM TOOLS</span>
                      <span className="ml-auto text-xs text-gray-500">({systemWorkspaces.length})</span>
                    </button>

                    {expandedCategories.has('system') && (
                      <div className="ml-2 space-y-0.5">
                        {systemWorkspaces.map((workspace) => (
                          <div key={workspace.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-800/50 rounded-lg group">
                            <button
                              onClick={() => onSelectWorkspace(workspace.id)}
                              className={`flex-1 text-left text-xs transition-colors truncate ${
                                currentWorkspaceId === workspace.id
                                  ? 'text-blue-400 font-medium'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                              title={workspace.name}
                            >
                              {workspace.name}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </DndContext>

            {localWorkspaces.length === 0 && (
              <div className="px-4 py-8 text-center">
                <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Ready to create your first SOW?</h3>
          <p className="text-xs text-gray-500 mb-4">Start by creating a client workspace, then generate professional Statements of Work with AI assistance.</p>
          <button
            onClick={() => onCreateWorkspace("New Client Workspace", "client")}
            className="inline-flex items-center px-4 py-2 bg-[#1CBF79] hover:bg-[#16a366] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Workspace
          </button>
        </div>

              </div>
            )}
          </div>
        </ScrollArea>
      </div>


      {/* Confirmation Dialog - No "localhost:3001 says" */}
      <Dialog open={confirmDialog?.open || false} onOpenChange={(open) => {
        if (!open) setConfirmDialog(null);
      }}>
        <DialogContent className="sm:max-w-sm bg-[#1A1A1D] border border-[#2A2A2D]">
          <DialogHeader>
            <DialogTitle className="text-white">{confirmDialog?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300 text-sm">{confirmDialog?.message}</p>
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
