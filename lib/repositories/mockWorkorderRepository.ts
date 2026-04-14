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
import { normalizeWorkOrderDataList } from "@/lib/workorder/normalization";
import { normalizeWorkOrderCollectionsForStorage, normalizeWorkOrderCollectionsListForStorage } from "@/lib/workorder/structure";
import { createFullWorkorderRepositoryCapabilities, createWorkorderRepositoryInfo } from "@/lib/repositories/workorderRepositoryCapabilities";
import { createMockWorkorderAdapter } from "@/lib/repositories/mockWorkorderAdapter";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

function createInitialRepositoryState() {
  const persisted = loadPersistedWorkspaceState();
  if (!persisted) return createInitialSeededWorkorderState();

  return {
    users: persisted.users,
    workOrders: stabilizeWorkOrders(normalizeWorkOrderDataList(persisted.workOrders)),
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
    workOrders: stabilizeWorkOrders(normalizeWorkOrderCollectionsListForStorage(payload.workOrders)),
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
  const normalized = cloneSavedWorkOrders(stabilizeWorkOrders(normalizeWorkOrderCollectionsListForStorage(workOrders)));
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



export const mockWorkorderAdapter = createMockWorkorderAdapter({
  loadWorkspaceState: getCurrentWorkspaceState,
  saveWorkspaceState: saveWorkspaceStateInternal,
  saveWorkspaceSession: saveWorkspaceSessionInternal,
  createWorkOrder: (workOrder) => {
    const current = getCurrentWorkspaceState();
    const normalizedWorkOrder = normalizeWorkOrderCollectionsForStorage(cloneValue(workOrder));
    saveWorkspaceStateInternal({ ...current, workOrders: [normalizedWorkOrder, ...current.workOrders] });
    return cloneValue(normalizedWorkOrder);
  },
  saveWorkOrder: (workOrder) => {
    const current = getCurrentWorkspaceState();
    const normalizedWorkOrder = normalizeWorkOrderCollectionsForStorage(cloneValue(workOrder));
    saveWorkspaceStateInternal({
      ...current,
      workOrders: current.workOrders.map((item) => (item.id === workOrder.id ? normalizedWorkOrder : item)),
    });
    return cloneValue(normalizedWorkOrder);
  },
  saveWorkOrders: saveWorkOrdersInternal,
  deleteWorkOrder: (workOrderId) => {
    const current = getCurrentWorkspaceState();
    saveWorkspaceStateInternal({ ...current, workOrders: current.workOrders.filter((item) => item.id !== workOrderId) });
    return workOrderId;
  },
  appendHistoryLogs: appendHistoryLogsInternal,
  saveUsers: saveUsersInternal,
  savePermissions: saveUsersInternal,
});

function createMockWorkorderRepository(adapter: WorkorderRepositoryAdapter = mockWorkorderAdapter): WorkorderRepository {
  return {
    getRepositoryInfo: () => createWorkorderRepositoryInfo("mock", createFullWorkorderRepositoryCapabilities(), true),
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
    persistWorkorderState({ ...payload, workOrders: stabilizeWorkOrders(normalizeWorkOrderCollectionsListForStorage(payload.workOrders)) });
  },
  persistStateAsync: async (payload: PersistedWorkOrderState) => {
    persistWorkorderState({ ...payload, workOrders: stabilizeWorkOrders(normalizeWorkOrderCollectionsListForStorage(payload.workOrders)) });
  },
  loadWorkspaceState: loadPersistedWorkspaceState,
  loadWorkspaceStateAsync: async () => adapter.loadWorkspaceState?.() ?? loadPersistedWorkspaceState(),
  saveWorkspaceState: saveWorkspaceStateInternal,
  saveWorkspaceStateAsync: async (payload) => adapter.saveWorkspaceState?.(payload) ?? saveWorkspaceStateInternal(payload),
  saveWorkspaceSession: saveWorkspaceSessionInternal,
  saveWorkspaceSessionAsync: async (payload) => adapter.saveWorkspaceSession?.(payload) ?? saveWorkspaceSessionInternal(payload),
  createWorkOrder: (workOrder) => {
    const current = getCurrentWorkspaceState();
    const normalizedWorkOrder = normalizeWorkOrderCollectionsForStorage(cloneValue(workOrder));
    saveWorkspaceStateInternal({ ...current, workOrders: [normalizedWorkOrder, ...current.workOrders] });
    return cloneValue(normalizedWorkOrder);
  },
  createWorkOrderAsync: async (workOrder) => adapter.createWorkOrder?.(workOrder) ?? cloneValue(workOrder),
  saveWorkOrder: (workOrder) => {
    const current = getCurrentWorkspaceState();
    const normalizedWorkOrder = normalizeWorkOrderCollectionsForStorage(cloneValue(workOrder));
    saveWorkspaceStateInternal({
      ...current,
      workOrders: current.workOrders.map((item) => (item.id === workOrder.id ? normalizedWorkOrder : item)),
    });
    return cloneValue(normalizedWorkOrder);
  },
  saveWorkOrderAsync: async (workOrder) => adapter.saveWorkOrder?.(workOrder) ?? cloneValue(workOrder),
  saveWorkOrders: saveWorkOrdersInternal,
  saveWorkOrdersAsync: async (workOrders) => adapter.saveWorkOrders?.(workOrders) ?? saveWorkOrdersInternal(workOrders),
  deleteWorkOrder: (workOrderId) => {
    const current = getCurrentWorkspaceState();
    saveWorkspaceStateInternal({ ...current, workOrders: current.workOrders.filter((item) => item.id !== workOrderId) });
    return workOrderId;
  },
  deleteWorkOrderAsync: async (workOrderId) => adapter.deleteWorkOrder?.(workOrderId) ?? workOrderId,
  appendHistoryLogs: appendHistoryLogsInternal,
  appendHistoryLogsAsync: async (historyLogs) => adapter.appendHistoryLogs?.(historyLogs) ?? appendHistoryLogsInternal(historyLogs),
  saveUsers: saveUsersInternal,
  saveUsersAsync: async (users) => adapter.saveUsers?.(users) ?? saveUsersInternal(users),
  savePermissions: saveUsersInternal,
  savePermissionsAsync: async (users) => adapter.savePermissions?.(users) ?? saveUsersInternal(users),
  };
}

const defaultMockWorkorderRepository = createMockWorkorderRepository();

export function getMockWorkorderRepository(adapter?: WorkorderRepositoryAdapter): WorkorderRepository {
  if (!adapter || adapter === mockWorkorderAdapter) {
    return defaultMockWorkorderRepository;
  }
  return createMockWorkorderRepository(adapter);
}
