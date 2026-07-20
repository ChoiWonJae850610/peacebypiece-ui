import "server-only";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type { CorrelationId, WorkOrderApiErrorEnvelope } from "@/lib/domain/work-orders/contracts";
import {
  createCommandErrorResponse,
  mapCommandGuardFailureStatus,
  readBoundedCommandJson,
} from "@/lib/domain/work-orders/command/commandRoute";
import {
  addMaterialLine,
  type MaterialCommandServiceResult,
  patchMaterialLine,
  transitionMaterialLifecycle,
  transitionMaterialOrder,
} from "@/lib/domain/work-orders/command/materialCommandService";
import { getWorkOrderV2CommandRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import {
  validateAddMaterialLine,
  validateMaterialOrderTransition,
  validateMaterialLifecycleTransition,
  validatePatchMaterialLine,
} from "@/lib/domain/work-orders/command/materialValidation";
import { WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { WorkOrderCommandValidationError } from "@/lib/domain/work-orders/command/validation";

type MaterialCommandKind = "create" | "patch" | "archive" | "restore" | "request" | "cancel" | "complete";

function successResponse(
  result: MaterialCommandServiceResult,
  correlationId: CorrelationId,
  status: number,
) {
  return createWaflApiSuccess(result.data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-WAFL-Correlation-Id": correlationId,
      "X-WAFL-Command-Statement-Count": String(result.statementCount),
      "X-WAFL-Command-Transaction-Count": String(result.transactionCount),
      "X-WAFL-Command-DB-Ms": String(result.dbMs),
      "X-WAFL-Idempotent-Replay": result.idempotentReplay ? "1" : "0",
    },
  });
}

function permissionFor(kind: MaterialCommandKind) {
  if (kind === "request" || kind === "cancel") return "material.order.request" as const;
  if (kind === "complete") return "material.order.place" as const;
  return "workorder.update" as const;
}

async function handleMaterialCommand(input: {
  readonly request: Request;
  readonly workOrderId: string;
  readonly materialLineId?: string;
  readonly kind: MaterialCommandKind;
}): Promise<NextResponse | NextResponse<WorkOrderApiErrorEnvelope>> {
  const correlationId = randomUUID() as CorrelationId;
  const runtimeGuard = getWorkOrderV2CommandRuntimeGuard();
  if (!runtimeGuard.ok) {
    return createCommandErrorResponse({
      code: "FORBIDDEN", message: "v2 자재 Command API는 승인된 dev/test runtime에서만 사용할 수 있습니다.",
      status: 403, correlationId,
    });
  }
  const guard = await requireWorkspaceApiGuard({ permissionCode: permissionFor(input.kind) });
  if (!guard.ok) {
    return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  }

  try {
    const body = await readBoundedCommandJson(input.request);
    if (input.kind === "create") {
      const command = validateAddMaterialLine({ body, idempotencyKey: input.request.headers.get("Idempotency-Key") });
      const result = await addMaterialLine({
        workOrderId: input.workOrderId, command, scope: guard.scope,
        companyMemberId: guard.session.companyMemberId, correlationId,
      });
      return successResponse(result, correlationId, result.idempotentReplay ? 200 : 201);
    }
    if (input.kind === "patch") {
      const command = validatePatchMaterialLine(body);
      const result = await patchMaterialLine({
        workOrderId: input.workOrderId, materialLineId: input.materialLineId ?? "", command,
        scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId,
      });
      return successResponse(result, correlationId, 200);
    }
    if (input.kind === "archive" || input.kind === "restore") {
      const command = validateMaterialLifecycleTransition({ body, idempotencyKey: input.request.headers.get("Idempotency-Key") });
      const result = await transitionMaterialLifecycle({
        workOrderId: input.workOrderId, materialLineId: input.materialLineId ?? "",
        kind: input.kind, command, scope: guard.scope,
        companyMemberId: guard.session.companyMemberId, correlationId,
      });
      return successResponse(result, correlationId, 200);
    }

    const command = validateMaterialOrderTransition({
      body,
      idempotencyKey: input.request.headers.get("Idempotency-Key"),
      kind: input.kind,
    });
    const result = await transitionMaterialOrder({
      workOrderId: input.workOrderId,
      materialLineId: input.materialLineId ?? "",
      kind: input.kind,
      command,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return successResponse(result, correlationId, 200);
  } catch (error) {
    if (error instanceof WorkOrderCommandValidationError) {
      return createCommandErrorResponse({
        code: "VALIDATION_ERROR", message: error.message, status: 400,
        fieldErrors: error.fieldErrors, correlationId,
      });
    }
    if (error instanceof WorkOrderCommandRequestError) {
      return createCommandErrorResponse({
        code: error.code, message: error.message, status: error.status,
        retryable: error.retryable, fieldErrors: error.fieldErrors,
        entityVersion: error.entityVersion, correlationId,
      });
    }
    console.error("[WORK_ORDER_V2_MATERIAL_COMMAND_FAILED]", {
      correlationId,
      command: input.kind,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof error === "object" && error !== null && "code" in error ? String(error.code) : "UNKNOWN",
    });
    return createCommandErrorResponse({
      code: "INTERNAL_ERROR", message: "자재 변경을 처리하지 못했습니다.",
      status: 500, retryable: true, correlationId,
    });
  }
}

export function handleAddMaterialLineV2(request: Request, workOrderId: string) {
  return handleMaterialCommand({ request, workOrderId, kind: "create" });
}

export function handlePatchMaterialLineV2(request: Request, workOrderId: string, materialLineId: string) {
  return handleMaterialCommand({ request, workOrderId, materialLineId, kind: "patch" });
}

export function handleMaterialLifecycleTransitionV2(
  request: Request,
  workOrderId: string,
  materialLineId: string,
  kind: "archive" | "restore",
) {
  return handleMaterialCommand({ request, workOrderId, materialLineId, kind });
}

export function handleMaterialOrderTransitionV2(
  request: Request,
  workOrderId: string,
  materialLineId: string,
  kind: "request" | "cancel" | "complete",
) {
  return handleMaterialCommand({ request, workOrderId, materialLineId, kind });
}
