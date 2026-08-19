import type { EntityVersion, IdempotencyKey } from "@/lib/domain/work-orders/contracts";
import { assertAllowedKeys, fieldError, isJsonObject, parseClientRequestId, parseIdempotencyKey, WorkOrderCommandValidationError } from "@/lib/domain/work-orders/command/validation";

export type ProductionRole = "factory" | "additional";
export type ProductionProcessWrite = { readonly role: ProductionRole; readonly processCode: string | null; readonly partnerId: string; readonly unitPrice: string; readonly memo: string | null };
export type ProductionProcessCommand = { readonly clientRequestId: string; readonly idempotencyKey: IdempotencyKey; readonly expectedVersion: EntityVersion; readonly process: ProductionProcessWrite };
export type DeleteProductionProcessCommand = Omit<ProductionProcessCommand, "process">;
export type ProductionOrderTransitionKind = "request" | "cancel" | "complete";

const PARTNER_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/iu;
const CODE = /^[a-z0-9][a-z0-9._-]{0,119}$/u;
const MONEY = /^(?:0|[1-9]\d{0,11})$/u;

function parseExpectedVersion(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new WorkOrderCommandValidationError([fieldError("expectedVersion", "REQUIRED", "expectedVersion이 필요합니다.")]);
  return Number(value) as EntityVersion;
}

function parseProcess(value: unknown): ProductionProcessWrite {
  if (!isJsonObject(value)) throw new WorkOrderCommandValidationError([fieldError("process", "INVALID_TYPE", "제작 정보를 입력해 주세요.")]);
  assertAllowedKeys(value, new Set(["role", "processCode", "partnerId", "unitPrice", "memo"]), "process.");
  const role = value.role;
  if (role !== "factory" && role !== "additional") throw new WorkOrderCommandValidationError([fieldError("process.role", "INVALID_VALUE", "제작 구분을 확인해 주세요.")]);
  const processCode = role === "factory" ? null : typeof value.processCode === "string" && CODE.test(value.processCode) ? value.processCode : null;
  if (role === "additional" && !processCode) throw new WorkOrderCommandValidationError([fieldError("process.processCode", "REQUIRED", "공정을 선택해 주세요.")]);
  if (typeof value.partnerId !== "string" || !PARTNER_ID.test(value.partnerId)) throw new WorkOrderCommandValidationError([fieldError("process.partnerId", "REQUIRED", "업체를 선택해 주세요.")]);
  if (typeof value.unitPrice !== "string" || !MONEY.test(value.unitPrice)) throw new WorkOrderCommandValidationError([fieldError("process.unitPrice", "INVALID_FORMAT", "장당 공임을 0 이상의 정수 원 단위로 입력해 주세요.")]);
  const memo = value.memo === null || value.memo === undefined || value.memo === "" ? null : typeof value.memo === "string" && value.memo.trim().length <= 100 ? value.memo.trim() : undefined;
  if (memo === undefined) throw new WorkOrderCommandValidationError([fieldError("process.memo", "INVALID_LENGTH", "메모는 100자 이하로 입력해 주세요.")]);
  return { role, processCode, partnerId: value.partnerId, unitPrice: value.unitPrice, memo };
}

export function validateProductionProcessCommand(body: unknown, idempotencyHeader: string | null): ProductionProcessCommand {
  if (!isJsonObject(body)) throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object 요청이 필요합니다.")]);
  assertAllowedKeys(body, new Set(["clientRequestId", "expectedVersion", "process"]));
  return { clientRequestId: parseClientRequestId(body.clientRequestId), idempotencyKey: parseIdempotencyKey(idempotencyHeader), expectedVersion: parseExpectedVersion(body.expectedVersion), process: parseProcess(body.process) };
}

export function validateDeleteProductionProcessCommand(body: unknown, idempotencyHeader: string | null): DeleteProductionProcessCommand {
  if (!isJsonObject(body)) throw new WorkOrderCommandValidationError([fieldError("body", "INVALID_TYPE", "JSON object 요청이 필요합니다.")]);
  assertAllowedKeys(body, new Set(["clientRequestId", "expectedVersion"]));
  return { clientRequestId: parseClientRequestId(body.clientRequestId), idempotencyKey: parseIdempotencyKey(idempotencyHeader), expectedVersion: parseExpectedVersion(body.expectedVersion) };
}
