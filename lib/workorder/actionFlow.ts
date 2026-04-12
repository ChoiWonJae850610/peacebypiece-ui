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
        payload.workOrder.workflowState,
        payload.action.nextState,
        payload.action.label,
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
}): WorkOrderActionFlowResult | null {
  const changes = buildInventoryChanges(payload.input);
  if (changes.length === 0) return null;

  return {
    nextWorkOrder: applyInventoryAdjustmentToWorkOrder(payload.workOrder, { changes }),
    historyLogs: [
      createInventoryHistoryLog(payload.actorName, payload.workOrder.id, {
        changes,
        memo: payload.input.memo,
      }),
    ],
  };
}

export function buildInspectionCompleteResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  input: InspectionCompleteInput;
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
      }),
    ],
    saveStatus: "dirty",
    toastMessage: "검수 완료가 반영되었습니다.",
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
}): WorkOrderActionFlowResult | null {
  const result = applyOfficialAttachmentFilesToWorkOrder({
    workOrder: payload.workOrder,
    currentUser: payload.currentUser,
    files: payload.files,
  });

  if (!result || result.attachments.length === 0) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [createAttachmentUploadHistoryLog(payload.currentUser.name, payload.workOrder.id, result.attachments)],
    saveStatus: "dirty",
    toastMessage: result.attachments.length > 1 ? "공식 첨부가 등록되었습니다." : "공식 첨부가 등록되었습니다.",
  };
}

export function buildAttachmentDeleteResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  attachmentId: string;
  attachmentPreviewId: string | null;
}): WorkOrderActionFlowResult | null {
  const result = deleteAttachmentFromWorkOrder({
    workOrder: payload.workOrder,
    attachmentId: payload.attachmentId,
    attachmentPreviewId: payload.attachmentPreviewId,
  });
  if (!result) return null;

  return {
    nextWorkOrder: result.nextWorkOrder,
    historyLogs: [createAttachmentDeleteHistoryLog(payload.currentUser.name, payload.workOrder.id, result.removedAttachment)],
    saveStatus: "dirty",
    resetAttachmentPreview: result.resetAttachmentPreview,
  };
}

export function buildMemoThreadResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  content: string;
  attachmentPayload?: MemoAttachmentPayload;
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
      }),
    ],
    saveStatus: "dirty",
    toastMessage:
      result.attachmentNames.length > 0 ? "첨부가 포함된 작업 메모가 등록되었습니다." : "작업 메모가 등록되었습니다.",
    trimmed: result.trimmed,
  };
}

export function buildMemoReplyResult(payload: {
  workOrder: WorkOrder;
  currentUser: UserProfile;
  threadId: string;
  content: string;
  attachmentPayload?: MemoAttachmentPayload;
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
      }),
    ],
    saveStatus: "dirty",
    toastMessage:
      result.attachmentNames.length > 0 ? "첨부가 포함된 메모 댓글이 등록되었습니다." : "메모 댓글이 등록되었습니다.",
    trimmed: result.trimmed,
  };
}

export function buildPromoteMemoAttachmentResult(payload: {
  workOrder: WorkOrder;
  attachmentId: string;
  currentUser: UserProfile;
}): WorkOrderActionFlowResult | null {
  const targetAttachment = payload.workOrder.attachments.find((item) => item.id === payload.attachmentId);
  if (!targetAttachment || (targetAttachment.scope ?? "official") === "official") return null;

  const nextWorkOrder = promoteAttachmentToOfficial([payload.workOrder], payload.workOrder.id, payload.attachmentId, {
    ownerId: payload.currentUser.id,
    ownerName: payload.currentUser.name,
  })[0] ?? payload.workOrder;

  return {
    nextWorkOrder,
    historyLogs: [createAttachmentPromoteHistoryLog(payload.currentUser.name, payload.workOrder.id, targetAttachment)],
    saveStatus: "dirty",
    toastMessage: "메모 첨부가 공식 첨부로 승격되었습니다.",
  };
}

export function buildManagerChangeResult(payload: {
  workOrder: WorkOrder;
  actorName: string;
  managerId: string;
  managerName: string;
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
      createManagerChangeHistoryLog(payload.actorName, payload.workOrder.id, previousManagerName, payload.managerName),
    ],
    saveStatus: "dirty",
    toastMessage: "담당자가 변경되었습니다.",
  };
}
