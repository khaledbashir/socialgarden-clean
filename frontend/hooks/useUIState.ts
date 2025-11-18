import { useState } from 'react';

export const useUIState = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentSidebarOpen, setAgentSidebarOpen] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalData, setShareModalData] = useState<
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
    | null
  >(null);
  const [showGuidedSetup, setShowGuidedSetup] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "dashboard">("editor");
  const [isGrandTotalVisible, setIsGrandTotalVisible] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNewPDFModal, setShowNewPDFModal] = useState(false);
  const [newPDFData, setNewPDFData] = useState<any>(null);

  return {
    sidebarOpen,
    setSidebarOpen,
    agentSidebarOpen,
    setAgentSidebarOpen,
    showSendModal,
    setShowSendModal,
    showShareModal,
    setShowShareModal,
    shareModalData,
    setShareModalData,
    showGuidedSetup,
    setShowGuidedSetup,
    viewMode,
    setViewMode,
    isGrandTotalVisible,
    setIsGrandTotalVisible,
    showOnboarding,
    setShowOnboarding,
    showNewPDFModal,
    setShowNewPDFModal,
    newPDFData,
    setNewPDFData,
  };
};
