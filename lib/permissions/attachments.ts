import { getPermissionSummary } from "@/lib/constants/roles";
import type { Attachment, UserProfile } from "@/types/workorder";

export function canDeleteAttachmentByUser(
  currentUser: UserProfile,
  attachment: Attachment | null,
) {
  if (!attachment) return false;
  if (getPermissionSummary(currentUser) === "관리자") return true;
  return (attachment.ownerId ?? "") === currentUser.id;
}
