import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import { isDesignAttachmentScope } from "@/lib/constants/workorderIdentity";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

type WorkOrderSidePanelMobileAttachmentSectionsProps = Pick<
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
  collapseLabel: string;
};

export default function WorkOrderSidePanelMobileAttachmentSections({
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
  collapseLabel,
}: WorkOrderSidePanelMobileAttachmentSectionsProps) {
  void collapseLabel;

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
        variant="mobile"
      />
  ));
}
