import "server-only";

import { createHash } from "crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type {
  CompanyMemberId,
  CorrelationId,
  EntityVersion,
  IssueWorkOrderCommand,
  IssueWorkOrderCommandResult,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";
import { createCommandTenantScope, requireCommandMutationApproval, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import {
  issueWorkOrderRevisionV2,
  WORK_ORDER_ISSUE_COMMAND_CODE,
  WorkOrderIssueRepositoryError,
} from "@/lib/domain/work-orders/command/issueRepository";
import { WAFL_V2_ALPHA27_MUTATION_APPROVAL } from "@/lib/domain/work-orders/command/runtimeGuard";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function mapIssueError(error: WorkOrderIssueRepositoryError): never {
  const entityVersion = error.entityVersion === null ? undefined : error.entityVersion as EntityVersion;
  if (error.reason === "not_found") {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "제작 카드를 찾을 수 없습니다." });
  }
  if (error.reason === "conflict" || error.reason === "idempotency_conflict") {
    throw new WorkOrderCommandRequestError({
      code: "CONFLICT",
      status: 409,
      message: error.reason === "idempotency_conflict"
        ? "같은 Idempotency-Key가 다른 발행 요청에 이미 사용되었습니다."
        : "다른 변경이 먼저 저장되었습니다. 최신 버전을 확인해 주세요.",
      entityVersion,
    });
  }
  if (error.reason === "locked") {
    throw new WorkOrderCommandRequestError({ code: "LOCKED", status: 409, message: "현재 상태에서는 발행할 수 없습니다.", entityVersion });
  }
  if (error.reason === "revision_mismatch") {
    throw new WorkOrderCommandRequestError({ code: "REVISION_MISMATCH", status: 409, message: "현재 draft revision이 아니거나 이미 발행되었습니다.", entityVersion });
  }
  if (error.reason === "precondition_failed") {
    throw new WorkOrderCommandRequestError({ code: "DOCUMENT_NOT_READY", status: 409, message: "발행 필수 기본정보와 원단·부자재를 확인해 주세요.", entityVersion });
  }
  throw new WorkOrderCommandRequestError({ code: "INTERNAL_ERROR", status: 500, message: "발행 재시도 상태를 확인하지 못했습니다.", retryable: true });
}

export type WorkOrderIssueServiceResult = {
  readonly data: { readonly result: IssueWorkOrderCommandResult; readonly nextVersion: EntityVersion };
  readonly idempotentReplay: boolean;
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

export async function issueWorkOrderRevision(input: {
  readonly workOrderId: string;
  readonly command: Omit<IssueWorkOrderCommand, "workOrderId">;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): Promise<WorkOrderIssueServiceResult> {
  if (!UUID_PATTERN.test(input.workOrderId)) {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "제작 카드를 찾을 수 없습니다." });
  }
  const tenantScope = createCommandTenantScope({
    scope: input.scope,
    companyMemberId: input.companyMemberId,
    correlationId: input.correlationId,
    permissionCode: "workorder.update",
  });
  requireCommandMutationApproval(WAFL_V2_ALPHA27_MUTATION_APPROVAL);
  const command = { ...input.command, workOrderId: input.workOrderId as WorkOrderId };
  const scopedIdempotencyKeyHash = sha256([
    WORK_ORDER_ISSUE_COMMAND_CODE,
    tenantScope.companyId,
    tenantScope.companyMemberId,
    command.workOrderId,
    command.revisionId,
    command.idempotencyKey,
  ].join("\0"));
  const requestHash = sha256(JSON.stringify({
    workOrderId: command.workOrderId,
    revisionId: command.revisionId,
    expectedVersion: command.expectedVersion,
    expectedRevisionVersion: command.expectedRevisionVersion,
    issueNote: command.issueNote ?? null,
  }));
  try {
    const result = await issueWorkOrderRevisionV2({
      scope: tenantScope,
      assignedCompanyMemberId: input.scope.visibility?.mode === "assigned"
        ? input.scope.visibility.companyMemberId as CompanyMemberId | null
        : null,
      command,
      scopedIdempotencyKeyHash,
      requestHash,
    });
    return {
      data: { result: result.result, nextVersion: result.nextVersion },
      idempotentReplay: result.idempotentReplay,
      statementCount: result.statementCount,
      transactionCount: result.transactionCount,
      dbMs: result.dbMs,
    };
  } catch (error) {
    if (error instanceof WorkOrderIssueRepositoryError) mapIssueError(error);
    throw error;
  }
}
