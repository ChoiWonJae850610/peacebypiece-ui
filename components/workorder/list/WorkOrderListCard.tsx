"use client";

import { getCategoryPath, getWorkOrderCardTone, getWorkOrderStateLabel } from "@/lib/utils/workorder";
import type { WorkOrderListItem } from "@/types/workorder";

type Props = {
  workOrder: WorkOrderListItem;
  selectedId: string;
  workflowStateById: Record<string, string>;
  onClick: (id: string) => void;
};

export default function WorkOrderListCard({
  workOrder,
  selectedId,
  workflowStateById,
  onClick,
}: Props) {
  const state = getWorkOrderStateLabel(workflowStateById, workOrder.id);
  const active = workOrder.id === selectedId;

  return (
    <button
      type="button"
      onClick={() => onClick(workOrder.id)}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300"
      }`}
    >
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
        <div className="truncate">거래처/공장: {workOrder.vendor ?? "미지정"}</div>
        <div>마감: {workOrder.dueDate ?? "미지정"}</div>
        <div>첨부파일: {workOrder.filesCount ?? 0}개</div>
      </div>
    </button>
  );
}
