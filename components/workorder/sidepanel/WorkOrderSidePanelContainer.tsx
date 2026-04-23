"use client";

import { useWorkOrderDeviceType } from "@/components/workorder/layout/useWorkOrderDeviceType";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";
import WorkOrderSidePanelDesktopView from "@/components/workorder/sidepanel/views/WorkOrderSidePanelDesktopView";
import WorkOrderSidePanelMobileView from "@/components/workorder/sidepanel/views/WorkOrderSidePanelMobileView";
import WorkOrderSidePanelTabletView from "@/components/workorder/sidepanel/views/WorkOrderSidePanelTabletView";

export default function WorkOrderSidePanelContainer(props: WorkOrderSidePanelProps) {
  const deviceType = useWorkOrderDeviceType();

  if (props.isEmpty) {
    return null;
  }

  if (deviceType === "mobile") {
    return <WorkOrderSidePanelMobileView {...props} />;
  }

  if (deviceType === "tablet") {
    return <WorkOrderSidePanelTabletView {...props} />;
  }

  return <WorkOrderSidePanelDesktopView {...props} />;
}
