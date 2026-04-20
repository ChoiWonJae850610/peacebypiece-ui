import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import DesktopWorkspaceLayout from "@/components/workorder/layout/DesktopWorkspaceLayout";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";

export default function WorkOrderDetailDesktopView({
  appShellRef,
  selectedId,
  sidebarListProps,
  detailProps,
  sidePanelProps,
}: WorkOrderLayoutViewProps) {
  return (
    <DesktopWorkspaceLayout
      appShellRef={appShellRef}
      sidebar={<SidebarContent {...sidebarListProps} />}
      detail={
        <div key={selectedId}>
          <WorkOrderDetail {...detailProps} />
        </div>
      }
      sidePanel={<WorkOrderSidePanel {...sidePanelProps} />}
    />
  );
}
