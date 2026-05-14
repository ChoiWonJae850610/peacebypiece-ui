"use client";

import { useRef } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { Attachment } from "@/types/workorder";
import { MODAL_EXCEPTION_PRESETS } from "@/components/common/modal/modalPresets";
import { MODAL_CONTENT_BODY_TEXT_CLASS, MODAL_CONTENT_SECTION_PANEL_CLASS } from "@/components/common/modal/modalContentClassNames";
import { useI18n } from "@/lib/i18n";
import { getAttachmentDownloadUrl, getAttachmentPreviewUrl } from "@/lib/permissions/attachments";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M10 3.75v7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6.75 8.75 10 12l3.25-3.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.75 14.25h10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
  const previewUrl = getAttachmentPreviewUrl(attachment);
  const downloadUrl = getAttachmentDownloadUrl(attachment);

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
                  href={downloadUrl || previewUrl}
                  download={attachment.name}
                  target="_blank"
                  rel="noreferrer"
                  className="pbp-interactive-button pbp-action-secondary inline-flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition active:scale-[0.98]"
                  aria-label={copy.download}
                  title={copy.download}
                >
                  <DownloadIcon />
                </a>
              ) : null}
            </div>

            {!previewUrl ? (
              <div className={`${MODAL_CONTENT_SECTION_PANEL_CLASS} p-6 shadow-sm`}>
                <div className="text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.unavailableTitle}</div>
                <div className={`mt-2 leading-6 ${MODAL_CONTENT_BODY_TEXT_CLASS}`}>{copy.unavailableDescription}</div>
              </div>
            ) : attachment.type === "image" ? (
              <img
                src={previewUrl}
                alt={attachment.name}
                className="mx-auto max-h-[70dvh] w-auto rounded-2xl border border-[var(--pbp-modal-section-border)] bg-[var(--pbp-modal-section-surface)] object-contain shadow-sm"
              />
            ) : attachment.type === "pdf" ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--pbp-modal-section-border)] bg-[var(--pbp-modal-section-surface)] shadow-sm">
                <div className="border-b border-[var(--pbp-border)] px-4 py-3 text-sm font-medium text-[var(--pbp-text-secondary)]">{copy.pdfPreview}</div>
                <iframe
                  title={attachment.name}
                  src={previewUrl}
                  className="h-[65dvh] w-full bg-[var(--pbp-modal-section-surface)] md:h-[70dvh]"
                />
              </div>
            ) : (
              <div className={`${MODAL_CONTENT_SECTION_PANEL_CLASS} p-6 shadow-sm`}>
                <div className="text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.filePreviewTitle}</div>
                <div className={`mt-2 leading-6 ${MODAL_CONTENT_BODY_TEXT_CLASS}`}>{copy.filePreviewDescription}</div>
              </div>
            )}
          </div>
        ) : null}
      </ModalBody>
    </BaseModal>
  );
}
