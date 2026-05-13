"use client";

import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";
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
  dbConnectionStatus?: DbConnectionStatus;
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
  dbConnectionStatus,
  writeLocked = false,
  writeLockMessage,
}: Props) {
  const { i18n } = useI18n();
  const sidebarUi = i18n.workorder.ui.layout.sidebar;
  const controlsUi = i18n.workorder.ui.layout.sidebarControls;

  const dbStatusPresentation = getDbConnectionStatusPresentation(dbConnectionStatus);
  const statusLabelByValue: Record<WorkOrderListStatusFilter, string> = {
    active: controlsUi.statusFilters.active,
    all: controlsUi.statusFilters.all,
    completed: controlsUi.statusFilters.completed,
    draft: controlsUi.statusFilters.draft,
    review_requested: controlsUi.statusFilters.reviewRequested,
    review_completed: controlsUi.statusFilters.reviewCompleted,
    inspection: controlsUi.statusFilters.inspection,
    rejected: controlsUi.statusFilters.rejected,
  };
  const sortLabelByValue: Record<WorkOrderListSort, string> = {
    updatedDesc: controlsUi.sorts.updatedDesc,
    createdDesc: controlsUi.sorts.createdDesc,
    dueDateAsc: controlsUi.sorts.dueDateAsc,
    titleAsc: controlsUi.sorts.titleAsc,
    vendorAsc: controlsUi.sorts.vendorAsc,
  };
  const listSummary = controlsUi.resultSummary
    .replace("{status}", statusLabelByValue[statusFilter])
    .replace("{sort}", sortLabelByValue[sort])
    .replace("{count}", String(workOrders.length));

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="shrink-0 border-b border-stone-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold leading-6 text-stone-900">{companyName}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500"><span>{controlsUi.subtitle}</span><span className="text-[10px] leading-none text-stone-400">v{version}</span>{dbStatusPresentation ? <span title={dbStatusPresentation.title ?? undefined} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${dbStatusPresentation.toneClass}`}>{dbStatusPresentation.label}</span> : null}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (!writeLocked) window.location.reload(); }}
              aria-label="새로고침"
              title={writeLocked ? writeLockMessage ?? "상태 변경 처리 중입니다." : "새로고침"}
              disabled={writeLocked}
              className="pbp-interactive-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↻
            </button>
            <button
              type="button"
              onClick={() => { if (!writeLocked) onOpenSettings(); }}
              disabled={writeLocked}
              title={writeLocked ? writeLockMessage ?? "상태 변경 처리 중입니다." : controlsUi.openSettingsAria}
            aria-label={controlsUi.openSettingsAria}
            className="pbp-interactive-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ⚙️
          </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{controlsUi.searchAria}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={controlsUi.searchPlaceholder}
              className="pbp-field-interaction h-10 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:bg-stone-50"
            />
          </label>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              disabled={writeLocked}
              className="pbp-interactive-button inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-xs font-medium text-stone-600 hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {controlsUi.clearSearch}
            </button>
          ) : null}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="sr-only">{controlsUi.statusFilterAria}</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as WorkOrderListStatusFilter)}
              disabled={writeLocked}
              className="pbp-field-interaction h-9 w-full rounded-xl border border-stone-300 bg-white px-3 text-xs font-medium text-stone-800 outline-none focus:border-stone-500 focus:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="active">{controlsUi.statusFilters.active}</option>
              <option value="review_requested">{controlsUi.statusFilters.reviewRequested}</option>
              <option value="review_completed">{controlsUi.statusFilters.reviewCompleted}</option>
              <option value="inspection">{controlsUi.statusFilters.inspection}</option>
              <option value="draft">{controlsUi.statusFilters.draft}</option>
              <option value="rejected">{controlsUi.statusFilters.rejected}</option>
              <option value="completed">{controlsUi.statusFilters.completed}</option>
              <option value="all">{controlsUi.statusFilters.all}</option>
            </select>
          </label>
          <label className="block">
            <span className="sr-only">{controlsUi.sortAria}</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as WorkOrderListSort)}
              disabled={writeLocked}
              className="pbp-field-interaction h-9 w-full rounded-xl border border-stone-300 bg-white px-3 text-xs font-medium text-stone-800 outline-none focus:border-stone-500 focus:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="updatedDesc">{controlsUi.sorts.updatedDesc}</option>
              <option value="createdDesc">{controlsUi.sorts.createdDesc}</option>
              <option value="dueDateAsc">{controlsUi.sorts.dueDateAsc}</option>
              <option value="titleAsc">{controlsUi.sorts.titleAsc}</option>
              <option value="vendorAsc">{controlsUi.sorts.vendorAsc}</option>
            </select>
          </label>
        </div>
        <div className="mt-2 text-[11px] font-medium leading-4 text-stone-500">{listSummary}</div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => { if (!writeLocked) onCreate(); }}
            disabled={writeLocked}
            title={writeLocked ? writeLockMessage ?? "상태 변경 처리 중입니다." : undefined}
            className="pbp-touch-target pbp-interactive-button mt-3 w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
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
        {workOrders.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">{controlsUi.empty}</div> : null}
      </div>
    </div>
  );
}
