import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import type { WorkorderRepositoryMode } from "@/lib/repositories/workorderRepositoryMode";
import type { WorkorderRepositoryCapabilities, WorkorderRepositoryInfo } from "@/lib/repositories/workorderRepository";

export function createFullWorkorderRepositoryCapabilities(): WorkorderRepositoryCapabilities {
  return {
    loadWorkspaceState: true,
    loadWorkOrderDetail: true,
    saveWorkspaceState: true,
    saveWorkspaceSession: true,
    createWorkOrder: true,
    saveWorkOrder: true,
    saveWorkOrderStatePatch: true,
    saveWorkOrderInventoryGroupPatch: true,
    saveWorkOrders: true,
    deleteWorkOrder: true,
    appendHistoryLogs: true,
    saveUsers: true,
    savePermissions: true,
  };
}

export function createAdapterBackedWorkorderRepositoryCapabilities(adapter?: WorkorderRepositoryAdapter): WorkorderRepositoryCapabilities {
  return {
    loadWorkspaceState: Boolean(adapter?.loadWorkspaceState),
    loadWorkOrderDetail: Boolean(adapter?.loadWorkOrderDetail),
    saveWorkspaceState: Boolean(adapter?.saveWorkspaceState),
    saveWorkspaceSession: Boolean(adapter?.saveWorkspaceSession),
    createWorkOrder: Boolean(adapter?.createWorkOrder),
    saveWorkOrder: Boolean(adapter?.saveWorkOrder),
    saveWorkOrderStatePatch: Boolean(adapter?.saveWorkOrderStatePatch),
    saveWorkOrderInventoryGroupPatch: Boolean(adapter?.saveWorkOrderInventoryGroupPatch),
    saveWorkOrders: Boolean(adapter?.saveWorkOrders),
    deleteWorkOrder: Boolean(adapter?.deleteWorkOrder),
    appendHistoryLogs: Boolean(adapter?.appendHistoryLogs),
    saveUsers: Boolean(adapter?.saveUsers),
    savePermissions: Boolean(adapter?.savePermissions),
  };
}

export function createWorkorderRepositoryInfo(
  mode: WorkorderRepositoryMode,
  capabilities: WorkorderRepositoryCapabilities,
  adapterConfigured = false,
): WorkorderRepositoryInfo {
  return {
    mode,
    adapterConfigured,
    capabilities,
  };
}

export const createDbWorkorderRepositoryCapabilities = createAdapterBackedWorkorderRepositoryCapabilities;
