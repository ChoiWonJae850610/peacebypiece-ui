"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { Attachment } from "@/types/workorder";
import { MODAL_EXCEPTION_PRESETS } from "@/components/common/modal/modalPresets";
import { useI18n } from "@/lib/i18n";

export default function AttachmentPreviewModal({
  attachment,
  canDownload,
  onClose,
}: {
  attachment: Attachment | null;
  canDownload: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const open = attachment !== null;
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.attachmentPreview;

  useModalEnvironment({ open, dialogRef, onClose });

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      dialogRef={dialogRef}
      titleId="attachment-preview-title"
      maxWidthClassName={MODAL_EXCEPTION_PRESETS.attachmentPreview.maxWidthClass}
      overlayClassName={MODAL_EXCEPTION_PRESETS.attachmentPreview.overlayClassName}
    >
      <ModalHeader titleId="attachment-preview-title" title={copy.title} description={attachment?.name ?? copy.emptyDescription} onClose={onClose} />

      <ModalBody className={MODAL_EXCEPTION_PRESETS.attachmentPreview.bodyClassName}>
        {attachment ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {canDownload ? (
                <a
                  href={attachment.url}
                  download={attachment.name}
                  target="_blank"
                  rel="noreferrer"
                  className="pbp-interactive-button inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                >
                  {copy.download}
                </a>
              ) : null}
            </div>

            {!attachment.url ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-stone-800">{copy.unavailableTitle}</div>
                <div className="mt-2 text-sm leading-6 text-stone-600">{copy.unavailableDescription}</div>
              </div>
            ) : attachment.type === "image" ? (
              <img
                src={attachment.url}
                alt={attachment.name}
                className="mx-auto max-h-[70dvh] w-auto rounded-2xl border border-stone-200 bg-white object-contain shadow-sm"
              />
            ) : attachment.type === "pdf" ? (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="border-b border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">{copy.pdfPreview}</div>
                <iframe
                  title={attachment.name}
                  src={attachment.url}
                  className="h-[65dvh] w-full bg-white md:h-[70dvh]"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <div className="text-sm font-semibold text-stone-800">{copy.filePreviewTitle}</div>
                <div className="mt-2 text-sm leading-6 text-stone-600">{copy.filePreviewDescription}</div>
              </div>
            )}
          </div>
        ) : null}
      </ModalBody>
    </BaseModal>
  );
}
