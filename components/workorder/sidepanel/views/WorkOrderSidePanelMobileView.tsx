import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import WorkOrderSidePanelMobileAccordionSection from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAccordionSection";
import WorkOrderSidePanelMobileAttachmentSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";
import { useI18n } from "@/lib/i18n";

export default function WorkOrderSidePanelMobileView(props: WorkOrderSidePanelProps) {
  const { i18n } = useI18n();
  const memoTitle = i18n.workorder.ui.memo.panelTitle;
  const collapseLabel = i18n.common.ui.common.collapse;

  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50/60 p-2.5">
      <SidePanelSectionStack compact>
        <WorkOrderSidePanelMobileAccordionSection title={memoTitle} defaultOpen collapseLabel={collapseLabel}>
          <WorkOrderMemoPanel
            workOrder={props.workOrder}
            currentUserId={props.currentUserId}
            currentUserName={props.currentUserName}
            currentUserRole={props.currentRole}
            onCreateThread={props.onCreateMemoThread}
            onCreateReply={props.onCreateMemoReply}
            onUpdateThread={props.onUpdateMemoThread}
            onDeleteThread={props.onDeleteMemoThread}
            onUpdateReply={props.onUpdateMemoReply}
            onDeleteReply={props.onDeleteMemoReply}
            canEditMemo={props.canEditMemo}
            writeLocked={props.writeLocked}
            writeLockMessage={props.writeLockMessage}
            variant="mobile"
          />
        </WorkOrderSidePanelMobileAccordionSection>

        <WorkOrderSidePanelMobileAttachmentSections
          attachmentSections={props.attachmentSections}
          canSeeAttachments={props.canSeeAttachments}
          canManageAttachments={props.canManageAttachments}
          onOpenAttachmentPicker={props.onOpenAttachmentPicker}
          onUploadAttachmentFiles={props.onUploadAttachmentFiles}
          onPreviewAttachment={props.onPreviewAttachment}
          onDeleteAttachment={props.onDeleteAttachment}
          onSetPrimaryDesignAttachment={props.onSetPrimaryDesignAttachment}
          writeLocked={props.writeLocked}
          writeLockMessage={props.writeLockMessage}
          collapseLabel={collapseLabel}
        />
      </SidePanelSectionStack>
    </div>
  );
}
