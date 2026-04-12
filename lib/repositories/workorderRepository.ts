import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export type WorkorderRepository = {
  getInitialUsers(): UserProfile[];
  getInitialWorkOrders(): WorkOrder[];
  getInitialHistoryLogs(): HistoryLog[];
  getDefaultSelectedId(): string;
  getDefaultCurrentUserId(): string;
  getDefaultPermissionTargetId(): string;
  saveWorkOrders(workOrders: WorkOrder[]): WorkOrder[];
};
