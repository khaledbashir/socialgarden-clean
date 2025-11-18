import React, { useState } from "react";
import {
    Download,
    FileText,
    FileSpreadsheet,
    Settings,
    Eye,
    Check,
} from "lucide-react";
import { Button } from "@/components/tailwind/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/tailwind/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/tailwind/ui/tabs";
import { Checkbox } from "@/components/tailwind/ui/checkbox";
import { Separator } from "@/components/tailwind/ui/separator";
import { Label } from "@/components/tailwind/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/tailwind/ui/select";
import { useExportManager } from "@/hooks/useExportManager";
import type { Document } from "@/types";

const ExportPanel = ({
    document,
    workspace,
    onPreview,
    exportManager,
}: {
    document: Document;
    workspace: any;
    onPreview: () => void;
    exportManager?: any; // optional export manager instance passed from page-level hook
}) => {
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
    const [exportOptions, setExportOptions] = useState({
        includePricing: true,
        includeTimeline: true,
        includeAssumptions: true,
        includeDeliverables: true,
        includeWatermark: false,
        passwordProtected: false,
        highQuality: true,
    });
    const [previewOpen, setPreviewOpen] = useState(false);

    const manager = exportManager ?? useExportManager();
    const { exportToPDF, exportToNewPDF, exportToExcel, exportDocToPDF, exportDocToExcel, isExporting, previewDocument } = manager;

    const handleExport = async () => {
        try {
            const options = { ...exportOptions };

            if (exportFormat === "pdf") {
                await exportDocToPDF(document.id, options);
            } else {
                await exportDocToExcel(document.id, options);
            }

            setExportDialogOpen(false);
        } catch (error) {
            console.error(`Failed to export ${exportFormat}:`, error);
        }
    };

    const handlePreview = async () => {
        try {
            await previewDocument(document.id, exportFormat);
            setPreviewOpen(true);
        } catch (error) {
            console.error("Failed to preview document:", error);
        }
    };

    const updateOption = (key: string, value: boolean) => {
        setExportOptions((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-medium mb-2">Export Options</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Export your SOW in various formats for sharing with clients
                    or internal use
                </p>
            </div>

            <div className="flex-1 p-4 space-y-4">
                <div className="space-y-3">
                    <Dialog
                        open={exportDialogOpen}
                        onOpenChange={setExportDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="w-full" disabled={isExporting}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Export Document</DialogTitle>
                                <DialogDescription>
                                    Choose format and options for exporting your
                                    document
                                </DialogDescription>
                            </DialogHeader>

                            <Tabs
                                value={exportFormat}
                                onValueChange={(value) =>
                                    setExportFormat(value as "pdf" | "excel")
                                }
                            >
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="pdf">
                                        <FileText className="h-4 w-4 mr-2" />
                                        PDF
                                    </TabsTrigger>
                                    <TabsTrigger value="excel">
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Excel
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent
                                    value="pdf"
                                    className="space-y-4 pt-4"
                                >
                                    <div className="space-y-2">
                                        <Label>Include Sections</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-pricing-pdf"
                                                    checked={
                                                        exportOptions.includePricing
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includePricing",
                                                            !exportOptions.includePricing,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-pricing-pdf"
                                                    className="text-sm"
                                                >
                                                    Pricing Details
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-timeline-pdf"
                                                    checked={
                                                        exportOptions.includeTimeline
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includeTimeline",
                                                            !exportOptions.includeTimeline,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-timeline-pdf"
                                                    className="text-sm"
                                                >
                                                    Timeline & Milestones
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-assumptions-pdf"
                                                    checked={
                                                        exportOptions.includeAssumptions
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includeAssumptions",
                                                            !exportOptions.includeAssumptions,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-assumptions-pdf"
                                                    className="text-sm"
                                                >
                                                    Assumptions
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-deliverables-pdf"
                                                    checked={
                                                        exportOptions.includeDeliverables
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includeDeliverables",
                                                            !exportOptions.includeDeliverables,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-deliverables-pdf"
                                                    className="text-sm"
                                                >
                                                    Deliverables
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label>PDF Options</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-watermark-pdf"
                                                    checked={
                                                        exportOptions.includeWatermark
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includeWatermark",
                                                            !exportOptions.includeWatermark,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-watermark-pdf"
                                                    className="text-sm"
                                                >
                                                    Add Watermark
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="password-protected-pdf"
                                                    checked={
                                                        exportOptions.passwordProtected
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "passwordProtected",
                                                            !exportOptions.passwordProtected,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="password-protected-pdf"
                                                    className="text-sm"
                                                >
                                                    Password Protect
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="high-quality-pdf"
                                                    checked={
                                                        exportOptions.highQuality
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "highQuality",
                                                            !exportOptions.highQuality,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="high-quality-pdf"
                                                    className="text-sm"
                                                >
                                                    High Quality
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent
                                    value="excel"
                                    className="space-y-4 pt-4"
                                >
                                    <div className="space-y-2">
                                        <Label>Include Sections</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-pricing-excel"
                                                    checked={
                                                        exportOptions.includePricing
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includePricing",
                                                            !exportOptions.includePricing,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-pricing-excel"
                                                    className="text-sm"
                                                >
                                                    Pricing Details
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-timeline-excel"
                                                    checked={
                                                        exportOptions.includeTimeline
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includeTimeline",
                                                            !exportOptions.includeTimeline,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-timeline-excel"
                                                    className="text-sm"
                                                >
                                                    Timeline & Milestones
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-assumptions-excel"
                                                    checked={
                                                        exportOptions.includeAssumptions
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includeAssumptions",
                                                            !exportOptions.includeAssumptions,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-assumptions-excel"
                                                    className="text-sm"
                                                >
                                                    Assumptions
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="include-deliverables-excel"
                                                    checked={
                                                        exportOptions.includeDeliverables
                                                    }
                                                    onCheckedChange={() =>
                                                        updateOption(
                                                            "includeDeliverables",
                                                            !exportOptions.includeDeliverables,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="include-deliverables-excel"
                                                    className="text-sm"
                                                >
                                                    Deliverables
                                                </Label>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label>Excel Options</Label>
                                        <div>
                                            <Label
                                                htmlFor="format-select"
                                                className="text-sm"
                                            >
                                                Format Style
                                            </Label>
                                            <Select defaultValue="corporate">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="corporate">
                                                        Corporate
                                                    </SelectItem>
                                                    <SelectItem value="minimal">
                                                        Minimal
                                                    </SelectItem>
                                                    <SelectItem value="colorful">
                                                        Colorful
                                                    </SelectItem>
                                                    <SelectItem value="custom">
                                                        Custom
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="flex justify-between pt-4">
                                <Button
                                    variant="outline"
                                    onClick={handlePreview}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                </Button>
                                <Button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    {isExporting ? "Exporting..." : "Export"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onPreview}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Document
                    </Button>

                    <div className="pt-4">
                        <h4 className="font-medium mb-2">Recent Exports</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <div>
                                        <div className="text-sm font-medium">
                                            ABC Company SOW.pdf
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            2 days ago • 2.3 MB
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center space-x-2">
                                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                                    <div>
                                        <div className="text-sm font-medium">
                                            Pricing Breakdown.xlsx
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            5 days ago • 1.1 MB
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">
                        Document Information
                    </h4>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Settings className="h-3 w-3" />
                    </Button>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                        <span>Title:</span>
                        <span>{document.title}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Client:</span>
                        <span>{document.clientName || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Total Value:</span>
                        <span>
                            $
                            {document.totalInvestment?.toLocaleString() ||
                                "Not calculated"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Last Modified:</span>
                        <span>
                            {document.lastModified
                                ? new Date(
                                      document.lastModified,
                                  ).toLocaleDateString()
                                : "Never"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Document Preview</DialogTitle>
                        <DialogDescription>
                            Preview of your exported document
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="border rounded-md p-4 min-h-[400px] bg-gray-50">
                            <div className="text-center text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-2" />
                                <p>Document preview would appear here</p>
                                <p className="text-sm">
                                    This is a placeholder for the actual preview
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPreviewOpen(false)}
                        >
                            Close
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting}>
                            <Download className="h-4 w-4 mr-2" />
                            {isExporting ? "Exporting..." : "Export"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ExportPanel;
