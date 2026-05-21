import { MEMO_HISTORY_ACTION } from "@/lib/constants/workorderHistory";
import type { UserProfile, WorkOrder } from "@/types/workorder";
import { appendMemoReplyToWorkOrder, appendMemoThreadToWorkOrder } from "@/lib/workorder/memo/memoMutations";
import { createMemoHistoryLog } from "@/lib/workorder/history/builders";
import { defaultActionFlowText, defaultHistoryText, type ActionFlowHistoryText, type ActionFlowText, type WorkOrderActionFlowResult } from "@/lib/workorder/actionFlow/shared";

export function buildMemoThreadResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  content: string;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): (WorkOrderActionFlowResult & { trimmed: string }) | null {
  const result = appendMemoThreadToWorkOrder(payload);
  if (!result) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [
      createMemoHistoryLog(payload.currentUser.name, payload.workOrder.id, {
        action: MEMO_HISTORY_ACTION.thread,
        content: result.trimmed,
      }, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).memoThreadCreatedToast,
    trimmed: result.trimmed,
  };
}

export function buildMemoReplyResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  threadId: string;
  content: string;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): (WorkOrderActionFlowResult & { trimmed: string }) | null {
  const result = appendMemoReplyToWorkOrder(payload);
  if (!result) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [
      createMemoHistoryLog(payload.currentUser.name, payload.workOrder.id, {
        action: MEMO_HISTORY_ACTION.reply,
        content: result.trimmed,
      }, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).memoReplyCreatedToast,
    trimmed: result.trimmed,
  };
}
