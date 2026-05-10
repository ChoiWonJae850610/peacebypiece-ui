import { NextResponse } from "next/server";

import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import {
  getDatabaseRuntimeErrorCode,
  getSupportedDatabaseEnvKeys,
  isDatabaseConfigured,
} from "@/lib/db/client";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import {
  createDbWorkOrder,
  deleteDbWorkOrder,
  findAllDbWorkOrders,
  findDbWorkOrderSummaries,
  saveDbWorkOrder,
  saveDbWorkOrders,
} from "@/lib/workorder/repository/dbWorkOrderRepository";
import type { MemoThread, WorkOrder } from "@/types/workorder";

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

type ReplaceMemoThreadsRepository = {
  replaceMemoThreads: (workOrderId: string, memoThreads: MemoThread[]) => Promise<void>;
};

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

  if (/column .* does not exist/i.test(message) || /invalid input syntax/i.test(message) || /cannot cast/i.test(message)) {
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

function canReplaceMemoThreads(repository: unknown): repository is ReplaceMemoThreadsRepository {
  return (
    typeof repository === "object" &&
    repository !== null &&
    "replaceMemoThreads" in repository &&
    typeof (repository as { replaceMemoThreads?: unknown }).replaceMemoThreads === "function"
  );
}

function mergeMemoThreads(payloadThreads: MemoThread[] | undefined, dbThreads: MemoThread[]): MemoThread[] {
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

async function writeWorkOrderCreatedHistory(workOrder: WorkOrder): Promise<void> {
  await createAdminHistoryLogSafe({
    company_id: WORKSPACE_COMPANY_ID,
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

async function writeWorkOrderStatusChangeHistory(previous: WorkOrder | undefined, next: WorkOrder): Promise<void> {
  if (!previous || previous.workflowState === next.workflowState) return;

  await createAdminHistoryLogSafe({
    company_id: WORKSPACE_COMPANY_ID,
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
}

async function hydrateWorkOrdersWithAttachmentMemoSnapshots(workOrders: WorkOrder[]): Promise<WorkOrder[]> {
  if (workOrders.length === 0) return workOrders;

  try {
    const repository = await createAttachmentMemoRepository();
    const info = repository.getRepositoryInfo();

    if (info.mode === "db" && !info.adapterConfigured) {
      return workOrders;
    }

    const snapshots = await Promise.all(workOrders.map((workOrder) => repository.listSnapshotByWorkOrderId(workOrder.id)));

    return workOrders.map((workOrder, index) => {
      const snapshot = snapshots[index];
      if (!snapshot) return workOrder;

      return {
        ...workOrder,
        attachments: snapshot.attachments,
        memoThreads: mergeMemoThreads(workOrder.memoThreads, snapshot.memoThreads),
      };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : "Attachment snapshot hydration failed.";
      console.warn("[attachment hydration] " + message);
    }

    return workOrders;
  }
}

async function replaceWorkOrderMemoThreads(workOrder: WorkOrder): Promise<void> {
  const repository = await createAttachmentMemoRepository();
  const info = repository.getRepositoryInfo();

  if (info.mode !== "db" || !info.adapterConfigured || !canReplaceMemoThreads(repository)) {
    return;
  }

  await repository.replaceMemoThreads(workOrder.id, workOrder.memoThreads ?? []);
}

async function hydrateWorkOrderWithAttachmentMemoSnapshot(workOrder: WorkOrder): Promise<WorkOrder> {
  const [hydrated] = await hydrateWorkOrdersWithAttachmentMemoSnapshots([workOrder]);
  return hydrated ?? workOrder;
}

function createInvalidPayloadResponse(message: string) {
  return NextResponse.json({ message, code: "INVALID_PAYLOAD" }, { status: 400 });
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
    const workOrders = await hydrateWorkOrdersWithAttachmentMemoSnapshots(await findAllDbWorkOrders());
    logDbRequestOutcome("GET", true, "READY", `rows=${workOrders.length}`);

    return NextResponse.json({ workOrders });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to fetch work orders.");
    logDbRequestOutcome("GET", false, resolved.payload.code, resolved.payload.message);

    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handleGetWorkOrderSummaries() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const workOrders = await findDbWorkOrderSummaries();
    logDbRequestOutcome("GET", true, "SUMMARY_READY", `rows=${workOrders.length}`);

    return NextResponse.json({
      workOrders,
      meta: {
        mode: "summary",
        hydrated: false,
        count: workOrders.length,
      },
    });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to fetch work order summaries.");
    logDbRequestOutcome("GET", false, resolved.payload.code, resolved.payload.message);

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

    const createdWorkOrder = await createDbWorkOrder(body.workOrder);
    await replaceWorkOrderMemoThreads(body.workOrder);

    const workOrder = await hydrateWorkOrderWithAttachmentMemoSnapshot(createdWorkOrder);
    await writeWorkOrderCreatedHistory(workOrder);

    logDbRequestOutcome("POST", true, "READY", workOrder.id);

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to create work order.");
    logDbRequestOutcome("POST", false, resolved.payload.code, resolved.payload.message);

    return NextResponse.json(resolved.payload, { status: resolved.status });
  }
}

export async function handlePatchWorkOrders(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    const body = await readJsonBody<{ workOrder?: WorkOrder; workOrders?: WorkOrder[] }>(request);

    if (!body) {
      return createInvalidPayloadResponse("Invalid JSON payload.");
    }

    if (Array.isArray(body.workOrders)) {
      if (
        body.workOrders.some(
          (item) => !item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim(),
        )
      ) {
        return createInvalidPayloadResponse("Every workOrders item must include workOrder.id.");
      }

      const previousWorkOrderMap = buildWorkOrderMap(await findAllDbWorkOrders());
      const savedWorkOrders = await saveDbWorkOrders(body.workOrders);

      const workOrders = await hydrateWorkOrdersWithAttachmentMemoSnapshots(savedWorkOrders);

      await Promise.all(
        workOrders.map((workOrder) => writeWorkOrderStatusChangeHistory(previousWorkOrderMap.get(workOrder.id), workOrder)),
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

    const previousWorkOrderMap = buildWorkOrderMap(await findAllDbWorkOrders());
    const savedWorkOrder = await saveDbWorkOrder(body.workOrder);

    const workOrder = await hydrateWorkOrderWithAttachmentMemoSnapshot(savedWorkOrder);
    await writeWorkOrderStatusChangeHistory(previousWorkOrderMap.get(workOrder.id), workOrder);

    logDbRequestOutcome("PATCH", true, "READY", workOrder.id);

    return NextResponse.json({ workOrder });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to save work order.");
    logDbRequestOutcome("PATCH", false, resolved.payload.code, resolved.payload.message);

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

    const deletedWorkOrderId = await deleteDbWorkOrder(body.workOrderId);

    logDbRequestOutcome("DELETE", true, "READY", deletedWorkOrderId);

    return NextResponse.json({ workOrderId: deletedWorkOrderId });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to delete work order.");
  }
}
