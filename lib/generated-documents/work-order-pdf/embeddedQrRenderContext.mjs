import { DOCUMENT_ACCESS_RAW_TOKEN_PATTERN, DOCUMENT_EMBEDDED_QR_PURPOSE } from "../document-access/constants.ts";

export const WORK_ORDER_PDF_EMBEDDED_QR_HEADER = "x-wafl-pdf-embedded-qr";

function validate(input) {
  const url = new URL(input.viewerUrl);
  const rawToken = new URLSearchParams(url.hash.slice(1)).get("t") ?? "";
  if (!new Set(["http:", "https:"]).has(url.protocol)
      || url.pathname !== "/v"
      || url.search
      || !DOCUMENT_ACCESS_RAW_TOKEN_PATTERN.test(rawToken)
      || input.purpose !== DOCUMENT_EMBEDDED_QR_PURPOSE
      || input.label !== "문서 보기"
      || new Date(input.expiresAt).toISOString() !== input.expiresAt) {
    throw new Error("PDF_EMBEDDED_QR_CONTEXT_INVALID");
  }
  return input;
}

export function encodeEmbeddedQrRenderContext(input) {
  return Buffer.from(JSON.stringify(validate(input)), "utf8").toString("base64url");
}

export function decodeEmbeddedQrRenderContext(value) {
  if (!value) return null;
  if (!/^[A-Za-z0-9_-]{40,4096}$/.test(value)) throw new Error("PDF_EMBEDDED_QR_CONTEXT_INVALID");
  return validate(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
}
