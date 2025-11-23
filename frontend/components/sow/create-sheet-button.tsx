'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/tailwind/ui/button';
import { FileSpreadsheet, Loader2, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/tailwind/ui/dialog';

interface CreateSheetButtonProps {
  clientName: string;
  serviceName: string;
  sowData: {
    overview: string;
    deliverables: string;
    outcomes: string;
    phases: string;
    pricing: any[];
    assumptions: string;
    timeline: string;
  };
  triggerText?: string;
}

export function CreateSheetButton({
  clientName,
  serviceName,
  sowData,
  triggerText = 'Create Professional Sheet',
}: CreateSheetButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [shareLink, setShareLink] = useState<string>('');
  const [isOAuthAuthorized, setIsOAuthAuthorized] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');

  // Check for OAuth callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('oauth_token');
    const error = params.get('oauth_error');

    console.log('🔍 Checking for OAuth token...');
    console.log('URL params:', { oauthToken, error });

    if (error) {
      console.error('❌ OAuth error:', error);
      toast.error(`OAuth error: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (oauthToken) {
      console.log('✅ OAuth token received from callback:', oauthToken);
      setAccessToken(oauthToken);
      setIsOAuthAuthorized(true);
      toast.success('Google account authorized! Ready to create sheet.');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      console.log('⚠️ No oauth_token found in URL');
    }
  }, []);

  const handleAuthorizeGoogle = async () => {
    try {
      setIsLoading(true);
      // Get current URL to return to after OAuth
      const returnUrl = window.location.pathname + window.location.search;
      
      const response = await fetch(`/api/oauth/authorize?returnUrl=${encodeURIComponent(returnUrl)}`, {
        method: 'GET',
      });

      if (!response.ok) throw new Error('Failed to get authorization URL');

      const data = await response.json();
      // Redirect to Google OAuth
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to authorize with Google');
      setIsLoading(false);
    }
  };

  const handleCreateSheet = async () => {
    if (!clientName || !serviceName) {
      toast.error('Client name and service name are required');
      return;
    }

    if (!isOAuthAuthorized || !accessToken) {
      toast.error('Please authorize Google first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/create-sow-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName,
          serviceName,
          accessToken,
          ...sowData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sheet');
      }

      const result = await response.json();
      setSheetUrl(result.sheet_url);
      setShareLink(result.share_link);
      setShowSuccess(true);
      toast.success('Professional sheet created successfully!');
    } catch (error) {
      console.error('Error creating sheet:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <>
      {!isOAuthAuthorized ? (
        <Button
          onClick={handleAuthorizeGoogle}
          disabled={isLoading}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authorizing...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              Authorize Google
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={handleCreateSheet}
          disabled={isLoading}
          className="gap-2 bg-[#1CBF79] hover:bg-[#15a862] text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              {triggerText}
            </>
          )}
        </Button>
      )}

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#1CBF79]" />
              <div>
                <DialogTitle>Sheet Created Successfully!</DialogTitle>
                <DialogDescription>
                  Your professional Social Garden SOW sheet is ready to share.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Client Info */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <p className="text-sm font-medium text-slate-700">
                {clientName} - {serviceName}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Sheet created with professional formatting and Social Garden branding
              </p>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded text-slate-600"
                />
                <Button
                  onClick={() => copyToClipboard(shareLink)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Copy this link to share with your client or team
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => window.open(sheetUrl, '_blank')}
                className="flex-1 gap-2 bg-[#1CBF79] hover:bg-[#15a862] text-white"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Sheets
              </Button>
              <Button
                onClick={() => setShowSuccess(false)}
                variant="outline"
                className="flex-1"
              >
                Done
              </Button>
            </div>

            {/* Next Steps */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs font-medium text-blue-900 mb-2">Next Steps:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>✓ Sheet is saved in your Google Drive</li>
                <li>✓ Copy the link and email to your client</li>
                <li>✓ They can view and collaborate in real-time</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
