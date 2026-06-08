"use client";

import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import MobileSectionStack from "@/components/workorder/layout/MobileSectionStack";
import WorkOrderMobileRelatedSectionPanels, { type WorkOrderMobileRelatedSectionKey } from "@/components/workorder/layout/WorkOrderMobileRelatedSectionPanels";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderLoadingState from "@/components/workorder/WorkOrderLoadingState";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";

export default function WorkOrderDetailMobileView({
  appShellRef,
  selectedId,
  hasSelection,
  detailProps,
  sidePanelProps,
  mobileTopBarProps,
  mobileDrawerProps,
  loadingState,
  homeNavigation,
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
      topBar={<MobileTopBar {...mobileTopBarProps} homeNavigation={homeNavigation} />}
      drawer={<MobileDrawer {...mobileDrawerProps} />}
      detail={detailContent}
      sidePanel={renderRelatedSection}
      hasSelection={hasSelection}
    />
  );
}
