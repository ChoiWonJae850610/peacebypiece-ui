"use client";

import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import type { WorkOrderListItem } from "@/types/workorder";

type Props = {
  version: string;
  workOrders: WorkOrderListItem[];
  selectedId: string;
  workflowStateById: Record<string, string>;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

export default function SidebarContent({
  version,
  workOrders,
  selectedId,
  workflowStateById,
  onSelect,
  onCreate,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 p-4">
        <div className="text-lg font-semibold text-stone-900">PeacebyPiece v{version}</div>
        <div className="mt-1 text-xs text-stone-500">작업지시서 목록</div>
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white"
        >
          새 작업 추가
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {workOrders.map((workOrder) => (
            <WorkOrderListCard
              key={workOrder.id}
              workOrder={workOrder}
              selectedId={selectedId}
              workflowStateById={workflowStateById}
              onClick={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
