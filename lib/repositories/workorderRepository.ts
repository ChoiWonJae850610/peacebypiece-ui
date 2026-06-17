import type { PersistedWorkOrderState } from "@/lib/data/mock/types";
import type { WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import type { HistoryLog, UserProfile, WorkOrder, WorkOrderStatePatch, WorkOrderStatePatchResult, WorkOrderInventoryGroupPatchRequest, WorkOrderInventoryGroupPatchResult } from "@/types/workorder";

export type WorkorderWorkspaceState = PersistedWorkOrderState;

export type WorkorderWorkspaceSession = Pick<
  WorkorderWorkspaceState,
  "selectedId" | "currentUserId" | "permissionTargetUserId"
>;

export type InitialWorkorderRepositoryState = WorkorderWorkspaceState;

export type WorkorderRepositoryCapabilities = {
  loadWorkspaceState: boolean;
  loadWorkOrderDetail: boolean;
  saveWorkspaceState: boolean;
  saveWorkspaceSession: boolean;
  createWorkOrder: boolean;
  saveWorkOrder: boolean;
  saveWorkOrderStatePatch: boolean;
  saveWorkOrderInventoryGroupPatch: boolean;
  saveWorkOrders: boolean;
  deleteWorkOrder: boolean;
  appendHistoryLogs: boolean;
  saveUsers: boolean;
  savePermissions: boolean;
};

export type WorkorderMutationOptions = {
  serviceCode?: WorkOrderServiceCodeValue | null;
  auditActor?: Pick<UserProfile, "id" | "name" | "role"> | null;
};

export type WorkorderRepositoryInfo = {
  mode: "db";
  adapterConfigured: boolean;
  capabilities: WorkorderRepositoryCapabilities;
};

export type RepositoryAsyncStatus = "idle" | "loading" | "ready" | "error";

export type WorkorderRepository = {
  getRepositoryInfo(): WorkorderRepositoryInfo;
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
  loadWorkspaceState(): WorkorderWorkspaceState | null;
  loadWorkspaceStateAsync(): Promise<WorkorderWorkspaceState | null>;
  loadWorkOrderDetail(workOrderId: string): WorkOrder;
  loadWorkOrderDetailAsync(workOrderId: string): Promise<WorkOrder>;
  saveWorkspaceState(payload: WorkorderWorkspaceState): WorkorderWorkspaceState;
  saveWorkspaceStateAsync(payload: WorkorderWorkspaceState): Promise<WorkorderWorkspaceState>;
  saveWorkspaceSession(payload: WorkorderWorkspaceSession): WorkorderWorkspaceSession;
  saveWorkspaceSessionAsync(payload: WorkorderWorkspaceSession): Promise<WorkorderWorkspaceSession>;
  createWorkOrder(workOrder: WorkOrder): WorkOrder;
  createWorkOrderAsync(workOrder: WorkOrder): Promise<WorkOrder>;
  saveWorkOrder(workOrder: WorkOrder, options?: WorkorderMutationOptions): WorkOrder;
  saveWorkOrderAsync(workOrder: WorkOrder, options?: WorkorderMutationOptions): Promise<WorkOrder>;
  saveWorkOrderStatePatch(patch: WorkOrderStatePatch): WorkOrderStatePatchResult;
  saveWorkOrderStatePatchAsync(patch: WorkOrderStatePatch): Promise<WorkOrderStatePatchResult>;
  saveWorkOrderInventoryGroupPatchAsync(payload: WorkOrderInventoryGroupPatchRequest): Promise<WorkOrderInventoryGroupPatchResult>;
  saveWorkOrders(workOrders: WorkOrder[], options?: WorkorderMutationOptions): WorkOrder[];
  saveWorkOrdersAsync(workOrders: WorkOrder[], options?: WorkorderMutationOptions): Promise<WorkOrder[]>;
  deleteWorkOrder(workOrderId: string): string;
  deleteWorkOrderAsync(workOrderId: string): Promise<string>;
  appendHistoryLogs(historyLogs: HistoryLog[]): HistoryLog[];
  appendHistoryLogsAsync(historyLogs: HistoryLog[]): Promise<HistoryLog[]>;
  saveUsers(users: UserProfile[]): UserProfile[];
  saveUsersAsync(users: UserProfile[]): Promise<UserProfile[]>;
  savePermissions(users: UserProfile[]): UserProfile[];
  savePermissionsAsync(users: UserProfile[]): Promise<UserProfile[]>;
};
