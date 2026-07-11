import "server-only";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type {
  CompanyId,
  CompanyMemberId,
  CorrelationId,
  IsoDateTime,
  OpaqueCursor,
  TenantMemberScope,
  WorkOrderApiErrorCode,
  WorkOrderId,
  WorkOrderListPage,
} from "@/lib/domain/work-orders/contracts";
import {
  WORK_ORDER_LIST_DEFAULT_LIMIT,
  WORK_ORDER_LIST_MAX_LIMIT,
} from "@/lib/domain/work-orders/contracts";
import {
  decodeWorkOrderListCursor,
  encodeWorkOrderListCursor,
  WorkOrderListCursorError,
} from "@/lib/domain/work-orders/read/listCursor";
import { listWorkOrdersV2 } from "@/lib/domain/work-orders/read/listRepository";

const ALLOWED_QUERY_KEYS = new Set(["limit", "cursor"]);

export class WorkOrderListRequestError extends Error {
  readonly code: WorkOrderApiErrorCode;
  readonly status: number;
  readonly retryable: boolean;

  constructor(input: { readonly code: WorkOrderApiErrorCode; readonly status: number; readonly message: string; readonly retryable?: boolean }) {
    super(input.message);
    this.name = "WorkOrderListRequestError";
    this.code = input.code;
    this.status = input.status;
    this.retryable = input.retryable ?? false;
  }
}

export type WorkOrderListServiceResult = {
  readonly page: WorkOrderListPage;
  readonly queryCount: number;
  readonly listQueryMs: number;
  readonly transactionMs: number;
};

function parseLimit(value: string | null): number {
  if (value === null || value === "") return WORK_ORDER_LIST_DEFAULT_LIMIT;
  if (!/^\d+$/.test(value)) {
    throw new WorkOrderListRequestError({ code: "VALIDATION_ERROR", status: 400, message: "limit은 양의 정수여야 합니다." });
  }
  const limit = Number(value);
  if (limit < 1) {
    throw new WorkOrderListRequestError({ code: "VALIDATION_ERROR", status: 400, message: "limit은 1 이상이어야 합니다." });
  }
  if (limit > WORK_ORDER_LIST_MAX_LIMIT) {
    throw new WorkOrderListRequestError({ code: "LIMIT_EXCEEDED", status: 400, message: `limit은 ${WORK_ORDER_LIST_MAX_LIMIT} 이하여야 합니다.` });
  }
  return limit;
}

function visibilityKey(scope: WorkspaceApiCompanyScope): string {
  return scope.visibility?.mode === "assigned"
    ? `assigned:${scope.visibility.companyMemberId ?? "missing"}`
    : "company";
}

export async function getWorkOrderListPage(input: {
  readonly searchParams: URLSearchParams;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): Promise<WorkOrderListServiceResult> {
  for (const key of input.searchParams.keys()) {
    if (!ALLOWED_QUERY_KEYS.has(key)) {
      throw new WorkOrderListRequestError({ code: "VALIDATION_ERROR", status: 400, message: `지원하지 않는 query parameter입니다: ${key}` });
    }
  }

  const limit = parseLimit(input.searchParams.get("limit"));
  const scopeVisibilityKey = visibilityKey(input.scope);
  const cursorValue = input.searchParams.get("cursor");
  let cursorUpdatedAt: IsoDateTime | null = null;
  let cursorWorkOrderId: WorkOrderId | null = null;
  if (cursorValue) {
    try {
      const decoded = decodeWorkOrderListCursor({
        cursor: cursorValue,
        companyId: input.scope.companyId,
        visibilityKey: scopeVisibilityKey,
      });
      cursorUpdatedAt = decoded.updatedAt as IsoDateTime;
      cursorWorkOrderId = decoded.workOrderId;
    } catch (error) {
      if (error instanceof WorkOrderListCursorError) {
        throw new WorkOrderListRequestError({ code: "CURSOR_INVALID", status: 400, message: "cursor가 유효하지 않거나 만료되었습니다." });
      }
      throw error;
    }
  }

  const companyMemberId = (input.companyMemberId?.trim() || `company-admin:${input.scope.companyId}`) as CompanyMemberId;
  const tenantScope: TenantMemberScope = {
    mode: "tenant_member",
    companyId: input.scope.companyId as CompanyId,
    companyMemberId,
    permissionCodes: ["workorder.read"],
    correlationId: input.correlationId,
  };
  const assignedCompanyMemberId = input.scope.visibility?.mode === "assigned"
    ? (input.scope.visibility.companyMemberId as CompanyMemberId | null)
    : null;
  const result = await listWorkOrdersV2({
    scope: tenantScope,
    assignedCompanyMemberId,
    cursorUpdatedAt,
    cursorWorkOrderId,
    limit,
  });
  const nextCursor = result.hasMore && result.lastPosition
    ? encodeWorkOrderListCursor({
        companyId: input.scope.companyId,
        visibilityKey: scopeVisibilityKey,
        position: result.lastPosition,
      })
    : null;

  return {
    page: {
      items: result.items,
      nextCursor: nextCursor as OpaqueCursor | null,
      hasMore: result.hasMore,
      limit,
    },
    queryCount: result.queryCount,
    listQueryMs: result.listQueryMs,
    transactionMs: result.transactionMs,
  };
}
