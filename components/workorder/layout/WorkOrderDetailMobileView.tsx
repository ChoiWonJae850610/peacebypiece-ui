import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import MobileSectionStack from "@/components/workorder/layout/MobileSectionStack";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";

export default function WorkOrderDetailMobileView({
  appShellRef,
  selectedId,
  hasSelection,
  detailProps,
  sidePanelProps,
  mobileTopBarProps,
  mobileDrawerProps,
}: WorkOrderLayoutViewProps) {
  return (
    <MobileSectionStack
      appShellRef={appShellRef}
      topBar={<MobileTopBar {...mobileTopBarProps} />}
      drawer={<MobileDrawer {...mobileDrawerProps} />}
      detail={hasSelection ? (
        <div key={selectedId} className="pbp-mobile-content-switch">
          <WorkOrderDetail {...detailProps} />
        </div>
      ) : null}
      sidePanel={hasSelection ? <WorkOrderSidePanel {...sidePanelProps} /> : null}
    />
  );
}
