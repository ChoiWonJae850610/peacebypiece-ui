"use client";

import { WaflSelect, WaflButton, WaflEmptyCard, WaflInput, WaflSurface } from "@/components/common/ui";
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
    <WaflSurface component="mobile-workorder-list-panel" className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[var(--pbp-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_96%,transparent)] px-3 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-5 text-[var(--pbp-text-primary)]">{copy.title}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-[var(--pbp-text-muted)]">{controlsCopy.subtitle}</div>
          </div>
          {canCreate ? (
            <WaflButton
              onClick={() => { if (!writeLocked) onCreate(); }}
              disabled={writeLocked}
              title={writeLocked ? writeLockMessage ?? i18n.common.workorderToolbar.writeLocked : undefined}
              variant="primary"
              size="sm"
              className="pbp-touch-target shrink-0"
            >
              {copy.create}
            </WaflButton>
          ) : null}
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{copy.searchAria}</span>
            <WaflInput
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={copy.searchPlaceholder}
              fieldSize="sm"
              className="pbp-field-search text-sm"
            />
          </label>
          {searchQuery ? (
            <WaflButton
              onClick={() => onSearchQueryChange("")}
              disabled={writeLocked}
              variant="secondary"
              size="sm"
              className="h-10 min-h-10 shrink-0 px-2.5"
            >
              {controlsCopy.clearSearch}
            </WaflButton>
          ) : null}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <WaflSelect
            value={statusFilter}
            onValueChange={(value) => onStatusFilterChange(value as WorkOrderListStatusFilter)}
            options={statusOptions}
            disabled={writeLocked}
            size="sm"
            ariaLabel={controlsCopy.statusFilterAria}
            triggerClassName="text-sm"
          />
          <WaflSelect
            value={sort}
            onValueChange={(value) => onSortChange(value as WorkOrderListSort)}
            options={sortOptions}
            disabled={writeLocked}
            size="sm"
            ariaLabel={controlsCopy.sortAria}
            triggerClassName="text-sm"
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium leading-4 text-[var(--pbp-text-muted)]">
          <span className="min-w-0 truncate">{listSummary}</span>
          {hasCustomListControls ? (
            <WaflButton
              onClick={onResetListControls}
              disabled={writeLocked}
              variant="subtle"
              size="sm"
              className="pbp-filter-active min-h-6 shrink-0 px-2 py-0.5 text-[10px]"
            >
              {controlsCopy.resetControls}
            </WaflButton>
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
          <WaflEmptyCard className="pbp-empty-state px-4 py-6">{copy.empty}</WaflEmptyCard>
        ) : null}
      </div>
    </WaflSurface>
  );
}
