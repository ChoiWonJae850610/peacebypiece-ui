import type {
  ClientRequestId,
  CreateWorkOrderDraftCommand,
  EntityVersion,
  IdempotencyKey,
  IsoDate,
  PatchWorkOrderBasicInfoCommand,
  WorkOrderFieldError,
} from "@/lib/domain/work-orders/contracts";

const CLIENT_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type JsonObject = Record<string, unknown>;

export class WorkOrderCommandValidationError extends Error {
  readonly fieldErrors: readonly WorkOrderFieldError[];

  constructor(fieldErrors: readonly WorkOrderFieldError[]) {
    super("요청 내용을 확인해 주세요.");
    this.name = "WorkOrderCommandValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function fieldError(field: string, code: string, message: string): WorkOrderFieldError {
  return { field, code, message };
}

export function assertAllowedKeys(value: JsonObject, allowedKeys: ReadonlySet<string>, prefix = "") {
  const unsupported = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unsupported.length > 0) {
    throw new WorkOrderCommandValidationError(
      unsupported.map((key) => fieldError(`${prefix}${key}`, "UNSUPPORTED_FIELD", "지원하지 않는 필드입니다.")),
    );
  }
}

export function parseClientRequestId(value: unknown): ClientRequestId {
  if (typeof value !== "string" || !CLIENT_REQUEST_ID_PATTERN.test(value)) {
    throw new WorkOrderCommandValidationError([
      fieldError("clientRequestId", "INVALID_FORMAT", "clientRequestId 형식이 올바르지 않습니다."),
    ]);
  }
  return value as ClientRequestId;
}

export function parseIdempotencyKey(value: string | null): IdempotencyKey {
  if (!value || !IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw new WorkOrderCommandValidationError([
      fieldError("Idempotency-Key", "REQUIRED", "생성 요청에는 Idempotency-Key 헤더가 필요합니다."),
    ]);
  }
  return value as IdempotencyKey;
}

export function parseRequiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_LENGTH", `${field}은 1자 이상 ${maxLength}자 이하여야 합니다.`),
    ]);
  }
  return value.trim();
}

export function parseOptionalText(
  value: unknown,
  field: string,
  maxLength: number,
  present: boolean,
): string | null | undefined {
  if (!present) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_LENGTH", `${field}은 ${maxLength}자 이하여야 합니다.`),
    ]);
  }
  return value.trim() || null;
}

function parseOptionalDate(value: unknown, field: string, present: boolean): IsoDate | null | undefined {
  if (!present) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_DATE", `${field}은 YYYY-MM-DD 형식이어야 합니다.`),
    ]);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_DATE", `${field}에 유효한 날짜를 입력해 주세요.`),
    ]);
  }
  return value as IsoDate;
}

function parseOptionalQuantity(value: unknown, field: string, present: boolean): number | null | undefined {
  if (!present) return undefined;
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 100_000_000) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_QUANTITY", `${field}은 0 이상 100,000,000 이하의 정수여야 합니다.`),
    ]);
  }
  return Number(value);
}

export function hasOwn(value: JsonObject, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function validateCreateWorkOrderDraft(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}): CreateWorkOrderDraftCommand {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([
      fieldError("body", "INVALID_TYPE", "JSON object 요청이 필요합니다."),
    ]);
  }

  assertAllowedKeys(input.body, new Set([
    "clientRequestId",
    "productName",
    "productTypeCode",
    "seasonCode",
    "itemCode",
    "dueDate",
    "totalQuantity",
    "memo",
    "factoryDeliveryMemo",
  ]));

  return {
    clientRequestId: parseClientRequestId(input.body.clientRequestId),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
    productName: parseRequiredText(input.body.productName, "productName", 200),
    productTypeCode: parseOptionalText(input.body.productTypeCode, "productTypeCode", 120, hasOwn(input.body, "productTypeCode")) ?? null,
    seasonCode: parseOptionalText(input.body.seasonCode, "seasonCode", 16, hasOwn(input.body, "seasonCode")) ?? null,
    itemCode: parseOptionalText(input.body.itemCode, "itemCode", 24, hasOwn(input.body, "itemCode")) ?? null,
    dueDate: parseOptionalDate(input.body.dueDate, "dueDate", hasOwn(input.body, "dueDate")) ?? null,
    totalQuantity: parseOptionalQuantity(input.body.totalQuantity, "totalQuantity", hasOwn(input.body, "totalQuantity")) ?? 0,
    memo: parseOptionalText(input.body.memo, "memo", 5_000, hasOwn(input.body, "memo")) ?? null,
    factoryDeliveryMemo: parseOptionalText(input.body.factoryDeliveryMemo, "factoryDeliveryMemo", 5_000, hasOwn(input.body, "factoryDeliveryMemo")) ?? null,
  };
}

export type ValidatedPatchWorkOrderBasicInfoBody = Omit<
  PatchWorkOrderBasicInfoCommand,
  "workOrderId"
>;

export function validatePatchWorkOrderBasicInfo(body: unknown): ValidatedPatchWorkOrderBasicInfoBody {
  if (!isJsonObject(body)) {
    throw new WorkOrderCommandValidationError([
      fieldError("body", "INVALID_TYPE", "JSON object 요청이 필요합니다."),
    ]);
  }
  assertAllowedKeys(body, new Set(["clientRequestId", "expectedVersion", "patch"]));
  if (!Number.isSafeInteger(body.expectedVersion) || Number(body.expectedVersion) < 1) {
    throw new WorkOrderCommandValidationError([
      fieldError("expectedVersion", "REQUIRED", "expectedVersion은 1 이상의 정수여야 합니다."),
    ]);
  }
  if (!isJsonObject(body.patch)) {
    throw new WorkOrderCommandValidationError([
      fieldError("patch", "INVALID_TYPE", "patch JSON object가 필요합니다."),
    ]);
  }

  assertAllowedKeys(body.patch, new Set([
    "productName",
    "productTypeCode",
    "seasonCode",
    "itemCode",
    "dueDate",
    "totalQuantity",
    "memo",
    "factoryDeliveryMemo",
  ]), "patch.");
  if (Object.keys(body.patch).length === 0) {
    throw new WorkOrderCommandValidationError([
      fieldError("patch", "EMPTY_PATCH", "변경할 기본정보를 하나 이상 입력해 주세요."),
    ]);
  }

  const patch: PatchWorkOrderBasicInfoCommand["patch"] = {
    ...(hasOwn(body.patch, "productName")
      ? { productName: parseRequiredText(body.patch.productName, "patch.productName", 200) }
      : {}),
    ...(hasOwn(body.patch, "productTypeCode")
      ? { productTypeCode: parseOptionalText(body.patch.productTypeCode, "patch.productTypeCode", 120, true) }
      : {}),
    ...(hasOwn(body.patch, "seasonCode")
      ? { seasonCode: parseOptionalText(body.patch.seasonCode, "patch.seasonCode", 16, true) }
      : {}),
    ...(hasOwn(body.patch, "itemCode")
      ? { itemCode: parseOptionalText(body.patch.itemCode, "patch.itemCode", 24, true) }
      : {}),
    ...(hasOwn(body.patch, "dueDate")
      ? { dueDate: parseOptionalDate(body.patch.dueDate, "patch.dueDate", true) }
      : {}),
    ...(hasOwn(body.patch, "totalQuantity")
      ? { totalQuantity: parseOptionalQuantity(body.patch.totalQuantity, "patch.totalQuantity", true) }
      : {}),
    ...(hasOwn(body.patch, "memo")
      ? { memo: parseOptionalText(body.patch.memo, "patch.memo", 5_000, true) }
      : {}),
    ...(hasOwn(body.patch, "factoryDeliveryMemo")
      ? { factoryDeliveryMemo: parseOptionalText(body.patch.factoryDeliveryMemo, "patch.factoryDeliveryMemo", 5_000, true) }
      : {}),
  };

  return {
    clientRequestId: parseClientRequestId(body.clientRequestId),
    expectedVersion: Number(body.expectedVersion) as EntityVersion,
    patch,
  };
}
