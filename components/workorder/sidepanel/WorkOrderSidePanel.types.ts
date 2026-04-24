import type { AttachmentPanelSection } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";
import type { RoleType, WorkOrder } from "@/types/workorder";

export type WorkOrderSidePanelProps = {
  isEmpty?: boolean;
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
  canEditMemo: boolean;
  attachmentSections: AttachmentPanelSection[];
  onOpenAttachmentPicker: (scope?: "design" | "official") => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  currentRole: RoleType;
  workOrder: WorkOrder;
  currentUserName: string;
  onCreateMemoThread: (content: string) => void;
  onCreateMemoReply: (threadId: string, content: string) => void;
};

export type WorkOrderSidePanelVariant = "desktop" | "tablet" | "mobile";
