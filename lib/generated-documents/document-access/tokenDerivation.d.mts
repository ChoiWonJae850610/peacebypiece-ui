export const DOCUMENT_EMBEDDED_QR_TOKEN_NAMESPACE: "document-embedded-qr-token:v1";
export const DOCUMENT_EMBEDDED_QR_IDEMPOTENCY_NAMESPACE: "document-embedded-qr-idempotency:v1";

export function deriveEmbeddedQrOpaqueToken(secret: string, input: {
  readonly companyId: string;
  readonly generatedDocumentId: string;
  readonly commandCode: string;
  readonly idempotencyKey: string;
}): string;

export function scopeEmbeddedQrIdempotencyKey(secret: string, input: {
  readonly companyId: string;
  readonly revisionId: string;
  readonly commandCode: string;
  readonly idempotencyKey: string;
}): string;
