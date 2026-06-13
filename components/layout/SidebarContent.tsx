"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminModal } from "@/components/admin/layout/AdminModal";
import { PersonalSettingsPanel } from "@/components/me/PersonalSettingsPage";
import { AppSelect, WaflButton, WaflInput, WaflListPanelShell, WaflStateBlock } from "@/components/common/ui";
import type { WorkOrderHomeNavigation } from "@/components/workorder/layout/WorkOrderHomeButton";
import {
  WAFL_LIST_CLEAR_BUTTON_CLASS,
  WAFL_LIST_CREATE_BUTTON_CLASS,
  WAFL_LIST_SEARCH_INPUT_CLASS,
  WAFL_LIST_SEARCH_ROW_CLASS,
  WAFL_LIST_SELECT_TRIGGER_CLASS,
} from "@/components/common/ui/waflListControlSet";

import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";
import {
  getWorkOrderListSortOptions,
  getWorkOrderListStatusFilterOptions,
} from "@/lib/workorder/list/workOrderListControls";
import type {
  WorkOrderListSort,
  WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import type { DbConnectionStatus } from "@/lib/repositories/dbConnectionStatusStore";
import { getDbConnectionStatusPresentation } from "@/lib/repositories/dbConnectionStatusPresentation";

const WORKORDER_TOOLBAR_ICON_BUTTON_CLASS =
  "pbp-topbar-icon-button inline-flex h-9 w-9 shrink-0 items-center justify-center wafl-shape-icon transition";

function PersonalSettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.75 20.25a7.25 7.25 0 0 1 14.5 0" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 10.6 12 3.75l8.5 6.85" />
      <path d="M5.75 9.5v9.25a1.5 1.5 0 0 0 1.5 1.5h9.5a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M9.75 20.25v-5.5a1.25 1.25 0 0 1 1.25-1.25h2a1.25 1.25 0 0 1 1.25 1.25v5.5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 4.75H6.75A1.75 1.75 0 0 0 5 6.5v11a1.75 1.75 0 0 0 1.75 1.75H9.5" />
      <path d="M14 8.25 17.75 12 14 15.75" />
      <path d="M17.5 12H9.75" />
    </svg>
  );
}

type Props = {
  companyName: string;
  version: string;
  workOrders: WorkOrderListItem[];
  selectedId: string;
  workflowStateById: Record<string, string>;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onOpenSettings: () => void;
  homeNavigation?: WorkOrderHomeNavigation;
  onReorder?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRework?: (id: string) => void;
  canDelete?: (workflowState: WorkflowState) => boolean;
  canCreate: boolean;
  canManageListActions?: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: WorkOrderListStatusFilter;
  onStatusFilterChange: (value: WorkOrderListStatusFilter) => void;
  sort: WorkOrderListSort;
  onSortChange: (value: WorkOrderListSort) => void;
  onResetListControls: () => void;
  dbConnectionStatus?: DbConnectionStatus;
  showRepositoryBadges?: boolean;
  showUserSwitchingTools?: boolean;
  writeLocked?: boolean;
  writeLockMessage?: string;
  showHeaderActions?: boolean;
};

export default function SidebarContent({
  companyName,
  version,
  workOrders,
  selectedId,
  workflowStateById,
  onSelect,
  onCreate,
  onOpenSettings,
  homeNavigation,
  onReorder,
  onDelete,
  onRework,
  canDelete,
  canCreate,
  canManageListActions = true,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
  onResetListControls,
  dbConnectionStatus,
  showRepositoryBadges = false,
  showUserSwitchingTools = false,
  writeLocked = false,
  writeLockMessage,
  showHeaderActions = true,
}: Props) {
  const { i18n } = useI18n();
  const [personalSettingsOpen, setPersonalSettingsOpen] = useState(false);
  const sidebarUi = i18n.workorder.ui.layout.sidebar;
  const controlsUi = i18n.workorder.ui.layout.sidebarControls;
  void onResetListControls;

  const dbStatusPresentation = showRepositoryBadges
    ? getDbConnectionStatusPresentation(dbConnectionStatus)
    : null;
  const showDevelopmentToolbar = Boolean(
    dbStatusPresentation || showUserSwitchingTools,
  );
  const statusOptions = getWorkOrderListStatusFilterOptions(controlsUi);
  const sortOptions = getWorkOrderListSortOptions(controlsUi);
  const hasActiveListControls = searchQuery.trim().length > 0 || statusFilter !== "active" || sort !== "updatedDesc";

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      {showHeaderActions ? (
        <div className="shrink-0 p-3.5 sm:p-4">
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold leading-6 text-[var(--pbp-text-primary)]">
                  {companyName}
                </div>
                {showDevelopmentToolbar ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--pbp-text-muted)]">
                    <span>{controlsUi.subtitle}</span>
                    <span className="text-[10px] leading-none text-[var(--pbp-text-subtle)]">
                      v{version}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {homeNavigation ? (
                  <Link
                    href={homeNavigation.href}
                    aria-label={homeNavigation.ariaLabel}
                    title={homeNavigation.label}
                    className={WORKORDER_TOOLBAR_ICON_BUTTON_CLASS}
                  >
                    <HomeIcon />
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPersonalSettingsOpen(true)}
                  aria-label={i18n.common.personalSettings.title}
                  title={i18n.common.personalSettings.title}
                  className={WORKORDER_TOOLBAR_ICON_BUTTON_CLASS}
                >
                  <PersonalSettingsIcon />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!writeLocked) window.location.reload();
                  }}
                  aria-label={i18n.common.workorderToolbar.refresh}
                  title={
                    writeLocked
                      ? (writeLockMessage ??
                        i18n.common.workorderToolbar.writeLocked)
                      : i18n.common.workorderToolbar.refresh
                  }
                  disabled={writeLocked}
                  className={`${WORKORDER_TOOLBAR_ICON_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  ↻
                </button>
                <form
                  action="/api/auth/logout"
                  method="post"
                  className="shrink-0"
                >
                  <button
                    type="submit"
                    aria-label={i18n.common.workorderToolbar.logout}
                    title={i18n.common.workorderToolbar.logout}
                    className={WORKORDER_TOOLBAR_ICON_BUTTON_CLASS}
                  >
                    <LogoutIcon />
                  </button>
                </form>
              </div>
            </div>
            {showDevelopmentToolbar ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--pbp-border)] pt-2">
                {dbStatusPresentation ? (
                  <span
                    title={dbStatusPresentation.title ?? undefined}
                    className={`wafl-shape-compact border px-2 py-0.5 text-[10px] font-medium ${dbStatusPresentation.toneClass}`}
                  >
                    {dbStatusPresentation.label}
                  </span>
                ) : null}
                {showUserSwitchingTools ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!writeLocked) onOpenSettings();
                    }}
                    disabled={writeLocked}
                    title={
                      writeLocked
                        ? (writeLockMessage ?? "상태 변경 처리 중입니다.")
                        : controlsUi.openSettingsAria
                    }
                    aria-label={controlsUi.openSettingsAria}
                    className="pbp-interactive-button pbp-action-secondary inline-flex h-8 shrink-0 items-center justify-center gap-1 wafl-shape-control px-2.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span aria-hidden="true">⚙️</span>
                    <span>{controlsUi.openSettingsAria}</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        </div>
      ) : null}
      <WaflListPanelShell
          title="작업지시서 목록"
          count={workOrders.length}
          className="min-h-0 flex-1"
          search={(
              <div className={WAFL_LIST_SEARCH_ROW_CLASS}>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">{controlsUi.searchAria}</span>
                  <WaflInput
                    type="search"
                    fieldSize="sm"
                    value={searchQuery}
                    onChange={(event) => onSearchQueryChange(event.target.value)}
                    placeholder={controlsUi.searchPlaceholder}
                    className={WAFL_LIST_SEARCH_INPUT_CLASS}
                  />
                </label>
                {searchQuery ? (
                  <WaflButton
                    onClick={() => onSearchQueryChange("")}
                    disabled={writeLocked}
                    variant="secondary"
                    size="sm"
                    className={WAFL_LIST_CLEAR_BUTTON_CLASS}
                  >
                    {controlsUi.clearSearch}
                  </WaflButton>
                ) : null}
              </div>
          )}
          filters={(
              <div className="grid grid-cols-2 gap-2">
                <AppSelect
                  value={statusFilter}
                  onValueChange={(value) => onStatusFilterChange(value as WorkOrderListStatusFilter)}
                  options={statusOptions}
                  disabled={writeLocked}
                  size="sm"
                  ariaLabel={controlsUi.statusFilterAria}
                  triggerClassName={WAFL_LIST_SELECT_TRIGGER_CLASS}
                />
                <AppSelect
                  value={sort}
                  onValueChange={(value) => onSortChange(value as WorkOrderListSort)}
                  options={sortOptions}
                  disabled={writeLocked}
                  size="sm"
                  ariaLabel={controlsUi.sortAria}
                  triggerClassName={WAFL_LIST_SELECT_TRIGGER_CLASS}
                />
              </div>
          )}
          action={canCreate ? (
            <WaflButton
              variant="primary"
              size="md"
              width="full"
              onClick={() => { if (!writeLocked) onCreate(); }}
              disabled={writeLocked}
              title={writeLocked ? (writeLockMessage ?? "상태 변경 처리 중입니다.") : undefined}
              className={`${WAFL_LIST_CREATE_BUTTON_CLASS} active:bg-black disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {controlsUi.create}
            </WaflButton>
          ) : null}
          listClassName="pb-24"
        >
          <div className="space-y-2">
            {workOrders.map((workOrder) => (
              <WorkOrderListCard
                key={workOrder.id}
                workOrder={workOrder}
                selectedId={selectedId}
                workflowStateById={workflowStateById}
                onClick={onSelect}
                onReorder={onReorder}
                onDelete={onDelete}
                onRework={onRework}
                canDelete={canManageListActions ? canDelete : undefined}
                canReorder={canManageListActions && Boolean(onReorder)}
                writeLocked={writeLocked}
                writeLockMessage={writeLockMessage}
              />
            ))}
          </div>
          {workOrders.length === 0 ? (
            <WaflStateBlock
              kind={hasActiveListControls ? "search" : "empty"}
              title={hasActiveListControls ? "검색 결과 없음" : controlsUi.empty}
              description={hasActiveListControls ? undefined : "작업지시서 생성 버튼으로 첫 작업지시서를 시작합니다."}
              size="sm"
              minHeightClassName="min-h-[132px]"
              className="wafl-shape-control bg-[var(--pbp-empty-state-surface)]"
            />
          ) : null}
        </WaflListPanelShell>
      <AdminModal
        open={personalSettingsOpen}
        title={i18n.common.personalSettings.title}
        description={i18n.common.personalSettings.description}
        onClose={() => setPersonalSettingsOpen(false)}
        maxWidthClass="md:max-w-2xl"
        bodyClassName="space-y-4 [scrollbar-gutter:stable]"
        minHeightClassName="md:min-h-[420px]"
      >
        <PersonalSettingsPanel />
      </AdminModal>
    </div>
  );
}
