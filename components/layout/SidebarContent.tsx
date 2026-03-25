"use client";

type WorkOrderLike = {
  id: string;
  title: string;
  vendor?: string;
  dueDate?: string;
};

type Props = {
  version: string;
  workOrders: WorkOrderLike[];
  selectedId: string;
  workflowStateById: Record<string, string>;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

const getTone = (state: string) => {
  if (state === "완료" || state === "종결") return "bg-emerald-100 text-emerald-800";
  if (state === "반려") return "bg-rose-100 text-rose-800";
  if (state === "발주요청" || state === "검토대기" || state === "입고대기") return "bg-amber-100 text-amber-800";
  return "bg-cyan-100 text-cyan-800";
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
          {workOrders.map((workOrder) => {
            const state = workflowStateById[workOrder.id] ?? "작성중";
            const active = workOrder.id === selectedId;
            return (
              <button
                key={workOrder.id}
                type="button"
                onClick={() => onSelect(workOrder.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300"
                }`}
              >
                <div className="text-sm font-semibold">{workOrder.title}</div>
                <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${active ? "bg-white/15 text-white" : getTone(state)}`}>
                  {state}
                </div>
                <div className={`mt-2 text-xs ${active ? "text-stone-200" : "text-stone-500"}`}>
                  {workOrder.vendor ?? "거래처 미지정"} · {workOrder.dueDate ?? "납기 미지정"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
