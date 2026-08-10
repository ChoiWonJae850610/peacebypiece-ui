import "server-only";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import {
  createCommandErrorResponse,
  mapCommandGuardFailureStatus,
  readBoundedCommandJson,
} from "@/lib/domain/work-orders/command/commandRoute";
import { WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import {
  addColorStructure,
  addSizeStructure,
  deleteColorStructure,
  deleteSizeStructure,
  patchColorStructure,
  renameSizeStructure,
  reorderColorStructures,
  reorderSizeStructures,
  upsertColorSizeQuantity,
  type SizeColorStructureCommandServiceResult,
} from "@/lib/domain/work-orders/command/sizeColorStructureCommandService";
import {
  getWorkOrderV2DraftChildHardDeleteMutationRuntimeGuard,
  getWorkOrderV2SizeColorStructureMutationRuntimeGuard,
} from "@/lib/domain/work-orders/command/runtimeGuard";
import {
  validateAddColorStructure,
  validateAddSizeStructure,
  validateDeleteColorStructure,
  validateDeleteSizeStructure,
  validatePatchColorStructure,
  validateRenameSizeStructure,
  validateReorderColorStructures,
  validateReorderSizeStructures,
  validateUpsertColorSizeQuantity,
} from "@/lib/domain/work-orders/command/sizeColorStructureValidation";
import { WorkOrderCommandValidationError } from "@/lib/domain/work-orders/command/validation";
import type { CorrelationId, WorkOrderApiErrorEnvelope } from "@/lib/domain/work-orders/contracts";

type CommandKind =
  | "size-create"
  | "size-rename"
  | "size-delete"
  | "size-reorder"
  | "color-create"
  | "color-patch"
  | "color-delete"
  | "color-reorder"
  | "quantity-upsert";

function successResponse(
  result: SizeColorStructureCommandServiceResult,
  correlationId: CorrelationId,
  status: number,
) {
  return createWaflApiSuccess({
    result: result.result,
    nextVersion: result.nextVersion,
  }, {
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

async function handle(input: {
  readonly request: Request;
  readonly workOrderId: string;
  readonly targetId?: string;
  readonly secondaryTargetId?: string;
  readonly kind: CommandKind;
}): Promise<NextResponse | NextResponse<WorkOrderApiErrorEnvelope>> {
  const correlationId = randomUUID() as CorrelationId;
  const runtime = input.kind === "size-delete" || input.kind === "color-delete"
    ? getWorkOrderV2DraftChildHardDeleteMutationRuntimeGuard()
    : getWorkOrderV2SizeColorStructureMutationRuntimeGuard();
  if (!runtime.ok) {
    return createCommandErrorResponse({
      code: "FORBIDDEN",
      message: "승인된 사이즈·색상 dev/test runtime에서만 사용할 수 있습니다.",
      status: 403,
      correlationId,
    });
  }
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) {
    return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  }

  try {
    const body = await readBoundedCommandJson(input.request);
    const idempotencyKey = input.request.headers.get("Idempotency-Key");
    const common = {
      workOrderId: input.workOrderId,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    };
    let result: SizeColorStructureCommandServiceResult;
    if (input.kind === "size-create") {
      result = await addSizeStructure({ ...common, command: validateAddSizeStructure({ body, idempotencyKey }) });
    } else if (input.kind === "size-rename") {
      result = await renameSizeStructure({
        ...common,
        sizeRowId: input.targetId ?? "",
        command: validateRenameSizeStructure({ body, idempotencyKey }),
      });
    } else if (input.kind === "size-delete") {
      result = await deleteSizeStructure({
        ...common,
        sizeRowId: input.targetId ?? "",
        command: validateDeleteSizeStructure({ body, idempotencyKey }),
      });
    } else if (input.kind === "size-reorder") {
      result = await reorderSizeStructures({
        ...common,
        command: validateReorderSizeStructures({ body, idempotencyKey }),
      });
    } else if (input.kind === "color-create") {
      result = await addColorStructure({ ...common, command: validateAddColorStructure({ body, idempotencyKey }) });
    } else if (input.kind === "color-patch") {
      result = await patchColorStructure({
        ...common,
        colorId: input.targetId ?? "",
        command: validatePatchColorStructure({ body, idempotencyKey }),
      });
    } else if (input.kind === "color-delete") {
      result = await deleteColorStructure({
        ...common,
        colorId: input.targetId ?? "",
        command: validateDeleteColorStructure({ body, idempotencyKey }),
      });
    } else if (input.kind === "color-reorder") {
      result = await reorderColorStructures({
        ...common,
        command: validateReorderColorStructures({ body, idempotencyKey }),
      });
    } else {
      result = await upsertColorSizeQuantity({
        ...common,
        colorId: input.targetId ?? "",
        sizeRowId: input.secondaryTargetId ?? "",
        command: validateUpsertColorSizeQuantity({ body, idempotencyKey }),
      });
    }
    const created = input.kind === "size-create" || input.kind === "color-create";
    return successResponse(result, correlationId, created && !result.idempotentReplay ? 201 : 200);
  } catch (error) {
    if (error instanceof WorkOrderCommandValidationError) {
      return createCommandErrorResponse({
        code: "VALIDATION_ERROR",
        message: error.message,
        status: 400,
        fieldErrors: error.fieldErrors,
        correlationId,
      });
    }
    if (error instanceof WorkOrderCommandRequestError) {
      return createCommandErrorResponse({
        code: error.code,
        message: error.message,
        status: error.status,
        retryable: error.retryable,
        fieldErrors: error.fieldErrors,
        entityVersion: error.entityVersion,
        correlationId,
      });
    }
    console.error("[WORK_ORDER_V2_SIZE_COLOR_STRUCTURE_COMMAND_FAILED]", {
      correlationId,
      command: input.kind,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return createCommandErrorResponse({
      code: "INTERNAL_ERROR",
      message: "사이즈·색상 변경을 처리하지 못했습니다.",
      status: 500,
      retryable: true,
      correlationId,
    });
  }
}

export function handleAddSizeStructureV2(request: Request, workOrderId: string) {
  return handle({ request, workOrderId, kind: "size-create" });
}

export function handleRenameSizeStructureV2(request: Request, workOrderId: string, sizeRowId: string) {
  return handle({ request, workOrderId, targetId: sizeRowId, kind: "size-rename" });
}

export function handleDeleteSizeStructureV2(request: Request, workOrderId: string, sizeRowId: string) {
  return handle({ request, workOrderId, targetId: sizeRowId, kind: "size-delete" });
}

export function handleReorderSizeStructuresV2(request: Request, workOrderId: string) {
  return handle({ request, workOrderId, kind: "size-reorder" });
}

export function handleAddColorStructureV2(request: Request, workOrderId: string) {
  return handle({ request, workOrderId, kind: "color-create" });
}

export function handlePatchColorStructureV2(request: Request, workOrderId: string, colorId: string) {
  return handle({ request, workOrderId, targetId: colorId, kind: "color-patch" });
}

export function handleDeleteColorStructureV2(request: Request, workOrderId: string, colorId: string) {
  return handle({ request, workOrderId, targetId: colorId, kind: "color-delete" });
}

export function handleReorderColorStructuresV2(request: Request, workOrderId: string) {
  return handle({ request, workOrderId, kind: "color-reorder" });
}

export function handleUpsertColorSizeQuantityV2(
  request: Request,
  workOrderId: string,
  colorId: string,
  sizeRowId: string,
) {
  return handle({
    request,
    workOrderId,
    targetId: colorId,
    secondaryTargetId: sizeRowId,
    kind: "quantity-upsert",
  });
}
