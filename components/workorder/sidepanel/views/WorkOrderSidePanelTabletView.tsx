import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import WorkOrderSidePanelAttachmentSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export default function WorkOrderSidePanelTabletView(props: WorkOrderSidePanelProps) {
  return (
    <SidePanelSectionStack>
      <WorkOrderSidePanelAttachmentSections
        attachmentSections={props.attachmentSections}
        canSeeAttachments={props.canSeeAttachments}
        canManageAttachments={props.canManageAttachments}
        onOpenAttachmentPicker={props.onOpenAttachmentPicker}
        onPreviewAttachment={props.onPreviewAttachment}
        onDeleteAttachment={props.onDeleteAttachment}
        variant="tablet"
      />
    </SidePanelSectionStack>
  );
}
