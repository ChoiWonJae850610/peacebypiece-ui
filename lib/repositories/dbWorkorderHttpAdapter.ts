import { createInitialSeededWorkorderState } from "@/lib/data/mock/seedState";
import { mockWorkorderAdapter } from "@/lib/repositories/mockWorkorderRepository";
import { loadPersistedWorkspaceState } from "@/lib/repositories/workorderPersistence";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import { setDbConnectionStatus, type DbConnectionStateCode } from "@/lib/repositories/dbConnectionStatusStore";
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

const LOG_THROTTLE_MS = 5000;
const lastFallbackLogByKey = new Map<string, number>();

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
    /DATABASE_URL is not configured|No supported database env var is configured/i.test(error.message) ||
    /The 'pg' package is required/i.test(error.message) ||
    /relation .*work_orders.* does not exist/i.test(error.message) ||
    isNetworkErrorMessage(error.message)
  );
}


function toStatusCode(error: unknown): DbConnectionStateCode {
  if (!(error instanceof Error)) return "UNKNOWN";

  const errorWithMeta = error as Error & { code?: string };
  if (typeof errorWithMeta.code === "string") {
    return errorWithMeta.code as DbConnectionStateCode;
  }

  if (/DATABASE_URL is not configured|No supported database env var is configured/i.test(error.message)) return "DB_NOT_CONFIGURED";
  if (/The 'pg' package is required/i.test(error.message)) return "DB_DRIVER_MISSING";
  if (/relation .*work_orders.* does not exist/i.test(error.message)) return "DB_TABLE_MISSING";
  if (/Unsupported payload column type/i.test(error.message)) return "DB_SCHEMA_UNSUPPORTED";
  if (/column .* does not exist/i.test(error.message) || /invalid input syntax/i.test(error.message) || /cannot cast/i.test(error.message)) return "DB_SCHEMA_INVALID";
  if (isNetworkErrorMessage(error.message)) return "DB_CONNECTION_FAILED";
  return "DB_REQUEST_FAILED";
}

function reportDbStatus(params: {
  source: "workspace-load" | "create" | "save" | "delete";
  connected: boolean;
  fallbackActive: boolean;
  code: DbConnectionStateCode;
  message?: string | null;
}) {
  setDbConnectionStatus({
    mode: "db",
    configured: params.code !== "DB_NOT_CONFIGURED",
    connected: params.connected,
    driverReady: params.code !== "DB_DRIVER_MISSING",
    fallbackActive: params.fallbackActive,
    source: params.source,
    code: params.code,
    message: params.message ?? null,
    checkedAt: new Date().toISOString(),
  });

  if (process.env.NODE_ENV !== "production" && params.fallbackActive) {
    const logKey = `${params.source}:${params.code}:${params.message ?? ""}`;
    const now = Date.now();
    const lastLoggedAt = lastFallbackLogByKey.get(logKey) ?? 0;

    if (now - lastLoggedAt >= LOG_THROTTLE_MS) {
      lastFallbackLogByKey.set(logKey, now);
      console.warn(`[db fallback] ${params.source}: ${params.code}${params.message ? ` - ${params.message}` : ""}`);
    }
  }
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

        reportDbStatus({ source: "workspace-load", connected: true, fallbackActive: false, code: "READY" });

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

        reportDbStatus({ source: "workspace-load", connected: false, fallbackActive: true, code: toStatusCode(error), message: error instanceof Error ? error.message : null });
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
        reportDbStatus({ source: "create", connected: true, fallbackActive: false, code: "READY" });
        return createdWorkOrder;
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        reportDbStatus({ source: "create", connected: false, fallbackActive: true, code: toStatusCode(error), message: error instanceof Error ? error.message : null });
        return mockWorkorderAdapter.createWorkOrder?.(workOrder) ?? workOrder;
      }
    },
    saveWorkOrder: async (workOrder) => {
      try {
        const response = await fetch("/api/workorders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ workOrder }),
        });

        const { workOrder: savedWorkOrder } = await parseResponse<{ workOrder: WorkOrder }>(response);
        reportDbStatus({ source: "save", connected: true, fallbackActive: false, code: "READY" });
        return savedWorkOrder;
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        reportDbStatus({ source: "save", connected: false, fallbackActive: true, code: toStatusCode(error), message: error instanceof Error ? error.message : null });
        return mockWorkorderAdapter.saveWorkOrder?.(workOrder) ?? workOrder;
      }
    },
    saveWorkOrders: async (workOrders) => {
      try {
        const response = await fetch("/api/workorders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ workOrders }),
        });

        const { workOrders: savedWorkOrders } = await parseResponse<{ workOrders: WorkOrder[] }>(response);
        reportDbStatus({ source: "save", connected: true, fallbackActive: false, code: "READY" });
        return savedWorkOrders;
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        reportDbStatus({ source: "save", connected: false, fallbackActive: true, code: toStatusCode(error), message: error instanceof Error ? error.message : null });
        return mockWorkorderAdapter.saveWorkOrders?.(workOrders) ?? workOrders;
      }
    },

    deleteWorkOrder: async (workOrderId) => {
      try {
        const response = await fetch("/api/workorders", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ workOrderId }),
        });

        const { workOrderId: deletedWorkOrderId } = await parseResponse<{ workOrderId: string }>(response);
        reportDbStatus({ source: "delete", connected: true, fallbackActive: false, code: "READY" });
        return deletedWorkOrderId;
      } catch (error) {
        if (!shouldUseLocalFallback(error)) {
          throw error;
        }

        reportDbStatus({ source: "delete", connected: false, fallbackActive: true, code: toStatusCode(error), message: error instanceof Error ? error.message : null });
        return mockWorkorderAdapter.deleteWorkOrder?.(workOrderId) ?? workOrderId;
      }
    },
  };
}
