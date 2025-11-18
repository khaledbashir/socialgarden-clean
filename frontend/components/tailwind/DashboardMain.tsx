"use client";

import React from "react";
import { EnhancedDashboard } from "./enhanced-dashboard";
import { Workspace, Document, Folder, SOW } from "@/lib/types/sow"; // Import necessary types

interface DashboardMainProps {
  workspaces: Workspace[];
  sows: Document[];
  folders: Folder[];
  onSelectSOW: (id: string) => void;
  onCreateSOW: (workspaceId: string, sowName: string) => Promise<void>;
  onDeleteSOW: (id: string) => Promise<void>;
  onRenameSOW: (sowId: string, newName: string) => void;
  onMoveSOW: (
    sowId: string,
    fromWorkspaceId: string,
    toWorkspaceId: string,
    toIndex?: number
  ) => Promise<void>;
  onCreateWorkspace: (
    name: string,
    type?: "sow" | "client" | "generic"
  ) => Promise<void>;
  onDeleteWorkspace: (id: string) => Promise<void>;
  onRenameWorkspace: (workspaceId: string, newName: string) => void;
}

export default function DashboardMain({
  workspaces,
  sows,
  folders,
  onSelectSOW,
  onCreateSOW,
  onDeleteSOW,
  onRenameSOW,
  onMoveSOW,
  onCreateWorkspace,
  onDeleteWorkspace,
  onRenameWorkspace,
}: DashboardMainProps) {
  return (
    <div className="h-full bg-[#0e0f0f]">
      <EnhancedDashboard
        workspaces={workspaces}
        sows={sows}
        folders={folders}
        onSelectSOW={onSelectSOW}
        onCreateSOW={onCreateSOW}
        onDeleteSOW={onDeleteSOW}
        onRenameSOW={onRenameSOW}
        onMoveSOW={onMoveSOW}
        onCreateWorkspace={onCreateWorkspace}
        onDeleteWorkspace={onDeleteWorkspace}
        onRenameWorkspace={onRenameWorkspace}
      />
    </div>
  );
}
