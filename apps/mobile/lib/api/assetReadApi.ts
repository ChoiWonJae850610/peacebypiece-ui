import type { WorkOrderImageAsset, WorkOrderImagePage } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { isJsonObject } from "../apiResponseNormalizer";
import { requestJson } from "../apiTransport";

/** One authoritative revision-scoped projection read for images and attachments. */
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
    && typeof item.includeInDocument === "boolean"
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
      includeInDocument: item.includeInDocument === true,
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
