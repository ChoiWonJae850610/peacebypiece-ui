"use client";

import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import WorkOrderMobileWorkspaceShell from "@/components/workorder/layout/WorkOrderMobileWorkspaceShell";
import WorkOrderMobileRelatedSectionPanels, { type WorkOrderMobileRelatedSectionKey } from "@/components/workorder/layout/WorkOrderMobileRelatedSectionPanels";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderLoadingState from "@/components/workorder/WorkOrderLoadingState";
import WorkOrderDetailErrorState from "@/components/workorder/WorkOrderDetailErrorState";
import MobileDrawer from "@/components/layout/MobileDrawer";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import { WaflMobileDetailContent } from "@/components/common/ui";
import { useWorkspaceLayoutMode } from "@/lib/responsive/useWorkspaceLayoutMode";

export default function WorkOrderMobileWorkspaceView({
  appShellRef,
  selectedId,
  hasSelection,
  detailProps,
  sidePanelProps,
  mobileTopBarProps,
  mobileDrawerProps,
  loadingState,
  detailErrorState,
}: WorkOrderLayoutViewProps) {
  const { drawerOverlayPresentation } = useWorkspaceLayoutMode();
  const isLoading = Boolean(loadingState?.isRepositoryLoading);
  const detailScrollResetKey = selectedId;

  const detailContent = detailErrorState ? (
    <WaflMobileDetailContent>
      <WorkOrderDetailErrorState {...detailErrorState} withContentShell={false} />
    </WaflMobileDetailContent>
  ) : isLoading ? (
    <WaflMobileDetailContent>
      <WorkOrderLoadingState
        title={loadingState?.detailTitle ?? ""}
        description={loadingState?.detailDescription}
        withContentShell={false}
      />
    </WaflMobileDetailContent>
  ) : hasSelection ? (
    <div key={selectedId} className="pbp-mobile-content-switch">
      <WorkOrderDetail {...detailProps} presentation="mobile" />
    </div>
  ) : (
    <WaflMobileDetailContent>
      <WorkOrderEmptyState variant="detail" />
    </WaflMobileDetailContent>
  );

  const renderRelatedSection = (activeSection: WorkOrderMobileRelatedSectionKey) => {
    if (detailErrorState) {
      return <WorkOrderDetailErrorState {...detailErrorState} withContentShell={false} />;
    }

    if (isLoading) {
      return (
        <WorkOrderLoadingState
          variant="side"
          title={loadingState?.sideTitle ?? ""}
          description={loadingState?.sideDescription}
        />
      );
    }

    if (!hasSelection) {
      return <WorkOrderEmptyState variant="side" />;
    }

    return <WorkOrderMobileRelatedSectionPanels {...sidePanelProps} activeSection={activeSection} />;
  };

  return (
    <WorkOrderMobileWorkspaceShell
      appShellRef={appShellRef}
      scrollResetKey={detailScrollResetKey}
      topBar={(
        <AdminTopbar
          companyName={mobileTopBarProps.companyName}
          appVersion={mobileTopBarProps.version}
          title="작업지시서"
          description="작업지시서를 선택하고 진행 상태, 비용, 디자인, 첨부파일과 공장 전달사항을 확인합니다."
          onOpenMenu={mobileTopBarProps.onOpen}
          menuLabel="작업지시서"
          menuAriaLabel="작업지시서 목록 열기"
        />
      )}
      drawer={<MobileDrawer {...mobileDrawerProps} />}
      detail={detailContent}
      sidePanel={renderRelatedSection}
      hasSelection={hasSelection}
      relatedPresentation={drawerOverlayPresentation}
    />
  );
}
