import "server-only";

import { createHash } from "crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type {
  CompanyId,
  CompanyMemberId,
  CorrelationId,
  CreateWorkOrderDraftCommand,
  EntityVersion,
  PatchWorkOrderBasicInfoCommand,
  TenantMemberScope,
  WorkOrderApiErrorCode,
  WorkOrderDraftCommandResult,
  WorkOrderFieldError,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";
import {
  createWorkOrderDraftV2,
  patchWorkOrderBasicInfoV2,
  WORK_ORDER_CREATE_COMMAND_CODE,
  WorkOrderCommandRepositoryError,
  type WorkOrderCommandRepositoryResult,
} from "@/lib/domain/work-orders/command/commandRepository";
import { getWorkOrderV2CommandRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";

export class WorkOrderCommandRequestError extends Error {
  readonly code: WorkOrderApiErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly fieldErrors?: readonly WorkOrderFieldError[];
  readonly entityVersion?: EntityVersion;

  constructor(input: {
    readonly code: WorkOrderApiErrorCode;
    readonly status: number;
    readonly message: string;
    readonly retryable?: boolean;
    readonly fieldErrors?: readonly WorkOrderFieldError[];
    readonly entityVersion?: EntityVersion;
  }) {
    super(input.message);
    this.name = "WorkOrderCommandRequestError";
    this.code = input.code;
    this.status = input.status;
    this.retryable = input.retryable ?? false;
    this.fieldErrors = input.fieldErrors;
    this.entityVersion = input.entityVersion;
  }
}

export type WorkOrderCommandServiceResult = {
  readonly data: {
    readonly result: WorkOrderDraftCommandResult;
    readonly nextVersion: EntityVersion;
  };
  readonly idempotentReplay: boolean;
  readonly changedFields: readonly string[];
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function createCommandTenantScope(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
  readonly permissionCode: string;
}): TenantMemberScope {
  const companyMemberId = input.companyMemberId?.trim();
  if (!companyMemberId) {
    throw new WorkOrderCommandRequestError({
      code: "FORBIDDEN",
      status: 403,
      message: "Command actor로 사용할 활성 회사 멤버십이 필요합니다.",
    });
  }
  return {
    mode: "tenant_member",
    companyId: input.scope.companyId as CompanyId,
    companyMemberId: companyMemberId as CompanyMemberId,
    permissionCodes: [input.permissionCode],
    correlationId: input.correlationId,
  };
}

export function requireCommandMutationApproval(requiredMutationApproval?: string) {
  const guard = getWorkOrderV2CommandRuntimeGuard({
    requireMutationApproval: true,
    requiredMutationApproval,
  });
  if (!guard.ok) {
    throw new WorkOrderCommandRequestError({
      code: "FORBIDDEN",
      status: 403,
      message: "v2 제작 카드 Command mutation은 별도 승인된 dev/test runtime에서만 실행할 수 있습니다.",
    });
  }
}

function mapRepositoryError(error: WorkOrderCommandRepositoryError): never {
  const entityVersion = error.entityVersion === null
    ? undefined
    : error.entityVersion as EntityVersion;
  if (error.reason === "not_found") {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "제작 카드를 찾을 수 없습니다." });
  }
  if (error.reason === "conflict" || error.reason === "idempotency_conflict") {
    throw new WorkOrderCommandRequestError({
      code: "CONFLICT",
      status: 409,
      message: error.reason === "idempotency_conflict"
        ? "같은 Idempotency-Key가 다른 생성 내용에 이미 사용되었습니다."
        : "다른 변경이 먼저 저장되었습니다. 최신 버전을 다시 확인해 주세요.",
      entityVersion,
    });
  }
  if (error.reason === "locked") {
    throw new WorkOrderCommandRequestError({
      code: "LOCKED",
      status: 409,
      message: "작성중인 제작 카드만 기본정보를 수정할 수 있습니다.",
      entityVersion,
    });
  }
  if (error.reason === "revision_mismatch") {
    throw new WorkOrderCommandRequestError({
      code: "REVISION_MISMATCH",
      status: 409,
      message: "현재 draft revision이 아니어서 수정할 수 없습니다.",
      entityVersion,
    });
  }
  throw new WorkOrderCommandRequestError({
    code: "INTERNAL_ERROR",
    status: 500,
    message: "Idempotency 처리 상태를 확인하지 못했습니다.",
    retryable: true,
  });
}

function toServiceResult(result: WorkOrderCommandRepositoryResult): WorkOrderCommandServiceResult {
  return {
    data: { result: result.result, nextVersion: result.nextVersion },
    idempotentReplay: result.idempotentReplay,
    changedFields: result.changedFields,
    statementCount: result.statementCount,
    transactionCount: result.transactionCount,
    dbMs: result.dbMs,
  };
}

export async function createWorkOrderDraft(input: {
  readonly command: CreateWorkOrderDraftCommand;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): Promise<WorkOrderCommandServiceResult> {
  const tenantScope = createCommandTenantScope({
    scope: input.scope,
    companyMemberId: input.companyMemberId,
    correlationId: input.correlationId,
    permissionCode: "workorder.create",
  });
  requireCommandMutationApproval();

  const scopedIdempotencyKeyHash = sha256([
    WORK_ORDER_CREATE_COMMAND_CODE,
    tenantScope.companyId,
    tenantScope.companyMemberId,
    input.command.idempotencyKey,
  ].join("\0"));
  const requestHash = sha256(JSON.stringify({
    productName: input.command.productName,
    productTypeCode: input.command.productTypeCode ?? null,
    seasonCode: input.command.seasonCode ?? null,
    itemCode: input.command.itemCode ?? null,
    dueDate: input.command.dueDate ?? null,
    totalQuantity: input.command.totalQuantity ?? 0,
    memo: input.command.memo ?? null,
    factoryDeliveryMemo: input.command.factoryDeliveryMemo ?? null,
  }));

  try {
    return toServiceResult(await createWorkOrderDraftV2({
      scope: tenantScope,
      command: input.command,
      scopedIdempotencyKeyHash,
      requestHash,
    }));
  } catch (error) {
    if (error instanceof WorkOrderCommandRepositoryError) mapRepositoryError(error);
    throw error;
  }
}

export async function patchWorkOrderBasicInfo(input: {
  readonly workOrderId: string;
  readonly command: Omit<PatchWorkOrderBasicInfoCommand, "workOrderId">;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): Promise<WorkOrderCommandServiceResult> {
  if (!isUuid(input.workOrderId)) {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "제작 카드를 찾을 수 없습니다." });
  }
  const tenantScope = createCommandTenantScope({
    scope: input.scope,
    companyMemberId: input.companyMemberId,
    correlationId: input.correlationId,
    permissionCode: "workorder.update",
  });
  requireCommandMutationApproval();

  try {
    return toServiceResult(await patchWorkOrderBasicInfoV2({
      scope: tenantScope,
      assignedCompanyMemberId: input.scope.visibility?.mode === "assigned"
        ? input.scope.visibility.companyMemberId as CompanyMemberId | null
        : null,
      command: {
        ...input.command,
        workOrderId: input.workOrderId as WorkOrderId,
      },
    }));
  } catch (error) {
    if (error instanceof WorkOrderCommandRepositoryError) mapRepositoryError(error);
    throw error;
  }
}
