import React from "react";
import { SendToClientModal as _SendToClientModal } from "@/components/tailwind/send-to-client-modal";
import { ShareLinkModal as _ShareLinkModal } from "@/components/tailwind/share-link-modal";
import SOWPdfExportWrapper from "@/components/sow/SOWPdfExportWrapper";
import { calculateTotalInvestment } from "@/lib/sow-utils";
import { toast } from "sonner";

// Re-export as named exports for page.tsx
export { _SendToClientModal as SendToClientModal };
export { _ShareLinkModal as ShareLinkModal };

export default function PageModals({
    currentDoc,
    showSendModal,
    setShowSendModal,
    showShareModal,
    setShowShareModal,
    shareModalData,
    setShareModalData,
    showNewPDFModal,
    setShowNewPDFModal,
    newPDFData,
    SHOW_CLIENT_PORTAL_UI,
}: any) {
    return (
        <>
            {/* Send to Client Modal */}
            {currentDoc && SHOW_CLIENT_PORTAL_UI && (
                <_SendToClientModal
                    isOpen={showSendModal}
                    onClose={() => setShowSendModal(false)}
                    document={{
                        id: currentDoc.id,
                        title: currentDoc.title,
                        content: currentDoc.content,
                        totalInvestment: calculateTotalInvestment(
                            currentDoc.content,
                        ),
                    }}
                    onSuccess={(sowId: string, portalUrl: string) => {
                        toast.success("SOW sent successfully!", {
                            description: `Portal: ${portalUrl}`,
                            duration: 5000,
                        });
                    }}
                />
            )}

            {/* Share Link Modal */}
            {shareModalData && SHOW_CLIENT_PORTAL_UI && (
                    <_ShareLinkModal
                        isOpen={showShareModal}
                        onClose={() => {
                            setShowShareModal(false);
                            setShareModalData(null);
                        }}
                        shareData={shareModalData}
                    />
            )}

            {/* Professional PDF modal */}
            {showNewPDFModal && newPDFData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1D] border border-green-600 rounded-xl p-8 max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Professional PDF Ready!
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Your PDF is ready to download.
                        </p>
                        <div className="flex gap-4">
                            <SOWPdfExportWrapper sowData={newPDFData} />
                            <button
                                className="bg-green-600 text-white px-4 py-2 rounded-md"
                                onClick={() => setShowNewPDFModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
