import { getAttachmentOwnerLabel, getAttachmentPreviewLabel } from "@/lib/permissions/attachments";
import type { Attachment } from "@/types/workorder";
import type { AttachmentPermissionState } from "@/lib/workorder/attachments/attachmentPermissions";

export type AttachmentPanelItem = Pick<Attachment, "id" | "name" | "type" | "url"> & {
  ownerLabel: string;
  previewLabel: string;
  canDelete: boolean;
  canPreview: boolean;
};

export function getPendingAttachmentDelete(attachments: Attachment[], pendingAttachmentDeleteId: string | null) {
  if (!pendingAttachmentDeleteId) {
    return null;
  }

  return attachments.find((item) => item.id === pendingAttachmentDeleteId) ?? null;
}

export function buildAttachmentPanelItems(
  attachments: Attachment[],
  getAttachmentPermissions: (attachment: Attachment | null) => AttachmentPermissionState,
): AttachmentPanelItem[] {
  return attachments.map((attachment) => {
    const permissions = getAttachmentPermissions(attachment);

    return {
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      ownerLabel: getAttachmentOwnerLabel(attachment),
      previewLabel: getAttachmentPreviewLabel(attachment),
      canDelete: permissions.canDelete,
      canPreview: permissions.canPreview,
    };
  });
}
