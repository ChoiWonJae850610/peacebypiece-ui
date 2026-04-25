import type { AttachmentPanelSection } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";
import type { AttachmentScope, RoleType, WorkOrder } from "@/types/workorder";

export type WorkOrderSidePanelProps = {
  isEmpty?: boolean;
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
  attachmentSections: AttachmentPanelSection[];
  onOpenAttachmentPicker: (scope?: AttachmentScope) => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  currentRole: RoleType;
  workOrder: WorkOrder;
  currentUserName: string;
  currentUserId: string;
};

export type WorkOrderSidePanelVariant = "desktop" | "tablet" | "mobile";
