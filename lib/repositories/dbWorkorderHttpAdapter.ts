import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import {
  setDbConnectionStatus,
  type DbConnectionStateCode,
} from "@/lib/repositories/dbConnectionStatusStore";
import type {
  MemoThread,
  UserProfile,
  WorkOrder,
  WorkOrderStatePatch,
  WorkOrderStatePatchResult,
  WorkOrderSummary,
} from "@/types/workorder";
import {
  DEFAULT_WORK_ORDER_LIST_SORT,
  DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
  normalizeWorkOrderListSort,
  normalizeWorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import {
  createWorkOrderSessionProfile,
  ensureWorkOrderSessionProfile,
  resolveWorkOrderSessionUserId,
  type WorkOrderSessionUser,
} from "@/lib/workorder/sessionUserProfile";
import {
  markWorkOrderDetailSnapshot,
  markWorkOrderSummarySnapshot,
} from "@/lib/workorder/workOrderHydration";

type DbApiErrorBody = {
  message?: string;
  code?: string;
};

type WorkOrderSummaryLoadResponse = {
  workOrders?: WorkOrderSummary[];
  error?: string;
  message?: string;
};

type WorkOrderDetailLoadResponse = {
  workOrder?: WorkOrder;
  error?: string;
  message?: string;
};

type WorkOrderStatePatchResponse = {
  patch?: WorkOrderStatePatchResult;
  workOrder?: WorkOrder;
  error?: string;
  message?: string;
};

type MemoLoadResponse = {
  memoThreads?: MemoThread[];
  error?: string;
  message?: string;
};

type UserAccessResponse = {
  ok?: boolean;
  users?: UserProfile[];
  sourceState?: string;
  error?: string;
  message?: string;
};

type CurrentUserResponse = {
  authenticated?: boolean;
  user?: WorkOrderSessionUser | null;
};

async function loadCurrentUserFromSession(): Promise<CurrentUserResponse["user"] | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const result = await parseResponse<CurrentUserResponse>(response);
    return result.authenticated && result.user?.id ? result.user : null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[session hydration]",
        error instanceof Error ? error.message : error,
      );
    }
    return null;
  }
}

function mergeMemoThreads(
  payloadThreads: MemoThread[] | undefined,
  dbThreads: MemoThread[] | undefined,
): MemoThread[] {
  const merged = new Map<string, MemoThread>();

  for (const thread of payloadThreads ?? []) {
    merged.set(thread.id, thread);
  }

  for (const thread of dbThreads ?? []) {
    merged.set(thread.id, thread);
  }

  return Array.from(merged.values());
}

function createSummaryWorkOrder(summary: WorkOrderSummary): WorkOrder {
  return {
    id: summary.id,
    title: summary.title,
    displayTitle: summary.displayTitle,
    baseTitle: summary.baseTitle,
    workOrderKind: summary.workOrderKind,
    isDefectOrder: summary.isDefectOrder,
    reorderGroupId: summary.reorderGroupId,
    reorderRound: summary.reorderRound,
    parentSpecSheetId: summary.parentSpecSheetId,
    category1: summary.category1,
    category2: summary.category2,
    category3: summary.category3,
    category1Id: summary.category1Id,
    category2Id: summary.category2Id,
    category3Id: summary.category3Id,
    season: summary.season,
    priority: summary.priority,
    vendor: summary.vendor,
    manager: summary.manager,
    managerId: summary.managerId,
    createdById: summary.createdById,
    createdByRole: summary.createdByRole,
    dueDate: summary.dueDate,
    quantity: summary.quantity,
    laborCost: 0,
    lossCost: 0,
    orderEntries: [],
    inventoryQuantity: summary.inventoryQuantity,
    inventoryStatus: summary.inventoryStatus,
    memo: "",
    materials: [],
    outsourcing: [],
    attachments: [],
    memoThreads: [],
    workflowState: summary.workflowState,
    lastSavedAt: summary.lastSavedAt,
    factoryOrderRequest: null,
    hasDetailSnapshot: false,
    summaryAttachmentCount: summary.attachmentCount,
    summaryMemoThreadCount: summary.memoThreadCount,
  };
}

function buildSummaryQueryStringFromLocation(): string {
  if (typeof window === "undefined") {
    return `?status=${DEFAULT_WORK_ORDER_LIST_STATUS_FILTER}&sort=${DEFAULT_WORK_ORDER_LIST_SORT}`;
  }

  const params = new URLSearchParams(window.location.search);
  const status = params.has("status")
    ? normalizeWorkOrderListStatusFilter(params.get("status"))
    : params.has("workOrderId")
      ? "all"
      : DEFAULT_WORK_ORDER_LIST_STATUS_FILTER;
  const sort = normalizeWorkOrderListSort(params.get("sort"));

  return `?status=${encodeURIComponent(status)}&sort=${encodeURIComponent(sort)}`;
}


async function loadUserProfilesForWorkspace(): Promise<UserProfile[]> {
  const response = await fetch("/api/admin/settings/users", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const result = await parseResponse<UserAccessResponse>(response);
  return Array.isArray(result.users) ? result.users : [];
}

async function loadWorkOrderSummariesFromApi(): Promise<WorkOrder[]> {
  const response = await fetch(
    `/api/workorders/summary${buildSummaryQueryStringFromLocation()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const result = await parseResponse<WorkOrderSummaryLoadResponse>(response);
  return (result.workOrders ?? []).map((summary) => markWorkOrderSummarySnapshot(createSummaryWorkOrder(summary)));
}

async function loadWorkOrderDetailFromApi(
  workOrderId: string,
): Promise<WorkOrder> {
  const response = await fetch(
    `/api/workorders/${encodeURIComponent(workOrderId)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const result = await parseResponse<WorkOrderDetailLoadResponse>(response);

  if (!result.workOrder) {
    const emptyBodyError = new Error(
      "DB work order detail response is empty.",
    ) as Error & { code?: string };
    emptyBodyError.code = "DB_EMPTY_RESPONSE";
    throw emptyBodyError;
  }

  return markWorkOrderDetailSnapshot(result.workOrder);
}

async function saveWorkOrderStatePatchToApi(
  patch: WorkOrderStatePatch,
): Promise<WorkOrder> {
  const response = await fetch(
    `/api/workorders/${encodeURIComponent(patch.id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ patch }),
    },
  );

  const result = await parseResponse<WorkOrderStatePatchResponse>(response);

  if (result.patch) {
    return {
      ...patch,
      ...result.patch,
    } as WorkOrder;
  }

  if (result.workOrder) {
    return result.workOrder;
  }

  const emptyBodyError = new Error(
    "DB work order state patch response is empty.",
  ) as Error & { code?: string };
  emptyBodyError.code = "DB_EMPTY_RESPONSE";
  throw emptyBodyError;
}

async function loadMemoThreadsForWorkOrder(
  workOrderId: string,
): Promise<MemoThread[] | null> {
  const response = await fetch(
    `/api/workorders/memos?orderId=${encodeURIComponent(workOrderId)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const result = await parseResponse<MemoLoadResponse>(response);
  return result.memoThreads ?? [];
}

async function hydrateWorkOrdersWithMemoThreads(
  workOrders: WorkOrder[],
): Promise<WorkOrder[]> {
  if (workOrders.length === 0) return workOrders;

  const memoSnapshots = await Promise.all(
    workOrders.map(async (workOrder) => {
      try {
        return await loadMemoThreadsForWorkOrder(workOrder.id);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[memo hydration]",
            workOrder.id,
            error instanceof Error ? error.message : error,
          );
        }
        return null;
      }
    }),
  );

  return workOrders.map((workOrder, index) => {
    const memoThreads = memoSnapshots[index];
    if (!memoThreads) return workOrder;
    return {
      ...workOrder,
      memoThreads: mergeMemoThreads(workOrder.memoThreads, memoThreads),
    };
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  let body: (T & DbApiErrorBody) | null = null;

  try {
    body = (await response.json()) as T & DbApiErrorBody;
  } catch (error) {
    const parseError = new Error("Failed to parse DB response.") as Error & {
      code?: string;
      status?: number;
      cause?: unknown;
    };
    parseError.code = "DB_RESPONSE_PARSE_FAILED";
    parseError.status = response.status;
    parseError.cause = error;
    throw parseError;
  }

  if (!response.ok) {
    const error = new Error(body?.message ?? "DB request failed.") as Error & {
      code?: string;
      status?: number;
    };
    error.code = body?.code;
    error.status = response.status;
    throw error;
  }

  if (!body) {
    const emptyBodyError = new Error("DB response body is empty.") as Error & {
      code?: string;
      status?: number;
    };
    emptyBodyError.code = "DB_EMPTY_RESPONSE";
    emptyBodyError.status = response.status;
    throw emptyBodyError;
  }

  return body;
}

function isNetworkErrorMessage(message: string): boolean {
  return /fetch failed|networkerror|network error|load failed|failed to fetch/i.test(
    message,
  );
}

function toStatusCode(error: unknown): DbConnectionStateCode {
  if (!(error instanceof Error)) return "UNKNOWN";

  const errorWithMeta = error as Error & { code?: string };
  if (typeof errorWithMeta.code === "string") {
    return errorWithMeta.code as DbConnectionStateCode;
  }

  if (
    /DATABASE_URL is not configured|No supported database env var is configured/i.test(
      error.message,
    )
  )
    return "DB_NOT_CONFIGURED";
  if (/The 'pg' package is required/i.test(error.message))
    return "DB_DRIVER_MISSING";
  if (/relation .*spec_sheets.* does not exist/i.test(error.message))
    return "DB_TABLE_MISSING";
  if (
    /column .* does not exist/i.test(error.message) ||
    /invalid input syntax/i.test(error.message) ||
    /cannot cast/i.test(error.message)
  )
    return "DB_SCHEMA_INVALID";
  if (isNetworkErrorMessage(error.message)) return "DB_CONNECTION_FAILED";
  return "DB_REQUEST_FAILED";
}

function reportDbStatus(params: {
  source: "workspace-load" | "create" | "save" | "delete";
  connected: boolean;
  code: DbConnectionStateCode;
  message?: string | null;
}) {
  setDbConnectionStatus({
    mode: "db",
    configured: params.code !== "DB_NOT_CONFIGURED",
    connected: params.connected,
    driverReady: params.code !== "DB_DRIVER_MISSING",
    fallbackActive: false,
    source: params.source,
    code: params.code,
    message: params.message ?? null,
    checkedAt: new Date().toISOString(),
  });
}

function reportDbError(source: "workspace-load" | "create" | "save" | "delete", error: unknown) {
  reportDbStatus({
    source,
    connected: false,
    code: toStatusCode(error),
    message: error instanceof Error ? error.message : null,
  });
}

export function createDbWorkorderHttpAdapter(): WorkorderRepositoryAdapter {
  return {
    loadWorkspaceState: async () => {
      try {
        const [summaryWorkOrders, loadedUsers, sessionUser] = await Promise.all([
          loadWorkOrderSummariesFromApi(),
          loadUserProfilesForWorkspace(),
          loadCurrentUserFromSession(),
        ]);
        const sessionProfile = createWorkOrderSessionProfile(sessionUser);
        const users = ensureWorkOrderSessionProfile(loadedUsers, sessionProfile);
        const currentUser = sessionProfile ?? users[0] ?? null;
        const currentUserId = resolveWorkOrderSessionUserId(currentUser);
        const selectedId = summaryWorkOrders[0]?.id ?? "";
        const workOrders = summaryWorkOrders;
        const permissionTargetUserId = currentUserId || users[0]?.id || "";

        reportDbStatus({
          source: "workspace-load",
          connected: true,
          code: "READY",
        });

        return {
          users,
          currentUser,
          historyLogs: [],
          currentUserId,
          permissionTargetUserId,
          selectedId,
          workOrders,
        };
      } catch (error) {
        reportDbError("workspace-load", error);
        throw error;
      }
    },
    loadWorkOrderDetail: async (workOrderId) => {
      try {
        return await loadWorkOrderDetailFromApi(workOrderId);
      } catch (error) {
        reportDbError("workspace-load", error);
        throw error;
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

        const { workOrder: createdWorkOrder } = await parseResponse<{
          workOrder: WorkOrder;
        }>(response);
        reportDbStatus({
          source: "create",
          connected: true,
          code: "READY",
        });
        return markWorkOrderDetailSnapshot(createdWorkOrder);
      } catch (error) {
        reportDbError("create", error);
        throw error;
      }
    },
    saveWorkOrder: async (workOrder, options) => {
      try {
        const response = await fetch("/api/workorders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ workOrder, serviceCode: options?.serviceCode ?? null, auditActor: options?.auditActor ?? null }),
        });

        const { workOrder: savedWorkOrder } = await parseResponse<{
          workOrder: WorkOrder;
        }>(response);
        reportDbStatus({
          source: "save",
          connected: true,
          code: "READY",
        });
        return savedWorkOrder;
      } catch (error) {
        reportDbError("save", error);
        throw error;
      }
    },
    saveWorkOrderStatePatch: async (patch) => {
      try {
        const savedWorkOrder = await saveWorkOrderStatePatchToApi(patch);
        reportDbStatus({
          source: "save",
          connected: true,
          code: "READY",
        });
        return savedWorkOrder;
      } catch (error) {
        reportDbError("save", error);
        throw error;
      }
    },
    saveWorkOrders: async (workOrders, options) => {
      try {
        const response = await fetch("/api/workorders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ workOrders, serviceCode: options?.serviceCode ?? null, auditActor: options?.auditActor ?? null }),
        });

        const { workOrders: savedWorkOrders } = await parseResponse<{
          workOrders: WorkOrder[];
        }>(response);
        reportDbStatus({
          source: "save",
          connected: true,
          code: "READY",
        });
        return savedWorkOrders;
      } catch (error) {
        reportDbError("save", error);
        throw error;
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

        const { workOrderId: deletedWorkOrderId } = await parseResponse<{
          workOrderId: string;
        }>(response);
        reportDbStatus({
          source: "delete",
          connected: true,
          code: "READY",
        });
        return deletedWorkOrderId;
      } catch (error) {
        reportDbError("delete", error);
        throw error;
      }
    },
  };
}
