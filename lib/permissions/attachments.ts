import { hasRole } from "@/lib/constants/roles";
import type { Attachment, UserProfile } from "@/types/workorder";

export function canDeleteAttachmentByUser(user: UserProfile, attachment: Attachment | null): boolean {
  if (!attachment) return false;
  if (hasRole(user, "관리자")) return true;
  return attachment.ownerId === user.id;
}
