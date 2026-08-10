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
import { WORK_ORDER_COMMAND_CODES } from "@/lib/domain/work-orders/command/workOrderCommandCodes";
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
  readonly totalQuantity?: number;
  readonly deletedQuantityCellCount?: number;
  readonly removedQuantity?: number;
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
    ...(input.totalQuantity !== undefined ? { totalQuantity: input.totalQuantity } : {}),
    ...(input.deletedQuantityCellCount !== undefined ? { deletedQuantityCellCount: input.deletedQuantityCellCount } : {}),
    ...(input.removedQuantity !== undefined ? { removedQuantity: input.removedQuantity } : {}),
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
           r.total_quantity_snapshot AS revision_total
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

function assertCurrentDraft(target: TargetRow, expectedVersion: EntityVersion) {
  const currentVersion = integer(target.work_order_version);
  if (currentVersion !== expectedVersion) throw new SizeColorStructureRepositoryError("conflict", currentVersion);
  if (target.work_order_status !== "draft") throw new SizeColorStructureRepositoryError("locked", currentVersion);
  if (target.revision_status !== "draft") {
    throw new SizeColorStructureRepositoryError("revision_mismatch", currentVersion);
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
    updated_revision AS (
      UPDATE work_order_revisions
      SET entity_version = entity_version + 1,
          total_quantity_snapshot = CASE WHEN $5::boolean THEN $6::integer ELSE total_quantity_snapshot END,
          updated_at = now()
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
    assertCurrentDraft(target, input.expectedVersion);
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
