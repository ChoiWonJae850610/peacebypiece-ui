export const WORK_ORDER_IMAGE_MAX_BYTES: number;
export const WORK_ORDER_PDF_INLINE_IMAGE_MIME_TYPES: readonly string[];
export function normalizeImageContentType(value: unknown): string;
export function sha256ImageBytes(bytes: Uint8Array): string;
export function inspectUploadedWorkOrderImage(input: {
  declaredContentType: string;
  actualContentType: string;
  body: Uint8Array;
}): { contentType: string; sizeBytes: number; contentSha256: string };
export function inspectWorkOrderPdfInlineImage(input: {
  declaredContentType: string;
  declaredSizeBytes: number;
  declaredContentSha256: string | null;
  actualContentType: string;
  body: Uint8Array;
}): { mode: "strict" | "legacy-compatible"; sizeBytes: number; contentSha256: string; staleDeclaredSize: boolean };
