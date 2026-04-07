"use client";

import { useState } from "react";
import { toDisplayValue } from "@/lib/utils/display";
import type { Attachment, HistoryFilter, HistoryLog, HistoryTone, Outsourcing } from "@/types/workorder";

function SummaryRow({ label, value, strong = false }: { label: string; value: string | number | null | undefined; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-semibold text-stone-900" : "text-stone-600"}>{label}</span>
      <span className={strong ? "font-semibold text-stone-900" : "font-medium"}>{toDisplayValue(value)}</span>
    </div>
  );
}

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

function AttachmentPanel({
  canSeeAttachments,
  attachments,
  isAdmin,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  canDeleteAttachment,
}: {
  canSeeAttachments: boolean;
  attachments: Attachment[];
  isAdmin: boolean;
  onOpenAttachmentPicker: () => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canDeleteAttachment: (attachment: Attachment | null) => boolean;
}) {
  if (!canSeeAttachments) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">공식 첨부파일</h3>
        </div>
        {isAdmin ? (
          <button type="button" onClick={onOpenAttachmentPicker} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100">+ 공식 첨부 추가</button>
        ) : null}
      </div>
      {attachments.length > 0 ? (
        <div className="mt-4 space-y-3">
          {attachments.map((attachment) => {
            const canDelete = canDeleteAttachment(attachment);

            return (
              <div key={attachment.id} className="relative rounded-2xl border border-stone-200 bg-stone-50 p-3 pr-12">
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => onDeleteAttachment(attachment.id)}
                    className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-600 transition hover:border-rose-300 hover:text-rose-600"
                    aria-label={`${attachment.name} 삭제`}
                    title="삭제"
                  >
                    ×
                  </button>
                ) : null}
                <button type="button" onClick={() => onPreviewAttachment(attachment.id)} className="flex w-full items-center gap-3 text-left">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                    {attachment.type === "image" ? (
                      <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-rose-700">PDF</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate pr-2 text-sm font-medium text-stone-900">{attachment.name}</div>
                    <div className="mt-1 text-xs text-stone-500">{attachment.ownerName ?? "기존 첨부"}</div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">아직 공식 첨부파일이 없습니다.</div>
      )}
    </div>
  );
}

export default function WorkOrderSidePanel({
  canSeeAttachments,
  attachments,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  canDeleteAttachment,
  canSeeCostSections,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  totalCost,
  unitCost,
  outsourcing,
  canSeeInventoryHistorySection,
  isAdmin,
  currentRole,
  filteredHistoryLogs,
  historyFilter,
  onHistoryFilterChange,
  onOpenInventoryLogModal,
}: {
  canSeeAttachments: boolean;
  attachments: Attachment[];
  onOpenAttachmentPicker: () => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canDeleteAttachment: (attachment: Attachment | null) => boolean;
  canSeeCostSections: boolean;
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  totalCost: number;
  unitCost: number;
  outsourcing: Outsourcing[];
  canSeeInventoryHistorySection: boolean;
  isAdmin: boolean;
  currentRole: string;
  filteredHistoryLogs: HistoryLog[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (filter: HistoryFilter) => void;
  onOpenInventoryLogModal: () => void;
}) {
  return (
    <div className="space-y-6">
      <AttachmentPanel
        canSeeAttachments={canSeeAttachments}
        attachments={attachments}
        isAdmin={isAdmin}
        onOpenAttachmentPicker={onOpenAttachmentPicker}
        onPreviewAttachment={onPreviewAttachment}
        onDeleteAttachment={onDeleteAttachment}
        canDeleteAttachment={canDeleteAttachment}
      />

      {canSeeCostSections && (
        <>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">비용 요약</h3>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="원단 합계" value={`${fabricTotal.toLocaleString()}원`} />
              <SummaryRow label="부자재 합계" value={`${subsidiaryTotal.toLocaleString()}원`} />
              <SummaryRow label="외주 합계" value={`${outsourcingTotal.toLocaleString()}원`} />
              <div className="border-t border-stone-200 pt-3">
                <SummaryRow label="총합" value={`${totalCost.toLocaleString()}원`} strong />
                <SummaryRow label="장당 추정 원가" value={`${unitCost.toLocaleString()}원`} />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">공정별 금액</h3>
            <div className="mt-4 space-y-2 text-sm">
              {outsourcing.map((item) => <SummaryRow key={item.process} label={item.process} value={`${(item.totalCost ?? 0).toLocaleString()}원`} />)}
            </div>
          </div>
        </>
      )}

      {canSeeInventoryHistorySection && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{isAdmin ? "최근 히스토리" : "최근 변경 요약"}</h3>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-600">{filteredHistoryLogs.length}건</span>
          </div>
          {isAdmin && (
            <div className="mt-3 flex flex-wrap gap-2">
              {([ ["all", "전체"], ["work", "작업"], ["inventory", "재고"], ["attachment", "첨부"] ] as [HistoryFilter, string][]).map(([value, label]) => (
                <button key={value} type="button" onClick={() => onHistoryFilterChange(value)} className={`rounded-full px-3 py-1 text-xs font-medium ${historyFilter === value ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-700"}`}>{label}</button>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-3">
            {filteredHistoryLogs.length > 0 ? filteredHistoryLogs.slice(0, 3).map((item) => (
              <HistoryPreviewItem key={item.id} item={item} />
            )) : <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-sm text-stone-500">표시할 히스토리가 없습니다.</div>}
          </div>
          {isAdmin && filteredHistoryLogs.length > 3 && <button type="button" onClick={onOpenInventoryLogModal} className="mt-4 w-full rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100">전체 히스토리 보기</button>}
        </div>
      )}
    </div>
  );
}
