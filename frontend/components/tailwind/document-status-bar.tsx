"use client";

import {
    Check,
    AlertCircle,
    Loader2,
    Download,
    FileSpreadsheet,
    Share2,
    Eye,
    EyeOff,
    FilePlus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface DocumentStatusBarProps {
    title: string;
    saveStatus: "unsaved" | "saving" | "saved";
    onSave?: () => void;
    isSaving?: boolean;
    onExportPDF?: () => void;
    onExportNewPDF?: () => void; // NEW: Professional PDF export
    onExportExcel?: () => void;
    onSharePortal?: () => void;
    // Removed vertical/service selects per request
    isGrandTotalVisible?: boolean; // 👁️ Toggle grand total visibility
    onToggleGrandTotal?: () => void; // 👁️ Toggle grand total visibility
    onChangeMaxBudget?: (value: number) => void; // 🔒 Strict budget enforcement input
}

export function DocumentStatusBar({
    title,
    saveStatus,
    onSave,
    isSaving = false,
    onExportPDF,
    onExportNewPDF,
    onExportExcel,
    onSharePortal,
    isGrandTotalVisible,
    onToggleGrandTotal,
}: DocumentStatusBarProps) {
    const statusConfig = {
        unsaved: {
            icon: AlertCircle,
            text: "Unsaved Changes",
            color: "text-yellow-400",
            bgColor: "bg-yellow-500/10",
        },
        saving: {
            icon: Loader2,
            text: "Saving...",
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
        },
        saved: {
            icon: Check,
            text: "All changes saved",
            color: "text-green-400",
            bgColor: "bg-green-500/10",
        },
    };

    const config = statusConfig[saveStatus];
    const IconComponent = config.icon;

    return (
        <div className="h-14 bg-[#0E0F0F] border-b border-[#2A2A2D] flex items-center justify-between px-6 flex-shrink-0">
            {/* Title */}
            <h2 className="text-lg font-semibold text-white truncate">
                {title}
            </h2>

            {/* Actions Section */}
            <div className="flex items-center gap-3">
                {/* Vertical/Service selects removed as per user preference */}

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                    {onToggleGrandTotal && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label className="text-sm text-gray-300">Client Presentation Mode</Label>
                        <Button
                            onClick={onToggleGrandTotal}
                            variant="outline"
                            size="sm"
                            className="bg-[#1A1A1D] hover:bg-[#2A2A2D] text-gray-300 hover:text-white border-[#2A2A2D] transition-colors"
                            title={
                                isGrandTotalVisible
                                    ? "Hide combined total"
                                    : "Show combined total"
                            }
                        >
                            {isGrandTotalVisible ? (
                                <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Hide Total
                                </>
                            ) : (
                                <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Show Total
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-sm text-gray-300">Max Budget (AUD)</Label>
                        <Input
                            type="number"
                            placeholder="e.g. 22000"
                            className="h-8 w-32 bg-[#1A1A1D] text-gray-200 border-[#2A2A2D]"
                            onChange={(e) => onChangeMaxBudget?.(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
                    )}

                    {onExportPDF && (
                        <Button
                            onClick={onExportPDF}
                            variant="outline"
                            size="sm"
                            className="bg-[#1A1A1D] hover:bg-[#2A2A2D] text-gray-300 hover:text-white border-[#2A2A2D] transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    )}

                    {onExportNewPDF && (
                        <Button
                            onClick={onExportNewPDF}
                            variant="outline"
                            size="sm"
                            className="bg-[#1A1A1D] hover:bg-green-600 text-green-400 hover:text-white border-green-600 transition-colors"
                        >
                            <FilePlus className="w-4 h-4 mr-2" />
                            Export Professional PDF
                        </Button>
                    )}

                    {/* Excel Export - NOW ENABLED */}
                    {onExportExcel && (
                        <Button
                            onClick={onExportExcel}
                            variant="outline"
                            size="sm"
                            className="bg-[#1A1A1D] hover:bg-[#2A2A2D] text-gray-300 hover:text-white border-[#2A2A2D] transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export Excel
                        </Button>
                    )}

                    {onSharePortal && (
                        <Button
                            onClick={onSharePortal}
                            variant="outline"
                            size="sm"
                            className="bg-[#1A1A1D] hover:bg-[#2A2A2D] text-gray-300 hover:text-white border-[#2A2A2D] transition-colors"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Portal
                        </Button>
                    )}
                </div>

                {/* Separator */}
                {(onExportPDF || onExportExcel || onSharePortal) &&
                    (onSave || saveStatus) && (
                        <div className="h-6 w-px bg-[#2A2A2D]"></div>
                    )}

                {/* Status Indicator */}
                <div
                    className={`flex items-center gap-2 px-3 py-1 rounded ${config.bgColor}`}
                >
                    <IconComponent
                        className={`w-4 h-4 ${config.color} ${
                            saveStatus === "saving" ? "animate-spin" : ""
                        }`}
                    />
                    <span className={`text-sm font-medium ${config.color}`}>
                        {config.text}
                    </span>
                </div>

                {/* Save Button */}
                {onSave && (
                    <Button
                        onClick={onSave}
                        disabled={saveStatus === "saved" || isSaving}
                        className={`text-white font-semibold transition-all ${
                            saveStatus === "saved" || isSaving
                                ? "bg-gray-700 hover:bg-gray-700 text-gray-400 cursor-not-allowed"
                                : "bg-[#1CBF79] hover:bg-[#15a366]"
                        }`}
                        size="sm"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
