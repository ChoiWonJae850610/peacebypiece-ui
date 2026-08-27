import type {
  WorkOrderImageAsset,
  WorkOrderImageCommandResult,
  WorkOrderImagePage,
  WorkOrderImageUploadTarget,
} from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { isJsonObject } from "../apiResponseNormalizer";
import { requestJson, resolveMobileApiUrl } from "../apiTransport";

export async function getWorkOrderImages(workOrderId: string): Promise<WorkOrderImagePage> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/assets?limit=50`,
    { method: "GET" },
  );
  if (!body.ok || !isJsonObject(body.data) || !Array.isArray(body.data.items)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "레시피 이미지 응답이 올바르지 않습니다." });
  }
  const images = body.data.items.filter(isJsonObject).filter((item) => item.assetType === "image");
  const attachments = body.data.items.filter(isJsonObject).filter((item) => item.assetType === "attachment");
  const valid = images.every((item) => (
    typeof item.id === "string"
    && typeof item.filename === "string"
    && typeof item.mimeType === "string"
    && Number.isSafeInteger(item.sizeBytes)
    && Number.isSafeInteger(item.displayOrder)
    && typeof item.isRepresentative === "boolean"
    && (item.thumbnailUrl === null || typeof item.thumbnailUrl === "string")
    && (item.previewUrl === null || typeof item.previewUrl === "string")
    && (item.fullscreenUrl === null || typeof item.fullscreenUrl === "string")
    && (item.originalUrl === null || typeof item.originalUrl === "string")
    && (item.viewUrl === null || typeof item.viewUrl === "string")
    && typeof item.uploadedAt === "string"
  ));
  if (
    !valid
    || !attachments.every((item) => (
      typeof item.id === "string"
      && typeof item.filename === "string"
      && typeof item.mimeType === "string"
      && Number.isSafeInteger(item.sizeBytes)
      && Number.isSafeInteger(item.displayOrder)
      && typeof item.includeInDocument === "boolean"
      && (item.viewUrl === null || typeof item.viewUrl === "string")
      && typeof item.uploadedAt === "string"
    ))
    || body.data.workOrderId !== workOrderId
    || typeof body.data.revisionId !== "string"
    || !Number.isSafeInteger(body.data.entityVersion)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "레시피 이미지 응답이 올바르지 않습니다." });
  }
  return {
    workOrderId,
    revisionId: body.data.revisionId,
    items: images.map((item): WorkOrderImageAsset => ({
      assetType: "image",
      id: String(item.id),
      filename: String(item.filename),
      optionalTitle: typeof item.optionalTitle === "string" ? item.optionalTitle : null,
      mimeType: String(item.mimeType),
      sizeBytes: Number(item.sizeBytes),
      displayOrder: Number(item.displayOrder),
      isRepresentative: item.isRepresentative === true,
      state: "active",
      thumbnailUrl: typeof item.thumbnailUrl === "string" ? item.thumbnailUrl : null,
      previewUrl: typeof item.previewUrl === "string" ? item.previewUrl : null,
      fullscreenUrl: typeof item.fullscreenUrl === "string" ? item.fullscreenUrl : null,
      originalUrl: typeof item.originalUrl === "string" ? item.originalUrl : null,
      viewUrl: typeof item.viewUrl === "string" ? item.viewUrl : null,
      uploadedAt: String(item.uploadedAt),
    })),
    attachments: attachments.map((item) => ({
      assetType: "attachment",
      id: String(item.id),
      filename: String(item.filename),
      mimeType: String(item.mimeType),
      sizeBytes: Number(item.sizeBytes),
      displayOrder: Number(item.displayOrder),
      includeInDocument: item.includeInDocument === true,
      state: "active",
      viewUrl: typeof item.viewUrl === "string" ? item.viewUrl : null,
      uploadedAt: String(item.uploadedAt),
    })),
    nextCursor: null,
    hasMore: body.data.hasMore === true,
    limit: Number(body.data.limit ?? 100),
    entityVersion: Number(body.data.entityVersion),
  };
}

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

export async function putWorkOrderImageBlob(target: WorkOrderImageUploadTarget, blob: Blob): Promise<void> {
  let response: Response;
  try {
    const uploadUrl = resolveMobileApiUrl(target.uploadUrl);
    if (!uploadUrl) throw new Error("UPLOAD_URL_INVALID");
    response = await fetch(uploadUrl, {
      method: target.method,
      headers: { ...target.headers },
      body: blob,
    });
  } catch {
    throw new MobileApiError({ code: "NETWORK_ERROR", message: "이미지 파일을 전송하지 못했습니다." });
  }
  if (!response.ok) {
    throw new MobileApiError({ code: "NETWORK_ERROR", message: `이미지 파일 전송에 실패했습니다. (${response.status})`, status: response.status });
  }
}

export async function prepareWorkOrderAttachmentUpload(
  workOrderId: string,
  file: { readonly name: string; readonly type: string; readonly size: number },
): Promise<WorkOrderImageUploadTarget> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/upload`,
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
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 업로드 준비 응답이 올바르지 않습니다." });
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

export async function completeWorkOrderAttachmentUpload(
  workOrderId: string,
  input: {
    readonly expectedVersion: number;
    readonly clientRequestId: string;
    readonly idempotencyKey: string;
    readonly uploadTarget: WorkOrderImageUploadTarget;
  },
): Promise<import("@/domain/mobileContract").WorkOrderAttachmentCommandResult> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: import("@/domain/mobileContract").WorkOrderAttachmentCommandResult;
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/upload/complete`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: {
        expectedVersion: input.expectedVersion,
        clientRequestId: input.clientRequestId,
        uploadTarget: input.uploadTarget,
      },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 업로드 완료 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function deleteWorkOrderAttachment(
  workOrderId: string,
  attachmentId: string,
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
): Promise<import("@/domain/mobileContract").WorkOrderAttachmentCommandResult> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: import("@/domain/mobileContract").WorkOrderAttachmentCommandResult;
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/${encodeURIComponent(attachmentId)}/delete`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: { expectedVersion: input.expectedVersion, clientRequestId: input.clientRequestId },
    },
  );
  if (
    !body.ok
    || !body.data
    || body.data.workOrderId !== workOrderId
    || body.data.attachmentId !== attachmentId
    || !Number.isSafeInteger(body.data.nextVersion)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 삭제 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function issueWorkOrderAttachmentPreview(
  workOrderId: string,
  attachmentId: string,
): Promise<{ readonly previewUrl: string; readonly expiresAt: string; readonly expiresInSeconds: number }> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: {
      readonly previewUrl?: unknown;
      readonly expiresAt?: unknown;
      readonly expiresInSeconds?: unknown;
    };
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/${encodeURIComponent(attachmentId)}/preview`,
    { method: "POST" },
  );
  if (
    !body.ok
    || typeof body.data?.previewUrl !== "string"
    || !body.data.previewUrl.startsWith("/api/v2/work-orders/attachments/preview?token=")
    || typeof body.data.expiresAt !== "string"
    || !Number.isSafeInteger(body.data.expiresInSeconds)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부파일 미리보기 응답이 올바르지 않습니다." });
  }
  return {
    previewUrl: body.data.previewUrl,
    expiresAt: body.data.expiresAt,
    expiresInSeconds: Number(body.data.expiresInSeconds),
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
