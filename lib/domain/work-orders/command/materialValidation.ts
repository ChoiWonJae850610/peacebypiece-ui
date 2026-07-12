import type {
  AddMaterialLineCommand,
  CancelMaterialOrderRequestCommand,
  CompleteMaterialOrderCommand,
  DecimalString,
  EntityVersion,
  MaterialLineId,
  MaterialLinePatch,
  MaterialId,
  MaterialType,
  PartnerId,
  PatchMaterialLineCommand,
  RequestMaterialOrderCommand,
} from "@/lib/domain/work-orders/contracts";
import {
  assertAllowedKeys,
  fieldError,
  hasOwn,
  isJsonObject,
  parseClientRequestId,
  parseIdempotencyKey,
  parseOptionalText,
  parseRequiredText,
  WorkOrderCommandValidationError,
} from "@/lib/domain/work-orders/command/validation";

const QUANTITY_PATTERN = /^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/;
const PRICE_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/;

function parseExpectedVersion(value: unknown): EntityVersion {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    throw new WorkOrderCommandValidationError([
      fieldError("expectedVersion", "REQUIRED", "expectedVersion은 1 이상의 정수여야 합니다."),
    ]);
  }
  return Number(value) as EntityVersion;
}

function parseMaterialType(value: unknown): MaterialType {
  if (value !== "fabric" && value !== "accessory") {
    throw new WorkOrderCommandValidationError([
      fieldError("materialType", "INVALID_VALUE", "materialType은 fabric 또는 accessory여야 합니다."),
    ]);
  }
  return value;
}

function parseDecimal(
  value: unknown,
  field: string,
  pattern: RegExp,
  scale: number,
): DecimalString {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw new WorkOrderCommandValidationError([
      fieldError(field, "INVALID_DECIMAL", `${field}은 0 이상의 소수점 ${scale}자리 이하 문자열이어야 합니다.`),
    ]);
  }
  return value as DecimalString;
}

function parseQuantity(value: unknown, field: string): DecimalString {
  return parseDecimal(value, field, QUANTITY_PATTERN, 3);
}

function parsePrice(value: unknown, field: string): DecimalString {
  return parseDecimal(value, field, PRICE_PATTERN, 2);
}

function parseOptionalReference(value: unknown, field: string, present: boolean) {
  return parseOptionalText(value, field, 200, present);
}

function parseDisplayOrder(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 100_000) {
    throw new WorkOrderCommandValidationError([
      fieldError("displayOrder", "INVALID_VALUE", "displayOrder는 0 이상 100,000 이하의 정수여야 합니다."),
    ]);
  }
  return Number(value);
}

function assertAmountWithinRange(orderQuantity: DecimalString, unitPrice: DecimalString) {
  const [quantityWhole, quantityFraction = ""] = orderQuantity.split(".");
  const [priceWhole, priceFraction = ""] = unitPrice.split(".");
  const quantityScaled = BigInt(quantityWhole) * BigInt(1000) + BigInt(quantityFraction.padEnd(3, "0"));
  const priceScaled = BigInt(priceWhole) * BigInt(100) + BigInt(priceFraction.padEnd(2, "0"));
  const amountCents = (quantityScaled * priceScaled + BigInt(500)) / BigInt(1000);
  if (amountCents > BigInt("99999999999999")) {
    throw new WorkOrderCommandValidationError([
      fieldError("orderQuantity", "AMOUNT_OVERFLOW", "발주수량과 단가의 계산 금액이 허용 범위를 초과합니다."),
    ]);
  }
}

export type ValidatedAddMaterialLineBody = Omit<AddMaterialLineCommand, "workOrderId">;

export function validateAddMaterialLine(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}): ValidatedAddMaterialLineBody {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object 요청이 필요합니다.")]);
  }
  assertAllowedKeys(input.body, new Set([
    "clientRequestId", "expectedVersion", "materialType", "materialId", "name", "partnerId",
    "colorOption", "requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity",
    "orderQuantity", "unitCode", "unitPrice", "memo", "displayOrder",
  ]));

  const orderQuantity = parseQuantity(input.body.orderQuantity, "orderQuantity");
  const unitPrice = parsePrice(input.body.unitPrice, "unitPrice");
  assertAmountWithinRange(orderQuantity, unitPrice);

  return {
    clientRequestId: parseClientRequestId(input.body.clientRequestId),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
    expectedVersion: parseExpectedVersion(input.body.expectedVersion),
    materialType: parseMaterialType(input.body.materialType),
    materialId: (parseOptionalReference(input.body.materialId, "materialId", hasOwn(input.body, "materialId")) ?? null) as MaterialId | null,
    name: parseRequiredText(input.body.name, "name", 200),
    partnerId: (parseOptionalReference(input.body.partnerId, "partnerId", hasOwn(input.body, "partnerId")) ?? null) as PartnerId | null,
    colorOption: parseOptionalText(input.body.colorOption, "colorOption", 200, hasOwn(input.body, "colorOption")) ?? null,
    requiredQuantity: parseQuantity(input.body.requiredQuantity, "requiredQuantity"),
    allowanceQuantity: parseQuantity(input.body.allowanceQuantity, "allowanceQuantity"),
    inventoryUsageQuantity: parseQuantity(input.body.inventoryUsageQuantity, "inventoryUsageQuantity"),
    orderQuantity,
    unitCode: parseRequiredText(input.body.unitCode, "unitCode", 32),
    unitPrice,
    memo: parseOptionalText(input.body.memo, "memo", 2_000, hasOwn(input.body, "memo")) ?? null,
    displayOrder: parseDisplayOrder(input.body.displayOrder),
  };
}

export type ValidatedPatchMaterialLineBody = Omit<PatchMaterialLineCommand, "workOrderId" | "materialLineId">;

export function validatePatchMaterialLine(body: unknown): ValidatedPatchMaterialLineBody {
  if (!isJsonObject(body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object 요청이 필요합니다.")]);
  }
  assertAllowedKeys(body, new Set(["clientRequestId", "expectedVersion", "patch"]));
  if (!isJsonObject(body.patch)) {
    throw new WorkOrderCommandValidationError([fieldError("patch", "INVALID_TYPE", "patch JSON object가 필요합니다.")]);
  }
  assertAllowedKeys(body.patch, new Set([
    "name", "materialId", "partnerId", "colorOption", "requiredQuantity", "allowanceQuantity",
    "inventoryUsageQuantity", "orderQuantity", "unitCode", "unitPrice", "memo",
  ]), "patch.");
  if (Object.keys(body.patch).length === 0) {
    throw new WorkOrderCommandValidationError([fieldError("patch", "EMPTY_PATCH", "변경할 자재 정보를 하나 이상 입력해 주세요.")]);
  }

  const patch: MaterialLinePatch = {
    ...(hasOwn(body.patch, "name") ? { name: parseRequiredText(body.patch.name, "patch.name", 200) } : {}),
    ...(hasOwn(body.patch, "materialId") ? { materialId: parseOptionalReference(body.patch.materialId, "patch.materialId", true) as MaterialId | null } : {}),
    ...(hasOwn(body.patch, "partnerId") ? { partnerId: parseOptionalReference(body.patch.partnerId, "patch.partnerId", true) as PartnerId | null } : {}),
    ...(hasOwn(body.patch, "colorOption") ? { colorOption: parseOptionalText(body.patch.colorOption, "patch.colorOption", 200, true) } : {}),
    ...(hasOwn(body.patch, "requiredQuantity") ? { requiredQuantity: parseQuantity(body.patch.requiredQuantity, "patch.requiredQuantity") } : {}),
    ...(hasOwn(body.patch, "allowanceQuantity") ? { allowanceQuantity: parseQuantity(body.patch.allowanceQuantity, "patch.allowanceQuantity") } : {}),
    ...(hasOwn(body.patch, "inventoryUsageQuantity") ? { inventoryUsageQuantity: parseQuantity(body.patch.inventoryUsageQuantity, "patch.inventoryUsageQuantity") } : {}),
    ...(hasOwn(body.patch, "orderQuantity") ? { orderQuantity: parseQuantity(body.patch.orderQuantity, "patch.orderQuantity") } : {}),
    ...(hasOwn(body.patch, "unitCode") ? { unitCode: parseRequiredText(body.patch.unitCode, "patch.unitCode", 32) } : {}),
    ...(hasOwn(body.patch, "unitPrice") ? { unitPrice: parsePrice(body.patch.unitPrice, "patch.unitPrice") } : {}),
    ...(hasOwn(body.patch, "memo") ? { memo: parseOptionalText(body.patch.memo, "patch.memo", 2_000, true) } : {}),
  };

  assertAmountWithinRange(
    (patch.orderQuantity ?? "0") as DecimalString,
    (patch.unitPrice ?? "0") as DecimalString,
  );
  return {
    clientRequestId: parseClientRequestId(body.clientRequestId),
    expectedVersion: parseExpectedVersion(body.expectedVersion),
    patch,
  };
}

type MaterialTransitionBody = {
  readonly clientRequestId: ReturnType<typeof parseClientRequestId>;
  readonly expectedVersion: EntityVersion;
  readonly idempotencyKey: ReturnType<typeof parseIdempotencyKey>;
  readonly reason?: string;
};

export function validateMaterialOrderTransition(input: {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
  readonly kind: "request" | "cancel" | "complete";
}): MaterialTransitionBody {
  if (!isJsonObject(input.body)) {
    throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object 요청이 필요합니다.")]);
  }
  const allowed = input.kind === "cancel"
    ? new Set(["clientRequestId", "expectedVersion", "reason"])
    : new Set(["clientRequestId", "expectedVersion"]);
  assertAllowedKeys(input.body, allowed);
  return {
    clientRequestId: parseClientRequestId(input.body.clientRequestId),
    expectedVersion: parseExpectedVersion(input.body.expectedVersion),
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
    ...(input.kind === "cancel"
      ? { reason: parseRequiredText(input.body.reason, "reason", 500) }
      : {}),
  };
}

export function asMaterialLineId(value: string): MaterialLineId {
  return value as MaterialLineId;
}

export type ValidatedRequestMaterialOrderBody = Omit<RequestMaterialOrderCommand, "workOrderId" | "materialLineId">;
export type ValidatedCancelMaterialOrderBody = Omit<CancelMaterialOrderRequestCommand, "workOrderId" | "materialLineId">;
export type ValidatedCompleteMaterialOrderBody = Omit<CompleteMaterialOrderCommand, "workOrderId" | "materialLineId">;
