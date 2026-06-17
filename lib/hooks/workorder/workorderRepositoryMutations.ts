import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import { WORKORDER_SERVICE_CODE, type WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import { shouldCommitProductionComposition } from "@/lib/workorder/productionCompositionPolicy";
import { guardProductionCompositionPatchByServiceCode } from "@/lib/workorder/serviceCodeGuards";
import { normalizeProductionCompositionForWorkflowSnapshot } from "@/lib/workorder/productionCompositionSnapshot";
import { mergePersistedWorkOrderPreservingLocalDraft } from "@/lib/workorder/workOrderDraftMerge";
import { markWorkOrderDetailSnapshot } from "@/lib/workorder/workOrderHydration";
import { applyWaflPatchResult } from "@/lib/mutations/waflPatchResult";
import type { HistoryLog, UserProfile, WorkOrder, WorkOrderStatePatch, WorkOrderStatePatchResult } from "@/types/workorder";

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
  savedResult: WorkOrderStatePatchResult,
  requestedPatch: WorkOrderStatePatch,
): WorkOrder {
  const allowedKeys = Object.keys(requestedPatch).filter(
    (key) => key !== "id" && key !== "auditActor" && key !== "serviceCode",
  ) as (keyof WorkOrder)[];
  const merged = applyWaflPatchResult(
    currentWorkOrder,
    savedResult as WorkOrderStatePatchResult & { patch: Partial<WorkOrder> },
    { allowedKeys, updatedAtKey: "lastSavedAt" },
  );

  return {
    ...merged,
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

function buildInventoryStatePatch(
  workOrder: WorkOrder,
  auditActor?: UserProfile | null,
): WorkOrderStatePatch {
  return {
    id: workOrder.id,
    lastSavedAt: workOrder.lastSavedAt,
    inventoryQuantity: workOrder.inventoryQuantity,
    inventoryStatus: workOrder.inventoryStatus,
    auditActor: auditActor
      ? { id: auditActor.id, name: auditActor.name, role: auditActor.role }
      : null,
    serviceCode: WORKORDER_SERVICE_CODE.inventoryImmediateSave,
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
  const statePatch =
    payload.serviceCode === WORKORDER_SERVICE_CODE.inventoryImmediateSave
      ? buildInventoryStatePatch(stampedWorkOrder, payload.auditActor)
      : buildWorkOrderStatePatch(stampedWorkOrder, payload.auditActor, payload.serviceCode);
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
  let patchResults: WorkOrderStatePatchResult[] = [];
  if (payload.serviceCode === WORKORDER_SERVICE_CODE.inventoryImmediateSave && stampedWorkOrders.length > 0) {
    const first = stampedWorkOrders[0];
    patchResults = await repository.saveWorkOrderInventoryGroupPatchAsync({
      workOrderIds: stampedWorkOrders.map((item) => item.id),
      inventoryQuantity: first.inventoryQuantity,
      inventoryStatus: first.inventoryStatus,
      lastSavedAt: first.lastSavedAt,
    });
  } else {
    for (const workOrder of stampedWorkOrders) {
      const statePatch = buildWorkOrderStatePatch(workOrder, payload.auditActor, payload.serviceCode);
      const savedPatch = await repository.saveWorkOrderStatePatchAsync(statePatch);
      patchResults.push(savedPatch);
    }
  }
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return patchResults;
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
  const nextWorkOrder = await repository.saveWorkOrderAsync(stampedWorkOrder, {
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
  const nextWorkOrders = await repository.saveWorkOrdersAsync(stampedWorkOrders, {
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
