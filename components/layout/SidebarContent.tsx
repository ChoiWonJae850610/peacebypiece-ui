"use client";

import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";
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
  dbConnectionStatus,
  writeLocked = false,
  writeLockMessage,
}: Props) {
  const { i18n } = useI18n();
  const sidebarUi = i18n.workorder.ui.layout.sidebar;
  const controlsUi = i18n.workorder.ui.layout.sidebarControls;

  const dbStatusPresentation = getDbConnectionStatusPresentation(dbConnectionStatus);

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
            onClick={() => { if (!writeLocked) onCreate(); }}
            disabled={writeLocked}
            title={writeLocked ? writeLockMessage ?? "상태 변경 처리 중입니다." : undefined}
            className="pbp-touch-target pbp-interactive-button mt-3.5 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 active:bg-black disabled:cursor-not-allowed disabled:opacity-50"
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
