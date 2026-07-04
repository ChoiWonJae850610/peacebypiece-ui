import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import { getR2Object } from "@/lib/storage/r2/r2Client";
import { createR2WorkerFileUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { GENERATED_DOCUMENT_TYPE } from "@/lib/workorder/generatedDocuments";
import { isCanonicalWorkOrderPdfStorageKey } from "@/lib/workorder/pdf/workOrderPdfPolicy";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workOrderId: string; attachmentId: string }>;
};

type GeneratedPdfRow = {
  id: string;
  company_id: string;
  order_id: string;
  storage_key: string;
  original_name: string;
  mime_type: string | null;
};

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

function pdfErrorPage(message: string, status: number) {
  const escaped = message.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] ?? char);
  const html = [
    "<!doctype html>",
    '<html lang="ko">',
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PDF 확인</title></head>',
    '<body style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;background:#f8fafc;color:#0f172a">',
    '<main style="min-height:100vh;display:grid;place-items:center;padding:24px">',
    '<section style="max-width:420px;border:1px solid #e2e8f0;border-radius:16px;background:white;padding:24px;box-shadow:0 18px 48px rgba(15,23,42,.10)">',
    '<h1 style="margin:0 0 8px;font-size:20px">PDF를 열 수 없습니다</h1>',
    `<p style="margin:0;line-height:1.6;color:#475569">${escaped}</p>`,
    "</section></main></body></html>",
  ].join("");

  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function createPdfDisposition(fileName: string, mode: "inline" | "attachment") {
  const safeFallback = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/[\\/\r\n\0"]/g, "_") || "workorder.pdf";
  return `${mode}; filename="${safeFallback}"; filename*=UTF-8''${encodeURIComponent(fileName || "workorder.pdf")}`;
}

function toResponseBody(buffer: Buffer) {
  const body = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(body).set(buffer);
  return body;
}

async function getPdfObjectBody(storageKey: string): Promise<{
  body: ArrayBuffer;
  contentLength: number;
  contentType: string | null;
}> {
  if (isR2WorkerUploadConfigured()) {
    const signed = createR2WorkerFileUrl({ key: storageKey });
    const response = await fetch(signed.url, { method: signed.method, cache: "no-store" });
    if (!response.ok) throw new Error(`PDF_WORKER_GET_FAILED_${response.status}`);
    const body = await response.arrayBuffer();
    return {
      body,
      contentLength: body.byteLength,
      contentType: response.headers.get("content-type"),
    };
  }

  const object = await getR2Object({ key: storageKey });
  return {
    body: toResponseBody(object.body),
    contentLength: object.contentLength,
    contentType: object.contentType,
  };
}

export async function GET(request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) return jsonError("DB_NOT_CONFIGURED", 503);

  const session = await getCurrentWaflSession();
  if (!session?.companyId) return jsonError("COMPANY_SESSION_REQUIRED", 401);

  const blockedResponse = await createCompanyApiAccessBlockedResponse(session.companyId);
  if (blockedResponse) return blockedResponse;

  const { workOrderId, attachmentId } = await context.params;
  if (!workOrderId.trim() || !attachmentId.trim()) return jsonError("PDF_ATTACHMENT_REQUIRED", 400);
  const dispositionMode = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

  const result = await queryDb<GeneratedPdfRow>(
    `
      SELECT id, company_id, order_id, storage_key, original_name, mime_type
        FROM attachments
       WHERE id = $1
         AND order_id = $2
         AND company_id = $3
         AND source_type = 'system'
         AND generated_document_type IN ($4, $5)
         AND deleted_at IS NULL
         AND COALESCE(is_active, true) = true
       LIMIT 1
    `,
    [
      attachmentId,
      workOrderId,
      session.companyId,
      GENERATED_DOCUMENT_TYPE.workorderIncompletePdf,
      GENERATED_DOCUMENT_TYPE.workorderFinalPdf,
    ],
  );
  const file = result.rows[0];
  if (!file) return jsonError("PDF_NOT_FOUND", 404);
  if (file.mime_type !== "application/pdf" || !isCanonicalWorkOrderPdfStorageKey(file.storage_key)) {
    return jsonError("PDF_METADATA_INVALID", 409);
  }

  try {
    const object = await getPdfObjectBody(file.storage_key);
    const contentType = object.contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (contentType && contentType !== "application/pdf") return jsonError("PDF_OBJECT_CONTENT_TYPE_INVALID", 409);
    if (object.contentLength <= 0) return jsonError("PDF_OBJECT_EMPTY", 409);

    return new Response(object.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(object.contentLength),
        "Content-Disposition": createPdfDisposition(file.original_name, dispositionMode),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return pdfErrorPage("PDF 파일을 찾을 수 없습니다. 다시 만들어 주세요.", 404);
  }
}
