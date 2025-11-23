"use client";

import { useState } from "react";
import EnhancedSidebar from "../../components/tailwind/enhanced-sidebar";
import KnowledgeBaseIframe from "../../components/tailwind/knowledge-base-iframe";

// Sample data for demonstration
const sampleDocuments = [
  {
    id: "1",
    title: "Project Proposal Document",
    content: "Sample content for project proposal",
    folderId: "folder-1",
  },
  {
    id: "2",
    title: "Meeting Notes Q4",
    content: "Sample meeting notes",
    folderId: "folder-1",
  },
  {
    id: "3",
    title: "Budget Analysis",
    content: "Sample budget analysis",
    folderId: "folder-2",
  },
  {
    id: "4",
    title: "Unorganized Document",
    content: "This document is not in any folder",
  },
];

const sampleFolders = [
  {
    id: "folder-1",
    name: "Projects",
    parentId: undefined,
  },
  {
    id: "folder-2",
    name: "Finance",
    parentId: undefined,
  },
  {
    id: "folder-3",
    name: "Marketing",
    parentId: undefined,
  },
];

export default function EnhancedSidebarDemo() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState(sampleDocuments);
  const [folders, setFolders] = useState(sampleFolders);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  // Document handlers
  const handleSelectDoc = (id: string) => {
    setCurrentDocId(id);
    console.log("Selected document:", id);
  };

  const handleNewDoc = (folderId?: string) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: `New Document ${documents.length + 1}`,
      content: "New document content",
      folderId: folderId || undefined,
    };
    setDocuments([...documents, newDoc]);
  };

  const handleRenameDoc = (id: string, title: string) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, title } : doc
    ));
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    if (currentDocId === id) {
      setCurrentDocId(null);
    }
  };

  // Folder handlers
  const handleNewFolder = (name: string, parentId?: string) => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      parentId,
    };
    setFolders([...folders, newFolder]);
  };

  const handleRenameFolder = (id: string, name: string) => {
    setFolders(folders.map(folder =>
      folder.id === id ? { ...folder, name } : folder
    ));
  };

  const handleDeleteFolder = (id: string) => {
    // Remove documents in this folder
    setDocuments(documents.filter(doc => doc.folderId !== id));
    // Remove the folder
    setFolders(folders.filter(folder => folder.id !== id));
  };

  const handleMoveDoc = (docId: string, folderId?: string) => {
    setDocuments(documents.map(doc =>
      doc.id === docId ? { ...doc, folderId } : doc
    ));
  };

  const handleMoveFolder = (folderId: string, parentId?: string) => {
    setFolders(folders.map(folder =>
      folder.id === folderId ? { ...folder, parentId } : folder
    ));
  };

  // Dashboard handler
  const handleDashboard = () => {
    console.log("Dashboard clicked");
    // Navigate to dashboard or show dashboard content
  };

  // Knowledge Base handler
  const handleKnowledgeBase = () => {
    setShowKnowledgeBase(true);
  };

  const closeKnowledgeBase = () => {
    setShowKnowledgeBase(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Enhanced Sidebar */}
      <EnhancedSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        documents={documents}
        folders={folders}
        currentDocId={currentDocId}
        onSelectDoc={handleSelectDoc}
        onNewDoc={handleNewDoc}
        onRenameDoc={handleRenameDoc}
        onDeleteDoc={handleDeleteDoc}
        onNewFolder={handleNewFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveDoc={handleMoveDoc}
        onMoveFolder={handleMoveFolder}
        onDashboard={handleDashboard}
        onKnowledgeBase={handleKnowledgeBase}
      />

      {/* Main Content */}
      <div className="flex-1 ml-0 transition-all duration-300">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">Enhanced Sidebar Demo</h1>
          
          <div className="space-y-4">
            <div className="bg-card p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Features Demonstrated</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>✅ Collapsible documents section with arrow toggles</li>
                <li>✅ Dashboard section with proper styling</li>
                <li>✅ Knowledge base section with iframe integration</li>
                <li>✅ Enhanced visual design with proper icons</li>
                <li>✅ Folder and document management</li>
                <li>✅ Responsive sidebar toggle</li>
              </ul>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Current State</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-medium">Documents: {documents.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {documents.filter(d => d.folderId).length} in folders, 
                    {documents.filter(d => !d.folderId).length} unorganized
                  </p>
                </div>
                <div>
                  <p className="font-medium">Folders: {folders.length}</p>
                  <p className="text-sm text-muted-foreground">Active folders</p>
                </div>
                <div>
                  <p className="font-medium">Current Document</p>
                  <p className="text-sm text-muted-foreground">
                    {currentDocId ? `Selected: ${currentDocId}` : "None selected"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Instructions</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>1. Use the toggle button to open/close the sidebar</p>
                <p>2. Click the arrow icons to expand/collapse sections</p>
                <p>3. Use the + buttons to add new documents and folders</p>
                <p>4. Click document/folder names to select them</p>
                <p>5. Use the edit/delete buttons for management</p>
                <p>6. Click "Dashboard" to navigate to dashboard</p>
                <p>7. Click "Knowledge Base" to open the iframe</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Base Iframe Modal */}
      <KnowledgeBaseIframe
        isOpen={showKnowledgeBase}
        onClose={closeKnowledgeBase}
      />
    </div>
  );
}
