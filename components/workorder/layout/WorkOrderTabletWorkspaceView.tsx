"use client";

import { useState } from "react";

import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import {
  WaflTabletWorkspaceFrame,
} from "@/components/common/ui";
import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import WorkOrderLoadingState from "@/components/workorder/WorkOrderLoadingState";

export default function WorkOrderTabletWorkspaceView({
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
  const [listDrawerOpen, setListDrawerOpen] = useState(false);

  const sidebar = (
    <SidebarContent
      {...sidebarListProps}
      homeNavigation={homeNavigation}
      showHeaderActions={false}
    />
  );
  const detail = (
    <>
      {isLoading ? (
        <WorkOrderLoadingState
          title={loadingState?.detailTitle ?? ""}
          description={loadingState?.detailDescription}
        />
      ) : hasSelection ? (
        <div key={selectedId}>
          <WorkOrderDetail {...detailProps} presentation="tablet" />
        </div>
      ) : (
        <WorkOrderEmptyState variant="detail" panel />
      )}
    </>
  );
  const sidePanel = isLoading ? (
    <WorkOrderLoadingState
      variant="side"
      title={loadingState?.sideTitle ?? ""}
      description={loadingState?.sideDescription}
    />
  ) : hasSelection ? (
    <WorkOrderSidePanel {...sidePanelProps} />
  ) : (
    <WorkOrderEmptyState variant="side" panel />
  );

  return (
    <WaflTabletWorkspaceFrame
      appShellRef={appShellRef}
      topbar={(
        <AdminTopbar
          companyName={sidebarListProps.companyName}
          appVersion={sidebarListProps.version}
          title="작업지시서"
          description="작업지시서를 선택하고 진행 상태, 비용, 첨부와 메모를 확인합니다."
          onOpenMenu={() => setListDrawerOpen(true)}
          menuLabel="작업지시서"
          menuAriaLabel="작업지시서 목록 열기"
        />
      )}
      listDrawerOpen={listDrawerOpen}
      onCloseListDrawer={() => setListDrawerOpen(false)}
      listDrawerTitle="작업지시서 목록"
      listDrawerTitleId="workorder-tablet-list-drawer-title"
      listDrawerCloseAria="작업지시서 목록 드로어 닫기"
      list={sidebar}
      detail={detail}
      side={sidePanel}
      scrollResetKey={selectedId}
    />
  );
}