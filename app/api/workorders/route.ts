import { NextResponse } from "next/server";
import { getDatabaseRuntimeErrorCode, isDatabaseConfigured } from "@/lib/db/client";
import { createDbWorkOrder, findAllDbWorkOrders } from "@/lib/workorder/repository/dbWorkOrderRepository";
import type { WorkOrder } from "@/types/workorder";

type DbApiErrorPayload = {
  message: string;
  code:
    | "DB_NOT_CONFIGURED"
    | "DB_DRIVER_MISSING"
    | "DB_CONNECTION_FAILED"
    | "DB_TABLE_MISSING"
    | "DB_SCHEMA_INVALID"
    | "DB_SCHEMA_UNSUPPORTED"
    | "DB_REQUEST_FAILED"
    | "INVALID_PAYLOAD";
};

function createDbErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const runtimeCode = getDatabaseRuntimeErrorCode(error);

  if (runtimeCode === "DB_NOT_CONFIGURED") {
    return NextResponse.json<DbApiErrorPayload>({ message, code: "DB_NOT_CONFIGURED" }, { status: 503 });
  }

  if (runtimeCode === "DB_DRIVER_MISSING") {
    return NextResponse.json<DbApiErrorPayload>({ message, code: "DB_DRIVER_MISSING" }, { status: 503 });
  }

  if (/relation .*work_orders.* does not exist/i.test(message)) {
    return NextResponse.json<DbApiErrorPayload>({ message, code: "DB_TABLE_MISSING" }, { status: 503 });
  }

  if (/work_orders table is missing required columns/i.test(message)) {
    return NextResponse.json<DbApiErrorPayload>({ message, code: "DB_SCHEMA_UNSUPPORTED" }, { status: 503 });
  }

  if (/column .* does not exist/i.test(message) || /invalid input syntax/i.test(message) || /cannot cast/i.test(message)) {
    return NextResponse.json<DbApiErrorPayload>({ message, code: "DB_SCHEMA_INVALID" }, { status: 503 });
  }

  if (runtimeCode === "DB_CONNECTION_FAILED") {
    return NextResponse.json<DbApiErrorPayload>({ message, code: "DB_CONNECTION_FAILED" }, { status: 503 });
  }

  return NextResponse.json<DbApiErrorPayload>({ message, code: "DB_REQUEST_FAILED" }, { status: 500 });
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ message: "DATABASE_URL is not configured.", code: "DB_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const workOrders = await findAllDbWorkOrders();
    return NextResponse.json({ workOrders });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to fetch work orders.");
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ message: "DATABASE_URL is not configured.", code: "DB_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { workOrder?: WorkOrder };

    if (!body?.workOrder) {
      return NextResponse.json({ message: "workOrder payload is required.", code: "INVALID_PAYLOAD" }, { status: 400 });
    }

    const workOrder = await createDbWorkOrder(body.workOrder);
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    return createDbErrorResponse(error, "Failed to create work order.");
  }
}
