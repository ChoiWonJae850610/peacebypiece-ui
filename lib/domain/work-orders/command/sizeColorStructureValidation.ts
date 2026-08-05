import type {
  ColorId,
  EntityVersion,
  IdempotencyKey,
  SizeRowId,
} from "@/lib/domain/work-orders/contracts";
import { REORDER_ITEM_BATCH_MAX } from "@/lib/domain/work-orders/contracts";
import {
  assertAllowedKeys,
  fieldError,
  hasOwn,
  isJsonObject,
  parseClientRequestId,
  parseIdempotencyKey,
  WorkOrderCommandValidationError,
} from "@/lib/domain/work-orders/command/validation";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_PATTERN = /^#[0-9A-F]{6}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

function parseExpectedVersion(value: unknown): EntityVersion {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    throw new WorkOrderCommandValidationError([
      fieldError("expectedVersion", "INVALID_VERSION", "expectedVersion은 1 이상의 정수여야 합니다."),
    ]);
  }
  return Number(value) as EntityVersion;
}

function parseDisplayText(value: unknown, field: string, maximumLength: number): string {
  if (typeof value !== "string") {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_TYPE", `${field}은 문자열이어야 합니다.`),
    ]);
  }
  const normalized = value.normalize("NFKC").trim();
  if (!normalized || normalized.length > maximumLength || CONTROL_CHARACTER_PATTERN.test(normalized)) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_FORMAT", `${field} 형식을 확인해 주세요.`),
    ]);
  }
  return normalized;
}

function parseHexValue(value: unknown, present: boolean): string | null | undefined {
  if (!present) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new WorkOrderCommandValidationError([
      fieldError("patch.hexValue", "INVALID_TYPE", "hexValue는 null 또는 #RRGGBB 형식이어야 합니다."),
    ]);
  }
  const normalized = value.trim().toUpperCase();
  if (!HEX_PATTERN.test(normalized)) {
    throw new WorkOrderCommandValidationError([
      fieldError("hexValue", "INVALID_FORMAT", "hexValue는 null 또는 #RRGGBB 형식이어야 합니다."),
    ]);
  }
  return normalized;
}

function parseOrderedIds<T extends SizeRowId | ColorId>(
  value: unknown,
  field: string,
): readonly T[] {
  if (!Array.isArray(value) || value.length > REORDER_ITEM_BATCH_MAX) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_LENGTH", `${field}은 ${REORDER_ITEM_BATCH_MAX}개 이하여야 합니다.`),
    ]);
  }
  if (value.some((candidate) => typeof candidate !== "string" || !UUID_PATTERN.test(candidate))) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_ID", `${field}에 올바르지 않은 ID가 있습니다.`),
    ]);
  }
  if (new Set(value).size !== value.length) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "DUPLICATE_ID", `${field}에 중복 ID가 있습니다.`),
    ]);
  }
  return value as readonly T[];
}

function parseCommon(input: {
  readonly body: Record<string, unknown>;
  readonly idempotencyKey: string | null;
}) {
  return {
    clientRequestId: parseClientRequestId(input.body.clientRequestId),
    expectedVersion: parseExpectedVersion(input.body.expectedVersion),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey) as IdempotencyKey,
  };
}

export function validateAddSizeStructure(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}) {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object가 필요합니다.")]);
  }
  assertAllowedKeys(input.body, new Set(["clientRequestId", "expectedVersion", "displayLabel"]));
  return {
    ...parseCommon({ body: input.body, idempotencyKey: input.idempotencyKey }),
    displayLabel: parseDisplayText(input.body.displayLabel, "displayLabel", 40),
  };
}

export function validateRenameSizeStructure(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}) {
  return validateAddSizeStructure(input);
}

export function validateReorderSizeStructures(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}) {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object가 필요합니다.")]);
  }
  assertAllowedKeys(input.body, new Set(["clientRequestId", "expectedVersion", "orderedSizeRowIds"]));
  return {
    ...parseCommon({ body: input.body, idempotencyKey: input.idempotencyKey }),
    orderedSizeRowIds: parseOrderedIds<SizeRowId>(input.body.orderedSizeRowIds, "orderedSizeRowIds"),
  };
}

export function validateAddColorStructure(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}) {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object가 필요합니다.")]);
  }
  assertAllowedKeys(input.body, new Set(["clientRequestId", "expectedVersion", "displayName", "hexValue"]));
  return {
    ...parseCommon({ body: input.body, idempotencyKey: input.idempotencyKey }),
    displayName: parseDisplayText(input.body.displayName, "displayName", 80),
    hexValue: parseHexValue(input.body.hexValue, hasOwn(input.body, "hexValue")) ?? null,
  };
}

export function validatePatchColorStructure(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}) {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object가 필요합니다.")]);
  }
  assertAllowedKeys(input.body, new Set(["clientRequestId", "expectedVersion", "patch"]));
  if (!isJsonObject(input.body.patch)) {
    throw new WorkOrderCommandValidationError([fieldError("patch", "INVALID_TYPE", "patch object가 필요합니다.")]);
  }
  assertAllowedKeys(input.body.patch, new Set(["displayName", "hexValue"]), "patch.");
  if (Object.keys(input.body.patch).length === 0) {
    throw new WorkOrderCommandValidationError([fieldError("patch", "EMPTY_PATCH", "변경할 값을 입력해 주세요.")]);
  }
  return {
    ...parseCommon({ body: input.body, idempotencyKey: input.idempotencyKey }),
    patch: {
      ...(hasOwn(input.body.patch, "displayName")
        ? { displayName: parseDisplayText(input.body.patch.displayName, "patch.displayName", 80) }
        : {}),
      ...(hasOwn(input.body.patch, "hexValue")
        ? { hexValue: parseHexValue(input.body.patch.hexValue, true) }
        : {}),
    },
  };
}

export function validateReorderColorStructures(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}) {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object가 필요합니다.")]);
  }
  assertAllowedKeys(input.body, new Set(["clientRequestId", "expectedVersion", "orderedColorIds"]));
  return {
    ...parseCommon({ body: input.body, idempotencyKey: input.idempotencyKey }),
    orderedColorIds: parseOrderedIds<ColorId>(input.body.orderedColorIds, "orderedColorIds"),
  };
}

export function validateUpsertColorSizeQuantity(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}) {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object가 필요합니다.")]);
  }
  assertAllowedKeys(input.body, new Set(["clientRequestId", "expectedVersion", "quantity"]));
  if (!Number.isSafeInteger(input.body.quantity) || Number(input.body.quantity) < 0 || Number(input.body.quantity) > 100_000_000) {
    throw new WorkOrderCommandValidationError([
      fieldError("quantity", "INVALID_QUANTITY", "수량은 0 이상 100,000,000 이하의 정수여야 합니다."),
    ]);
  }
  return {
    ...parseCommon({ body: input.body, idempotencyKey: input.idempotencyKey }),
    quantity: Number(input.body.quantity),
  };
}
