import type {
  SizeColorStructureCommandBase,
  SizeColorStructureCommandResult,
  WorkOrderSizeColorMatrix,
  WorkOrderSizeSpec,
} from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { requestJson } from "../apiTransport";
import { isNonEmptyString, isNonNegativeSafeInteger } from "./apiValidation";
import {
  malformedSizeColorResponse,
  malformedSizeSpecResponse,
  normalizeWorkOrderSizeColor,
  normalizeWorkOrderSizeSpec,
} from "./sizeColorResponseNormalizer";

export async function getWorkOrderSizeColor(workOrderId: string): Promise<WorkOrderSizeColorMatrix> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-color`,
    { method: "GET" },
  );
  if (!body.ok) return malformedSizeColorResponse();
  return normalizeWorkOrderSizeColor(workOrderId, body.data);
}

export async function getWorkOrderSizeSpec(workOrderId: string): Promise<WorkOrderSizeSpec> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-spec`,
    { method: "GET" },
  );
  if (!body.ok) return malformedSizeSpecResponse();
  return normalizeWorkOrderSizeSpec(workOrderId, body.data);
}

export async function getWorkOrderStructureOptions(workOrderId: string): Promise<import("@/domain/mobileContract").WorkOrderStructureOptionPage> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: import("@/domain/mobileContract").WorkOrderStructureOptionPage }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-color/options`,
    { method: "GET" },
  );
  if (!body.ok || !body.data || !Number.isSafeInteger(body.data.entityVersion) || !Array.isArray(body.data.items)
    || !(body.data.categoryCode === null || ["T", "B", "O", "D", "S", "X"].includes(body.data.categoryCode))) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "회사 사이즈·색상 선택지 응답이 올바르지 않습니다." });
  }
  return body.data;
}


export async function createWorkOrderStructureOption(
  workOrderId: string,
  command: { readonly clientRequestId: string; readonly expectedVersion: number; readonly kind: "size" | "color" | "spec_item"; readonly displayName: string; readonly hexValue?: string | null },
  idempotencyKey: string,
) {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: { readonly item?: import("@/domain/mobileContract").CompanyWorkOrderStructureOption; readonly entityVersion?: number } }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-color/options`,
    { method: "POST", body: command, idempotencyKey },
  );
  if (!body.ok || !body.data?.item || body.data.item.sourceKind !== "company" || body.data.entityVersion !== command.expectedVersion) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "회사 선택지 저장 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function removeWorkOrderStructureOption(
  workOrderId: string,
  optionId: string,
  command: { readonly clientRequestId: string; readonly expectedVersion: number },
  idempotencyKey: string,
) {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: { readonly optionId?: string; readonly removed?: boolean; readonly deactivated?: boolean; readonly entityVersion?: number } }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-color/options/${encodeURIComponent(optionId)}`,
    { method: "DELETE", body: command, idempotencyKey },
  );
  if (!body.ok || body.data?.optionId !== optionId || body.data.removed !== true || body.data.entityVersion !== command.expectedVersion) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "회사 선택지 삭제 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function renameWorkOrderStructureOption(
  workOrderId: string,
  optionId: string,
  command: { readonly clientRequestId: string; readonly expectedVersion: number; readonly displayName: string },
  idempotencyKey: string,
) {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: { readonly item?: import("@/domain/mobileContract").CompanyWorkOrderStructureOption; readonly entityVersion?: number } }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-color/options/${encodeURIComponent(optionId)}`,
    { method: "PATCH", body: command, idempotencyKey },
  );
  if (!body.ok || body.data?.item?.id !== optionId || body.data.item.kind !== "spec_item" || body.data.entityVersion !== command.expectedVersion) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "회사 스펙 항목 변경 응답이 올바르지 않습니다." });
  }
  return body.data;
}


async function mutateSizeColorStructure(
  workOrderId: string,
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  command: SizeColorStructureCommandBase & Readonly<Record<string, unknown>>,
  idempotencyKey: string,
): Promise<SizeColorStructureCommandResult> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: { readonly result?: SizeColorStructureCommandResult; readonly nextVersion?: number };
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-color/${path}`,
    { method, body: command, idempotencyKey },
  );
  const result = body.data?.result;
  if (
    !body.ok
    || !result
    || result.workOrderId !== workOrderId
    || !isNonEmptyString(result.revisionId)
    || !(result.targetKind === "size" || result.targetKind === "color" || result.targetKind === "quantity")
    || (result.targetKind === "quantity" && !isNonNegativeSafeInteger(result.totalQuantity))
    || ((result.targetKind === "size" || result.targetKind === "color") && result.totalQuantity !== undefined && !isNonNegativeSafeInteger(result.totalQuantity))
    || (result.deletedQuantityCellCount !== undefined && !isNonNegativeSafeInteger(result.deletedQuantityCellCount))
    || (result.removedQuantity !== undefined && !isNonNegativeSafeInteger(result.removedQuantity))
    || (result.createdItems !== undefined && (!Array.isArray(result.createdItems) || result.createdItems.some((item) => !item
      || !isNonEmptyString(item.id) || !isNonEmptyString(item.displayName)
      || !(item.hexValue === null || typeof item.hexValue === "string"))))
    || (result.deletedTargetIds !== undefined && (!Array.isArray(result.deletedTargetIds) || result.deletedTargetIds.some((id) => !isNonEmptyString(id))))
    || !(result.targetId === null || isNonEmptyString(result.targetId))
    || !Number.isSafeInteger(result.nextVersion)
    || result.nextVersion < 1
    || body.data?.nextVersion !== result.nextVersion
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "사이즈·색상 변경 응답이 올바르지 않습니다." });
  }
  return result;
}

export function addWorkOrderSize(
  workOrderId: string,
  command: SizeColorStructureCommandBase & { readonly displayLabel: string },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "sizes", "POST", command, idempotencyKey);
}

export function renameWorkOrderSize(
  workOrderId: string,
  sizeRowId: string,
  command: SizeColorStructureCommandBase & { readonly displayLabel: string },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, `sizes/${encodeURIComponent(sizeRowId)}`, "PATCH", command, idempotencyKey);
}

export function deleteWorkOrderSize(
  workOrderId: string,
  sizeRowId: string,
  command: SizeColorStructureCommandBase,
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, `sizes/${encodeURIComponent(sizeRowId)}`, "DELETE", command, idempotencyKey);
}

export function reorderWorkOrderSizes(
  workOrderId: string,
  command: SizeColorStructureCommandBase & { readonly orderedSizeRowIds: readonly string[] },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "sizes/reorder", "POST", command, idempotencyKey);
}

export function addWorkOrderColor(
  workOrderId: string,
  command: SizeColorStructureCommandBase & { readonly displayName: string; readonly hexValue: string | null },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "colors", "POST", command, idempotencyKey);
}

export function patchWorkOrderColor(
  workOrderId: string,
  colorId: string,
  command: SizeColorStructureCommandBase & {
    readonly patch: { readonly displayName?: string; readonly hexValue?: string | null };
  },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, `colors/${encodeURIComponent(colorId)}`, "PATCH", command, idempotencyKey);
}

export function deleteWorkOrderColor(
  workOrderId: string,
  colorId: string,
  command: SizeColorStructureCommandBase,
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, `colors/${encodeURIComponent(colorId)}`, "DELETE", command, idempotencyKey);
}

export function reorderWorkOrderColors(
  workOrderId: string,
  command: SizeColorStructureCommandBase & { readonly orderedColorIds: readonly string[] },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "colors/reorder", "POST", command, idempotencyKey);
}

export function upsertWorkOrderColorSizeQuantity(
  workOrderId: string,
  colorId: string,
  sizeRowId: string,
  command: SizeColorStructureCommandBase & { readonly quantity: number },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(
    workOrderId,
    `quantities/${encodeURIComponent(colorId)}/${encodeURIComponent(sizeRowId)}`,
    "PATCH",
    command,
    idempotencyKey,
  );
}

export function batchWorkOrderColorSizeQuantities(
  workOrderId: string,
  command: import("@/domain/mobileContract").SizeColorQuantityBatchInput,
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "quantities/batch", "PATCH", command, idempotencyKey);
}

export function batchWorkOrderStructureSelection(
  workOrderId: string,
  command: import("@/domain/mobileContract").SizeColorSelectionBatchInput,
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "selection-batch", "POST", command, idempotencyKey);
}
