import "server-only";

import { createHash } from "crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import {
  createCommandTenantScope,
  requireCommandMutationApproval,
  WorkOrderCommandRequestError,
} from "@/lib/domain/work-orders/command/commandService";
import {
  addColorStructureV2,
  addSizeStructureV2,
  COLOR_STRUCTURE_CREATE_COMMAND_CODE,
  COLOR_STRUCTURE_PATCH_COMMAND_CODE,
  COLOR_STRUCTURE_REORDER_COMMAND_CODE,
  COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE,
  patchColorStructureV2,
  renameSizeStructureV2,
  reorderColorStructuresV2,
  reorderSizeStructuresV2,
  upsertColorSizeQuantityV2,
  SIZE_STRUCTURE_CREATE_COMMAND_CODE,
  SIZE_STRUCTURE_RENAME_COMMAND_CODE,
  SIZE_STRUCTURE_REORDER_COMMAND_CODE,
  SizeColorStructureRepositoryError,
  type SizeColorStructureRepositoryResult,
} from "@/lib/domain/work-orders/command/sizeColorStructureCommandRepository";
import { WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL } from "@/lib/domain/work-orders/command/runtimeGuard";
import type {
  ColorId,
  CompanyMemberId,
  CorrelationId,
  EntityVersion,
  IdempotencyKey,
  SizeRowId,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";

export type SizeColorStructureCommandServiceResult = SizeColorStructureRepositoryResult;

type CommonInput = {
  readonly workOrderId: string;
  readonly command: {
    readonly clientRequestId: string;
    readonly expectedVersion: EntityVersion;
    readonly idempotencyKey: IdempotencyKey;
  };
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function deterministicUuid(namespace: string, hash: string) {
  const hex = sha256(`${namespace}\0${hash}`).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

function assertUuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "대상을 찾을 수 없습니다." });
  }
}

function assignedMemberId(scope: WorkspaceApiCompanyScope): CompanyMemberId | null {
  return scope.visibility?.mode === "assigned"
    ? scope.visibility.companyMemberId as CompanyMemberId
    : null;
}

function mapError(error: SizeColorStructureRepositoryError): never {
  const entityVersion = error.entityVersion === null ? undefined : error.entityVersion as EntityVersion;
  if (error.reason === "not_found") {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "대상을 찾을 수 없습니다." });
  }
  if (error.reason === "locked") {
    throw new WorkOrderCommandRequestError({
      code: "LOCKED", status: 409, message: "draft 작업지시서에서만 수정할 수 있습니다.", entityVersion,
    });
  }
  if (error.reason === "revision_mismatch") {
    throw new WorkOrderCommandRequestError({
      code: "REVISION_MISMATCH", status: 409, message: "현재 draft revision에서만 수정할 수 있습니다.", entityVersion,
    });
  }
  if (error.reason === "duplicate") {
    throw new WorkOrderCommandRequestError({
      code: "CONFLICT", status: 409, message: "같은 표시 이름이 이미 있습니다.", entityVersion,
    });
  }
  if (error.reason === "invalid_set") {
    throw new WorkOrderCommandRequestError({
      code: "CONFLICT", status: 409, message: "순서 변경 ID 집합이 현재 항목과 일치하지 않습니다.", entityVersion,
    });
  }
  if (error.reason === "conflict" || error.reason === "idempotency_conflict") {
    throw new WorkOrderCommandRequestError({
      code: "CONFLICT",
      status: 409,
      message: error.reason === "idempotency_conflict"
        ? "같은 Idempotency-Key가 다른 요청에 이미 사용되었습니다."
        : "다른 변경이 먼저 저장되었습니다. 최신 값을 다시 불러와 주세요.",
      entityVersion,
    });
  }
  throw new WorkOrderCommandRequestError({
    code: "INTERNAL_ERROR",
    status: 500,
    message: "사이즈·색상 명령 상태를 확인하지 못했습니다.",
    retryable: true,
  });
}

function prepare(input: CommonInput, commandCode: string, request: unknown) {
  assertUuid(input.workOrderId);
  const tenantScope = createCommandTenantScope({
    scope: input.scope,
    companyMemberId: input.companyMemberId,
    correlationId: input.correlationId,
    permissionCode: "workorder.update",
  });
  requireCommandMutationApproval(WAFL_V2_ALPHA59_SIZE_COLOR_STRUCTURE_MUTATION_APPROVAL);
  const scopedIdempotencyKeyHash = sha256([
    commandCode,
    tenantScope.companyId,
    tenantScope.companyMemberId,
    input.command.idempotencyKey,
  ].join("\0"));
  return {
    scope: tenantScope,
    assignedCompanyMemberId: assignedMemberId(input.scope),
    workOrderId: input.workOrderId as WorkOrderId,
    expectedVersion: input.command.expectedVersion,
    clientRequestId: input.command.clientRequestId,
    scopedIdempotencyKeyHash,
    requestHash: sha256(JSON.stringify(request)),
  };
}

async function mapped<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof SizeColorStructureRepositoryError) mapError(error);
    throw error;
  }
}

export function addSizeStructure(input: CommonInput & {
  readonly command: CommonInput["command"] & { readonly displayLabel: string };
}) {
  const common = prepare(input, SIZE_STRUCTURE_CREATE_COMMAND_CODE, {
    workOrderId: input.workOrderId,
    expectedVersion: input.command.expectedVersion,
    displayLabel: input.command.displayLabel,
  });
  const sizeRowId = deterministicUuid("work-order-size", common.scopedIdempotencyKeyHash) as SizeRowId;
  return mapped(() => addSizeStructureV2({ ...common, sizeRowId, displayLabel: input.command.displayLabel }));
}

export function renameSizeStructure(input: CommonInput & {
  readonly sizeRowId: string;
  readonly command: CommonInput["command"] & { readonly displayLabel: string };
}) {
  assertUuid(input.sizeRowId);
  const common = prepare(input, SIZE_STRUCTURE_RENAME_COMMAND_CODE, {
    workOrderId: input.workOrderId,
    sizeRowId: input.sizeRowId,
    expectedVersion: input.command.expectedVersion,
    displayLabel: input.command.displayLabel,
  });
  return mapped(() => renameSizeStructureV2({
    ...common,
    sizeRowId: input.sizeRowId as SizeRowId,
    displayLabel: input.command.displayLabel,
  }));
}

export function reorderSizeStructures(input: CommonInput & {
  readonly command: CommonInput["command"] & { readonly orderedSizeRowIds: readonly SizeRowId[] };
}) {
  const common = prepare(input, SIZE_STRUCTURE_REORDER_COMMAND_CODE, {
    workOrderId: input.workOrderId,
    expectedVersion: input.command.expectedVersion,
    orderedSizeRowIds: input.command.orderedSizeRowIds,
  });
  return mapped(() => reorderSizeStructuresV2({ ...common, orderedSizeRowIds: input.command.orderedSizeRowIds }));
}

export function addColorStructure(input: CommonInput & {
  readonly command: CommonInput["command"] & { readonly displayName: string; readonly hexValue: string | null };
}) {
  const common = prepare(input, COLOR_STRUCTURE_CREATE_COMMAND_CODE, {
    workOrderId: input.workOrderId,
    expectedVersion: input.command.expectedVersion,
    displayName: input.command.displayName,
    hexValue: input.command.hexValue,
  });
  const colorId = deterministicUuid("work-order-color", common.scopedIdempotencyKeyHash) as ColorId;
  return mapped(() => addColorStructureV2({
    ...common,
    colorId,
    displayName: input.command.displayName,
    hexValue: input.command.hexValue,
  }));
}

export function patchColorStructure(input: CommonInput & {
  readonly colorId: string;
  readonly command: CommonInput["command"] & {
    readonly patch: { readonly displayName?: string; readonly hexValue?: string | null };
  };
}) {
  assertUuid(input.colorId);
  const common = prepare(input, COLOR_STRUCTURE_PATCH_COMMAND_CODE, {
    workOrderId: input.workOrderId,
    colorId: input.colorId,
    expectedVersion: input.command.expectedVersion,
    patch: input.command.patch,
  });
  return mapped(() => patchColorStructureV2({
    ...common,
    colorId: input.colorId as ColorId,
    patch: input.command.patch,
  }));
}

export function reorderColorStructures(input: CommonInput & {
  readonly command: CommonInput["command"] & { readonly orderedColorIds: readonly ColorId[] };
}) {
  const common = prepare(input, COLOR_STRUCTURE_REORDER_COMMAND_CODE, {
    workOrderId: input.workOrderId,
    expectedVersion: input.command.expectedVersion,
    orderedColorIds: input.command.orderedColorIds,
  });
  return mapped(() => reorderColorStructuresV2({ ...common, orderedColorIds: input.command.orderedColorIds }));
}

export function upsertColorSizeQuantity(input: CommonInput & {
  readonly colorId: string;
  readonly sizeRowId: string;
  readonly command: CommonInput["command"] & { readonly quantity: number };
}) {
  assertUuid(input.colorId);
  assertUuid(input.sizeRowId);
  const common = prepare(input, COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE, {
    workOrderId: input.workOrderId,
    colorId: input.colorId,
    sizeRowId: input.sizeRowId,
    expectedVersion: input.command.expectedVersion,
    quantity: input.command.quantity,
  });
  return mapped(() => upsertColorSizeQuantityV2({
    ...common,
    colorId: input.colorId as ColorId,
    sizeRowId: input.sizeRowId as SizeRowId,
    quantity: input.command.quantity,
  }));
}
