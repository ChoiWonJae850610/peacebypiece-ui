import { canDeleteWorkOrderAttachment, getAttachmentPermissionState } from "@/lib/workorder/attachments/attachmentPermissions";
import type { Attachment, UserProfile } from "@/types/workorder";
import type { ChangeEvent, RefObject } from "react";

export function openAttachmentPickerTrigger(
  attachmentInputRef: RefObject<HTMLInputElement | null>,
  canUploadOfficialAttachments: boolean,
) {
  if (!canUploadOfficialAttachments) return;
  attachmentInputRef.current?.click();
}

export function readAttachmentInputFiles(event: ChangeEvent<HTMLInputElement>) {
  return Array.from<File>(event.target.files ?? []);
}

export function clearAttachmentInputValue(event: ChangeEvent<HTMLInputElement>) {
  event.target.value = "";
}

export function getAttachmentPermissionsForCurrentUser(payload: {
  currentUser: UserProfile;
  attachment: Attachment | null;
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
  isReviewRequestLocked: boolean;
}) {
  return getAttachmentPermissionState({
    currentUser: payload.currentUser,
    attachment: payload.attachment,
    canSeeAttachments: payload.canSeeAttachments,
    canManageAttachments: payload.canManageAttachments,
    isReviewRequestLocked: payload.isReviewRequestLocked,
  });
}

export function canDeleteAttachmentForCurrentUser(payload: {
  currentUser: UserProfile;
  attachment: Attachment | null;
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
  isReviewRequestLocked: boolean;
}) {
  return canDeleteWorkOrderAttachment(
    payload.currentUser,
    payload.attachment,
    payload.canSeeAttachments,
    payload.canManageAttachments,
    payload.isReviewRequestLocked,
  );
}
