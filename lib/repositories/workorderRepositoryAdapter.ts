import type { HistoryLog, UserProfile, WorkOrder, WorkOrderStatePatch, WorkOrderStatePatchResult } from "@/types/workorder";
import type { WorkorderMutationOptions, WorkorderWorkspaceSession, WorkorderWorkspaceState } from "@/lib/repositories/workorderRepository";

export type WorkorderRepositoryAdapter = {
  loadWorkspaceState?(): Promise<WorkorderWorkspaceState | null>;
  loadWorkOrderDetail?(workOrderId: string): Promise<WorkOrder>;
  saveWorkspaceState?(payload: WorkorderWorkspaceState): Promise<WorkorderWorkspaceState>;
  saveWorkspaceSession?(payload: WorkorderWorkspaceSession): Promise<WorkorderWorkspaceSession>;
  createWorkOrder?(workOrder: WorkOrder): Promise<WorkOrder>;
  saveWorkOrder?(workOrder: WorkOrder, options?: WorkorderMutationOptions): Promise<WorkOrder>;
  saveWorkOrderStatePatch?(patch: WorkOrderStatePatch): Promise<WorkOrderStatePatchResult>;
  saveWorkOrders?(workOrders: WorkOrder[], options?: WorkorderMutationOptions): Promise<WorkOrder[]>;
  deleteWorkOrder?(workOrderId: string): Promise<string>;
  appendHistoryLogs?(historyLogs: HistoryLog[]): Promise<HistoryLog[]>;
  saveUsers?(users: UserProfile[]): Promise<UserProfile[]>;
  savePermissions?(users: UserProfile[]): Promise<UserProfile[]>;
};
