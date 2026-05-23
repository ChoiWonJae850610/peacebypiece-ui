import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import { isDesignAttachmentScope } from "@/lib/constants/workorderIdentity";
import type { WorkOrderSidePanelProps, WorkOrderSidePanelVariant } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

type WorkOrderSidePanelAttachmentSectionsProps = Pick<
  WorkOrderSidePanelProps,
  | "attachmentSections"
  | "canSeeAttachments"
  | "canManageAttachments"
  | "onOpenAttachmentPicker"
  | "onOpenDesignDrawingModal"
  | "onUploadAttachmentFiles"
  | "onPreviewAttachment"
  | "onDeleteAttachment"
  | "onSetPrimaryDesignAttachment"
  | "canGenerateOrderRequestPdf"
  | "onGenerateOrderRequestPdf"
  | "writeLocked"
  | "writeLockMessage"
> & {
  variant: WorkOrderSidePanelVariant;
};

export default function WorkOrderSidePanelAttachmentSections({
  attachmentSections,
  canSeeAttachments,
  canManageAttachments,
  onOpenAttachmentPicker,
  onOpenDesignDrawingModal,
  onUploadAttachmentFiles,
  onPreviewAttachment,
  onDeleteAttachment,
  onSetPrimaryDesignAttachment,
  canGenerateOrderRequestPdf,
  onGenerateOrderRequestPdf,
  writeLocked = false,
  writeLockMessage,
  variant,
}: WorkOrderSidePanelAttachmentSectionsProps) {
  return attachmentSections.map((section) => (
    <WorkOrderAttachmentPanel
      key={section.key}
      title={section.title}
      emptyText={section.emptyText}
      addButtonLabel={section.addButtonLabel}
      canSeeAttachments={canSeeAttachments}
      canManageAttachments={canManageAttachments}
      attachments={section.items}
      uploadScope={section.uploadScope}
      onOpenAttachmentPicker={() => onOpenAttachmentPicker(section.uploadScope)}
      onOpenDesignDrawingModal={isDesignAttachmentScope(section.uploadScope) ? onOpenDesignDrawingModal : undefined}
      onUploadFiles={(files) => {
        if (typeof onUploadAttachmentFiles !== "function") return;
        onUploadAttachmentFiles(section.uploadScope, files);
      }}
      onPreviewAttachment={onPreviewAttachment}
      onDeleteAttachment={onDeleteAttachment}
      onSetPrimaryDesignAttachment={onSetPrimaryDesignAttachment}
      canGenerateOrderRequestPdf={canGenerateOrderRequestPdf}
      onGenerateOrderRequestPdf={onGenerateOrderRequestPdf}
      writeLocked={writeLocked}
      writeLockMessage={writeLockMessage}
      variant={variant}
    />
  ));
}
