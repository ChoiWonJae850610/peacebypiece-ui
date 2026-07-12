import type {
  EntityVersion,
  IssueWorkOrderCommand,
  WorkOrderRevisionId,
} from "@/lib/domain/work-orders/contracts";
import {
  assertAllowedKeys,
  fieldError,
  hasOwn,
  isJsonObject,
  parseClientRequestId,
  parseIdempotencyKey,
  parseOptionalText,
  WorkOrderCommandValidationError,
} from "@/lib/domain/work-orders/command/validation";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseVersion(value: unknown, field: string): EntityVersion {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "REQUIRED", `${field}은 1 이상의 정수여야 합니다.`),
    ]);
  }
  return Number(value) as EntityVersion;
}

export function validateIssueWorkOrder(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}): Omit<IssueWorkOrderCommand, "workOrderId"> {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([
      fieldError("body", "INVALID_TYPE", "JSON object 요청이 필요합니다."),
    ]);
  }
  assertAllowedKeys(input.body, new Set([
    "clientRequestId",
    "expectedWorkOrderVersion",
    "expectedRevisionVersion",
    "expectedRevisionId",
    "issueNote",
  ]));
  if (typeof input.body.expectedRevisionId !== "string" || !UUID_PATTERN.test(input.body.expectedRevisionId)) {
    throw new WorkOrderCommandValidationError([
      fieldError("expectedRevisionId", "INVALID_FORMAT", "현재 revision 식별자가 올바르지 않습니다."),
    ]);
  }

  return {
    clientRequestId: parseClientRequestId(input.body.clientRequestId),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
    expectedVersion: parseVersion(input.body.expectedWorkOrderVersion, "expectedWorkOrderVersion"),
    expectedRevisionVersion: parseVersion(input.body.expectedRevisionVersion, "expectedRevisionVersion"),
    revisionId: input.body.expectedRevisionId as WorkOrderRevisionId,
    issueNote: parseOptionalText(input.body.issueNote, "issueNote", 1_000, hasOwn(input.body, "issueNote")) ?? null,
  };
}
