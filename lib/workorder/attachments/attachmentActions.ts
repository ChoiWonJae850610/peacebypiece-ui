import { canDeleteWorkOrderAttachment } from "@/lib/workorder/attachments/attachmentPermissions";
import { appendAttachments, removeAttachment } from "@/lib/workorder/actions";
import { createOfficialAttachments } from "@/lib/workorder/attachments/attachmentBuilders";
import type { Attachment, HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";
import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";

export function openOfficialAttachmentPicker(
  attachmentInputRef: RefObject<HTMLInputElement | null>,
  canUploadOfficialAttachments: boolean,
) {
  if (!canUploadOfficialAttachments) return;
  attachmentInputRef.current?.click();
}

export function applyOfficialAttachmentFiles(
  event: ChangeEvent<HTMLInputElement>,
  payload: {
    canUploadOfficialAttachments: boolean;
    currentUser: UserProfile;
    selectedWorkOrder: WorkOrder;
    setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
    setSaveStatus: Dispatch<SetStateAction<"saved" | "dirty" | "saving">>;
  },
) {
  if (!payload.canUploadOfficialAttachments) {
    event.target.value = "";
    return;
  }

  const files = Array.from<File>(event.target.files ?? []);
  if (files.length === 0) return;

  const nextAttachments = createOfficialAttachments(files, payload.currentUser);
  payload.setWorkOrders((prev) => appendAttachments(prev, payload.selectedWorkOrder.id, nextAttachments));
  payload.setSaveStatus("dirty");
  event.target.value = "";
}

export function deleteWorkOrderAttachment(payload: {
  attachmentId: string;
  attachmentPreviewId: string | null;
  currentUser: UserProfile;
  selectedWorkOrder: WorkOrder;
  isReviewRequestLocked: boolean;
  setAttachmentPreviewId: Dispatch<SetStateAction<string | null>>;
  setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  setSaveStatus: Dispatch<SetStateAction<"saved" | "dirty" | "saving">>;
  setHistoryLogs?: Dispatch<SetStateAction<HistoryLog[]>>;
}) {
  const targetAttachment = payload.selectedWorkOrder.attachments.find((item) => item.id === payload.attachmentId) ?? null;
  if (!canDeleteWorkOrderAttachment(payload.currentUser, targetAttachment, payload.isReviewRequestLocked)) {
    return;
  }

  payload.setWorkOrders((prev) => removeAttachment(prev, payload.selectedWorkOrder.id, payload.attachmentId));
  if (payload.attachmentPreviewId === payload.attachmentId) {
    payload.setAttachmentPreviewId(null);
  }
  payload.setSaveStatus("dirty");
}

export function canDeleteAttachmentForCurrentUser(payload: {
  currentUser: UserProfile;
  attachment: Attachment | null;
  isReviewRequestLocked: boolean;
}) {
  return canDeleteWorkOrderAttachment(payload.currentUser, payload.attachment, payload.isReviewRequestLocked);
}
