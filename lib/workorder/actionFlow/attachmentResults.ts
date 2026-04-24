import type { Attachment, UserProfile, WorkOrder } from "@/types/workorder";
import {
  applyDesignAttachmentFilesToWorkOrder,
  applyOfficialAttachmentFilesToWorkOrder,
  deleteAttachmentFromWorkOrder,
} from "@/lib/workorder/attachments/attachmentMutations";
import {
  createAttachmentDeleteHistoryLog,
  createAttachmentUploadHistoryLog,
} from "@/lib/workorder/history/builders";
import { defaultActionFlowText, defaultHistoryText, type ActionFlowHistoryText, type ActionFlowText, type WorkOrderActionFlowResult } from "@/lib/workorder/actionFlow/shared";
import { appendAttachments } from "@/lib/workorder/actions";

export function buildAttachmentUploadResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  files: File[];
  scope: "design" | "official";
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const result = payload.scope === "design"
    ? applyDesignAttachmentFilesToWorkOrder({
        workOrder: payload.workOrder,
        currentUser: payload.currentUser,
        files: payload.files,
      })
    : applyOfficialAttachmentFilesToWorkOrder({
        workOrder: payload.workOrder,
        currentUser: payload.currentUser,
        files: payload.files,
      });

  if (!result || result.attachments.length === 0) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [createAttachmentUploadHistoryLog(payload.currentUser.name, payload.workOrder.id, result.attachments, payload.scope, payload.historyText ?? defaultHistoryText)],
    saveStatus: "dirty",
    toastMessage: payload.scope === "design"
      ? ((payload.text ?? defaultActionFlowText) as ActionFlowText & { designAttachmentUploadedToast?: string }).designAttachmentUploadedToast ?? (payload.text ?? defaultActionFlowText).officialAttachmentUploadedToast
      : (payload.text ?? defaultActionFlowText).officialAttachmentUploadedToast,
  };
}

export function buildPersistedAttachmentUploadResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  attachments: Attachment[];
  scope: "design" | "official";
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  if (payload.attachments.length === 0) return null;

  const nextWorkOrder = appendAttachments([payload.workOrder], payload.workOrder.id, payload.attachments)[0] ?? payload.workOrder;

  return {
    nextWorkOrder,
    historyLogs: [createAttachmentUploadHistoryLog(payload.currentUser.name, payload.workOrder.id, payload.attachments, payload.scope, payload.historyText ?? defaultHistoryText)],
    saveStatus: "dirty",
    toastMessage: payload.scope === "design"
      ? ((payload.text ?? defaultActionFlowText) as ActionFlowText & { designAttachmentUploadedToast?: string }).designAttachmentUploadedToast ?? (payload.text ?? defaultActionFlowText).officialAttachmentUploadedToast
      : (payload.text ?? defaultActionFlowText).officialAttachmentUploadedToast,
  };
}

export function buildOfficialAttachmentUploadResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  files: File[];
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  return buildAttachmentUploadResult({ ...payload, scope: "official" });
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
