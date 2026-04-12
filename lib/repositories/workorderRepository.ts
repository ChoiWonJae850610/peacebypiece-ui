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

export type RepositoryAsyncStatus = "idle" | "loading" | "ready" | "error";

export type WorkorderRepository = {
  createInitialState(): InitialWorkorderRepositoryState;
  createInitialStateAsync(): Promise<InitialWorkorderRepositoryState>;
  getInitialUsers(): UserProfile[];
  getInitialWorkOrders(): WorkOrder[];
  getInitialHistoryLogs(): HistoryLog[];
  getDefaultSelectedId(): string;
  getDefaultCurrentUserId(): string;
  getDefaultPermissionTargetId(): string;
  loadPersistedState(): PersistedWorkOrderState | null;
  loadPersistedStateAsync(): Promise<PersistedWorkOrderState | null>;
  persistState(payload: PersistedWorkOrderState): void;
  persistStateAsync(payload: PersistedWorkOrderState): Promise<void>;
  saveWorkOrders(workOrders: WorkOrder[]): WorkOrder[];
  saveWorkOrdersAsync(workOrders: WorkOrder[]): Promise<WorkOrder[]>;
};
