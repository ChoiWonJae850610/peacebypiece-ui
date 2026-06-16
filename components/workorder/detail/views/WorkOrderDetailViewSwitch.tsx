import type { WorkOrderDetailPresentation } from "@/components/workorder/detail/WorkOrderDetail.types";
import WorkOrderDetailDesktopView from "@/components/workorder/detail/views/WorkOrderDetailDesktopView";
import WorkOrderDetailMobileView from "@/components/workorder/detail/views/WorkOrderDetailMobileView";
import WorkOrderDetailTabletView from "@/components/workorder/detail/views/WorkOrderDetailTabletView";
import type { WorkOrderDetailViewProps } from "@/components/workorder/detail/views/detailViewTypes";

type WorkOrderDetailViewSwitchProps = WorkOrderDetailViewProps & {
  presentation: WorkOrderDetailPresentation;
};

export default function WorkOrderDetailViewSwitch({ presentation, ...viewProps }: WorkOrderDetailViewSwitchProps) {
  if (presentation === "mobile") {
    return <WorkOrderDetailMobileView {...viewProps} />;
  }

  if (presentation === "tablet") {
    return <WorkOrderDetailTabletView {...viewProps} />;
  }

  return <WorkOrderDetailDesktopView {...viewProps} />;
}
