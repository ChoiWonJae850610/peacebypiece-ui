import "server-only";

import { createHash } from "crypto";

import type {
  CompanyMemberId,
  CorrelationId,
  CreateWorkOrderReorderCommand,
  EntityVersion,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";
import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { createCommandTenantScope, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import {
  createWorkOrderReorderV2,
  readCompletedWorkOrderReorderReplay,
  ReorderCommandRepositoryError,
  WORK_ORDER_REORDER_CREATE_COMMAND_CODE,
} from "@/lib/domain/work-orders/command/reorderCommandRepository";
import {
  cleanupReorderAssetCopy,
  createReorderDeterministicId,
  prepareReorderAssetCopy,
} from "@/lib/domain/work-orders/command/reorderAssetCopy";
import { getWorkOrderV2ReorderMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function mapError(error: ReorderCommandRepositoryError): never {
  if (error.reason === "not_found") {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "리오더 원본 작업지시서를 찾을 수 없습니다." });
  }
  if (error.reason === "ineligible") {
    throw new WorkOrderCommandRequestError({ code: "INVALID_STATE_TRANSITION", status: 409, message: "발행된 본생산 작업지시서만 리오더할 수 있습니다." });
  }
  if (error.reason === "idempotency_conflict") {
    throw new WorkOrderCommandRequestError({ code: "CONFLICT", status: 409, message: "같은 Idempotency-Key가 다른 리오더 내용에 이미 사용되었습니다." });
  }
  throw new WorkOrderCommandRequestError({ code: "CONFLICT", status: 409, message: "리오더 생성 상태를 확인하고 다시 시도해 주세요.", retryable: true });
}

export async function createWorkOrderReorder(input: {
  readonly sourceWorkOrderId: string;
  readonly command: CreateWorkOrderReorderCommand;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.sourceWorkOrderId)) {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "리오더 원본 작업지시서를 찾을 수 없습니다." });
  }
  const runtime = getWorkOrderV2ReorderMutationRuntimeGuard();
  if (!runtime.ok) {
    throw new WorkOrderCommandRequestError({ code: "FORBIDDEN", status: 403, message: "리오더 생성은 승인된 dev/test runtime에서만 실행할 수 있습니다." });
  }
  const tenantScope = createCommandTenantScope({
    scope: input.scope,
    companyMemberId: input.companyMemberId,
    correlationId: input.correlationId,
    permissionCode: "workorder.create",
  });
  const scopedKey = sha256([WORK_ORDER_REORDER_CREATE_COMMAND_CODE, tenantScope.companyId, tenantScope.companyMemberId, input.command.idempotencyKey].join("\0"));
  const requestHash = sha256(JSON.stringify({
    sourceWorkOrderId: input.sourceWorkOrderId,
    totalQuantity: input.command.totalQuantity,
    dueDate: input.command.dueDate ?? null,
  }));
  try {
    const replay = await readCompletedWorkOrderReorderReplay({ scope: tenantScope, scopedIdempotencyKeyHash: scopedKey, requestHash });
    if (replay) return {
      data: { result: replay, nextVersion: 1 as EntityVersion },
      idempotentReplay: true,
      statementCount: 2,
      transactionCount: 1 as const,
      dbMs: 0,
    };
  } catch (error) {
    if (error instanceof ReorderCommandRepositoryError) mapError(error);
    throw error;
  }

  const targetWorkOrderId = createReorderDeterministicId(scopedKey, "work-order") as WorkOrderId;
  const targetRevisionId = createReorderDeterministicId(scopedKey, "revision");
  const targetSizeSpecId = createReorderDeterministicId(scopedKey, "size-spec");
  const copied = await prepareReorderAssetCopy({
    scope: tenantScope,
    sourceWorkOrderId: input.sourceWorkOrderId as WorkOrderId,
    targetWorkOrderId,
    idempotencySeed: scopedKey,
  });
  try {
    const result = await createWorkOrderReorderV2({
      scope: tenantScope,
      sourceWorkOrderId: input.sourceWorkOrderId as WorkOrderId,
      command: input.command,
      scopedIdempotencyKeyHash: scopedKey,
      requestHash,
      targetWorkOrderId,
      targetRevisionId: targetRevisionId as never,
      targetSizeSpecId,
      assets: copied.plan,
    });
    return {
      data: { result: result.result, nextVersion: result.nextVersion },
      idempotentReplay: result.idempotentReplay,
      statementCount: result.statementCount,
      transactionCount: result.transactionCount,
      dbMs: result.dbMs,
    };
  } catch (error) {
    await cleanupReorderAssetCopy(copied.copiedKeys);
    if (error instanceof ReorderCommandRepositoryError) mapError(error);
    throw error;
  }
}

export function assignedMemberFromScope(scope: WorkspaceApiCompanyScope): CompanyMemberId | null {
  return scope.visibility?.mode === "assigned" ? scope.visibility.companyMemberId as CompanyMemberId : null;
}
