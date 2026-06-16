import type { UploadableAttachmentScopeValue } from "@/lib/constants/workorderIdentity";
import type { AttachmentPanelSection } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";

export type WorkOrderSidePanelProps = {
  isEmpty?: boolean;
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
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
};

export type WorkOrderSidePanelVariant = "desktop" | "tablet" | "mobile";
