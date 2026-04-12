import {
  applyInventoryAdjustmentToWorkOrder,
  applyWorkflowActionToWorkOrder,
  completeInspectionForWorkOrder,
  patchWorkOrder,
  promoteAttachmentToOfficial,
  updateManagerForWorkOrder,
} from "@/lib/workorder/actions";
import {
  applyOfficialAttachmentFilesToWorkOrder,
  deleteAttachmentFromWorkOrder,
} from "@/lib/workorder/attachments/attachmentMutations";
import {
  createAttachmentDeleteHistoryLog,
  createAttachmentPromoteHistoryLog,
  createAttachmentUploadHistoryLog,
  createInspectionCompleteHistoryLog,
  createInventoryHistoryLog,
  createManagerChangeHistoryLog,
  createMemoHistoryLog,
  createStatusHistoryLog,
} from "@/lib/workorder/history/builders";
import { pruneDraftRows, shouldPruneDraftRowsForWorkflowState } from "@/lib/workorder/draftRows";
import { isSameComparableText } from "@/lib/utils/compare";
import { appendMemoReplyToWorkOrder, appendMemoThreadToWorkOrder } from "@/lib/workorder/memo/memoMutations";
import type { Attachment, HistoryLog, MemoAttachmentPayload, UserProfile, WorkOrder, WorkflowAction } from "@/types/workorder";
import type { InventoryChangeInput, InspectionCompleteInput } from "@/lib/hooks/workorder/useWorkOrderActionTypes";
import { buildInventoryChanges } from "@/lib/workorder/actions";
import { DEFAULT_LOCALE, getI18n } from "@/lib/i18n";

const defaultI18n = getI18n(DEFAULT_LOCALE);
const defaultActionFlowText = defaultI18n.workorder.actionFlow;
const defaultHistoryText = defaultI18n.workorder.history;

export type ActionFlowText = typeof defaultActionFlowText;
export type ActionFlowHistoryText = typeof defaultHistoryText;

export type WorkOrderActionFlowResult = {
  nextWorkOrder: WorkOrder;
  historyLogs?: HistoryLog[];
  saveStatus?: "dirty" | "saved" | "saving";
  toastMessage?: string;
  openInventoryEditor?: boolean;
  resetAttachmentPreview?: boolean;
};


export function buildWorkflowActionResult(payload: {
  workOrder: WorkOrder;
  action: WorkflowAction;
  actorName: string;
  historyText?: ActionFlowHistoryText;
  workflowStateLabels?: Record<string, string>;
}): WorkOrderActionFlowResult {
  const targetWorkOrder = shouldPruneDraftRowsForWorkflowState(payload.action.nextState)
    ? pruneDraftRows(payload.workOrder)
    : payload.workOrder;

  return {
    nextWorkOrder: applyWorkflowActionToWorkOrder(targetWorkOrder, payload.action),
    historyLogs: [
      createStatusHistoryLog(
        payload.actorName,
        payload.workOrder.id,
        payload.workflowStateLabels?.[payload.workOrder.workflowState] ?? payload.workOrder.workflowState,
        payload.workflowStateLabels?.[payload.action.nextState] ?? payload.action.nextState,
        payload.action.label,
        payload.historyText ?? defaultHistoryText,
      ),
    ],
    saveStatus: payload.action.nextState === "review_requested" ? "dirty" : undefined,
    openInventoryEditor: payload.action.nextState === "in_inspection",
  };
}

export function buildInventoryApplyResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  input: InventoryChangeInput;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const changes = buildInventoryChanges(payload.input);
  if (changes.length === 0) return null;

  return {
    nextWorkOrder: applyInventoryAdjustmentToWorkOrder(payload.workOrder, { changes }),
    historyLogs: [
      createInventoryHistoryLog(payload.actorName, payload.workOrder.id, {
        changes,
        memo: payload.input.memo,
      }, payload.historyText ?? defaultHistoryText),
    ],
  };
}

export function buildInspectionCompleteResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  input: InspectionCompleteInput;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult {
  const trimmedMemo = payload.input.memo.trim();

  return {
    nextWorkOrder: completeInspectionForWorkOrder(payload.workOrder, {
      orderEntryId: payload.input.orderEntryId,
      nextInventoryQuantity: payload.input.nextInventoryQuantity,
    }),
    historyLogs: [
      createInspectionCompleteHistoryLog(payload.actorName, payload.workOrder.id, {
        inboundQuantity: payload.input.inboundQuantity,
        nextInventoryQuantity: payload.input.nextInventoryQuantity,
        memo: trimmedMemo,
      }, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).inspectionCompletedToast,
  };
}

export function buildPatchWorkOrderResult(payload: {
  workOrder: WorkOrder;
  patch: Partial<WorkOrder>;
}): WorkOrderActionFlowResult {
  return {
    nextWorkOrder: patchWorkOrder(payload.workOrder, payload.patch),
    saveStatus: "dirty",
  };
}

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

export function buildManagerChangeResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  managerId: string;
  managerName: string;
  text?: ActionFlowText;
  historyText?: ActionFlowHistoryText;
}): WorkOrderActionFlowResult | null {
  const previousManagerName = payload.workOrder.manager || "-";
  const previousManagerId = payload.workOrder.managerId ?? null;
  if (previousManagerId === payload.managerId || isSameComparableText(previousManagerName, payload.managerName)) return null;

  return {
    nextWorkOrder: updateManagerForWorkOrder(payload.workOrder, {
      managerId: payload.managerId,
      managerName: payload.managerName,
    }),
    historyLogs: [
      createManagerChangeHistoryLog(payload.actorName, payload.workOrder.id, previousManagerName, payload.managerName, payload.historyText ?? defaultHistoryText),
    ],
    saveStatus: "dirty",
    toastMessage: (payload.text ?? defaultActionFlowText).managerChangedToast,
  };
}
