"use client";

import WorkOrderDesktopWorkspaceView from "@/components/workorder/layout/WorkOrderDesktopWorkspaceView";
import WorkOrderMobileWorkspaceView from "@/components/workorder/layout/WorkOrderMobileWorkspaceView";
import WorkOrderTabletWorkspaceView from "@/components/workorder/layout/WorkOrderTabletWorkspaceView";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import { useWorkspaceLayoutMode } from "@/lib/responsive/useWorkspaceLayoutMode";

export default function WorkOrderLayout(props: WorkOrderLayoutViewProps) {
  const { deviceType, layoutMode } = useWorkspaceLayoutMode();

  if (layoutMode === "drawer") {
    return <WorkOrderMobileWorkspaceView {...props} />;
  }

  if (deviceType === "tablet") {
    return <WorkOrderTabletWorkspaceView {...props} />;
  }

  return <WorkOrderDesktopWorkspaceView {...props} />;
}
