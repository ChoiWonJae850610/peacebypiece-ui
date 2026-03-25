"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalFocusTrap } from "@/components/common/modal/modalUtils";

type HistoryCategory = "work" | "inventory";
type HistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
type HistoryFilter = "all" | "work" | "inventory";
type PermissionSummary = "관리자" | "디자이너" | "입고/검수";

type HistoryLog = {
  id: string;
  workOrderId: string;
  category: HistoryCategory;
  action: string;
  message: string;
  user: string;
  time: string;
  tone: HistoryTone;
};

function getHistoryToneClass(tone: HistoryTone) {
  switch (tone) {
    case "blue":
      return "bg-blue-100 text-blue-700";
    case "violet":
      return "bg-violet-100 text-violet-700";
    case "emerald":
      return "bg-emerald-100 text-emerald-700";
    case "rose":
      return "bg-rose-100 text-rose-700";
    case "amber":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

export default function InventoryLogModal({
  open,
  onClose,
  logs,
  role,
  filter,
}: {
  open: boolean;
  onClose: () => void;
  logs: HistoryLog[];
  role: PermissionSummary;
  filter: HistoryFilter;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalFocusTrap({ open, dialogRef, onClose });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="inventory-log-modal-title"
      maxWidthClassName="md:max-w-2xl"
    >
      <ModalHeader
        titleId="inventory-log-modal-title"
        title="전체 히스토리"
        description="최신순으로 해당 작업지시서의 히스토리를 확인합니다."
        onClose={onClose}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
        <div className="mb-4 text-xs text-stone-400">
          {role === "관리자"
            ? `현재 필터: ${filter === "all" ? "전체" : filter === "work" ? "작업" : "재고"}`
            : `현재 보기 권한: ${role}`}
        </div>

        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getHistoryToneClass(item.tone)}`}
                  >
                    {item.action}
                  </div>
                  <div className="text-[11px] text-stone-500">{item.time}</div>
                </div>
                <div className="mt-2 text-xs text-stone-500">{item.user}</div>
                <div className="mt-1 text-sm text-stone-700">{item.message}</div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
              표시할 히스토리가 없습니다.
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
