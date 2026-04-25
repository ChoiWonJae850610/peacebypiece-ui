import WorkOrderSidePanelAttachmentSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections";
import type { WorkOrderSidePanelProps, WorkOrderSidePanelVariant } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

type WorkOrderSidePanelSectionsProps = WorkOrderSidePanelProps & {
  variant: WorkOrderSidePanelVariant;
};

export default function WorkOrderSidePanelSections({
  canSeeAttachments,
  canManageAttachments,
  attachmentSections,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  variant,
}: WorkOrderSidePanelSectionsProps) {
  return (
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
}
