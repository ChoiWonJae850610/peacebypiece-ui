import "server-only";

export type PdfGeneratorResult =
  | { ok: true; pdf: Buffer; provider: "external" }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "request_failed"; status: number; message: string }
  | { ok: false; reason: "invalid_response"; message: string };

type PdfGeneratorRequest = {
  html: string;
  fileName: string;
  format?: "A4";
  orientation?: "portrait" | "landscape";
};

function readPdfGeneratorUrl(): string | null {
  const value = process.env.WAFLOW_PDF_GENERATOR_URL?.trim();
  return value && value.length > 0 ? value : null;
}

function readPdfGeneratorToken(): string | null {
  const value = process.env.WAFLOW_PDF_GENERATOR_TOKEN?.trim();
  return value && value.length > 0 ? value : null;
}

export function isExternalPdfGeneratorConfigured(): boolean {
  return Boolean(readPdfGeneratorUrl());
}

export async function renderPdfWithExternalGenerator(input: PdfGeneratorRequest): Promise<PdfGeneratorResult> {
  const url = readPdfGeneratorUrl();
  if (!url) return { ok: false, reason: "not_configured" };

  const token = readPdfGeneratorToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/pdf",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        html: input.html,
        fileName: input.fileName,
        format: input.format ?? "A4",
        orientation: input.orientation ?? "portrait",
      }),
    });
  } catch (error) {
    return {
      ok: false,
      reason: "invalid_response",
      message: error instanceof Error ? error.message : String(error ?? "PDF_GENERATOR_FETCH_FAILED"),
    };
  }

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    return {
      ok: false,
      reason: "request_failed",
      status: response.status,
      message: message || `PDF_GENERATOR_FAILED_${response.status}`,
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/pdf")) {
    const message = await response.text().catch(() => "");
    return {
      ok: false,
      reason: "invalid_response",
      message: message || `INVALID_PDF_GENERATOR_CONTENT_TYPE:${contentType || "unknown"}`,
    };
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength <= 0) {
    return { ok: false, reason: "invalid_response", message: "EMPTY_PDF_GENERATOR_RESPONSE" };
  }

  return { ok: true, pdf: Buffer.from(arrayBuffer), provider: "external" };
}
