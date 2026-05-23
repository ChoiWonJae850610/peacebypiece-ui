import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import WorkOrderSidePanelAttachmentSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections";
import type { WorkOrderSidePanelProps, WorkOrderSidePanelVariant } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

type WorkOrderSidePanelSectionsProps = WorkOrderSidePanelProps & {
  variant: WorkOrderSidePanelVariant;
  memoFirst?: boolean;
};

export default function WorkOrderSidePanelSections({
  canSeeAttachments,
  canManageAttachments,
  canEditMemo,
  writeLocked = false,
  writeLockMessage,
  attachmentSections,
  onOpenAttachmentPicker,
  onOpenDesignDrawingModal,
  onUploadAttachmentFiles,
  onPreviewAttachment,
  onDeleteAttachment,
  onSetPrimaryDesignAttachment,
  currentRole,
  users,
  workOrder,
  currentUserName,
  currentUserId,
  onCreateMemoThread,
  onCreateMemoReply,
  onUpdateMemoThread,
  onDeleteMemoThread,
  onUpdateMemoReply,
  onDeleteMemoReply,
  variant,
  memoFirst = false,
}: WorkOrderSidePanelSectionsProps) {
  const attachmentPanels = (
    <WorkOrderSidePanelAttachmentSections
      attachmentSections={attachmentSections}
      canSeeAttachments={canSeeAttachments}
      canManageAttachments={canManageAttachments}
      onOpenAttachmentPicker={onOpenAttachmentPicker}
      onOpenDesignDrawingModal={onOpenDesignDrawingModal}
      onUploadAttachmentFiles={onUploadAttachmentFiles}
      onPreviewAttachment={onPreviewAttachment}
      onDeleteAttachment={onDeleteAttachment}
      onSetPrimaryDesignAttachment={onSetPrimaryDesignAttachment}
      writeLocked={writeLocked}
      writeLockMessage={writeLockMessage}
      variant={variant}
    />
  );

  const memoPanel = (
    <WorkOrderMemoPanel
      workOrder={workOrder}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserRole={currentRole}
      users={users}
      onCreateThread={onCreateMemoThread}
      onCreateReply={onCreateMemoReply}
      onUpdateThread={onUpdateMemoThread}
      onDeleteThread={onDeleteMemoThread}
      onUpdateReply={onUpdateMemoReply}
      onDeleteReply={onDeleteMemoReply}
      canEditMemo={canEditMemo}
      writeLocked={writeLocked}
      writeLockMessage={writeLockMessage}
      variant={variant}
    />
  );

  return memoFirst ? (
    <>
      {memoPanel}
      {attachmentPanels}
    </>
  ) : (
    <>
      {attachmentPanels}
      {memoPanel}
    </>
  );
}
