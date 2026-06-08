"use client";

import { useEffect, useMemo, useState } from "react";

import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import MobileSectionStack from "@/components/workorder/layout/MobileSectionStack";
import WorkOrderMobileListPanel from "@/components/workorder/layout/WorkOrderMobileListPanel";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import WorkOrderLoadingState from "@/components/workorder/WorkOrderLoadingState";

type MobileWorkspaceMode = "list" | "detail";

function hasInitialWorkOrderQuery() {
  if (typeof window === "undefined") return false;
  return Boolean(new URLSearchParams(window.location.search).get("workOrderId"));
}

export default function WorkOrderDetailMobileView({
  appShellRef,
  selectedId,
  hasSelection,
  sidebarListProps,
  detailProps,
  sidePanelProps,
  mobileTopBarProps,
  mobileDrawerProps,
  loadingState,
  homeNavigation,
}: WorkOrderLayoutViewProps) {
  const isLoading = Boolean(loadingState?.isRepositoryLoading);
  const [mode, setMode] = useState<MobileWorkspaceMode>("list");
  const detailScrollResetKey = `${selectedId}:${mode}`;

  useEffect(() => {
    if (hasInitialWorkOrderQuery() && hasSelection) {
      setMode("detail");
    }
  }, [hasSelection]);

  useEffect(() => {
    if (!hasSelection && mode === "detail") {
      setMode("list");
    }
  }, [hasSelection, mode]);

  const listProps = useMemo(
    () => ({
      ...sidebarListProps,
      onOpenDetail: (id: string) => {
        sidebarListProps.onSelect(id);
        setMode("detail");
      },
    }),
    [sidebarListProps],
  );

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

  const sidePanelContent = isLoading ? (
    <WorkOrderLoadingState
      variant="side"
      title={loadingState?.sideTitle ?? ""}
      description={loadingState?.sideDescription}
    />
  ) : hasSelection ? <WorkOrderSidePanel {...sidePanelProps} /> : <WorkOrderEmptyState variant="side" />;

  return (
    <MobileSectionStack
      appShellRef={appShellRef}
      mode={mode}
      scrollResetKey={detailScrollResetKey}
      topBar={<MobileTopBar {...mobileTopBarProps} homeNavigation={homeNavigation} />}
      drawer={<MobileDrawer {...mobileDrawerProps} />}
      list={<WorkOrderMobileListPanel {...listProps} />}
      detail={detailContent}
      sidePanel={sidePanelContent}
      hasSelection={hasSelection}
      onBackToList={() => setMode("list")}
    />
  );
}
