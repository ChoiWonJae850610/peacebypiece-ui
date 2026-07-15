export const WORK_ORDER_PDF_EMBEDDED_QR_HEADER: "x-wafl-pdf-embedded-qr";

export type EmbeddedQrRenderContext = {
  readonly viewerUrl: string;
  readonly expiresAt: string;
  readonly label: "문서 보기";
  readonly purpose: "embedded_qr";
};

export function encodeEmbeddedQrRenderContext(input: EmbeddedQrRenderContext): string;
export function decodeEmbeddedQrRenderContext(value: string | null): EmbeddedQrRenderContext | null;
