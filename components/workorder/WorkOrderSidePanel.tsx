"use client";

import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import type { Attachment, MemoAttachmentPayload, RoleType, WorkOrder } from "@/types/workorder";

export default function WorkOrderSidePanel({
  isEmpty = false,
  canSeeAttachments,
  canUploadOfficialAttachments,
  designAttachments,
  officialAttachments,
  onOpenDesignAttachmentPicker,
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
  isEmpty?: boolean;
  canSeeAttachments: boolean;
  canUploadOfficialAttachments: boolean;
  designAttachments: Attachment[];
  officialAttachments: Attachment[];
  onOpenDesignAttachmentPicker: () => void;
  onOpenAttachmentPicker: () => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  canDeleteAttachment: (attachment: Attachment | null) => boolean;
  currentRole: RoleType;
  workOrder: WorkOrder;
  currentUserName: string;
  onCreateMemoThread: (content: string, payload?: MemoAttachmentPayload) => void;
  onCreateMemoReply: (threadId: string, content: string, payload?: MemoAttachmentPayload) => void;
  canPromoteMemoAttachment: boolean;
  onPromoteMemoAttachment: (attachmentId: string) => void;
}) {
  if (isEmpty) {
    return null;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <WorkOrderAttachmentPanel
        canSeeAttachments={canSeeAttachments}
        canUploadAttachments={canUploadOfficialAttachments}
        title="디자인"
        emptyText="아직 디자인 파일이 없습니다."
        addButtonLabel="+ 디자인 추가"
        attachments={designAttachments}
        onOpenAttachmentPicker={onOpenDesignAttachmentPicker}
        onPreviewAttachment={onPreviewAttachment}
        onDeleteAttachment={onDeleteAttachment}
        canDeleteAttachment={canDeleteAttachment}
      />

      <WorkOrderAttachmentPanel
        canSeeAttachments={canSeeAttachments}
        canUploadAttachments={canUploadOfficialAttachments}
        title="공식 첨부파일"
        emptyText="아직 공식 첨부파일이 없습니다."
        addButtonLabel="+ 첨부 추가"
        attachments={officialAttachments}
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
