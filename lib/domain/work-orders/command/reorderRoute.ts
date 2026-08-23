import "server-only";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { createCommandErrorResponse, mapCommandGuardFailureStatus, readBoundedCommandJson } from "@/lib/domain/work-orders/command/commandRoute";
import { createWorkOrderReorder, assignedMemberFromScope } from "@/lib/domain/work-orders/command/reorderService";
import { validateCreateWorkOrderReorder, WorkOrderCommandValidationError } from "@/lib/domain/work-orders/command/validation";
import { WorkOrderCommandRequestError, createCommandTenantScope } from "@/lib/domain/work-orders/command/commandService";
import { readWorkOrderSeriesHistory } from "@/lib/domain/work-orders/read/lineageRepository";

export async function handleCreateWorkOrderReorder(request: Request, sourceWorkOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.create" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  try {
    const command = validateCreateWorkOrderReorder({ body: await readBoundedCommandJson(request), idempotencyKey: request.headers.get("Idempotency-Key") });
    const result = await createWorkOrderReorder({
      sourceWorkOrderId,
      command,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return createWaflApiSuccess(result.data, {
      status: result.idempotentReplay ? 200 : 201,
      headers: {
        "Cache-Control": "no-store",
        "X-WAFL-Correlation-Id": correlationId,
        "X-WAFL-Idempotent-Replay": result.idempotentReplay ? "1" : "0",
        "X-WAFL-Command-Transaction-Count": "1",
      },
    });
  } catch (error) {
    if (error instanceof WorkOrderCommandValidationError) {
      return createCommandErrorResponse({ code: "VALIDATION_ERROR", message: error.message, status: 400, fieldErrors: error.fieldErrors, correlationId });
    }
    if (error instanceof WorkOrderCommandRequestError) {
      return createCommandErrorResponse({ code: error.code, message: error.message, status: error.status, retryable: error.retryable, correlationId });
    }
    console.error("[WORK_ORDER_REORDER_CREATE_FAILED]", { correlationId, errorName: error instanceof Error ? error.name : "UnknownError" });
    return createCommandErrorResponse({ code: "INTERNAL_ERROR", message: "리오더를 만들지 못했습니다.", status: 500, retryable: true, correlationId });
  }
}

export async function handleGetWorkOrderSeriesHistory(_request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  if (!/^[0-9a-f-]{36}$/i.test(workOrderId)) return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "작업 이력을 찾을 수 없습니다.", retryable: false, correlationId } }, { status: 404 });
  const scope = createCommandTenantScope({ scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId, permissionCode: "workorder.read" });
  const data = await readWorkOrderSeriesHistory({ scope, workOrderId: workOrderId as never, assignedCompanyMemberId: assignedMemberFromScope(guard.scope) });
  if (!data) return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "작업 이력을 찾을 수 없습니다.", retryable: false, correlationId } }, { status: 404 });
  return createWaflApiSuccess(data, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
}
