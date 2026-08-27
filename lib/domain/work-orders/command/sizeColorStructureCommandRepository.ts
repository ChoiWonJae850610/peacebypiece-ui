import "server-only";

import { createHash } from "crypto";
import { performance } from "perf_hooks";

import {
  withWaflV2TenantWriteTransaction,
  type DbQueryResultRow,
  type DbTransactionClient,
} from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { planColorSizeQuantityProjection } from "@/lib/domain/work-orders/command/quantityProjectionPolicy";
import { encodeDestinationQuantityCells } from "@/lib/domain/work-orders/command/sizeColorQuantityBatchPolicy";
import { WORK_ORDER_COMMAND_CODES } from "@/lib/domain/work-orders/command/workOrderCommandCodes";
import { findWaflBasicSpecTemplateById } from "@/lib/domain/work-orders/measurement/waflBasicSpecV1";
import {
  sortColorRows,
  sortSizeRows,
} from "@/apps/mobile/domain/sizeColorStructurePolicy";
import type {
  ColorId,
  CompanyMemberId,
  EntityVersion,
  SizeColorStructureCommandResult,
  SizeRowId,
  TenantMemberScope,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";

export const SIZE_STRUCTURE_CREATE_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.sizeStructure.create;
export const SIZE_STRUCTURE_RENAME_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.sizeStructure.rename;
export const SIZE_STRUCTURE_REORDER_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.sizeStructure.reorder;
export const SIZE_STRUCTURE_DELETE_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.sizeStructure.delete;
export const COLOR_STRUCTURE_CREATE_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.colorStructure.create;
export const COLOR_STRUCTURE_PATCH_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.colorStructure.patch;
export const COLOR_STRUCTURE_REORDER_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.colorStructure.reorder;
export const COLOR_STRUCTURE_DELETE_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.colorStructure.delete;
export const COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.colorSizeQuantity.upsert;
export const STRUCTURE_SELECTION_BATCH_COMMAND_CODE = WORK_ORDER_COMMAND_CODES.structureSelection.batch;

type FailureReason =
  | "not_found"
  | "conflict"
  | "locked"
  | "revision_mismatch"
  | "duplicate"
  | "invalid_set"
  | "idempotency_conflict"
  | "idempotency_incomplete";

export class SizeColorStructureRepositoryError extends Error {
  readonly reason: FailureReason;
  readonly entityVersion: number | null;

  constructor(reason: FailureReason, entityVersion: number | null = null) {
    super(reason);
    this.name = "SizeColorStructureRepositoryError";
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
  readonly revision_version: number | string;
  readonly work_order_total: number | string;
  readonly revision_total: number | string;
  readonly derivation_kind: string;
  readonly reorder_round: number | string;
};

type SizeRow = DbQueryResultRow & {
  readonly id: string;
  readonly size_code: string;
  readonly display_label: string;
  readonly display_order: number | string;
};

type ColorRow = DbQueryResultRow & {
  readonly id: string;
  readonly color_code: string | null;
  readonly display_name: string;
  readonly hex_value: string | null;
  readonly display_order: number | string;
};

type QuantityCellRow = DbQueryResultRow & {
  readonly quantity: number | string;
};

type ReceiptRow = DbQueryResultRow & {
  readonly request_sha256: string;
  readonly work_order_id: string | null;
  readonly result_revision_id: string | null;
  readonly result_entity_version: number | string | null;
  readonly correlation_id: string;
};

type DeleteReplayRow = DbQueryResultRow & {
  readonly metadata: unknown;
};

type Context = { statementCount: number };

export type SizeColorStructureRepositoryResult = {
  readonly result: SizeColorStructureCommandResult;
  readonly nextVersion: EntityVersion;
  readonly idempotentReplay: boolean;
  readonly changedFields: readonly string[];
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

function integer(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("SIZE_COLOR_STRUCTURE_INVALID_INTEGER");
  return parsed;
}

function normalizeName(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

function targetResult(input: {
  readonly target: TargetRow;
  readonly targetKind: "size" | "color" | "quantity";
  readonly targetId: string | null;
  readonly colorId?: ColorId;
  readonly sizeRowId?: SizeRowId;
  readonly quantity?: number;
  readonly quantityCells?: readonly { readonly colorId: ColorId; readonly sizeRowId: SizeRowId; readonly quantity: number }[];
  readonly totalQuantity?: number;
  readonly deletedQuantityCellCount?: number;
  readonly removedQuantity?: number;
  readonly createdItems?: readonly { readonly id: string; readonly displayName: string; readonly hexValue: string | null }[];
  readonly deletedTargetIds?: readonly string[];
  readonly nextVersion?: number;
}): SizeColorStructureCommandResult {
  return {
    workOrderId: input.target.work_order_id as WorkOrderId,
    revisionId: input.target.revision_id as SizeColorStructureCommandResult["revisionId"],
    targetKind: input.targetKind,
    targetId: input.targetId as SizeRowId | ColorId | null,
    ...(input.colorId ? { colorId: input.colorId } : {}),
    ...(input.sizeRowId ? { sizeRowId: input.sizeRowId } : {}),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
    ...(input.quantityCells !== undefined ? { quantityCells: input.quantityCells } : {}),
    ...(input.totalQuantity !== undefined ? { totalQuantity: input.totalQuantity } : {}),
    ...(input.deletedQuantityCellCount !== undefined ? { deletedQuantityCellCount: input.deletedQuantityCellCount } : {}),
    ...(input.removedQuantity !== undefined ? { removedQuantity: input.removedQuantity } : {}),
    ...(input.createdItems !== undefined ? { createdItems: input.createdItems } : {}),
    ...(input.deletedTargetIds !== undefined ? { deletedTargetIds: input.deletedTargetIds } : {}),
    nextVersion: (input.nextVersion ?? integer(input.target.work_order_version)) as EntityVersion,
  };
}

async function lockTarget(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
}) {
  const result = await input.client.query<TargetRow>(`
    SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
           w.status AS work_order_status, r.revision_status,
           w.entity_version AS work_order_version, r.entity_version AS revision_version,
           w.total_quantity AS work_order_total,
           r.total_quantity_snapshot AS revision_total,
           w.derivation_kind,w.reorder_round
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.company_id = w.company_id AND r.id = w.current_revision_id
    WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
      AND ($3::text IS NULL OR w.assignee_member_id = $3)
    FOR UPDATE OF w, r
  `, [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
  input.context.statementCount += 1;
  const target = result.rows[0];
  if (!target) throw new SizeColorStructureRepositoryError("not_found");
  return target;
}

function assertCurrentDraft(target: TargetRow, expectedVersion: EntityVersion, allowReorderQuantity = false) {
  const currentVersion = integer(target.work_order_version);
  if (currentVersion !== expectedVersion) throw new SizeColorStructureRepositoryError("conflict", currentVersion);
  if (target.work_order_status !== "draft") throw new SizeColorStructureRepositoryError("locked", currentVersion);
  if (target.revision_status !== "draft") {
    throw new SizeColorStructureRepositoryError("revision_mismatch", currentVersion);
  }
  if (target.derivation_kind === "reorder" && Number(target.reorder_round) > 0 && !allowReorderQuantity) {
    throw new SizeColorStructureRepositoryError("locked", currentVersion);
  }
}

async function readReceipt(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly commandCode: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}): Promise<ReceiptRow | null> {
  const existing = await input.client.query<ReceiptRow>(`
    SELECT request_sha256, work_order_id, result_revision_id, result_entity_version, correlation_id
    FROM work_order_command_receipts
    WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
  `, [input.scope.companyId, input.commandCode, input.scopedIdempotencyKeyHash]);
  input.context.statementCount += 1;
  const receipt = existing.rows[0];
  if (!receipt) return null;
  if (receipt.request_sha256 !== input.requestHash) {
    throw new SizeColorStructureRepositoryError(
      "idempotency_conflict",
      receipt.result_entity_version === null ? null : Number(receipt.result_entity_version),
    );
  }
  if (!receipt.work_order_id || !receipt.result_revision_id || receipt.result_entity_version === null) {
    throw new SizeColorStructureRepositoryError("idempotency_incomplete");
  }
  return receipt;
}

async function reserveReceipt(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly commandCode: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}) {
  const inserted = await input.client.query(`
    INSERT INTO work_order_command_receipts (
      company_id, command_code, idempotency_key, request_sha256, correlation_id
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING
    RETURNING request_sha256
  `, [
    input.scope.companyId,
    input.commandCode,
    input.scopedIdempotencyKeyHash,
    input.requestHash,
    input.scope.correlationId,
  ]);
  input.context.statementCount += 1;
  if (!inserted.rows[0]) throw new SizeColorStructureRepositoryError("idempotency_incomplete");
}

async function completeReceipt(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly commandCode: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly target: TargetRow;
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
    input.target.work_order_id,
    input.target.revision_id,
    input.nextVersion,
  ]);
  input.context.statementCount += 1;
}

async function advanceVersions(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly target: TargetRow;
  readonly expectedVersion: EntityVersion;
  readonly canonicalTotalQuantity?: number;
}) {
  const result = await input.client.query<DbQueryResultRow & { readonly entity_version: number | string }>(`
    WITH updated_work_order AS (
      UPDATE work_orders
      SET entity_version = entity_version + 1,
          total_quantity = CASE WHEN $5::boolean THEN $6::integer ELSE total_quantity END,
          updated_at = now()
      WHERE company_id = $1 AND id = $2::uuid AND entity_version = $3
        AND current_revision_id = $4::uuid AND status = 'draft'
      RETURNING entity_version
    ),
    updated_processes AS (
      UPDATE work_order_processes
      SET quantity = $6::numeric,
          amount = round($6::numeric * unit_price, 2),
          entity_version = entity_version + 1,
          updated_at = now()
      WHERE company_id = $1 AND revision_id = $4::uuid AND $5::boolean
      RETURNING amount
    ),
    process_totals AS (
      SELECT COALESCE(sum(amount), 0)::numeric(14,2) AS total
      FROM (
        SELECT amount FROM updated_processes
        UNION ALL
        SELECT amount FROM work_order_processes
        WHERE company_id = $1 AND revision_id = $4::uuid AND NOT $5::boolean
      ) current_processes
    ),
    updated_revision AS (
      UPDATE work_order_revisions r
      SET entity_version = entity_version + 1,
          total_quantity_snapshot = CASE WHEN $5::boolean THEN $6::integer ELSE total_quantity_snapshot END,
          process_total = totals.total,
          estimated_total = r.fabric_total + r.accessory_total + totals.total,
          updated_at = now()
      FROM process_totals totals
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
    input.canonicalTotalQuantity !== undefined,
    input.canonicalTotalQuantity ?? 0,
  ]);
  input.context.statementCount += 1;
  const nextVersion = result.rows[0]?.entity_version;
  if (nextVersion === undefined) {
    throw new SizeColorStructureRepositoryError("conflict", integer(input.target.work_order_version));
  }
  return integer(nextVersion);
}

async function appendEvent(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly target: TargetRow;
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
      revisionId: input.target.revision_id,
      revisionNumber: integer(input.target.revision_no),
      ...input.metadata,
    }),
  ]);
  input.context.statementCount += 1;
}

async function readSizes(client: DbTransactionClient, context: Context, scope: TenantMemberScope, revisionId: string) {
  const result = await client.query<SizeRow>(`
    SELECT id, size_code, display_label, display_order
    FROM work_order_sizes
    WHERE company_id = $1 AND revision_id = $2::uuid
    ORDER BY display_order, id
    FOR UPDATE
  `, [scope.companyId, revisionId]);
  context.statementCount += 1;
  return result.rows;
}

async function readColors(client: DbTransactionClient, context: Context, scope: TenantMemberScope, revisionId: string) {
  const result = await client.query<ColorRow>(`
    SELECT id, color_code, display_name, hex_value, display_order
    FROM work_order_colors
    WHERE company_id = $1 AND revision_id = $2::uuid
    ORDER BY display_order, id
    FOR UPDATE
  `, [scope.companyId, revisionId]);
  context.statementCount += 1;
  return result.rows;
}

async function readCanonicalQuantityTotal(
  client: DbTransactionClient,
  context: Context,
  scope: TenantMemberScope,
  revisionId: string,
) {
  const result = await client.query<DbQueryResultRow & { readonly total_quantity: number | string }>(`
    SELECT COALESCE(sum(quantity), 0)::integer AS total_quantity
    FROM color_size_quantities
    WHERE company_id = $1 AND revision_id = $2::uuid
  `, [scope.companyId, revisionId]);
  context.statementCount += 1;
  return integer(result.rows[0]?.total_quantity ?? 0);
}

async function synchronizeFinishedSpecSizes(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly revisionId: string;
}) {
  await input.client.query(`
    DELETE FROM work_order_size_spec_values value
    USING work_order_size_spec_sizes spec_size, work_order_size_specs spec
    WHERE value.company_id = $1 AND value.revision_id = $2::uuid
      AND spec_size.company_id = value.company_id AND spec_size.id = value.size_row_id
      AND spec.company_id = value.company_id AND spec.id = value.size_spec_id
      AND NOT EXISTS (
        SELECT 1 FROM work_order_sizes work_size
        WHERE work_size.company_id = $1 AND work_size.revision_id = $2::uuid
          AND upper(regexp_replace(trim(work_size.size_code), '\\s+', '', 'g'))
            = upper(regexp_replace(trim(spec_size.size_code), '\\s+', '', 'g'))
      )
  `, [input.scope.companyId, input.revisionId]);
  input.context.statementCount += 1;
  await input.client.query(`
    DELETE FROM work_order_size_spec_sizes spec_size
    USING work_order_size_specs spec
    WHERE spec_size.company_id = $1 AND spec_size.revision_id = $2::uuid
      AND spec.company_id = spec_size.company_id AND spec.id = spec_size.size_spec_id
      AND NOT EXISTS (
        SELECT 1 FROM work_order_sizes work_size
        WHERE work_size.company_id = $1 AND work_size.revision_id = $2::uuid
          AND upper(regexp_replace(trim(work_size.size_code), '\\s+', '', 'g'))
            = upper(regexp_replace(trim(spec_size.size_code), '\\s+', '', 'g'))
      )
  `, [input.scope.companyId, input.revisionId]);
  input.context.statementCount += 1;
  await input.client.query(`
    INSERT INTO work_order_size_spec_sizes (
      id, company_id, revision_id, size_spec_id, size_code, display_label, display_order
    )
    SELECT work_size.id, $1, $2::uuid, spec.id, work_size.size_code,
           work_size.display_label, work_size.display_order
    FROM work_order_sizes work_size
    JOIN work_order_size_specs spec ON spec.company_id=$1 AND spec.revision_id=$2::uuid
    WHERE work_size.company_id=$1 AND work_size.revision_id=$2::uuid
    ON CONFLICT (size_spec_id, size_code) DO UPDATE
    SET display_label=EXCLUDED.display_label,
        display_order=EXCLUDED.display_order,
        updated_at=now()
  `, [input.scope.companyId, input.revisionId]);
  input.context.statementCount += 1;

  const source = await input.client.query<DbQueryResultRow & {
    readonly size_spec_id: string;
    readonly source_template_id: string | null;
    readonly item_code: string | null;
  }>(`
    SELECT spec.id AS size_spec_id, spec.source_template_id, revision.item_code_snapshot AS item_code
    FROM work_order_size_specs spec
    JOIN work_order_revisions revision
      ON revision.company_id=spec.company_id AND revision.id=spec.revision_id
    WHERE spec.company_id=$1 AND spec.revision_id=$2::uuid
    FOR UPDATE OF spec
  `, [input.scope.companyId, input.revisionId]);
  input.context.statementCount += 1;
  const sourceRow = source.rows[0];
  if (!sourceRow?.source_template_id) return;

  const basicTemplate = findWaflBasicSpecTemplateById(sourceRow.source_template_id, sourceRow.item_code);
  if (basicTemplate) {
    const values = Object.entries(basicTemplate.valuesCm).flatMap(([sizeCode, measurements]) => (
      Object.entries(measurements).flatMap(([name, decimalValue]) => {
        const pom = basicTemplate.poms.find((candidate) => candidate.name === name);
        return pom ? [{ size_code: sizeCode, pom_code: pom.code, decimal_value: decimalValue }] : [];
      })
    ));
    await input.client.query(`
      INSERT INTO work_order_size_spec_values (
        company_id, revision_id, size_spec_id, size_row_id, pom_column_id, decimal_value, display_fraction
      )
      SELECT $1, $2::uuid, $3::uuid, spec_size.id, pom.id, value.decimal_value, NULL
      FROM jsonb_to_recordset($4::jsonb) AS value(size_code text, pom_code text, decimal_value numeric)
      JOIN work_order_size_spec_sizes spec_size
        ON spec_size.company_id=$1 AND spec_size.size_spec_id=$3::uuid
       AND upper(regexp_replace(trim(spec_size.size_code),'\\s+','','g'))
         = upper(regexp_replace(trim(value.size_code),'\\s+','','g'))
      JOIN work_order_size_spec_poms pom
        ON pom.company_id=$1 AND pom.size_spec_id=$3::uuid AND pom.pom_code=value.pom_code
      ON CONFLICT (size_spec_id, size_row_id, pom_column_id) DO NOTHING
    `, [input.scope.companyId, input.revisionId, sourceRow.size_spec_id, JSON.stringify(values)]);
    input.context.statementCount += 1;
    return;
  }

  await input.client.query(`
    INSERT INTO work_order_size_spec_values (
      company_id, revision_id, size_spec_id, size_row_id, pom_column_id, decimal_value, display_fraction
    )
    SELECT $1, $2::uuid, $3::uuid, spec_size.id, pom.id, template_value.decimal_value, template_value.display_fraction
    FROM size_spec_template_values template_value
    JOIN size_spec_template_sizes template_size
      ON template_size.template_id=$4::uuid AND template_size.id=template_value.size_row_id
    JOIN size_spec_template_poms template_pom
      ON template_pom.template_id=$4::uuid AND template_pom.id=template_value.pom_column_id
    JOIN work_order_size_spec_sizes spec_size
      ON spec_size.company_id=$1 AND spec_size.size_spec_id=$3::uuid
     AND upper(regexp_replace(trim(spec_size.size_code),'\\s+','','g'))
       = upper(regexp_replace(trim(template_size.size_code),'\\s+','','g'))
    JOIN work_order_size_spec_poms pom
      ON pom.company_id=$1 AND pom.size_spec_id=$3::uuid AND pom.pom_code=template_pom.pom_code
    WHERE template_value.template_id=$4::uuid
    ON CONFLICT (size_spec_id, size_row_id, pom_column_id) DO NOTHING
  `, [input.scope.companyId, input.revisionId, sourceRow.size_spec_id, sourceRow.source_template_id]);
  input.context.statementCount += 1;
}

function deleteReplayMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SizeColorStructureRepositoryError("idempotency_incomplete");
  }
  const metadata = value as Record<string, unknown>;
  if (
    !Number.isSafeInteger(metadata.deletedQuantityCellCount)
    || Number(metadata.deletedQuantityCellCount) < 0
    || !Number.isSafeInteger(metadata.removedQuantity)
    || Number(metadata.removedQuantity) < 0
    || !Number.isSafeInteger(metadata.canonicalTotalQuantity)
    || Number(metadata.canonicalTotalQuantity) < 0
  ) throw new SizeColorStructureRepositoryError("idempotency_incomplete");
  return {
    deletedQuantityCellCount: Number(metadata.deletedQuantityCellCount),
    removedQuantity: Number(metadata.removedQuantity),
    canonicalTotalQuantity: Number(metadata.canonicalTotalQuantity),
  };
}

async function readDeleteReplay(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly target: TargetRow;
  readonly receipt: ReceiptRow;
  readonly commandCode: string;
  readonly targetKind: "size" | "color";
  readonly targetId: SizeRowId | ColorId;
}) {
  const event = await input.client.query<DeleteReplayRow>(`
    SELECT metadata
    FROM domain_events
    WHERE company_id = $1 AND entity_type = 'work_order' AND entity_id = $2
      AND command_code = $3 AND correlation_id = $4
    ORDER BY occurred_at DESC, id DESC
    LIMIT 1
  `, [input.scope.companyId, input.target.work_order_id, input.commandCode, input.receipt.correlation_id]);
  input.context.statementCount += 1;
  const metadata = deleteReplayMetadata(event.rows[0]?.metadata);
  const nextVersion = integer(input.receipt.result_entity_version as number | string);
  const originalTarget = {
    ...input.target,
    revision_id: input.receipt.result_revision_id as string,
  };
  return {
    result: targetResult({
      target: originalTarget,
      targetKind: input.targetKind,
      targetId: input.targetId,
      totalQuantity: metadata.canonicalTotalQuantity,
      deletedQuantityCellCount: metadata.deletedQuantityCellCount,
      removedQuantity: metadata.removedQuantity,
      nextVersion,
    }),
    nextVersion: nextVersion as EntityVersion,
    idempotentReplay: true,
    changedFields: [] as readonly string[],
  };
}

function assertUniqueName(rows: readonly { readonly id: string }[], names: readonly string[], value: string, exceptId?: string) {
  const normalized = normalizeName(value);
  if (rows.some((row, index) => row.id !== exceptId && normalizeName(names[index]) === normalized)) {
    throw new SizeColorStructureRepositoryError("duplicate");
  }
}

function assertExactSet(currentIds: readonly string[], orderedIds: readonly string[]) {
  if (
    currentIds.length !== orderedIds.length
    || currentIds.some((id) => !orderedIds.includes(id))
  ) {
    throw new SizeColorStructureRepositoryError("invalid_set");
  }
}

async function updateOrders(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly revisionId: string;
  readonly table: "work_order_sizes" | "work_order_colors";
  readonly orderedIds: readonly string[];
}) {
  await input.client.query(`
    UPDATE ${input.table} AS item
    SET display_order = ordered.ordinality - 1, updated_at = now()
    FROM unnest($3::uuid[]) WITH ORDINALITY AS ordered(id, ordinality)
    WHERE item.company_id = $1 AND item.revision_id = $2::uuid AND item.id = ordered.id
  `, [input.scope.companyId, input.revisionId, input.orderedIds]);
  input.context.statementCount += 1;
}

async function applyCanonicalSizeOrder(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly revisionId: string;
  readonly rows: readonly Pick<SizeRow, "id" | "display_label">[];
}) {
  await updateOrders({
    ...input,
    table: "work_order_sizes",
    orderedIds: sortSizeRows(input.rows.map((row) => ({
      id: row.id,
      displayLabel: row.display_label,
    }))).map((row) => row.id),
  });
}

async function applyCanonicalColorOrder(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly revisionId: string;
  readonly rows: readonly Pick<ColorRow, "id" | "display_name">[];
}) {
  await updateOrders({
    ...input,
    table: "work_order_colors",
    orderedIds: sortColorRows(input.rows.map((row) => ({
      id: row.id,
      displayName: row.display_name,
    }))).map((row) => row.id),
  });
}

async function finishChanged(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly target: TargetRow;
  readonly expectedVersion: EntityVersion;
  readonly commandCode: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly clientRequestId: string;
  readonly targetKind: "size" | "color" | "quantity";
  readonly targetId: string | null;
  readonly changedFields: readonly string[];
  readonly summary: string;
  readonly canonicalTotalQuantity?: number;
  readonly eventMetadata?: Readonly<Record<string, unknown>>;
}) {
  const nextVersion = await advanceVersions(input);
  await appendEvent({
    ...input,
    summary: input.summary,
    metadata: {
      clientRequestId: input.clientRequestId,
      targetKind: input.targetKind,
      targetId: input.targetId,
      changedFields: input.changedFields,
      ...(input.canonicalTotalQuantity !== undefined
        ? { canonicalTotalQuantity: input.canonicalTotalQuantity }
        : {}),
      ...input.eventMetadata,
      versionTransition: {
        from: integer(input.target.work_order_version),
        to: nextVersion,
      },
    },
  });
  await completeReceipt({ ...input, nextVersion });
  return nextVersion;
}

function replayResult(input: {
  readonly target: TargetRow;
  readonly receipt: ReceiptRow;
  readonly targetKind: "size" | "color" | "quantity";
  readonly targetId: string | null;
}) {
  const nextVersion = integer(input.receipt.result_entity_version as number | string);
  return {
    result: targetResult({ ...input, nextVersion }),
    nextVersion: nextVersion as EntityVersion,
    idempotentReplay: true,
    changedFields: [] as readonly string[],
  };
}

function wrapped(input: {
  readonly result: SizeColorStructureCommandResult;
  readonly nextVersion: EntityVersion;
  readonly idempotentReplay: boolean;
  readonly changedFields: readonly string[];
  readonly context: Context;
  readonly startedAt: number;
}): SizeColorStructureRepositoryResult {
  return {
    result: input.result,
    nextVersion: input.nextVersion,
    idempotentReplay: input.idempotentReplay,
    changedFields: input.changedFields,
    statementCount: input.context.statementCount,
    transactionCount: 1,
    dbMs: Math.max(0, Math.round((performance.now() - input.startedAt) * 100) / 100),
  };
}

type CommonInput = {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly workOrderId: WorkOrderId;
  readonly expectedVersion: EntityVersion;
  readonly clientRequestId: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
};

function derivedCode(prefix: string, label: string, existing: ReadonlySet<string>) {
  const ascii = label.normalize("NFKC").trim().toUpperCase();
  const base = /^[A-Z0-9]{1,20}$/.test(ascii)
    ? ascii
    : `${prefix}-${createHash("sha256").update(label.normalize("NFKC").trim()).digest("hex").slice(0, 10).toUpperCase()}`;
  if (!existing.has(base)) return base;
  for (let suffix = 2; suffix <= 999; suffix += 1) {
    const candidate = `${base.slice(0, 56)}-${suffix}`;
    if (!existing.has(candidate)) return candidate;
  }
  throw new SizeColorStructureRepositoryError("duplicate");
}

export async function addSizeStructureV2(input: CommonInput & {
  readonly sizeRowId: SizeRowId;
  readonly displayLabel: string;
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({ client, context, ...input, commandCode: SIZE_STRUCTURE_CREATE_COMMAND_CODE });
    if (existingReceipt) return replayResult({ target, receipt: existingReceipt, targetKind: "size", targetId: input.sizeRowId });
    assertCurrentDraft(target, input.expectedVersion);
    const sizes = await readSizes(client, context, input.scope, target.revision_id);
    assertUniqueName(sizes, sizes.map((row) => row.display_label), input.displayLabel);
    await reserveReceipt({ client, context, ...input, commandCode: SIZE_STRUCTURE_CREATE_COMMAND_CODE });
    const sizeCode = derivedCode("SIZE", input.displayLabel, new Set(sizes.map((row) => row.size_code)));
    const displayOrder = sizes.reduce((maximum, row) => Math.max(maximum, integer(row.display_order)), -1) + 1;
    await client.query(`
      INSERT INTO work_order_sizes (
        id, company_id, revision_id, size_code, display_label, display_order
      ) VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6)
    `, [input.sizeRowId, input.scope.companyId, target.revision_id, sizeCode, input.displayLabel, displayOrder]);
    context.statementCount += 1;
    await applyCanonicalSizeOrder({
      client,
      context,
      scope: input.scope,
      revisionId: target.revision_id,
      rows: [...sizes, { id: input.sizeRowId, display_label: input.displayLabel }],
    });
    await synchronizeFinishedSpecSizes({ client, context, scope: input.scope, revisionId: target.revision_id });
    const changedFields = ["size.create"] as const;
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      commandCode: SIZE_STRUCTURE_CREATE_COMMAND_CODE,
      targetKind: "size", targetId: input.sizeRowId,
      changedFields, summary: "사이즈 구조 추가",
    });
    return {
      result: targetResult({ target, targetKind: "size", targetId: input.sizeRowId, nextVersion }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}

export async function renameSizeStructureV2(input: CommonInput & {
  readonly sizeRowId: SizeRowId;
  readonly displayLabel: string;
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({ client, context, ...input, commandCode: SIZE_STRUCTURE_RENAME_COMMAND_CODE });
    if (existingReceipt) return replayResult({ target, receipt: existingReceipt, targetKind: "size", targetId: input.sizeRowId });
    assertCurrentDraft(target, input.expectedVersion);
    const sizes = await readSizes(client, context, input.scope, target.revision_id);
    const current = sizes.find((row) => row.id === input.sizeRowId);
    if (!current) throw new SizeColorStructureRepositoryError("not_found");
    assertUniqueName(sizes, sizes.map((row) => row.display_label), input.displayLabel, input.sizeRowId);
    if (current.display_label === input.displayLabel) {
      const result = targetResult({ target, targetKind: "size", targetId: input.sizeRowId });
      return { result, nextVersion: result.nextVersion, idempotentReplay: false, changedFields: [] as readonly string[] };
    }
    await reserveReceipt({ client, context, ...input, commandCode: SIZE_STRUCTURE_RENAME_COMMAND_CODE });
    await client.query(`
      UPDATE work_order_sizes
      SET display_label = $4, updated_at = now()
      WHERE company_id = $1 AND revision_id = $2::uuid AND id = $3::uuid
    `, [input.scope.companyId, target.revision_id, input.sizeRowId, input.displayLabel]);
    context.statementCount += 1;
    await applyCanonicalSizeOrder({
      client,
      context,
      scope: input.scope,
      revisionId: target.revision_id,
      rows: sizes.map((row) => row.id === input.sizeRowId ? { ...row, display_label: input.displayLabel } : row),
    });
    await synchronizeFinishedSpecSizes({ client, context, scope: input.scope, revisionId: target.revision_id });
    const changedFields = ["size.displayLabel"] as const;
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      commandCode: SIZE_STRUCTURE_RENAME_COMMAND_CODE,
      targetKind: "size", targetId: input.sizeRowId,
      changedFields, summary: "사이즈 표시명 수정",
    });
    return {
      result: targetResult({ target, targetKind: "size", targetId: input.sizeRowId, nextVersion }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}

export async function reorderSizeStructuresV2(input: CommonInput & {
  readonly orderedSizeRowIds: readonly SizeRowId[];
}) {
  return reorderStructuresV2({
    ...input,
    targetKind: "size",
    commandCode: SIZE_STRUCTURE_REORDER_COMMAND_CODE,
    orderedIds: input.orderedSizeRowIds,
  });
}

export async function addColorStructureV2(input: CommonInput & {
  readonly colorId: ColorId;
  readonly displayName: string;
  readonly hexValue: string | null;
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({ client, context, ...input, commandCode: COLOR_STRUCTURE_CREATE_COMMAND_CODE });
    if (existingReceipt) return replayResult({ target, receipt: existingReceipt, targetKind: "color", targetId: input.colorId });
    assertCurrentDraft(target, input.expectedVersion);
    const colors = await readColors(client, context, input.scope, target.revision_id);
    assertUniqueName(colors, colors.map((row) => row.display_name), input.displayName);
    await reserveReceipt({ client, context, ...input, commandCode: COLOR_STRUCTURE_CREATE_COMMAND_CODE });
    const colorCode = derivedCode("COLOR", input.displayName, new Set(colors.map((row) => row.color_code).filter((value): value is string => value !== null)));
    const displayOrder = colors.reduce((maximum, row) => Math.max(maximum, integer(row.display_order)), -1) + 1;
    await client.query(`
      INSERT INTO work_order_colors (
        id, company_id, revision_id, color_code, display_name, hex_value, display_order
      ) VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7)
    `, [input.colorId, input.scope.companyId, target.revision_id, colorCode, input.displayName, input.hexValue, displayOrder]);
    context.statementCount += 1;
    await applyCanonicalColorOrder({
      client,
      context,
      scope: input.scope,
      revisionId: target.revision_id,
      rows: [...colors, { id: input.colorId, display_name: input.displayName }],
    });
    const changedFields = ["color.create"] as const;
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      commandCode: COLOR_STRUCTURE_CREATE_COMMAND_CODE,
      targetKind: "color", targetId: input.colorId,
      changedFields, summary: "색상 구조 추가",
    });
    return {
      result: targetResult({ target, targetKind: "color", targetId: input.colorId, nextVersion }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}

export async function patchColorStructureV2(input: CommonInput & {
  readonly colorId: ColorId;
  readonly patch: { readonly displayName?: string; readonly hexValue?: string | null };
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({ client, context, ...input, commandCode: COLOR_STRUCTURE_PATCH_COMMAND_CODE });
    if (existingReceipt) return replayResult({ target, receipt: existingReceipt, targetKind: "color", targetId: input.colorId });
    assertCurrentDraft(target, input.expectedVersion);
    const colors = await readColors(client, context, input.scope, target.revision_id);
    const current = colors.find((row) => row.id === input.colorId);
    if (!current) throw new SizeColorStructureRepositoryError("not_found");
    if (input.patch.displayName !== undefined) {
      assertUniqueName(colors, colors.map((row) => row.display_name), input.patch.displayName, input.colorId);
    }
    const changedFields = [
      input.patch.displayName !== undefined && input.patch.displayName !== current.display_name ? "color.displayName" : null,
      input.patch.hexValue !== undefined && input.patch.hexValue !== current.hex_value ? "color.hexValue" : null,
    ].filter((field): field is string => field !== null);
    if (changedFields.length === 0) {
      const result = targetResult({ target, targetKind: "color", targetId: input.colorId });
      return { result, nextVersion: result.nextVersion, idempotentReplay: false, changedFields };
    }
    await reserveReceipt({ client, context, ...input, commandCode: COLOR_STRUCTURE_PATCH_COMMAND_CODE });
    await client.query(`
      UPDATE work_order_colors
      SET display_name = CASE WHEN $4 THEN $5 ELSE display_name END,
          hex_value = CASE WHEN $6 THEN $7 ELSE hex_value END,
          updated_at = now()
      WHERE company_id = $1 AND revision_id = $2::uuid AND id = $3::uuid
    `, [
      input.scope.companyId,
      target.revision_id,
      input.colorId,
      input.patch.displayName !== undefined,
      input.patch.displayName ?? null,
      input.patch.hexValue !== undefined,
      input.patch.hexValue ?? null,
    ]);
    context.statementCount += 1;
    if (input.patch.displayName !== undefined && input.patch.displayName !== current.display_name) {
      await applyCanonicalColorOrder({
        client,
        context,
        scope: input.scope,
        revisionId: target.revision_id,
        rows: colors.map((row) => row.id === input.colorId
          ? { ...row, display_name: input.patch.displayName as string }
          : row),
      });
    }
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      commandCode: COLOR_STRUCTURE_PATCH_COMMAND_CODE,
      targetKind: "color", targetId: input.colorId,
      changedFields, summary: "색상 구조 수정",
    });
    return {
      result: targetResult({ target, targetKind: "color", targetId: input.colorId, nextVersion }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}

export async function reorderColorStructuresV2(input: CommonInput & {
  readonly orderedColorIds: readonly ColorId[];
}) {
  return reorderStructuresV2({
    ...input,
    targetKind: "color",
    commandCode: COLOR_STRUCTURE_REORDER_COMMAND_CODE,
    orderedIds: input.orderedColorIds,
  });
}

const DELETE_STRUCTURE_CONFIG = {
  size: {
    commandCode: SIZE_STRUCTURE_DELETE_COMMAND_CODE,
    table: "work_order_sizes",
    quantityColumn: "size_id",
    summary: "사이즈 구조 삭제",
  },
  color: {
    commandCode: COLOR_STRUCTURE_DELETE_COMMAND_CODE,
    table: "work_order_colors",
    quantityColumn: "color_id",
    summary: "색상 구조 삭제",
  },
} as const;

async function deleteStructureV2(input: CommonInput & {
  readonly targetKind: "size" | "color";
  readonly targetId: SizeRowId | ColorId;
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const config = DELETE_STRUCTURE_CONFIG[input.targetKind];
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({ client, context, ...input, commandCode: config.commandCode });
    if (existingReceipt) {
      return readDeleteReplay({
        client, context, scope: input.scope, target, receipt: existingReceipt,
        commandCode: config.commandCode, targetKind: input.targetKind, targetId: input.targetId,
      });
    }
    assertCurrentDraft(target, input.expectedVersion);
    const rows = input.targetKind === "size"
      ? await readSizes(client, context, input.scope, target.revision_id)
      : await readColors(client, context, input.scope, target.revision_id);
    if (!rows.some((row) => row.id === input.targetId)) {
      throw new SizeColorStructureRepositoryError("not_found");
    }
    await reserveReceipt({ client, context, ...input, commandCode: config.commandCode });
    const deletedCells = await client.query<QuantityCellRow>(`
      DELETE FROM color_size_quantities
      WHERE company_id = $1 AND revision_id = $2::uuid AND ${config.quantityColumn} = $3::uuid
      RETURNING quantity
    `, [input.scope.companyId, target.revision_id, input.targetId]);
    context.statementCount += 1;
    const deletedQuantityCellCount = deletedCells.rows.length;
    const removedQuantity = deletedCells.rows.reduce((sum, row) => sum + integer(row.quantity), 0);
    const deletedTarget = await client.query(`
      DELETE FROM ${config.table}
      WHERE company_id = $1 AND revision_id = $2::uuid AND id = $3::uuid
      RETURNING id
    `, [input.scope.companyId, target.revision_id, input.targetId]);
    context.statementCount += 1;
    if (!deletedTarget.rows[0]) throw new SizeColorStructureRepositoryError("not_found");
    const survivors = rows.filter((row) => row.id !== input.targetId);
    if (input.targetKind === "size") {
      await applyCanonicalSizeOrder({
        client, context, scope: input.scope, revisionId: target.revision_id,
        rows: survivors as readonly SizeRow[],
      });
      await synchronizeFinishedSpecSizes({ client, context, scope: input.scope, revisionId: target.revision_id });
    } else {
      await applyCanonicalColorOrder({
        client, context, scope: input.scope, revisionId: target.revision_id,
        rows: survivors as readonly ColorRow[],
      });
    }
    const canonicalTotalQuantity = await readCanonicalQuantityTotal(client, context, input.scope, target.revision_id);
    const changedFields = [
      `${input.targetKind}.delete`,
      "quantityCells.delete",
      "totalQuantity",
      "totalQuantitySnapshot",
    ] as const;
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      commandCode: config.commandCode,
      targetKind: input.targetKind,
      targetId: input.targetId,
      changedFields,
      summary: config.summary,
      canonicalTotalQuantity,
      eventMetadata: { deletedQuantityCellCount, removedQuantity },
    });
    return {
      result: targetResult({
        target, targetKind: input.targetKind, targetId: input.targetId,
        totalQuantity: canonicalTotalQuantity, deletedQuantityCellCount, removedQuantity, nextVersion,
      }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}

export function deleteSizeStructureV2(input: CommonInput & { readonly sizeRowId: SizeRowId }) {
  return deleteStructureV2({ ...input, targetKind: "size", targetId: input.sizeRowId });
}

export function deleteColorStructureV2(input: CommonInput & { readonly colorId: ColorId }) {
  return deleteStructureV2({ ...input, targetKind: "color", targetId: input.colorId });
}

type SelectionBatchAddition = {
  readonly id: SizeRowId | ColorId;
  readonly displayName: string;
  readonly hexValue: string | null;
};

function parseSelectionBatchReplay(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SizeColorStructureRepositoryError("idempotency_incomplete");
  }
  const metadata = value as Record<string, unknown>;
  const createdItems = metadata.createdItems;
  const deletedTargetIds = metadata.deletedTargetIds;
  if (!Array.isArray(createdItems) || !Array.isArray(deletedTargetIds)
    || createdItems.some((item) => !item || typeof item !== "object" || Array.isArray(item)
      || typeof (item as Record<string, unknown>).id !== "string"
      || typeof (item as Record<string, unknown>).displayName !== "string"
      || !((item as Record<string, unknown>).hexValue === null || typeof (item as Record<string, unknown>).hexValue === "string"))
    || deletedTargetIds.some((id) => typeof id !== "string")
    || !Number.isSafeInteger(metadata.deletedQuantityCellCount)
    || !Number.isSafeInteger(metadata.removedQuantity)
    || !Number.isSafeInteger(metadata.canonicalTotalQuantity)) {
    throw new SizeColorStructureRepositoryError("idempotency_incomplete");
  }
  return {
    createdItems: createdItems as readonly SelectionBatchAddition[],
    deletedTargetIds: deletedTargetIds as readonly string[],
    deletedQuantityCellCount: Number(metadata.deletedQuantityCellCount),
    removedQuantity: Number(metadata.removedQuantity),
    canonicalTotalQuantity: Number(metadata.canonicalTotalQuantity),
  };
}

async function readSelectionBatchReplay(input: {
  readonly client: DbTransactionClient;
  readonly context: Context;
  readonly scope: TenantMemberScope;
  readonly target: TargetRow;
  readonly receipt: ReceiptRow;
  readonly targetKind: "size" | "color";
}) {
  const event = await input.client.query<DeleteReplayRow>(`
    SELECT metadata
    FROM domain_events
    WHERE company_id = $1 AND entity_type = 'work_order' AND entity_id = $2
      AND command_code = $3 AND correlation_id = $4
    ORDER BY occurred_at DESC, id DESC
    LIMIT 1
  `, [input.scope.companyId, input.target.work_order_id, STRUCTURE_SELECTION_BATCH_COMMAND_CODE, input.receipt.correlation_id]);
  input.context.statementCount += 1;
  const metadata = parseSelectionBatchReplay(event.rows[0]?.metadata);
  const nextVersion = integer(input.receipt.result_entity_version as number | string);
  return {
    result: targetResult({
      target: { ...input.target, revision_id: input.receipt.result_revision_id as string },
      targetKind: input.targetKind,
      targetId: null,
      ...metadata,
      nextVersion,
    }),
    nextVersion: nextVersion as EntityVersion,
    idempotentReplay: true,
    changedFields: [] as readonly string[],
  };
}

export async function batchStructureSelectionV2(input: CommonInput & {
  readonly targetKind: "size" | "color";
  readonly additions: readonly SelectionBatchAddition[];
  readonly deletionIds: readonly (SizeRowId | ColorId)[];
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({
      client, context, ...input, commandCode: STRUCTURE_SELECTION_BATCH_COMMAND_CODE,
    });
    if (existingReceipt) {
      return readSelectionBatchReplay({ client, context, scope: input.scope, target, receipt: existingReceipt, targetKind: input.targetKind });
    }
    assertCurrentDraft(target, input.expectedVersion);
    const rows = input.targetKind === "size"
      ? await readSizes(client, context, input.scope, target.revision_id)
      : await readColors(client, context, input.scope, target.revision_id);
    const currentIds = new Set(rows.map((row) => row.id));
    if (input.deletionIds.some((id) => !currentIds.has(id))) {
      throw new SizeColorStructureRepositoryError("not_found");
    }
    const deletionSet = new Set<string>(input.deletionIds);
    const survivingNames = rows
      .filter((row) => !deletionSet.has(row.id))
      .map((row) => normalizeName(input.targetKind === "size" ? (row as SizeRow).display_label : (row as ColorRow).display_name));
    const additionNames = input.additions.map((item) => normalizeName(item.displayName));
    if (new Set([...survivingNames, ...additionNames]).size !== survivingNames.length + additionNames.length) {
      throw new SizeColorStructureRepositoryError("duplicate");
    }
    await reserveReceipt({ client, context, ...input, commandCode: STRUCTURE_SELECTION_BATCH_COMMAND_CODE });

    let deletedQuantityCellCount = 0;
    let removedQuantity = 0;
    if (input.deletionIds.length > 0) {
      const quantityColumn = input.targetKind === "size" ? "size_id" : "color_id";
      const deletedCells = await client.query<QuantityCellRow>(`
        DELETE FROM color_size_quantities
        WHERE company_id = $1 AND revision_id = $2::uuid AND ${quantityColumn} = ANY($3::uuid[])
        RETURNING quantity
      `, [input.scope.companyId, target.revision_id, input.deletionIds]);
      context.statementCount += 1;
      deletedQuantityCellCount = deletedCells.rows.length;
      removedQuantity = deletedCells.rows.reduce((sum, row) => sum + integer(row.quantity), 0);
      const table = input.targetKind === "size" ? "work_order_sizes" : "work_order_colors";
      const deleted = await client.query(`
        DELETE FROM ${table}
        WHERE company_id = $1 AND revision_id = $2::uuid AND id = ANY($3::uuid[])
        RETURNING id
      `, [input.scope.companyId, target.revision_id, input.deletionIds]);
      context.statementCount += 1;
      if (deleted.rows.length !== input.deletionIds.length) throw new SizeColorStructureRepositoryError("not_found");
    }

    if (input.additions.length > 0 && input.targetKind === "size") {
      const survivors = (rows as readonly SizeRow[]).filter((row) => !deletionSet.has(row.id));
      const codes = new Set(survivors.map((row) => row.size_code));
      const sizeCodes = input.additions.map((item) => {
        const code = derivedCode("SIZE", item.displayName, codes);
        codes.add(code);
        return code;
      });
      await client.query(`
        INSERT INTO work_order_sizes (id, company_id, revision_id, size_code, display_label, display_order)
        SELECT addition.id, $1, $2::uuid, addition.size_code, addition.display_name, addition.ordinality - 1
        FROM unnest($3::uuid[], $4::text[], $5::text[]) WITH ORDINALITY
          AS addition(id, size_code, display_name, ordinality)
      `, [input.scope.companyId, target.revision_id, input.additions.map((item) => item.id), sizeCodes, input.additions.map((item) => item.displayName)]);
      context.statementCount += 1;
    } else if (input.additions.length > 0) {
      const survivors = (rows as readonly ColorRow[]).filter((row) => !deletionSet.has(row.id));
      const codes = new Set(survivors.map((row) => row.color_code).filter((value): value is string => value !== null));
      const colorCodes = input.additions.map((item) => {
        const code = derivedCode("COLOR", item.displayName, codes);
        codes.add(code);
        return code;
      });
      await client.query(`
        INSERT INTO work_order_colors (id, company_id, revision_id, color_code, display_name, hex_value, display_order)
        SELECT addition.id, $1, $2::uuid, addition.color_code, addition.display_name, addition.hex_value, addition.ordinality - 1
        FROM unnest($3::uuid[], $4::text[], $5::text[], $6::text[]) WITH ORDINALITY
          AS addition(id, color_code, display_name, hex_value, ordinality)
      `, [input.scope.companyId, target.revision_id, input.additions.map((item) => item.id), colorCodes, input.additions.map((item) => item.displayName), input.additions.map((item) => item.hexValue)]);
      context.statementCount += 1;
    }

    if (input.targetKind === "size") {
      const nextRows = [
        ...(rows as readonly SizeRow[]).filter((row) => !deletionSet.has(row.id)),
        ...input.additions.map((item) => ({ id: item.id, display_label: item.displayName })),
      ];
      await applyCanonicalSizeOrder({ client, context, scope: input.scope, revisionId: target.revision_id, rows: nextRows });
      await synchronizeFinishedSpecSizes({ client, context, scope: input.scope, revisionId: target.revision_id });
    } else {
      const nextRows = [
        ...(rows as readonly ColorRow[]).filter((row) => !deletionSet.has(row.id)),
        ...input.additions.map((item) => ({ id: item.id, display_name: item.displayName })),
      ];
      await applyCanonicalColorOrder({ client, context, scope: input.scope, revisionId: target.revision_id, rows: nextRows });
    }
    const canonicalTotalQuantity = await readCanonicalQuantityTotal(client, context, input.scope, target.revision_id);
    const changedFields = [
      ...(input.additions.length > 0 ? [`${input.targetKind}.create`] : []),
      ...(input.deletionIds.length > 0 ? [`${input.targetKind}.delete`, "quantityCells.delete"] : []),
      ...(input.deletionIds.length > 0 ? ["totalQuantity", "totalQuantitySnapshot"] : []),
    ];
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      commandCode: STRUCTURE_SELECTION_BATCH_COMMAND_CODE,
      targetKind: input.targetKind,
      targetId: null,
      changedFields,
      summary: input.targetKind === "size" ? "사이즈 선택 일괄 적용" : "색상 선택 일괄 적용",
      canonicalTotalQuantity,
      eventMetadata: {
        createdItems: input.additions,
        deletedTargetIds: input.deletionIds,
        deletedQuantityCellCount,
        removedQuantity,
      },
    });
    return {
      result: targetResult({
        target,
        targetKind: input.targetKind,
        targetId: null,
        createdItems: input.additions,
        deletedTargetIds: input.deletionIds,
        deletedQuantityCellCount,
        removedQuantity,
        totalQuantity: canonicalTotalQuantity,
        nextVersion,
      }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}

async function reorderStructuresV2(input: CommonInput & {
  readonly targetKind: "size" | "color";
  readonly commandCode: string;
  readonly orderedIds: readonly (SizeRowId | ColorId)[];
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({ client, context, ...input });
    if (existingReceipt) return replayResult({ target, receipt: existingReceipt, targetKind: input.targetKind, targetId: null });
    assertCurrentDraft(target, input.expectedVersion);
    const rows = input.targetKind === "size"
      ? await readSizes(client, context, input.scope, target.revision_id)
      : await readColors(client, context, input.scope, target.revision_id);
    const currentIds = rows.map((row) => row.id);
    assertExactSet(currentIds, input.orderedIds);
    if (currentIds.every((id, index) => id === input.orderedIds[index])) {
      const result = targetResult({ target, targetKind: input.targetKind, targetId: null });
      return { result, nextVersion: result.nextVersion, idempotentReplay: false, changedFields: [] as readonly string[] };
    }
    await reserveReceipt({ client, context, ...input });
    await updateOrders({
      client, context, scope: input.scope, revisionId: target.revision_id,
      table: input.targetKind === "size" ? "work_order_sizes" : "work_order_colors",
      orderedIds: input.orderedIds,
    });
    if (input.targetKind === "size") {
      await synchronizeFinishedSpecSizes({ client, context, scope: input.scope, revisionId: target.revision_id });
    }
    const changedFields = [`${input.targetKind}.displayOrder`];
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      targetId: null,
      changedFields,
      summary: input.targetKind === "size" ? "사이즈 순서 변경" : "색상 순서 변경",
    });
    return {
      result: targetResult({ target, targetKind: input.targetKind, targetId: null, nextVersion }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}

export async function upsertColorSizeQuantityV2(input: CommonInput & {
  readonly colorId: ColorId;
  readonly sizeRowId: SizeRowId;
  readonly quantity: number;
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({
      client, context, ...input, commandCode: COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE,
    });
    if (existingReceipt) {
      const nextVersion = integer(existingReceipt.result_entity_version as number | string);
      return {
        result: targetResult({
          target, targetKind: "quantity", targetId: null,
          colorId: input.colorId, sizeRowId: input.sizeRowId, quantity: input.quantity,
          totalQuantity: integer(target.work_order_total), nextVersion,
        }),
        nextVersion: nextVersion as EntityVersion,
        idempotentReplay: true,
        changedFields: [] as readonly string[],
      };
    }
    assertCurrentDraft(target, input.expectedVersion, true);
    const membership = await client.query(`
      SELECT s.id AS size_id, c.id AS color_id
      FROM work_order_sizes s
      JOIN work_order_colors c
        ON c.company_id = s.company_id AND c.revision_id = s.revision_id
      WHERE s.company_id = $1 AND s.revision_id = $2::uuid
        AND s.id = $3::uuid AND c.id = $4::uuid
      FOR UPDATE OF s, c
    `, [input.scope.companyId, target.revision_id, input.sizeRowId, input.colorId]);
    context.statementCount += 1;
    if (!membership.rows[0]) throw new SizeColorStructureRepositoryError("not_found");
    const existing = await client.query<QuantityCellRow>(`
      SELECT quantity
      FROM color_size_quantities
      WHERE company_id = $1 AND revision_id = $2::uuid
        AND color_id = $3::uuid AND size_id = $4::uuid
      FOR UPDATE
    `, [input.scope.companyId, target.revision_id, input.colorId, input.sizeRowId]);
    context.statementCount += 1;
    const currentQuantity = existing.rows[0] ? integer(existing.rows[0].quantity) : 0;
    const currentCanonicalTotal = await readCanonicalQuantityTotal(
      client,
      context,
      input.scope,
      target.revision_id,
    );
    const projectionPlan = planColorSizeQuantityProjection({
      currentQuantity,
      requestedQuantity: input.quantity,
      currentMatrixTotal: currentCanonicalTotal,
      workOrderTotal: integer(target.work_order_total),
      revisionTotal: integer(target.revision_total),
    });
    if (projectionPlan.semantic === "no-op") {
      const result = targetResult({
        target, targetKind: "quantity", targetId: null,
        colorId: input.colorId, sizeRowId: input.sizeRowId, quantity: input.quantity,
        totalQuantity: currentCanonicalTotal,
      });
      return {
        result,
        nextVersion: result.nextVersion,
        idempotentReplay: false,
        changedFields: [] as readonly string[],
      };
    }
    await reserveReceipt({
      client, context, ...input, commandCode: COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE,
    });
    if (projectionPlan.quantityChanged) {
      await client.query(`
        INSERT INTO color_size_quantities (
          company_id, revision_id, color_id, size_id, quantity, updated_at
        ) VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5, now())
        ON CONFLICT (revision_id, color_id, size_id)
        DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()
        WHERE color_size_quantities.company_id = $1
      `, [input.scope.companyId, target.revision_id, input.colorId, input.sizeRowId, input.quantity]);
      context.statementCount += 1;
    }
    const canonicalTotalQuantity = projectionPlan.quantityChanged
      ? await readCanonicalQuantityTotal(client, context, input.scope, target.revision_id)
      : projectionPlan.canonicalTotalQuantity;
    const changedFields = projectionPlan.semantic === "reconcile"
      ? ["totalQuantityProjection"] as const
      : ["quantity", "totalQuantity", "totalQuantitySnapshot"] as const;
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      commandCode: COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE,
      targetKind: "quantity", targetId: null,
      changedFields,
      canonicalTotalQuantity,
      summary: projectionPlan.semantic === "reconcile"
        ? "색상×사이즈 총수량 projection 정합성 복구"
        : "색상×사이즈 수량 저장",
    });
    return {
      result: targetResult({
        target, targetKind: "quantity", targetId: null,
        colorId: input.colorId, sizeRowId: input.sizeRowId, quantity: input.quantity,
        totalQuantity: canonicalTotalQuantity, nextVersion,
      }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}

export async function upsertColorSizeQuantitiesV2(input: CommonInput & {
  readonly cells: readonly { readonly colorId: ColorId; readonly sizeRowId: SizeRowId; readonly quantity: number }[];
}) {
  const startedAt = performance.now();
  const context: Context = { statementCount: 0 };
  const data = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockTarget({ client, context, ...input });
    const existingReceipt = await readReceipt({ client, context, ...input, commandCode: COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE });
    if (existingReceipt) {
      const nextVersion = integer(existingReceipt.result_entity_version as number | string);
      return {
        result: targetResult({ target, targetKind: "quantity", targetId: null, quantityCells: input.cells, totalQuantity: integer(target.work_order_total), nextVersion }),
        nextVersion: nextVersion as EntityVersion,
        idempotentReplay: true,
        changedFields: [] as readonly string[],
      };
    }
    assertCurrentDraft(target, input.expectedVersion, true);
    // PostgreSQL jsonb_to_recordset resolves object keys literally. Mobile batch
    // commands use camelCase, while the SQL record shape is intentionally
    // snake_case. Encode the destination identity explicitly so a Reorder never
    // falls through membership validation with NULL source-shaped keys.
    const encoded = encodeDestinationQuantityCells(input.cells);
    const membership = await client.query<DbQueryResultRow & { readonly matched: number | string; readonly changed: boolean }>(`
      WITH requested AS (
        SELECT color_id::uuid AS color_id, size_row_id::uuid AS size_id, quantity::integer AS quantity
        FROM jsonb_to_recordset($3::jsonb) AS cell(color_id text,size_row_id text,quantity integer)
      )
      SELECT count(*)::integer AS matched,
             COALESCE(bool_or(COALESCE(q.quantity,0)::integer IS DISTINCT FROM requested.quantity),false) AS changed
      FROM requested
      JOIN work_order_colors c ON c.company_id=$1 AND c.revision_id=$2::uuid AND c.id=requested.color_id
      JOIN work_order_sizes s ON s.company_id=$1 AND s.revision_id=$2::uuid AND s.id=requested.size_id
      LEFT JOIN color_size_quantities q ON q.company_id=$1 AND q.revision_id=$2::uuid AND q.color_id=requested.color_id AND q.size_id=requested.size_id
    `, [input.scope.companyId, target.revision_id, encoded]);
    context.statementCount += 1;
    if (integer(membership.rows[0]?.matched ?? 0) !== input.cells.length) throw new SizeColorStructureRepositoryError("not_found");
    const currentTotal = await readCanonicalQuantityTotal(client, context, input.scope, target.revision_id);
    const projectionChanged = currentTotal !== integer(target.work_order_total) || currentTotal !== integer(target.revision_total);
    if (!membership.rows[0]?.changed && !projectionChanged) {
      const result = targetResult({ target, targetKind: "quantity", targetId: null, quantityCells: input.cells, totalQuantity: currentTotal });
      return { result, nextVersion: result.nextVersion, idempotentReplay: false, changedFields: [] as readonly string[] };
    }
    await reserveReceipt({ client, context, ...input, commandCode: COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE });
    if (membership.rows[0]?.changed) {
      await client.query(`
        INSERT INTO color_size_quantities(company_id,revision_id,color_id,size_id,quantity,updated_at)
        SELECT $1,$2::uuid,cell.color_id::uuid,cell.size_row_id::uuid,cell.quantity::integer,now()
        FROM jsonb_to_recordset($3::jsonb) AS cell(color_id text,size_row_id text,quantity integer)
        ON CONFLICT(revision_id,color_id,size_id) DO UPDATE
        SET quantity=EXCLUDED.quantity,updated_at=now()
        WHERE color_size_quantities.company_id=$1 AND color_size_quantities.quantity IS DISTINCT FROM EXCLUDED.quantity
      `, [input.scope.companyId, target.revision_id, encoded]);
      context.statementCount += 1;
    }
    const canonicalTotalQuantity = membership.rows[0]?.changed
      ? await readCanonicalQuantityTotal(client, context, input.scope, target.revision_id)
      : currentTotal;
    const changedFields = membership.rows[0]?.changed
      ? ["quantityCells.batch", "totalQuantity", "totalQuantitySnapshot"] as const
      : ["totalQuantityProjection"] as const;
    const nextVersion = await finishChanged({
      client, context, ...input, target,
      commandCode: COLOR_SIZE_QUANTITY_UPSERT_COMMAND_CODE,
      targetKind: "quantity", targetId: null, changedFields, canonicalTotalQuantity,
      summary: membership.rows[0]?.changed ? "색상×사이즈 수량 일괄 저장" : "색상×사이즈 총수량 projection 정합성 복구",
    });
    return {
      result: targetResult({ target, targetKind: "quantity", targetId: null, quantityCells: input.cells, totalQuantity: canonicalTotalQuantity, nextVersion }),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });
  return wrapped({ ...data, context, startedAt });
}
