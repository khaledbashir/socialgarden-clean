"use client";

import React from "react";
import { EnhancedDashboard } from "./enhanced-dashboard";

interface DashboardMainProps {
  onOpenInEditor?: (sowId: string) => void;
  onOpenInPortal?: (sowId: string) => void;
}

export default function DashboardMain({ onOpenInEditor, onOpenInPortal }: DashboardMainProps) {
  return (
    <div className="h-full bg-[#0e0f0f]">
      <EnhancedDashboard
        onOpenInEditor={onOpenInEditor}
        onOpenInPortal={onOpenInPortal}
      />
    </div>
  );
}
