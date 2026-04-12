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
import { loadPersistedWorkorderState, persistWorkorderState } from "@/lib/repositories/workorderPersistence";
import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";

function createInitialRepositoryState() {
  const persisted = loadPersistedWorkorderState();
  if (!persisted) return createInitialSeededWorkorderState();

  return {
    users: persisted.users,
    workOrders: persisted.workOrders,
    historyLogs: persisted.historyLogs,
    selectedId: persisted.selectedId,
    currentUserId: persisted.currentUserId,
    permissionTargetUserId: persisted.permissionTargetUserId,
  };
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
    persistWorkorderState(payload);
  },
  persistStateAsync: async (payload: PersistedWorkOrderState) => {
    persistWorkorderState(payload);
  },
  saveWorkOrders: cloneSavedWorkOrders,
  saveWorkOrdersAsync: async (workOrders) => cloneSavedWorkOrders(workOrders),
};

export function getMockWorkorderRepository(): WorkorderRepository {
  return mockWorkorderRepository;
}
