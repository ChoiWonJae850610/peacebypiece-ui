"use client";

import { AppSelect } from "@/components/common/ui";
import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import type { SidebarListProps } from "@/components/workorder/layout/types";
import { useI18n } from "@/lib/i18n";
import {
  getWorkOrderListSortOptions,
  getWorkOrderListStatusFilterOptions,
  isDefaultWorkOrderListControls,
} from "@/lib/workorder/list/workOrderListControls";
import type { WorkOrderListSort, WorkOrderListStatusFilter } from "@/lib/workorder/list/workOrderListControls";

type WorkOrderMobileListPanelProps = SidebarListProps & {
  onOpenDetail: (id: string) => void;
};

export default function WorkOrderMobileListPanel({
  workOrders,
  selectedId,
  workflowStateById,
  onOpenDetail,
  onCreate,
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
  writeLocked = false,
  writeLockMessage,
}: WorkOrderMobileListPanelProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.layout.mobileDrawer;
  const controlsCopy = i18n.workorder.ui.layout.sidebarControls;
  const statusOptions = getWorkOrderListStatusFilterOptions(controlsCopy);
  const sortOptions = getWorkOrderListSortOptions(controlsCopy);
  const statusLabel = statusOptions.find((option) => option.value === statusFilter)?.label ?? controlsCopy.statusFilters.active;
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? controlsCopy.sorts.updatedDesc;
  const listSummary = controlsCopy.resultSummary
    .replace("{status}", statusLabel)
    .replace("{sort}", sortLabel)
    .replace("{count}", String(workOrders.length));
  const hasCustomListControls = !isDefaultWorkOrderListControls({
    statusFilter,
    sort,
    searchQuery,
  });

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)]">
      <div className="shrink-0 border-b border-[var(--pbp-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_96%,transparent)] px-3 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-5 text-[var(--pbp-text-primary)]">{copy.title}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-[var(--pbp-text-muted)]">{controlsCopy.subtitle}</div>
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => { if (!writeLocked) onCreate(); }}
              disabled={writeLocked}
              title={writeLocked ? writeLockMessage ?? i18n.common.workorderToolbar.writeLocked : undefined}
              className="pbp-touch-target pbp-interactive-button pbp-action-primary shrink-0 rounded-xl px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.create}
            </button>
          ) : null}
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{copy.searchAria}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="pbp-field-interaction pbp-field-search h-10 w-full rounded-xl border px-3 text-sm outline-none"
            />
          </label>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              disabled={writeLocked}
              className="pbp-interactive-button pbp-action-secondary inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-2.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {controlsCopy.clearSearch}
            </button>
          ) : null}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <AppSelect
            value={statusFilter}
            onValueChange={(value) => onStatusFilterChange(value as WorkOrderListStatusFilter)}
            options={statusOptions}
            disabled={writeLocked}
            size="sm"
            ariaLabel={controlsCopy.statusFilterAria}
          />
          <AppSelect
            value={sort}
            onValueChange={(value) => onSortChange(value as WorkOrderListSort)}
            options={sortOptions}
            disabled={writeLocked}
            size="sm"
            ariaLabel={controlsCopy.sortAria}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium leading-4 text-[var(--pbp-text-muted)]">
          <span className="min-w-0 truncate">{listSummary}</span>
          {hasCustomListControls ? (
            <button
              type="button"
              onClick={onResetListControls}
              disabled={writeLocked}
              className="pbp-interactive-button pbp-filter-active shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {controlsCopy.resetControls}
            </button>
          ) : null}
        </div>
      </div>

      <div className="pbp-mobile-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-2.5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="flex flex-col gap-2">
          {workOrders.map((workOrder) => (
            <WorkOrderListCard
              key={workOrder.id}
              workOrder={workOrder}
              selectedId={selectedId}
              workflowStateById={workflowStateById}
              onClick={onOpenDetail}
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
          <div className="pbp-empty-state rounded-[var(--pbp-radius-wafl)] border border-dashed px-4 py-6 text-center text-sm">{copy.empty}</div>
        ) : null}
      </div>
    </div>
  );
}
