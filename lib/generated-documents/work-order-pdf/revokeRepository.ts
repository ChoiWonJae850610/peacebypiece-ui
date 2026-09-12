import "server-only";

import { performance } from "node:perf_hooks";

import { withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";

export const GENERATED_DOCUMENT_REVOKE_COMMAND_CODE = "work_order.document.revoke";

export type GeneratedDocumentRevokeResult = {
  readonly documentId: string;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly generationNumber: number;
  readonly status: "revoked";
  readonly revokedAt: string;
  readonly revokedTokenCount: number;
};

type FailureReason = "not_found" | "locked" | "idempotency_conflict" | "idempotency_incomplete";

export class GeneratedDocumentRevokeRepositoryError extends Error {
  constructor(readonly reason: FailureReason) {
    super(reason);
    this.name = "GeneratedDocumentRevokeRepositoryError";
  }
}

type DocumentRow = DbQueryResultRow & {
  readonly id: string;
  readonly work_order_id: string;
  readonly work_order_revision_id: string;
  readonly generation_no: number | string;
  readonly status: string;
  readonly revoked_at: Date | string | null;
};

function map(row: DocumentRow, revokedTokenCount: number): GeneratedDocumentRevokeResult {
  if (!row.revoked_at) throw new GeneratedDocumentRevokeRepositoryError("idempotency_incomplete");
  return {
    documentId: String(row.id),
    workOrderId: String(row.work_order_id),
    revisionId: String(row.work_order_revision_id),
    generationNumber: Number(row.generation_no),
    status: "revoked",
    revokedAt: new Date(row.revoked_at).toISOString(),
    revokedTokenCount,
  };
}

export async function revokeGeneratedDocumentV2(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly documentId: string;
  readonly generationNumber: number;
  readonly reason: string;
  readonly clientRequestId: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}) {
  const started = performance.now();
  let statementCount = 0;
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    statementCount += 1;
    const reserved = await client.query(`
      INSERT INTO work_order_command_receipts (
        company_id, command_code, idempotency_key, request_sha256, correlation_id
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (company_id,command_code,idempotency_key) DO NOTHING
      RETURNING request_sha256
    `, [input.scope.companyId, GENERATED_DOCUMENT_REVOKE_COMMAND_CODE, input.scopedIdempotencyKeyHash, input.requestHash, input.scope.correlationId]);
    statementCount += 1;

    if (reserved.rowCount === 0) {
      const receipt = await client.query<DbQueryResultRow>(`
        SELECT request_sha256,work_order_id,result_revision_id,result_generated_document_id,result_entity_version
        FROM work_order_command_receipts
        WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
        FOR UPDATE
      `, [input.scope.companyId, GENERATED_DOCUMENT_REVOKE_COMMAND_CODE, input.scopedIdempotencyKeyHash]);
      statementCount += 1;
      const replay = receipt.rows[0];
      if (!replay) throw new GeneratedDocumentRevokeRepositoryError("idempotency_incomplete");
      if (String(replay.request_sha256) !== input.requestHash) throw new GeneratedDocumentRevokeRepositoryError("idempotency_conflict");
      if (String(replay.work_order_id ?? "") !== input.workOrderId
        || String(replay.result_revision_id ?? "") !== input.revisionId
        || String(replay.result_generated_document_id ?? "") !== input.documentId
        || Number(replay.result_entity_version) !== input.generationNumber) {
        throw new GeneratedDocumentRevokeRepositoryError("idempotency_incomplete");
      }
      const result = await client.query<DocumentRow>(`
        SELECT id,work_order_id,work_order_revision_id,generation_no,status,revoked_at
        FROM generated_documents
        WHERE company_id=$1 AND id=$2::uuid AND work_order_id=$3::uuid
          AND work_order_revision_id=$4::uuid AND generation_no=$5 AND status='revoked'
      `, [input.scope.companyId, input.documentId, input.workOrderId, input.revisionId, input.generationNumber]);
      statementCount += 1;
      if (!result.rows[0]) throw new GeneratedDocumentRevokeRepositoryError("idempotency_incomplete");
      return { result: map(result.rows[0], 0), idempotentReplay: true, changed: false };
    }

    const target = await client.query<DocumentRow>(`
      SELECT d.id,d.work_order_id,d.work_order_revision_id,d.generation_no,d.status,d.revoked_at
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
      FOR UPDATE OF d
    `, [input.scope.companyId, input.documentId, input.workOrderId, input.revisionId, input.generationNumber]);
    statementCount += 1;
    const row = target.rows[0];
    if (!row) throw new GeneratedDocumentRevokeRepositoryError("not_found");
    if (row.status !== "generated" && row.status !== "revoked") throw new GeneratedDocumentRevokeRepositoryError("locked");

    let revokedTokenCount = 0;
    const changed = row.status === "generated";
    let finalRow = row;
    if (changed) {
      const updated = await client.query<DocumentRow>(`
        UPDATE generated_documents SET status='revoked',revoked_at=COALESCE(revoked_at,now()),updated_at=now()
        WHERE company_id=$1 AND id=$2::uuid AND work_order_id=$3::uuid
          AND work_order_revision_id=$4::uuid AND generation_no=$5 AND status='generated'
        RETURNING id,work_order_id,work_order_revision_id,generation_no,status,revoked_at
      `, [input.scope.companyId, input.documentId, input.workOrderId, input.revisionId, input.generationNumber]);
      statementCount += 1;
      if (!updated.rows[0]) throw new GeneratedDocumentRevokeRepositoryError("locked");
      finalRow = updated.rows[0];
      const tokens = await client.query(`
        UPDATE document_access_tokens SET revoked_at=COALESCE(revoked_at,now())
        WHERE company_id=$1 AND generated_document_id=$2::uuid AND revoked_at IS NULL
      `, [input.scope.companyId, input.documentId]);
      statementCount += 1;
      revokedTokenCount = tokens.rowCount ?? 0;
      await client.query(`
        INSERT INTO domain_events (
          company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,
          change_summary,metadata,schema_version
        ) VALUES ($1,'generated_document',$2::uuid,$3,$4,$5,$6,$7::jsonb,1)
      `, [input.scope.companyId, input.documentId, GENERATED_DOCUMENT_REVOKE_COMMAND_CODE,
        input.scope.companyMemberId, input.scope.correlationId, "Generated document access revoked.",
        JSON.stringify({ workOrderId: input.workOrderId, revisionId: input.revisionId,
          generationNumber: input.generationNumber, clientRequestId: input.clientRequestId,
          reason: input.reason, revokedTokenCount })]);
      statementCount += 1;
    }

    await client.query(`
      UPDATE work_order_command_receipts
      SET work_order_id=$4::uuid,result_revision_id=$5::uuid,
          result_generated_document_id=$6::uuid,result_entity_version=$7
      WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
    `, [input.scope.companyId, GENERATED_DOCUMENT_REVOKE_COMMAND_CODE, input.scopedIdempotencyKeyHash,
      input.workOrderId, input.revisionId, input.documentId, input.generationNumber]);
    statementCount += 1;
    return { result: map(finalRow, revokedTokenCount), idempotentReplay: false, changed };
  });
  return { ...data, statementCount, transactionCount: 1 as const, dbMs: Number((performance.now() - started).toFixed(2)) };
}
