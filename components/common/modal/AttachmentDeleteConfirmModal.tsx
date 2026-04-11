"use client";

import ModalShell from "@/components/common/modal/ModalShell";
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
      footer={(
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="pbp-interactive-button rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="pbp-interactive-button rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 active:bg-rose-800"
          >
            삭제
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
          <div className="border-b border-stone-200 px-4 py-3">
            <div className="text-xs font-medium text-stone-500">삭제 대상</div>
            <div className="mt-1 break-all text-sm font-semibold text-stone-900">{attachment?.name ?? "첨부파일"}</div>
          </div>
          <div className="p-4">
            {attachment?.type === "image" ? (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <img src={attachment.url} alt={attachment.name} className="max-h-[340px] w-full object-contain bg-stone-100" />
              </div>
            ) : attachment ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-sm font-semibold text-rose-700">PDF</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-stone-900">{attachment.name}</div>
                    <div className="mt-1 text-xs text-stone-500">문서 파일은 삭제 후 복구할 수 없습니다.</div>
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
          이 첨부파일을 삭제하시겠습니까? 삭제 후에는 되돌릴 수 없습니다.
        </div>
      </div>
    </ModalShell>
  );
}
