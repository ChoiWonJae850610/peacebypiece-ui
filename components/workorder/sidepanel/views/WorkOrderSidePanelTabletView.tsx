import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import WorkOrderMemoPanel from "@/components/workorder/sidepanel/WorkOrderMemoPanel";
import SidePanelSectionStack from "@/components/workorder/sidepanel/layout/SidePanelSectionStack";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";

export default function WorkOrderSidePanelTabletView({
  canSeeAttachments,
  canManageAttachments,
  attachmentSections,
  onOpenAttachmentPicker,
  onPreviewAttachment,
  onDeleteAttachment,
  currentRole,
  workOrder,
  currentUserName,
  onCreateMemoThread,
  onCreateMemoReply,
  canPromoteMemoAttachment,
  onPromoteMemoAttachment,
}: WorkOrderSidePanelProps) {
  return (
    <SidePanelSectionStack>
      {attachmentSections.map((section) => (
        <WorkOrderAttachmentPanel
          key={section.key}
          title={section.title}
          emptyText={section.emptyText}
          addButtonLabel={section.addButtonLabel}
          canSeeAttachments={canSeeAttachments}
          canManageAttachments={canManageAttachments}
          attachments={section.items}
          onOpenAttachmentPicker={() => onOpenAttachmentPicker(section.uploadScope)}
          onPreviewAttachment={onPreviewAttachment}
          onDeleteAttachment={onDeleteAttachment}
        />
      ))}

      <WorkOrderMemoPanel
        workOrder={workOrder}
        currentUserName={currentUserName}
        currentUserRole={currentRole}
        onCreateThread={onCreateMemoThread}
        onCreateReply={onCreateMemoReply}
        canPromoteMemoAttachment={canPromoteMemoAttachment}
        onPromoteMemoAttachment={onPromoteMemoAttachment}
        onPreviewAttachment={onPreviewAttachment}
      />
    </SidePanelSectionStack>
  );
}
