import React, { useState } from "react";
import {
    Plus,
    Filter,
    Search,
    Download,
    FileText,
    DollarSign,
    Calendar,
    User,
    MoreVertical,
    Edit,
    Trash2,
    Mail,
    Share2,
    Eye,
    Copy,
} from "lucide-react";
import type { Document, Workspace } from "@/types";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Badge } from "@/components/tailwind/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/tailwind/ui/dropdown-menu";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/tailwind/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/tailwind/ui/tabs";
import { useExportManager } from "@/hooks/useExportManager";
import { SHOW_CLIENT_PORTAL_UI } from '@/config/featureFlags';

const DashboardView = ({
    documents,
    workspace,
    onDocumentSelect,
    onNewSOW,
    onSendToClient,
    onShare,
    onFilterChange,
}: {
    documents: Document[];
    workspace: Workspace;
    onDocumentSelect: (documentId: string) => void;
    onNewSOW: () => void;
    onSendToClient: (documentId: string) => void;
    onShare: (documentId: string) => void;
    onFilterChange: (filter: { type: string; value: string } | null) => void;
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [currentFilter, setCurrentFilter] = useState<{
        type: string;
        value: string;
    } | null>(null);
    const [sendToClientModalOpen, setSendToClientModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
        null,
    );

    const [isExporting, setIsExporting] = useState(false);

    // Filter documents based on search term and active tab
    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch =
            doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.clientName &&
                doc.clientName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()));

        if (activeTab === "all") return matchesSearch;
        if (activeTab === "recent") {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 7);
            return (
                matchesSearch &&
                doc.lastModified &&
                new Date(doc.lastModified) > recentDate
            );
        }
        if (activeTab === "starred") {
            // In a real implementation, this would check for a starred flag
            return matchesSearch && Math.random() > 0.7; // Mock starred documents
        }
        return matchesSearch;
    });

    const handleFilter = (type: string, value: string) => {
        const newFilter = { type, value };
        setCurrentFilter(newFilter);
        onFilterChange(newFilter);
        setFilterDialogOpen(false);
    };

    const clearFilter = () => {
        setCurrentFilter(null);
        onFilterChange(null);
    };

    const handleSendToClient = () => {
        if (selectedDocumentId) {
            onSendToClient(selectedDocumentId);
            setSendToClientModalOpen(false);
            setSelectedDocumentId(null);
        }
    };

    const handleShare = () => {
        if (selectedDocumentId) {
            onShare(selectedDocumentId);
            setShareModalOpen(false);
            setSelectedDocumentId(null);
        }
    };

    const handleExportPDF = async (documentId: string) => {
        try {
            setIsExporting(true);

            // Find the document
            const doc = documents.find((d) => d.id === documentId);
            if (!document) {
                throw new Error("Document not found");
            }

            // Generate filename
            const filename = `${document.title.replace(/\s+/g, "_")}.pdf`;

            // Call PDF export API
            const response = await fetch("/api/export/pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentId,
                    filename,
                    html_content: doc?.content,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to export PDF");
            }

            // Download the PDF
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export PDF:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async (documentId: string) => {
        try {
            setIsExporting(true);

            // Find the document
            const doc = documents.find((d) => d.id === documentId);
            if (!document) {
                throw new Error("Document not found");
            }

            // Generate filename
            const filename = `${doc?.title?.replace(/\s+/g, "_")}.xlsx`;

            // Call Excel export API
            const response = await fetch("/api/export/excel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentId,
                    title: doc?.title,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to export Excel");
            }

            // Download the Excel file
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export Excel:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const totalInvestment = documents.reduce(
        (sum, doc) => sum + (doc.totalInvestment || 0),
        0,
    );

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">{workspace.name}</h1>
                    <Button onClick={onNewSOW}>
                        <Plus className="h-4 w-4 mr-1" />
                        New SOW
                    </Button>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search SOWs..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Dialog
                        open={filterDialogOpen}
                        onOpenChange={setFilterDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-1" />
                                Filter
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Filter SOWs</DialogTitle>
                                <DialogDescription>
                                    Select a filter to apply to the SOWs
                                </DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="vertical">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="vertical">
                                        Vertical
                                    </TabsTrigger>
                                    <TabsTrigger value="service">
                                        Service
                                    </TabsTrigger>
                                    <TabsTrigger value="status">
                                        Status
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent
                                    value="vertical"
                                    className="space-y-2 pt-4"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter(
                                                "vertical",
                                                "Digital Marketing",
                                            )
                                        }
                                    >
                                        Digital Marketing
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter(
                                                "vertical",
                                                "Social Media",
                                            )
                                        }
                                    >
                                        Social Media
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter(
                                                "vertical",
                                                "Content Creation",
                                            )
                                        }
                                    >
                                        Content Creation
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter(
                                                "vertical",
                                                "Web Development",
                                            )
                                        }
                                    >
                                        Web Development
                                    </Button>
                                </TabsContent>
                                <TabsContent
                                    value="service"
                                    className="space-y-2 pt-4"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter("service", "Strategy")
                                        }
                                    >
                                        Strategy
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter(
                                                "service",
                                                "Implementation",
                                            )
                                        }
                                    >
                                        Implementation
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter(
                                                "service",
                                                "Management",
                                            )
                                        }
                                    >
                                        Management
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter(
                                                "service",
                                                "Consulting",
                                            )
                                        }
                                    >
                                        Consulting
                                    </Button>
                                </TabsContent>
                                <TabsContent
                                    value="status"
                                    className="space-y-2 pt-4"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter("status", "Draft")
                                        }
                                    >
                                        Draft
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter("status", "Review")
                                        }
                                    >
                                        Review
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter("status", "Approved")
                                        }
                                    >
                                        Approved
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            handleFilter("status", "Sent")
                                        }
                                    >
                                        Sent
                                    </Button>
                                </TabsContent>
                            </Tabs>
                            <DialogFooter>
                                {currentFilter && (
                                    <Button
                                        variant="outline"
                                        onClick={clearFilter}
                                    >
                                        Clear Filter
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {currentFilter && (
                    <div className="flex items-center space-x-2 mb-4">
                        <Badge
                            variant="secondary"
                            className="flex items-center space-x-1"
                        >
                            <span>
                                {currentFilter.type}: {currentFilter.value}
                            </span>
                            <button className="ml-1" onClick={clearFilter}>
                                <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </Badge>
                    </div>
                )}

                <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-600">
                                Total SOWs
                            </span>
                            <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                            {documents.length}
                        </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-green-600">
                                Total Value
                            </span>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                            ${totalInvestment.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-purple-600">
                                Clients
                            </span>
                            <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-900">
                            {
                                new Set(
                                    documents
                                        .filter((d) => d.clientName)
                                        .map((d) => d.clientName),
                                ).size
                            }
                        </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-orange-600">
                                Recent
                            </span>
                            <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="text-2xl font-bold text-orange-900">
                            {
                                documents.filter((d) => {
                                    const recentDate = new Date();
                                    recentDate.setDate(
                                        recentDate.getDate() - 7,
                                    );
                                    return (
                                        d.lastModified &&
                                        new Date(d.lastModified) > recentDate
                                    );
                                }).length
                            }
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="recent">Recent</TabsTrigger>
                        <TabsTrigger value="starred">Starred</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="p-4">
                    <div className="space-y-3">
                        {filteredDocuments.length > 0 ? (
                            filteredDocuments.map((document) => (
                                <div
                                    key={document.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h3
                                                    className="font-medium cursor-pointer hover:text-blue-600"
                                                    onClick={() =>
                                                        onDocumentSelect(
                                                            document.id,
                                                        )
                                                    }
                                                >
                                                    {document.title}
                                                </h3>
                                                {document.discount &&
                                                    document.discount > 0 && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-green-100 text-green-800"
                                                        >
                                                            {document.discount}%
                                                            off
                                                        </Badge>
                                                    )}
                                            </div>
                                            {document.clientName && (
                                                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                                                    <User className="h-3 w-3" />
                                                    <span>
                                                        {document.clientName}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                {document.totalInvestment && (
                                                    <div className="flex items-center space-x-1">
                                                        <DollarSign className="h-3 w-3" />
                                                        <span>
                                                            {document.totalInvestment.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                                {document.vertical && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {document.vertical}
                                                    </Badge>
                                                )}
                                                {document.serviceLine && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {document.serviceLine}
                                                    </Badge>
                                                )}
                                                {document.lastModified && (
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>
                                                            {new Date(
                                                                document.lastModified,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 ml-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-1 h-8 w-8"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            onDocumentSelect(
                                                                document.id,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {SHOW_CLIENT_PORTAL_UI && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedDocumentId(
                                                                document.id,
                                                            );
                                                            setSendToClientModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Mail className="h-4 w-4 mr-2" />
                                                        Send to Client
                                                    </DropdownMenuItem>
                                                    )}
                                                    {SHOW_CLIENT_PORTAL_UI && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedDocumentId(
                                                                document.id,
                                                            );
                                                            setShareModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Share2 className="h-4 w-4 mr-2" />
                                                        Share
                                                    </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleExportPDF(
                                                                document.id,
                                                            )
                                                        }
                                                        disabled={isExporting}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Export PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleExportExcel(
                                                                document.id,
                                                            )
                                                        }
                                                        disabled={isExporting}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Export Excel
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600">
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium mb-1">
                                    No SOWs found
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    {searchTerm || currentFilter
                                        ? "No SOWs match your search criteria"
                                        : "Get started by creating your first SOW"}
                                </p>
                                {!searchTerm && !currentFilter && (
                                    <Button onClick={onNewSOW}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Create SOW
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Send to Client Modal */}
            <Dialog
                open={sendToClientModalOpen}
                onOpenChange={setSendToClientModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send to Client</DialogTitle>
                        <DialogDescription>
                            Send this SOW to your client via email
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="client-email"
                                    className="text-sm font-medium"
                                >
                                    Client Email
                                </label>
                                <Input
                                    id="client-email"
                                    placeholder="client@example.com"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="subject"
                                    className="text-sm font-medium"
                                >
                                    Subject
                                </label>
                                <Input
                                    id="subject"
                                    placeholder="Statement of Work"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="message"
                                    className="text-sm font-medium"
                                >
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    className="w-full p-2 border rounded-md resize-none"
                                    rows={4}
                                    placeholder="Hi [Client Name], Please find the attached Statement of Work for your review."
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSendToClientModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSendToClient}>Send</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share Modal */}
            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share SOW</DialogTitle>
                        <DialogDescription>
                            Generate a shareable link for this SOW
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="share-link"
                                    className="text-sm font-medium"
                                >
                                    Share Link
                                </label>
                                <div className="flex space-x-2 mt-1">
                                    <Input
                                        id="share-link"
                                        readOnly
                                        value={`https://app.example.com/sow/${selectedDocumentId}`}
                                    />
                                    <Button variant="outline">Copy</Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">
                                    Permissions
                                </label>
                                <div className="mt-2 space-y-2">
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" defaultChecked />
                                        <span className="text-sm">
                                            View only
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" />
                                        <span className="text-sm">
                                            Allow comments
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input type="checkbox" />
                                        <span className="text-sm">
                                            Set expiration
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShareModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleShare}>Create Share Link</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DashboardView;
