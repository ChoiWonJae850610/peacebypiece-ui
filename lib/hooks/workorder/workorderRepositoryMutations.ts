import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
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


function mergeStatePatchResultIntoWorkOrder(currentWorkOrder: WorkOrder, savedPatch: WorkOrder): WorkOrder {
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
    factoryOrderRequest: Object.prototype.hasOwnProperty.call(savedPatch, "factoryOrderRequest")
      ? (savedPatch.factoryOrderRequest ?? null)
      : currentWorkOrder.factoryOrderRequest,
    orderEntries: Array.isArray(savedPatch.orderEntries) ? savedPatch.orderEntries : currentWorkOrder.orderEntries,
    materials: Array.isArray(savedPatch.materials) ? savedPatch.materials : currentWorkOrder.materials,
    outsourcing: Array.isArray(savedPatch.outsourcing) ? savedPatch.outsourcing : currentWorkOrder.outsourcing,
    hasDetailSnapshot: currentWorkOrder.hasDetailSnapshot,
  };
}

function shouldIncludeProductionCompositionInStatePatch(workOrder: WorkOrder): boolean {
  return Boolean(
    workOrder.hasDetailSnapshot ||
      (workOrder.materials?.length ?? 0) > 0 ||
      (workOrder.outsourcing?.length ?? 0) > 0,
  );
}

function buildWorkOrderStatePatch(workOrder: WorkOrder, auditActor?: UserProfile | null): WorkOrderStatePatch {
  const shouldIncludeProductionComposition = shouldIncludeProductionCompositionInStatePatch(workOrder);

  return {
    id: workOrder.id,
    workflowState: workOrder.workflowState,
    lastSavedAt: workOrder.lastSavedAt,
    inventoryQuantity: workOrder.inventoryQuantity,
    inventoryStatus: workOrder.inventoryStatus,
    factoryOrderRequest: workOrder.factoryOrderRequest ?? null,
    orderEntries: workOrder.orderEntries ?? [],
    ...(shouldIncludeProductionComposition
      ? {
          materials: workOrder.materials ?? [],
          outsourcing: workOrder.outsourcing ?? [],
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
  const savedPatch = await repository.saveWorkOrderStatePatchAsync(buildWorkOrderStatePatch(stampedWorkOrder, payload.auditActor));
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return mergeStatePatchResultIntoWorkOrder(stampedWorkOrder, savedPatch);
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
    const savedPatch = await repository.saveWorkOrderStatePatchAsync(buildWorkOrderStatePatch(workOrder, payload.auditActor));
    nextWorkOrders.push(mergeStatePatchResultIntoWorkOrder(workOrder, savedPatch));
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
