import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import WorkOrderSidePanelAttachmentSections from "@/components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export default function WorkOrderSidePanelTabletView(props: WorkOrderSidePanelProps) {
  return (
    <div className="grid gap-4 grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <SidePanelSectionStack>
        <WorkOrderMemoPanel
          workOrder={props.workOrder}
          currentUserName={props.currentUserName}
          currentUserRole={props.currentRole}
          onCreateThread={props.onCreateMemoThread}
          onCreateReply={props.onCreateMemoReply}
          canEditMemo={props.canEditMemo}
          variant="tablet"
        />
      </SidePanelSectionStack>

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
    </div>
  );
}
