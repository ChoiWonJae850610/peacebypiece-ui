import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import TabletSplitLayout from "@/components/workorder/layout/TabletSplitLayout";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";

export default function WorkOrderDetailTabletView({
  appShellRef,
  selectedId,
  hasSelection,
  sidebarListProps,
  detailProps,
  sidePanelProps,
}: WorkOrderLayoutViewProps) {
  return (
    <TabletSplitLayout
      appShellRef={appShellRef}
      sidebar={<SidebarContent {...sidebarListProps} />}
      detail={hasSelection ? (
        <div key={selectedId}>
          <WorkOrderDetail {...detailProps} />
        </div>
      ) : <WorkOrderEmptyState variant="detail" />}
      sidePanel={hasSelection ? <WorkOrderSidePanel {...sidePanelProps} /> : <WorkOrderEmptyState variant="side" />}
    />
  );
}
