import { NextResponse } from "next/server";
import { getDatabaseRuntimeErrorCode, getSupportedDatabaseEnvKeys, isDatabaseConfigured } from "@/lib/db/client";
import { createDbWorkOrder, deleteDbWorkOrder, findAllDbWorkOrders, saveDbWorkOrder, saveDbWorkOrders } from "@/lib/workorder/repository/dbWorkOrderRepository";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
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

const DATABASE_ENV_HELP = `Expected one of: ${getSupportedDatabaseEnvKeys().join(", ")}`;
const DB_API_LOG_THROTTLE_MS = 5000;
const lastDbApiLogByKey = new Map<string, number>();

function createDbNotConfiguredPayload() {
  return { message: `Database connection string is not configured. ${DATABASE_ENV_HELP}`, code: "DB_NOT_CONFIGURED" as const };
}

function logDbRequestOutcome(method: "GET" | "POST" | "PATCH" | "DELETE", ok: boolean, code: string, details?: string | null) {
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

function resolveDbErrorPayload(error: unknown, fallbackMessage: string): { status: number; payload: DbApiErrorPayload } {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const runtimeCode = getDatabaseRuntimeErrorCode(error);

  if (runtimeCode === "DB_NOT_CONFIGURED") {
    return { status: 503, payload: { message, code: "DB_NOT_CONFIGURED" } };
  }

  if (runtimeCode === "DB_DRIVER_MISSING") {
    return { status: 503, payload: { message, code: "DB_DRIVER_MISSING" } };
  }

  if (/work_orders row not found for id:/i.test(message)) {
    return { status: 404, payload: { message, code: "DB_REQUEST_FAILED" } };
  }

  if (/relation .*work_orders.* does not exist/i.test(message)) {
    return { status: 503, payload: { message, code: "DB_TABLE_MISSING" } };
  }

  if (/work_orders table is missing required columns/i.test(message) || /Unsupported payload column type/i.test(message)) {
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

async function hydrateWorkOrdersWithAttachmentMemoSnapshots(workOrders: WorkOrder[]): Promise<WorkOrder[]> {
  if (workOrders.length === 0) return workOrders;

  try {
    const repository = await createAttachmentMemoRepository();
    const info = repository.getRepositoryInfo();

    if (info.mode === "db" && !info.adapterConfigured) {
      return workOrders;
    }

    const snapshots = await Promise.all(
      workOrders.map((workOrder) => repository.listSnapshotByWorkOrderId(workOrder.id)),
    );

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

function createDbErrorResponse(error: unknown, fallbackMessage: string) {
  const resolved = resolveDbErrorPayload(error, fallbackMessage);
  return NextResponse.json<DbApiErrorPayload>(resolved.payload, { status: resolved.status });
}

export async function GET() {
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
    return NextResponse.json<DbApiErrorPayload>(resolved.payload, { status: resolved.status });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    let body: { workOrder?: WorkOrder } | null = null;

    try {
      body = (await request.json()) as { workOrder?: WorkOrder };
    } catch {
      return NextResponse.json({ message: "Invalid JSON payload.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    if (!body?.workOrder || typeof body.workOrder !== "object") {
      return NextResponse.json({ message: "workOrder payload is required.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const workOrder = await createDbWorkOrder(body.workOrder);
    logDbRequestOutcome("POST", true, "READY", workOrder.id);
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to create work order.");
    logDbRequestOutcome("POST", false, resolved.payload.code, resolved.payload.message);
    return NextResponse.json<DbApiErrorPayload>(resolved.payload, { status: resolved.status });
  }
}

export async function PATCH(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    let body: { workOrder?: WorkOrder; workOrders?: WorkOrder[] } | null = null;

    try {
      body = (await request.json()) as { workOrder?: WorkOrder; workOrders?: WorkOrder[] };
    } catch {
      return NextResponse.json({ message: "Invalid JSON payload.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    if (Array.isArray(body?.workOrders)) {
      if (body.workOrders.some((item) => !item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim())) {
        return NextResponse.json({ message: "Every workOrders item must include workOrder.id.", code: "INVALID_PAYLOAD" }, { status: 400 });
      }

      const workOrders = await saveDbWorkOrders(body.workOrders);

      logDbRequestOutcome("PATCH", true, "READY", `rows=${workOrders.length}`);
      return NextResponse.json({ workOrders });
    }

    if (!body?.workOrder || typeof body.workOrder !== "object") {
      return NextResponse.json({ message: "workOrder payload is required.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    if (typeof body.workOrder.id !== "string" || !body.workOrder.id.trim()) {
      return NextResponse.json({ message: "workOrder.id is required.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const workOrder = await saveDbWorkOrder(body.workOrder);
    logDbRequestOutcome("PATCH", true, "READY", workOrder.id);
    return NextResponse.json({ workOrder });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to save work order.");
    logDbRequestOutcome("PATCH", false, resolved.payload.code, resolved.payload.message);
    return NextResponse.json<DbApiErrorPayload>(resolved.payload, { status: resolved.status });
  }
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(createDbNotConfiguredPayload(), { status: 503 });
  }

  try {
    let body: { workOrderId?: string } | null = null;

    try {
      body = (await request.json()) as { workOrderId?: string };
    } catch {
      return NextResponse.json({ message: "Invalid JSON payload.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    if (typeof body?.workOrderId !== "string" || !body.workOrderId.trim()) {
      return NextResponse.json({ message: "workOrderId is required.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const deletedWorkOrderId = await deleteDbWorkOrder(body.workOrderId);
    logDbRequestOutcome("DELETE", true, "READY", deletedWorkOrderId);
    return NextResponse.json({ workOrderId: deletedWorkOrderId });
  } catch (error) {
    const resolved = resolveDbErrorPayload(error, "Failed to delete work order.");
    logDbRequestOutcome("DELETE", false, resolved.payload.code, resolved.payload.message);
    return NextResponse.json<DbApiErrorPayload>(resolved.payload, { status: resolved.status });
  }
}
