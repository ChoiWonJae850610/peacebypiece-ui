"use client";

import WorkOrderDetailDesktopView from "@/components/workorder/layout/WorkOrderDetailDesktopView";
import WorkOrderDetailMobileView from "@/components/workorder/layout/WorkOrderDetailMobileView";
import WorkOrderDetailTabletView from "@/components/workorder/layout/WorkOrderDetailTabletView";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import { useWorkspaceLayoutMode } from "@/lib/responsive/useWorkspaceLayoutMode";

export default function WorkOrderLayout(props: WorkOrderLayoutViewProps) {
  const { deviceType, layoutMode } = useWorkspaceLayoutMode();

  if (layoutMode === "drawer") {
    return <WorkOrderDetailMobileView {...props} />;
  }

  if (deviceType === "tablet") {
    return <WorkOrderDetailTabletView {...props} />;
  }

  return <WorkOrderDetailDesktopView {...props} />;
}
