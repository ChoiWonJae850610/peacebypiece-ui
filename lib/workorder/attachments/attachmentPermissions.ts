import { canDeleteAttachmentByUser, isOfficialAttachment } from "@/lib/permissions/attachments";
import type { Attachment, UserProfile } from "@/types/workorder";

export function canDeleteWorkOrderAttachment(
  currentUser: UserProfile,
  attachment: Attachment | null,
  isReviewRequestLocked: boolean,
) {
  if (isReviewRequestLocked && isOfficialAttachment(attachment)) return false;
  return canDeleteAttachmentByUser(currentUser, attachment);
}
