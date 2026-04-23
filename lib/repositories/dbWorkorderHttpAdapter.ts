import { createInitialSeededWorkorderState } from "@/lib/data/mock/seedState";
import { mockWorkorderAdapter } from "@/lib/repositories/mockWorkorderRepository";
import { loadPersistedWorkspaceState } from "@/lib/repositories/workorderPersistence";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import type { WorkOrder } from "@/types/workorder";

type DbApiErrorBody = {
  message?: string;
  code?: string;
};

const LOCAL_FALLBACK_ERROR_CODES = new Set([
  "DB_NOT_CONFIGURED",
  "DB_DRIVER_MISSING",
  "DB_CONNECTION_FAILED",
  "DB_TABLE_MISSING",
  "DB_SCHEMA_INVALID",
  "DB_SCHEMA_UNSUPPORTED",
]);

async function parseResponse<T>(response: Response): Promise<T> {
  let body: (T & DbApiErrorBody) | null = null;

  try {
    body = (await response.json()) as T & DbApiErrorBody;
  } catch (error) {
    const parseError = new Error("Failed to parse DB response.") as Error & { code?: string; status?: number; cause?: unknown };
    parseError.code = "DB_RESPONSE_PARSE_FAILED";
    parseError.status = response.status;
    parseError.cause = error;
    throw parseError;
  }

  if (!response.ok) {
    const error = new Error(body?.message ?? "DB request failed.") as Error & { code?: string; status?: number };
    error.code = body?.code;
    error.status = response.status;
    throw error;
  }

  if (!body) {
    const emptyBodyError = new Error("DB response body is empty.") as Error & { code?: string; status?: number };
    emptyBodyError.code = "DB_EMPTY_RESPONSE";
    emptyBodyError.status = response.status;
    throw emptyBodyError;
  }

  return body;
}

function isNetworkErrorMessage(message: string): boolean {
  return /fetch failed|networkerror|network error|load failed|failed to fetch/i.test(message);
}

function shouldUseLocalFallback(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorWithMeta = error as Error & { code?: string; status?: number };

  return (
    (typeof errorWithMeta.code === "string" && (
      LOCAL_FALLBACK_ERROR_CODES.has(errorWithMeta.code) ||
      errorWithMeta.code === "DB_RESPONSE_PARSE_FAILED" ||
      errorWithMeta.code === "DB_EMPTY_RESPONSE"
    )) ||
    errorWithMeta.status === 503 ||
    /DATABASE_URL is not configured/i.test(error.message) ||
    /The 'pg' package is required/i.test(error.message) ||
    /relation .*work_orders.* does not exist/i.test(error.message) ||
    isNetworkErrorMessage(error.message)
  );
}

function loadLocalWorkspaceState() {
  return mockWorkorderAdapter.loadWorkspaceState?.() ?? createInitialSeededWorkorderState();
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
      try {
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
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        return loadLocalWorkspaceState();
      }
    },
    createWorkOrder: async (workOrder) => {
      try {
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
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        return mockWorkorderAdapter.createWorkOrder?.(workOrder) ?? workOrder;
      }
    },
  };
}

