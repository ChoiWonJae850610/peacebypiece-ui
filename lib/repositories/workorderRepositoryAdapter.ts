import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";
import type { WorkorderWorkspaceSession, WorkorderWorkspaceState } from "@/lib/repositories/workorderRepository";

export type WorkorderRepositoryAdapter = {
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
