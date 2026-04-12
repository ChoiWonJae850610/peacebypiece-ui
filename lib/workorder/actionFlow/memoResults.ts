import type { MemoAttachmentPayload, UserProfile, WorkOrder } from "@/types/workorder";
import { appendMemoReplyToWorkOrder, appendMemoThreadToWorkOrder } from "@/lib/workorder/memo/memoMutations";
import { createMemoHistoryLog } from "@/lib/workorder/history/builders";
import { defaultActionFlowText, defaultHistoryText, type ActionFlowHistoryText, type ActionFlowText, type WorkOrderActionFlowResult } from "@/lib/workorder/actionFlow/shared";

export function buildMemoThreadResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  content: string;
  attachmentPayload?: MemoAttachmentPayload;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): (WorkOrderActionFlowResult & { trimmed: string }) | null {
  const result = appendMemoThreadToWorkOrder(payload);
  if (!result) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [
      createMemoHistoryLog(payload.currentUser.name, payload.workOrder.id, {
        action: "thread",
        content: result.trimmed,
        attachmentNames: result.attachmentNames,
      }, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage:
      result.attachmentNames.length > 0
        ? (payload.text ?? defaultActionFlowText).memoThreadCreatedWithAttachmentToast
        : (payload.text ?? defaultActionFlowText).memoThreadCreatedToast,
    trimmed: result.trimmed,
  };
}

export function buildMemoReplyResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  threadId: string;
  content: string;
  attachmentPayload?: MemoAttachmentPayload;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): (WorkOrderActionFlowResult & { trimmed: string }) | null {
  const result = appendMemoReplyToWorkOrder(payload);
  if (!result) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [
      createMemoHistoryLog(payload.currentUser.name, payload.workOrder.id, {
        action: "reply",
        content: result.trimmed,
        attachmentNames: result.attachmentNames,
      }, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage:
      result.attachmentNames.length > 0
        ? (payload.text ?? defaultActionFlowText).memoReplyCreatedWithAttachmentToast
        : (payload.text ?? defaultActionFlowText).memoReplyCreatedToast,
    trimmed: result.trimmed,
  };
}
