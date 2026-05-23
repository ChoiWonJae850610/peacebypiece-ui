import { ATTACHMENT_SCOPE, isDesignAttachmentScope, type UploadableAttachmentScopeValue } from "@/lib/constants/workorderIdentity";
import { getAttachmentOwnerLabel, getAttachmentPreviewLabel, getAttachmentPreviewUrl, getAttachmentThumbnailUrl } from "@/lib/permissions/attachments";
import type { AttachmentPermissionState } from "@/lib/workorder/attachments/attachmentPermissions";
import type { Attachment } from "@/types/workorder";

export type AttachmentPanelItem = Pick<Attachment, "id" | "name" | "type" | "url" | "scope" | "isPrimary" | "sourceType" | "generatedDocumentType"> & {
  thumbnailUrl: string;
  previewUrl: string;
  ownerLabel: string;
  previewLabel: string;
  canDelete: boolean;
  canPreview: boolean;
  canSetPrimary: boolean;
};

export type AttachmentPanelSection = {
  key: UploadableAttachmentScopeValue;
  title: string;
  emptyText: string;
  addButtonLabel: string;
  uploadScope: UploadableAttachmentScopeValue;
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
      thumbnailUrl: getAttachmentThumbnailUrl(attachment),
      previewUrl: getAttachmentPreviewUrl(attachment),
      scope: attachment.scope,
      isPrimary: attachment.isPrimary === true,
      sourceType: attachment.sourceType ?? null,
      generatedDocumentType: attachment.generatedDocumentType ?? null,
      ownerLabel: getAttachmentOwnerLabel(attachment),
      previewLabel: getAttachmentPreviewLabel(attachment),
      canDelete: permissions.canDelete,
      canPreview: permissions.canPreview,
      canSetPrimary: isDesignAttachmentScope(attachment.scope) && attachment.type === "image" && permissions.canDelete,
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
      key: ATTACHMENT_SCOPE.design,
      title: payload.designTitle,
      emptyText: payload.designEmptyText,
      addButtonLabel: payload.designAddButtonLabel,
      uploadScope: ATTACHMENT_SCOPE.design,
      items: buildAttachmentPanelItems(payload.designAttachments, payload.getAttachmentPermissions),
    },
    {
      key: ATTACHMENT_SCOPE.attachment,
      title: payload.officialTitle,
      emptyText: payload.officialEmptyText,
      addButtonLabel: payload.officialAddButtonLabel,
      uploadScope: ATTACHMENT_SCOPE.attachment,
      items: buildAttachmentPanelItems(payload.officialAttachments, payload.getAttachmentPermissions),
    },
  ];
}
