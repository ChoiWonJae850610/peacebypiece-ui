"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { Attachment } from "@/types/workorder";

export default function AttachmentPreviewModal({
  attachment,
  canDelete,
  onClose,
  onDelete,
}: {
  attachment: Attachment | null;
  canDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const open = attachment !== null;

  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="attachment-preview-title"
      maxWidthClassName="md:max-w-4xl"
      overlayClassName="bg-black/50"
    >
      <ModalHeader titleId="attachment-preview-title" title="첨부파일 보기" description={attachment?.name} onClose={onClose} />

      <ModalBody className="bg-stone-50 p-4 md:p-6">
        {attachment?.type === "image" ? (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="mx-auto max-h-[75vh] w-auto rounded-2xl border border-stone-200 bg-white object-contain shadow-sm"
          />
        ) : attachment ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-stone-200 bg-white p-8 text-center">
            <div>
              <div className="text-lg font-semibold text-stone-900">PDF 파일</div>
              <div className="mt-2 text-sm text-stone-500">{attachment.name}</div>
              <div className="mt-4 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">PDF 미리보기 카드</div>
            </div>
          </div>
        ) : null}
      </ModalBody>

      {canDelete ? (
        <ModalFooter>
          <button
            type="button"
            onClick={onDelete}
            className="w-full rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-medium text-rose-700"
          >
            첨부파일 삭제
          </button>
        </ModalFooter>
      ) : null}
    </BaseModal>
  );
}
