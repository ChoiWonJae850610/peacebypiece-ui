"use client";

import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import { useI18n } from "@/lib/i18n";
import type { AttachmentPanelItem } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";
import type { MemoAttachmentPayload, RoleType, WorkOrder } from "@/types/workorder";

export default function WorkOrderSidePanel({
  isEmpty = false,
  canSeeAttachments,
  canUploadOfficialAttachments,
  designAttachments,
  attachments,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
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
  designAttachments: AttachmentPanelItem[];
  attachments: AttachmentPanelItem[];
  onOpenAttachmentPicker: (scope?: "design" | "official") => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  currentRole: RoleType;
  workOrder: WorkOrder;
  currentUserName: string;
  onCreateMemoThread: (content: string, payload?: MemoAttachmentPayload) => void;
  onCreateMemoReply: (threadId: string, content: string, payload?: MemoAttachmentPayload) => void;
  canPromoteMemoAttachment: boolean;
  onPromoteMemoAttachment: (attachmentId: string) => void;
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;

  if (isEmpty) {
    return null;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <WorkOrderAttachmentPanel
        title="디자인"
        emptyText="아직 디자인 파일이 없습니다."
        addButtonLabel="+ 디자인 추가"
        canSeeAttachments={canSeeAttachments}
        canUploadOfficialAttachments={canUploadOfficialAttachments}
        attachments={designAttachments}
        onOpenAttachmentPicker={() => onOpenAttachmentPicker("design")}
        onPreviewAttachment={onPreviewAttachment}
        onDeleteAttachment={onDeleteAttachment}
      />

      <WorkOrderAttachmentPanel
        title={ui.attachmentPanel.title}
        emptyText={ui.attachmentPanel.empty}
        addButtonLabel={ui.attachmentPanel.addButton}
        canSeeAttachments={canSeeAttachments}
        canUploadOfficialAttachments={canUploadOfficialAttachments}
        attachments={attachments}
        onOpenAttachmentPicker={() => onOpenAttachmentPicker("official")}
        onPreviewAttachment={onPreviewAttachment}
        onDeleteAttachment={onDeleteAttachment}
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
