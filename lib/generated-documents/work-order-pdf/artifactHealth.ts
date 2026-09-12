import "server-only";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { CompanyId, CompanyMemberId, CorrelationId, TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { R2WorkerGeneratedDocumentObjectStore, type GeneratedDocumentObjectStore } from "./objectStore";
import { R2WorkerGeneratedDocumentTransport } from "./r2WorkerTransport";
import {
  classifyGeneratedDocumentArtifact,
  type GeneratedDocumentArtifactHealth,
  type GeneratedDocumentArtifactMetadata,
} from "./artifactHealthCore";

export { classifyGeneratedDocumentArtifact } from "./artifactHealthCore";
export type { GeneratedDocumentArtifactHealth, GeneratedDocumentArtifactMetadata } from "./artifactHealthCore";

export async function inspectGeneratedDocumentArtifact(
  metadata: GeneratedDocumentArtifactMetadata,
  store: GeneratedDocumentObjectStore = new R2WorkerGeneratedDocumentObjectStore(new R2WorkerGeneratedDocumentTransport()),
): Promise<GeneratedDocumentArtifactHealth> {
  if (!metadata.objectKey) return "corrupt";
  try {
    return classifyGeneratedDocumentArtifact({ metadata, body: await store.getPdf(metadata.objectKey) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return message === "PDF_R2_CONTENT_TYPE_INVALID" ? "corrupt" : "transient_error";
  }
}

function tenantScope(input: { scope: WorkspaceApiCompanyScope; companyMemberId: string | null; correlationId: string }): TenantMemberScope {
  return {
    mode: "tenant_member",
    companyId: input.scope.companyId as CompanyId,
    companyMemberId: (input.companyMemberId?.trim() || `company-admin:${input.scope.companyId}`) as CompanyMemberId,
    permissionCodes: ["workorder.read"],
    correlationId: input.correlationId as CorrelationId,
  };
}

export async function loadGeneratedDocumentArtifactMetadata(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
  readonly documentId: string;
  readonly requireCurrentRevision?: boolean;
}): Promise<GeneratedDocumentArtifactMetadata | null> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, tenantScope(input));
    const result = await client.query<DbQueryResultRow>(`
      SELECT d.id::text, d.storage_object_key, d.file_size_bytes, d.content_sha256
      FROM generated_documents d
      JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id AND w.deleted_at IS NULL
      WHERE d.company_id=$1 AND d.id=$2::uuid AND d.status='generated'
        AND d.revoked_at IS NULL AND d.deleted_at IS NULL
        AND ($3::boolean=false OR w.current_revision_id=d.work_order_revision_id)
      LIMIT 1
    `, [input.scope.companyId, input.documentId, input.requireCurrentRevision === true]);
    const row = result.rows[0];
    return row ? {
      documentId: String(row.id),
      objectKey: row.storage_object_key === null ? null : String(row.storage_object_key),
      fileSizeBytes: row.file_size_bytes === null ? null : Number(row.file_size_bytes),
      contentSha256: row.content_sha256 === null ? null : String(row.content_sha256),
    } : null;
  });
}

export async function loadCurrentGeneratedDocumentArtifactFixture(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
  readonly documentId: string;
}): Promise<{ readonly metadata: GeneratedDocumentArtifactMetadata; readonly productName: string } | null> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, tenantScope(input));
    const result = await client.query<DbQueryResultRow>(`
      SELECT d.id::text,d.storage_object_key,d.file_size_bytes,d.content_sha256,w.product_name
      FROM generated_documents d
      JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id
        AND w.current_revision_id=d.work_order_revision_id AND w.deleted_at IS NULL
      WHERE d.company_id=$1 AND d.id=$2::uuid AND d.status='generated'
        AND d.revoked_at IS NULL AND d.deleted_at IS NULL
        AND d.generation_no=(SELECT max(current.generation_no) FROM generated_documents current
          WHERE current.company_id=d.company_id AND current.work_order_revision_id=d.work_order_revision_id
            AND current.document_type=d.document_type AND current.revoked_at IS NULL AND current.deleted_at IS NULL)
      LIMIT 1
    `, [input.scope.companyId, input.documentId]);
    const row = result.rows[0];
    return row ? {
      metadata: {
        documentId: String(row.id),
        objectKey: row.storage_object_key === null ? null : String(row.storage_object_key),
        fileSizeBytes: row.file_size_bytes === null ? null : Number(row.file_size_bytes),
        contentSha256: row.content_sha256 === null ? null : String(row.content_sha256),
      },
      productName: String(row.product_name),
    } : null;
  });
}

export async function getGeneratedDocumentArtifactHealth(input: Parameters<typeof loadGeneratedDocumentArtifactMetadata>[0]) {
  const metadata = await loadGeneratedDocumentArtifactMetadata(input);
  return metadata ? inspectGeneratedDocumentArtifact(metadata) : null;
}

export async function loadLatestGeneratedDocumentArtifact(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
  readonly workOrderId: string;
  readonly revisionId: string;
}) {
  const metadata = await withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, tenantScope(input));
    const result = await client.query<DbQueryResultRow>(`
      SELECT id::text, storage_object_key, file_size_bytes, content_sha256
      FROM generated_documents
      WHERE company_id=$1 AND work_order_id=$2::uuid AND work_order_revision_id=$3::uuid
        AND document_type='factory_instruction' AND status='generated'
        AND revoked_at IS NULL AND deleted_at IS NULL
      ORDER BY generation_no DESC, id DESC LIMIT 1
    `, [input.scope.companyId, input.workOrderId, input.revisionId]);
    const row = result.rows[0];
    return row ? {
      documentId: String(row.id),
      objectKey: row.storage_object_key === null ? null : String(row.storage_object_key),
      fileSizeBytes: row.file_size_bytes === null ? null : Number(row.file_size_bytes),
      contentSha256: row.content_sha256 === null ? null : String(row.content_sha256),
    } satisfies GeneratedDocumentArtifactMetadata : null;
  });
  return metadata ? { metadata, health: await inspectGeneratedDocumentArtifact(metadata) } : null;
}
