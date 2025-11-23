"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Folder,
  FolderPlus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  BarChart3,
  BookOpen
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: any;
  folderId?: string;
  workspaceSlug?: string;
  threadSlug?: string;
  threadId?: string;
  syncedAt?: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  workspaceSlug?: string;
  workspaceId?: string;
  embedId?: string;
  syncedAt?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  documents: Document[];
  folders: Folder[];
  currentDocId: string | null;
  onSelectDoc: (id: string) => void;
  onNewDoc: (folderId?: string) => void;
  onRenameDoc: (id: string, title: string) => void;
  onDeleteDoc: (id: string) => void;
  onNewFolder: (name: string, parentId?: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveDoc: (docId: string, folderId?: string) => void;
  onMoveFolder: (folderId: string, parentId?: string) => void;
  onDashboard?: () => void;
  onKnowledgeBase?: () => void;
}

export default function EnhancedSidebar({
  isOpen,
  onToggle,
  documents,
  folders,
  currentDocId,
  onSelectDoc,
  onNewDoc,
  onRenameDoc,
  onDeleteDoc,
  onNewFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveDoc,
  onMoveFolder,
  onDashboard,
  onKnowledgeBase,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  
  // Collapsible sections state
  const [documentsCollapsed, setDocumentsCollapsed] = useState(false);
  const [foldersCollapsed, setFoldersCollapsed] = useState<{[key: string]: boolean}>({});

  const handleRename = () => {
    if (renameValue.trim()) {
      if (folders.some(f => f.id === renamingId)) {
        onRenameFolder(renamingId!, renameValue);
      } else {
        onRenameDoc(renamingId!, renameValue);
      }
      setRenamingId(null);
      setRenameValue("");
    }
  };

  const handleNewFolder = () => {
    if (newFolderName.trim()) {
      onNewFolder(newFolderName);
      setNewFolderName("");
      setShowNewFolderDialog(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setFoldersCollapsed(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const unorganizedDocs = documents.filter(doc => !doc.folderId);

  return (
    <>
      <div
        className={`fixed left-0 top-0 h-screen bg-background border-r border-border transition-all duration-300 z-30 ${
          isOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Enhanced Documents</h2>
          <div className="flex gap-1">
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Folder</DialogTitle>
                </DialogHeader>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  onKeyDown={(e) => e.key === 'Enter' && handleNewFolder()}
                />
                <Button onClick={handleNewFolder}>Create</Button>
              </DialogContent>
            </Dialog>
            <Button onClick={() => onNewDoc()} size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-73px)]">
          <div className="p-2 space-y-4">
            
            {/* Dashboard Section */}
            <div className="space-y-2">
              <button
                onClick={onDashboard}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  Dashboard
                </div>
              </button>
            </div>

            {/* Documents Section with Collapsible Toggle */}
            <div className="space-y-2">
              <button
                onClick={() => setDocumentsCollapsed(!documentsCollapsed)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Documents
                </div>
                {documentsCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {!documentsCollapsed && (
                <div className="ml-2 space-y-2">
                  {/* Folders */}
                  {folders.map((folder) => {
                    const folderDocs = documents.filter(doc => doc.folderId === folder.id);
                    const isCollapsed = foldersCollapsed[folder.id] || false;
                    
                    return (
                      <div key={folder.id} className="space-y-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <button
                            onClick={() => toggleFolder(folder.id)}
                            className="flex items-center gap-2 flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="h-3 w-3 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-gray-500" />
                            )}
                            <Folder className="h-3 w-3 text-gray-500" />
                            <span className="truncate">{folder.name}</span>
                            <span className="text-xs text-gray-500">({folderDocs.length})</span>
                          </button>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-500 transition-colors"
                              onClick={(e) => { e.stopPropagation(); onNewDoc(folder.id); }}
                              title="New document"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 transition-colors"
                              onClick={(e) => { e.stopPropagation(); setRenamingId(folder.id); setRenameValue(folder.name); }}
                              title="Rename folder"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-500 transition-colors"
                              onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                              title="Delete folder"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        {!isCollapsed && folderDocs.length > 0 && (
                          <div className="ml-6 space-y-1">
                            {folderDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer group ${
                                  currentDocId === doc.id ? 'bg-accent' : 'hover:bg-accent'
                                }`}
                                onClick={() => onSelectDoc(doc.id)}
                              >
                                <FileText className="h-3 w-3 text-gray-500" />
                                {renamingId === doc.id ? (
                                  <Input
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                    className="h-6 py-0 text-sm flex-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="text-sm truncate flex-1">{doc.title}</span>
                                )}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.title); }}
                                    title="Rename document"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-500 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                                    title="Delete document"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Unorganized Documents */}
                  {unorganizedDocs.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex items-center gap-2">
                          <Folder className="h-3 w-3 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unorganized</span>
                          <span className="text-xs text-gray-500">({unorganizedDocs.length})</span>
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-1">
                        {unorganizedDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer group ${
                              currentDocId === doc.id ? 'bg-accent' : 'hover:bg-accent'
                            }`}
                            onClick={() => onSelectDoc(doc.id)}
                          >
                            <FileText className="h-3 w-3 text-gray-500" />
                            {renamingId === doc.id ? (
                              <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                className="h-6 py-0 text-sm flex-1"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span className="text-sm truncate flex-1">{doc.title}</span>
                            )}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 transition-colors"
                                onClick={(e) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.title); }}
                                title="Rename document"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              <button
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-500 transition-colors"
                                onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                                title="Delete document"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Knowledge Base Section */}
            <div className="space-y-2">
              <button
                onClick={onKnowledgeBase}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  Knowledge Base
                </div>
              </button>
            </div>
          </div>
        </ScrollArea>
      </div>
      
      <Button
        onClick={onToggle}
        size="sm"
        variant="outline"
        className={`fixed top-4 z-40 transition-all duration-300 ${
          isOpen ? 'left-64' : 'left-4'
        }`}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </>
  );
}
