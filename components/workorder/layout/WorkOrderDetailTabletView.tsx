"use client";

import { useState } from "react";

import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import {
  AppResponsiveWorkspace,
  WaflMobileListDrawer,
  WaflSidePanelShell,
  WaflTwoPanelWorkspace,
} from "@/components/common/ui";
import SidebarContent from "@/components/layout/SidebarContent";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import DesktopWorkspaceLayout from "@/components/workorder/layout/DesktopWorkspaceLayout";
import type { WorkOrderLayoutViewProps } from "@/components/workorder/layout/types";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import WorkOrderLoadingState from "@/components/workorder/WorkOrderLoadingState";
import { useWorkspaceLayoutMode } from "@/lib/responsive/useWorkspaceLayoutMode";

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
  const { useThreePanel } = useWorkspaceLayoutMode();
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
          <WorkOrderDetail {...detailProps} />
        </div>
      ) : (
        <WorkOrderEmptyState variant="detail" />
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
    <WorkOrderEmptyState variant="side" />
  );

  if (useThreePanel) {
    return (
      <DesktopWorkspaceLayout
        appShellRef={appShellRef}
        scrollResetKey={selectedId}
        topbar={
          <AdminTopbar
            companyName={sidebarListProps.companyName}
            appVersion={sidebarListProps.version}
            title="작업지시서"
            description="작업지시서를 선택하고 진행 상태, 비용, 첨부와 메모를 확인합니다."
          />
        }
        sidebar={sidebar}
        detail={detail}
        sidePanel={sidePanel}
      />
    );
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--pbp-bg-app)] p-3 text-[var(--pbp-text-primary)] sm:p-4 md:p-6 lg:p-8">
      <div
        ref={appShellRef}
        className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 overflow-hidden sm:gap-4 md:gap-5"
      >
        <AdminTopbar
          companyName={sidebarListProps.companyName}
          appVersion={sidebarListProps.version}
          title="작업지시서"
          description="작업지시서를 선택하고 진행 상태, 비용, 첨부와 메모를 확인합니다."
          onOpenMenu={() => setListDrawerOpen(true)}
          menuLabel="작업지시서"
          menuAriaLabel="작업지시서 목록 열기"
        />
        <WaflMobileListDrawer
          open={listDrawerOpen}
          onClose={() => setListDrawerOpen(false)}
          title="작업지시서 목록"
          closeLabel="닫기"
          closeOverlayAria="작업지시서 목록 드로어 닫기"
          titleId="workorder-tablet-list-drawer-title"
          showHeader={false}
          bodyClassName="!px-0 !py-0"
        >
          <div className="min-h-[72dvh] min-w-0">{sidebar}</div>
        </WaflMobileListDrawer>
        <AppResponsiveWorkspace device="tablet">
          <WaflTwoPanelWorkspace
            detail={
              <section className="h-full min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] [scrollbar-gutter:stable]">
                {detail}
              </section>
            }
            side={
              <section className="h-full min-h-0 min-w-0 overflow-y-auto overscroll-contain rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] [scrollbar-gutter:stable]">
                <WaflSidePanelShell>{sidePanel}</WaflSidePanelShell>
              </section>
            }
          />
        </AppResponsiveWorkspace>
      </div>
    </main>
  );
}
