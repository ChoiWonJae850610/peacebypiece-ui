import type { RoleTemplate, RoleType } from "@/types/permission";
import type { HistoryLog, UserProfile, WorkOrder, WorkflowState } from "@/types/workorder";

export type RolePermissionTemplates = Record<RoleType, RoleTemplate>;

export type PersistedWorkOrderState = {
  workOrders: WorkOrder[];
  selectedId: string;
  users: UserProfile[];
  currentUserId: string;
  rolePermissionTemplates: RolePermissionTemplates;
  workflowStateById: Record<string, WorkflowState>;
  inventoryQuantityById: Record<string, number>;
  historyLogsById: Record<string, HistoryLog[]>;
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
