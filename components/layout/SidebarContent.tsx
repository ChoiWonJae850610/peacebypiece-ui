"use client";

import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";

type Props = {
  version: string;
  workOrders: WorkOrderListItem[];
  selectedId: string;
  workflowStateById: Record<string, string>;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onOpenSettings: () => void;
  onOpenAdminPanel?: () => void;
  onReorder?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: (workflowState: WorkflowState) => boolean;
  canCreate: boolean;
  canManageListActions?: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

export default function SidebarContent({
  version,
  workOrders,
  selectedId,
  workflowStateById,
  onSelect,
  onCreate,
  onOpenSettings,
  onOpenAdminPanel,
  onReorder,
  onDelete,
  canDelete,
  canCreate,
  canManageListActions = true,
  searchQuery,
  onSearchQueryChange,
}: Props) {
  const { i18n } = useI18n();
  const sidebarUi = i18n.workorder.ui.layout.sidebar;
  const controlsUi = i18n.workorder.ui.layout.sidebarControls;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold leading-6 text-stone-900">PeacebyPiece v{version}</div>
            <div className="mt-1 text-xs text-stone-500">{controlsUi.subtitle}</div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAdminPanel ? (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                aria-label={controlsUi.openAdminPanelAria}
                className="pbp-interactive-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-base font-medium text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-100 active:bg-sky-200"
              >
                ⚙︎
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenSettings}
            aria-label={controlsUi.openSettingsAria}
            className="pbp-interactive-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            ⚙️
          </button>
          </div>
        </div>
        <label className="mt-3.5 block">
          <span className="sr-only">{controlsUi.searchAria}</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={controlsUi.searchPlaceholder}
            className="pbp-field-interaction h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:bg-stone-50"
          />
        </label>
        {canCreate ? (
          <button
            type="button"
            onClick={onCreate}
            className="pbp-touch-target pbp-interactive-button mt-3.5 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 active:bg-black"
          >
            {controlsUi.create}
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-2.5">
          {workOrders.map((workOrder) => (
            <WorkOrderListCard
              key={workOrder.id}
              workOrder={workOrder}
              selectedId={selectedId}
              workflowStateById={workflowStateById}
              onClick={onSelect}
              onReorder={onReorder}
              onDelete={onDelete}
              canDelete={canManageListActions ? canDelete : undefined}
              canReorder={canManageListActions && Boolean(onReorder)}
            />
          ))}
        </div>
        {workOrders.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">{controlsUi.empty}</div> : null}
      </div>
    </div>
  );
}
