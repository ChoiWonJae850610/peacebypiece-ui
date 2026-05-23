import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import TabletSplitLayout from "@/components/workorder/layout/TabletSplitLayout";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import WorkOrderLoadingState from "@/components/workorder/WorkOrderLoadingState";

export default function WorkOrderDetailTabletView({
  appShellRef,
  selectedId,
  hasSelection,
  sidebarListProps,
  detailProps,
  sidePanelProps,
  loadingState,
  homeNavigation,
}: WorkOrderLayoutViewProps) {
  const isLoading = Boolean(loadingState?.isRepositoryLoading);
  return (
    <TabletSplitLayout
      appShellRef={appShellRef}
      scrollResetKey={selectedId}
      sidebar={<SidebarContent {...sidebarListProps} homeNavigation={homeNavigation} />}
      detail={(
        <>
          {isLoading ? (
            <WorkOrderLoadingState
              title={loadingState?.detailTitle ?? ""}
              description={loadingState?.detailDescription}
            />
          ) : hasSelection ? (
            <div key={selectedId}>
              <WorkOrderDetail {...detailProps} />
            </div>
          ) : (
            <WorkOrderEmptyState variant="detail" />
          )}
        </>
      )}
      sidePanel={isLoading ? (
        <WorkOrderLoadingState
          variant="side"
          title={loadingState?.sideTitle ?? ""}
          description={loadingState?.sideDescription}
        />
      ) : hasSelection ? <WorkOrderSidePanel {...sidePanelProps} /> : <WorkOrderEmptyState variant="side" />}
    />
  );
}
