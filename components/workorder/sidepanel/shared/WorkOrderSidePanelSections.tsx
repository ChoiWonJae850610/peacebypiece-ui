import WorkOrderSidePanelAttachmentSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections";
import type { WorkOrderSidePanelProps, WorkOrderSidePanelVariant } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

type WorkOrderSidePanelSectionsProps = WorkOrderSidePanelProps & {
  variant: WorkOrderSidePanelVariant;
};

export default function WorkOrderSidePanelSections({
  canSeeAttachments,
  canManageAttachments,
  writeLocked = false,
  writeLockMessage,
  attachmentSections,
  onOpenAttachmentPicker,
  onOpenDesignDrawingModal,
  onUploadAttachmentFiles,
  onPreviewAttachment,
  onDeleteAttachment,
  onSetPrimaryDesignAttachment,
  canGenerateOrderRequestPdf,
  onGenerateOrderRequestPdf,
  variant,
}: WorkOrderSidePanelSectionsProps) {
  return (
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
      canGenerateOrderRequestPdf={canGenerateOrderRequestPdf}
      onGenerateOrderRequestPdf={onGenerateOrderRequestPdf}
      writeLocked={writeLocked}
      writeLockMessage={writeLockMessage}
      variant={variant}
    />
  );
}
