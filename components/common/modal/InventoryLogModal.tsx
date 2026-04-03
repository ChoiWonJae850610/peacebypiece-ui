"use client";

import { useMemo, useRef, useState } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { HistoryFilter, HistoryLog, RoleType } from "@/types/workorder";

function getHistoryToneClass(tone: HistoryLog["tone"]) {
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

function HistoryLogItem({ item }: { item: HistoryLog }) {
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getHistoryToneClass(item.tone)}`}>
            {item.action}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>{item.time}</span>
            {hasDetails && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">{open ? "접기" : "상세"}</span>}
          </div>
        </div>
        <div className="mt-2 text-xs text-stone-500">{item.user}</div>
        <div className="mt-1 text-sm text-stone-700">{item.message}</div>
      </button>

      {hasDetails && open && (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700">
          {item.transition && (
            <div className="rounded-lg bg-stone-50 px-3 py-2 font-medium text-stone-800">
              {item.transition.from} <span className="px-1 text-stone-400">→</span> {item.transition.to}
            </div>
          )}
          {item.detailLines?.map((detail, index) => (
            <div key={`${item.id}-detail-${index}`} className="flex items-start gap-2 leading-5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
              <span>
                {detail.label ? <span className="font-medium text-stone-900">{detail.label}: </span> : null}
                <span className="break-words">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  role: RoleType;
  filter: HistoryFilter;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalEnvironment({ open, dialogRef, onClose });
  const summaryText = useMemo(() => {
    if (role === "관리자") {
      return `현재 필터: ${filter === "all" ? "전체" : filter === "work" ? "작업" : "재고"}`;
    }
    return `현재 보기 권한: ${role}`;
  }, [filter, role]);

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="inventory-log-modal-title" maxWidthClassName="md:max-w-2xl">
      <ModalHeader
        titleId="inventory-log-modal-title"
        title="전체 히스토리"
        description="요약 문구를 누르면 상세 변경 내용을 펼쳐서 확인할 수 있습니다."
        onClose={onClose}
      />

      <ModalBody>
        <div className="mb-4 text-xs text-stone-400">{summaryText}</div>

        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.map((item) => <HistoryLogItem key={item.id} item={item} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">
              표시할 히스토리가 없습니다.
            </div>
          )}
        </div>
      </ModalBody>
    </BaseModal>
  );
}
