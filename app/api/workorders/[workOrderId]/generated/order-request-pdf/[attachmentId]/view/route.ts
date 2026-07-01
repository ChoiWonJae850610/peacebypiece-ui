import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { isDatabaseConfigured, queryDb } from "@/lib/db/client";
import { getR2Object } from "@/lib/storage/r2/r2Client";
import { isCanonicalWorkOrderPdfStorageKey } from "@/lib/workorder/pdf/workOrderPdfPolicy";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    workOrderId: string;
    attachmentId: string;
  }>;
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

function createInlineDisposition(fileName: string) {
  const safeFallback = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/[\\/\r\n\0"]/g, "_") || "workorder.pdf";
  return `inline; filename="${safeFallback}"; filename*=UTF-8''${encodeURIComponent(fileName || "workorder.pdf")}`;
}

function toResponseBody(buffer: Buffer) {
  const body = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(body).set(buffer);
  return body;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) return jsonError("DB_NOT_CONFIGURED", 503);

  const session = await getCurrentWaflSession();
  if (!session?.companyId) return jsonError("COMPANY_SESSION_REQUIRED", 401);

  const blockedResponse = await createCompanyApiAccessBlockedResponse(session.companyId);
  if (blockedResponse) return blockedResponse;

  const { workOrderId, attachmentId } = await context.params;
  if (!workOrderId.trim() || !attachmentId.trim()) return jsonError("PDF_ATTACHMENT_REQUIRED", 400);

  const result = await queryDb<GeneratedPdfRow>(
    `
      SELECT id, company_id, order_id, storage_key, original_name, mime_type
      FROM attachments
      WHERE id = $1
        AND order_id = $2
        AND company_id = $3
        AND source_type = 'system'
        AND generated_document_type = 'order_request_pdf'
        AND deleted_at IS NULL
        AND COALESCE(is_active, true) = true
      LIMIT 1
    `,
    [attachmentId, workOrderId, session.companyId],
  );
  const file = result.rows[0];
  if (!file) return jsonError("PDF_NOT_FOUND", 404);
  if (file.mime_type !== "application/pdf" || !isCanonicalWorkOrderPdfStorageKey(file.storage_key)) {
    return jsonError("PDF_METADATA_INVALID", 409);
  }

  try {
    const object = await getR2Object({ key: file.storage_key });
    if (object.contentType !== "application/pdf") return jsonError("PDF_OBJECT_CONTENT_TYPE_INVALID", 409);

    return new Response(toResponseBody(object.body), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(object.contentLength),
        "Content-Disposition": createInlineDisposition(file.original_name),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError("PDF_OBJECT_MISSING", 404);
  }
}
