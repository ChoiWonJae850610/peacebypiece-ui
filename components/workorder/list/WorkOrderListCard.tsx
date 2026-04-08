"use client";

import { getCategoryPath, getWorkOrderCardTone, getWorkOrderStateLabel } from "@/lib/utils/workorder";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";

type Props = {
  workOrder: WorkOrderListItem;
  selectedId: string;
  workflowStateById: Record<string, string>;
  onClick: (id: string) => void;
  onReorder?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: (workflowState: WorkflowState) => boolean;
};

export default function WorkOrderListCard({
  workOrder,
  selectedId,
  workflowStateById,
  onClick,
  onReorder,
  onDelete,
  canDelete,
}: Props) {
  const state = getWorkOrderStateLabel(workflowStateById, workOrder.id) as WorkflowState;
  const active = workOrder.id === selectedId;
  const canShowReorder = ["생산중", "검수중", "완료"].includes(state);
  const canShowDelete = canDelete?.(state) ?? false;

  return (
    <div
      className={`w-full rounded-2xl border p-3.5 transition ${
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onClick(workOrder.id)} className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-semibold leading-5">{workOrder.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                active ? "bg-white/15 text-white" : getWorkOrderCardTone(state)
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : "bg-current"}`} aria-hidden="true" />
              {state}
            </span>
          </div>
          <div className={`mt-2.5 space-y-1 text-xs leading-4 ${active ? "text-stone-200" : "text-stone-500"}`}>
            <div className="truncate">{getCategoryPath(workOrder) || "분류 미지정"}</div>
            <div className="truncate">공장: {workOrder.vendor ?? "미지정"}</div>
            <div>마감: {workOrder.dueDate ?? "미지정"}</div>
            <div>첨부파일: {workOrder.filesCount ?? 0}개</div>
          </div>
        </button>
        <div className="flex shrink-0 items-start gap-2">
          {canShowReorder ? (
            <button
              type="button"
              onClick={() => onReorder?.(workOrder.id)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                  : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-100"
              }`}
            >
              리오더
            </button>
          ) : null}
          {canShowDelete ? (
            <button
              type="button"
              onClick={() => onDelete?.(workOrder.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                active
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                  : "border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50"
              }`}
            >
              삭제
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
