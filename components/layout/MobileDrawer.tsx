"use client";

import { useEffect } from "react";
import WorkOrderListCard from "@/components/workorder/list/WorkOrderListCard";
import type { WorkOrderListItem } from "@/types/workorder";

type Props = {
  open: boolean;
  onClose: () => void;
  workOrders: WorkOrderListItem[];
  selectedId: string;
  workflowStateById: Record<string, string>;
  onSelect: (id: string) => void;
  onCreate: () => void;
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
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
