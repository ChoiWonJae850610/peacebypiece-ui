import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderSidePanelMobileAccordionSection from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAccordionSection";
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
  const attachmentCount = attachmentSections.reduce((sum, section) => sum + section.items.length, 0);

  return attachmentSections.map((section, index) => (
    <WorkOrderSidePanelMobileAccordionSection
      key={section.key}
      title={section.title}
      count={section.items.length}
      defaultOpen={attachmentCount <= 2 && index === 0}
      collapseLabel={collapseLabel}
    >
      <WorkOrderAttachmentPanel
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
    </WorkOrderSidePanelMobileAccordionSection>
  ));
}
