import { randomUUID } from "node:crypto";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { createCommandErrorResponse, readBoundedCommandJson } from "@/lib/domain/work-orders/command/commandRoute";
import { WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { revokeGeneratedDocument } from "@/lib/generated-documents/work-order-pdf/revokeService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ workOrderId: string; documentRef: string }> }) {
  const correlationId = randomUUID() as Parameters<typeof revokeGeneratedDocument>[0]["correlationId"];
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;
  try {
    const { workOrderId, documentRef } = await context.params;
    const result = await revokeGeneratedDocument({ scope: guard.scope, companyMemberId: guard.session.companyMemberId,
      correlationId, workOrderId, documentId: documentRef, body: await readBoundedCommandJson(request),
      idempotencyKey: request.headers.get("Idempotency-Key")?.trim() ?? "" });
    return createWaflApiSuccess(result.result, { headers: { "Cache-Control": "no-store",
      "X-WAFL-Correlation-Id": correlationId, "X-WAFL-Idempotent-Replay": result.idempotentReplay ? "1" : "0",
      "X-WAFL-Command-Statement-Count": String(result.statementCount) } });
  } catch (error) {
    if (error instanceof WorkOrderCommandRequestError) return createCommandErrorResponse({ code: error.code,
      message: error.message, status: error.status, retryable: error.retryable, correlationId });
    console.error("[WORK_ORDER_DOCUMENT_REVOKE_FAILED]", { correlationId,
      errorName: error instanceof Error ? error.name : "UnknownError" });
    return createCommandErrorResponse({ code: "INTERNAL_ERROR", message: "PDF를 폐기하지 못했습니다.",
      status: 500, retryable: true, correlationId });
  }
}
