import type { UserProfile, WorkOrder } from "@/types/workorder";
import { promoteAttachmentToOfficial } from "@/lib/workorder/actions";
import {
  applyOfficialAttachmentFilesToWorkOrder,
  deleteAttachmentFromWorkOrder,
} from "@/lib/workorder/attachments/attachmentMutations";
import {
  createAttachmentDeleteHistoryLog,
  createAttachmentPromoteHistoryLog,
  createAttachmentUploadHistoryLog,
} from "@/lib/workorder/history/builders";
import { defaultActionFlowText, defaultHistoryText, type ActionFlowHistoryText, type ActionFlowText, type WorkOrderActionFlowResult } from "@/lib/workorder/actionFlow/shared";

export function buildOfficialAttachmentUploadResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  files: File[];
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const result = applyOfficialAttachmentFilesToWorkOrder({
    workOrder: payload.workOrder,
    currentUser: payload.currentUser,
    files: payload.files,
  });

  if (!result || result.attachments.length === 0) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [createAttachmentUploadHistoryLog(payload.currentUser.name, payload.workOrder.id, result.attachments, payload.historyText ?? defaultHistoryText)],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).officialAttachmentUploadedToast,
  };
}

export function buildAttachmentDeleteResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  attachmentId: string;
  attachmentPreviewId: string | null;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const result = deleteAttachmentFromWorkOrder({
    workOrder: payload.workOrder,
    attachmentId: payload.attachmentId,
    attachmentPreviewId: payload.attachmentPreviewId,
  });
  if (!result) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [createAttachmentDeleteHistoryLog(payload.currentUser.name, payload.workOrder.id, result.removedAttachment, payload.historyText ?? defaultHistoryText)],
    saveStatus: "dirty",
    resetAttachmentPreview: result.resetAttachmentPreview,
  };
}

export function buildPromoteMemoAttachmentResult(payload: {
  workOrder: WorkOrder;
  attachmentId: string;
  currentUser: UserProfile;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const targetAttachment = payload.workOrder.attachments.find((item) => item.id === payload.attachmentId);
  if (!targetAttachment || (targetAttachment.scope ?? "official") === "official") return null;

  const nextWorkOrder = promoteAttachmentToOfficial([payload.workOrder], payload.workOrder.id, payload.attachmentId, {
    ownerId: payload.currentUser.id,
    ownerName: payload.currentUser.name,
  })[0] ?? payload.workOrder;

  return {
    nextWorkOrder,
    historyLogs: [createAttachmentPromoteHistoryLog(payload.currentUser.name, payload.workOrder.id, targetAttachment, payload.historyText ?? defaultHistoryText)],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).memoAttachmentPromotedToast,
  };
}
