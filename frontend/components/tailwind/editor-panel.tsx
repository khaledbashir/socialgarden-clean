import React from "react";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { DocumentStatusBar } from "@/components/tailwind/document-status-bar";
import HomeWelcome from "@/components/tailwind/home-welcome";

export default function EditorPanel({
    currentDoc,
    isGrandTotalVisible,
    toggleGrandTotal,
    editorRef,
    handleUpdateDoc,
    handleExportPDF,
    handleExportNewPDF,
    handleExportExcel,
    handleSharePortal,
    onCreateWorkspace,
    onOpenOnboarding,
}: any) {
    return (
        <div className="w-full h-full flex flex-col">
            {/* Document Status Bar - Only show when document is open */}
            {currentDoc && (
                <DocumentStatusBar
                    title={currentDoc.title || "Untitled Statement of Work"}
                    saveStatus="saved"
                    isSaving={false}
                    isGrandTotalVisible={isGrandTotalVisible}
                    onToggleGrandTotal={toggleGrandTotal}
                    onExportPDF={handleExportPDF}
                    onExportNewPDF={handleExportNewPDF}
                    onExportExcel={handleExportExcel}
                    onSharePortal={handleSharePortal}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto" data-show-totals={isGrandTotalVisible}>
                {currentDoc ? (
                    <div className="w-full h-full">
                        <TailwindAdvancedEditor
                            ref={editorRef}
                            initialContent={currentDoc.content}
                            onUpdate={handleUpdateDoc}
                        />
                    </div>
                ) : (
                    <HomeWelcome
                        onCreateWorkspace={() => onCreateWorkspace?.("New Workspace")}
                        onOpenOnboarding={() => onOpenOnboarding?.()}
                    />
                )}
            </div>
        </div>
    );
}
