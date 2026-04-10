"use client";

import { useRef } from "react";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";

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
  canDelete?: (workflowState: WorkflowState) => boolean;
  canCreate: boolean;
  canManageListActions?: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
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
  canDelete,
  canCreate,
  canManageListActions = true,
  searchQuery,
  onSearchQueryChange,
}: Props) {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useModalEnvironment({
    open,
    dialogRef: drawerRef,
    onClose,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" aria-modal="true" role="dialog" aria-labelledby="mobile-drawer-title">
      <button type="button" aria-label="드로어 닫기" className="absolute inset-0 bg-stone-950/45 pbp-overlay-enter" onClick={onClose} />
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-hidden rounded-r-3xl bg-white shadow-2xl focus:outline-none pbp-drawer-enter"
      >
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-3 pb-2.5 pt-[max(env(safe-area-inset-top),0.875rem)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div id="mobile-drawer-title" className="text-sm font-semibold leading-5 text-stone-900">작업 목록</div>
              <div className="text-[11px] text-stone-500">모바일 드로어</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="pbp-touch-target pbp-interactive-button inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              닫기
            </button>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">작업지시서 검색</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="작업명, 분류, 공장, 상태 검색"
              className="pbp-field-interaction h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:bg-stone-50"
            />
          </label>
          {canCreate ? (
            <button
              type="button"
              onClick={() => {
                onCreate();
                onClose();
              }}
              className="pbp-touch-target pbp-interactive-button mt-3 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 active:bg-black"
            >
              작업지시서 생성
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
                canDelete={canManageListActions ? canDelete : undefined}
                canReorder={canManageListActions && Boolean(onReorder)}
              />
            ))}
          </div>
          {workOrders.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">검색 결과가 없습니다.</div> : null}
        </div>
      </div>
    </div>
  );
}
