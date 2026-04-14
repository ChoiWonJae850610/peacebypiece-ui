import { DEFAULT_CURRENT_USER_ID, DEFAULT_PERMISSION_TARGET_ID } from "@/lib/data/mock/users";
import { DEFAULT_SELECTED_WORK_ORDER_ID } from "@/lib/data/mock/workorders";
import {
  cloneSavedWorkOrders,
  createInitialSeededWorkorderState,
  getSeedHistoryLogs,
  getSeedUsers,
  getSeedWorkOrders,
} from "@/lib/data/mock/seedState";
import type { PersistedWorkOrderState } from "@/lib/data/mock/types";
import {
  loadPersistedWorkspaceState,
  loadPersistedWorkorderState,
  persistWorkspaceState,
  persistWorkorderState,
} from "@/lib/repositories/workorderPersistence";
import {
  type WorkorderRepository,
  type WorkorderWorkspaceSession,
  type WorkorderWorkspaceState,
} from "@/lib/repositories/workorderRepository";
import { stabilizeWorkOrders } from "@/lib/workorder/reorder/state";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

function createInitialRepositoryState() {
  const persisted = loadPersistedWorkspaceState();
  if (!persisted) return createInitialSeededWorkorderState();

  return {
    users: persisted.users,
    workOrders: stabilizeWorkOrders(persisted.workOrders),
    historyLogs: persisted.historyLogs,
    selectedId: persisted.selectedId,
    currentUserId: persisted.currentUserId,
    permissionTargetUserId: persisted.permissionTargetUserId,
  };
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function getCurrentWorkspaceState(): WorkorderWorkspaceState {
  return createInitialRepositoryState();
}

function saveWorkspaceStateInternal(payload: WorkorderWorkspaceState): WorkorderWorkspaceState {
  const normalized = {
    ...payload,
    workOrders: stabilizeWorkOrders(payload.workOrders),
  };
  persistWorkspaceState(normalized);
  return cloneValue(normalized);
}

function saveWorkspaceSessionInternal(payload: WorkorderWorkspaceSession): WorkorderWorkspaceSession {
  const current = getCurrentWorkspaceState();
  saveWorkspaceStateInternal({ ...current, ...payload });
  return cloneValue(payload);
}

function saveWorkOrdersInternal(workOrders: WorkOrder[]): WorkOrder[] {
  const normalized = cloneSavedWorkOrders(stabilizeWorkOrders(workOrders));
  const current = getCurrentWorkspaceState();
  saveWorkspaceStateInternal({ ...current, workOrders: normalized });
  return normalized;
}

function saveUsersInternal(users: UserProfile[]): UserProfile[] {
  const normalized = cloneValue(users);
  const current = getCurrentWorkspaceState();
  saveWorkspaceStateInternal({ ...current, users: normalized });
  return normalized;
}

function appendHistoryLogsInternal(historyLogs: HistoryLog[]): HistoryLog[] {
  const normalized = cloneValue(historyLogs);
  const current = getCurrentWorkspaceState();
  saveWorkspaceStateInternal({ ...current, historyLogs: [...normalized, ...current.historyLogs] });
  return normalized;
}

const mockWorkorderRepository: WorkorderRepository = {
  createInitialState: createInitialRepositoryState,
  createInitialStateAsync: async () => createInitialRepositoryState(),
  getInitialUsers: getSeedUsers,
  getInitialWorkOrders: getSeedWorkOrders,
  getInitialHistoryLogs: getSeedHistoryLogs,
  getDefaultSelectedId: () => DEFAULT_SELECTED_WORK_ORDER_ID,
  getDefaultCurrentUserId: () => DEFAULT_CURRENT_USER_ID,
  getDefaultPermissionTargetId: () => DEFAULT_PERMISSION_TARGET_ID,
  loadPersistedState: loadPersistedWorkorderState,
  loadPersistedStateAsync: async () => loadPersistedWorkorderState(),
  persistState: (payload: PersistedWorkOrderState) => {
    persistWorkorderState({ ...payload, workOrders: stabilizeWorkOrders(payload.workOrders) });
  },
  persistStateAsync: async (payload: PersistedWorkOrderState) => {
    persistWorkorderState({ ...payload, workOrders: stabilizeWorkOrders(payload.workOrders) });
  },
  loadWorkspaceState: loadPersistedWorkspaceState,
  loadWorkspaceStateAsync: async () => loadPersistedWorkspaceState(),
  saveWorkspaceState: saveWorkspaceStateInternal,
  saveWorkspaceStateAsync: async (payload) => saveWorkspaceStateInternal(payload),
  saveWorkspaceSession: saveWorkspaceSessionInternal,
  saveWorkspaceSessionAsync: async (payload) => saveWorkspaceSessionInternal(payload),
  createWorkOrder: (workOrder) => {
    const current = getCurrentWorkspaceState();
    saveWorkspaceStateInternal({ ...current, workOrders: [cloneValue(workOrder), ...current.workOrders] });
    return cloneValue(workOrder);
  },
  createWorkOrderAsync: async (workOrder) => {
    const current = getCurrentWorkspaceState();
    saveWorkspaceStateInternal({ ...current, workOrders: [cloneValue(workOrder), ...current.workOrders] });
    return cloneValue(workOrder);
  },
  saveWorkOrder: (workOrder) => {
    const current = getCurrentWorkspaceState();
    saveWorkspaceStateInternal({
      ...current,
      workOrders: current.workOrders.map((item) => (item.id === workOrder.id ? cloneValue(workOrder) : item)),
    });
    return cloneValue(workOrder);
  },
  saveWorkOrderAsync: async (workOrder) => {
    const current = getCurrentWorkspaceState();
    saveWorkspaceStateInternal({
      ...current,
      workOrders: current.workOrders.map((item) => (item.id === workOrder.id ? cloneValue(workOrder) : item)),
    });
    return cloneValue(workOrder);
  },
  saveWorkOrders: saveWorkOrdersInternal,
  saveWorkOrdersAsync: async (workOrders) => saveWorkOrdersInternal(workOrders),
  deleteWorkOrder: (workOrderId) => {
    const current = getCurrentWorkspaceState();
    saveWorkspaceStateInternal({ ...current, workOrders: current.workOrders.filter((item) => item.id !== workOrderId) });
    return workOrderId;
  },
  deleteWorkOrderAsync: async (workOrderId) => {
    const current = getCurrentWorkspaceState();
    saveWorkspaceStateInternal({ ...current, workOrders: current.workOrders.filter((item) => item.id !== workOrderId) });
    return workOrderId;
  },
  appendHistoryLogs: appendHistoryLogsInternal,
  appendHistoryLogsAsync: async (historyLogs) => appendHistoryLogsInternal(historyLogs),
  saveUsers: saveUsersInternal,
  saveUsersAsync: async (users) => saveUsersInternal(users),
  savePermissions: saveUsersInternal,
  savePermissionsAsync: async (users) => saveUsersInternal(users),
};

export function getMockWorkorderRepository(): WorkorderRepository {
  return mockWorkorderRepository;
}
