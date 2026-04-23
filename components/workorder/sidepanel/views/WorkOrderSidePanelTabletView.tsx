import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export default function WorkOrderSidePanelTabletView(props: WorkOrderSidePanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <SidePanelSectionStack>
        <WorkOrderMemoPanel
          workOrder={props.workOrder}
          currentUserName={props.currentUserName}
          currentUserRole={props.currentRole}
          onCreateThread={props.onCreateMemoThread}
          onCreateReply={props.onCreateMemoReply}
          canPromoteMemoAttachment={props.canPromoteMemoAttachment}
          onPromoteMemoAttachment={props.onPromoteMemoAttachment}
          onPreviewAttachment={props.onPreviewAttachment}
          variant="tablet"
        />
      </SidePanelSectionStack>

      <SidePanelSectionStack>
        {props.attachmentSections.map((section) => (
          <WorkOrderAttachmentPanel
            key={section.key}
            title={section.title}
            emptyText={section.emptyText}
            addButtonLabel={section.addButtonLabel}
            canSeeAttachments={props.canSeeAttachments}
            canManageAttachments={props.canManageAttachments}
            attachments={section.items}
            onOpenAttachmentPicker={() => props.onOpenAttachmentPicker(section.uploadScope)}
            onPreviewAttachment={props.onPreviewAttachment}
            onDeleteAttachment={props.onDeleteAttachment}
            variant="tablet"
          />
        ))}
      </SidePanelSectionStack>
    </div>
  );
}
