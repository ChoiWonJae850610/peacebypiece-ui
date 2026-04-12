import type { Attachment } from "@/types/workorder";

export function getPendingAttachmentDelete(attachments: Attachment[], pendingAttachmentDeleteId: string | null) {
  if (!pendingAttachmentDeleteId) {
    return null;
  }

  return attachments.find((item) => item.id === pendingAttachmentDeleteId) ?? null;
}
