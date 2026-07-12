import "server-only";

import { createHash } from "crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type {
  AddMaterialLineCommand,
  CompanyMemberId,
  CorrelationId,
  EntityVersion,
  MaterialLineCommandResult,
  MaterialLineId,
  MaterialLinePatch,
  WorkOrderApiErrorCode,
  WorkOrderFieldError,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";
import {
  createCommandTenantScope,
  requireCommandMutationApproval,
  WorkOrderCommandRequestError,
} from "@/lib/domain/work-orders/command/commandService";
import {
  addMaterialLineV2,
  MATERIAL_CREATE_COMMAND_CODE,
  MATERIAL_ORDER_CANCEL_COMMAND_CODE,
  MATERIAL_ORDER_COMPLETE_COMMAND_CODE,
  MATERIAL_ORDER_REQUEST_COMMAND_CODE,
  MaterialCommandRepositoryError,
  type MaterialCommandRepositoryResult,
  type MaterialOrderTransitionKind,
  patchMaterialLineV2,
  transitionMaterialOrderV2,
} from "@/lib/domain/work-orders/command/materialCommandRepository";
import { WAFL_V2_ALPHA26_MUTATION_APPROVAL } from "@/lib/domain/work-orders/command/runtimeGuard";

export type MaterialCommandServiceResult = {
  readonly data: {
    readonly result: MaterialLineCommandResult;
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

function deterministicUuid(hash: string): MaterialLineId {
  const hex = sha256(`material-line\0${hash}`).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  const value = `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
  return value as MaterialLineId;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function assignedMemberId(scope: WorkspaceApiCompanyScope): CompanyMemberId | null {
  return scope.visibility?.mode === "assigned"
    ? scope.visibility.companyMemberId as CompanyMemberId
    : null;
}

function mapRepositoryError(error: MaterialCommandRepositoryError): never {
  const entityVersion = error.entityVersion === null ? undefined : error.entityVersion as EntityVersion;
  if (error.reason === "not_found") {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "자재 항목을 찾을 수 없습니다." });
  }
  if (error.reason === "conflict" || error.reason === "idempotency_conflict") {
    throw new WorkOrderCommandRequestError({
      code: "CONFLICT",
      status: 409,
      message: error.reason === "idempotency_conflict"
        ? "같은 Idempotency-Key가 다른 자재 요청에 이미 사용되었습니다."
        : "다른 자재 변경이 먼저 저장되었습니다. 최신 버전을 다시 확인해 주세요.",
      entityVersion,
    });
  }
  if (error.reason === "locked") {
    throw new WorkOrderCommandRequestError({
      code: "LOCKED", status: 409, message: "현재 상태의 자재 항목은 수정할 수 없습니다.", entityVersion,
    });
  }
  if (error.reason === "revision_mismatch") {
    throw new WorkOrderCommandRequestError({
      code: "REVISION_MISMATCH", status: 409, message: "현재 draft revision의 자재만 변경할 수 있습니다.", entityVersion,
    });
  }
  if (error.reason === "invalid_state_transition") {
    throw new WorkOrderCommandRequestError({
      code: "INVALID_STATE_TRANSITION", status: 409, message: "현재 자재 상태에서는 이 발주 작업을 수행할 수 없습니다.", entityVersion,
    });
  }
  if (error.reason === "order_not_ready") {
    const fieldErrors: readonly WorkOrderFieldError[] = [
      { field: "partnerId", code: "REQUIRED", message: "발주할 거래처가 필요합니다." },
      { field: "orderQuantity", code: "REQUIRED", message: "발주수량은 0보다 커야 합니다." },
    ];
    throw new WorkOrderCommandRequestError({
      code: "VALIDATION_ERROR", status: 400, message: "발주 필수 정보를 확인해 주세요.", fieldErrors, entityVersion,
    });
  }
  if (error.reason === "amount_out_of_range") {
    throw new WorkOrderCommandRequestError({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "발주수량과 단가의 계산 금액이 허용 범위를 초과합니다.",
      fieldErrors: [{ field: "orderQuantity", code: "AMOUNT_OVERFLOW", message: "발주수량 또는 단가를 줄여 주세요." }],
      entityVersion,
    });
  }
  throw new WorkOrderCommandRequestError({
    code: "INTERNAL_ERROR", status: 500, message: "자재 Command 처리 상태를 확인하지 못했습니다.", retryable: true,
  });
}

function toServiceResult(result: MaterialCommandRepositoryResult): MaterialCommandServiceResult {
  return {
    data: { result: result.result, nextVersion: result.nextVersion },
    idempotentReplay: result.idempotentReplay,
    changedFields: result.changedFields,
    statementCount: result.statementCount,
    transactionCount: result.transactionCount,
    dbMs: result.dbMs,
  };
}

function assertUuid(value: string) {
  if (!isUuid(value)) {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "자재 항목을 찾을 수 없습니다." });
  }
}

function scopedKeyHash(input: {
  readonly commandCode: string;
  readonly companyId: string;
  readonly companyMemberId: string;
  readonly idempotencyKey: string;
}) {
  return sha256([input.commandCode, input.companyId, input.companyMemberId, input.idempotencyKey].join("\0"));
}

export async function addMaterialLine(input: {
  readonly workOrderId: string;
  readonly command: Omit<AddMaterialLineCommand, "workOrderId">;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): Promise<MaterialCommandServiceResult> {
  assertUuid(input.workOrderId);
  const tenantScope = createCommandTenantScope({
    scope: input.scope, companyMemberId: input.companyMemberId,
    correlationId: input.correlationId, permissionCode: "workorder.update",
  });
  requireCommandMutationApproval(WAFL_V2_ALPHA26_MUTATION_APPROVAL);
  const keyHash = scopedKeyHash({
    commandCode: MATERIAL_CREATE_COMMAND_CODE,
    companyId: tenantScope.companyId,
    companyMemberId: tenantScope.companyMemberId,
    idempotencyKey: input.command.idempotencyKey,
  });
  const command: AddMaterialLineCommand = { ...input.command, workOrderId: input.workOrderId as WorkOrderId };
  const requestHash = sha256(JSON.stringify({
    workOrderId: command.workOrderId,
    expectedVersion: command.expectedVersion,
    materialType: command.materialType,
    materialId: command.materialId ?? null,
    name: command.name,
    partnerId: command.partnerId ?? null,
    colorOption: command.colorOption ?? null,
    usageArea: command.usageArea ?? null,
    requiredQuantity: command.requiredQuantity,
    allowanceQuantity: command.allowanceQuantity,
    inventoryUsageQuantity: command.inventoryUsageQuantity,
    orderQuantity: command.orderQuantity,
    unitCode: command.unitCode,
    unitPrice: command.unitPrice,
    memo: command.memo ?? null,
    displayOrder: command.displayOrder ?? null,
  }));

  try {
    return toServiceResult(await addMaterialLineV2({
      scope: tenantScope,
      assignedCompanyMemberId: assignedMemberId(input.scope),
      command,
      materialLineId: deterministicUuid(keyHash),
      scopedIdempotencyKeyHash: keyHash,
      requestHash,
    }));
  } catch (error) {
    if (error instanceof MaterialCommandRepositoryError) mapRepositoryError(error);
    throw error;
  }
}

export async function patchMaterialLine(input: {
  readonly workOrderId: string;
  readonly materialLineId: string;
  readonly command: { readonly clientRequestId: string; readonly expectedVersion: EntityVersion; readonly patch: MaterialLinePatch };
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): Promise<MaterialCommandServiceResult> {
  assertUuid(input.workOrderId);
  assertUuid(input.materialLineId);
  const tenantScope = createCommandTenantScope({
    scope: input.scope, companyMemberId: input.companyMemberId,
    correlationId: input.correlationId, permissionCode: "workorder.update",
  });
  requireCommandMutationApproval(WAFL_V2_ALPHA26_MUTATION_APPROVAL);
  try {
    return toServiceResult(await patchMaterialLineV2({
      scope: tenantScope,
      assignedCompanyMemberId: assignedMemberId(input.scope),
      workOrderId: input.workOrderId as WorkOrderId,
      materialLineId: input.materialLineId as MaterialLineId,
      expectedVersion: input.command.expectedVersion,
      clientRequestId: input.command.clientRequestId,
      patch: input.command.patch,
    }));
  } catch (error) {
    if (error instanceof MaterialCommandRepositoryError) mapRepositoryError(error);
    throw error;
  }
}

const TRANSITION_COMMAND_CODES = {
  request: MATERIAL_ORDER_REQUEST_COMMAND_CODE,
  cancel: MATERIAL_ORDER_CANCEL_COMMAND_CODE,
  complete: MATERIAL_ORDER_COMPLETE_COMMAND_CODE,
} as const;

export async function transitionMaterialOrder(input: {
  readonly workOrderId: string;
  readonly materialLineId: string;
  readonly kind: MaterialOrderTransitionKind;
  readonly command: {
    readonly clientRequestId: string;
    readonly expectedVersion: EntityVersion;
    readonly idempotencyKey: string;
    readonly reason?: string;
  };
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): Promise<MaterialCommandServiceResult> {
  assertUuid(input.workOrderId);
  assertUuid(input.materialLineId);
  const permissionCode = input.kind === "complete" ? "material.order.place" : "material.order.request";
  const tenantScope = createCommandTenantScope({
    scope: input.scope, companyMemberId: input.companyMemberId,
    correlationId: input.correlationId, permissionCode,
  });
  requireCommandMutationApproval(WAFL_V2_ALPHA26_MUTATION_APPROVAL);
  const commandCode = TRANSITION_COMMAND_CODES[input.kind];
  const keyHash = scopedKeyHash({
    commandCode,
    companyId: tenantScope.companyId,
    companyMemberId: tenantScope.companyMemberId,
    idempotencyKey: input.command.idempotencyKey,
  });
  const requestHash = sha256(JSON.stringify({
    workOrderId: input.workOrderId,
    materialLineId: input.materialLineId,
    expectedVersion: input.command.expectedVersion,
    kind: input.kind,
    reason: input.command.reason ?? null,
  }));

  try {
    return toServiceResult(await transitionMaterialOrderV2({
      scope: tenantScope,
      assignedCompanyMemberId: assignedMemberId(input.scope),
      workOrderId: input.workOrderId as WorkOrderId,
      materialLineId: input.materialLineId as MaterialLineId,
      expectedVersion: input.command.expectedVersion,
      clientRequestId: input.command.clientRequestId,
      reason: input.command.reason,
      kind: input.kind,
      scopedIdempotencyKeyHash: keyHash,
      requestHash,
    }));
  } catch (error) {
    if (error instanceof MaterialCommandRepositoryError) mapRepositoryError(error);
    throw error;
  }
}

export type MaterialCommandErrorCode = WorkOrderApiErrorCode;
