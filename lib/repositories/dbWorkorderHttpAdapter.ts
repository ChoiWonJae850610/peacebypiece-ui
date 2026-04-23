import { createInitialSeededWorkorderState } from "@/lib/data/mock/seedState";
import { loadPersistedWorkspaceState } from "@/lib/repositories/workorderPersistence";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import type { WorkOrder } from "@/types/workorder";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { message?: string };

  if (!response.ok) {
    throw new Error(body.message ?? "DB request failed.");
  }

  return body;
}

function resolveSelectedId(workOrders: WorkOrder[], persistedSelectedId: string | null | undefined, defaultSelectedId: string) {
  if (persistedSelectedId && workOrders.some((item) => item.id === persistedSelectedId)) {
    return persistedSelectedId;
  }

  return workOrders[0]?.id ?? defaultSelectedId;
}

export function createDbWorkorderHttpAdapter(): WorkorderRepositoryAdapter {
  return {
    loadWorkspaceState: async () => {
      const response = await fetch("/api/workorders", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const { workOrders } = await parseResponse<{ workOrders: WorkOrder[] }>(response);
      const seededState = createInitialSeededWorkorderState();
      const persistedState = loadPersistedWorkspaceState();
      const selectedId = resolveSelectedId(
        workOrders,
        persistedState?.selectedId,
        seededState.selectedId,
      );

      return {
        users: persistedState?.users ?? seededState.users,
        historyLogs: persistedState?.historyLogs ?? seededState.historyLogs,
        currentUserId: persistedState?.currentUserId ?? seededState.currentUserId,
        permissionTargetUserId: persistedState?.permissionTargetUserId ?? seededState.permissionTargetUserId,
        selectedId,
        workOrders,
      };
    },
    createWorkOrder: async (workOrder) => {
      const response = await fetch("/api/workorders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ workOrder }),
      });

      const { workOrder: createdWorkOrder } = await parseResponse<{ workOrder: WorkOrder }>(response);
      return createdWorkOrder;
    },
  };
}
