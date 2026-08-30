import type {
  WorkOrderImageCommandResult,
  WorkOrderImageUploadTarget,
} from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { isJsonObject } from "../apiResponseNormalizer";
import { requestJson } from "../apiTransport";

export async function prepareWorkOrderImageUpload(
  workOrderId: string,
  file: { readonly name: string; readonly type: string; readonly size: number },
): Promise<WorkOrderImageUploadTarget> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/images/upload`,
    { method: "POST", body: { file } },
  );
  const data = isJsonObject(body.data) ? body.data : null;
  const target = data && isJsonObject(data.uploadTarget) ? data.uploadTarget : null;
  if (
    !body.ok
    || !target
    || typeof target.storageKey !== "string"
    || typeof target.fileName !== "string"
    || typeof target.contentType !== "string"
    || !Number.isSafeInteger(target.fileSize)
    || typeof target.uploadUrl !== "string"
    || target.method !== "PUT"
    || !isJsonObject(target.headers)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 업로드 준비 응답이 올바르지 않습니다." });
  }
  return {
    storageKey: target.storageKey,
    fileName: target.fileName,
    contentType: target.contentType,
    fileSize: Number(target.fileSize),
    uploadUrl: target.uploadUrl,
    method: "PUT",
    headers: Object.fromEntries(Object.entries(target.headers).map(([key, value]) => [key, String(value)])),
    expiresInSeconds: Number(target.expiresInSeconds ?? 0),
  };
}

export async function completeWorkOrderImageUpload(
  workOrderId: string,
  input: {
    readonly expectedVersion: number;
    readonly clientRequestId: string;
    readonly idempotencyKey: string;
    readonly uploadTarget: WorkOrderImageUploadTarget;
  },
): Promise<WorkOrderImageCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderImageCommandResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/images/upload/complete`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      timeoutMs: 90_000,
      body: {
        expectedVersion: input.expectedVersion,
        clientRequestId: input.clientRequestId,
        uploadTarget: input.uploadTarget,
      },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 업로드 완료 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function reconcileWorkOrderImageUpload(
  workOrderId: string,
  input: { readonly clientRequestId: string; readonly idempotencyKey: string },
): Promise<WorkOrderImageCommandResult | null> {
  const query = new URLSearchParams({ clientRequestId: input.clientRequestId });
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: WorkOrderImageCommandResult | { readonly status: "pending"; readonly clientRequestId: string };
  }>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/images/upload/complete?${query.toString()}`, {
    method: "GET",
    idempotencyKey: input.idempotencyKey,
    timeoutMs: 30_000,
  });
  if (!body.ok || !body.data) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 등록 결과를 확인하지 못했습니다." });
  }
  if ("status" in body.data) {
    if (body.data.status !== "pending" || body.data.clientRequestId !== input.clientRequestId) {
      throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 등록 확인 응답이 올바르지 않습니다." });
    }
    return null;
  }
  if (body.data.workOrderId !== workOrderId || typeof body.data.imageId !== "string" || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 등록 확인 응답이 올바르지 않습니다." });
  }
  return body.data;
}

async function mutateWorkOrderImage(
  workOrderId: string,
  imageId: string,
  kind: "representative" | "delete",
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
): Promise<WorkOrderImageCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderImageCommandResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/images/${encodeURIComponent(imageId)}/${kind}`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: { expectedVersion: input.expectedVersion, clientRequestId: input.clientRequestId },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || body.data.imageId !== imageId || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 변경 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function setWorkOrderImageOutputInclude(
  workOrderId: string,
  imageId: string,
  input: {
    readonly expectedVersion: number;
    readonly clientRequestId: string;
    readonly idempotencyKey: string;
    readonly includeInDocument: boolean;
  },
): Promise<WorkOrderImageCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderImageCommandResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/images/${encodeURIComponent(imageId)}/output-include`,
    {
      method: "PATCH",
      idempotencyKey: input.idempotencyKey,
      body: {
        expectedVersion: input.expectedVersion,
        clientRequestId: input.clientRequestId,
        includeInDocument: input.includeInDocument,
      },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || body.data.imageId !== imageId
    || body.data.includeInDocument !== input.includeInDocument || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 출력 설정 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export function setRepresentativeWorkOrderImage(
  workOrderId: string,
  imageId: string,
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
) {
  return mutateWorkOrderImage(workOrderId, imageId, "representative", input);
}

export function deleteWorkOrderImage(
  workOrderId: string,
  imageId: string,
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
) {
  return mutateWorkOrderImage(workOrderId, imageId, "delete", input);
}
