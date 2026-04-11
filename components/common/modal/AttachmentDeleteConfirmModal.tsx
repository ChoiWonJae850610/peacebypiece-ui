"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { UI_TEXT } from "@/lib/constants/uiText";
import type { Attachment } from "@/types/workorder";

export default function AttachmentDeleteConfirmModal({
  open,
  attachment,
  onClose,
  onConfirm,
}: {
  open: boolean;
  attachment: Attachment | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="첨부파일 삭제"
      description="삭제 전 파일을 한 번 더 확인하세요."
      maxWidthClass="md:max-w-lg"
      footer={renderModalFooterActions({
        layout: "end",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose, className: "active:bg-stone-200" },
        primary: { label: MODAL_ACTION_LABELS.delete, onClick: onConfirm, tone: "danger" },
      })}
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
          <div className="border-b border-stone-200 px-4 py-3">
            <div className="text-xs font-medium text-stone-500">{UI_TEXT.modal.attachmentDelete.targetLabel}</div>
            <div className="mt-1 break-all text-sm font-semibold text-stone-900">{attachment?.name ?? UI_TEXT.modal.attachmentDelete.fallbackName}</div>
          </div>
          <div className="p-4">
            {attachment?.type === "image" ? (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <img src={attachment.url} alt={attachment.name} className="max-h-[340px] w-full object-contain bg-stone-100" />
              </div>
            ) : attachment ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-sm font-semibold text-rose-700">{UI_TEXT.modal.attachmentDelete.pdfTypeLabel}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-stone-900">{attachment.name}</div>
                    <div className="mt-1 text-xs text-stone-500">{UI_TEXT.modal.attachmentDelete.pdfNotice}</div>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-stone-200">
                  <iframe title={attachment.name} src={attachment.url} className="h-[240px] w-full bg-stone-50" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
          {UI_TEXT.modal.attachmentDelete.warning}
        </div>
      </div>
    </ModalShell>
  );
}
