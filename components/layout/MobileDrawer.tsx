"use client";

import { AppSelect, SectionCountBadge, WaflMobileListDrawer } from "@/components/common/ui";
import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";
import {
  getWorkOrderListSortOptions,
  getWorkOrderListStatusFilterOptions,
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
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.layout.mobileDrawer;
  const controlsCopy = i18n.workorder.ui.layout.sidebarControls;
  const statusOptions = getWorkOrderListStatusFilterOptions(controlsCopy);
  const sortOptions = getWorkOrderListSortOptions(controlsCopy);
  void onResetListControls;

  if (!open) return null;

  const headerContent = (
    <>
      <div className="border-b border-[var(--pbp-border)]" aria-hidden="true" />
      <div className="mt-3 flex items-center gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{copy.searchAria}</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
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
          className="pbp-touch-target pbp-interactive-button pbp-action-primary mt-2.5 w-full rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copy.create}
        </button>
      ) : null}
      <div className="mt-3 border-b border-[var(--pbp-border)]" aria-hidden="true" />
    </>
  );

  return (
    <WaflMobileListDrawer
      open={open}
      onClose={onClose}
      title={copy.title}
      subtitle={copy.subtitle}
      titleAccessory={<SectionCountBadge className="translate-y-0.5">{workOrders.length}건</SectionCountBadge>}
      closeLabel={copy.close}
      closeOverlayAria={copy.closeOverlayAria}
      titleId="mobile-drawer-title"
      headerContent={headerContent}
      showCloseButton={false}
      showHeaderBorder={false}
    >
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
    </WaflMobileListDrawer>
  );
}
