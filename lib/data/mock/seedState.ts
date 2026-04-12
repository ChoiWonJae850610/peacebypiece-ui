import { DEFAULT_CURRENT_USER_ID, DEFAULT_PERMISSION_TARGET_ID, WORKORDER_SEED_USERS } from "@/lib/data/mock/users";
import { DEFAULT_SELECTED_WORK_ORDER_ID, WORKORDER_SEED_HISTORY_LOGS, WORKORDER_SEED_WORK_ORDERS } from "@/lib/data/mock/workorders";
import type { PersistedWorkOrderState } from "@/lib/data/mock/types";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

function cloneSeedValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getSeedUsers(): UserProfile[] {
  return cloneSeedValue(WORKORDER_SEED_USERS);
}

export function getSeedWorkOrders(): WorkOrder[] {
  return cloneSeedValue(WORKORDER_SEED_WORK_ORDERS);
}

export function getSeedHistoryLogs(): HistoryLog[] {
  return cloneSeedValue(WORKORDER_SEED_HISTORY_LOGS);
}

export function createInitialSeededWorkorderState(): PersistedWorkOrderState {
  return {
    users: getSeedUsers(),
    workOrders: getSeedWorkOrders(),
    historyLogs: getSeedHistoryLogs(),
    selectedId: DEFAULT_SELECTED_WORK_ORDER_ID,
    currentUserId: DEFAULT_CURRENT_USER_ID,
    permissionTargetUserId: DEFAULT_PERMISSION_TARGET_ID,
  };
}

export function cloneSavedWorkOrders(workOrders: WorkOrder[]) {
  return cloneSeedValue(workOrders);
}
