"use client";

import { getAttachmentPreviewLabel, isOfficialAttachment } from "@/lib/permissions/attachments";
import type { Attachment } from "@/types/workorder";

export default function MemoAttachmentList({
  attachmentIds,
  attachmentsById,
  canPromoteMemoAttachment = false,
  onPromoteMemoAttachment,
  onPreviewAttachment,
}: {
  attachmentIds?: string[];
  attachmentsById: Map<string, Attachment>;
  canPromoteMemoAttachment?: boolean;
  onPromoteMemoAttachment?: (attachmentId: string) => void;
  onPreviewAttachment?: (attachmentId: string) => void;
}) {
  const linkedAttachments = (attachmentIds ?? [])
    .map((attachmentId) => attachmentsById.get(attachmentId))
    .filter((attachment): attachment is Attachment => Boolean(attachment));

  if (linkedAttachments.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {linkedAttachments.map((attachment) => {
        const isOfficial = isOfficialAttachment(attachment);
        return (
          <div key={attachment.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] text-stone-700">
            <button
              type="button"
              onClick={() => onPreviewAttachment?.(attachment.id)}
              className="flex min-w-0 max-w-full items-center gap-1.5 text-left"
            >
              <span className="inline-flex h-5 min-w-9 items-center justify-center rounded-full bg-white px-1.5 font-semibold text-stone-900">{getAttachmentPreviewLabel(attachment)}</span>
              <span className="max-w-[160px] truncate">{attachment.name}</span>
            </button>
            {!isOfficial && canPromoteMemoAttachment && onPromoteMemoAttachment ? (
              <button type="button" onClick={() => onPromoteMemoAttachment(attachment.id)} className="pbp-interactive-button shrink-0 rounded-full border border-stone-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200">승격</button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
