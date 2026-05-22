import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export type PersistedWorkOrderState = {
  users: UserProfile[];
  currentUser?: UserProfile | null;
  workOrders: WorkOrder[];
  historyLogs: HistoryLog[];
  selectedId: string;
  currentUserId: string;
  permissionTargetUserId: string;
};

export type MockWorkOrderSource = {
  workOrders: WorkOrder[];
  historyLogs: HistoryLog[];
  defaultSelectedId: string;
};

export type MockUserSource = {
  users: UserProfile[];
  defaultCurrentUserId: string;
  defaultPermissionTargetId: string;
};
