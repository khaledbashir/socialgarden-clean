/**
 * Send to Client Modal Component
 * Allows agency to send SOW to client with email and expiry options
 */

"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";
import { Loader2, Copy, Mail, Calendar, CheckCircle } from "lucide-react";

interface SendToClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId?: string; // optional folder/document id
  document?: {
    id: string;
    title: string;
    content: string;
    totalInvestment?: number;
  };
  onSuccess: (sowId: string, portalUrl: string) => void;
}

export function SendToClientModal({
  isOpen,
  onClose,
  docId,
  document,
  onSuccess,
}: SendToClientModalProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [portalUrl, setPortalUrl] = useState("");
  const [sowId, setSowId] = useState("");

  const handleSend = async () => {
    // Validation
    if (!clientName.trim()) {
      toast.error("Please enter client name");
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!document) {
      toast.error("No document selected to send");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create SOW in database
      const createResponse = await fetch("/api/sow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: document?.title ?? "",
          clientName,
          clientEmail,
          content: JSON.stringify(document?.content ?? ""), // Store as JSON string
          totalInvestment: document?.totalInvestment || 0,
          folderId: docId, // Link to original document
          creatorEmail: "sam@socialgarden.com.au", // TODO: Get from auth
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create SOW");
      }

      const createData = await createResponse.json();
      const newSowId = createData.sowId;
      setSowId(newSowId);

      // Step 2: Send to client (generates portal URL)
      const sendResponse = await fetch(`/api/sow/${newSowId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail,
          expiryDays,
        }),
      });

      if (!sendResponse.ok) {
        throw new Error("Failed to send SOW");
      }

      const sendData = await sendResponse.json();
      setPortalUrl(sendData.portalUrl);
      setIsSent(true);

      toast.success("SOW sent successfully!", {
        description: `Portal link ready for ${clientName}`,
      });

      onSuccess(newSowId, sendData.portalUrl);
    } catch (error) {
      console.error("Error sending SOW:", error);
      toast.error("Failed to send SOW", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(portalUrl);
      toast.success("Portal link copied to clipboard!");
    } else {
      // Fallback
      toast.info("Portal URL", {
        description: portalUrl,
      });
    }
  };

  const handleClose = () => {
    setIsSent(false);
    setPortalUrl("");
    setSowId("");
    setClientName("");
    setClientEmail("");
    setExpiryDays(30);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!isSent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#0e2e33]" />
                Send SOW to Client
              </DialogTitle>
              <DialogDescription>
                Create a secure portal link for your client to review and accept this SOW
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="e.g., ABC Corporation"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Client Email */}
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="e.g., john@abccorp.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Expiry Days */}
              <div className="space-y-2">
                <Label htmlFor="expiryDays" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Proposal Validity (days)
                </Label>
                <Input
                  id="expiryDays"
                  type="number"
                  min="1"
                  max="90"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Proposal will expire in {expiryDays} days
                </p>
              </div>

              {/* Document Info */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
                <p className="text-sm font-medium">Document Details</p>
                {!document ? (
                  <p className="text-sm text-muted-foreground">No document selected</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      <strong>Title:</strong> {document?.title ?? "Untitled"}
                    </p>
                    {document?.totalInvestment !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Investment:</strong> AUD{" "}
                        {document!.totalInvestment!.toLocaleString("en-AU", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading || !document}
                className="bg-[#0e2e33] hover:bg-[#0e2e33]/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send to Client
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                SOW Sent Successfully!
              </DialogTitle>
              <DialogDescription>
                Your client can now review and accept the proposal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Portal URL */}
              <div className="space-y-2">
                <Label>Client Portal URL</Label>
                <div className="flex gap-2">
                  <Input value={portalUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Success Info */}
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 space-y-2">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  What happens next?
                </p>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                  <li>Share the portal link with {clientName}</li>
                  <li>You'll get notified when they open it</li>
                  <li>Track their engagement in real-time</li>
                  <li>Receive alerts when they accept or comment</li>
                </ul>
              </div>

              {/* SOW ID for reference */}
              <div className="text-xs text-muted-foreground">
                SOW ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{sowId}</code>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
