"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData?:
    | {
        sowId: string;
        sowName: string;
        requesterName: string;
        requesterEmail: string;
      }
    | {
        shareLink: string;
        documentTitle: string;
        shareCount: number;
        firstShared: string;
        lastShared: string;
      }
    | null;
}

export function ShareLinkModal({ isOpen, onClose, shareData }: ShareLinkModalProps) {
  const handleCopyLink = () => {
    if (!shareData) {
      toast.error("No share link available to copy.");
      return;
    }

    // Check if shareData is of the type that contains shareLink
    if ("shareLink" in shareData && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareData.shareLink);
      toast.success("Share link copied to clipboard!");
    } else if ("shareLink" in shareData) {
      // Fallback for copying
      toast.info("Share URL", {
        description: shareData.shareLink,
      });
    } else {
      toast.error("No share link available to copy.");
    }
  };

  // Determine which type of shareData we have and render accordingly
  const isSowShare = !!shareData && "sowId" in shareData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#0e2e33]" />
            {isSowShare ? "SOW Shared" : "Share Document"}
          </DialogTitle>
          <DialogDescription>
            {!shareData
              ? "No share data available"
              : isSowShare
              ? `SOW "${(shareData as any).sowName}" shared with ${(shareData as any).requesterName}.`
              : "Share a read-only link to this document."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          { !shareData ? (
            <p className="text-sm text-muted-foreground">No share information available.</p>
          ) : isSowShare ? (
            // Render SOW specific share details
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
              <p className="text-sm font-medium">SOW Details</p>
              <p className="text-sm text-muted-foreground">
                <strong>SOW ID:</strong> {(shareData as any).sowId}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>SOW Name:</strong> {(shareData as any).sowName}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Requester:</strong> {(shareData as any).requesterName} ({(shareData as any).requesterEmail})
              </p>
            </div>
          ) : (
            // Render general document share details
            <>
              {/* Share Link */}
              <div className="space-y-2">
                <Label htmlFor="shareLink">Shareable Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="shareLink"
                    value={(shareData as any).shareLink}
                    readOnly
                    className="font-mono text-sm"
                  />
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

              {/* Document Details */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
                <p className="text-sm font-medium">Document Details</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Title:</strong> {(shareData as any).documentTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Shared:</strong> {(shareData as any).shareCount} times
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>First Shared:</strong> {new Date((shareData as any).firstShared).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Last Shared:</strong> {new Date((shareData as any).lastShared).toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
