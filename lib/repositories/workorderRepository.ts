import type { PersistedWorkOrderState } from "@/lib/data/mock/types";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export type InitialWorkorderRepositoryState = {
  users: UserProfile[];
  workOrders: WorkOrder[];
  historyLogs: HistoryLog[];
  selectedId: string;
  currentUserId: string;
  permissionTargetUserId: string;
};

export type WorkorderRepository = {
  createInitialState(): InitialWorkorderRepositoryState;
  getInitialUsers(): UserProfile[];
  getInitialWorkOrders(): WorkOrder[];
  getInitialHistoryLogs(): HistoryLog[];
  getDefaultSelectedId(): string;
  getDefaultCurrentUserId(): string;
  getDefaultPermissionTargetId(): string;
  loadPersistedState(): PersistedWorkOrderState | null;
  persistState(payload: PersistedWorkOrderState): void;
  saveWorkOrders(workOrders: WorkOrder[]): WorkOrder[];
};
