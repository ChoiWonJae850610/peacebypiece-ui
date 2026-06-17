import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import {
  buildWorkOrderDeletedAuditLog,
  buildWorkOrderStatusChangedAuditLog,
} from "@/lib/system/audit/writeActions";
import {
  getDatabaseRuntimeErrorCode,
  getSupportedDatabaseEnvKeys,
  isDatabaseConfigured,
} from "@/lib/db/client";
import { isWorkOrderServiceCode, type WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import { traceWaflFlow, traceWaflResult } from "@/lib/debug/trace";
import { guardProductionCompositionPatchByServiceCode } from "@/lib/workorder/serviceCodeGuards";
import { hasDefinedWaflPatchProperty } from "@/lib/mutations/waflPatchResult";
import { getPersonalProfile } from "@/lib/me/profileRepository";
import type { MemberPermissionCode } from "@/lib/permissions";
import { getSessionDefaultWorkOrderRole, isWorkOrderActorRole } from "@/lib/constants/roles";
import type { WaflSessionPayload } from "@/lib/auth/session";
import {
  createWorkspaceCompanyRequiredResponse,
  createWorkspacePermissionRequiredResponse,
  hasWorkspaceApiPermission,
  requireWorkspaceApiGuard,
} from "@/lib/auth/apiRouteGuards";
import {
  createWorkOrderForCompany,
  deleteWorkOrderForCompany,
  getWorkOrderDetailByCompany,
  listExistingWorkOrdersByCompany,
  listWorkOrderSummariesByCompany,
  listWorkOrdersByCompany,
  saveWorkOrderForCompany,
  saveWorkOrdersForCompany,
  updateWorkOrderStateForCompany,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/service/workOrderService";
import type {
  WorkOrder,
  WorkOrderAuditActor,
  WorkOrderStatePatch,
  WorkOrderStatePatchResult,
} from "@/types/workorder";
import {
  normalizeWorkOrderListSort,
  normalizeWorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";

import {
  validateWorkOrderInventoryPatchPolicy,
  validateWorkOrderSavePolicy,
} from "@/lib/workorder/serverEditPolicy";
import {
  getWorkflowMutationPermissionCode,
  hasFactoryOrderRequestChanged,
} from "@/lib/workorder/workflowPermissionPolicy";

type DbApiErrorCode =
  | "DB_NOT_CONFIGURED"
  | "DB_DRIVER_MISSING"
  | "DB_CONNECTION_FAILED"
  | "DB_TABLE_MISSING"
  | "DB_SCHEMA_INVALID"
  | "DB_SCHEMA_UNSUPPORTED"
  | "DB_REQUEST_FAILED"
  | "INVALID_PAYLOAD";

type DbApiErrorPayload = {
  message: string;
  code: DbApiErrorCode;
};

type WorkOrderRequestCompanyScopeResult =
  | { ok: true; scope: WorkOrderCompanyScope }
  | { ok: false; response: NextResponse };

async function requireWorkOrderRequestCompanyScope(): Promise<WorkOrderRequestCompanyScopeResult> {
  const result = await requireWorkspaceApiGuard();
  if (!result.ok) return result;
  return { ok: true, scope: result.scope };
}

function createCompanySessionRequiredResponse() {
  return createWorkspaceCompanyRequiredResponse();
}

function createWorkOrderPermissionRequiredResponse(permissionCode: MemberPermissionCode) {
  return createWorkspacePermissionRequiredResponse(permissionCode);
}

async function hasCurrentWorkOrderPermission(
  session: WaflSessionPayload,
  permissionCode: MemberPermissionCode,
): Promise<boolean> {
  return hasWorkspaceApiPermission(session, permissionCode);
}

async function requireCurrentWorkOrderPermission(
  permissionCode: MemberPermissionCode,
): Promise<NextResponse | null> {
  const result = await requireWorkspaceApiGuard({ permissionCode });
  return result.ok ? null : result.response;
}

function hasOwnFactoryOrderRequest(value: object): boolean {
  return Object.prototype.hasOwnProperty.call(value, "factoryOrderRequest");
}

const WORK_ORDER_STATE_PATCH_METADATA_KEYS = new Set<keyof WorkOrderStatePatch>([
  "id",
  "lastSavedAt",
  "auditActor",
  "serviceCode",
]);

function isInventoryOnlyStatePatch(patch: WorkOrderStatePatch): boolean {
  const definedKeys = (Object.keys(patch) as (keyof WorkOrderStatePatch)[]).filter(
    (key) => hasDefinedWaflPatchProperty(patch, key),
  );
  const mutationKeys = definedKeys.filter(
    (key) => !WORK_ORDER_STATE_PATCH_METADATA_KEYS.has(key),
  );
  return (
    mutationKeys.length > 0 &&
    mutationKeys.every(
      (key) => key === "inventoryQuantity" || key === "inventoryStatus",
    )
  );
}

async function requireWorkOrderWorkflowMutationPermission(input: {
  session: WaflSessionPayload;
  previousWorkOrder: WorkOrder;
  nextWorkOrder: Pick<WorkOrder, "workflowState" | "factoryOrderRequest">;
  factoryOrderRequestTouched: boolean;
}): Promise<NextResponse | null> {
  const requiredPermission = getWorkflowMutationPermissionCode({
    previousWorkflowState: input.previousWorkOrder.workflowState,
    nextWorkflowState: input.nextWorkOrder.workflowState,
    previousFactoryOrderRequest: input.previousWorkOrder.factoryOrderRequest ?? null,
    nextFactoryOrderRequest: input.nextWorkOrder.factoryOrderRequest ?? null,
    factoryOrderRequestTouched: input.factoryOrderRequestTouched,
  });

  if (!requiredPermission) return null;

  return (await hasCurrentWorkOrderPermission(input.session, requiredPermission))
    ? null
    : createWorkOrderPermissionRequiredResponse(requiredPermission);
}

async function requireWorkOrderStatePatchWorkflowPermission(input: {
  session: WaflSessionPayload;
  previousWorkOrder: WorkOrder;
  patch: { workflowState: WorkOrder["workflowState"] } &
    Partial<Pick<WorkOrderStatePatch, "factoryOrderRequest">>;
}): Promise<NextResponse | null> {
  const factoryOrderRequestTouched = hasOwnFactoryOrderRequest(input.patch);

  const requiredPermission = getWorkflowMutationPermissionCode({
    previousWorkflowState: input.previousWorkOrder.workflowState,
    nextWorkflowState: input.patch.workflowState,
    previousFactoryOrderRequest: input.previousWorkOrder.factoryOrderRequest ?? null,
    nextFactoryOrderRequest: factoryOrderRequestTouched
      ? (input.patch.factoryOrderRequest ?? null)
      : (input.previousWorkOrder.factoryOrderRequest ?? null),
    factoryOrderRequestTouched:
      factoryOrderRequestTouched &&
      hasFactoryOrderRequestChanged({
        previousFactoryOrderRequest: input.previousWorkOrder.factoryOrderRequest ?? null,
        nextFactoryOrderRequest: input.patch.factoryOrderRequest ?? null,
        factoryOrderRequestTouched: true,
      }),
  });

  if (!requiredPermission) return null;

  return (await hasCurrentWorkOrderPermission(input.session, requiredPermission))
    ? null
    : createWorkOrderPermissionRequiredResponse(requiredPermission);
}


async function applySessionActorDefaults(
  workOrder: WorkOrder,
  sessionUser: WaflSessionPayload | null,
): Promise<WorkOrder> {
  if (!sessionUser) return workOrder;

  const sessionRole = getSessionDefaultWorkOrderRole(sessionUser);
  const profile = sessionUser.companyId ? await getPersonalProfile(sessionUser) : null;
  const sessionDisplayName = profile?.name?.trim() || sessionUser.name;
  const managerId = workOrder.managerId || sessionUser.userId;
  const managerName = workOrder.manager?.trim() || sessionDisplayName;

  return {
    ...workOrder,
    managerId,
    manager: managerName,
    createdById: workOrder.createdById || sessionUser.userId,
    createdByRole: workOrder.createdByRole || sessionRole,
  };
}

type WorkOrderAuditActorContext = {
  id: string;
  name: string;
  role: "designer" | "admin" | "inspector";
};

function readAuditActor(value: unknown): WorkOrderAuditActorContext | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<WorkOrderAuditActor>;
  const id = typeof source.id === "string" ? source.id.trim() : "";
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const role = source.role;

  if (!id || !name || !isWorkOrderActorRole(role)) {
    return null;
  }

  return { id, name, role };
}

function getAuditActorFromWorkOrder(
  workOrder: WorkOrder,
): WorkOrderAuditActorContext | null {
  return readAuditActor(
    (workOrder as WorkOrder & { auditActor?: unknown }).auditActor,
  );
}

function toSystemAuditActorRole(role: WorkOrderAuditActorContext["role"]) {
  if (role === "admin") return "customer_admin" as const;
  return role;
}

const DATABASE_ENV_HELP = `Expected one of: ${getSupportedDatabaseEnvKeys().join(", ")}`;
const DB_API_LOG_THROTTLE_MS = 5000;
const lastDbApiLogByKey = new Map<string, number>();

function createDbNotConfiguredPayload() {
  return {
    message: `Database connection string is not configured.\n${DATABASE_ENV_HELP}`,
    code: "DB_NOT_CONFIGURED" as const,
  };
}

function logDbRequestOutcome(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  ok: boolean,
  code: string,
  details?: string | null,
) {
  if (process.env.NODE_ENV === "production") return;

  const suffix = details ? ` - ${details}` : "";
  const prefix = ok ? "[db api]" : "[db api error]";
  const logMessage = `${prefix} ${method} ${code}${suffix}`;
  const now = Date.now();
  const lastLoggedAt = lastDbApiLogByKey.get(logMessage) ?? 0;

  if (now - lastLoggedAt < DB_API_LOG_THROTTLE_MS) {
    return;
  }

  lastDbApiLogByKey.set(logMessage, now);
  console[ok ? "info" : "warn"](logMessage);
}

function resolveDbErrorPayload(
  error: unknown,
  fallbackMessage: string,
): { status: number; payload: DbApiErrorPayload } {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const runtimeCode = getDatabaseRuntimeErrorCode(error);

  if (runtimeCode === "DB_NOT_CONFIGURED") {
    return { status: 503, payload: { message, code: "DB_NOT_CONFIGURED" } };
  }

  if (runtimeCode === "DB_DRIVER_MISSING") {
    return { status: 503, payload: { message, code: "DB_DRIVER_MISSING" } };
  }

  if (/spec_sheets row not found for id:/i.test(message)) {
    return { status: 404, payload: { message, code: "DB_REQUEST_FAILED" } };
  }

  if (/relation .*spec_sheets.* does not exist/i.test(message)) {
    return { status: 503, payload: { message, code: "DB_TABLE_MISSING" } };
  }

  if (
    /spec_sheets table is missing required columns/i.test(message) ||
    /Unsupported payload column type/i.test(message)
  ) {
    return { status: 503, payload: { message, code: "DB_SCHEMA_UNSUPPORTED" } };
  }

  if (
    /column .* does not exist/i.test(message) ||
    /invalid input syntax/i.test(message) ||
    /cannot cast/i.test(message)
  ) {
    return { status: 503, payload: { message, code: "DB_SCHEMA_INVALID" } };
  }

  if (runtimeCode === "DB_CONNECTION_FAILED") {
    return { status: 503, payload: { message, code: "DB_CONNECTION_FAILED" } };
  }

  return { status: 500, payload: { message, code: "DB_REQUEST_FAILED" } };
}

function buildWorkOrderMap(workOrders: WorkOrder[]): Map<string, WorkOrder> {
  return new Map(workOrders.map((workOrder) => [workOrder.id, workOrder]));
}

async function writeWorkOrderCreatedHistory(
  workOrder: WorkOrder,
  companyId: string,
): Promise<void> {
  await createAdminHistoryLogSafe({
    company_id: companyId,
    user_id: workOrder.createdById ?? null,
    action_type: "WORKORDER_CREATED",
    target_type: "workorder",
    target_id: workOrder.id,
    message: `${workOrder.title || "작업지시서"} 생성`,
    metadata: {
      workOrderId: workOrder.id,
      title: workOrder.title,
      workflowState: workOrder.workflowState,
      managerId: workOrder.managerId ?? null,
      managerName: workOrder.manager ?? null,
    },
  });
}

type WorkOrderStatusChangeAuditContext = {
  requestId?: string | null;
  ipAddress?: string | null;
  source?: "workorder-save" | "state-patch" | "bulk-save";
  auditActor?: WorkOrderAuditActorContext | null;
};

async function writeWorkOrderStatusChangeLogs(
  previous: WorkOrder | undefined,
  next: WorkOrder,
  companyId: string,
  context: WorkOrderStatusChangeAuditContext = {},
): Promise<void> {
  if (!previous || previous.workflowState === next.workflowState) return;

  await createAdminHistoryLogSafe({
    company_id: companyId,
    user_id: next.managerId ?? previous.managerId ?? null,
    action_type: "STATUS_CHANGED",
    target_type: "workorder",
    target_id: next.id,
    message: `${next.title || "작업지시서"} 상태 변경: ${previous.workflowState} → ${next.workflowState}`,
    metadata: {
      workOrderId: next.id,
      title: next.title,
      from: previous.workflowState,
      to: next.workflowState,
      managerId: next.managerId ?? null,
      managerName: next.manager ?? null,
    },
  });

  const auditLog = buildWorkOrderStatusChangedAuditLog({
    workOrderId: next.id,
    title: next.title,
    fromWorkflowState: previous.workflowState,
    toWorkflowState: next.workflowState,
    actorId:
      context.auditActor?.id ?? next.managerId ?? previous.managerId ?? null,
    actorName: context.auditActor?.name ?? null,
    actorRole: context.auditActor
      ? toSystemAuditActorRole(context.auditActor.role)
      : null,
    companyId,
    managerName: next.manager ?? previous.manager ?? null,
    source: context.source,
    requestId: context.requestId ?? null,
    ipAddress: context.ipAddress ?? null,
  });

  if (auditLog) {
    await createSystemAuditLogSafe(auditLog);
  }
}

function createInvalidPayloadResponse(message: string) {
  return NextResponse.json(
    { message, code: "INVALID_PAYLOAD" },
    { status: 400 },
  );
}

function createWorkOrderNotFoundResponse(workOrderId: string) {
  return NextResponse.json(
    {
      message: `spec_sheets row not found for id: ${workOrderId}`,
      code: "DB_REQUEST_FAILED",
    },
    { status: 404 },
  );
}

function getAuditRequestId(request: Request): string | null {
  return (
    request.headers.get("x-request-id") ||
    request.headers.get("x-vercel-id") ||
    null
  );
}

function getAuditIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return firstForwardedIp || request.headers.get("x-real-ip") || null;
}

async function readJsonBody<TBody>(request: Request): Promise<TBody | null> {
  try {
    return (await request.json()) as TBody;
  } catch {
    return null;
  }
}

export async function handleGetWorkOrders() {
  traceWaflFlow("api", "workorders.list.request");

  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;
    const readPermissionResponse = await requireCurrentWorkOrderPermission("workorder.read");
    if (readPermissionResponse) return readPermissionResponse;

    const workOrders = await listWorkOrdersByCompany(scopeResult.scope);
    logDbRequestOutcome("GET", true, "READY", `rows=${workOrders.length}`);
    traceWaflResult("workorders.list", "success", { rows: workOrders.length });

    return NextResponse.json({ workOrders });
  } catch (error) {
    const resolved = resolveDbErrorPayload(
      error,
      "Failed to fetch work orders.",
    );
    logDbRequestOutcome(
      "GET",
      false,
      resolved.payload.code,
      resolved.payload.message,
    );

    traceWaflResult("workorders.list", "error", { message: resolved.payload.message });
    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handleGetWorkOrderDetail(workOrderId: string) {
  const startedAt = Date.now();
  traceWaflFlow("api", "workorders.detail.request", { workOrderId });

  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  if (!workOrderId.trim()) {
    return createInvalidPayloadResponse("workOrderId is required.");
  }

  try {
    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;
    const readPermissionResponse = await requireCurrentWorkOrderPermission("workorder.read");
    if (readPermissionResponse) return readPermissionResponse;

    const workOrder = await getWorkOrderDetailByCompany(
      workOrderId,
      scopeResult.scope,
    );

    if (!workOrder) {
      return createWorkOrderNotFoundResponse(workOrderId);
    }
    logDbRequestOutcome("GET", true, "DETAIL_READY", workOrder.id);

    traceWaflResult("workorders.detail", "success", { workOrderId: workOrder.id });

    return NextResponse.json({
      workOrder: {
        ...workOrder,
        hasDetailSnapshot: true,
      },
      meta: {
        mode: "detail",
        hydrated: true,
        workOrderId: workOrder.id,
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    const resolved = resolveDbErrorPayload(
      error,
      "Failed to fetch work order detail.",
    );
    logDbRequestOutcome(
      "GET",
      false,
      resolved.payload.code,
      resolved.payload.message,
    );

    traceWaflResult("workorders.detail", "error", { message: resolved.payload.message });
    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handleGetWorkOrderSummaries(request?: Request) {
  const startedAt = Date.now();
  traceWaflFlow("api", "workorders.summary.request");

  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const url = request ? new URL(request.url) : null;
    const status = normalizeWorkOrderListStatusFilter(
      url?.searchParams.get("status"),
    );
    const sort = normalizeWorkOrderListSort(url?.searchParams.get("sort"));
    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;
    const readPermissionResponse = await requireCurrentWorkOrderPermission("workorder.read");
    if (readPermissionResponse) return readPermissionResponse;

    const workOrders = await listWorkOrderSummariesByCompany(
      { status, sort },
      scopeResult.scope,
    );
    logDbRequestOutcome(
      "GET",
      true,
      "SUMMARY_READY",
      `rows=${workOrders.length};status=${status};sort=${sort}`,
    );

    traceWaflResult("workorders.summary", "success", { rows: workOrders.length });

    return NextResponse.json({
      workOrders,
      meta: {
        mode: "summary",
        hydrated: false,
        count: workOrders.length,
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    const resolved = resolveDbErrorPayload(
      error,
      "Failed to fetch work order summaries.",
    );
    logDbRequestOutcome(
      "GET",
      false,
      resolved.payload.code,
      resolved.payload.message,
    );

    traceWaflResult("workorders.summary", "error", { message: resolved.payload.message });
    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handlePostWorkOrders(request: Request) {
  traceWaflFlow("api", "workorders.create.request");

  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const body = await readJsonBody<{ workOrder?: WorkOrder }>(request);

    if (!body) {
      return createInvalidPayloadResponse("Invalid JSON payload.");
    }

    if (!body.workOrder || typeof body.workOrder !== "object") {
      return createInvalidPayloadResponse("workOrder payload is required.");
    }

    const session = await getCurrentWaflSession();
    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;
    const createPermissionResponse = await requireCurrentWorkOrderPermission("workorder.create");
    if (createPermissionResponse) return createPermissionResponse;

    const workOrderToCreate = await applySessionActorDefaults(
      body.workOrder,
      session,
    );
    const workOrder = {
      ...(await createWorkOrderForCompany(workOrderToCreate, scopeResult.scope)),
      hasDetailSnapshot: true,
    };
    await writeWorkOrderCreatedHistory(workOrder, scopeResult.scope.companyId);

    logDbRequestOutcome("POST", true, "READY", workOrder.id);
    traceWaflResult("workorders.create", "success", { workOrderId: workOrder.id });

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    const resolved = resolveDbErrorPayload(
      error,
      "Failed to create work order.",
    );
    logDbRequestOutcome(
      "POST",
      false,
      resolved.payload.code,
      resolved.payload.message,
    );

    traceWaflResult("workorders.create", "error", { message: resolved.payload.message });
    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handlePatchWorkOrders(request: Request) {
  traceWaflFlow("api", "workorders.save.request");

  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const body = await readJsonBody<{
      workOrder?: WorkOrder;
      workOrders?: WorkOrder[];
      auditActor?: WorkOrderAuditActor | null;
      serviceCode?: string | null;
    }>(request);

    if (!body) {
      return createInvalidPayloadResponse("Invalid JSON payload.");
    }

    const serviceCode = isWorkOrderServiceCode(body.serviceCode) ? body.serviceCode : null;

    if (Array.isArray(body.workOrders)) {
      if (
        body.workOrders.some(
          (item) =>
            !item ||
            typeof item !== "object" ||
            typeof item.id !== "string" ||
            !item.id.trim(),
        )
      ) {
        return createInvalidPayloadResponse(
          "Every workOrders item must include workOrder.id.",
        );
      }

      const requestedWorkOrderIds = Array.from(
        new Set(body.workOrders.map((workOrder) => workOrder.id)),
      );
      const session = await getCurrentWaflSession();
      if (!session) return createCompanySessionRequiredResponse();

      const scopeResult = await requireWorkOrderRequestCompanyScope();
      if (!scopeResult.ok) return scopeResult.response;
      const previousWorkOrders = await listExistingWorkOrdersByCompany(
        requestedWorkOrderIds,
        scopeResult.scope,
      );
      if (previousWorkOrders.length !== requestedWorkOrderIds.length) {
        return createWorkOrderNotFoundResponse(
          requestedWorkOrderIds.find(
            (workOrderId) =>
              !previousWorkOrders.some((workOrder) => workOrder.id === workOrderId),
          ) ?? requestedWorkOrderIds[0],
        );
      }
      const previousWorkOrderMap = buildWorkOrderMap(previousWorkOrders);
      for (const workOrder of body.workOrders) {
        const previousWorkOrder = previousWorkOrderMap.get(workOrder.id);
        if (!previousWorkOrder) {
          return createWorkOrderNotFoundResponse(workOrder.id);
        }

        const editPolicyResponse = await validateWorkOrderSavePolicy({
          session,
          previous: previousWorkOrder,
          next: workOrder,
        });
        if (editPolicyResponse) return editPolicyResponse;

        const workflowPermissionResponse =
          await requireWorkOrderWorkflowMutationPermission({
            session,
            previousWorkOrder,
            nextWorkOrder: workOrder,
            factoryOrderRequestTouched: hasOwnFactoryOrderRequest(workOrder),
          });
        if (workflowPermissionResponse) return workflowPermissionResponse;
      }

      const workOrders = await saveWorkOrdersForCompany(
        body.workOrders,
        scopeResult.scope,
      );

      await Promise.all(
        workOrders.map((workOrder) =>
          writeWorkOrderStatusChangeLogs(
            previousWorkOrderMap.get(workOrder.id),
            workOrder,
            scopeResult.scope.companyId,
            {
              requestId: getAuditRequestId(request),
              ipAddress: getAuditIpAddress(request),
              source: "bulk-save",
              auditActor:
                getAuditActorFromWorkOrder(workOrder) ??
                readAuditActor(body.auditActor),
            },
          ),
        ),
      );

      logDbRequestOutcome("PATCH", true, "READY", `rows=${workOrders.length}`);
      traceWaflResult("workorders.bulkSave", "success", { rows: workOrders.length });

      return NextResponse.json({ workOrders, meta: { mode: "bulk-save", serviceCode } });
    }

    if (!body.workOrder || typeof body.workOrder !== "object") {
      return createInvalidPayloadResponse("workOrder payload is required.");
    }

    if (typeof body.workOrder.id !== "string" || !body.workOrder.id.trim()) {
      return createInvalidPayloadResponse("workOrder.id is required.");
    }

    const session = await getCurrentWaflSession();
    if (!session) return createCompanySessionRequiredResponse();

    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;
    const previousWorkOrder = await getWorkOrderDetailByCompany(
      body.workOrder.id,
      scopeResult.scope,
    );
    if (!previousWorkOrder) {
      return createWorkOrderNotFoundResponse(body.workOrder.id);
    }

    const editPolicyResponse = await validateWorkOrderSavePolicy({
      session,
      previous: previousWorkOrder,
      next: body.workOrder,
    });
    if (editPolicyResponse) return editPolicyResponse;

    const workflowPermissionResponse =
      await requireWorkOrderWorkflowMutationPermission({
        session,
        previousWorkOrder,
        nextWorkOrder: body.workOrder,
        factoryOrderRequestTouched: hasOwnFactoryOrderRequest(body.workOrder),
      });
    if (workflowPermissionResponse) return workflowPermissionResponse;

    const workOrder = await saveWorkOrderForCompany(
      body.workOrder,
      scopeResult.scope,
    );
    await writeWorkOrderStatusChangeLogs(
      previousWorkOrder ?? undefined,
      workOrder,
      scopeResult.scope.companyId,
      {
        requestId: getAuditRequestId(request),
        ipAddress: getAuditIpAddress(request),
        source: "workorder-save",
        auditActor:
          getAuditActorFromWorkOrder(body.workOrder) ??
          readAuditActor(body.auditActor),
      },
    );

    logDbRequestOutcome("PATCH", true, "READY", workOrder.id);
    traceWaflResult("workorders.save", "success", { workOrderId: workOrder.id });

    return NextResponse.json({ workOrder, meta: { mode: "workorder-save", serviceCode } });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to save work order.");
    logDbRequestOutcome(
      "PATCH",
      false,
      resolved.payload.code,
      resolved.payload.message,
    );

    traceWaflResult("workorders.save", "error", { message: resolved.payload.message });
    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handlePatchWorkOrderState(
  workOrderId: string,
  request: Request,
) {
  traceWaflFlow("api", "workorders.statePatch.request", { workOrderId });

  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const body = await readJsonBody<{
      patch?: Partial<WorkOrderStatePatch>;
      historyLogs?: unknown[];
      serviceCode?: unknown;
    }>(request);

    if (!body) {
      return createInvalidPayloadResponse("Invalid JSON payload.");
    }

    if (!body.patch || typeof body.patch !== "object") {
      return createInvalidPayloadResponse("state patch payload is required.");
    }

    const patchId =
      typeof body.patch.id === "string" && body.patch.id.trim()
        ? body.patch.id.trim()
        : workOrderId;
    if (patchId !== workOrderId) {
      return createInvalidPayloadResponse(
        "workOrder id does not match route parameter.",
      );
    }

    const rawServiceCode =
      typeof body.serviceCode === "string"
        ? body.serviceCode
        : typeof body.patch.serviceCode === "string"
          ? body.patch.serviceCode
          : null;
    const serviceCode: WorkOrderServiceCodeValue | null = isWorkOrderServiceCode(rawServiceCode)
      ? rawServiceCode
      : null;
    if (rawServiceCode && !serviceCode) {
      return createInvalidPayloadResponse("Invalid workOrder serviceCode.");
    }

    const guardedPatch = guardProductionCompositionPatchByServiceCode(
      body.patch as WorkOrderStatePatch,
      serviceCode,
    );

    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;

    const previousWorkOrder = await getWorkOrderDetailByCompany(
      workOrderId,
      scopeResult.scope,
    );
    if (!previousWorkOrder) {
      return createWorkOrderNotFoundResponse(workOrderId);
    }
    const session = await getCurrentWaflSession();
    if (!session) return createCompanySessionRequiredResponse();

    const nextWorkOrderForPolicy = {
      ...previousWorkOrder,
      ...guardedPatch,
      id: previousWorkOrder.id,
      workflowState: guardedPatch.workflowState ?? previousWorkOrder.workflowState,
      lastSavedAt: guardedPatch.lastSavedAt ?? previousWorkOrder.lastSavedAt,
    } as WorkOrder;
    const inventoryOnlyPatch = isInventoryOnlyStatePatch(guardedPatch);
    if (!inventoryOnlyPatch) {
      const editPolicyResponse = await validateWorkOrderSavePolicy({
        session,
        previous: previousWorkOrder,
        next: nextWorkOrderForPolicy,
      });
      if (editPolicyResponse) return editPolicyResponse;
    }

    const inventoryPermissionResponse =
      await validateWorkOrderInventoryPatchPolicy({
        session,
        inventoryTouched:
          Object.prototype.hasOwnProperty.call(guardedPatch, "inventoryQuantity") ||
          Object.prototype.hasOwnProperty.call(guardedPatch, "inventoryStatus"),
      });
    if (inventoryPermissionResponse) return inventoryPermissionResponse;

    const workflowPermissionResponse =
      await requireWorkOrderStatePatchWorkflowPermission({
        session,
        previousWorkOrder,
        patch: {
          workflowState: guardedPatch.workflowState ?? previousWorkOrder.workflowState,
          ...(Object.prototype.hasOwnProperty.call(guardedPatch, "factoryOrderRequest")
            ? { factoryOrderRequest: guardedPatch.factoryOrderRequest }
            : {}),
        },
      });
    if (workflowPermissionResponse) return workflowPermissionResponse;

    const hasDefinedPatchProperty = (propertyName: keyof WorkOrderStatePatch) =>
      hasDefinedWaflPatchProperty(guardedPatch, propertyName);

    const statePatch: WorkOrderStatePatch = {
      id: workOrderId,
      lastSavedAt:
        typeof guardedPatch.lastSavedAt === "string" &&
        guardedPatch.lastSavedAt.trim()
          ? guardedPatch.lastSavedAt
          : new Date().toISOString(),
      ...(hasDefinedPatchProperty("workflowState")
        ? { workflowState: guardedPatch.workflowState as WorkOrder["workflowState"] }
        : {}),
      ...(hasDefinedPatchProperty("title") ? { title: guardedPatch.title } : {}),
      ...(hasDefinedPatchProperty("displayTitle") ? { displayTitle: guardedPatch.displayTitle } : {}),
      ...(hasDefinedPatchProperty("baseTitle") ? { baseTitle: guardedPatch.baseTitle } : {}),
      ...(hasDefinedPatchProperty("workOrderKind") ? { workOrderKind: guardedPatch.workOrderKind } : {}),
      ...(hasDefinedPatchProperty("category1") ? { category1: guardedPatch.category1 } : {}),
      ...(hasDefinedPatchProperty("category2") ? { category2: guardedPatch.category2 } : {}),
      ...(hasDefinedPatchProperty("category3") ? { category3: guardedPatch.category3 } : {}),
      ...(hasDefinedPatchProperty("category1Id") ? { category1Id: guardedPatch.category1Id } : {}),
      ...(hasDefinedPatchProperty("category2Id") ? { category2Id: guardedPatch.category2Id } : {}),
      ...(hasDefinedPatchProperty("category3Id") ? { category3Id: guardedPatch.category3Id } : {}),
      ...(hasDefinedPatchProperty("season") ? { season: guardedPatch.season } : {}),
      ...(hasDefinedPatchProperty("manager") ? { manager: guardedPatch.manager } : {}),
      ...(hasDefinedPatchProperty("managerId") ? { managerId: guardedPatch.managerId } : {}),
      ...(hasDefinedPatchProperty("dueDate") ? { dueDate: guardedPatch.dueDate } : {}),
      ...(hasDefinedPatchProperty("quantity") ? { quantity: guardedPatch.quantity } : {}),
      ...(hasDefinedPatchProperty("inventoryQuantity")
        ? { inventoryQuantity: guardedPatch.inventoryQuantity }
        : {}),
      ...(hasDefinedPatchProperty("inventoryStatus")
        ? { inventoryStatus: guardedPatch.inventoryStatus }
        : {}),
      ...(hasDefinedPatchProperty("factoryOrderRequest")
        ? { factoryOrderRequest: guardedPatch.factoryOrderRequest ?? null }
        : {}),
      ...(hasDefinedPatchProperty("orderEntries")
        ? { orderEntries: guardedPatch.orderEntries }
        : {}),
      ...(hasDefinedPatchProperty("materials")
        ? { materials: guardedPatch.materials }
        : {}),
      ...(hasDefinedPatchProperty("outsourcing")
        ? { outsourcing: guardedPatch.outsourcing }
        : {}),
      ...(hasDefinedPatchProperty("rejectionReason")
        ? { rejectionReason: guardedPatch.rejectionReason ?? null }
        : {}),
      ...(hasDefinedPatchProperty("rejectedAt")
        ? { rejectedAt: guardedPatch.rejectedAt ?? null }
        : {}),
      ...(hasDefinedPatchProperty("rejectedByUserId")
        ? { rejectedByUserId: guardedPatch.rejectedByUserId ?? null }
        : {}),
      ...(hasDefinedPatchProperty("rejectedByName")
        ? { rejectedByName: guardedPatch.rejectedByName ?? null }
        : {}),
      serviceCode,
    };

    const savedWorkOrder = await updateWorkOrderStateForCompany(
      statePatch,
      scopeResult.scope,
    );

    await writeWorkOrderStatusChangeLogs(
      previousWorkOrder ?? undefined,
      savedWorkOrder,
      scopeResult.scope.companyId,
      {
        requestId: getAuditRequestId(request),
        ipAddress: getAuditIpAddress(request),
        source: "state-patch",
        auditActor: readAuditActor(guardedPatch.auditActor),
      },
    );

    const patchPayload: WorkOrderStatePatchResult["patch"] = {
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "workflowState")
        ? { workflowState: savedWorkOrder.workflowState }
        : {}),
      lastSavedAt: savedWorkOrder.lastSavedAt,
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "title") ? { title: savedWorkOrder.title } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "displayTitle") ? { displayTitle: savedWorkOrder.displayTitle } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "baseTitle") ? { baseTitle: savedWorkOrder.baseTitle } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "workOrderKind") ? { workOrderKind: savedWorkOrder.workOrderKind } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "category1") ? { category1: savedWorkOrder.category1 } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "category2") ? { category2: savedWorkOrder.category2 } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "category3") ? { category3: savedWorkOrder.category3 } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "category1Id") ? { category1Id: savedWorkOrder.category1Id } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "category2Id") ? { category2Id: savedWorkOrder.category2Id } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "category3Id") ? { category3Id: savedWorkOrder.category3Id } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "season") ? { season: savedWorkOrder.season } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "manager") ? { manager: savedWorkOrder.manager } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "managerId") ? { managerId: savedWorkOrder.managerId } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "dueDate") ? { dueDate: savedWorkOrder.dueDate } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "quantity") ? { quantity: savedWorkOrder.quantity } : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "inventoryQuantity")
        ? { inventoryQuantity: savedWorkOrder.inventoryQuantity }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "inventoryStatus")
        ? { inventoryStatus: savedWorkOrder.inventoryStatus }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "factoryOrderRequest")
        ? { factoryOrderRequest: savedWorkOrder.factoryOrderRequest ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "orderEntries")
        ? { orderEntries: savedWorkOrder.orderEntries ?? [] }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "materials")
        ? { materials: savedWorkOrder.materials ?? [] }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "outsourcing")
        ? { outsourcing: savedWorkOrder.outsourcing ?? [] }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "rejectionReason")
        ? { rejectionReason: savedWorkOrder.rejectionReason ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "rejectedAt")
        ? { rejectedAt: savedWorkOrder.rejectedAt ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "rejectedByUserId")
        ? { rejectedByUserId: savedWorkOrder.rejectedByUserId ?? null }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(guardedPatch, "rejectedByName")
        ? { rejectedByName: savedWorkOrder.rejectedByName ?? null }
        : {}),
    };
    const patchResult: WorkOrderStatePatchResult = {
      resourceId: savedWorkOrder.id,
      patch: patchPayload,
      updatedAt: savedWorkOrder.lastSavedAt,
    };

    logDbRequestOutcome(
      "PATCH",
      true,
      "READY",
      `${savedWorkOrder.id}:state-patch`,
    );

    traceWaflResult("workorders.statePatch", "success", { workOrderId: savedWorkOrder.id });

    return NextResponse.json({
      result: patchResult,
      meta: { mode: "state-patch", hydrated: false, serviceCode },
    });
  } catch (error) {
    const resolved = resolveDbErrorPayload(
      error,
      "Failed to save work order state.",
    );
    logDbRequestOutcome(
      "PATCH",
      false,
      resolved.payload.code,
      `state-patch: ${resolved.payload.message}`,
    );

    traceWaflResult("workorders.statePatch", "error", { message: resolved.payload.message });
    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handleDeleteWorkOrders(request: Request) {
  traceWaflFlow("api", "workorders.delete.request");

  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const body = await readJsonBody<{ workOrderId?: string }>(request);

    if (!body) {
      return createInvalidPayloadResponse("Invalid JSON payload.");
    }

    if (typeof body.workOrderId !== "string" || !body.workOrderId.trim()) {
      return createInvalidPayloadResponse("workOrderId is required.");
    }

    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;
    const deletePermissionResponse = await requireCurrentWorkOrderPermission("workorder.delete");
    if (deletePermissionResponse) return deletePermissionResponse;

    const previousWorkOrder = await getWorkOrderDetailByCompany(
      body.workOrderId,
      scopeResult.scope,
    );
    if (!previousWorkOrder) {
      return createWorkOrderNotFoundResponse(body.workOrderId);
    }
    const previousSnapshot = previousWorkOrder;
    const deletedWorkOrderId = await deleteWorkOrderForCompany(
      body.workOrderId,
      scopeResult.scope,
    );

    await createSystemAuditLogSafe(
      buildWorkOrderDeletedAuditLog({
        workOrderId: deletedWorkOrderId,
        title: previousSnapshot?.title ?? previousWorkOrder?.title ?? null,
        workflowState:
          previousSnapshot?.workflowState ??
          previousWorkOrder?.workflowState ??
          null,
        actorId:
          previousSnapshot?.managerId ?? previousWorkOrder?.managerId ?? null,
        companyId: scopeResult.scope.companyId,
        attachmentCount:
          previousSnapshot?.attachments?.length ??
          previousWorkOrder?.attachments?.length ??
          0,
        requestId: getAuditRequestId(request),
        ipAddress: getAuditIpAddress(request),
      }),
    );

    logDbRequestOutcome("DELETE", true, "READY", deletedWorkOrderId);
    traceWaflResult("workorders.delete", "success", { workOrderId: deletedWorkOrderId });

    return NextResponse.json({ workOrderId: deletedWorkOrderId });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to delete work order.");
    traceWaflResult("workorders.delete", "error", { message: resolved.payload.message });
    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}
