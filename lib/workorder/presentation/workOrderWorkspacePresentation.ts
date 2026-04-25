import { getAttachmentOwnerLabel, getAttachmentPreviewLabel } from "@/lib/permissions/attachments";
import type { AttachmentPermissionState } from "@/lib/workorder/attachments/attachmentPermissions";
import type { Attachment } from "@/types/workorder";

export type AttachmentPanelItem = Pick<Attachment, "id" | "name" | "type" | "url"> & {
  ownerLabel: string;
  previewLabel: string;
  canDelete: boolean;
  canPreview: boolean;
};

export type AttachmentPanelSection = {
  key: "design" | "attachment";
  title: string;
  emptyText: string;
  addButtonLabel: string;
  uploadScope: "design" | "attachment";
  items: AttachmentPanelItem[];
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

export function buildAttachmentPanelSections(payload: {
  designTitle: string;
  designEmptyText: string;
  designAddButtonLabel: string;
  officialTitle: string;
  officialEmptyText: string;
  officialAddButtonLabel: string;
  designAttachments: Attachment[];
  officialAttachments: Attachment[];
  getAttachmentPermissions: (attachment: Attachment | null) => AttachmentPermissionState;
}): AttachmentPanelSection[] {
  return [
    {
      key: "design",
      title: payload.designTitle,
      emptyText: payload.designEmptyText,
      addButtonLabel: payload.designAddButtonLabel,
      uploadScope: "design",
      items: buildAttachmentPanelItems(payload.designAttachments, payload.getAttachmentPermissions),
    },
    {
      key: "attachment",
      title: payload.officialTitle,
      emptyText: payload.officialEmptyText,
      addButtonLabel: payload.officialAddButtonLabel,
      uploadScope: "attachment",
      items: buildAttachmentPanelItems(payload.officialAttachments, payload.getAttachmentPermissions),
    },
  ];
}
