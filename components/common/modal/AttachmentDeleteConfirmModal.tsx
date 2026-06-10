"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_CONTENT_LABEL_CLASS, MODAL_CONTENT_MUTED_PANEL_CLASS, MODAL_CONTENT_SECTION_PANEL_CLASS, MODAL_CONTENT_SUBTEXT_CLASS, MODAL_CONTENT_WARNING_PANEL_CLASS } from "@/components/common/modal/modalContentClassNames";
import { MODAL_ACTION_LABELS, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { useI18n } from "@/lib/i18n";
import { getAttachmentPreviewUrl, getAttachmentThumbnailUrl } from "@/lib/permissions/attachments";


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
  const { i18n } = useI18n();
  const ui = i18n.common.ui;
  const previewUrl = getAttachmentPreviewUrl(attachment);
  const thumbnailUrl = getAttachmentThumbnailUrl(attachment);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={ui.modal.attachmentDelete.title}
      description={ui.modal.attachmentDelete.description}
      maxWidthClass="md:max-w-lg"
      footer={renderModalFooterActions({
        layout: "end",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose },
        primary: { label: MODAL_ACTION_LABELS.delete, onClick: onConfirm, tone: "danger" },
      })}
    >
      <div className="space-y-4">
        <div className={`${MODAL_CONTENT_MUTED_PANEL_CLASS} overflow-hidden p-0`}>
          <div className="border-b border-[var(--pbp-border)] px-4 py-3">
            <div className={`font-medium ${MODAL_CONTENT_LABEL_CLASS}`}>{ui.modal.attachmentDelete.targetLabel}</div>
            <div className="mt-1 break-all text-sm font-semibold text-[var(--pbp-text-primary)]">{attachment?.name ?? ui.modal.attachmentDelete.fallbackName}</div>
          </div>
          <div className="p-4">
            {attachment?.type === "image" ? (
              <div className={`${MODAL_CONTENT_SECTION_PANEL_CLASS} overflow-hidden p-0`}>
                <img src={thumbnailUrl} alt={attachment.name} className="max-h-[340px] w-full object-contain bg-[var(--pbp-surface-muted)]" />
              </div>
            ) : attachment ? (
              <div className={MODAL_CONTENT_SECTION_PANEL_CLASS}>
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center wafl-shape-icon border border-[var(--pbp-action-danger-soft-border)] bg-[var(--pbp-action-danger-soft-surface)] text-sm font-semibold text-[var(--pbp-action-danger-soft-text)]">{ui.modal.attachmentDelete.pdfTypeLabel}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--pbp-text-primary)]">{attachment.name}</div>
                    <div className={`mt-1 ${MODAL_CONTENT_SUBTEXT_CLASS}`}>{ui.modal.attachmentDelete.pdfNotice}</div>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden wafl-shape-control border border-[var(--pbp-border)]">
                  <iframe title={attachment.name} src={previewUrl} className="h-[240px] w-full bg-[var(--pbp-surface-muted)]" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className={MODAL_CONTENT_WARNING_PANEL_CLASS}>
          {ui.modal.attachmentDelete.warning}
        </div>
      </div>
    </ModalShell>
  );
}
