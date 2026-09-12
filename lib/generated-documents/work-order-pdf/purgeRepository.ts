import "server-only";

import { performance } from "node:perf_hooks";

import {
  withWaflV2TenantReadOnlyTransaction,
  withWaflV2TenantWriteTransaction,
  type DbQueryResultRow,
} from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";

export const GENERATED_DOCUMENT_PURGE_COMMAND_CODE = "work_order.document.purge";

export type GeneratedDocumentPurgeResult = {
  readonly documentId: string;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly generationNumber: number;
  readonly status: "deleted";
  readonly deletedAt: string;
  readonly objectAbsent: true;
};

export type GeneratedDocumentPurgeTarget = {
  readonly documentId: string;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly generationNumber: number;
  readonly status: "revoked" | "deleted";
  readonly objectKey: string;
  readonly fileSizeBytes: number;
  readonly contentSha256: string;
  readonly deletedAt: string | null;
};

type FailureReason = "not_found" | "locked" | "idempotency_conflict" | "idempotency_incomplete";

export class GeneratedDocumentPurgeRepositoryError extends Error {
  constructor(readonly reason: FailureReason) {
    super(reason);
    this.name = "GeneratedDocumentPurgeRepositoryError";
  }
}

type DocumentRow = DbQueryResultRow & {
  readonly id: string;
  readonly work_order_id: string;
  readonly work_order_revision_id: string;
  readonly generation_no: number | string;
  readonly status: string;
  readonly storage_object_key: string | null;
  readonly file_size_bytes: number | string | null;
  readonly content_sha256: string | null;
  readonly revoked_at: Date | string | null;
  readonly deleted_at: Date | string | null;
};

const TARGET_SQL = `
  SELECT d.id,d.work_order_id,d.work_order_revision_id,d.generation_no,d.status,
    d.storage_object_key,d.file_size_bytes,d.content_sha256,d.revoked_at,d.deleted_at
  FROM generated_documents d
  JOIN work_orders w ON w.company_id=d.company_id AND w.id=d.work_order_id
    AND w.current_revision_id=d.work_order_revision_id AND w.deleted_at IS NULL
  JOIN work_order_revisions r ON r.company_id=d.company_id AND r.id=d.work_order_revision_id
    AND r.work_order_id=d.work_order_id
  WHERE d.company_id=$1 AND d.id=$2::uuid AND d.work_order_id=$3::uuid
    AND d.work_order_revision_id=$4::uuid AND d.generation_no=$5
    AND d.document_type='factory_instruction'
    AND d.generation_no=(SELECT max(latest.generation_no) FROM generated_documents latest
      WHERE latest.company_id=d.company_id AND latest.work_order_revision_id=d.work_order_revision_id
        AND latest.document_type=d.document_type)
    AND w.status IN ('issued','revised','completed')
    AND r.revision_status IN ('finalized','superseded')
`;

function mapTarget(row: DocumentRow): GeneratedDocumentPurgeTarget {
  if ((row.status !== "revoked" && row.status !== "deleted") || !row.revoked_at
      || !row.storage_object_key || row.file_size_bytes === null || !row.content_sha256) {
    throw new GeneratedDocumentPurgeRepositoryError("locked");
  }
  return {
    documentId: String(row.id),
    workOrderId: String(row.work_order_id),
    revisionId: String(row.work_order_revision_id),
    generationNumber: Number(row.generation_no),
    status: row.status,
    objectKey: String(row.storage_object_key),
    fileSizeBytes: Number(row.file_size_bytes),
    contentSha256: String(row.content_sha256),
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : null,
  };
}

function mapResult(target: GeneratedDocumentPurgeTarget): GeneratedDocumentPurgeResult {
  if (target.status !== "deleted" || !target.deletedAt) {
    throw new GeneratedDocumentPurgeRepositoryError("idempotency_incomplete");
  }
  return {
    documentId: target.documentId,
    workOrderId: target.workOrderId,
    revisionId: target.revisionId,
    generationNumber: target.generationNumber,
    status: "deleted",
    deletedAt: target.deletedAt,
    objectAbsent: true,
  };
}

type PurgeIdentity = {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly documentId: string;
  readonly generationNumber: number;
  readonly reason: string;
  readonly clientRequestId: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
};

async function completeReceipt(client: Parameters<Parameters<typeof withWaflV2TenantWriteTransaction>[0]>[0], input: PurgeIdentity) {
  await client.query(`
    UPDATE work_order_command_receipts
    SET work_order_id=$4::uuid,result_revision_id=$5::uuid,
        result_generated_document_id=$6::uuid,result_entity_version=$7
    WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
  `, [input.scope.companyId, GENERATED_DOCUMENT_PURGE_COMMAND_CODE, input.scopedIdempotencyKeyHash,
    input.workOrderId, input.revisionId, input.documentId, input.generationNumber]);
}

export async function prepareGeneratedDocumentPurgeV2(input: PurgeIdentity) {
  const started = performance.now();
  let statementCount = 0;
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    statementCount += 1;
    const reserved = await client.query(`
      INSERT INTO work_order_command_receipts (
        company_id,command_code,idempotency_key,request_sha256,correlation_id
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (company_id,command_code,idempotency_key) DO NOTHING
      RETURNING request_sha256
    `, [input.scope.companyId, GENERATED_DOCUMENT_PURGE_COMMAND_CODE, input.scopedIdempotencyKeyHash,
      input.requestHash, input.scope.correlationId]);
    statementCount += 1;
    if (reserved.rowCount === 0) {
      const receipt = await client.query<DbQueryResultRow>(`
        SELECT request_sha256,work_order_id,result_revision_id,result_generated_document_id,result_entity_version
        FROM work_order_command_receipts
        WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
        FOR UPDATE
      `, [input.scope.companyId, GENERATED_DOCUMENT_PURGE_COMMAND_CODE, input.scopedIdempotencyKeyHash]);
      statementCount += 1;
      const replay = receipt.rows[0];
      if (!replay) throw new GeneratedDocumentPurgeRepositoryError("idempotency_incomplete");
      if (String(replay.request_sha256) !== input.requestHash) {
        throw new GeneratedDocumentPurgeRepositoryError("idempotency_conflict");
      }
      const completed = String(replay.work_order_id ?? "") === input.workOrderId
        && String(replay.result_revision_id ?? "") === input.revisionId
        && String(replay.result_generated_document_id ?? "") === input.documentId
        && Number(replay.result_entity_version) === input.generationNumber;
      if (replay.work_order_id !== null && !completed) {
        throw new GeneratedDocumentPurgeRepositoryError("idempotency_incomplete");
      }
    }
    const selected = await client.query<DocumentRow>(`${TARGET_SQL} FOR UPDATE OF d`, [input.scope.companyId,
      input.documentId, input.workOrderId, input.revisionId, input.generationNumber]);
    statementCount += 1;
    if (!selected.rows[0]) throw new GeneratedDocumentPurgeRepositoryError("not_found");
    const target = mapTarget(selected.rows[0]);
    if (target.status === "deleted") {
      await completeReceipt(client, input);
      statementCount += 1;
      return { target, result: mapResult(target), idempotentReplay: true };
    }
    const activeTokens = await client.query(`
      SELECT 1 FROM document_access_tokens
      WHERE company_id=$1 AND generated_document_id=$2::uuid AND revoked_at IS NULL LIMIT 1
    `, [input.scope.companyId, input.documentId]);
    statementCount += 1;
    if (activeTokens.rowCount !== 0) throw new GeneratedDocumentPurgeRepositoryError("locked");
    return { target, result: null, idempotentReplay: false };
  });
  return { ...data, statementCount, transactionCount: 1 as const,
    dbMs: Number((performance.now() - started).toFixed(2)) };
}

export async function finalizeGeneratedDocumentPurgeV2(input: PurgeIdentity) {
  const started = performance.now();
  let statementCount = 0;
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    statementCount += 1;
    const selected = await client.query<DocumentRow>(`${TARGET_SQL} FOR UPDATE OF d`, [input.scope.companyId,
      input.documentId, input.workOrderId, input.revisionId, input.generationNumber]);
    statementCount += 1;
    if (!selected.rows[0]) throw new GeneratedDocumentPurgeRepositoryError("not_found");
    let target = mapTarget(selected.rows[0]);
    let changed = false;
    if (target.status === "revoked") {
      const updated = await client.query<DocumentRow>(`
        UPDATE generated_documents
        SET status='deleted',deleted_at=COALESCE(deleted_at,now()),updated_at=now()
        WHERE company_id=$1 AND id=$2::uuid AND work_order_id=$3::uuid
          AND work_order_revision_id=$4::uuid AND generation_no=$5 AND status='revoked'
        RETURNING id,work_order_id,work_order_revision_id,generation_no,status,storage_object_key,
          file_size_bytes,content_sha256,revoked_at,deleted_at
      `, [input.scope.companyId, input.documentId, input.workOrderId, input.revisionId, input.generationNumber]);
      statementCount += 1;
      if (!updated.rows[0]) throw new GeneratedDocumentPurgeRepositoryError("locked");
      target = mapTarget(updated.rows[0]);
      changed = true;
      await client.query(`
        INSERT INTO domain_events (
          company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,
          change_summary,metadata,schema_version
        ) VALUES ($1,'generated_document',$2::uuid,$3,$4,$5,$6,$7::jsonb,1)
      `, [input.scope.companyId, input.documentId, GENERATED_DOCUMENT_PURGE_COMMAND_CODE,
        input.scope.companyMemberId, input.scope.correlationId, "Revoked generated document artifact purged.",
        JSON.stringify({ workOrderId: input.workOrderId, revisionId: input.revisionId,
          generationNumber: input.generationNumber, clientRequestId: input.clientRequestId,
          reason: input.reason, storageIdentityRetained: true })]);
      statementCount += 1;
    }
    await completeReceipt(client, input);
    statementCount += 1;
    return { result: mapResult(target), idempotentReplay: !changed, changed };
  });
  return { ...data, statementCount, transactionCount: 1 as const,
    dbMs: Number((performance.now() - started).toFixed(2)) };
}

export async function readGeneratedDocumentPurgeTargetV2(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly documentId: string;
  readonly generationNumber: number;
}) {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const selected = await client.query<DocumentRow>(TARGET_SQL, [input.scope.companyId, input.documentId,
      input.workOrderId, input.revisionId, input.generationNumber]);
    if (!selected.rows[0]) throw new GeneratedDocumentPurgeRepositoryError("not_found");
    return mapTarget(selected.rows[0]);
  });
}
