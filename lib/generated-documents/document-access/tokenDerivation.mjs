import { createHmac } from "node:crypto";

export const DOCUMENT_EMBEDDED_QR_TOKEN_NAMESPACE = "document-embedded-qr-token:v1";
export const DOCUMENT_EMBEDDED_QR_IDEMPOTENCY_NAMESPACE = "document-embedded-qr-idempotency:v1";

function hmac(secret, namespace, parts, encoding) {
  const signer = createHmac("sha256", secret);
  signer.update(namespace, "utf8");
  for (const part of parts) {
    signer.update("\0", "utf8");
    signer.update(part, "utf8");
  }
  return signer.digest(encoding);
}

export function deriveEmbeddedQrOpaqueToken(secret, input) {
  return hmac(secret, DOCUMENT_EMBEDDED_QR_TOKEN_NAMESPACE, [
    input.companyId,
    input.generatedDocumentId,
    input.commandCode,
    input.idempotencyKey,
  ], "base64url");
}

export function scopeEmbeddedQrIdempotencyKey(secret, input) {
  return hmac(secret, DOCUMENT_EMBEDDED_QR_IDEMPOTENCY_NAMESPACE, [
    input.companyId,
    input.revisionId,
    input.commandCode,
    input.idempotencyKey,
  ], "hex");
}
