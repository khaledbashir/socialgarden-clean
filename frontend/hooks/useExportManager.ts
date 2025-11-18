/**
 * Custom hook for export operations
 * Handles PDF, Excel, and other export functionality
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { anythingLLM } from "@/lib/anythingllm";
import type { Document, MultiScopeData, PDFExportData } from "@/types";
import { sanitizeEmptyTextNodes } from "@/lib/page-utils";
import { transformScopesToPDFFormat } from "@/lib/sow-utils";

const extractFinalPriceTargetText = (content: any): string | null => {
    if (!content || !Array.isArray(content.content)) return null;

    const flattenText = (node: any): string => {
        if (!node) return "";
        if (node.type === "text") return node.text || "";
        if (Array.isArray(node.content))
            return node.content.map(flattenText).join(" ");
        return "";
    };

    const allText = content.content
        .map(flattenText)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    if (!allText) return null;

    const patterns = [
        /(final\s*(price|investment|project\s*value)\s*[:\-]?\s*)(\$?\s*[\d,]+(?:\.\d+)?(?:\s*\+?\s*gst|\s*ex\s*gst|\s*incl\s*gst)?)/i,
    ];

    for (const re of patterns) {
        const m = allText.match(re);
        if (m && m[3]) {
            let val = m[3].trim();
            if (!val.startsWith("$")) {
                const numPart = val.replace(/[^\d.,a-z\s+]/gi, "").trim();
                val = `$${numPart}`;
            }
            val = val
                .replace(/\s*\+\s*gst/i, " +GST")
                .replace(/\s*ex\s*gst/i, " ex GST")
                .replace(/\s*incl\s*gst/i, " incl GST");
            return val;
        }
    }
    return null;
};

interface UseExportManagerProps {
    currentDoc?: Document | null;
    editorRef?: React.RefObject<any>;
}

export function useExportManager({ currentDoc = null, editorRef = null }: UseExportManagerProps = {}) {
    const [isExporting, setIsExporting] = useState(false);
    const [newPDFModalOpen, setNewPDFModalOpen] = useState(false);
    const [newPDFData, setNewPDFData] = useState<any>(null);

    // Export to PDF (original implementation)
    const exportToPDF = useCallback(async () => {
        if (!currentDoc || !editorRef.current) return;

        setIsExporting(true);

        try {
            let showPricingSummary = false;

            // Check if there's a pricing table in the content
            const editor = editorRef.current;
            if (editor.getJSON) {
                const editorContent = editor.getJSON();
                const pricingTableNode = editorContent?.content?.find(
                    (node: any) =>
                        node.type === "table" &&
                        node.attrs?.discount !== undefined,
                );
                showPricingSummary = !!pricingTableNode;
            }

            // Get final price target text
            const finalPriceTargetText = extractFinalPriceTargetText(
                currentDoc.content,
            );

            // Get HTML content from editor
            const editorHTML = editor.getHTML();

            // Prepare content for export
            let contentForExport = editorHTML;

            // If we need to sanitize empty text nodes (if the editor supports it)
            if (editor.getJSON) {
                const editorJSON = editor.getJSON();
                const cloned = JSON.parse(JSON.stringify(editorJSON));
                sanitizeEmptyTextNodes(cloned);

                // Find pricing tables and potentially modify them
                const ptIndex = cloned.content?.findIndex(
                    (node: any) =>
                        node.type === "table" &&
                        node.attrs?.discount !== undefined,
                );

                if (ptIndex !== -1 && ptIndex !== undefined) {
                    // Modify pricing table if needed
                    // This would depend on specific requirements
                }
            }

            // Generate filename
            const filename = `${currentDoc.title.replace(/\s+/g, "_")}.pdf`;

            // Call PDF export API
            const response = await fetch("/api/export/pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    html_content: contentForExport,
                    filename,
                    show_pricing_summary: showPricingSummary,
                    content: currentDoc.content,
                    final_investment_target_text: finalPriceTargetText,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to export PDF");
            }

            // Download the PDF
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            toast.success("PDF exported successfully");
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Failed to export PDF");
        } finally {
            setIsExporting(false);
        }
    }, [currentDoc, editorRef]);

    // Export to new PDF format
    const exportToNewPDF = useCallback(
        async (options?: any) => {
            if (!currentDoc || !editorRef.current) return;

            setIsExporting(true);

            try {
                // Get JSON content from editor
                const editorJSON = editorRef.current.getJSON();

                // Extract multi-scope pricing data if available
                let transformedData: PDFExportData | null = null;

                if (currentDoc.pricingData) {
                    // Create modified multi-scope data for export
                    const modifiedMultiScopeData = {
                        ...currentDoc.pricingData,
                        discount:
                            options?.discountAmount !== undefined
                                ? options.discountAmount
                                : currentDoc.pricingData.discount,
                    };

                    // Transform to PDF format
                    transformedData = transformScopesToPDFFormat(
                        modifiedMultiScopeData,
                    );
                }

                // Call new PDF export API
                const response = await fetch("/api/export/pdf-new", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        documentId: currentDoc.id,
                        editorJSON,
                        pdfData: transformedData,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || "Failed to export PDF");
                }

                // Download the PDF
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${currentDoc.title.replace(/\s+/g, "_")}.pdf`;
                a.click();
                URL.revokeObjectURL(url);

                // Store PDF data for potential modal display
                setNewPDFData({
                    content: await response.text(),
                    title: currentDoc.title,
                });

                toast.success("PDF exported successfully");
            } catch (error) {
                console.error("Error exporting PDF:", error);
                toast.error("Failed to export PDF");
            } finally {
                setIsExporting(false);
            }
        },
        [currentDoc, editorRef],
    );

    // Export to Excel
    const exportToExcel = useCallback(async () => {
        if (!currentDoc) return;

        setIsExporting(true);

        try {
            const response = await fetch("/api/export/excel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentId: currentDoc.id,
                    title: currentDoc.title,
                }),
            });

            if (!response.ok) {
                const txt = await response.text();
                let errorMessage = "Failed to export Excel";

                try {
                    const errorJson = JSON.parse(txt);
                    errorMessage = errorJson.error || errorMessage;
                } catch {
                    errorMessage = txt || errorMessage;
                }

                throw new Error(errorMessage);
            }

            // Download the Excel file
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${currentDoc.title.replace(/\s+/g, "_")}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success("Excel exported successfully");
        } catch (error) {
            console.error("Error exporting Excel:", error);
            toast.error("Failed to export Excel");
        } finally {
            setIsExporting(false);
        }
    }, [currentDoc]);

    // Create Google Sheet
    const createGoogleSheet = useCallback(async () => {
        if (!currentDoc) return;

        setIsExporting(true);

        try {
            // Extract pricing data
            const pricing = currentDoc.pricingData;

            // Prepare SOW data for Google Sheets
            const sowData = {
                clientName: currentDoc.clientName || "",
                serviceName: currentDoc.title,
                accessToken: "", // Will need to get from user or OAuth
                overview: "", // Extract from content if needed
                deliverables: [], // Extract from pricing data if available
                outcomes: [], // Extract from content if needed
                phases: [], // Extract from content if needed
                pricing: pricing || {},
                assumptions: [], // Extract from pricing data if available
                timeline: "", // Extract from content if needed
            };

            const response = await fetch("/api/export/google-sheet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sowData),
            });

            if (!response.ok) {
                throw new Error("Failed to create Google Sheet");
            }

            const data = await response.json();

            // Open the Google Sheet
            if (data.sheetUrl) {
                window.open(data.sheetUrl, "_blank");
            }

            toast.success("Google Sheet created successfully");
        } catch (error) {
            console.error("Error creating Google Sheet:", error);
            toast.error("Failed to create Google Sheet");
        } finally {
            setIsExporting(false);
        }
    }, [currentDoc]);

    // Share document
    const shareDocument = useCallback(async () => {
        if (!currentDoc) return;

        setIsExporting(true);

        try {
            // Generate share link
            const baseUrl = window.location.origin;
            const shareLink = `${baseUrl}/shared/${currentDoc.id}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(shareLink);

            // Update share statistics if needed
            try {
                await fetch(`/api/documents/${currentDoc.id}/share`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            } catch (error) {
                console.error("Error updating share statistics:", error);
                // Continue even if statistics update fails
            }

            toast.success("Share link copied to clipboard");
        } catch (error) {
            console.error("Error sharing document:", error);
            toast.error("Failed to share document");
        } finally {
            setIsExporting(false);
        }
    }, [currentDoc]);

    // Embed document to AI workspace
    const embedToAI = useCallback(async () => {
        if (!currentDoc) return;

        setIsExporting(true);

        try {
            const toastId = toast.loading(
                "Embedding document to AI workspace...",
                {
                    duration: 60000,
                },
            );

            // Extract client name
            const clientName = currentDoc.clientName || "Unknown Client";

            // Get workspace slug
            const workspaceSlug = currentDoc.workspaceSlug;
            if (!workspaceSlug) {
                throw new Error("No workspace slug available");
            }

            // Get HTML content
            const htmlContent = editorRef.current?.getHTML();
            if (!htmlContent) {
                throw new Error("No content available to embed");
            }

            // Call embedding API
            const success = await anythingLLM.embedSOWDocument(
                currentDoc.title || currentDoc.id,
                htmlContent,
                workspaceSlug,
            );

            toast.dismiss(toastId);

            if (success) {
                toast.success("Document embedded successfully", {
                    duration: 3000,
                });
            } else {
                toast.error("Failed to embed document", { duration: 5000 });
            }
        } catch (error) {
            console.error("Error embedding document:", error);
            toast.error("Failed to embed document");
        } finally {
            setIsExporting(false);
        }
    }, [currentDoc, editorRef]);

    // Export specific document by ID (allows calling from UI components like ExportPanel)
    const exportDocToPDF = useCallback(async (documentId: string, options?: any) => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/export/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId, ...options }),
            });
            if (!response.ok) throw new Error('Failed to export PDF');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.pdf';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('PDF exported successfully');
        } catch (err) {
            console.error('Error exporting PDF', err);
            toast.error('Failed to export PDF');
        } finally {
            setIsExporting(false);
        }
    }, []);

    const exportDocToExcel = useCallback(async (documentId: string, options?: any) => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/export/excel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId, ...options }),
            });
            if (!response.ok) throw new Error('Failed to export Excel');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.xlsx';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Excel exported successfully');
        } catch (err) {
            console.error('Error exporting Excel', err);
            toast.error('Failed to export Excel');
        } finally {
            setIsExporting(false);
        }
    }, []);

    const previewDocument = useCallback(async (documentId: string, format: 'pdf' | 'excel') => {
        // Minimal placeholder implementation - the ExportPanel can call this and open modal
        try {
            // For now, just validate that the document is present and return true
            const response = await fetch(`/api/documents/${documentId}`);
            if (!response.ok) throw new Error('Document not found');
            return true;
        } catch (err) {
            console.error('Error previewing document', err);
            return false;
        }
    }, []);

    // Open AI chat with document context
    const openAIChat = useCallback(async () => {
        if (!currentDoc) return;

        try {
            // Extract client name
            const clientName = currentDoc.clientName || "Unknown Client";

            // Get workspace slug
            const workspaceSlug = currentDoc.workspaceSlug;
            if (!workspaceSlug) {
                throw new Error("No workspace slug available");
            }

            // Create chat URL
            const url = `/chat?workspace=${workspaceSlug}&document=${currentDoc.id}&client=${encodeURIComponent(clientName)}`;

            // Open in new tab
            window.open(url, "_blank");
        } catch (error) {
            console.error("Error opening AI chat:", error);
            toast.error("Failed to open AI chat");
        }
    }, [currentDoc]);

    return {
        isExporting,
        newPDFModalOpen,
        setNewPDFModalOpen,
        newPDFData,
        setNewPDFData,
        exportToPDF,
        exportToNewPDF,
        exportToExcel,
        exportDocToPDF,
        exportDocToExcel,
        previewDocument,
        createGoogleSheet,
        shareDocument,
        embedToAI,
        openAIChat,
    };
}
