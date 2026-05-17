import { NextResponse } from "next/server";

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
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { adminMemberRepository } from "@/lib/admin/members/memberRepository";
import { getPersonalProfile } from "@/lib/me/profileRepository";
import { hasMemberPermission, type MemberPermissionCode } from "@/lib/permissions";
import type { WaflSessionPayload } from "@/lib/auth/session";
import {
  createDbWorkOrder,
  deleteDbWorkOrder,
  findAllDbWorkOrders,
  findDbWorkOrderById,
  findDbWorkOrderSummaries,
  saveDbWorkOrder,
  saveDbWorkOrders,
  updateDbWorkOrderStatePatch,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/dbWorkOrderRepository";
import type {
  MemoThread,
  WorkOrder,
  WorkOrderAuditActor,
  WorkOrderStatePatch,
  WorkOrderStatePatchResult,
} from "@/types/workorder";
import {
  normalizeWorkOrderListSort,
  normalizeWorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";

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

function createCompanySessionRequiredResponse() {
  return NextResponse.json(
    {
      message: "Company session is required for work order requests.",
      code: "COMPANY_SESSION_REQUIRED",
    },
    { status: 401 },
  );
}

async function resolveWorkOrderRequestCompanyScope(): Promise<WorkOrderCompanyScope | null> {
  const session = await getCurrentWaflSession();
  if (!session) return null;

  const companyId = session.companyId?.trim();
  if (!companyId) return null;

  return {
    companyId,
    companyName: session.companyName,
  };
}

async function requireWorkOrderRequestCompanyScope(): Promise<WorkOrderRequestCompanyScopeResult> {
  const scope = await resolveWorkOrderRequestCompanyScope();
  if (!scope) {
    return { ok: false, response: createCompanySessionRequiredResponse() };
  }

  return { ok: true, scope };
}
async function hasCurrentWorkOrderPermission(
  session: WaflSessionPayload,
  permissionCode: MemberPermissionCode,
): Promise<boolean> {
  if (session.role === "company_admin") return true;
  if (session.role !== "member" || !session.companyId || !session.companyMemberId) return false;

  const { members } = await adminMemberRepository.listCompanyMembers({
    companyId: session.companyId,
    status: "all",
    limit: 200,
  });
  const member = members.find((item) => item.id === session.companyMemberId);
  return Boolean(member && member.status === "approved" && hasMemberPermission(member, permissionCode));
}

function getRequiredWorkflowPermission(input: {
  previousState?: WorkOrder["workflowState"] | null;
  nextState: WorkOrder["workflowState"];
  hasFactoryOrderRequest: boolean;
}): MemberPermissionCode | null {
  if (input.hasFactoryOrderRequest || input.nextState === "inspection") return "workorder.status.order";
  if (input.nextState === "review_requested" || input.nextState === "draft" || input.nextState === "rejected") return "workorder.status.review";
  if (input.nextState === "review_completed") return "workorder.status.order";
  if (input.nextState === "completed") return "workorder.status.complete";
  return null;
}

function createWorkOrderPermissionRequiredResponse(permissionCode: MemberPermissionCode) {
  return NextResponse.json(
    {
      message: "Current user does not have permission to change this work order workflow state.",
      code: "WORKORDER_PERMISSION_REQUIRED",
      permissionCode,
    },
    { status: 403 },
  );
}


async function applySessionActorDefaults(
  workOrder: WorkOrder,
  sessionUser: Awaited<ReturnType<typeof getCurrentWaflSession>>,
): Promise<WorkOrder> {
  if (!sessionUser) return workOrder;

  const sessionRole =
    sessionUser.role === "company_admin" || sessionUser.role === "system_admin"
      ? "admin"
      : "designer";
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

type ReplaceMemoThreadsRepository = {
  replaceMemoThreads: (
    workOrderId: string,
    memoThreads: MemoThread[],
  ) => Promise<void>;
};

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

  if (
    !id ||
    !name ||
    (role !== "admin" && role !== "designer" && role !== "inspector")
  ) {
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

function createDbErrorResponse(error: unknown, fallbackMessage: string) {
  const resolved = resolveDbErrorPayload(error, fallbackMessage);
  return NextResponse.json(resolved.payload, { status: resolved.status });
}

function canReplaceMemoThreads(
  repository: unknown,
): repository is ReplaceMemoThreadsRepository {
  return (
    typeof repository === "object" &&
    repository !== null &&
    "replaceMemoThreads" in repository &&
    typeof (repository as { replaceMemoThreads?: unknown })
      .replaceMemoThreads === "function"
  );
}

function mergeMemoThreads(
  payloadThreads: MemoThread[] | undefined,
  dbThreads: MemoThread[],
): MemoThread[] {
  const merged = new Map<string, MemoThread>();

  for (const thread of payloadThreads ?? []) {
    merged.set(thread.id, thread);
  }

  for (const thread of dbThreads) {
    merged.set(thread.id, thread);
  }

  return Array.from(merged.values());
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

async function hydrateWorkOrdersWithAttachmentMemoSnapshots(
  workOrders: WorkOrder[],
): Promise<WorkOrder[]> {
  if (workOrders.length === 0) return workOrders;

  try {
    const repository = await createAttachmentMemoRepository();
    const info = repository.getRepositoryInfo();

    if (info.mode === "db" && !info.adapterConfigured) {
      return workOrders;
    }

    const snapshots = await Promise.all(
      workOrders.map((workOrder) =>
        repository.listSnapshotByWorkOrderId(workOrder.id),
      ),
    );

    return workOrders.map((workOrder, index) => {
      const snapshot = snapshots[index];
      if (!snapshot) return workOrder;

      return {
        ...workOrder,
        attachments: snapshot.attachments,
        memoThreads: mergeMemoThreads(
          workOrder.memoThreads,
          snapshot.memoThreads,
        ),
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message =
        error instanceof Error
          ? error.message
          : "Attachment snapshot hydration failed.";
      console.warn("[attachment hydration] " + message);
    }

    return workOrders;
  }
}

async function replaceWorkOrderMemoThreads(
  workOrder: WorkOrder,
): Promise<void> {
  const repository = await createAttachmentMemoRepository();
  const info = repository.getRepositoryInfo();

  if (
    info.mode !== "db" ||
    !info.adapterConfigured ||
    !canReplaceMemoThreads(repository)
  ) {
    return;
  }

  await repository.replaceMemoThreads(
    workOrder.id,
    workOrder.memoThreads ?? [],
  );
}

async function hydrateWorkOrderWithAttachmentMemoSnapshot(
  workOrder: WorkOrder,
): Promise<WorkOrder> {
  const [hydrated] = await hydrateWorkOrdersWithAttachmentMemoSnapshots([
    workOrder,
  ]);
  return hydrated ?? workOrder;
}

function createInvalidPayloadResponse(message: string) {
  return NextResponse.json(
    { message, code: "INVALID_PAYLOAD" },
    { status: 400 },
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
  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;

    const workOrders = await hydrateWorkOrdersWithAttachmentMemoSnapshots(
      await findAllDbWorkOrders(scopeResult.scope),
    );
    logDbRequestOutcome("GET", true, "READY", `rows=${workOrders.length}`);

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

    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handleGetWorkOrderDetail(workOrderId: string) {
  const startedAt = Date.now();

  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  if (!workOrderId.trim()) {
    return createInvalidPayloadResponse("workOrderId is required.");
  }

  try {
    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;

    const foundWorkOrder = await findDbWorkOrderById(workOrderId, scopeResult.scope);

    if (!foundWorkOrder) {
      return NextResponse.json(
        {
          message: `spec_sheets row not found for id: ${workOrderId}`,
          code: "DB_REQUEST_FAILED",
        },
        { status: 404 },
      );
    }

    const workOrder =
      await hydrateWorkOrderWithAttachmentMemoSnapshot(foundWorkOrder);
    logDbRequestOutcome("GET", true, "DETAIL_READY", workOrder.id);

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

    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handleGetWorkOrderSummaries(request?: Request) {
  const startedAt = Date.now();

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

    const workOrders = await findDbWorkOrderSummaries({ status, sort }, scopeResult.scope);
    logDbRequestOutcome(
      "GET",
      true,
      "SUMMARY_READY",
      `rows=${workOrders.length};status=${status};sort=${sort}`,
    );

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

    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handlePostWorkOrders(request: Request) {
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

    const workOrderToCreate = await applySessionActorDefaults(
      body.workOrder,
      session,
    );
    const createdWorkOrder = await createDbWorkOrder(workOrderToCreate, scopeResult.scope);
    await replaceWorkOrderMemoThreads(workOrderToCreate);

    const workOrder =
      await hydrateWorkOrderWithAttachmentMemoSnapshot(createdWorkOrder);
    await writeWorkOrderCreatedHistory(workOrder, scopeResult.scope.companyId);

    logDbRequestOutcome("POST", true, "READY", workOrder.id);

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

    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handlePatchWorkOrders(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const body = await readJsonBody<{
      workOrder?: WorkOrder;
      workOrders?: WorkOrder[];
      auditActor?: WorkOrderAuditActor | null;
    }>(request);

    if (!body) {
      return createInvalidPayloadResponse("Invalid JSON payload.");
    }

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
      const scopeResult = await requireWorkOrderRequestCompanyScope();
      if (!scopeResult.ok) return scopeResult.response;

      const previousWorkOrders = (
        await Promise.all(
          requestedWorkOrderIds.map((workOrderId) =>
            findDbWorkOrderById(workOrderId, scopeResult.scope),
          ),
        )
      ).filter((workOrder): workOrder is WorkOrder => Boolean(workOrder));
      const previousWorkOrderMap = buildWorkOrderMap(previousWorkOrders);
      const savedWorkOrders = await saveDbWorkOrders(body.workOrders, scopeResult.scope);

      const workOrders =
        await hydrateWorkOrdersWithAttachmentMemoSnapshots(savedWorkOrders);

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

      return NextResponse.json({ workOrders });
    }

    if (!body.workOrder || typeof body.workOrder !== "object") {
      return createInvalidPayloadResponse("workOrder payload is required.");
    }

    if (typeof body.workOrder.id !== "string" || !body.workOrder.id.trim()) {
      return createInvalidPayloadResponse("workOrder.id is required.");
    }

    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;

    const previousWorkOrder = await findDbWorkOrderById(
      body.workOrder.id,
      scopeResult.scope,
    );
    const savedWorkOrder = await saveDbWorkOrder(body.workOrder, scopeResult.scope);

    const workOrder =
      await hydrateWorkOrderWithAttachmentMemoSnapshot(savedWorkOrder);
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

    return NextResponse.json({ workOrder });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to save work order.");
    logDbRequestOutcome(
      "PATCH",
      false,
      resolved.payload.code,
      resolved.payload.message,
    );

    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handlePatchWorkOrderState(
  workOrderId: string,
  request: Request,
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const body = await readJsonBody<{
      patch?: Partial<WorkOrderStatePatch>;
      historyLogs?: unknown[];
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

    if (
      typeof body.patch.workflowState !== "string" ||
      !body.patch.workflowState.trim()
    ) {
      return createInvalidPayloadResponse("workflowState is required.");
    }

    const scopeResult = await requireWorkOrderRequestCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;

    const previousWorkOrder = await findDbWorkOrderById(workOrderId, scopeResult.scope);
    const session = await getCurrentWaflSession();
    if (!session) return createCompanySessionRequiredResponse();

    const requiredPermission = getRequiredWorkflowPermission({
      previousState: previousWorkOrder?.workflowState ?? null,
      nextState: body.patch.workflowState as WorkOrder["workflowState"],
      hasFactoryOrderRequest: Object.prototype.hasOwnProperty.call(body.patch, "factoryOrderRequest"),
    });
    if (requiredPermission && !(await hasCurrentWorkOrderPermission(session, requiredPermission))) {
      return createWorkOrderPermissionRequiredResponse(requiredPermission);
    }

    const savedWorkOrder = await updateDbWorkOrderStatePatch(
      {
        id: workOrderId,
        workflowState: body.patch.workflowState as WorkOrder["workflowState"],
        lastSavedAt:
          typeof body.patch.lastSavedAt === "string" &&
          body.patch.lastSavedAt.trim()
            ? body.patch.lastSavedAt
            : new Date().toISOString(),
        inventoryQuantity:
          typeof body.patch.inventoryQuantity === "number"
            ? body.patch.inventoryQuantity
            : undefined,
        inventoryStatus: body.patch.inventoryStatus,
        factoryOrderRequest: Object.prototype.hasOwnProperty.call(
          body.patch,
          "factoryOrderRequest",
        )
          ? (body.patch.factoryOrderRequest ?? null)
          : undefined,
        orderEntries: Array.isArray(body.patch.orderEntries)
          ? body.patch.orderEntries
          : undefined,
      },
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
        auditActor: readAuditActor(body.patch.auditActor),
      },
    );

    const patchResult: WorkOrderStatePatchResult = {
      id: savedWorkOrder.id,
      workflowState: savedWorkOrder.workflowState,
      lastSavedAt: savedWorkOrder.lastSavedAt,
      inventoryQuantity: savedWorkOrder.inventoryQuantity,
      inventoryStatus: savedWorkOrder.inventoryStatus,
      factoryOrderRequest: savedWorkOrder.factoryOrderRequest ?? null,
      orderEntries: savedWorkOrder.orderEntries ?? [],
    };

    logDbRequestOutcome(
      "PATCH",
      true,
      "READY",
      `${savedWorkOrder.id}:state-patch`,
    );

    return NextResponse.json({
      patch: patchResult,
      meta: { mode: "state-patch", hydrated: false },
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

    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handleDeleteWorkOrders(request: Request) {
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

    const previousWorkOrder = await findDbWorkOrderById(
      body.workOrderId,
      scopeResult.scope,
    );
    const previousSnapshot = previousWorkOrder
      ? await hydrateWorkOrderWithAttachmentMemoSnapshot(previousWorkOrder)
      : null;
    const deletedWorkOrderId = await deleteDbWorkOrder(
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
        memoThreadCount:
          previousSnapshot?.memoThreads?.length ??
          previousWorkOrder?.memoThreads?.length ??
          0,
        requestId: getAuditRequestId(request),
        ipAddress: getAuditIpAddress(request),
      }),
    );

    logDbRequestOutcome("DELETE", true, "READY", deletedWorkOrderId);

    return NextResponse.json({ workOrderId: deletedWorkOrderId });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to delete work order.");
  }
}
