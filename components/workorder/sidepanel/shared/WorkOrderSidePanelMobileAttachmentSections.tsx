import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderSidePanelMobileAccordionSection from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAccordionSection";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

type WorkOrderSidePanelMobileAttachmentSectionsProps = Pick<
  WorkOrderSidePanelProps,
  | "attachmentSections"
  | "canSeeAttachments"
  | "canManageAttachments"
  | "onOpenAttachmentPicker"
  | "onPreviewAttachment"
  | "onDeleteAttachment"
  | "onSetPrimaryDesignAttachment"
> & {
  collapseLabel: string;
};

export default function WorkOrderSidePanelMobileAttachmentSections({
  attachmentSections,
  canSeeAttachments,
  canManageAttachments,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  onSetPrimaryDesignAttachment,
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
        onOpenAttachmentPicker={() => onOpenAttachmentPicker(section.uploadScope)}
        onPreviewAttachment={onPreviewAttachment}
        onDeleteAttachment={onDeleteAttachment}
        onSetPrimaryDesignAttachment={onSetPrimaryDesignAttachment}
        variant="mobile"
      />
    </WorkOrderSidePanelMobileAccordionSection>
  ));
}
