"use client";

import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import type { AttachmentPanelSection } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";
import type { MemoAttachmentPayload, RoleType, WorkOrder } from "@/types/workorder";

export default function WorkOrderSidePanel({
  isEmpty = false,
  canSeeAttachments,
  canManageAttachments,
  attachmentSections,
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
  canManageAttachments: boolean;
  attachmentSections: AttachmentPanelSection[];
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
  if (isEmpty) {
    return null;
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {attachmentSections.map((section) => (
        <WorkOrderAttachmentPanel
          key={section.key}
          title={section.title}
          emptyText={section.emptyText}
          addButtonLabel={section.addButtonLabel}
          canSeeAttachments={canSeeAttachments}
          canManageAttachments={canManageAttachments}
          attachments={section.items}
          onOpenAttachmentPicker={() => onOpenAttachmentPicker(section.uploadScope)}
          onPreviewAttachment={onPreviewAttachment}
          onDeleteAttachment={onDeleteAttachment}
        />
      ))}

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
