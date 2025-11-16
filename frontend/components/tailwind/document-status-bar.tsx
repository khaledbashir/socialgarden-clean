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

interface DocumentStatusBarProps {
    title: string;
    saveStatus: "unsaved" | "saving" | "saved";
    onSave?: () => void;
    isSaving?: boolean;
    onExportPDF?: () => void;
    onExportNewPDF?: () => void; // NEW: Professional PDF export
    onExportExcel?: () => void;
    onSharePortal?: () => void;
    vertical?: string; // 📊 Social Garden BI
    serviceLine?: string; // 📊 Social Garden BI
    onVerticalChange?: (vertical: string) => void; // 📊 Social Garden BI
    onServiceLineChange?: (serviceLine: string) => void; // 📊 Social Garden BI
    isGrandTotalVisible?: boolean; // 👁️ Toggle grand total visibility
    onToggleGrandTotal?: () => void; // 👁️ Toggle grand total visibility
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
    vertical,
    serviceLine,
    onVerticalChange,
    onServiceLineChange,
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
                {/* Social Garden BI Dropdowns */}
                {(onVerticalChange || onServiceLineChange) && (
                    <div className="flex items-center gap-2 pr-3 border-r border-[#2A2A2D]">
                        {onVerticalChange && (
                            <select
                                value={vertical || ""}
                                onChange={(e) =>
                                    onVerticalChange(e.target.value)
                                }
                                className="h-8 px-3 text-sm bg-[#1A1A1D] border border-[#2A2A2D] text-gray-300 rounded-md hover:bg-[#2A2A2D] hover:border-[#1CBF79]/50 focus:outline-none focus:ring-2 focus:ring-[#1CBF79]/50 transition-colors"
                            >
                                <option value="">🏢 Select Vertical</option>
                                <option value="property">🏢 Property</option>
                                <option value="education">
                                    🎓 Higher Education
                                </option>
                                <option value="finance">💰 Finance</option>
                                <option value="healthcare">
                                    🏥 Healthcare
                                </option>
                                <option value="retail">🛍️ Retail</option>
                                <option value="hospitality">
                                    🏨 Hospitality
                                </option>
                                <option value="professional-services">
                                    💼 Professional Services
                                </option>
                                <option value="technology">
                                    💻 Technology
                                </option>
                                <option value="other">📊 Other</option>
                            </select>
                        )}

                        {onServiceLineChange && (
                            <select
                                value={serviceLine || ""}
                                onChange={(e) =>
                                    onServiceLineChange(e.target.value)
                                }
                                className="h-8 px-3 text-sm bg-[#1A1A1D] border border-[#2A2A2D] text-gray-300 rounded-md hover:bg-[#2A2A2D] hover:border-[#1CBF79]/50 focus:outline-none focus:ring-2 focus:ring-[#1CBF79]/50 transition-colors"
                            >
                                <option value="">🔧 Select Service</option>
                                <option value="crm-implementation">
                                    🔧 CRM Implementation
                                </option>
                                <option value="marketing-automation">
                                    ⚙️ Marketing Automation
                                </option>
                                <option value="revops-strategy">
                                    📊 RevOps Strategy
                                </option>
                                <option value="managed-services">
                                    🛠️ Managed Services
                                </option>
                                <option value="consulting">
                                    💡 Consulting
                                </option>
                                <option value="training">📚 Training</option>
                                <option value="other">🔹 Other</option>
                            </select>
                        )}
                    </div>
                )}

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                    {onToggleGrandTotal && (
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
