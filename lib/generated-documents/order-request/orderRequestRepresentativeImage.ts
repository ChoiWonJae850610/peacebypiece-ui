import "server-only";

import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { getR2Object } from "@/lib/storage/r2/r2Client";
import { getRepresentativeImage } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import type { WorkOrder } from "@/types/workorder";

const MAX_REPRESENTATIVE_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function normalizeImageContentType(value: string | null | undefined): string {
  const contentType = String(value ?? "").split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
  if (contentType === "image/jpg") return "image/jpeg";
  return contentType;
}

function toDataUrl(contentType: string, body: Buffer): string {
  return `data:${contentType};base64,${body.toString("base64")}`;
}

export async function resolveOrderRequestRepresentativeImageDataUrl(workOrder: WorkOrder): Promise<string | null> {
  const representativeImage = getRepresentativeImage(workOrder.attachments ?? []);
  const storageKey = representativeImage?.storageKey?.trim();

  if (!representativeImage || !storageKey) return null;
  if (!isR2Configured()) return null;

  try {
    const result = await getR2Object({ key: storageKey });
    if (result.body.byteLength <= 0 || result.body.byteLength > MAX_REPRESENTATIVE_IMAGE_BYTES) {
      console.warn("[ORDER_REQUEST_PDF:IMAGE_SKIPPED]", {
        reason: "IMAGE_SIZE_OUT_OF_RANGE",
        storageKey,
        contentLength: result.body.byteLength,
      });
      return null;
    }

    const contentType = normalizeImageContentType(result.contentType);
    if (!SUPPORTED_IMAGE_CONTENT_TYPES.has(contentType)) {
      console.warn("[ORDER_REQUEST_PDF:IMAGE_SKIPPED]", {
        reason: "UNSUPPORTED_IMAGE_CONTENT_TYPE",
        storageKey,
        contentType,
      });
      return null;
    }

    return toDataUrl(contentType, result.body);
  } catch (error) {
    console.warn("[ORDER_REQUEST_PDF:IMAGE_LOAD_FAILED]", {
      storageKey,
      message: error instanceof Error ? error.message : String(error ?? "UNKNOWN_ERROR"),
    });
    return null;
  }
}
