import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";
import type {
  InitialWorkorderRepositoryState,
  WorkorderRepository,
  WorkorderWorkspaceSession,
  WorkorderWorkspaceState,
} from "@/lib/repositories/workorderRepository";
import { createDbWorkorderRepositoryCapabilities, createWorkorderRepositoryInfo } from "@/lib/repositories/workorderRepositoryCapabilities";

export type DbWorkorderAdapter = {
  loadWorkspaceState?(): Promise<WorkorderWorkspaceState | null>;
  saveWorkspaceState?(payload: WorkorderWorkspaceState): Promise<WorkorderWorkspaceState>;
  saveWorkspaceSession?(payload: WorkorderWorkspaceSession): Promise<WorkorderWorkspaceSession>;
  createWorkOrder?(workOrder: WorkOrder): Promise<WorkOrder>;
  saveWorkOrder?(workOrder: WorkOrder): Promise<WorkOrder>;
  saveWorkOrders?(workOrders: WorkOrder[]): Promise<WorkOrder[]>;
  deleteWorkOrder?(workOrderId: string): Promise<string>;
  appendHistoryLogs?(historyLogs: HistoryLog[]): Promise<HistoryLog[]>;
  saveUsers?(users: UserProfile[]): Promise<UserProfile[]>;
  savePermissions?(users: UserProfile[]): Promise<UserProfile[]>;
};

function createNotConfiguredError(methodName: string) {
  return new Error(`DB repository adapter is not configured: ${methodName}`);
}

export function createDbWorkorderRepository(
  fallbackRepository: WorkorderRepository,
  adapter?: DbWorkorderAdapter,
): WorkorderRepository {
  const capabilities = createDbWorkorderRepositoryCapabilities(adapter);
  return {
    getRepositoryInfo: () => createWorkorderRepositoryInfo("db", capabilities, Boolean(adapter)),
    createInitialState: (): InitialWorkorderRepositoryState => fallbackRepository.createInitialState(),
    createInitialStateAsync: async (): Promise<InitialWorkorderRepositoryState> => {
      const workspaceState = adapter?.loadWorkspaceState ? await adapter.loadWorkspaceState() : null;
      return workspaceState ?? fallbackRepository.createInitialState();
    },
    getInitialUsers: () => fallbackRepository.getInitialUsers(),
    getInitialWorkOrders: () => fallbackRepository.getInitialWorkOrders(),
    getInitialHistoryLogs: () => fallbackRepository.getInitialHistoryLogs(),
    getDefaultSelectedId: () => fallbackRepository.getDefaultSelectedId(),
    getDefaultCurrentUserId: () => fallbackRepository.getDefaultCurrentUserId(),
    getDefaultPermissionTargetId: () => fallbackRepository.getDefaultPermissionTargetId(),
    loadPersistedState: () => fallbackRepository.loadPersistedState(),
    loadPersistedStateAsync: async () => fallbackRepository.loadPersistedStateAsync(),
    persistState: (payload) => fallbackRepository.persistState(payload),
    persistStateAsync: async (payload) => fallbackRepository.persistStateAsync(payload),
    loadWorkspaceState: () => fallbackRepository.loadWorkspaceState(),
    loadWorkspaceStateAsync: async () => {
      if (adapter?.loadWorkspaceState) {
        return adapter.loadWorkspaceState();
      }
      return fallbackRepository.loadWorkspaceStateAsync();
    },
    saveWorkspaceState: (payload) => fallbackRepository.saveWorkspaceState(payload),
    saveWorkspaceStateAsync: async (payload) => {
      if (!adapter?.saveWorkspaceState) return fallbackRepository.saveWorkspaceStateAsync(payload);
      return adapter.saveWorkspaceState(payload);
    },
    saveWorkspaceSession: (payload) => fallbackRepository.saveWorkspaceSession(payload),
    saveWorkspaceSessionAsync: async (payload) => {
      if (!adapter?.saveWorkspaceSession) return fallbackRepository.saveWorkspaceSessionAsync(payload);
      return adapter.saveWorkspaceSession(payload);
    },
    createWorkOrder: (workOrder) => fallbackRepository.createWorkOrder(workOrder),
    createWorkOrderAsync: async (workOrder) => {
      if (!adapter?.createWorkOrder) return fallbackRepository.createWorkOrderAsync(workOrder);
      return adapter.createWorkOrder(workOrder);
    },
    saveWorkOrder: (workOrder) => fallbackRepository.saveWorkOrder(workOrder),
    saveWorkOrderAsync: async (workOrder) => {
      if (!adapter?.saveWorkOrder) return fallbackRepository.saveWorkOrderAsync(workOrder);
      return adapter.saveWorkOrder(workOrder);
    },
    saveWorkOrders: (workOrders) => fallbackRepository.saveWorkOrders(workOrders),
    saveWorkOrdersAsync: async (workOrders) => {
      if (!adapter?.saveWorkOrders) return fallbackRepository.saveWorkOrdersAsync(workOrders);
      return adapter.saveWorkOrders(workOrders);
    },
    deleteWorkOrder: (workOrderId) => fallbackRepository.deleteWorkOrder(workOrderId),
    deleteWorkOrderAsync: async (workOrderId) => {
      if (!adapter?.deleteWorkOrder) return fallbackRepository.deleteWorkOrderAsync(workOrderId);
      return adapter.deleteWorkOrder(workOrderId);
    },
    appendHistoryLogs: (historyLogs) => fallbackRepository.appendHistoryLogs(historyLogs),
    appendHistoryLogsAsync: async (historyLogs) => {
      if (!adapter?.appendHistoryLogs) return fallbackRepository.appendHistoryLogsAsync(historyLogs);
      return adapter.appendHistoryLogs(historyLogs);
    },
    saveUsers: (users) => fallbackRepository.saveUsers(users),
    saveUsersAsync: async (users) => {
      if (!adapter?.saveUsers) return fallbackRepository.saveUsersAsync(users);
      return adapter.saveUsers(users);
    },
    savePermissions: (users) => fallbackRepository.savePermissions(users),
    savePermissionsAsync: async (users) => {
      if (!adapter?.savePermissions) return fallbackRepository.savePermissionsAsync(users);
      return adapter.savePermissions(users);
    },
  };
}

export function createUnconfiguredDbWorkorderRepository(fallbackRepository: WorkorderRepository): WorkorderRepository {
  const repository = createDbWorkorderRepository(fallbackRepository, {
    loadWorkspaceState: async () => fallbackRepository.loadWorkspaceStateAsync(),
    saveWorkspaceState: async (payload) => {
      throw createNotConfiguredError("saveWorkspaceState");
    },
    saveWorkspaceSession: async (payload) => {
      throw createNotConfiguredError("saveWorkspaceSession");
    },
    createWorkOrder: async (workOrder) => {
      throw createNotConfiguredError("createWorkOrder");
    },
    saveWorkOrder: async (workOrder) => {
      throw createNotConfiguredError("saveWorkOrder");
    },
    saveWorkOrders: async (workOrders) => {
      throw createNotConfiguredError("saveWorkOrders");
    },
    deleteWorkOrder: async (workOrderId) => {
      throw createNotConfiguredError("deleteWorkOrder");
    },
    appendHistoryLogs: async (historyLogs) => {
      throw createNotConfiguredError("appendHistoryLogs");
    },
    saveUsers: async (users) => {
      throw createNotConfiguredError("saveUsers");
    },
    savePermissions: async (users) => {
      throw createNotConfiguredError("savePermissions");
    },
  });

  return repository;
}
