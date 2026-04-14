import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export async function persistWorkOrderWithHistory(
  repository: WorkorderRepository,
  payload: {
    workOrder: WorkOrder;
    historyLogs?: HistoryLog[];
  },
) {
  const nextWorkOrder = await repository.saveWorkOrderAsync(payload.workOrder);
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
  const nextWorkOrders = await repository.saveWorkOrdersAsync(payload.workOrders);
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
