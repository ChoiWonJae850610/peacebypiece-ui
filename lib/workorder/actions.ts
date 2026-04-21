import { INVENTORY_CHANGE_TYPE, INVENTORY_STATUS } from "@/lib/constants/workorderDomain";
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
import { REWORK_TO_MAIN_APPEND_ROUND, applyReorderIdentity, buildWorkOrderTitle, getNextReorderRound, getOrderTypeFromWorkOrderKind, getWorkOrderBaseTitle, getWorkOrderReorderGroupId, getWorkOrderReorderRound, syncOrderEntriesWithWorkOrderKind } from "@/lib/workorder/reorder/helpers";
import { deriveWorkflowStateFromOrderEntries } from "@/lib/workorder/workflow";
import { shouldApplyRecommendedCategoryOnTitleRename } from "@/lib/utils/workorderCategoryRecommend";
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
  season?: string;
}): WorkOrder {
  const title = String(payload.title ?? `새 작업지시서 ${nextIndex}`).trim() || `새 작업지시서 ${nextIndex}`;
  const id = createAttachmentId("wo");

  return applyReorderIdentity({
    id,
    baseTitle: title,
    workOrderKind: "sample",
    isDefectOrder: false,
    reorderGroupId: id,
    reorderRound: 1,
    category1: payload.category1 ?? DEFAULT_WORKORDER_CATEGORY1,
    category2: payload.category2 ?? DEFAULT_WORKORDER_CATEGORY2,
    category3: payload.category3 ?? DEFAULT_WORKORDER_CATEGORY3,
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
    workflowState: "draft",
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
  if (action.nextState === "in_production") {
    const nextOrderEntries: OrderEntry[] = (workOrder.orderEntries ?? []).map((entry) => ({
      ...entry,
      inspectionStatus: entry.inspectionStatus === "inspection_completed" ? "inspection_completed" : "inspection_pending",
    }));

    return {
      ...workOrder,
      workflowState: action.nextState,
      orderEntries: nextOrderEntries,
    };
  }

  return { ...workOrder, workflowState: action.nextState };
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
  const nextOrderEntries: OrderEntry[] = (workOrder.orderEntries ?? []).map((entry) => ({
    ...entry,
    inspectionStatus: entry.inspectionStatus === "inspection_completed" ? "inspection_completed" : "inspection_pending",
  }));

  return {
    ...workOrder,
    workflowState: "in_production",
    orderEntries: nextOrderEntries,
    factoryOrderRequest: {
      ...payload,
      requestedById: payload.requestedById ?? null,
    },
  };
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

export function appendMemoAttachmentsToThread(
  workOrders: WorkOrder[],
  workOrderId: string,
  threadId: string,
  payload: { attachmentIds: string[]; attachments: Attachment[] },
) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;
    return {
      ...item,
      attachments: [...item.attachments, ...payload.attachments],
      memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId
        ? { ...thread, attachmentIds: [...(thread.attachmentIds ?? []), ...payload.attachmentIds] }
        : thread),
    };
  });
}

export function appendMemoAttachmentsToReply(
  workOrders: WorkOrder[],
  workOrderId: string,
  threadId: string,
  replyId: string,
  payload: { attachmentIds: string[]; attachments: Attachment[] },
) {
  return workOrders.map((item) => {
    if (item.id !== workOrderId) return item;
    return {
      ...item,
      attachments: [...item.attachments, ...payload.attachments],
      memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId
        ? {
            ...thread,
            replies: (thread.replies ?? []).map((reply) => reply.id === replyId
              ? { ...reply, attachmentIds: [...(reply.attachmentIds ?? []), ...payload.attachmentIds] }
              : reply),
          }
        : thread),
    };
  });
}

export function promoteAttachmentToOfficial(
  workOrders: WorkOrder[],
  workOrderId: string,
  attachmentId: string,
  payload: { ownerId: string; ownerName: string },
): WorkOrder[] {
  return workOrders.map((item): WorkOrder => item.id === workOrderId
    ? {
        ...item,
        attachments: item.attachments.map((attachment): Attachment => attachment.id === attachmentId
          ? { ...attachment, scope: "official" as const, ownerId: payload.ownerId, ownerName: payload.ownerName }
          : attachment),
      }
    : item);
}



export function completeInspectionForWorkOrder(
  workOrder: WorkOrder,
  payload: { orderEntryId: string; nextInventoryQuantity: number },
): WorkOrder {
  const nextOrderEntries = (workOrder.orderEntries ?? []).map((entry) =>
    entry.id === payload.orderEntryId ? { ...entry, inspectionStatus: "inspection_completed" as const } : entry,
  );

  return {
    ...workOrder,
    orderEntries: nextOrderEntries,
    inventoryQuantity: payload.nextInventoryQuantity,
    inventoryStatus: payload.nextInventoryQuantity > 0 ? INVENTORY_STATUS.normal : INVENTORY_STATUS.shortage,
  };
}

export function patchWorkOrder(
  workOrder: WorkOrder,
  patch: Partial<WorkOrder>,
): WorkOrder {
  const requestedKind = patch.workOrderKind ?? workOrder.workOrderKind ?? "sample";
  const currentRound = getWorkOrderReorderRound(workOrder);
  const isTransitioningFromReworkToMain = workOrder.workOrderKind === "rework" && requestedKind === "main";
  const nextRound = isTransitioningFromReworkToMain
    ? Math.max(currentRound + 1, REWORK_TO_MAIN_APPEND_ROUND)
    : Number(patch.reorderRound ?? currentRound);
  const nextIsDefectOrder = requestedKind === "rework"
    ? Boolean(patch.isDefectOrder ?? workOrder.isDefectOrder ?? true)
    : false;

  const nextWorkOrder = syncOrderEntriesWithWorkOrderKind({
    ...workOrder,
    ...patch,
    workOrderKind: requestedKind,
    isDefectOrder: nextIsDefectOrder,
    reorderRound: nextRound,
  });

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
    inspectionStatus: "order_pending" as const,
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
  const nextWorkOrderKind = sourceWorkOrder.workOrderKind === "sample" ? "main" : "main";
  const nextOrderType = getOrderTypeFromWorkOrderKind(nextWorkOrderKind);

  return applyReorderIdentity(syncOrderEntriesWithWorkOrderKind({
    ...sourceWorkOrder,
    id: nextId("wo"),
    baseTitle,
    workOrderKind: nextWorkOrderKind,
    isDefectOrder: false,
    reorderGroupId: resolveRootId(sourceWorkOrder),
    reorderRound,
    managerId: payload.managerId,
    manager: payload.managerName,
    createdById: payload.createdById,
    createdByRole: payload.createdByRole,
    workflowState: "draft",
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
    workOrderKind: "rework",
    isDefectOrder: true,
    reorderRound: getWorkOrderReorderRound(sourceWorkOrder),
    reorderedFromId: sourceWorkOrder.reorderedFromId ?? sourceWorkOrder.id,
    reorderedFromTitle: sourceWorkOrder.reorderedFromTitle ?? resolveDisplayedSourceTitle(sourceWorkOrder),
  }));
}
