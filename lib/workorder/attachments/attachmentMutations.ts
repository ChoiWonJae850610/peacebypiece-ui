import { appendAttachments, removeAttachment } from "@/lib/workorder/actions";
import { createDesignAttachments, createOfficialAttachments } from "@/lib/workorder/attachments/attachmentBuilders";
import type { Attachment, UserProfile, WorkOrder } from "@/types/workorder";

function applyScopedAttachmentFilesToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  files: File[];
  scope: "design" | "official";
}) {
  if (payload.files.length === 0) return null;

  const attachments = payload.scope == "design"
    ? createDesignAttachments(payload.files, payload.currentUser)
    : createOfficialAttachments(payload.files, payload.currentUser);
  const nextWorkOrder = appendAttachments([payload.workOrder], payload.workOrder.id, attachments)[0] ?? payload.workOrder;

  return { nextWorkOrder, attachments };
}

export function applyDesignAttachmentFilesToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  files: File[];
}) {
  return applyScopedAttachmentFilesToWorkOrder({ ...payload, scope: "design" });
}

export function applyOfficialAttachmentFilesToWorkOrder(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  files: File[];
}) {
  return applyScopedAttachmentFilesToWorkOrder({ ...payload, scope: "official" });
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
