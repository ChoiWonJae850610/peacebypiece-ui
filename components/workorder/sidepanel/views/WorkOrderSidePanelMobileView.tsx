import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import WorkOrderSidePanelMobileAttachmentSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelMobileAttachmentSections";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";
import { useI18n } from "@/lib/i18n";

export default function WorkOrderSidePanelMobileView(props: WorkOrderSidePanelProps) {
  const { i18n } = useI18n();
  const collapseLabel = i18n.common.ui.common.collapse;

  return (
    <div className="rounded-[24px] border border-stone-200 bg-stone-50/60 p-2.5">
      <SidePanelSectionStack compact>
        <WorkOrderSidePanelMobileAttachmentSections
          attachmentSections={props.attachmentSections}
          canSeeAttachments={props.canSeeAttachments}
          canManageAttachments={props.canManageAttachments}
          onOpenAttachmentPicker={props.onOpenAttachmentPicker}
          onPreviewAttachment={props.onPreviewAttachment}
          onDeleteAttachment={props.onDeleteAttachment}
          collapseLabel={collapseLabel}
        />
      </SidePanelSectionStack>
    </div>
  );
}
