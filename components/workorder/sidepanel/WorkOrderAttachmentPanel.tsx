"use client";

import WorkOrderPanelCard from "@/components/common/ui/WorkOrderPanelCard";
import { useI18n } from "@/lib/i18n";
import type { AttachmentPanelItem } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";

export default function WorkOrderAttachmentPanel({
  title,
  addButtonLabel,
  emptyText,
  canSeeAttachments,
  canUploadOfficialAttachments,
  attachments,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
}: {
  title: string;
  addButtonLabel: string;
  emptyText: string;
  canSeeAttachments: boolean;
  canUploadOfficialAttachments: boolean;
  attachments: AttachmentPanelItem[];
  onOpenAttachmentPicker: () => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;

  if (!canSeeAttachments) return null;

  return (
    <WorkOrderPanelCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        </div>
        {canUploadOfficialAttachments ? (
          <button type="button" onClick={onOpenAttachmentPicker} className="pbp-interactive-button rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200">{addButtonLabel}</button>
        ) : null}
      </div>
      {attachments.length > 0 ? (
        <div className="mt-2.5 space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="relative rounded-2xl border border-stone-200 bg-stone-50 p-3 pr-12">
              {attachment.canDelete ? (
                <button
                  type="button"
                  onClick={() => onDeleteAttachment(attachment.id)}
                  className="pbp-interactive-button absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
                  aria-label={`${attachment.name} ${ui.attachmentPanel.deleteAriaSuffix}`}
                  title={ui.attachmentPanel.deleteTitle}
                >
                  ×
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onPreviewAttachment(attachment.id)}
                disabled={!attachment.canPreview}
                className="flex w-full items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {attachment.type === "image" ? (
                    <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-rose-700">{attachment.previewLabel}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate pr-2 text-sm font-medium text-stone-900">{attachment.name}</div>
                  <div className="mt-1 text-xs text-stone-500">{attachment.ownerLabel}</div>
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">{emptyText}</div>
      )}
    </WorkOrderPanelCard>
  );
}
