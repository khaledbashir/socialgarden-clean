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
    onExportPDF, // Accept onExportPDF from parent
    onExportNewPDF, // Accept onExportNewPDF from parent
    onExportExcel, // Accept onExportExcel from parent
    onSharePortal, // Accept onSharePortal from parent
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
                    onExportPDF={onExportPDF}
                    onExportNewPDF={onExportNewPDF}
                    onExportExcel={onExportExcel}
                    onSharePortal={onSharePortal}
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
                        onCreateWorkspace={() => {
                            // Open dialog - parent component should handle this
                            if (typeof onCreateWorkspace === 'function') {
                                // If it accepts no args, it's the dialog opener
                                onCreateWorkspace();
                            }
                        }}
                        onOpenOnboarding={() => onOpenOnboarding?.()}
                        isLoading={false}
                    />
                )}
            </div>
        </div>
    );
}
