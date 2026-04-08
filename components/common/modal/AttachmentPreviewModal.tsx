"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
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
            className="mx-auto max-h-[70dvh] w-auto rounded-2xl border border-stone-200 bg-white object-contain shadow-sm"
          />
        ) : attachment ? (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">PDF 미리보기</div>
            {attachment.url ? (
              <iframe
                title={attachment.name}
                src={attachment.url}
                className="h-[70dvh] w-full bg-white"
              />
            ) : (
              <div className="flex h-[70dvh] items-center justify-center bg-stone-50 px-6 text-center text-sm text-stone-500">
                이 PDF는 미리보기 데이터를 찾을 수 없습니다.
              </div>
            )}
          </div>
        ) : null}
      </ModalBody>

    </BaseModal>
  );
}
