import {
  createSeededWorkorderState,
  getDefaultCurrentUserId,
  getDefaultPermissionTargetId,
  getDefaultSelectedId,
  getInitialHistoryLogs,
  getInitialUsers,
  getInitialWorkOrders,
  saveWorkOrders,
} from "@/lib/data/workorderMockData";
import type { PersistedWorkOrderState } from "@/lib/data/mock/types";
import { loadPersistedWorkorderState, persistWorkorderState } from "@/lib/repositories/workorderPersistence";
import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";

function createInitialRepositoryState() {
  const persisted = loadPersistedWorkorderState();
  if (!persisted) return createSeededWorkorderState();

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
  getInitialUsers,
  getInitialWorkOrders,
  getInitialHistoryLogs,
  getDefaultSelectedId,
  getDefaultCurrentUserId,
  getDefaultPermissionTargetId,
  loadPersistedState: loadPersistedWorkorderState,
  persistState: (payload: PersistedWorkOrderState) => {
    persistWorkorderState(payload);
  },
  saveWorkOrders,
};

export function getMockWorkorderRepository(): WorkorderRepository {
  return mockWorkorderRepository;
}
