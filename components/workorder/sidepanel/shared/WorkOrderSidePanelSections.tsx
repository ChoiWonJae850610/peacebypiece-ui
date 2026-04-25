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
  attachmentSections,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  onSetPrimaryDesignAttachment,
  currentRole,
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
      onPreviewAttachment={onPreviewAttachment}
      onDeleteAttachment={onDeleteAttachment}
      onSetPrimaryDesignAttachment={onSetPrimaryDesignAttachment}
      variant={variant}
    />
  );

  const memoPanel = (
    <WorkOrderMemoPanel
      workOrder={workOrder}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserRole={currentRole}
      onCreateThread={onCreateMemoThread}
      onCreateReply={onCreateMemoReply}
      onUpdateThread={onUpdateMemoThread}
      onDeleteThread={onDeleteMemoThread}
      onUpdateReply={onUpdateMemoReply}
      onDeleteReply={onDeleteMemoReply}
      canEditMemo={canEditMemo}
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
