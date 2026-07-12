import "server-only";

import { randomUUID } from "crypto";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { createCommandErrorResponse, mapCommandGuardFailureStatus, readBoundedCommandJson } from "@/lib/domain/work-orders/command/commandRoute";
import { WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { issueWorkOrderRevision } from "@/lib/domain/work-orders/command/issueService";
import { validateIssueWorkOrder } from "@/lib/domain/work-orders/command/issueValidation";
import { getWorkOrderV2CommandRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import { WorkOrderCommandValidationError } from "@/lib/domain/work-orders/command/validation";

export async function handleIssueWorkOrderRevisionV2(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  const runtimeGuard = getWorkOrderV2CommandRuntimeGuard();
  if (!runtimeGuard.ok) {
    return createCommandErrorResponse({ code: "FORBIDDEN", message: "v2 발행 Command API는 승인된 dev/test runtime에서만 사용할 수 있습니다.", status: 403, correlationId });
  }
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });

  try {
    const command = validateIssueWorkOrder({
      body: await readBoundedCommandJson(request),
      idempotencyKey: request.headers.get("Idempotency-Key"),
    });
    const result = await issueWorkOrderRevision({
      workOrderId,
      command,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return createWaflApiSuccess(result.data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-WAFL-Correlation-Id": correlationId,
        "X-WAFL-Command-Statement-Count": String(result.statementCount),
        "X-WAFL-Command-Transaction-Count": String(result.transactionCount),
        "X-WAFL-Command-DB-Ms": String(result.dbMs),
        "X-WAFL-Idempotent-Replay": result.idempotentReplay ? "1" : "0",
      },
    });
  } catch (error) {
    if (error instanceof WorkOrderCommandValidationError) {
      return createCommandErrorResponse({ code: "VALIDATION_ERROR", message: error.message, status: 400, fieldErrors: error.fieldErrors, correlationId });
    }
    if (error instanceof WorkOrderCommandRequestError) {
      return createCommandErrorResponse({ code: error.code, message: error.message, status: error.status, retryable: error.retryable, fieldErrors: error.fieldErrors, entityVersion: error.entityVersion, correlationId });
    }
    console.error("[WORK_ORDER_V2_ISSUE_COMMAND_FAILED]", {
      correlationId,
      command: "revision-issue",
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof error === "object" && error !== null && "code" in error ? String(error.code) : "UNKNOWN",
    });
    return createCommandErrorResponse({ code: "INTERNAL_ERROR", message: "작업지시서 발행을 처리하지 못했습니다.", status: 500, retryable: true, correlationId });
  }
}
