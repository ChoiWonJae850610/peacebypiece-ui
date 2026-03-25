import type { Attachment, UserProfile } from "@/types/workorder";

export function canDeleteAttachmentByUser(user: UserProfile | null | undefined, attachment: Attachment | null | undefined) {
  if (!user || !attachment) return false;
  if (user.team === "관리자") return true;
  if (!user.permissions.viewAttachments) return false;
  return (
    attachment.uploadedByUserId === user.id ||
    attachment.uploadedBy === user.name ||
    (user.permissions.editAttachments && !attachment.uploadedBy && !attachment.uploadedByUserId)
  );
}
