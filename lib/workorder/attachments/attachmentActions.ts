import { canDeleteWorkOrderAttachment } from "@/lib/workorder/attachments/attachmentPermissions";
import type { Attachment, UserProfile } from "@/types/workorder";
import type { ChangeEvent, RefObject } from "react";

export function openOfficialAttachmentPicker(
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

export function canDeleteAttachmentForCurrentUser(payload: {
  currentUser: UserProfile;
  attachment: Attachment | null;
  isReviewRequestLocked: boolean;
}) {
  return canDeleteWorkOrderAttachment(payload.currentUser, payload.attachment, payload.isReviewRequestLocked);
}
