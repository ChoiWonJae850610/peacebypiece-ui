import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/client";
import { createDbWorkOrder, findAllDbWorkOrders } from "@/lib/workorder/repository/dbWorkOrderRepository";
import type { WorkOrder } from "@/types/workorder";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ message: "DATABASE_URL is not configured.", code: "DB_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const workOrders = await findAllDbWorkOrders();
    return NextResponse.json({ workOrders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch work orders.";
    return NextResponse.json({ message, code: "DB_REQUEST_FAILED" }, { status: 500 });
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
    const message = error instanceof Error ? error.message : "Failed to create work order.";
    return NextResponse.json({ message, code: "DB_REQUEST_FAILED" }, { status: 500 });
  }
}
