"use client";

import WorkOrderDetailDesktopView from "@/components/workorder/layout/WorkOrderDetailDesktopView";
import WorkOrderDetailMobileView from "@/components/workorder/layout/WorkOrderDetailMobileView";
import WorkOrderDetailTabletView from "@/components/workorder/layout/WorkOrderDetailTabletView";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import { useWorkOrderDeviceType } from "@/components/workorder/layout/useWorkOrderDeviceType";
import { useResponsiveOrientation } from "@/lib/responsive/useResponsiveOrientation";

export default function WorkOrderLayout(props: WorkOrderLayoutViewProps) {
  const deviceType = useWorkOrderDeviceType();
  const orientation = useResponsiveOrientation();
  const shouldUseDrawerLayout = deviceType === "mobile" || (deviceType === "tablet" && orientation === "portrait");

  if (shouldUseDrawerLayout) {
    return <WorkOrderDetailMobileView {...props} />;
  }

  if (deviceType === "tablet") {
    return <WorkOrderDetailTabletView {...props} />;
  }

  return <WorkOrderDetailDesktopView {...props} />;
}
