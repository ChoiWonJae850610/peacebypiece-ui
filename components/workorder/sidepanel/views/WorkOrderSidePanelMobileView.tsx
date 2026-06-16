import WorkOrderSidePanelMobileAttachmentSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";
import { useI18n } from "@/lib/i18n";

export default function WorkOrderSidePanelMobileView(props: WorkOrderSidePanelProps) {
  const { i18n } = useI18n();
  const collapseLabel = i18n.common.ui.common.collapse;

  return (
    <div className="min-w-0 overflow-x-hidden">
      <div className="flex min-h-0 flex-col gap-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        <WorkOrderSidePanelMobileAttachmentSections
          attachmentSections={props.attachmentSections}
          canSeeAttachments={props.canSeeAttachments}
          canManageAttachments={props.canManageAttachments}
          onOpenAttachmentPicker={props.onOpenAttachmentPicker}
          onOpenDesignDrawingModal={props.onOpenDesignDrawingModal}
          onUploadAttachmentFiles={props.onUploadAttachmentFiles}
          onPreviewAttachment={props.onPreviewAttachment}
          onDeleteAttachment={props.onDeleteAttachment}
          onSetPrimaryDesignAttachment={props.onSetPrimaryDesignAttachment}
          canGenerateOrderRequestPdf={props.canGenerateOrderRequestPdf}
          onGenerateOrderRequestPdf={props.onGenerateOrderRequestPdf}
          writeLocked={props.writeLocked}
          writeLockMessage={props.writeLockMessage}
          collapseLabel={collapseLabel}
        />
      </div>
    </div>
  );
}
