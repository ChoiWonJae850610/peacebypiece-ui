"use client";

import { useEffect } from "react";

type WorkOrderLike = {
  id: string;
  title: string;
  vendor?: string;
  dueDate?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
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

export default function MobileDrawer({
  open,
  onClose,
  workOrders,
  selectedId,
  workflowStateById,
  onSelect,
  onCreate,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" aria-modal="true" role="dialog">
      <button
        type="button"
        aria-label="드로어 닫기"
        className="absolute inset-0 bg-stone-900/35"
        onClick={onClose}
      />
      <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm overflow-hidden rounded-r-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">작업 목록</div>
              <div className="text-[11px] text-stone-500">모바일 드로어</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700"
            >
              닫기
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              onCreate();
              onClose();
            }}
            className="mt-3 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white"
          >
            새 작업 추가
          </button>
        </div>
        <div className="h-[calc(100%-84px)] overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {workOrders.map((workOrder) => {
              const state = workflowStateById[workOrder.id] ?? "작성중";
              const active = workOrder.id === selectedId;
              return (
                <button
                  key={workOrder.id}
                  type="button"
                  onClick={() => {
                    onSelect(workOrder.id);
                    onClose();
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{workOrder.title}</div>
                      <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${active ? "bg-white/15 text-white" : getTone(state)}`}>
                        {state}
                      </div>
                    </div>
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
    </div>
  );
}
