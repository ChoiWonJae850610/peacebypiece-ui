import "server-only";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type { CorrelationId, WorkOrderApiErrorCode, WorkOrderApiErrorEnvelope } from "@/lib/domain/work-orders/contracts";
import { WorkOrderPreviewRequestError, getIssuedWorkOrderPreview } from "@/lib/domain/work-orders/read/previewService";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";

function failure(code: WorkOrderApiErrorCode, message: string, status: number, correlationId: CorrelationId) {
  return NextResponse.json<WorkOrderApiErrorEnvelope>({ ok: false, error: { code, message, retryable: false, correlationId } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function handleGetIssuedWorkOrderPreview(request: Request, workOrderId: string, revisionId: string) {
  const correlationId = randomUUID() as CorrelationId;
  if (!getWorkOrderV2ReadRuntimeGuard().ok) return failure("FORBIDDEN", "Preview는 승인된 dev/test runtime에서만 사용할 수 있습니다.", 403, correlationId);
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) {
    const status = guard.response.status;
    return failure(status === 401 ? "AUTH_REQUIRED" : "FORBIDDEN", status === 401 ? "인증이 필요합니다." : "작업지시서를 볼 권한이 없습니다.", status, correlationId);
  }
  try {
    const result = await getIssuedWorkOrderPreview({ workOrderId, revisionId, scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId });
    return createWaflApiSuccess(result.data, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId, "X-WAFL-Preview-Query-Count": String(result.queryCount), "X-WAFL-Preview-DB-Ms": String(result.queryMs), "X-WAFL-Preview-Transaction-Ms": String(result.transactionMs) } });
  } catch (error) {
    if (error instanceof WorkOrderPreviewRequestError) return failure(error.code, error.message, error.status, correlationId);
    console.error("[WORK_ORDER_V2_PREVIEW_READ_FAILED]", { correlationId, errorName: error instanceof Error ? error.name : "UnknownError" });
    return failure("INTERNAL_ERROR", "작업지시서 Preview를 불러오지 못했습니다.", 500, correlationId);
  }
}
