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
      variant={variant}
    />
  );

  const memoPanel = (
    <WorkOrderMemoPanel
      workOrder={workOrder}
      currentUserName={currentUserName}
      currentUserRole={currentRole}
      onCreateThread={onCreateMemoThread}
      onCreateReply={onCreateMemoReply}
      canPromoteMemoAttachment={canPromoteMemoAttachment}
      onPromoteMemoAttachment={onPromoteMemoAttachment}
      onPreviewAttachment={onPreviewAttachment}
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
