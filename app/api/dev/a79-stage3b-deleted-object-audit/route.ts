import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { createCommandTenantScope } from "@/lib/domain/work-orders/command/commandService";
import { readExternalQaServerConfig } from "@/lib/external-qa/configCore.mjs";
import { isMakerQaCapabilityEnabled, MAKER_QA_CAPABILITY } from "@/lib/external-qa/makerQaCapabilities.mjs";
import { inspectGeneratedDocumentArtifact } from "@/lib/generated-documents/work-order-pdf/artifactHealth";
import { assertLocalOnlyRouteHost } from "@/lib/internal/localOnlyRouteGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIXTURES = new Set(["QA A79 generated revoke access", "QA A79 generated revoke access automated"]);
const safeRef = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 12);

export async function POST(request: Request) {
  await assertLocalOnlyRouteHost();
  let config;
  try { config = readExternalQaServerConfig(process.env); } catch {
    return NextResponse.json({ error: "EXTERNAL_QA_DISABLED" }, { status: 403 });
  }
  if (!config.enabled || config.production
      || !isMakerQaCapabilityEnabled(process.env, MAKER_QA_CAPABILITY.DOCUMENT_R0)) {
    return NextResponse.json({ error: "EXTERNAL_QA_DISABLED" }, { status: 403 });
  }
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return guard.response;
  const body = await request.json().catch(() => null) as { documentId?: unknown } | null;
  const documentId = typeof body?.documentId === "string" ? body.documentId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/iu.test(documentId)) {
    return NextResponse.json({ error: "REQUEST_INVALID" }, { status: 400 });
  }
  const scope = createCommandTenantScope({ scope: guard.scope,
    companyMemberId: guard.session.companyMemberId, permissionCode: "workorder.read",
    correlationId: randomUUID() as Parameters<typeof createCommandTenantScope>[0]["correlationId"] });
  const row = await withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, scope);
    return (await client.query<DbQueryResultRow>(`
      SELECT d.id::text,d.status,d.revoked_at,d.deleted_at,d.storage_object_key,
        d.file_size_bytes,d.content_sha256,w.product_name
      FROM generated_documents d
      JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id
        AND w.current_revision_id=d.work_order_revision_id AND w.deleted_at IS NULL
      WHERE d.company_id=$1 AND d.id=$2::uuid LIMIT 1
    `, [guard.scope.companyId, documentId])).rows[0] ?? null;
  });
  if (!row || !FIXTURES.has(String(row.product_name))
      || (row.status !== "revoked" && row.status !== "deleted") || row.revoked_at === null) {
    return NextResponse.json({ error: "EXACT_STAGE3B_FIXTURE_REQUIRED" }, { status: 409 });
  }
  const health = await inspectGeneratedDocumentArtifact({ documentId,
    objectKey: String(row.storage_object_key), fileSizeBytes: Number(row.file_size_bytes),
    contentSha256: String(row.content_sha256) });
  return NextResponse.json({ ok: true, data: {
    documentRef: safeRef(documentId), objectKeyRef: safeRef(String(row.storage_object_key)),
    lifecycle: String(row.status), deletedAtPresent: row.deleted_at !== null,
    objectHealth: health, objectAbsent: health === "missing", unrelatedMutation: 0,
  } }, { headers: { "Cache-Control": "no-store" } });
}
