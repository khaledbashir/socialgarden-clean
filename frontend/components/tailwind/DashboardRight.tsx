"use client";

import React from "react";
import DashboardChat from "@/components/tailwind/dashboard-chat";

interface DashboardRightProps {
  isOpen?: boolean;
  onToggle?: () => void;
  dashboardChatTarget?: string;
  onDashboardWorkspaceChange?: (slug: string) => void;
  availableWorkspaces?: Array<{ slug: string; name: string }>;
  chatMessages?: any[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  streamingMessageId?: string | null;
}

export default function DashboardRight(props: DashboardRightProps) {
  return <DashboardChat {...props} />;
}
