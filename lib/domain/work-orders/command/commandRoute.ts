import "server-only";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type {
  CorrelationId,
  EntityVersion,
  WorkOrderApiErrorCode,
  WorkOrderApiErrorEnvelope,
  WorkOrderFieldError,
} from "@/lib/domain/work-orders/contracts";
import {
  createWorkOrderDraft,
  patchWorkOrderBasicInfo,
  WorkOrderCommandRequestError,
} from "@/lib/domain/work-orders/command/commandService";
import { getWorkOrderV2CommandRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import {
  validateCreateWorkOrderDraft,
  validatePatchWorkOrderBasicInfo,
  WorkOrderCommandValidationError,
} from "@/lib/domain/work-orders/command/validation";

export const COMMAND_BODY_MAX_BYTES = 16 * 1024;

export function createCommandErrorResponse(input: {
  readonly code: WorkOrderApiErrorCode;
  readonly message: string;
  readonly status: number;
  readonly correlationId: CorrelationId;
  readonly retryable?: boolean;
  readonly fieldErrors?: readonly WorkOrderFieldError[];
  readonly entityVersion?: EntityVersion;
}): NextResponse<WorkOrderApiErrorEnvelope> {
  return NextResponse.json({
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      ...(input.fieldErrors ? { fieldErrors: input.fieldErrors } : {}),
      ...(input.entityVersion ? { entityVersion: input.entityVersion } : {}),
      retryable: input.retryable ?? false,
      correlationId: input.correlationId,
    },
  }, { status: input.status, headers: { "Cache-Control": "no-store" } });
}

export function mapCommandGuardFailureStatus(status: number): {
  readonly code: WorkOrderApiErrorCode;
  readonly message: string;
  readonly status: number;
} {
  if (status === 401) return { code: "AUTH_REQUIRED", message: "인증된 회사 session이 필요합니다.", status: 401 };
  if (status === 404) return { code: "NOT_FOUND", message: "제작 카드를 찾을 수 없습니다.", status: 404 };
  return {
    code: "FORBIDDEN",
    message: "제작 카드를 변경할 권한이 없습니다.",
    status: status >= 400 && status < 500 ? status : 403,
  };
}

export async function readBoundedCommandJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > COMMAND_BODY_MAX_BYTES) {
    throw new WorkOrderCommandValidationError([
      { field: "body", code: "PAYLOAD_TOO_LARGE", message: "요청 본문은 16KB 이하여야 합니다." },
    ]);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new WorkOrderCommandValidationError([
      { field: "body", code: "INVALID_JSON", message: "올바른 JSON 요청이 필요합니다." },
    ]);
  }
}

function commandSuccessResponse(
  result: Awaited<ReturnType<typeof createWorkOrderDraft>>,
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

async function handleCommand(input: {
  readonly request: Request;
  readonly kind: "create" | "patch";
  readonly workOrderId?: string;
}) {
  const correlationId = randomUUID() as CorrelationId;
  const runtimeGuard = getWorkOrderV2CommandRuntimeGuard();
  if (!runtimeGuard.ok) {
    return createCommandErrorResponse({
      code: "FORBIDDEN",
      message: "v2 제작 카드 Command API는 승인된 dev/test runtime에서만 사용할 수 있습니다.",
      status: 403,
      correlationId,
    });
  }

  const permissionCode = input.kind === "create" ? "workorder.create" : "workorder.update";
  const guard = await requireWorkspaceApiGuard({ permissionCode });
  if (!guard.ok) {
    return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  }

  try {
    const body = await readBoundedCommandJson(input.request);
    if (input.kind === "create") {
      const command = validateCreateWorkOrderDraft({
        body,
        idempotencyKey: input.request.headers.get("Idempotency-Key"),
      });
      const result = await createWorkOrderDraft({
        command,
        scope: guard.scope,
        companyMemberId: guard.session.companyMemberId,
        correlationId,
      });
      return commandSuccessResponse(result, correlationId, result.idempotentReplay ? 200 : 201);
    }

    const command = validatePatchWorkOrderBasicInfo(body);
    const result = await patchWorkOrderBasicInfo({
      workOrderId: input.workOrderId ?? "",
      command,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return commandSuccessResponse(result, correlationId, 200);
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

    console.error("[WORK_ORDER_V2_COMMAND_FAILED]", {
      correlationId,
      command: input.kind,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "UNKNOWN",
    });
    return createCommandErrorResponse({
      code: "INTERNAL_ERROR",
      message: "제작 카드 변경을 처리하지 못했습니다.",
      status: 500,
      retryable: true,
      correlationId,
    });
  }
}

export function handleCreateWorkOrderDraftV2(request: Request) {
  return handleCommand({ request, kind: "create" });
}

export function handlePatchWorkOrderBasicInfoV2(request: Request, workOrderId: string) {
  return handleCommand({ request, kind: "patch", workOrderId });
}
