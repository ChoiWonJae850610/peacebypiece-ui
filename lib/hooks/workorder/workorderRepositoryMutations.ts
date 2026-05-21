import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import { shouldCommitProductionComposition } from "@/lib/workorder/productionCompositionPolicy";
import { normalizeProductionCompositionForWorkflowSnapshot } from "@/lib/workorder/productionCompositionSnapshot";
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
  },
) {
  const nextWorkOrder = await repository.createWorkOrderAsync(stampPersistedWorkOrder(payload.workOrder));
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return nextWorkOrder;
}


function mergeStatePatchResultIntoWorkOrder(currentWorkOrder: WorkOrder, savedPatch: WorkOrder, requestedPatch: WorkOrderStatePatch): WorkOrder {
  const hasFactoryOrderRequestPatch = Object.prototype.hasOwnProperty.call(requestedPatch, "factoryOrderRequest");
  const hasOrderEntriesPatch = Object.prototype.hasOwnProperty.call(requestedPatch, "orderEntries");
  const hasMaterialsPatch = Object.prototype.hasOwnProperty.call(requestedPatch, "materials");
  const hasOutsourcingPatch = Object.prototype.hasOwnProperty.call(requestedPatch, "outsourcing");

  return {
    ...currentWorkOrder,
    workflowState: savedPatch.workflowState ?? currentWorkOrder.workflowState,
    lastSavedAt: savedPatch.lastSavedAt ?? currentWorkOrder.lastSavedAt,
    inventoryQuantity: Object.prototype.hasOwnProperty.call(savedPatch, "inventoryQuantity")
      ? savedPatch.inventoryQuantity
      : currentWorkOrder.inventoryQuantity,
    inventoryStatus: Object.prototype.hasOwnProperty.call(savedPatch, "inventoryStatus")
      ? savedPatch.inventoryStatus
      : currentWorkOrder.inventoryStatus,
    factoryOrderRequest: hasFactoryOrderRequestPatch
      ? (savedPatch.factoryOrderRequest ?? null)
      : currentWorkOrder.factoryOrderRequest,
    orderEntries: hasOrderEntriesPatch && Array.isArray(savedPatch.orderEntries) ? savedPatch.orderEntries : currentWorkOrder.orderEntries,
    materials: hasMaterialsPatch && Array.isArray(savedPatch.materials) ? savedPatch.materials : currentWorkOrder.materials,
    outsourcing: hasOutsourcingPatch && Array.isArray(savedPatch.outsourcing) ? savedPatch.outsourcing : currentWorkOrder.outsourcing,
    hasDetailSnapshot: currentWorkOrder.hasDetailSnapshot,
  };
}

function shouldIncludeProductionCompositionInStatePatch(workOrder: WorkOrder): boolean {
  return shouldCommitProductionComposition(workOrder);
}

function buildWorkOrderStatePatch(workOrder: WorkOrder, auditActor?: UserProfile | null): WorkOrderStatePatch {
  const normalizedWorkOrder = normalizeProductionCompositionForWorkflowSnapshot(workOrder);
  const shouldIncludeProductionComposition = shouldIncludeProductionCompositionInStatePatch(normalizedWorkOrder);

  return {
    id: normalizedWorkOrder.id,
    workflowState: normalizedWorkOrder.workflowState,
    lastSavedAt: normalizedWorkOrder.lastSavedAt,
    inventoryQuantity: normalizedWorkOrder.inventoryQuantity,
    inventoryStatus: normalizedWorkOrder.inventoryStatus,
    ...(shouldIncludeProductionComposition
      ? {
          factoryOrderRequest: normalizedWorkOrder.factoryOrderRequest ?? null,
          orderEntries: normalizedWorkOrder.orderEntries ?? [],
          materials: normalizedWorkOrder.materials ?? [],
          outsourcing: normalizedWorkOrder.outsourcing ?? [],
        }
      : {}),
    auditActor: auditActor
      ? { id: auditActor.id, name: auditActor.name, role: auditActor.role }
      : null,
  };
}

export async function persistWorkOrderStatePatchWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrder: WorkOrder;
    historyLogs?: HistoryLog[];
    auditActor?: UserProfile | null;
  },
) {
  const stampedWorkOrder = stampPersistedWorkOrder(payload.workOrder);
  const statePatch = buildWorkOrderStatePatch(stampedWorkOrder, payload.auditActor);
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
  },
) {
  const stampedWorkOrders = stampPersistedWorkOrders(payload.workOrders);
  const nextWorkOrders: WorkOrder[] = [];
  for (const workOrder of stampedWorkOrders) {
    const statePatch = buildWorkOrderStatePatch(workOrder, payload.auditActor);
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
  },
) {
  const stampedWorkOrder = stampPersistedWorkOrder(payload.workOrder);
  const workOrderWithAuditActor = payload.auditActor
    ? ({
        ...stampedWorkOrder,
        auditActor: { id: payload.auditActor.id, name: payload.auditActor.name, role: payload.auditActor.role },
      } as WorkOrder)
    : stampedWorkOrder;
  const nextWorkOrder = await repository.saveWorkOrderAsync(workOrderWithAuditActor);
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
  },
) {
  const stampedWorkOrders = stampPersistedWorkOrders(payload.workOrders);
  const workOrdersWithAuditActor = payload.auditActor
    ? stampedWorkOrders.map((workOrder) => ({
        ...workOrder,
        auditActor: { id: payload.auditActor!.id, name: payload.auditActor!.name, role: payload.auditActor!.role },
      } as WorkOrder))
    : stampedWorkOrders;
  const nextWorkOrders = await repository.saveWorkOrdersAsync(workOrdersWithAuditActor);
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
