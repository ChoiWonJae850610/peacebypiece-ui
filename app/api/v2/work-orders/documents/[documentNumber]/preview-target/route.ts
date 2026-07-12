import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { WorkOrderPreviewRequestError } from "@/lib/domain/work-orders/read/previewService";
import { resolveIssuedPreviewTarget } from "@/lib/domain/work-orders/read/previewTargetService";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";

export async function GET(_request: Request, context: { readonly params: Promise<{ documentNumber: string }> }) {
  const correlationId = randomUUID();
  const failure = (code: "AUTH_REQUIRED" | "FORBIDDEN" | "NOT_FOUND" | "INTERNAL_ERROR", message: string, status: number) => NextResponse.json({ ok: false, error: { code, message, retryable: false, correlationId } }, { status, headers: { "Cache-Control": "no-store" } });
  if (!getWorkOrderV2ReadRuntimeGuard().ok) return failure("FORBIDDEN", "Preview는 승인된 dev/test runtime에서만 사용할 수 있습니다.", 403);
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return failure(guard.response.status === 401 ? "AUTH_REQUIRED" : "FORBIDDEN", guard.response.status === 401 ? "인증이 필요합니다." : "작업지시서를 볼 권한이 없습니다.", guard.response.status);
  try {
    const { documentNumber } = await context.params;
    const result = await resolveIssuedPreviewTarget({ documentNumber, scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId });
    return createWaflApiSuccess(result.data, { headers: { "Cache-Control": "no-store", "X-WAFL-Preview-Target-Query-Count": String(result.queryCount), "X-WAFL-Preview-Target-DB-Ms": String(result.queryMs) } });
  } catch (error) {
    if (error instanceof WorkOrderPreviewRequestError) return failure(error.code === "NOT_FOUND" ? "NOT_FOUND" : "FORBIDDEN", error.message, error.status);
    console.error("[WORK_ORDER_V2_PREVIEW_TARGET_FAILED]", { correlationId, errorName: error instanceof Error ? error.name : "UnknownError" });
    return failure("INTERNAL_ERROR", "Preview 정보를 불러올 수 없습니다.", 500);
  }
}
