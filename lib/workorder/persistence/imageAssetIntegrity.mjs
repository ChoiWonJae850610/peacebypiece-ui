import { createHash } from "node:crypto";

export const WORK_ORDER_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const WORK_ORDER_PDF_INLINE_IMAGE_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_TYPES = new Set(WORK_ORDER_PDF_INLINE_IMAGE_MIME_TYPES);
const SHA256 = /^[0-9a-f]{64}$/u;

export function normalizeImageContentType(value) {
  return String(value ?? "").split(";", 1)[0].trim().toLowerCase();
}

export function sha256ImageBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function inspectUploadedWorkOrderImage(input) {
  const declaredContentType = normalizeImageContentType(input.declaredContentType);
  const actualContentType = normalizeImageContentType(input.actualContentType);
  const actualSizeBytes = input.body?.byteLength ?? 0;
  if (!MIME_TYPES.has(declaredContentType) || actualContentType !== declaredContentType) {
    throw new Error("WORK_ORDER_IMAGE_OBJECT_CONTENT_TYPE_INVALID");
  }
  if (!Number.isSafeInteger(actualSizeBytes) || actualSizeBytes <= 0 || actualSizeBytes > WORK_ORDER_IMAGE_MAX_BYTES) {
    throw new Error("WORK_ORDER_IMAGE_OBJECT_SIZE_INVALID");
  }
  return {
    contentType: actualContentType,
    sizeBytes: actualSizeBytes,
    contentSha256: sha256ImageBytes(input.body),
  };
}

export function inspectWorkOrderPdfInlineImage(input) {
  const declaredContentType = normalizeImageContentType(input.declaredContentType);
  const actualContentType = normalizeImageContentType(input.actualContentType);
  const actualSizeBytes = input.body?.byteLength ?? 0;
  if (!MIME_TYPES.has(declaredContentType) || actualContentType !== declaredContentType) {
    throw new Error("PDF_ASSET_CONTENT_TYPE_INVALID");
  }
  if (!Number.isSafeInteger(actualSizeBytes) || actualSizeBytes <= 0 || actualSizeBytes > WORK_ORDER_IMAGE_MAX_BYTES) {
    throw new Error("PDF_ASSET_SIZE_INVALID");
  }
  const actualContentSha256 = sha256ImageBytes(input.body);
  const expectedHash = String(input.declaredContentSha256 ?? "").trim().toLowerCase();
  const strict = expectedHash.length > 0;
  if (strict && !SHA256.test(expectedHash)) throw new Error("PDF_ASSET_INTEGRITY_INVALID");
  if (strict && (actualSizeBytes !== input.declaredSizeBytes || actualContentSha256 !== expectedHash)) {
    throw new Error("PDF_ASSET_INTEGRITY_INVALID");
  }
  return {
    mode: strict ? "strict" : "legacy-compatible",
    sizeBytes: actualSizeBytes,
    contentSha256: actualContentSha256,
    staleDeclaredSize: !strict && actualSizeBytes !== input.declaredSizeBytes,
  };
}
