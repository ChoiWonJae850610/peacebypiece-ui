import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { GeneratedDocumentGenerationError, generateIssuedWorkOrderDocument } from "@/lib/generated-documents/work-order-pdf/generationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const correlationId = randomUUID();
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;
  try {
    const body = await request.json() as { revisionId?: unknown };
    const revisionId = typeof body.revisionId === "string" ? body.revisionId : "";
    const { workOrderId } = await context.params;
    const result = await generateIssuedWorkOrderDocument({
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
      workOrderId,
      revisionId,
      idempotencyKey: request.headers.get("Idempotency-Key")?.trim() ?? "",
    });
    return createWaflApiSuccess(result, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  } catch (error) {
    if (error instanceof GeneratedDocumentGenerationError) {
      return NextResponse.json({ ok: false, error: { code: error.code, message: error.message, retryable: error.code === "GENERATION_FAILED", correlationId } }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[WORK_ORDER_DOCUMENT_GENERATION_FAILED]", {
      correlationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof error === "object" && error !== null && "code" in error ? String(error.code) : "UNKNOWN",
    });
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "문서를 생성하지 못했습니다.", retryable: true, correlationId } }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
