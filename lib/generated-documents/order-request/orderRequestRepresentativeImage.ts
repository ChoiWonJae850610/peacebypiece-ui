import "server-only";

import { getR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import {
  createR2WorkerFileUrl,
  isR2WorkerUploadConfigured,
} from "@/lib/storage/r2/r2WorkerUpload";
import { getRepresentativeImage } from "@/lib/workorder/presentation/orderRequestDocumentPresentation";
import type { Attachment, WorkOrder } from "@/types/workorder";

const MAX_REPRESENTATIVE_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const IMAGE_EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

type RepresentativeImageObject = {
  body: Buffer;
  contentType: string;
  source: "worker" | "r2";
};

function normalizeImageContentType(value: string | null | undefined): string {
  const contentType = String(value ?? "").split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
  if (contentType === "image/jpg") return "image/jpeg";
  return contentType;
}

function inferImageContentTypeFromName(value: string | null | undefined): string | null {
  const extension = String(value ?? "")
    .trim()
    .toLowerCase()
    .match(/\.([a-z0-9]+)(?:\?.*)?$/)?.[1];

  return extension ? IMAGE_EXTENSION_CONTENT_TYPES[extension] ?? null : null;
}

function isImageLikeAttachment(attachment: Attachment): boolean {
  if (attachment.type === "image") return true;
  return Boolean(inferImageContentTypeFromName(attachment.name) || inferImageContentTypeFromName(attachment.storageKey));
}

function resolveRepresentativeImage(workOrder: WorkOrder): Attachment | null {
  const attachments = workOrder.attachments ?? [];
  const representativeImage = getRepresentativeImage(attachments);
  if (representativeImage?.storageKey && isImageLikeAttachment(representativeImage)) return representativeImage;

  const fallbackImage = attachments.find((attachment) => attachment.storageKey && isImageLikeAttachment(attachment));
  return fallbackImage ?? null;
}

function toDataUrl(contentType: string, body: Buffer): string {
  return `data:${contentType};base64,${body.toString("base64")}`;
}

async function readImageViaWorker(storageKey: string): Promise<RepresentativeImageObject | null> {
  if (!isR2WorkerUploadConfigured()) return null;

  const request = createR2WorkerFileUrl({ key: storageKey });
  const response = await fetch(request.url, {
    method: request.method,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `R2_WORKER_IMAGE_READ_FAILED_${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = normalizeImageContentType(response.headers.get("content-type"));
  return {
    body: bytes,
    contentType,
    source: "worker",
  };
}

async function readImageViaR2(storageKey: string): Promise<RepresentativeImageObject | null> {
  if (!isR2Configured()) return null;

  const result = await getR2Object({ key: storageKey });
  return {
    body: result.body,
    contentType: result.contentType,
    source: "r2",
  };
}

async function readRepresentativeImageObject(input: {
  storageKey: string;
  fallbackContentType: string | null;
}): Promise<RepresentativeImageObject | null> {
  let lastError: unknown = null;

  try {
    const workerResult = await readImageViaWorker(input.storageKey);
    if (workerResult) return workerResult;
  } catch (error) {
    lastError = error;
    console.warn("[ORDER_REQUEST_PDF:IMAGE_WORKER_LOAD_FAILED]", {
      storageKey: input.storageKey,
      message: error instanceof Error ? error.message : String(error ?? "UNKNOWN_ERROR"),
    });
  }

  try {
    const r2Result = await readImageViaR2(input.storageKey);
    if (r2Result) return r2Result;
  } catch (error) {
    lastError = error;
    console.warn("[ORDER_REQUEST_PDF:IMAGE_R2_LOAD_FAILED]", {
      storageKey: input.storageKey,
      message: error instanceof Error ? error.message : String(error ?? "UNKNOWN_ERROR"),
    });
  }

  if (input.fallbackContentType && lastError) {
    console.warn("[ORDER_REQUEST_PDF:IMAGE_LOAD_FAILED]", {
      storageKey: input.storageKey,
      fallbackContentType: input.fallbackContentType,
      message: lastError instanceof Error ? lastError.message : String(lastError ?? "UNKNOWN_ERROR"),
    });
  }

  return null;
}

export async function resolveOrderRequestRepresentativeImageDataUrl(workOrder: WorkOrder): Promise<string | null> {
  const representativeImage = resolveRepresentativeImage(workOrder);
  const storageKey = representativeImage?.storageKey?.trim();

  if (!representativeImage || !storageKey) {
    console.warn("[ORDER_REQUEST_PDF:IMAGE_SKIPPED]", {
      reason: "REPRESENTATIVE_IMAGE_NOT_FOUND",
      attachmentCount: workOrder.attachments?.length ?? 0,
    });
    return null;
  }

  const fallbackContentType =
    inferImageContentTypeFromName(representativeImage.name) ?? inferImageContentTypeFromName(storageKey);
  const result = await readRepresentativeImageObject({ storageKey, fallbackContentType });
  if (!result) return null;

  if (result.body.byteLength <= 0 || result.body.byteLength > MAX_REPRESENTATIVE_IMAGE_BYTES) {
    console.warn("[ORDER_REQUEST_PDF:IMAGE_SKIPPED]", {
      reason: "IMAGE_SIZE_OUT_OF_RANGE",
      storageKey,
      source: result.source,
      contentLength: result.body.byteLength,
    });
    return null;
  }

  const contentType = normalizeImageContentType(
    SUPPORTED_IMAGE_CONTENT_TYPES.has(normalizeImageContentType(result.contentType))
      ? result.contentType
      : fallbackContentType,
  );
  if (!SUPPORTED_IMAGE_CONTENT_TYPES.has(contentType)) {
    console.warn("[ORDER_REQUEST_PDF:IMAGE_SKIPPED]", {
      reason: "UNSUPPORTED_IMAGE_CONTENT_TYPE",
      storageKey,
      source: result.source,
      contentType,
      fallbackContentType,
    });
    return null;
  }

  return toDataUrl(contentType, result.body);
}
