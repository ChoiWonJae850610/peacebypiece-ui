import type { Attachment, UserProfile } from "@/types/workorder";

export function canDeleteAttachmentByUser(user: UserProfile | null | undefined, attachment: Attachment | null | undefined): boolean {
  if (!user || !attachment) return false;
  if (user.permissions.permissionManage) return true;
  return user.permissions.editAttachments && user.id === attachment.ownerId;
}
