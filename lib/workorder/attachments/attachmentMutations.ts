import { appendAttachments, removeAttachment } from "@/lib/workorder/actions";
import { createOfficialAttachments } from "@/lib/workorder/attachments/attachmentBuilders";
import type { Attachment, UserProfile, WorkOrder } from "@/types/workorder";

export function applyOfficialAttachmentFilesToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  files: File[];
}) {
  if (payload.files.length === 0) return null;

  const attachments = createOfficialAttachments(payload.files, payload.currentUser);
  const nextWorkOrder = appendAttachments([payload.workOrder], payload.workOrder.id, attachments)[0] ?? payload.workOrder;

  return { nextWorkOrder, attachments };
}

export function deleteAttachmentFromWorkOrder(payload: {
  workOrder: WorkOrder;
  attachmentId: string;
  attachmentPreviewId: string | null;
}) {
  const removedAttachment = payload.workOrder.attachments.find((item) => item.id === payload.attachmentId);
  if (!removedAttachment) return null;

  const nextWorkOrder = removeAttachment([payload.workOrder], payload.workOrder.id, payload.attachmentId)[0] ?? payload.workOrder;

  return {
    nextWorkOrder,
    removedAttachment,
    resetAttachmentPreview: payload.attachmentPreviewId === payload.attachmentId,
  };
}
