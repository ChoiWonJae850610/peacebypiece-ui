import { INVENTORY_CHANGE_TYPE, INVENTORY_STATUS, ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import { WORKFLOW_ACTION_TYPE } from "@/lib/constants/workflowActions";
import { WORKFLOW_PATH } from "@/lib/constants/workflowPaths";
import { WORK_ORDER_KIND } from "@/lib/constants/workorderIdentity";
import {
  getOrderInspectionStatusForCompletion,
  getOrderInspectionStatusForNewOrderEntry,
  getOrderInspectionStatusForOrderRequest,
  getOrderInspectionStatusForReinspection,
  WORKFLOW_STATE,
  isWorkflowState,
} from "@/lib/constants/workorderStates";
import {
  DEFAULT_WORKORDER_CATEGORY1,
  DEFAULT_WORKORDER_CATEGORY2,
  DEFAULT_WORKORDER_CATEGORY3,
  DEFAULT_WORKORDER_DUE_DATE,
  DEFAULT_WORKORDER_PRIORITY,
  DEFAULT_WORKORDER_SEASON,
  DEFAULT_WORKORDER_VENDOR,
} from "@/lib/constants/workorderDefaults";
import { createAttachmentId } from "@/lib/permissions/attachments";
import type { Material } from "@/types/material";
import { REWORK_TO_MAIN_APPEND_ROUND, applyReorderIdentity, buildWorkOrderTitle, getNextReorderRound, getOrderTypeFromWorkOrderKind, getWorkOrderKindFromOrderType, getWorkOrderBaseTitle, getWorkOrderKind, getWorkOrderReorderGroupId, getWorkOrderReorderRound, isReworkToMainTransition, isWorkOrderKind, syncOrderEntriesWithWorkOrderKind } from "@/lib/workorder/reorder/helpers";
import { deriveWorkflowStateFromOrderEntries } from "@/lib/workorder/workflow";
import { shouldApplyRecommendedCategoryOnTitleRename } from "@/lib/utils/workorderCategoryRecommend";
import { getRepresentativeOrderEntry, syncWorkOrderOrderSnapshot } from "@/lib/workorder/orderSubmission";
import { resolveOrderRequestWorkflowState } from "@/lib/workorder/materialOrderReadiness";
import type { Attachment, FactoryOrderRequest, InventoryChange, MemoReply, MemoThread, OrderEntry, RoleType, WorkOrder, WorkflowAction } from "@/types/workorder";

export function createNewWorkOrder(nextIndex: number, payload: {
  managerName: string;
  managerId: string;
  managerRole: RoleType;
  createdAt: string;
  title?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category1Id?: string | null;
  category2Id?: string | null;
  category3Id?: string | null;
  season?: string;
}): WorkOrder {
  const title = String(payload.title ?? `새 작업지시서 ${nextIndex}`).trim() || `새 작업지시서 ${nextIndex}`;
  const id = createAttachmentId("wo");

  return applyReorderIdentity({
    id,
    baseTitle: title,
    workOrderKind: WORK_ORDER_KIND.sample,
    isDefectOrder: false,
    reorderGroupId: id,
    reorderRound: 0,
    parentSpecSheetId: null,
    category1: payload.category1 ?? DEFAULT_WORKORDER_CATEGORY1,
    category2: payload.category2 ?? DEFAULT_WORKORDER_CATEGORY2,
    category3: payload.category3 ?? DEFAULT_WORKORDER_CATEGORY3,
    category1Id: payload.category1Id ?? null,
    category2Id: payload.category2Id ?? null,
    category3Id: payload.category3Id ?? null,
    season: payload.season ?? DEFAULT_WORKORDER_SEASON,
    priority: DEFAULT_WORKORDER_PRIORITY,
    vendor: DEFAULT_WORKORDER_VENDOR,
    manager: payload.managerName,
    managerId: payload.managerId,
    createdById: payload.managerId,
    createdByRole: payload.managerRole,
    dueDate: DEFAULT_WORKORDER_DUE_DATE,
    quantity: 0,
    inventoryQuantity: 0,
    inventoryStatus: INVENTORY_STATUS.unchecked,
    memo: "새 작업지시서가 생성되었습니다.",
    materials: [],
    outsourcing: [],
    attachments: [],
    memoThreads: [],
    workflowState: WORKFLOW_STATE.draft,
    lastSavedAt: payload.createdAt,
  });
}


export function buildInventoryChanges(payload: {
  inboundQuantity: number;
  adjustmentQuantity: number;
  deductionQuantity: number;
}) {
  return [
    ...(payload.inboundQuantity > 0 ? [{ type: INVENTORY_CHANGE_TYPE.inbound, quantity: payload.inboundQuantity }] : []),
    ...(payload.adjustmentQuantity > 0 ? [{ type: INVENTORY_CHANGE_TYPE.adjustment, quantity: payload.adjustmentQuantity }] : []),
    ...(payload.deductionQuantity > 0 ? [{ type: INVENTORY_CHANGE_TYPE.deduction, quantity: payload.deductionQuantity }] : []),
  ];
}

export function applyWorkflowActionToWorkOrder(workOrder: WorkOrder, action: WorkflowAction): WorkOrder {
  if (isWorkflowState(action.nextState, WORKFLOW_STATE.inspection)) {
    const resetForReinspection = action.actionType === WORKFLOW_ACTION_TYPE.requestReinspection;
    const nextOrderEntries: OrderEntry[] = (workOrder.orderEntries ?? []).map((entry) => ({
      ...entry,
      inspectionStatus: resetForReinspection
        ? getOrderInspectionStatusForReinspection()
        : getOrderInspectionStatusForOrderRequest(entry.inspectionStatus),
    }));

    return {
      ...workOrder,
      workflowState: action.nextState,
      orderEntries: nextOrderEntries,
    };
  }

  return {
    ...workOrder,
    workflowState: action.nextState,
    workflowPath:
      action.actionType === WORKFLOW_ACTION_TYPE.requestReview
        ? WORKFLOW_PATH.standardReview
        : workOrder.workflowPath,
  };
}

export function applyInventoryAdjustmentToWorkOrder(
  workOrder: WorkOrder,
  payload: { changes: InventoryChange[] },
): WorkOrder {
  let nextInventory = workOrder.inventoryQuantity;
  for (const change of payload.changes) {
    if (change.type === INVENTORY_CHANGE_TYPE.inbound) nextInventory += change.quantity;
    else if (change.type === INVENTORY_CHANGE_TYPE.deduction) nextInventory = Math.max(0, nextInventory - change.quantity);
    else nextInventory = change.quantity;
  }

  return {
    ...workOrder,
    inventoryQuantity: nextInventory,
    inventoryStatus: nextInventory > 0 ? INVENTORY_STATUS.normal : INVENTORY_STATUS.shortage,
  };
}

export function requestFactoryOrderForWorkOrder(
  workOrder: WorkOrder,
  payload: FactoryOrderRequest,
): WorkOrder {
  const nextWorkflowState = resolveOrderRequestWorkflowState(workOrder);
  const shouldMoveToInspection = isWorkflowState(nextWorkflowState, WORKFLOW_STATE.inspection);
  const nextOrderEntries: OrderEntry[] = (workOrder.orderEntries ?? []).map((entry) => ({
    ...entry,
    inspectionStatus: shouldMoveToInspection
      ? getOrderInspectionStatusForOrderRequest(entry.inspectionStatus)
      : entry.inspectionStatus ?? getOrderInspectionStatusForNewOrderEntry(),
  }));

  const workflowPath =
    isWorkflowState(workOrder.workflowState, WORKFLOW_STATE.draft) ||
    isWorkflowState(workOrder.workflowState, WORKFLOW_STATE.rejected)
      ? WORKFLOW_PATH.directOrder
      : WORKFLOW_PATH.standardReview;

  return syncWorkOrderOrderSnapshot({
    ...workOrder,
    workflowState: nextWorkflowState,
    workflowPath,
    orderEntries: nextOrderEntries,
    factoryOrderRequest: {
      ...payload,
      requestedById: payload.requestedById ?? null,
    },
  }, nextOrderEntries);
}

export function updateWorkflowState(workOrders: WorkOrder[], workOrderId: string, action: WorkflowAction) {
  return workOrders.map((item) => (item.id === workOrderId ? applyWorkflowActionToWorkOrder(item, action) : item));
}

export function applyInventoryAdjustment(
  workOrders: WorkOrder[],
  workOrderId: string,
  payload: { changes: InventoryChange[] },
) {
  return workOrders.map((item) => (item.id === workOrderId ? applyInventoryAdjustmentToWorkOrder(item, payload) : item));
}

export function appendAttachments(workOrders: WorkOrder[], workOrderId: string, attachments: Attachment[]) {
  return workOrders.map((item) => item.id === workOrderId ? { ...item, attachments: [...item.attachments, ...attachments] } : item);
}

export function removeAttachment(workOrders: WorkOrder[], workOrderId: string, attachmentId: string) {
  return workOrders.map((item) => item.id === workOrderId
    ? { ...item, attachments: item.attachments.filter((attachment) => attachment.id !== attachmentId) }
    : item);
}

export function addMemoThread(workOrders: WorkOrder[], workOrderId: string, thread: MemoThread) {
  return workOrders.map((item) => item.id === workOrderId
    ? { ...item, memoThreads: [thread, ...(item.memoThreads ?? [])] }
    : item);
}

export function addMemoReply(workOrders: WorkOrder[], workOrderId: string, threadId: string, reply: MemoReply) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;
    return {
      ...item,
      memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId
        ? { ...thread, replies: [...(thread.replies ?? []), reply] }
        : thread),
    };
  });
}

export function completeInspectionForWorkOrder(
  workOrder: WorkOrder,
  payload: { orderEntryId: string; nextInventoryQuantity: number },
): WorkOrder {
  const nextOrderEntries = (workOrder.orderEntries ?? []).map((entry) =>
    entry.id === payload.orderEntryId ? { ...entry, inspectionStatus: getOrderInspectionStatusForCompletion() } : entry,
  );

  return {
    ...workOrder,
    workflowState: deriveWorkflowStateFromOrderEntries(WORKFLOW_STATE.inspection, nextOrderEntries),
    orderEntries: nextOrderEntries,
    inventoryQuantity: payload.nextInventoryQuantity,
    inventoryStatus: payload.nextInventoryQuantity > 0 ? INVENTORY_STATUS.normal : INVENTORY_STATUS.shortage,
  };
}

export function patchWorkOrder(
  workOrder: WorkOrder,
  patch: Partial<WorkOrder>,
): WorkOrder {
  const requestedEntryType = patch.orderEntries
    ? getRepresentativeOrderEntry(patch.orderEntries)?.type
    : null;
  const requestedKind = requestedEntryType
    ? getWorkOrderKindFromOrderType(requestedEntryType)
    : patch.workOrderKind ?? workOrder.workOrderKind ?? WORK_ORDER_KIND.sample;
  const currentRound = getWorkOrderReorderRound(workOrder);
  const isTransitioningFromReworkToMain = isReworkToMainTransition(workOrder.workOrderKind, requestedKind);
  const explicitRound = patch.reorderRound == null ? null : Number(patch.reorderRound);
  const nextRound = isTransitioningFromReworkToMain
    ? Math.max(currentRound + 1, REWORK_TO_MAIN_APPEND_ROUND)
    : explicitRound != null && Number.isFinite(explicitRound)
      ? explicitRound
      : isWorkOrderKind(requestedKind, WORK_ORDER_KIND.sample)
        ? 0
        : Math.max(1, currentRound);
  const nextIsDefectOrder = isWorkOrderKind(requestedKind, WORK_ORDER_KIND.rework)
    ? Boolean(patch.isDefectOrder ?? workOrder.isDefectOrder ?? true)
    : false;

  const nextWorkOrder = syncWorkOrderOrderSnapshot(
    syncOrderEntriesWithWorkOrderKind({
      ...workOrder,
      ...patch,
      workOrderKind: requestedKind,
      isDefectOrder: nextIsDefectOrder,
      reorderRound: nextRound,
    }),
  );

  if (patch.orderEntries) {
    nextWorkOrder.workflowState = deriveWorkflowStateFromOrderEntries(workOrder.workflowState, nextWorkOrder.orderEntries ?? patch.orderEntries);
  }
  return applyReorderIdentity(nextWorkOrder);
}

export function updateManagerForWorkOrder(
  workOrder: WorkOrder,
  payload: { managerId: string; managerName: string },
): WorkOrder {
  return { ...workOrder, managerId: payload.managerId, manager: payload.managerName };
}

export function updateWorkOrderManager(
  workOrders: WorkOrder[],
  workOrderId: string,
  payload: { managerId: string; managerName: string },
) {
  return workOrders.map((item) => item.id === workOrderId
    ? updateManagerForWorkOrder(item, payload)
    : item);
}

function nextId(prefix: string) {
  return createAttachmentId(prefix);
}

function cloneOrderEntries(
  orderEntries: OrderEntry[] | undefined,
  nextOrderType: ReturnType<typeof getOrderTypeFromWorkOrderKind>,
): OrderEntry[] {
  return (orderEntries ?? []).map((entry) => ({
    ...entry,
    id: nextId("order"),
    type: nextOrderType,
    targetType: entry.targetType ?? ORDER_ENTRY_TARGET_TYPE.factory,
    inspectionStatus: getOrderInspectionStatusForNewOrderEntry(),
  }));
}

function cloneMaterials(materials: Material[]): Material[] {
  return (materials ?? []).map((material) => ({ ...material, id: nextId("mat") }));
}

function cloneOutsourcingRows(rows: WorkOrder["outsourcing"]): WorkOrder["outsourcing"] {
  return (rows ?? []).map((row) => ({ ...row, id: nextId("out") }));
}

function cloneAttachments(attachments: Attachment[]): Attachment[] {
  return (attachments ?? []).map((attachment) => ({
    ...attachment,
    id: nextId("att"),
    linkedThreadId: null,
    linkedReplyId: null,
  }));
}

export function resolveBaseTitle(workOrder: WorkOrder): string {
  return getWorkOrderBaseTitle(workOrder);
}

export function resolveRootId(workOrder: WorkOrder): string {
  return getWorkOrderReorderGroupId(workOrder);
}

export function resolveDisplayedSourceTitle(workOrder: WorkOrder): string {
  return buildWorkOrderTitle(workOrder);
}

export function renameWorkOrderGroupBaseTitle(
  workOrders: WorkOrder[],
  workOrderId: string,
  nextBaseTitle: string,
): { nextWorkOrders: WorkOrder[]; affectedWorkOrderIds: string[]; previousBaseTitle: string | null; } {
  const targetWorkOrder = workOrders.find((item) => item.id === workOrderId);
  if (!targetWorkOrder) {
    return { nextWorkOrders: workOrders, affectedWorkOrderIds: [], previousBaseTitle: null };
  }

  const trimmedBaseTitle = String(nextBaseTitle ?? '').trim();
  if (!trimmedBaseTitle) {
    return { nextWorkOrders: workOrders, affectedWorkOrderIds: [], previousBaseTitle: null };
  }

  const reorderGroupId = resolveRootId(targetWorkOrder);
  const previousBaseTitle = resolveBaseTitle(targetWorkOrder);
  const affectedWorkOrderIds = workOrders.filter((item) => resolveRootId(item) === reorderGroupId).map((item) => item.id);

  if (affectedWorkOrderIds.length === 0 || previousBaseTitle === trimmedBaseTitle) {
    return { nextWorkOrders: workOrders, affectedWorkOrderIds, previousBaseTitle };
  }

  const nextWorkOrders = workOrders.map((item) => {
    if (resolveRootId(item) !== reorderGroupId) return applyReorderIdentity(item);

    const categoryRecommendation = shouldApplyRecommendedCategoryOnTitleRename({
      previousTitle: resolveBaseTitle(item),
      nextTitle: trimmedBaseTitle,
      currentCategory: {
        category1: item.category1,
        category2: item.category2,
        category3: item.category3,
      },
    });

    return applyReorderIdentity({
      ...item,
      baseTitle: trimmedBaseTitle,
      ...(categoryRecommendation
        ? {
            category1: categoryRecommendation.category1,
            category2: categoryRecommendation.category2,
            category3: categoryRecommendation.category3,
          }
        : {}),
    });
  });

  return { nextWorkOrders, affectedWorkOrderIds, previousBaseTitle };
}

export function cloneWorkOrderForReorder(
  workOrders: WorkOrder[],
  sourceWorkOrder: WorkOrder,
  payload: { createdAt: string; createdById: string; createdByRole: RoleType; managerId: string | null; managerName: string; },
): WorkOrder {
  const baseTitle = resolveBaseTitle(sourceWorkOrder);
  const reorderRound = getNextReorderRound(workOrders, sourceWorkOrder);
  const nextWorkOrderKind = getWorkOrderKind({ ...sourceWorkOrder, workOrderKind: WORK_ORDER_KIND.main });
  const nextOrderType = getOrderTypeFromWorkOrderKind(nextWorkOrderKind);

  return applyReorderIdentity(syncOrderEntriesWithWorkOrderKind({
    ...sourceWorkOrder,
    id: nextId("wo"),
    baseTitle,
    workOrderKind: nextWorkOrderKind,
    isDefectOrder: false,
    reorderGroupId: resolveRootId(sourceWorkOrder),
    reorderRound,
    parentSpecSheetId: sourceWorkOrder.id,
    managerId: payload.managerId,
    manager: payload.managerName,
    createdById: payload.createdById,
    createdByRole: payload.createdByRole,
    workflowState: WORKFLOW_STATE.draft,
    factoryOrderRequest: null,
    inventoryStatus: sourceWorkOrder.inventoryQuantity > 0 ? INVENTORY_STATUS.normal : sourceWorkOrder.inventoryStatus,
    orderEntries: cloneOrderEntries(sourceWorkOrder.orderEntries, nextOrderType),
    materials: cloneMaterials(sourceWorkOrder.materials),
    outsourcing: cloneOutsourcingRows(sourceWorkOrder.outsourcing),
    attachments: cloneAttachments(sourceWorkOrder.attachments),
    memoThreads: [],
    lastSavedAt: payload.createdAt,
    reorderedFromId: sourceWorkOrder.id,
    reorderedFromTitle: resolveDisplayedSourceTitle(sourceWorkOrder),
  }));
}


export function convertWorkOrderToRework(sourceWorkOrder: WorkOrder): WorkOrder {
  return applyReorderIdentity(syncOrderEntriesWithWorkOrderKind({
    ...sourceWorkOrder,
    baseTitle: resolveBaseTitle(sourceWorkOrder),
    workOrderKind: WORK_ORDER_KIND.rework,
    isDefectOrder: true,
    reorderRound: getWorkOrderReorderRound(sourceWorkOrder),
    parentSpecSheetId: sourceWorkOrder.parentSpecSheetId ?? sourceWorkOrder.reorderedFromId ?? null,
    reorderedFromId: sourceWorkOrder.reorderedFromId ?? sourceWorkOrder.id,
    reorderedFromTitle: sourceWorkOrder.reorderedFromTitle ?? resolveDisplayedSourceTitle(sourceWorkOrder),
  }));
}
