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

export function createDbWorkorderRepository(
  fallbackRepository: WorkorderRepository,
  adapter?: WorkorderRepositoryAdapter,
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
    loadWorkOrderDetail: (workOrderId) => fallbackRepository.loadWorkOrderDetail(workOrderId),
    loadWorkOrderDetailAsync: async (workOrderId) => {
      if (adapter?.loadWorkOrderDetail) {
        return adapter.loadWorkOrderDetail(workOrderId);
      }
      return fallbackRepository.loadWorkOrderDetailAsync(workOrderId);
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
    loadWorkOrderDetail: async (workOrderId) => fallbackRepository.loadWorkOrderDetailAsync(workOrderId),
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
