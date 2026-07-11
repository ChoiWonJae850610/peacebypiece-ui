import "server-only";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type {
  CorrelationId,
  WorkOrderApiErrorCode,
  WorkOrderApiErrorEnvelope,
} from "@/lib/domain/work-orders/contracts";
import {
  getWorkOrderListPage,
  WorkOrderListRequestError,
} from "@/lib/domain/work-orders/read/listService";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";

function createErrorResponse(input: {
  readonly code: WorkOrderApiErrorCode;
  readonly message: string;
  readonly status: number;
  readonly correlationId: CorrelationId;
  readonly retryable?: boolean;
}): NextResponse<WorkOrderApiErrorEnvelope> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: input.code,
        message: input.message,
        retryable: input.retryable ?? false,
        correlationId: input.correlationId,
      },
    },
    { status: input.status, headers: { "Cache-Control": "no-store" } },
  );
}

function mapGuardFailureStatus(status: number): { readonly code: WorkOrderApiErrorCode; readonly message: string; readonly status: number } {
  if (status === 401) return { code: "AUTH_REQUIRED", message: "인증된 회사 session이 필요합니다.", status: 401 };
  if (status === 404) return { code: "NOT_FOUND", message: "요청한 리소스를 찾을 수 없습니다.", status: 404 };
  return { code: "FORBIDDEN", message: "이 제작 카드 목록을 볼 권한이 없습니다.", status: status >= 400 && status < 500 ? status : 403 };
}

export async function handleGetWorkOrdersV2(request: Request) {
  const correlationId = randomUUID() as CorrelationId;
  const runtimeGuard = getWorkOrderV2ReadRuntimeGuard();
  if (!runtimeGuard.ok) {
    return createErrorResponse({
      code: "FORBIDDEN",
      message: "v2 제작 카드 Read API는 승인된 dev/test runtime에서만 사용할 수 있습니다.",
      status: 403,
      correlationId,
    });
  }

  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) {
    return createErrorResponse({ ...mapGuardFailureStatus(guard.response.status), correlationId });
  }

  try {
    const result = await getWorkOrderListPage({
      searchParams: new URL(request.url).searchParams,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    return createWaflApiSuccess(result.page, {
      headers: {
        "Cache-Control": "no-store",
        "X-WAFL-Correlation-Id": correlationId,
        "X-WAFL-List-Query-Count": String(result.queryCount),
        "X-WAFL-List-DB-Ms": String(result.listQueryMs),
        "X-WAFL-List-Transaction-Ms": String(result.transactionMs),
      },
    });
  } catch (error) {
    if (error instanceof WorkOrderListRequestError) {
      return createErrorResponse({
        code: error.code,
        message: error.message,
        status: error.status,
        retryable: error.retryable,
        correlationId,
      });
    }

    console.error("[WORK_ORDER_V2_LIST_FAILED]", {
      correlationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return createErrorResponse({
      code: "INTERNAL_ERROR",
      message: "제작 카드 목록을 불러오지 못했습니다.",
      status: 500,
      retryable: true,
      correlationId,
    });
  }
}
