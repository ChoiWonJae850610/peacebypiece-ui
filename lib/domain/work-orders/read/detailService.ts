import "server-only";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import {
  WORK_ORDER_TAB_DEFAULT_LIMIT,
  WORK_ORDER_TAB_MAX_LIMIT,
  type CompanyId,
  type CompanyMemberId,
  type CorrelationId,
  type OpaqueCursor,
  type TenantMemberScope,
  type WorkOrderApiErrorCode,
  type WorkOrderId,
} from "@/lib/domain/work-orders/contracts";
import {
  decodeWorkOrderTabCursor,
  encodeWorkOrderTabCursor,
  WorkOrderTabCursorError,
  type WorkOrderTabCursorKind,
} from "@/lib/domain/work-orders/read/detailCursor";
import {
  getWorkOrderAssetsV2,
  getWorkOrderDetailCoreV2,
  getWorkOrderDocumentsV2,
  getWorkOrderHistoryV2,
  getWorkOrderMaterialsV2,
  getWorkOrderProcessesV2,
  getWorkOrderSizeColorV2,
  getWorkOrderSizeSpecV2,
} from "@/lib/domain/work-orders/read/detailRepository";

export type WorkOrderDetailTab = "materials" | "size-color" | "size-spec" | "processes" | "assets" | "documents" | "history";

export class WorkOrderDetailRequestError extends Error {
  readonly code: WorkOrderApiErrorCode;
  readonly status: number;
  readonly retryable: boolean;

  constructor(input: { readonly code: WorkOrderApiErrorCode; readonly status: number; readonly message: string; readonly retryable?: boolean }) {
    super(input.message);
    this.name = "WorkOrderDetailRequestError";
    this.code = input.code;
    this.status = input.status;
    this.retryable = input.retryable ?? false;
  }
}

type ServiceInput = {
  readonly workOrderId: string;
  readonly searchParams: URLSearchParams;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
};

export type WorkOrderDetailServiceResult = {
  readonly data: unknown;
  readonly queryCount: number;
  readonly queryMs: number;
  readonly transactionMs: number;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function notFound(): never {
  throw new WorkOrderDetailRequestError({ code: "NOT_FOUND", status: 404, message: "제작 카드를 찾을 수 없습니다." });
}

function visibilityKey(scope: WorkspaceApiCompanyScope): string {
  return scope.visibility?.mode === "assigned"
    ? `assigned:${scope.visibility.companyMemberId ?? "missing"}`
    : "company";
}

function createContext(input: ServiceInput) {
  if (!isUuid(input.workOrderId)) notFound();
  const workOrderId = input.workOrderId as WorkOrderId;
  const companyMemberId = (input.companyMemberId?.trim() || `company-admin:${input.scope.companyId}`) as CompanyMemberId;
  const tenantScope: TenantMemberScope = {
    mode: "tenant_member",
    companyId: input.scope.companyId as CompanyId,
    companyMemberId,
    permissionCodes: ["workorder.read"],
    correlationId: input.correlationId,
  };
  return {
    workOrderId,
    tenantScope,
    assignedCompanyMemberId: input.scope.visibility?.mode === "assigned"
      ? input.scope.visibility.companyMemberId
      : null,
    visibilityKey: visibilityKey(input.scope),
  };
}

function assertAllowedQueryKeys(searchParams: URLSearchParams, allowed: ReadonlySet<string>) {
  for (const key of searchParams.keys()) {
    if (!allowed.has(key)) {
      throw new WorkOrderDetailRequestError({ code: "VALIDATION_ERROR", status: 400, message: `지원하지 않는 query parameter입니다: ${key}` });
    }
  }
}

function parseLimit(value: string | null): number {
  if (value === null || value === "") return WORK_ORDER_TAB_DEFAULT_LIMIT;
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new WorkOrderDetailRequestError({ code: "VALIDATION_ERROR", status: 400, message: "limit은 1 이상의 정수여야 합니다." });
  }
  if (Number(value) > WORK_ORDER_TAB_MAX_LIMIT) {
    throw new WorkOrderDetailRequestError({ code: "LIMIT_EXCEEDED", status: 400, message: `limit은 ${WORK_ORDER_TAB_MAX_LIMIT} 이하여야 합니다.` });
  }
  return Number(value);
}

function decodeCursor(input: {
  readonly value: string | null;
  readonly companyId: string;
  readonly visibilityKey: string;
  readonly workOrderId: WorkOrderId;
  readonly kind: WorkOrderTabCursorKind;
  readonly positionLength: number;
}): readonly string[] | null {
  if (!input.value) return null;
  try {
    const position = decodeWorkOrderTabCursor({
      cursor: input.value,
      companyId: input.companyId,
      visibilityKey: input.visibilityKey,
      workOrderId: input.workOrderId,
      kind: input.kind,
      positionLength: input.positionLength,
    });
    const last = position.at(-1) ?? "";
    if (!isUuid(last)) throw new WorkOrderTabCursorError();
    if ((input.kind.startsWith("materials") || input.kind === "assets") && !/^\d+$/.test(position[0] ?? "")) {
      throw new WorkOrderTabCursorError();
    }
    if (input.kind === "assets" && !new Set(["image", "attachment"]).has(position[1] ?? "")) {
      throw new WorkOrderTabCursorError();
    }
    if ((input.kind === "documents" || input.kind === "history") && !Number.isFinite(Date.parse(position[0] ?? ""))) {
      throw new WorkOrderTabCursorError();
    }
    return position;
  } catch (error) {
    if (error instanceof WorkOrderTabCursorError) {
      throw new WorkOrderDetailRequestError({ code: "CURSOR_INVALID", status: 400, message: "cursor가 유효하지 않거나 만료되었습니다." });
    }
    throw error;
  }
}

function toServiceResult(result: { readonly data: unknown; readonly queryCount: number; readonly queryMs: number; readonly transactionMs: number }): WorkOrderDetailServiceResult {
  if (result.data === null) notFound();
  return result;
}

export async function getWorkOrderDetailCore(input: ServiceInput): Promise<WorkOrderDetailServiceResult> {
  assertAllowedQueryKeys(input.searchParams, new Set());
  const context = createContext(input);
  return toServiceResult(await getWorkOrderDetailCoreV2({
    scope: context.tenantScope,
    workOrderId: context.workOrderId,
    assignedCompanyMemberId: context.assignedCompanyMemberId,
  }));
}

export async function getWorkOrderDetailTab(input: ServiceInput & { readonly tab: WorkOrderDetailTab }): Promise<WorkOrderDetailServiceResult> {
  const context = createContext(input);
  const base = {
    scope: context.tenantScope,
    workOrderId: context.workOrderId,
    assignedCompanyMemberId: context.assignedCompanyMemberId,
  };

  if (input.tab === "materials") {
    assertAllowedQueryKeys(input.searchParams, new Set(["type", "limit", "cursor"]));
    const materialType = input.searchParams.get("type");
    if (materialType !== "fabric" && materialType !== "accessory") {
      throw new WorkOrderDetailRequestError({ code: "VALIDATION_ERROR", status: 400, message: "type은 fabric 또는 accessory여야 합니다." });
    }
    const kind = `materials:${materialType}` as WorkOrderTabCursorKind;
    const cursorPosition = decodeCursor({
      value: input.searchParams.get("cursor"), companyId: input.scope.companyId,
      visibilityKey: context.visibilityKey, workOrderId: context.workOrderId, kind, positionLength: 2,
    });
    const result = await getWorkOrderMaterialsV2({ ...base, materialType, limit: parseLimit(input.searchParams.get("limit")), cursorPosition });
    if (!result.data) notFound();
    const nextCursor = result.nextPosition
      ? encodeWorkOrderTabCursor({ companyId: input.scope.companyId, visibilityKey: context.visibilityKey, workOrderId: context.workOrderId, kind, position: result.nextPosition })
      : null;
    return toServiceResult({ ...result, data: { ...result.data, nextCursor: nextCursor as OpaqueCursor | null } });
  }

  if (input.tab === "assets" || input.tab === "documents" || input.tab === "history") {
    assertAllowedQueryKeys(input.searchParams, new Set(["limit", "cursor"]));
    const kind = input.tab;
    const positionLength = input.tab === "assets" ? 3 : 2;
    const cursorPosition = decodeCursor({
      value: input.searchParams.get("cursor"), companyId: input.scope.companyId,
      visibilityKey: context.visibilityKey, workOrderId: context.workOrderId, kind, positionLength,
    });
    const collectionInput = { ...base, limit: parseLimit(input.searchParams.get("limit")), cursorPosition };
    const result = input.tab === "assets"
      ? await getWorkOrderAssetsV2(collectionInput)
      : input.tab === "documents"
        ? await getWorkOrderDocumentsV2(collectionInput)
        : await getWorkOrderHistoryV2(collectionInput);
    if (!result.data) notFound();
    const nextCursor = result.nextPosition
      ? encodeWorkOrderTabCursor({ companyId: input.scope.companyId, visibilityKey: context.visibilityKey, workOrderId: context.workOrderId, kind, position: result.nextPosition })
      : null;
    return toServiceResult({ ...result, data: { ...result.data, nextCursor: nextCursor as OpaqueCursor | null } });
  }

  assertAllowedQueryKeys(input.searchParams, new Set());
  if (input.tab === "size-color") return toServiceResult(await getWorkOrderSizeColorV2(base));
  if (input.tab === "size-spec") return toServiceResult(await getWorkOrderSizeSpecV2(base));
  return toServiceResult(await getWorkOrderProcessesV2(base));
}
