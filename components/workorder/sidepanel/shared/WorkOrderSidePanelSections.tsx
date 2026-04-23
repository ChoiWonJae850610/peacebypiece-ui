import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
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
  const attachmentPanels = attachmentSections.map((section) => (
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
      variant={variant}
    />
  ));

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
