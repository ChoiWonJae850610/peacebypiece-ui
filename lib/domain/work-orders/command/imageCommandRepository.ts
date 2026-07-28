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

export const IMAGE_UPLOAD_COMMAND_CODE = "work_order.image.upload";
export const IMAGE_REPRESENTATIVE_COMMAND_CODE = "work_order.image.representative.set";
export const IMAGE_DELETE_COMMAND_CODE = "work_order.image.delete";

type ImageCommandFailureReason =
  | "not_found"
  | "conflict"
  | "locked"
  | "revision_mismatch"
  | "idempotency_conflict"
  | "idempotency_incomplete";

export class ImageCommandRepositoryError extends Error {
  readonly reason: ImageCommandFailureReason;
  readonly entityVersion: number | null;

  constructor(reason: ImageCommandFailureReason, entityVersion: number | null = null) {
    super(reason);
    this.name = "ImageCommandRepositoryError";
    this.reason = reason;
    this.entityVersion = entityVersion;
  }
}

type WorkOrderTargetRow = DbQueryResultRow & {
  readonly work_order_id: string;
  readonly revision_id: string;
  readonly revision_no: number | string;
  readonly work_order_status: string;
  readonly revision_status: string;
  readonly work_order_version: number | string;
  readonly representative_image_id: string | null;
};

type ImageTargetRow = WorkOrderTargetRow & {
  readonly image_id: string;
  readonly storage_object_key: string;
  readonly original_filename: string;
  readonly mime_type: string;
  readonly size_bytes: number | string;
  readonly display_order: number | string;
  readonly is_representative: boolean;
  readonly deleted_at: string | Date | null;
};

type ReceiptRow = DbQueryResultRow & {
  readonly request_sha256: string;
  readonly work_order_id: string | null;
  readonly result_revision_id: string | null;
  readonly result_entity_version: number | string | null;
};

type RepositoryContext = { statementCount: number };

export type ImageCommandRepositoryResult = {
  readonly result: {
    readonly workOrderId: WorkOrderId;
    readonly imageId: string;
    readonly nextVersion: EntityVersion;
    readonly isRepresentative: boolean;
    readonly deleted: boolean;
  };
  readonly idempotentReplay: boolean;
  readonly storageObjectKey: string;
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

function toInteger(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("IMAGE_COMMAND_INVALID_INTEGER");
  return parsed;
}

function assertCurrentDraft(target: WorkOrderTargetRow, expectedVersion: EntityVersion) {
  const currentVersion = toInteger(target.work_order_version);
  if (currentVersion !== expectedVersion) throw new ImageCommandRepositoryError("conflict", currentVersion);
  if (target.work_order_status !== "draft") throw new ImageCommandRepositoryError("locked", currentVersion);
  if (target.revision_status !== "draft") throw new ImageCommandRepositoryError("revision_mismatch", currentVersion);
}

async function lockWorkOrderTarget(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
}) {
  const target = await input.client.query<WorkOrderTargetRow>(`
    SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
           w.status AS work_order_status, r.revision_status,
           w.entity_version AS work_order_version, w.representative_image_id
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.company_id = w.company_id AND r.id = w.current_revision_id
    WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
      AND ($3::text IS NULL OR w.assignee_member_id = $3)
    FOR UPDATE OF w, r
  `, [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
  input.context.statementCount += 1;
  const row = target.rows[0];
  if (!row) throw new ImageCommandRepositoryError("not_found");
  return row;
}

async function lockImageTarget(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly imageId: string;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
}) {
  const target = await input.client.query<ImageTargetRow>(`
    SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
           w.status AS work_order_status, r.revision_status,
           w.entity_version AS work_order_version, w.representative_image_id,
           i.id AS image_id, i.storage_object_key, i.original_filename,
           i.mime_type, i.size_bytes, ri.display_order, ri.is_representative,
           i.deleted_at
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.company_id = w.company_id AND r.id = w.current_revision_id
    JOIN work_order_revision_images ri
      ON ri.company_id = w.company_id AND ri.revision_id = r.id
    JOIN work_order_images i
      ON i.company_id = w.company_id AND i.id = ri.image_id
    WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
      AND i.id = $3::uuid AND i.deleted_at IS NULL
      AND ($4::text IS NULL OR w.assignee_member_id = $4)
    FOR UPDATE OF w, r, ri, i
  `, [input.scope.companyId, input.workOrderId, input.imageId, input.assignedCompanyMemberId]);
  input.context.statementCount += 1;
  const row = target.rows[0];
  if (!row) throw new ImageCommandRepositoryError("not_found");
  return row;
}

async function reserveReceipt(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly commandCode: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
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
  if (!receipt) throw new ImageCommandRepositoryError("idempotency_incomplete");
  if (receipt.request_sha256 !== input.requestHash) {
    throw new ImageCommandRepositoryError(
      "idempotency_conflict",
      receipt.result_entity_version === null ? null : Number(receipt.result_entity_version),
    );
  }
  if (!receipt.work_order_id || !receipt.result_revision_id || receipt.result_entity_version === null) {
    throw new ImageCommandRepositoryError("idempotency_incomplete");
  }
  return receipt;
}

async function completeReceipt(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly commandCode: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly nextVersion: number;
}) {
  await input.client.query(`
    UPDATE work_order_command_receipts
    SET work_order_id = $4::uuid, result_revision_id = $5::uuid, result_entity_version = $6
    WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
  `, [
    input.scope.companyId,
    input.commandCode,
    input.scopedIdempotencyKeyHash,
    input.workOrderId,
    input.revisionId,
    input.nextVersion,
  ]);
  input.context.statementCount += 1;
}

async function advanceVersions(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly target: WorkOrderTargetRow;
  readonly expectedVersion: EntityVersion;
  readonly representativeImageId?: string | null;
}) {
  const setRepresentative = Object.prototype.hasOwnProperty.call(input, "representativeImageId");
  const result = await input.client.query<DbQueryResultRow & { readonly entity_version: number | string }>(`
    WITH updated_work_order AS (
      UPDATE work_orders
      SET entity_version = entity_version + 1,
          representative_image_id = CASE WHEN $5 THEN $6::uuid ELSE representative_image_id END,
          updated_at = now()
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
    setRepresentative,
    input.representativeImageId ?? null,
  ]);
  input.context.statementCount += 1;
  const nextVersion = result.rows[0]?.entity_version;
  if (nextVersion === undefined) {
    throw new ImageCommandRepositoryError("conflict", toInteger(input.target.work_order_version));
  }
  return toInteger(nextVersion);
}

async function appendEvent(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly target: WorkOrderTargetRow;
  readonly imageId: string;
  readonly commandCode: string;
  readonly summary: string;
  readonly metadata: Record<string, unknown>;
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
      imageId: input.imageId,
      revisionId: input.target.revision_id,
      revisionNumber: toInteger(input.target.revision_no),
      ...input.metadata,
    }),
  ]);
  input.context.statementCount += 1;
}

function wrapResult(input: {
  readonly workOrderId: string;
  readonly imageId: string;
  readonly nextVersion: number;
  readonly isRepresentative: boolean;
  readonly deleted: boolean;
  readonly idempotentReplay: boolean;
  readonly storageObjectKey: string;
  readonly context: RepositoryContext;
  readonly startedAt: number;
}): ImageCommandRepositoryResult {
  return {
    result: {
      workOrderId: input.workOrderId as WorkOrderId,
      imageId: input.imageId,
      nextVersion: input.nextVersion as EntityVersion,
      isRepresentative: input.isRepresentative,
      deleted: input.deleted,
    },
    idempotentReplay: input.idempotentReplay,
    storageObjectKey: input.storageObjectKey,
    statementCount: input.context.statementCount,
    transactionCount: 1,
    dbMs: Number((performance.now() - input.startedAt).toFixed(2)),
  };
}

export async function completeWorkOrderImageUploadV2(input: {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly workOrderId: WorkOrderId;
  readonly imageId: string;
  readonly expectedVersion: EntityVersion;
  readonly clientRequestId: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
  readonly storageObjectKey: string;
  readonly thumbnailObjectKey: string;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}) {
  const startedAt = performance.now();
  const context: RepositoryContext = { statementCount: 0 };
  const result = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const receipt = await reserveReceipt({
      client,
      context,
      scope: input.scope,
      commandCode: IMAGE_UPLOAD_COMMAND_CODE,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      requestHash: input.requestHash,
    });
    if (receipt) {
      const replayImage = await client.query<DbQueryResultRow & {
        readonly storage_object_key: string;
        readonly is_current_representative: boolean;
      }>(`
        SELECT storage_object_key, is_current_representative
        FROM work_order_images
        WHERE company_id = $1 AND work_order_id = $2::uuid AND id = $3::uuid
      `, [input.scope.companyId, receipt.work_order_id, input.imageId]);
      context.statementCount += 1;
      return {
        workOrderId: receipt.work_order_id as string,
        nextVersion: Number(receipt.result_entity_version),
        isRepresentative: Boolean(replayImage.rows[0]?.is_current_representative),
        storageObjectKey: replayImage.rows[0]?.storage_object_key ?? input.storageObjectKey,
        idempotentReplay: true,
      };
    }

    const target = await lockWorkOrderTarget({
      client,
      context,
      scope: input.scope,
      workOrderId: input.workOrderId,
      assignedCompanyMemberId: input.assignedCompanyMemberId,
    });
    assertCurrentDraft(target, input.expectedVersion);
    const activeImages = await client.query<DbQueryResultRow & { readonly active_count: number | string }>(`
      SELECT count(*)::integer AS active_count
      FROM work_order_revision_images ri
      JOIN work_order_images i
        ON i.company_id = ri.company_id AND i.id = ri.image_id AND i.deleted_at IS NULL
      WHERE ri.company_id = $1 AND ri.revision_id = $2::uuid
    `, [input.scope.companyId, target.revision_id]);
    context.statementCount += 1;
    const autoRepresentative = toInteger(activeImages.rows[0]?.active_count ?? 0) === 0
      && target.representative_image_id === null;
    await client.query(`
      WITH next_order AS (
        SELECT COALESCE(max(display_order), -1) + 1 AS display_order
        FROM work_order_revision_images
        WHERE company_id = $1 AND revision_id = $4::uuid
      ),
      inserted_image AS (
        INSERT INTO work_order_images (
          id, company_id, work_order_id, storage_object_key, thumbnail_object_key,
          original_filename, mime_type, size_bytes, content_sha256, title,
          display_order, is_current_representative, created_by_member_id
        )
        SELECT $2::uuid, $1, $3::uuid, $5, $10, $6, $7, $8, NULL, NULL,
               next_order.display_order, $11, $9
        FROM next_order
        RETURNING id, display_order
      )
      INSERT INTO work_order_revision_images (
        company_id, revision_id, image_id, display_order, is_representative,
        filename_snapshot, mime_type_snapshot, storage_object_key_snapshot
      )
      SELECT $1, $4::uuid, id, display_order, $11, $6, $7, $5
      FROM inserted_image
    `, [
      input.scope.companyId,
      input.imageId,
      target.work_order_id,
      target.revision_id,
      input.storageObjectKey,
      input.originalFilename,
      input.mimeType,
      input.sizeBytes,
      input.scope.companyMemberId,
      input.thumbnailObjectKey,
      autoRepresentative,
    ]);
    context.statementCount += 1;
    const nextVersion = await advanceVersions({
      client,
      context,
      scope: input.scope,
      target,
      expectedVersion: input.expectedVersion,
      ...(autoRepresentative ? { representativeImageId: input.imageId } : {}),
    });
    await appendEvent({
      client,
      context,
      scope: input.scope,
      target,
      imageId: input.imageId,
      commandCode: IMAGE_UPLOAD_COMMAND_CODE,
      summary: "작업지시서 이미지 업로드",
      metadata: {
        clientRequestId: input.clientRequestId,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        displayOrder: "append",
        representative: autoRepresentative,
        automaticRepresentative: autoRepresentative,
        versionTransition: { from: toInteger(target.work_order_version), to: nextVersion },
      },
    });
    await completeReceipt({
      client,
      context,
      scope: input.scope,
      commandCode: IMAGE_UPLOAD_COMMAND_CODE,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      workOrderId: target.work_order_id,
      revisionId: target.revision_id,
      nextVersion,
    });
    return {
      workOrderId: target.work_order_id,
      nextVersion,
      isRepresentative: autoRepresentative,
      storageObjectKey: input.storageObjectKey,
      idempotentReplay: false,
    };
  });

  return wrapResult({
    workOrderId: result.workOrderId,
    imageId: input.imageId,
    nextVersion: result.nextVersion,
    isRepresentative: result.isRepresentative,
    deleted: false,
    idempotentReplay: result.idempotentReplay,
    storageObjectKey: result.storageObjectKey,
    context,
    startedAt,
  });
}

async function mutateExistingImage(input: {
  readonly kind: "representative" | "delete";
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly workOrderId: WorkOrderId;
  readonly imageId: string;
  readonly expectedVersion: EntityVersion;
  readonly clientRequestId: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}) {
  const startedAt = performance.now();
  const context: RepositoryContext = { statementCount: 0 };
  const commandCode = input.kind === "representative"
    ? IMAGE_REPRESENTATIVE_COMMAND_CODE
    : IMAGE_DELETE_COMMAND_CODE;
  const result = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const receipt = await reserveReceipt({
      client,
      context,
      scope: input.scope,
      commandCode,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      requestHash: input.requestHash,
    });
    if (receipt) {
      const replayImage = await client.query<DbQueryResultRow & {
        readonly storage_object_key: string;
        readonly is_current_representative: boolean;
        readonly deleted_at: string | Date | null;
      }>(`
        SELECT storage_object_key, is_current_representative, deleted_at
        FROM work_order_images
        WHERE company_id = $1 AND work_order_id = $2::uuid AND id = $3::uuid
      `, [input.scope.companyId, receipt.work_order_id, input.imageId]);
      context.statementCount += 1;
      const image = replayImage.rows[0];
      if (!image) throw new ImageCommandRepositoryError("idempotency_incomplete");
      return {
        workOrderId: receipt.work_order_id as string,
        nextVersion: Number(receipt.result_entity_version),
        isRepresentative: Boolean(image.is_current_representative),
        deleted: image.deleted_at !== null,
        storageObjectKey: image.storage_object_key,
        idempotentReplay: true,
      };
    }

    const target = await lockImageTarget({
      client,
      context,
      scope: input.scope,
      workOrderId: input.workOrderId,
      imageId: input.imageId,
      assignedCompanyMemberId: input.assignedCompanyMemberId,
    });
    assertCurrentDraft(target, input.expectedVersion);

    if (input.kind === "representative") {
      await client.query(`
        UPDATE work_order_revision_images
        SET is_representative = false
        WHERE company_id = $1 AND revision_id = $2::uuid AND is_representative = true
      `, [input.scope.companyId, target.revision_id]);
      context.statementCount += 1;
      await client.query(`
        UPDATE work_order_images
        SET is_current_representative = false, updated_at = now()
        WHERE company_id = $1 AND work_order_id = $2::uuid
          AND deleted_at IS NULL AND is_current_representative = true
      `, [input.scope.companyId, target.work_order_id]);
      context.statementCount += 1;
      await client.query(`
        UPDATE work_order_revision_images
        SET is_representative = true
        WHERE company_id = $1 AND revision_id = $2::uuid AND image_id = $3::uuid
      `, [input.scope.companyId, target.revision_id, input.imageId]);
      context.statementCount += 1;
      await client.query(`
        UPDATE work_order_images
        SET is_current_representative = true, updated_at = now()
        WHERE company_id = $1 AND work_order_id = $2::uuid
          AND id = $3::uuid AND deleted_at IS NULL
      `, [input.scope.companyId, target.work_order_id, input.imageId]);
      context.statementCount += 1;
    } else {
      await client.query(`
        DELETE FROM work_order_revision_images
        WHERE company_id = $1 AND revision_id = $2::uuid AND image_id = $3::uuid
      `, [input.scope.companyId, target.revision_id, input.imageId]);
      context.statementCount += 1;
      await client.query(`
        UPDATE work_order_images
        SET is_current_representative = false,
            deleted_at = now(),
            purge_after_at = now() + interval '30 days',
            updated_at = now()
        WHERE company_id = $1 AND work_order_id = $2::uuid AND id = $3::uuid
      `, [input.scope.companyId, target.work_order_id, input.imageId]);
      context.statementCount += 1;
    }

    const representativeImageId = input.kind === "representative"
      ? input.imageId
      : target.representative_image_id === input.imageId ? null : target.representative_image_id;
    const nextVersion = await advanceVersions({
      client,
      context,
      scope: input.scope,
      target,
      expectedVersion: input.expectedVersion,
      representativeImageId,
    });
    await appendEvent({
      client,
      context,
      scope: input.scope,
      target,
      imageId: input.imageId,
      commandCode,
      summary: input.kind === "representative" ? "작업지시서 대표이미지 지정" : "작업지시서 이미지 삭제",
      metadata: {
        clientRequestId: input.clientRequestId,
        representativeTransition: input.kind === "representative"
          ? { from: target.representative_image_id, to: input.imageId }
          : { from: target.representative_image_id, to: representativeImageId },
        automaticPromotion: false,
        versionTransition: { from: toInteger(target.work_order_version), to: nextVersion },
      },
    });
    await completeReceipt({
      client,
      context,
      scope: input.scope,
      commandCode,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      workOrderId: target.work_order_id,
      revisionId: target.revision_id,
      nextVersion,
    });
    return {
      workOrderId: target.work_order_id,
      nextVersion,
      isRepresentative: input.kind === "representative",
      deleted: input.kind === "delete",
      storageObjectKey: target.storage_object_key,
      idempotentReplay: false,
    };
  });

  return wrapResult({
    workOrderId: result.workOrderId,
    imageId: input.imageId,
    nextVersion: result.nextVersion,
    isRepresentative: result.isRepresentative,
    deleted: result.deleted,
    idempotentReplay: result.idempotentReplay,
    storageObjectKey: result.storageObjectKey,
    context,
    startedAt,
  });
}

export function setRepresentativeWorkOrderImageV2(
  input: Omit<Parameters<typeof mutateExistingImage>[0], "kind">,
) {
  return mutateExistingImage({ ...input, kind: "representative" });
}

export function deleteWorkOrderImageV2(
  input: Omit<Parameters<typeof mutateExistingImage>[0], "kind">,
) {
  return mutateExistingImage({ ...input, kind: "delete" });
}
