import type { Attachment, UserProfile } from "@/types/workorder";

export function canDeleteAttachmentByUser(user: UserProfile, attachment: Attachment | null) {
  if (!attachment) return false;
  if (user.permissions.permissionManage) return true;
  if (!user.permissions.editAttachments) return false;
  return attachment.ownerId === user.id;
}
