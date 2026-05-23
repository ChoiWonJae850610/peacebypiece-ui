import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { isDatabaseConfigured } from "@/lib/db/client";
import { createOrderRequestPdfDisplayName } from "@/lib/workorder/generatedDocuments";
import { findDbWorkOrderById, type WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepository";
import { buildOrderRequestServerPdf, createPdfFileNameHeaderValue } from "@/lib/workorder/serverOrderRequestPdf";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    workOrderId: string;
  }>;
};

type OrderRequestPdfPayload = {
  requestNote?: unknown;
};

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function resolveCompanyScope(): Promise<{ ok: true; scope: WorkOrderCompanyScope; actorName: string | null } | { ok: false; response: NextResponse }> {
  const session = await getCurrentWaflSession();
  if (!session || !session.companyId) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "COMPANY_SESSION_REQUIRED" }, { status: 401 }),
    };
  }

  const blockedResponse = await createCompanyApiAccessBlockedResponse(session.companyId);
  if (blockedResponse) return { ok: false, response: blockedResponse };

  return {
    ok: true,
    actorName: session.name,
    scope: {
      companyId: session.companyId,
      companyName: session.companyName,
      visibility:
        session.role === "member"
          ? {
              mode: "assigned",
              userId: session.userId,
              companyMemberId: session.companyMemberId,
            }
          : { mode: "company" },
    },
  };
}

export async function POST(request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "DB_NOT_CONFIGURED" }, { status: 503 });
  }

  const { workOrderId } = await context.params;
  if (!workOrderId.trim()) {
    return NextResponse.json({ ok: false, error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
  }

  const scopeResult = await resolveCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  const payload = (await request.json().catch(() => null)) as OrderRequestPdfPayload | null;
  const requestNote = readText(payload?.requestNote);
  const workOrder = await findDbWorkOrderById(workOrderId, scopeResult.scope);
  if (!workOrder) {
    return NextResponse.json({ ok: false, error: "WORK_ORDER_NOT_FOUND" }, { status: 404 });
  }

  const pdf = buildOrderRequestServerPdf({ workOrder, requestNote });
  const fileName = createOrderRequestPdfDisplayName({
    workOrderTitle: workOrder.title,
    managerName: workOrder.managerName || scopeResult.actorName,
    createdAt: new Date(),
  });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": createPdfFileNameHeaderValue(fileName),
      "Cache-Control": "no-store",
    },
  });
}
