"use client";

import { useRef, useState } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { NotificationSettingKey, NotificationSettings, HistoryFilter } from "@/types/workflow";
import type { HistoryLog, HistoryTone } from "@/types/workorder";

const SETTING_META: { key: NotificationSettingKey; label: string; description: string }[] = [
  { key: "created", label: "작업지시서 생성", description: "새 작업지시서 생성 이벤트" },
  { key: "updated", label: "기본사항 수정", description: "기본정보 저장 및 수정 이벤트" },
  { key: "status_changed", label: "상태 변경", description: "작성중, 검토요청, 발주요청 등 단계 변경" },
  { key: "materials_changed", label: "원단/부자재 변경", description: "원단, 부자재, 단가 등 생산구성 변경" },
  { key: "outsourcing_changed", label: "외주 공정 변경", description: "외주 공정 추가, 수정, 삭제" },
  { key: "stock_changed", label: "재고 변경", description: "입고, 차감, 보정 수량 변경" },
  { key: "comment_added", label: "메모 작성", description: "작업메모와 댓글 등록" },
];

function getHistoryToneClass(tone: HistoryTone) {
  switch (tone) {
    case "blue": return "bg-blue-100 text-blue-700";
    case "violet": return "bg-violet-100 text-violet-700";
    case "emerald": return "bg-emerald-100 text-emerald-700";
    case "rose": return "bg-rose-100 text-rose-700";
    case "amber": return "bg-amber-100 text-amber-700";
    default: return "bg-stone-100 text-stone-700";
  }
}

function formatSummary(item: HistoryLog) {
  if (item.transition) {
    return `${item.action}: ${item.transition.from} → ${item.transition.to} · ${item.user}`;
  }
  const firstDetail = item.detailLines?.[0]?.value?.trim();
  if (firstDetail) {
    const compact = firstDetail.length > 42 ? `${firstDetail.slice(0, 42)}…` : firstDetail;
    return `${item.action}: ${compact} · ${item.user}`;
  }
  return `${item.action} · ${item.user}`;
}

function HistoryPreviewItem({ item }: { item: HistoryLog }) {
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${getHistoryToneClass(item.tone)}`}>{item.action}</div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>{item.time}</span>
            {hasDetails ? <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">{open ? "접기" : "상세"}</span> : null}
          </div>
        </div>
        <div className="mt-2 text-sm text-stone-700 break-words">{formatSummary(item)}</div>
      </button>

      {hasDetails && open ? (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700">
          {item.transition ? (
            <div className="rounded-lg bg-stone-50 px-3 py-2 font-medium text-stone-800">
              {item.transition.from} <span className="px-1 text-stone-400">→</span> {item.transition.to}
            </div>
          ) : null}
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
      ) : null}
    </div>
  );
}

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
  historyLogs: HistoryLog[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
};

export default function AdminPanelModal({
  open,
  onClose,
  notificationSettings,
  onToggleNotificationSetting,
  historyLogs,
  historyFilter,
  onHistoryFilterChange,
}: AdminPanelModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="admin-panel-modal-title" maxWidthClassName="md:max-w-3xl">
      <ModalHeader
        titleId="admin-panel-modal-title"
        title="관리자 패널"
        description="알림 이벤트 ON/OFF와 관리자 전용 히스토리를 한곳에서 점검하는 테스트용 패널입니다."
        onClose={onClose}
      />
      <ModalBody className="space-y-4 bg-stone-50">
        <section className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">알림 이벤트 설정</div>
              <div className="mt-1 text-xs leading-5 text-stone-500">지금은 상태만 유지하고 실제 발송은 연결하지 않습니다.</div>
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-700">테스트용</span>
          </div>
          <div className="mt-3 space-y-2">
            {SETTING_META.map((item) => {
              const checked = notificationSettings[item.key];
              return (
                <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 transition hover:border-stone-300 hover:bg-stone-100">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleNotificationSetting(item.key)}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-stone-900">{item.label}</div>
                    <div className="mt-1 break-keep text-xs leading-5 text-stone-500">{item.description}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${checked ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"}`}>{checked ? "ON" : "OFF"}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">히스토리</h3>
              <div className="mt-1 text-xs text-stone-500">summary 형식: 설명 · 사용자</div>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{historyLogs.length}건</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {([ ["all", "전체"], ["work", "작업"], ["inventory", "재고"], ["attachment", "첨부"] ] as [HistoryFilter, string][]).map(([value, label]) => (
              <button key={value} type="button" onClick={() => onHistoryFilterChange(value)} className={`pbp-touch-target pbp-interactive-button rounded-full px-3 py-1 text-xs font-medium ${historyFilter === value ? "bg-stone-900 text-white hover:bg-stone-800 active:bg-black" : "border border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200"}`}>{label}</button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {historyLogs.length > 0 ? historyLogs.map((item) => <HistoryPreviewItem key={item.id} item={item} />) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">표시할 히스토리가 없습니다.</div>}
          </div>
        </section>
      </ModalBody>
    </BaseModal>
  );
}
