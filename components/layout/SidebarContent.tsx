"use client";

import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";
import {
  getWorkOrderListSortOptions,
  getWorkOrderListStatusFilterOptions,
  isDefaultWorkOrderListControls,
} from "@/lib/workorder/list/workOrderListControls";
import type { WorkOrderListSort, WorkOrderListStatusFilter } from "@/lib/workorder/list/workOrderListControls";
import type { DbConnectionStatus } from "@/lib/repositories/dbConnectionStatusStore";
import { getDbConnectionStatusPresentation } from "@/lib/repositories/dbConnectionStatusPresentation";

type Props = {
  companyName: string;
  version: string;
  workOrders: WorkOrderListItem[];
  selectedId: string;
  workflowStateById: Record<string, string>;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onOpenSettings: () => void;
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
}: Props) {
  const { i18n } = useI18n();
  const sidebarUi = i18n.workorder.ui.layout.sidebar;
  const controlsUi = i18n.workorder.ui.layout.sidebarControls;

  const dbStatusPresentation = showRepositoryBadges ? getDbConnectionStatusPresentation(dbConnectionStatus) : null;
  const showDevelopmentToolbar = Boolean(dbStatusPresentation || showUserSwitchingTools);
  const statusOptions = getWorkOrderListStatusFilterOptions(controlsUi);
  const sortOptions = getWorkOrderListSortOptions(controlsUi);
  const statusLabel = statusOptions.find((option) => option.value === statusFilter)?.label ?? controlsUi.statusFilters.active;
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? controlsUi.sorts.updatedDesc;
  const listSummary = controlsUi.resultSummary
    .replace("{status}", statusLabel)
    .replace("{sort}", sortLabel)
    .replace("{count}", String(workOrders.length));
  const hasCustomListControls = !isDefaultWorkOrderListControls({
    statusFilter,
    sort,
    searchQuery,
  });

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="shrink-0 border-b border-stone-200 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold leading-6 text-stone-900">{companyName}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500"><span>{controlsUi.subtitle}</span><span className="text-[10px] leading-none text-stone-400">v{version}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (!writeLocked) window.location.reload(); }}
              aria-label="새로고침"
              title={writeLocked ? writeLockMessage ?? "상태 변경 처리 중입니다." : "새로고침"}
              disabled={writeLocked}
              className="pbp-interactive-button pbp-action-secondary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-medium shadow-sm active:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↻
            </button>
          </div>
        </div>
        {showDevelopmentToolbar ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-stone-100 pt-2">
            {dbStatusPresentation ? (
              <span
                title={dbStatusPresentation.title ?? undefined}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${dbStatusPresentation.toneClass}`}
              >
                {dbStatusPresentation.label}
              </span>
            ) : null}
            {showUserSwitchingTools ? (
              <button
                type="button"
                onClick={() => { if (!writeLocked) onOpenSettings(); }}
                disabled={writeLocked}
                title={writeLocked ? writeLockMessage ?? "상태 변경 처리 중입니다." : controlsUi.openSettingsAria}
                aria-label={controlsUi.openSettingsAria}
                className="pbp-interactive-button pbp-action-secondary inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-medium shadow-sm active:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden="true">⚙️</span>
                <span>{controlsUi.openSettingsAria}</span>
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="mt-2.5 flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{controlsUi.searchAria}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={controlsUi.searchPlaceholder}
              className="pbp-field-interaction pbp-field-search h-9 w-full rounded-xl border px-3 text-sm outline-none"
            />
          </label>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              disabled={writeLocked}
              className="pbp-interactive-button pbp-action-secondary inline-flex h-9 shrink-0 items-center justify-center rounded-xl px-2.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {controlsUi.clearSearch}
            </button>
          ) : null}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <label className="block">
            <span className="sr-only">{controlsUi.statusFilterAria}</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as WorkOrderListStatusFilter)}
              disabled={writeLocked}
              className="pbp-field-interaction pbp-field-selectable h-8 w-full rounded-xl border px-2.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">{controlsUi.sortAria}</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as WorkOrderListSort)}
              disabled={writeLocked}
              className="pbp-field-interaction pbp-field-selectable h-8 w-full rounded-xl border px-2.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium leading-4 text-stone-500">
          <span className="min-w-0 truncate">{listSummary}</span>
          {hasCustomListControls ? (
            <button
              type="button"
              onClick={onResetListControls}
              disabled={writeLocked}
              className="pbp-interactive-button pbp-filter-active shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {controlsUi.resetControls}
            </button>
          ) : null}
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => { if (!writeLocked) onCreate(); }}
            disabled={writeLocked}
            title={writeLocked ? writeLockMessage ?? "상태 변경 처리 중입니다." : undefined}
            className="pbp-touch-target pbp-interactive-button pbp-action-primary mt-2.5 w-full rounded-xl px-4 py-2 text-sm font-medium active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {controlsUi.create}
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-24 pr-2 [scrollbar-gutter:stable]">
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
        {workOrders.length === 0 ? <div className="pbp-empty-state rounded-2xl border border-dashed px-4 py-6 text-center text-sm">{controlsUi.empty}</div> : null}
      </div>
    </div>
  );
}
