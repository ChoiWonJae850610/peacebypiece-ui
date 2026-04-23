import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

function stampPersistedWorkOrder(workOrder: WorkOrder): WorkOrder {
  return { ...workOrder, lastSavedAt: new Date().toISOString() };
}

function stampPersistedWorkOrders(workOrders: WorkOrder[]): WorkOrder[] {
  const stampedAt = new Date().toISOString();
  return workOrders.map((workOrder) => ({ ...workOrder, lastSavedAt: stampedAt }));
}

export async function persistCreatedWorkOrderWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrder: WorkOrder;
    historyLogs?: HistoryLog[];
  },
) {
  const nextWorkOrder = await repository.createWorkOrderAsync(stampPersistedWorkOrder(payload.workOrder));
  if (payload.historyLogs?.length) {
    await repository.appendHistoryLogsAsync(payload.historyLogs);
  }
  return nextWorkOrder;
}

export async function persistWorkOrderWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrder: WorkOrder;
    historyLogs?: HistoryLog[];
  },
) {
  const nextWorkOrder = await repository.saveWorkOrderAsync(stampPersistedWorkOrder(payload.workOrder));
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
  },
) {
  const nextWorkOrders = await repository.saveWorkOrdersAsync(stampPersistedWorkOrders(payload.workOrders));
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
