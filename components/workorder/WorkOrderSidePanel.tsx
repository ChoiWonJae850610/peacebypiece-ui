"use client";

import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import type { Attachment, MemoAttachmentPayload, WorkOrder } from "@/types/workorder";

export default function WorkOrderSidePanel({
  canSeeAttachments,
  canUploadOfficialAttachments,
  attachments,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  canDeleteAttachment,
  currentRole,
  workOrder,
  currentUserName,
  onCreateMemoThread,
  onCreateMemoReply,
  canPromoteMemoAttachment,
  onPromoteMemoAttachment,
}: {
  canSeeAttachments: boolean;
  canUploadOfficialAttachments: boolean;
  attachments: Attachment[];
  onOpenAttachmentPicker: () => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canDeleteAttachment: (attachment: Attachment | null) => boolean;
  currentRole: string;
  workOrder: WorkOrder;
  currentUserName: string;
  onCreateMemoThread: (content: string, payload?: MemoAttachmentPayload) => void;
  onCreateMemoReply: (threadId: string, content: string, payload?: MemoAttachmentPayload) => void;
  canPromoteMemoAttachment: boolean;
  onPromoteMemoAttachment: (attachmentId: string) => void;
}) {
  return (
    <div className="space-y-3 md:space-y-4">
      <WorkOrderAttachmentPanel
        canSeeAttachments={canSeeAttachments}
        canUploadOfficialAttachments={canUploadOfficialAttachments}
        attachments={attachments}
        onOpenAttachmentPicker={onOpenAttachmentPicker}
        onPreviewAttachment={onPreviewAttachment}
        onDeleteAttachment={onDeleteAttachment}
        canDeleteAttachment={canDeleteAttachment}
      />

      <WorkOrderMemoPanel
        workOrder={workOrder}
        currentUserName={currentUserName}
        currentUserRole={currentRole}
        onCreateThread={onCreateMemoThread}
        onCreateReply={onCreateMemoReply}
        canPromoteMemoAttachment={canPromoteMemoAttachment}
        onPromoteMemoAttachment={onPromoteMemoAttachment}
        onPreviewAttachment={onPreviewAttachment}
      />
    </div>
  );
}
