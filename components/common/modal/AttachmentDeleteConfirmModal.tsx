"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";

export default function AttachmentDeleteConfirmModal({
  open,
  attachmentName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  attachmentName: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="attachment-delete-confirm-title" maxWidthClassName="md:max-w-md">
      <ModalHeader titleId="attachment-delete-confirm-title" title="첨부파일 삭제" description="삭제 후에는 되돌릴 수 없습니다." onClose={onClose} />
      <ModalBody>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
          첨부파일은 삭제하시겠습니까?
          {attachmentName ? <div className="mt-2 break-all font-medium text-stone-900">{attachmentName}</div> : null}
        </div>
      </ModalBody>
      <ModalFooter>
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
      </ModalFooter>
    </BaseModal>
  );
}
