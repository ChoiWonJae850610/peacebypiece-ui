import type { WorkOrderDeviceType } from "@/components/workorder/layout/useWorkOrderDeviceType";
import WorkOrderDetailDesktopView from "@/components/workorder/detail/views/WorkOrderDetailDesktopView";
import WorkOrderDetailMobileView from "@/components/workorder/detail/views/WorkOrderDetailMobileView";
import WorkOrderDetailTabletView from "@/components/workorder/detail/views/WorkOrderDetailTabletView";
import type { WorkOrderDetailViewProps } from "@/components/workorder/detail/views/detailViewTypes";

type WorkOrderDetailViewSwitchProps = WorkOrderDetailViewProps & {
  deviceType: WorkOrderDeviceType;
};

export default function WorkOrderDetailViewSwitch({ deviceType, ...viewProps }: WorkOrderDetailViewSwitchProps) {
  if (deviceType === "mobile") {
    return <WorkOrderDetailMobileView {...viewProps} />;
  }

  if (deviceType === "tablet") {
    return <WorkOrderDetailTabletView {...viewProps} />;
  }

  return <WorkOrderDetailDesktopView {...viewProps} />;
}
