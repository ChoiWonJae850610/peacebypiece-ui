import "server-only";

import { performance } from "perf_hooks";

import type {
  CompanyMemberId,
  EntityVersion,
  TenantMemberScope,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";
import {
  withWaflV2TenantWriteTransaction,
  type DbQueryResultRow,
  type DbTransactionClient,
} from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";

export const ATTACHMENT_UPLOAD_COMMAND_CODE = "work_order.attachment.upload";
export const ATTACHMENT_DELETE_COMMAND_CODE = "work_order.attachment.delete";

type FailureReason =
  | "not_found"
  | "conflict"
  | "locked"
  | "revision_mismatch"
  | "idempotency_conflict"
  | "idempotency_incomplete";

export class AttachmentCommandRepositoryError extends Error {
  readonly reason: FailureReason;
  readonly entityVersion: number | null;

  constructor(reason: FailureReason, entityVersion: number | null = null) {
    super(reason);
    this.name = "AttachmentCommandRepositoryError";
    this.reason = reason;
    this.entityVersion = entityVersion;
  }
}

type TargetRow = DbQueryResultRow & {
  readonly work_order_id: string;
  readonly revision_id: string;
  readonly revision_no: number | string;
  readonly work_order_status: string;
  readonly revision_status: string;
  readonly work_order_version: number | string;
};

type AttachmentTargetRow = TargetRow & {
  readonly attachment_id: string;
  readonly storage_object_key: string;
  readonly deleted_at: string | Date | null;
};

type ReceiptRow = DbQueryResultRow & {
  readonly request_sha256: string;
  readonly work_order_id: string | null;
  readonly result_revision_id: string | null;
  readonly result_entity_version: number | string | null;
};

type Context = { statementCount: number };

export type AttachmentCommandRepositoryResult = {
  readonly result: {
    readonly workOrderId: WorkOrderId;
    readonly attachmentId: string;
    readonly nextVersion: EntityVersion;
    readonly deleted: boolean;
  };
  readonly storageObjectKey: string;
  readonly idempotentReplay: boolean;
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

function integer(value: number | string): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error("ATTACHMENT_COMMAND_INVALID_INTEGER");
  return result;
}

function assertDraft(target: TargetRow, expectedVersion: EntityVersion) {
  const currentVersion = integer(target.work_order_version);
  if (currentVersion !== expectedVersion) throw new AttachmentCommandRepositoryError("conflict", currentVersion);
  if (target.work_order_status !== "draft") throw new AttachmentCommandRepositoryError("locked", currentVersion);
  if (target.revision_status !== "draft") throw new AttachmentCommandRepositoryError("revision_mismatch", currentVersion);
}

async function lockTarget(input: {
  client: DbTransactionClient;
  context: Context;
  scope: TenantMemberScope;
  workOrderId: WorkOrderId;
  assignedCompanyMemberId: CompanyMemberId | null;
}) {
  const result = await input.client.query<TargetRow>(`
    SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
           w.status AS work_order_status, r.revision_status,
           w.entity_version AS work_order_version
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.company_id = w.company_id AND r.id = w.current_revision_id
    WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
      AND ($3::text IS NULL OR w.assignee_member_id = $3)
    FOR UPDATE OF w, r
  `, [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
  input.context.statementCount += 1;
  const target = result.rows[0];
  if (!target) throw new AttachmentCommandRepositoryError("not_found");
  return target;
}

async function lockAttachmentTarget(input: {
  client: DbTransactionClient;
  context: Context;
  scope: TenantMemberScope;
  workOrderId: WorkOrderId;
  attachmentId: string;
  assignedCompanyMemberId: CompanyMemberId | null;
}) {
  const result = await input.client.query<AttachmentTargetRow>(`
    SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
           w.status AS work_order_status, r.revision_status,
           w.entity_version AS work_order_version,
           a.id AS attachment_id, a.storage_object_key, a.deleted_at
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.company_id = w.company_id AND r.id = w.current_revision_id
    JOIN work_order_revision_attachments ra
      ON ra.company_id = w.company_id AND ra.revision_id = r.id
    JOIN work_order_attachments a
      ON a.company_id = w.company_id AND a.id = ra.attachment_id
    WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
      AND a.id = $3::uuid AND a.deleted_at IS NULL
      AND ($4::text IS NULL OR w.assignee_member_id = $4)
    FOR UPDATE OF w, r, ra, a
  `, [input.scope.companyId, input.workOrderId, input.attachmentId, input.assignedCompanyMemberId]);
  input.context.statementCount += 1;
  const target = result.rows[0];
  if (!target) throw new AttachmentCommandRepositoryError("not_found");
  return target;
}

async function reserveReceipt(input: {
  client: DbTransactionClient;
  context: Context;
  scope: TenantMemberScope;
  commandCode: string;
  scopedIdempotencyKeyHash: string;
  requestHash: string;
}) {
  const inserted = await input.client.query<ReceiptRow>(`
    INSERT INTO work_order_command_receipts (
      company_id, command_code, idempotency_key, request_sha256, correlation_id
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING
    RETURNING request_sha256, work_order_id, result_revision_id, result_entity_version
  `, [
    input.scope.companyId,
    input.commandCode,
    input.scopedIdempotencyKeyHash,
    input.requestHash,
    input.scope.correlationId,
  ]);
  input.context.statementCount += 1;
  if (inserted.rows[0]) return null;
  const existing = await input.client.query<ReceiptRow>(`
    SELECT request_sha256, work_order_id, result_revision_id, result_entity_version
    FROM work_order_command_receipts
    WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
  `, [input.scope.companyId, input.commandCode, input.scopedIdempotencyKeyHash]);
  input.context.statementCount += 1;
  const receipt = existing.rows[0];
  if (!receipt) throw new AttachmentCommandRepositoryError("idempotency_incomplete");
  if (receipt.request_sha256 !== input.requestHash) {
    throw new AttachmentCommandRepositoryError(
      "idempotency_conflict",
      receipt.result_entity_version === null ? null : Number(receipt.result_entity_version),
    );
  }
  if (!receipt.work_order_id || !receipt.result_revision_id || receipt.result_entity_version === null) {
    throw new AttachmentCommandRepositoryError("idempotency_incomplete");
  }
  return receipt;
}

async function completeReceipt(input: {
  client: DbTransactionClient;
  context: Context;
  scope: TenantMemberScope;
  commandCode: string;
  scopedIdempotencyKeyHash: string;
  target: TargetRow;
  nextVersion: number;
}) {
  await input.client.query(`
    UPDATE work_order_command_receipts
    SET work_order_id = $4::uuid, result_revision_id = $5::uuid, result_entity_version = $6
    WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
  `, [
    input.scope.companyId,
    input.commandCode,
    input.scopedIdempotencyKeyHash,
    input.target.work_order_id,
    input.target.revision_id,
    input.nextVersion,
  ]);
  input.context.statementCount += 1;
}

async function advanceVersions(input: {
  client: DbTransactionClient;
  context: Context;
  scope: TenantMemberScope;
  target: TargetRow;
  expectedVersion: EntityVersion;
}) {
  const result = await input.client.query<DbQueryResultRow & { entity_version: number | string }>(`
    WITH updated_work_order AS (
      UPDATE work_orders
      SET entity_version = entity_version + 1, updated_at = now()
      WHERE company_id = $1 AND id = $2::uuid AND entity_version = $3
        AND current_revision_id = $4::uuid AND status = 'draft'
      RETURNING entity_version
    ),
    updated_revision AS (
      UPDATE work_order_revisions
      SET entity_version = entity_version + 1, updated_at = now()
      WHERE company_id = $1 AND id = $4::uuid AND revision_status = 'draft'
      RETURNING entity_version
    )
    SELECT entity_version FROM updated_work_order
    WHERE EXISTS (SELECT 1 FROM updated_revision)
  `, [
    input.scope.companyId,
    input.target.work_order_id,
    input.expectedVersion,
    input.target.revision_id,
  ]);
  input.context.statementCount += 1;
  const next = result.rows[0]?.entity_version;
  if (next === undefined) {
    throw new AttachmentCommandRepositoryError("conflict", integer(input.target.work_order_version));
  }
  return integer(next);
}

async function appendEvent(input: {
  client: DbTransactionClient;
  context: Context;
  scope: TenantMemberScope;
  target: TargetRow;
  attachmentId: string;
  commandCode: string;
  summary: string;
  clientRequestId: string;
  nextVersion: number;
}) {
  await input.client.query(`
    INSERT INTO domain_events (
      company_id, entity_type, entity_id, command_code, actor_member_id,
      correlation_id, change_summary, metadata, schema_version
    ) VALUES ($1, 'work_order', $2, $3, $4, $5, $6, $7::jsonb, 1)
  `, [
    input.scope.companyId,
    input.target.work_order_id,
    input.commandCode,
    input.scope.companyMemberId,
    input.scope.correlationId,
    input.summary,
    JSON.stringify({
      attachmentId: input.attachmentId,
      revisionId: input.target.revision_id,
      revisionNumber: integer(input.target.revision_no),
      clientRequestId: input.clientRequestId,
      versionTransition: {
        from: integer(input.target.work_order_version),
        to: input.nextVersion,
      },
    }),
  ]);
  input.context.statementCount += 1;
}

function result(input: {
  workOrderId: string;
  attachmentId: string;
  nextVersion: number;
  deleted: boolean;
  storageObjectKey: string;
  idempotentReplay: boolean;
  context: Context;
  startedAt: number;
}): AttachmentCommandRepositoryResult {
  return {
    result: {
      workOrderId: input.workOrderId as WorkOrderId,
      attachmentId: input.attachmentId,
      nextVersion: input.nextVersion as EntityVersion,
      deleted: input.deleted,
    },
    storageObjectKey: input.storageObjectKey,
    idempotentReplay: input.idempotentReplay,
    statementCount: input.context.statementCount,
    transactionCount: 1,
    dbMs: Number((performance.now() - input.startedAt).toFixed(2)),
  };
}

export async function completeWorkOrderAttachmentUploadV2(input: {
  scope: TenantMemberScope;
  assignedCompanyMemberId: CompanyMemberId | null;
  workOrderId: WorkOrderId;
  attachmentId: string;
  expectedVersion: EntityVersion;
  clientRequestId: string;
  scopedIdempotencyKeyHash: string;
  requestHash: string;
  storageObjectKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const completed = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const receipt = await reserveReceipt({
      client,
      context,
      scope: input.scope,
      commandCode: ATTACHMENT_UPLOAD_COMMAND_CODE,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      requestHash: input.requestHash,
    });
    if (receipt) {
      return {
        workOrderId: receipt.work_order_id as string,
        nextVersion: Number(receipt.result_entity_version),
        storageObjectKey: input.storageObjectKey,
        idempotentReplay: true,
      };
    }
    const target = await lockTarget({
      client,
      context,
      scope: input.scope,
      workOrderId: input.workOrderId,
      assignedCompanyMemberId: input.assignedCompanyMemberId,
    });
    assertDraft(target, input.expectedVersion);
    await client.query(`
      WITH next_order AS (
        SELECT COALESCE(max(display_order), -1) + 1 AS display_order
        FROM work_order_revision_attachments
        WHERE company_id = $1 AND revision_id = $4::uuid
      ),
      inserted AS (
        INSERT INTO work_order_attachments (
          id, company_id, work_order_id, attachment_kind, storage_object_key,
          original_filename, mime_type, size_bytes, output_include_default,
          created_by_member_id
        )
        SELECT $2::uuid, $1, $3::uuid, 'file', $5, $6, $7, $8, false, $9
        FROM next_order
        RETURNING id
      )
      INSERT INTO work_order_revision_attachments (
        company_id, revision_id, attachment_id, display_order, output_include,
        filename_snapshot, mime_type_snapshot, storage_object_key_snapshot
      )
      SELECT $1, $4::uuid, inserted.id, next_order.display_order, false, $6, $7, $5
      FROM inserted CROSS JOIN next_order
    `, [
      input.scope.companyId,
      input.attachmentId,
      target.work_order_id,
      target.revision_id,
      input.storageObjectKey,
      input.originalFilename,
      input.mimeType,
      input.sizeBytes,
      input.scope.companyMemberId,
    ]);
    context.statementCount += 1;
    const nextVersion = await advanceVersions({
      client,
      context,
      scope: input.scope,
      target,
      expectedVersion: input.expectedVersion,
    });
    await appendEvent({
      client,
      context,
      scope: input.scope,
      target,
      attachmentId: input.attachmentId,
      commandCode: ATTACHMENT_UPLOAD_COMMAND_CODE,
      summary: "작업지시서 첨부 업로드",
      clientRequestId: input.clientRequestId,
      nextVersion,
    });
    await completeReceipt({
      client,
      context,
      scope: input.scope,
      commandCode: ATTACHMENT_UPLOAD_COMMAND_CODE,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      target,
      nextVersion,
    });
    return {
      workOrderId: target.work_order_id,
      nextVersion,
      storageObjectKey: input.storageObjectKey,
      idempotentReplay: false,
    };
  });
  return result({
    ...completed,
    attachmentId: input.attachmentId,
    deleted: false,
    context,
    startedAt,
  });
}

export async function deleteWorkOrderAttachmentV2(input: {
  scope: TenantMemberScope;
  assignedCompanyMemberId: CompanyMemberId | null;
  workOrderId: WorkOrderId;
  attachmentId: string;
  expectedVersion: EntityVersion;
  clientRequestId: string;
  scopedIdempotencyKeyHash: string;
  requestHash: string;
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const completed = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const receipt = await reserveReceipt({
      client,
      context,
      scope: input.scope,
      commandCode: ATTACHMENT_DELETE_COMMAND_CODE,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      requestHash: input.requestHash,
    });
    if (receipt) {
      const replay = await client.query<DbQueryResultRow & {
        readonly storage_object_key: string;
        readonly deleted_at: string | Date | null;
      }>(`
        SELECT storage_object_key, deleted_at
        FROM work_order_attachments
        WHERE company_id = $1 AND work_order_id = $2::uuid AND id = $3::uuid
      `, [input.scope.companyId, receipt.work_order_id, input.attachmentId]);
      context.statementCount += 1;
      if (!replay.rows[0]) throw new AttachmentCommandRepositoryError("idempotency_incomplete");
      return {
        workOrderId: receipt.work_order_id as string,
        nextVersion: Number(receipt.result_entity_version),
        storageObjectKey: replay.rows[0].storage_object_key,
        idempotentReplay: true,
      };
    }
    const target = await lockAttachmentTarget({
      client,
      context,
      scope: input.scope,
      workOrderId: input.workOrderId,
      attachmentId: input.attachmentId,
      assignedCompanyMemberId: input.assignedCompanyMemberId,
    });
    assertDraft(target, input.expectedVersion);
    await client.query(`
      DELETE FROM work_order_revision_attachments
      WHERE company_id = $1 AND revision_id = $2::uuid AND attachment_id = $3::uuid
    `, [input.scope.companyId, target.revision_id, input.attachmentId]);
    context.statementCount += 1;
    await client.query(`
      UPDATE work_order_attachments
      SET deleted_at = now(), purge_after_at = now() + interval '30 days', updated_at = now()
      WHERE company_id = $1 AND work_order_id = $2::uuid AND id = $3::uuid
    `, [input.scope.companyId, target.work_order_id, input.attachmentId]);
    context.statementCount += 1;
    const nextVersion = await advanceVersions({
      client,
      context,
      scope: input.scope,
      target,
      expectedVersion: input.expectedVersion,
    });
    await appendEvent({
      client,
      context,
      scope: input.scope,
      target,
      attachmentId: input.attachmentId,
      commandCode: ATTACHMENT_DELETE_COMMAND_CODE,
      summary: "작업지시서 첨부 삭제",
      clientRequestId: input.clientRequestId,
      nextVersion,
    });
    await completeReceipt({
      client,
      context,
      scope: input.scope,
      commandCode: ATTACHMENT_DELETE_COMMAND_CODE,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      target,
      nextVersion,
    });
    return {
      workOrderId: target.work_order_id,
      nextVersion,
      storageObjectKey: target.storage_object_key,
      idempotentReplay: false,
    };
  });
  return result({
    ...completed,
    attachmentId: input.attachmentId,
    deleted: true,
    context,
    startedAt,
  });
}
