"use client";

import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import MobileSectionStack from "@/components/workorder/layout/MobileSectionStack";
import WorkOrderMobileRelatedSectionPanels, { type WorkOrderMobileRelatedSectionKey } from "@/components/workorder/layout/WorkOrderMobileRelatedSectionPanels";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderLoadingState from "@/components/workorder/WorkOrderLoadingState";
import MobileDrawer from "@/components/layout/MobileDrawer";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";

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
  const detailScrollResetKey = selectedId;

  const detailContent = isLoading ? (
    <WorkOrderLoadingState
      title={loadingState?.detailTitle ?? ""}
      description={loadingState?.detailDescription}
    />
  ) : hasSelection ? (
    <div key={selectedId} className="pbp-mobile-content-switch">
      <WorkOrderDetail {...detailProps} />
    </div>
  ) : <WorkOrderEmptyState variant="detail" />;

  const renderRelatedSection = (activeSection: WorkOrderMobileRelatedSectionKey) => {
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
    <MobileSectionStack
      appShellRef={appShellRef}
      scrollResetKey={detailScrollResetKey}
      topBar={(
        <AdminTopbar
          companyName={mobileTopBarProps.companyName}
          appVersion={mobileTopBarProps.version}
          title="작업지시서"
          description="작업지시서를 선택하고 진행 상태, 비용, 첨부와 메모를 확인합니다."
          onOpenMenu={mobileTopBarProps.onOpen}
          menuLabel="작업지시서"
          menuAriaLabel="작업지시서 목록 열기"
        />
      )}
      drawer={<MobileDrawer {...mobileDrawerProps} />}
      detail={detailContent}
      sidePanel={renderRelatedSection}
      hasSelection={hasSelection}
    />
  );
}
