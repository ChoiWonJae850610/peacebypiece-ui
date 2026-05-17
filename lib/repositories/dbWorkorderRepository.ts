import type {
  InitialWorkorderRepositoryState,
  WorkorderRepository,
} from "@/lib/repositories/workorderRepository";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import { createDbWorkorderRepositoryCapabilities, createWorkorderRepositoryInfo } from "@/lib/repositories/workorderRepositoryCapabilities";

export type DbWorkorderAdapter = WorkorderRepositoryAdapter;

function createNotConfiguredError(methodName: string) {
  return new Error(`DB repository adapter is not configured: ${methodName}`);
}

const EMPTY_DB_WORKORDER_STATE: InitialWorkorderRepositoryState = {
  users: [],
  workOrders: [],
  historyLogs: [],
  selectedId: "",
  currentUserId: "",
  permissionTargetUserId: "",
};


export function createDbWorkorderRepository(
  _baseRepository?: WorkorderRepository,
  adapter?: WorkorderRepositoryAdapter,
): WorkorderRepository {
  const capabilities = createDbWorkorderRepositoryCapabilities(adapter);
  return {
    getRepositoryInfo: () => createWorkorderRepositoryInfo("db", capabilities, Boolean(adapter)),
    createInitialState: (): InitialWorkorderRepositoryState => EMPTY_DB_WORKORDER_STATE,
    createInitialStateAsync: async (): Promise<InitialWorkorderRepositoryState> => {
      const workspaceState = adapter?.loadWorkspaceState ? await adapter.loadWorkspaceState() : null;
      return workspaceState ?? EMPTY_DB_WORKORDER_STATE;
    },
    getInitialUsers: () => EMPTY_DB_WORKORDER_STATE.users,
    getInitialWorkOrders: () => EMPTY_DB_WORKORDER_STATE.workOrders,
    getInitialHistoryLogs: () => EMPTY_DB_WORKORDER_STATE.historyLogs,
    getDefaultSelectedId: () => EMPTY_DB_WORKORDER_STATE.selectedId,
    getDefaultCurrentUserId: () => EMPTY_DB_WORKORDER_STATE.currentUserId,
    getDefaultPermissionTargetId: () => EMPTY_DB_WORKORDER_STATE.permissionTargetUserId,
    loadPersistedState: () => null,
    loadPersistedStateAsync: async () => null,
    persistState: () => undefined,
    persistStateAsync: async () => undefined,
    loadWorkspaceState: () => EMPTY_DB_WORKORDER_STATE,
    loadWorkspaceStateAsync: async () => {
      if (adapter?.loadWorkspaceState) {
        return adapter.loadWorkspaceState();
      }
      return EMPTY_DB_WORKORDER_STATE;
    },
    loadWorkOrderDetail: () => {
      throw createNotConfiguredError("loadWorkOrderDetail");
    },
    loadWorkOrderDetailAsync: async (workOrderId) => {
      if (adapter?.loadWorkOrderDetail) {
        return adapter.loadWorkOrderDetail(workOrderId);
      }
      throw createNotConfiguredError("loadWorkOrderDetail");
    },
    saveWorkspaceState: (payload) => payload,
    saveWorkspaceStateAsync: async (payload) => {
      if (!adapter?.saveWorkspaceState) return payload;
      return adapter.saveWorkspaceState(payload);
    },
    saveWorkspaceSession: (payload) => payload,
    saveWorkspaceSessionAsync: async (payload) => {
      if (!adapter?.saveWorkspaceSession) return payload;
      return adapter.saveWorkspaceSession(payload);
    },
    createWorkOrder: () => {
      throw createNotConfiguredError("createWorkOrder");
    },
    createWorkOrderAsync: async (workOrder) => {
      if (!adapter?.createWorkOrder) throw createNotConfiguredError("createWorkOrder");
      return adapter.createWorkOrder(workOrder);
    },
    saveWorkOrder: () => {
      throw createNotConfiguredError("saveWorkOrder");
    },
    saveWorkOrderAsync: async (workOrder) => {
      if (!adapter?.saveWorkOrder) throw createNotConfiguredError("saveWorkOrder");
      return adapter.saveWorkOrder(workOrder);
    },
    saveWorkOrderStatePatch: () => {
      throw createNotConfiguredError("saveWorkOrderStatePatch");
    },
    saveWorkOrderStatePatchAsync: async (patch) => {
      if (!adapter?.saveWorkOrderStatePatch) throw createNotConfiguredError("saveWorkOrderStatePatch");
      return adapter.saveWorkOrderStatePatch(patch);
    },
    saveWorkOrders: () => {
      throw createNotConfiguredError("saveWorkOrders");
    },
    saveWorkOrdersAsync: async (workOrders) => {
      if (!adapter?.saveWorkOrders) throw createNotConfiguredError("saveWorkOrders");
      return adapter.saveWorkOrders(workOrders);
    },
    deleteWorkOrder: () => {
      throw createNotConfiguredError("deleteWorkOrder");
    },
    deleteWorkOrderAsync: async (workOrderId) => {
      if (!adapter?.deleteWorkOrder) throw createNotConfiguredError("deleteWorkOrder");
      return adapter.deleteWorkOrder(workOrderId);
    },
    appendHistoryLogs: (historyLogs) => historyLogs,
    appendHistoryLogsAsync: async (historyLogs) => {
      if (!adapter?.appendHistoryLogs) return historyLogs;
      return adapter.appendHistoryLogs(historyLogs);
    },
    saveUsers: (users) => users,
    saveUsersAsync: async (users) => {
      if (!adapter?.saveUsers) return users;
      return adapter.saveUsers(users);
    },
    savePermissions: (users) => users,
    savePermissionsAsync: async (users) => {
      if (!adapter?.savePermissions) return users;
      return adapter.savePermissions(users);
    },
  };
}

export function createUnconfiguredDbWorkorderRepository(baseRepository?: WorkorderRepository): WorkorderRepository {
  const repository = createDbWorkorderRepository(baseRepository, {
    loadWorkspaceState: async () => EMPTY_DB_WORKORDER_STATE,
    loadWorkOrderDetail: async () => {
      throw createNotConfiguredError("loadWorkOrderDetail");
    },
    saveWorkspaceState: async () => {
      throw createNotConfiguredError("saveWorkspaceState");
    },
    saveWorkspaceSession: async () => {
      throw createNotConfiguredError("saveWorkspaceSession");
    },
    createWorkOrder: async () => {
      throw createNotConfiguredError("createWorkOrder");
    },
    saveWorkOrder: async () => {
      throw createNotConfiguredError("saveWorkOrder");
    },
    saveWorkOrderStatePatch: async () => {
      throw createNotConfiguredError("saveWorkOrderStatePatch");
    },
    saveWorkOrders: async () => {
      throw createNotConfiguredError("saveWorkOrders");
    },
    deleteWorkOrder: async () => {
      throw createNotConfiguredError("deleteWorkOrder");
    },
    appendHistoryLogs: async () => {
      throw createNotConfiguredError("appendHistoryLogs");
    },
    saveUsers: async () => {
      throw createNotConfiguredError("saveUsers");
    },
    savePermissions: async () => {
      throw createNotConfiguredError("savePermissions");
    },
  });

  return repository;
}
