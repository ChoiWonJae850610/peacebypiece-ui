import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireWorkspaceApiGuard, type WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import type { CompanyId, CompanyMemberId, CorrelationId, TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";
import { DOCUMENT_ACCESS_UUID_PATTERN } from "@/lib/generated-documents/document-access/constants";
import { R2WorkerGeneratedDocumentTransport } from "./r2WorkerTransport";

type GeneratedDocumentFileRow = DbQueryResultRow & {
  readonly display_document_number: string;
  readonly storage_object_key: string;
  readonly file_size_bytes: number | string;
  readonly content_sha256: string;
};

const RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

function errorResponse(code: string, message: string, status: number, correlationId: string) {
  return NextResponse.json({ ok: false, error: { code, message, retryable: false, correlationId } }, {
    status,
    headers: { ...RESPONSE_HEADERS, "X-WAFL-Correlation-Id": correlationId },
  });
}

function notFound(correlationId: string) {
  return errorResponse("NOT_FOUND", "생성된 PDF를 찾을 수 없습니다.", 404, correlationId);
}

function tenantScope(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): TenantMemberScope {
  return {
    mode: "tenant_member",
    companyId: input.scope.companyId as CompanyId,
    companyMemberId: (input.companyMemberId?.trim() || `company-admin:${input.scope.companyId}`) as CompanyMemberId,
    permissionCodes: ["workorder.read"],
    correlationId: input.correlationId,
  };
}

async function loadFileMetadata(input: {
  readonly documentId: string;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}): Promise<GeneratedDocumentFileRow | null> {
  const assignedCompanyMemberId = input.scope.visibility?.mode === "assigned"
    ? input.scope.visibility.companyMemberId
    : null;
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, tenantScope(input));
    const result = await client.query<GeneratedDocumentFileRow>(`
      SELECT document.display_document_number, document.storage_object_key,
             document.file_size_bytes, document.content_sha256
      FROM generated_documents document
      JOIN work_orders work_order
        ON work_order.company_id = document.company_id
       AND work_order.id = document.work_order_id
       AND work_order.deleted_at IS NULL
      WHERE document.company_id = $1
        AND document.id = $2::uuid
        AND document.status = 'generated'
        AND document.revoked_at IS NULL
        AND document.deleted_at IS NULL
        AND document.storage_object_key IS NOT NULL
        AND document.file_size_bytes IS NOT NULL
        AND document.content_sha256 IS NOT NULL
        AND ($3::text IS NULL OR work_order.assignee_member_id = $3)
      LIMIT 1
    `, [input.scope.companyId, input.documentId, assignedCompanyMemberId]);
    return result.rows[0] ?? null;
  });
}

function parseDisposition(request: Request): "inline" | "attachment" | null {
  const searchParams = new URL(request.url).searchParams;
  if ([...searchParams.keys()].some((key) => key !== "disposition") || searchParams.getAll("disposition").length > 1) return null;
  const value = searchParams.get("disposition") ?? "inline";
  return value === "inline" || value === "attachment" ? value : null;
}

function safeFilename(displayDocumentNumber: string): string {
  const base = displayDocumentNumber.trim().replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "work-instruction";
  return `${base}.pdf`;
}

export async function handleGetInternalGeneratedDocumentFile(request: Request, documentRef: string) {
  const correlationId = randomUUID() as CorrelationId;
  const runtime = getWorkOrderV2ReadRuntimeGuard();
  if (!runtime.ok) return errorResponse("FORBIDDEN", "승인된 dev/test runtime에서만 사용할 수 있습니다.", 403, correlationId);
  if (!DOCUMENT_ACCESS_UUID_PATTERN.test(documentRef)) return notFound(correlationId);
  const disposition = parseDisposition(request);
  if (!disposition) return errorResponse("VALIDATION_ERROR", "disposition은 inline 또는 attachment여야 합니다.", 400, correlationId);

  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return guard.response;

  try {
    const metadata = await loadFileMetadata({
      documentId: documentRef,
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
    });
    if (!metadata) return notFound(correlationId);

    const body = await new R2WorkerGeneratedDocumentTransport().get(metadata.storage_object_key);
    if (!body) return notFound(correlationId);
    const expectedSize = Number(metadata.file_size_bytes);
    const expectedSha = String(metadata.content_sha256);
    if (body.byteLength !== expectedSize
      || createHash("sha256").update(body).digest("hex") !== expectedSha
      || body.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new Error("GENERATED_DOCUMENT_FILE_INTEGRITY_INVALID");
    }

    const filename = safeFilename(metadata.display_document_number);
    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        ...RESPONSE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `${disposition}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "X-WAFL-Correlation-Id": correlationId,
      },
    });
  } catch (error) {
    console.error("[WORK_ORDER_GENERATED_DOCUMENT_FILE_FAILED]", {
      correlationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return errorResponse("INTERNAL_ERROR", "생성된 PDF를 불러오지 못했습니다.", 500, correlationId);
  }
}
