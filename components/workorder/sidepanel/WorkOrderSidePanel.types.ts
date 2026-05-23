import type { UploadableAttachmentScopeValue } from "@/lib/constants/workorderIdentity";
import type { AttachmentPanelSection } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";
import type { RoleType, UserProfile, WorkOrder } from "@/types/workorder";

export type WorkOrderSidePanelProps = {
  isEmpty?: boolean;
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
  canEditMemo: boolean;
  writeLocked?: boolean;
  writeLockMessage?: string;
  attachmentSections: AttachmentPanelSection[];
  onOpenAttachmentPicker: (scope?: UploadableAttachmentScopeValue) => void;
  onOpenDesignDrawingModal?: () => void;
  onUploadAttachmentFiles: (scope: UploadableAttachmentScopeValue, files: File[]) => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onSetPrimaryDesignAttachment: (attachmentId: string) => void;
  canGenerateOrderRequestPdf: boolean;
  onGenerateOrderRequestPdf: () => void;
  currentRole: RoleType;
  users: UserProfile[];
  workOrder: WorkOrder;
  currentUserName: string;
  currentUserId: string;
  onCreateMemoThread: (content: string) => void;
  onCreateMemoReply: (threadId: string, content: string) => void;
  onUpdateMemoThread: (threadId: string, content: string) => void;
  onDeleteMemoThread: (threadId: string) => void;
  onUpdateMemoReply: (threadId: string, replyId: string, content: string) => void;
  onDeleteMemoReply: (threadId: string, replyId: string) => void;
};

export type WorkOrderSidePanelVariant = "desktop" | "tablet" | "mobile";
