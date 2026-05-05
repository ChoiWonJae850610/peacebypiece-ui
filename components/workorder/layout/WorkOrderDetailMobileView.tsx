import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import MobileSectionStack from "@/components/workorder/layout/MobileSectionStack";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import WorkOrderLoadingState from "@/components/workorder/WorkOrderLoadingState";

export default function WorkOrderDetailMobileView({
  appShellRef,
  selectedId,
  hasSelection,
  detailProps,
  sidePanelProps,
  mobileTopBarProps,
  mobileDrawerProps,
  loadingState,
}: WorkOrderLayoutViewProps) {
  const isLoading = Boolean(loadingState?.isRepositoryLoading);
  return (
    <MobileSectionStack
      appShellRef={appShellRef}
      topBar={<MobileTopBar {...mobileTopBarProps} />}
      drawer={<MobileDrawer {...mobileDrawerProps} />}
      detail={isLoading ? (
        <WorkOrderLoadingState
          title={loadingState?.detailTitle ?? "작업지시서를 불러오는 중입니다."}
          description={loadingState?.detailDescription}
        />
      ) : hasSelection ? (
        <div key={selectedId} className="pbp-mobile-content-switch">
          <WorkOrderDetail {...detailProps} />
        </div>
      ) : <WorkOrderEmptyState variant="detail" />}
      sidePanel={isLoading ? (
        <WorkOrderLoadingState
          variant="side"
          title={loadingState?.sideTitle ?? "첨부와 메모를 준비하는 중입니다."}
          description={loadingState?.sideDescription}
        />
      ) : hasSelection ? <WorkOrderSidePanel {...sidePanelProps} /> : <WorkOrderEmptyState variant="side" />}
    />
  );
}
