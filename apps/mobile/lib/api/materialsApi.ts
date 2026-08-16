import type {
  CreateMaterialLineInput,
  MaterialLifecycleCommandInput,
  MaterialLineCommandResult,
  MaterialOrderCommandInput,
  MaterialOrderCommandKind,
  MaterialType,
  PatchMaterialLineInput,
  WorkOrderMaterialLine,
  WorkOrderMaterialPage,
} from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { isJsonObject, normalizeMaterialCommandResult, normalizeMaterialLine } from "../apiResponseNormalizer";
import { requestJson } from "../apiTransport";

export async function getWorkOrderMaterialPartners(workOrderId: string): Promise<import("@/domain/mobileContract").WorkOrderMaterialPartnerPage> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: import("@/domain/mobileContract").WorkOrderMaterialPartnerPage }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/material-partners`,
    { method: "GET" },
  );
  const data = body.data;
  if (!body.ok || !data || data.workOrderId !== workOrderId || !Number.isSafeInteger(data.entityVersion) || !Array.isArray(data.items)
    || data.items.some((item) => !item || typeof item.id !== "string" || typeof item.name !== "string" || !item.id || !item.name.trim()
      || (item.role !== undefined && !["factory", "fabric", "subsidiary", "outsourcing"].includes(item.role))
      || (item.contactPerson !== undefined && item.contactPerson !== null && typeof item.contactPerson !== "string")
      || (item.contact !== undefined && item.contact !== null && typeof item.contact !== "string"))) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "거래처 목록 응답이 올바르지 않습니다." });
  }
  return data;
}

export async function getWorkOrderMaterials(
  workOrderId: string,
  materialType: MaterialType,
  cursor: string | null = null,
  lifecycle: "active" | "archived" = "active",
): Promise<WorkOrderMaterialPage> {
  const query = new URLSearchParams({ type: materialType, lifecycle, limit: "30" });
  if (cursor) query.set("cursor", cursor);
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials?${query.toString()}`,
    { method: "GET" },
  );
  if (!body.ok || !isJsonObject(body.data) || !Array.isArray(body.data.items)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "자재 정보 응답이 올바르지 않습니다." });
  }
  const lines = body.data.items.map(normalizeMaterialLine);
  if (
    body.data.workOrderId !== workOrderId
    || body.data.materialType !== materialType
    || body.data.lifecycle !== lifecycle
    || lines.some((line) => line === null)
    || lines.some((line) => line?.materialType !== materialType)
    || !(body.data.nextCursor === null || typeof body.data.nextCursor === "string")
    || typeof body.data.hasMore !== "boolean"
    || (body.data.hasMore && (typeof body.data.nextCursor !== "string" || body.data.nextCursor.length === 0))
    || (!body.data.hasMore && body.data.nextCursor !== null)
    || !Number.isSafeInteger(body.data.limit)
    || !Number.isSafeInteger(body.data.entityVersion)
    || !Number.isSafeInteger(body.data.totalCount)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "자재 정보 응답이 올바르지 않습니다." });
  }
  return {
    workOrderId,
    materialType,
    lifecycle,
    items: lines as WorkOrderMaterialLine[],
    nextCursor: body.data.nextCursor as string | null,
    hasMore: body.data.hasMore,
    limit: Number(body.data.limit),
    entityVersion: Number(body.data.entityVersion),
    totalCount: Number(body.data.totalCount),
  };
}

async function transitionWorkOrderMaterialLifecycle(
  workOrderId: string,
  materialLineId: string,
  kind: "archive" | "restore",
  command: MaterialLifecycleCommandInput,
  idempotencyKey: string,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials/${encodeURIComponent(materialLineId)}/${kind}`,
    { method: "POST", body: command, idempotencyKey },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  if (!normalized || normalized.result.materialLineId !== materialLineId || normalized.result.lifecycle !== (kind === "archive" ? "archived" : "active")) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "자재 정보 상태 변경 응답이 올바르지 않습니다." });
  }
  return normalized;
}
export function archiveWorkOrderMaterial(
  workOrderId: string,
  materialLineId: string,
  command: MaterialLifecycleCommandInput,
  idempotencyKey: string,
) {
  return transitionWorkOrderMaterialLifecycle(workOrderId, materialLineId, "archive", command, idempotencyKey);
}

export function restoreWorkOrderMaterial(
  workOrderId: string,
  materialLineId: string,
  command: MaterialLifecycleCommandInput,
  idempotencyKey: string,
) {
  return transitionWorkOrderMaterialLifecycle(workOrderId, materialLineId, "restore", command, idempotencyKey);
}

export async function deleteWorkOrderMaterial(
  workOrderId: string,
  materialLineId: string,
  command: MaterialLifecycleCommandInput,
  idempotencyKey: string,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials/${encodeURIComponent(materialLineId)}`,
    { method: "DELETE", body: command, idempotencyKey },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  if (
    !normalized
    || normalized.result.materialLineId !== materialLineId
    || normalized.result.deleted !== true
    || normalized.result.lifecycle !== "active"
  ) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 삭제 응답이 올바르지 않습니다." });
  return normalized;
}

export async function transitionWorkOrderMaterialOrder(
  workOrderId: string,
  materialLineId: string,
  kind: MaterialOrderCommandKind,
  command: MaterialOrderCommandInput,
  idempotencyKey: string,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials/${encodeURIComponent(materialLineId)}/order-${kind}`,
    { method: "POST", body: command, idempotencyKey },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  const expectedStatus = kind === "request" ? "requested" : kind === "cancel" ? "editing" : "completed";
  if (
    !normalized
    || normalized.result.materialLineId !== materialLineId
    || normalized.result.status !== expectedStatus
    || normalized.result.lifecycle !== "active"
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 발주 상태 응답이 올바르지 않습니다." });
  }
  return normalized;
}

export async function createWorkOrderMaterial(
  workOrderId: string,
  command: CreateMaterialLineInput,
  idempotencyKey: string,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials`,
    { method: "POST", body: command, idempotencyKey },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  if (!normalized) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 저장 응답이 올바르지 않습니다." });
  return normalized;
}

export async function patchWorkOrderMaterial(
  workOrderId: string,
  materialLineId: string,
  command: PatchMaterialLineInput,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials/${encodeURIComponent(materialLineId)}`,
    { method: "PATCH", body: command },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  if (!normalized || normalized.result.materialLineId !== materialLineId) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 저장 응답이 올바르지 않습니다." });
  }
  return normalized;
}
