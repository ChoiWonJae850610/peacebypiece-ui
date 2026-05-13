"use client";

import { useRef } from "react";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";
import {
  getWorkOrderListSortOptions,
  getWorkOrderListStatusFilterOptions,
  isDefaultWorkOrderListControls,
} from "@/lib/workorder/list/workOrderListControls";
import type { WorkOrderListSort, WorkOrderListStatusFilter } from "@/lib/workorder/list/workOrderListControls";

type Props = {
  open: boolean;
  onClose: () => void;
  workOrders: WorkOrderListItem[];
  selectedId: string;
  workflowStateById: Record<string, string>;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onReorder?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRework?: (id: string) => void;
  canDelete?: (workflowState: WorkflowState) => boolean;
  canCreate: boolean;
  canManageListActions?: boolean;
  writeLocked?: boolean;
  writeLockMessage?: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  statusFilter: WorkOrderListStatusFilter;
  onStatusFilterChange: (value: WorkOrderListStatusFilter) => void;
  sort: WorkOrderListSort;
  onSortChange: (value: WorkOrderListSort) => void;
  onResetListControls: () => void;
};

export default function MobileDrawer({
  open,
  onClose,
  workOrders,
  selectedId,
  workflowStateById,
  onSelect,
  onCreate,
  onReorder,
  onDelete,
  onRework,
  canDelete,
  canCreate,
  canManageListActions = true,
  writeLocked = false,
  writeLockMessage,
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
  onResetListControls,
}: Props) {
  const drawerRef = useRef<HTMLDivElement | null>(null);
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

  useModalEnvironment({
    open,
    dialogRef: drawerRef,
    onClose,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" aria-modal="true" role="dialog" aria-labelledby="mobile-drawer-title">
      <button type="button" aria-label={copy.closeOverlayAria} className="absolute inset-0 bg-stone-950/45 pbp-overlay-enter" onClick={onClose} />
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-hidden rounded-r-3xl bg-white shadow-2xl focus:outline-none pbp-drawer-enter"
      >
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-3 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div id="mobile-drawer-title" className="text-sm font-semibold leading-5 text-stone-900">{copy.title}</div>
              <div className="text-[11px] text-stone-500">{copy.subtitle}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="pbp-touch-target pbp-interactive-button inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              {copy.close}
            </button>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{copy.searchAria}</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="pbp-field-interaction h-9 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:bg-stone-50"
              />
            </label>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                disabled={writeLocked}
                className="pbp-interactive-button inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-600 hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {controlsCopy.clearSearch}
              </button>
            ) : null}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <label className="block">
              <span className="sr-only">{controlsCopy.statusFilterAria}</span>
              <select
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value as WorkOrderListStatusFilter)}
                disabled={writeLocked}
                className="pbp-field-interaction h-8 w-full rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-800 outline-none focus:border-stone-500 focus:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">{controlsCopy.sortAria}</span>
              <select
                value={sort}
                onChange={(event) => onSortChange(event.target.value as WorkOrderListSort)}
                disabled={writeLocked}
                className="pbp-field-interaction h-8 w-full rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-800 outline-none focus:border-stone-500 focus:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="pbp-interactive-button shrink-0 rounded-full border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-600 hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {controlsCopy.resetControls}
              </button>
            ) : null}
          </div>
          {canCreate ? (
            <button
              type="button"
              onClick={() => {
                if (writeLocked) return;
                onCreate();
                onClose();
              }}
              disabled={writeLocked}
              title={writeLocked ? writeLockMessage ?? "상태 변경 처리 중입니다." : undefined}
              className="pbp-touch-target pbp-interactive-button mt-2.5 w-full rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.create}
            </button>
          ) : null}
        </div>
        <div className="pbp-mobile-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.875rem)]">
          <div className="flex flex-col pbp-card-stack-mobile">
            {workOrders.map((workOrder) => (
              <WorkOrderListCard
                key={workOrder.id}
                workOrder={workOrder}
                selectedId={selectedId}
                workflowStateById={workflowStateById}
                onClick={(id) => {
                  onSelect(id);
                  onClose();
                }}
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
          {workOrders.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">{copy.empty}</div> : null}
        </div>
      </div>
    </div>
  );
}
