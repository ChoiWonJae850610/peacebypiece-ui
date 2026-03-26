import type { Attachment, UserProfile } from "@/types/workorder";

export function canDeleteAttachmentByUser(user: UserProfile, attachment: Attachment | null): boolean {
  if (!attachment) return false;
  if (user.team === "관리자") return true;
  return attachment.ownerId === user.id;
}
