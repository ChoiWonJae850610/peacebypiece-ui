import { canDeleteAttachmentByUser, canPreviewAttachment } from "@/lib/permissions/attachments";
import type { Attachment, UserProfile } from "@/types/workorder";

export type AttachmentCollectionPermissionState = {
  canUpload: boolean;
};

export type AttachmentPermissionState = AttachmentCollectionPermissionState & {
  canDelete: boolean;
  canPreview: boolean;
  canDownload: boolean;
};

export function getAttachmentCollectionPermissionState(payload: {
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
  isReviewRequestLocked: boolean;
}): AttachmentCollectionPermissionState {
  return {
    canUpload: payload.canSeeAttachments && payload.canManageAttachments && !payload.isReviewRequestLocked,
  };
}

export function getAttachmentPermissionState(payload: {
  currentUser: UserProfile;
  attachment: Attachment | null;
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
  isReviewRequestLocked: boolean;
}): AttachmentPermissionState {
  const collectionPermissions = getAttachmentCollectionPermissionState({
    canSeeAttachments: payload.canSeeAttachments,
    canManageAttachments: payload.canManageAttachments,
    isReviewRequestLocked: payload.isReviewRequestLocked,
  });
  const canAccessAttachment = payload.canSeeAttachments && canPreviewAttachment(payload.attachment);

  return {
    ...collectionPermissions,
    canPreview: canAccessAttachment,
    canDownload: canAccessAttachment,
    canDelete: collectionPermissions.canUpload && canDeleteAttachmentByUser(payload.currentUser, payload.attachment),
  };
}

export function canDeleteWorkOrderAttachment(
  currentUser: UserProfile,
  attachment: Attachment | null,
  canSeeAttachments: boolean,
  canManageAttachments: boolean,
  isReviewRequestLocked: boolean,
) {
  return getAttachmentPermissionState({
    currentUser,
    attachment,
    canSeeAttachments,
    canManageAttachments,
    isReviewRequestLocked,
  }).canDelete;
}
