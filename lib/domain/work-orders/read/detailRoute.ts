import "server-only";

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import type { CorrelationId, WorkOrderApiErrorCode, WorkOrderApiErrorEnvelope } from "@/lib/domain/work-orders/contracts";
import {
  getWorkOrderDetailCore,
  getWorkOrderDetailTab,
  WorkOrderDetailRequestError,
  type WorkOrderDetailTab,
} from "@/lib/domain/work-orders/read/detailService";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";

function createErrorResponse(input: {
  readonly code: WorkOrderApiErrorCode;
  readonly message: string;
  readonly status: number;
  readonly correlationId: CorrelationId;
  readonly retryable?: boolean;
}): NextResponse<WorkOrderApiErrorEnvelope> {
  return NextResponse.json({
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      retryable: input.retryable ?? false,
      correlationId: input.correlationId,
    },
  }, { status: input.status, headers: { "Cache-Control": "no-store" } });
}

function mapGuardFailureStatus(status: number): { readonly code: WorkOrderApiErrorCode; readonly message: string; readonly status: number } {
  if (status === 401) return { code: "AUTH_REQUIRED", message: "인증된 회사 session이 필요합니다.", status: 401 };
  if (status === 404) return { code: "NOT_FOUND", message: "제작 카드를 찾을 수 없습니다.", status: 404 };
  return { code: "FORBIDDEN", message: "제작 카드를 볼 권한이 없습니다.", status: status >= 400 && status < 500 ? status : 403 };
}

async function handleRequest(input: { readonly request: Request; readonly workOrderId: string; readonly tab?: WorkOrderDetailTab }) {
  const correlationId = randomUUID() as CorrelationId;
  const runtimeGuard = getWorkOrderV2ReadRuntimeGuard();
  if (!runtimeGuard.ok) {
    return createErrorResponse({ code: "FORBIDDEN", message: "v2 제작 카드 Read API는 승인된 dev/test runtime에서만 사용할 수 있습니다.", status: 403, correlationId });
  }

  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return createErrorResponse({ ...mapGuardFailureStatus(guard.response.status), correlationId });

  try {
    const serviceInput = {
      workOrderId: input.workOrderId,
      searchParams: new URL(input.request.url).searchParams,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    };
    const result = input.tab
      ? await getWorkOrderDetailTab({ ...serviceInput, tab: input.tab })
      : await getWorkOrderDetailCore(serviceInput);
    return createWaflApiSuccess(result.data, {
      headers: {
        "Cache-Control": "no-store",
        "X-WAFL-Correlation-Id": correlationId,
        "X-WAFL-Detail-Statement-Count": String(result.queryCount),
        "X-WAFL-Detail-DB-Ms": String(result.queryMs),
        "X-WAFL-Detail-Transaction-Ms": String(result.transactionMs),
      },
    });
  } catch (error) {
    if (error instanceof WorkOrderDetailRequestError) {
      return createErrorResponse({ code: error.code, message: error.message, status: error.status, retryable: error.retryable, correlationId });
    }
    console.error("[WORK_ORDER_V2_DETAIL_READ_FAILED]", {
      correlationId,
      tab: input.tab ?? "core",
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "UNKNOWN",
    });
    return createErrorResponse({ code: "INTERNAL_ERROR", message: "제작 카드 상세를 불러오지 못했습니다.", status: 500, retryable: true, correlationId });
  }
}

export function handleGetWorkOrderDetailV2(request: Request, workOrderId: string) {
  return handleRequest({ request, workOrderId });
}

export function handleGetWorkOrderDetailTabV2(request: Request, workOrderId: string, tab: WorkOrderDetailTab) {
  return handleRequest({ request, workOrderId, tab });
}
