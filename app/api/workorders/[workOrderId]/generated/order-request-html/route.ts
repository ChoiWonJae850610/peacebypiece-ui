import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { isDatabaseConfigured } from "@/lib/db/client";
import { buildOrderRequestHtmlDocument } from "@/lib/generated-documents/order-request/orderRequestHtmlDocument";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import { resolveOrderRequestRepresentativeImageDataUrl } from "@/lib/generated-documents/order-request/orderRequestRepresentativeImage";
import { findDbWorkOrderById, type WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderReadRepository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    workOrderId: string;
  }>;
};

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function resolveCompanyScope(): Promise<
  | {
      ok: true;
      scope: WorkOrderCompanyScope;
    }
  | { ok: false; response: NextResponse }
> {
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

export async function GET(request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "DB_NOT_CONFIGURED" }, { status: 503 });
  }

  const { workOrderId } = await context.params;
  if (!workOrderId.trim()) {
    return NextResponse.json({ ok: false, error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
  }

  const scopeResult = await resolveCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  const workOrder = await findDbWorkOrderById(workOrderId, scopeResult.scope);
  if (!workOrder) {
    return NextResponse.json({ ok: false, error: "WORK_ORDER_NOT_FOUND" }, { status: 404 });
  }

  const url = new URL(request.url);
  const requestNote = readText(url.searchParams.get("requestNote"));
  const repository = await createAttachmentMemoRepository();
  const snapshot = await repository.listSnapshotByWorkOrderId(workOrderId);
  const documentWorkOrder = {
    ...workOrder,
    attachments: snapshot.attachments,
    memoThreads: snapshot.memoThreads,
  };
  const representativeImageDataUrl = await resolveOrderRequestRepresentativeImageDataUrl(documentWorkOrder);
  const html = buildOrderRequestHtmlDocument({ workOrder: documentWorkOrder, requestNote, representativeImageDataUrl });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
