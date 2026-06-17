import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import type { WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import { shouldCommitProductionComposition } from "@/lib/workorder/productionCompositionPolicy";
import { guardProductionCompositionPatchByServiceCode } from "@/lib/workorder/serviceCodeGuards";
import { normalizeProductionCompositionForWorkflowSnapshot } from "@/lib/workorder/productionCompositionSnapshot";
import { mergePersistedWorkOrderPreservingLocalDraft } from "@/lib/workorder/workOrderDraftMerge";
import { markWorkOrderDetailSnapshot } from "@/lib/workorder/workOrderHydration";
import type { HistoryLog, UserProfile, WorkOrder, WorkOrderStatePatch } from "@/types/workorder";

function stampPersistedWorkOrder(workOrder: WorkOrder): WorkOrder {
  return { ...workOrder, lastSavedAt: new Date().toISOString() };
}

function stampPersistedWorkOrders(workOrders: WorkOrder[]): WorkOrder[] {
  const stampedAt = new Date().toISOString();
  return workOrders.map((workOrder) => ({ ...workOrder, lastSavedAt: stampedAt }));
}

export function replaceWorkOrderById(workOrders: WorkOrder[], workOrderId: string, nextWorkOrder: WorkOrder): WorkOrder[] {
  return workOrders.map((item) => (item.id === workOrderId ? nextWorkOrder : item));
}

export function upsertWorkOrderAtStart(workOrders: WorkOrder[], nextWorkOrder: WorkOrder): WorkOrder[] {
  return [nextWorkOrder, ...workOrders.filter((item) => item.id !== nextWorkOrder.id)];
}

export function mergeSavedWorkOrders(workOrders: WorkOrder[], savedWorkOrders: WorkOrder[]): WorkOrder[] {
  if (savedWorkOrders.length === 0) return workOrders;
  const savedById = new Map(savedWorkOrders.map((item) => [item.id, item]));
  return workOrders.map((item) => savedById.get(item.id) ?? item);
}

export function mergeSavedWorkOrdersPreservingDraftOnlyFields(workOrders: WorkOrder[], savedWorkOrders: WorkOrder[]): WorkOrder[] {
  if (savedWorkOrders.length === 0) return workOrders;
  const savedById = new Map(savedWorkOrders.map((item) => [item.id, item]));
  return workOrders.map((item) => {
    const saved = savedById.get(item.id);
    return saved ? mergePersistedWorkOrderPreservingLocalDraft(item, saved) : item;
  });
}

export function getSelectedWorkOrderForSaveState(workOrders: WorkOrder[], selectedId: string): WorkOrder | null {
  return workOrders.find((item) => item.id === selectedId) ?? workOrders[0] ?? null;
}

export function getLastSavedAtForWorkOrder(workOrders: WorkOrder[], workOrderId: string): string | null {
  return workOrders.find((item) => item.id === workOrderId)?.lastSavedAt ?? null;
}

export async function persistCreatedWorkOrderWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrder: WorkOrder;
    historyLogs?: HistoryLog[];
    auditActor?: UserProfile | null;
    serviceCode?: WorkOrderServiceCodeValue | null;
  },
) {
  const nextWorkOrder = await repository.createWorkOrderAsync(stampPersistedWorkOrder(payload.workOrder));
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return markWorkOrderDetailSnapshot(nextWorkOrder);
}


function mergeStatePatchResultIntoWorkOrder(
  currentWorkOrder: WorkOrder,
  savedPatch: WorkOrder,
  requestedPatch: WorkOrderStatePatch,
): WorkOrder {
  const hasRequestedField = (field: keyof WorkOrderStatePatch): boolean =>
    Object.prototype.hasOwnProperty.call(requestedPatch, field);
  const hasFactoryOrderRequestPatch = hasRequestedField("factoryOrderRequest");
  const hasOrderEntriesPatch = hasRequestedField("orderEntries");
  const hasMaterialsPatch = hasRequestedField("materials");
  const hasOutsourcingPatch = hasRequestedField("outsourcing");

  return {
    ...currentWorkOrder,
    workflowState: hasRequestedField("workflowState")
      ? (savedPatch.workflowState ?? currentWorkOrder.workflowState)
      : currentWorkOrder.workflowState,
    lastSavedAt: savedPatch.lastSavedAt ?? currentWorkOrder.lastSavedAt,
    title: hasRequestedField("title") ? savedPatch.title : currentWorkOrder.title,
    displayTitle: hasRequestedField("displayTitle") ? savedPatch.displayTitle : currentWorkOrder.displayTitle,
    baseTitle: hasRequestedField("baseTitle") ? savedPatch.baseTitle : currentWorkOrder.baseTitle,
    workOrderKind: hasRequestedField("workOrderKind") ? savedPatch.workOrderKind : currentWorkOrder.workOrderKind,
    category1: hasRequestedField("category1") ? savedPatch.category1 : currentWorkOrder.category1,
    category2: hasRequestedField("category2") ? savedPatch.category2 : currentWorkOrder.category2,
    category3: hasRequestedField("category3") ? savedPatch.category3 : currentWorkOrder.category3,
    category1Id: hasRequestedField("category1Id") ? savedPatch.category1Id : currentWorkOrder.category1Id,
    category2Id: hasRequestedField("category2Id") ? savedPatch.category2Id : currentWorkOrder.category2Id,
    category3Id: hasRequestedField("category3Id") ? savedPatch.category3Id : currentWorkOrder.category3Id,
    season: hasRequestedField("season") ? savedPatch.season : currentWorkOrder.season,
    manager: hasRequestedField("manager") ? savedPatch.manager : currentWorkOrder.manager,
    managerId: hasRequestedField("managerId") ? savedPatch.managerId : currentWorkOrder.managerId,
    dueDate: hasRequestedField("dueDate") ? savedPatch.dueDate : currentWorkOrder.dueDate,
    quantity: hasRequestedField("quantity") ? savedPatch.quantity : currentWorkOrder.quantity,
    inventoryQuantity: hasRequestedField("inventoryQuantity")
      ? savedPatch.inventoryQuantity
      : currentWorkOrder.inventoryQuantity,
    inventoryStatus: hasRequestedField("inventoryStatus")
      ? savedPatch.inventoryStatus
      : currentWorkOrder.inventoryStatus,
    factoryOrderRequest: hasFactoryOrderRequestPatch
      ? (savedPatch.factoryOrderRequest ?? null)
      : currentWorkOrder.factoryOrderRequest,
    orderEntries: hasOrderEntriesPatch && Array.isArray(savedPatch.orderEntries)
      ? savedPatch.orderEntries
      : currentWorkOrder.orderEntries,
    materials: hasMaterialsPatch && Array.isArray(savedPatch.materials)
      ? savedPatch.materials
      : currentWorkOrder.materials,
    outsourcing: hasOutsourcingPatch && Array.isArray(savedPatch.outsourcing)
      ? savedPatch.outsourcing
      : currentWorkOrder.outsourcing,
    rejectionReason: hasRequestedField("rejectionReason")
      ? (savedPatch.rejectionReason ?? null)
      : currentWorkOrder.rejectionReason,
    rejectedAt: hasRequestedField("rejectedAt")
      ? (savedPatch.rejectedAt ?? null)
      : currentWorkOrder.rejectedAt,
    rejectedByUserId: hasRequestedField("rejectedByUserId")
      ? (savedPatch.rejectedByUserId ?? null)
      : currentWorkOrder.rejectedByUserId,
    rejectedByName: hasRequestedField("rejectedByName")
      ? (savedPatch.rejectedByName ?? null)
      : currentWorkOrder.rejectedByName,
    hasDetailSnapshot: currentWorkOrder.hasDetailSnapshot,
  };
}

function buildProductionCompositionStatePatch(
  workOrder: WorkOrder,
  serviceCode?: WorkOrderServiceCodeValue | null,
): Pick<WorkOrderStatePatch, "factoryOrderRequest" | "orderEntries" | "materials" | "outsourcing"> | Record<string, never> {
  if (!shouldCommitProductionComposition(workOrder, serviceCode)) return {};
  return {
    factoryOrderRequest: workOrder.factoryOrderRequest ?? null,
    orderEntries: workOrder.orderEntries ?? [],
    materials: workOrder.materials ?? [],
    outsourcing: workOrder.outsourcing ?? [],
  };
}

function buildWorkOrderStatePatch(
  workOrder: WorkOrder,
  auditActor?: UserProfile | null,
  serviceCode?: WorkOrderServiceCodeValue | null,
): WorkOrderStatePatch {
  const normalizedWorkOrder = normalizeProductionCompositionForWorkflowSnapshot(workOrder);
  const productionCompositionPatch = buildProductionCompositionStatePatch(normalizedWorkOrder, serviceCode);

  const statePatch: WorkOrderStatePatch = {
    id: normalizedWorkOrder.id,
    workflowState: normalizedWorkOrder.workflowState,
    lastSavedAt: normalizedWorkOrder.lastSavedAt,
    inventoryQuantity: normalizedWorkOrder.inventoryQuantity,
    inventoryStatus: normalizedWorkOrder.inventoryStatus,
    rejectionReason: normalizedWorkOrder.rejectionReason ?? null,
    rejectedAt: normalizedWorkOrder.rejectedAt ?? null,
    rejectedByUserId: normalizedWorkOrder.rejectedByUserId ?? null,
    rejectedByName: normalizedWorkOrder.rejectedByName ?? null,
    ...productionCompositionPatch,
    auditActor: auditActor
      ? { id: auditActor.id, name: auditActor.name, role: auditActor.role }
      : null,
    serviceCode: serviceCode ?? null,
  };

  return guardProductionCompositionPatchByServiceCode(statePatch, serviceCode);
}

export async function persistImmediateWorkOrderPatchWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrder: WorkOrder;
    patch: Partial<WorkOrder>;
    historyLogs?: HistoryLog[];
    auditActor?: UserProfile | null;
    serviceCode?: WorkOrderServiceCodeValue | null;
  },
) {
  const stampedWorkOrder = stampPersistedWorkOrder(payload.workOrder);
  const immediatePatch: WorkOrderStatePatch = {
    id: stampedWorkOrder.id,
    lastSavedAt: stampedWorkOrder.lastSavedAt,
    ...payload.patch,
    auditActor: payload.auditActor
      ? { id: payload.auditActor.id, name: payload.auditActor.name, role: payload.auditActor.role }
      : null,
    serviceCode: payload.serviceCode ?? null,
  };
  const savedPatch = await repository.saveWorkOrderStatePatchAsync(immediatePatch);
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return mergeStatePatchResultIntoWorkOrder(stampedWorkOrder, savedPatch, immediatePatch);
}

export async function persistWorkOrderStatePatchWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrder: WorkOrder;
    historyLogs?: HistoryLog[];
    auditActor?: UserProfile | null;
    serviceCode?: WorkOrderServiceCodeValue | null;
  },
) {
  const stampedWorkOrder = stampPersistedWorkOrder(payload.workOrder);
  const statePatch = buildWorkOrderStatePatch(stampedWorkOrder, payload.auditActor, payload.serviceCode);
  const savedPatch = await repository.saveWorkOrderStatePatchAsync(statePatch);
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return mergeStatePatchResultIntoWorkOrder(stampedWorkOrder, savedPatch, statePatch);
}

export async function persistWorkOrderStatePatchesWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrders: WorkOrder[];
    historyLogs?: HistoryLog[];
    auditActor?: UserProfile | null;
    serviceCode?: WorkOrderServiceCodeValue | null;
  },
) {
  const stampedWorkOrders = stampPersistedWorkOrders(payload.workOrders);
  const nextWorkOrders: WorkOrder[] = [];
  for (const workOrder of stampedWorkOrders) {
    const statePatch = buildWorkOrderStatePatch(workOrder, payload.auditActor, payload.serviceCode);
    const savedPatch = await repository.saveWorkOrderStatePatchAsync(statePatch);
    nextWorkOrders.push(mergeStatePatchResultIntoWorkOrder(workOrder, savedPatch, statePatch));
  }
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return nextWorkOrders;
}

export async function persistWorkOrderWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrder: WorkOrder;
    historyLogs?: HistoryLog[];
    auditActor?: UserProfile | null;
    serviceCode?: WorkOrderServiceCodeValue | null;
  },
) {
  const stampedWorkOrder = stampPersistedWorkOrder(payload.workOrder);
  const workOrderWithAuditActor = payload.auditActor
    ? ({
        ...stampedWorkOrder,
        auditActor: { id: payload.auditActor.id, name: payload.auditActor.name, role: payload.auditActor.role },
      } as WorkOrder)
    : stampedWorkOrder;
  const nextWorkOrder = await repository.saveWorkOrderAsync(workOrderWithAuditActor, {
    serviceCode: payload.serviceCode ?? null,
    auditActor: payload.auditActor ?? null,
  });
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return nextWorkOrder;
}

export async function persistWorkOrdersWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrders: WorkOrder[];
    historyLogs?: HistoryLog[];
    auditActor?: UserProfile | null;
    serviceCode?: WorkOrderServiceCodeValue | null;
  },
) {
  const stampedWorkOrders = stampPersistedWorkOrders(payload.workOrders);
  const workOrdersWithAuditActor = payload.auditActor
    ? stampedWorkOrders.map((workOrder) => ({
        ...workOrder,
        auditActor: { id: payload.auditActor!.id, name: payload.auditActor!.name, role: payload.auditActor!.role },
      } as WorkOrder))
    : stampedWorkOrders;
  const nextWorkOrders = await repository.saveWorkOrdersAsync(workOrdersWithAuditActor, {
    serviceCode: payload.serviceCode ?? null,
    auditActor: payload.auditActor ?? null,
  });
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return nextWorkOrders;
}

export async function persistUsersWithPermissions(
  repository: WorkorderRepository,
  payload: {
    users: UserProfile[];
    savePermissions?: boolean;
  },
) {
  if (payload.savePermissions) {
    return repository.savePermissionsAsync(payload.users);
  }
  return repository.saveUsersAsync(payload.users);
}
