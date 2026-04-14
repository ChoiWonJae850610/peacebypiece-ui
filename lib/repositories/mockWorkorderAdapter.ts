import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import type { WorkorderWorkspaceSession, WorkorderWorkspaceState } from "@/lib/repositories/workorderRepository";

type MockWorkorderAdapterHandlers = {
  loadWorkspaceState(): WorkorderWorkspaceState | null;
  saveWorkspaceState(payload: WorkorderWorkspaceState): WorkorderWorkspaceState;
  saveWorkspaceSession(payload: WorkorderWorkspaceSession): WorkorderWorkspaceSession;
  createWorkOrder(workOrder: WorkOrder): WorkOrder;
  saveWorkOrder(workOrder: WorkOrder): WorkOrder;
  saveWorkOrders(workOrders: WorkOrder[]): WorkOrder[];
  deleteWorkOrder(workOrderId: string): string;
  appendHistoryLogs(historyLogs: HistoryLog[]): HistoryLog[];
  saveUsers(users: UserProfile[]): UserProfile[];
  savePermissions(users: UserProfile[]): UserProfile[];
};

export function createMockWorkorderAdapter(handlers: MockWorkorderAdapterHandlers): WorkorderRepositoryAdapter {
  return {
    loadWorkspaceState: async () => handlers.loadWorkspaceState(),
    saveWorkspaceState: async (payload) => handlers.saveWorkspaceState(payload),
    saveWorkspaceSession: async (payload) => handlers.saveWorkspaceSession(payload),
    createWorkOrder: async (workOrder) => handlers.createWorkOrder(workOrder),
    saveWorkOrder: async (workOrder) => handlers.saveWorkOrder(workOrder),
    saveWorkOrders: async (workOrders) => handlers.saveWorkOrders(workOrders),
    deleteWorkOrder: async (workOrderId) => handlers.deleteWorkOrder(workOrderId),
    appendHistoryLogs: async (historyLogs) => handlers.appendHistoryLogs(historyLogs),
    saveUsers: async (users) => handlers.saveUsers(users),
    savePermissions: async (users) => handlers.savePermissions(users),
  };
}
