"use client";

import { getCategoryPath, getWorkOrderCardTone, getWorkOrderStateLabel } from "@/lib/utils/workorder";
import type { WorkOrderListItem } from "@/types/workorder";

type Props = {
  workOrder: WorkOrderListItem;
  selectedId: string;
  workflowStateById: Record<string, string>;
  onClick: (id: string) => void;
  onReorder?: (id: string) => void;
};

export default function WorkOrderListCard({
  workOrder,
  selectedId,
  workflowStateById,
  onClick,
  onReorder,
}: Props) {
  const state = getWorkOrderStateLabel(workflowStateById, workOrder.id);
  const active = workOrder.id === selectedId;
  const canShowReorder = ["생산중", "검수중", "완료"].includes(state);

  return (
    <div
      className={`w-full rounded-2xl border p-4 transition ${
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300"
      }`}
    >
      <button type="button" onClick={() => onClick(workOrder.id)} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{workOrder.title}</div>
            <div
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                active ? "bg-white/15 text-white" : getWorkOrderCardTone(state)
              }`}
            >
              {state}
            </div>
          </div>
        </div>
        <div className={`mt-3 space-y-1 text-xs ${active ? "text-stone-200" : "text-stone-500"}`}>
          <div className="truncate">{getCategoryPath(workOrder) || "분류 미지정"}</div>
          <div className="truncate">공장: {workOrder.vendor ?? "미지정"}</div>
          <div>마감: {workOrder.dueDate ?? "미지정"}</div>
          <div>첨부파일: {workOrder.filesCount ?? 0}개</div>
        </div>
      </button>
      {canShowReorder ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onReorder?.(workOrder.id)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              active
                ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-100"
            }`}
          >
            리오더
          </button>
        </div>
      ) : null}
    </div>
  );
}
