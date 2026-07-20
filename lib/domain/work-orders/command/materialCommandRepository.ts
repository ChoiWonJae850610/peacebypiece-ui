import "server-only";

import { performance } from "perf_hooks";

import type {
  AddMaterialLineCommand,
  CompanyMemberId,
  EntityVersion,
  MaterialLineCommandResult,
  MaterialLineId,
  MaterialLinePatch,
  MaterialLineStatus,
  MaterialType,
  TenantMemberScope,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";
import {
  withWaflV2TenantWriteTransaction,
  type DbQueryResultRow,
  type DbTransactionClient,
} from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";

export const MATERIAL_CREATE_COMMAND_CODE = "work_order.material.create";
export const MATERIAL_PATCH_COMMAND_CODE = "work_order.material.patch";
export const MATERIAL_ORDER_REQUEST_COMMAND_CODE = "work_order.material.order_request";
export const MATERIAL_ORDER_CANCEL_COMMAND_CODE = "work_order.material.order_cancel";
export const MATERIAL_ORDER_COMPLETE_COMMAND_CODE = "work_order.material.order_complete";
export const MATERIAL_ARCHIVE_COMMAND_CODE = "work_order.material.archive";
export const MATERIAL_RESTORE_COMMAND_CODE = "work_order.material.restore";

export type MaterialOrderTransitionKind = "request" | "cancel" | "complete";
export type MaterialLifecycleTransitionKind = "archive" | "restore";

type MaterialCommandFailureReason =
  | "not_found"
  | "conflict"
  | "locked"
  | "revision_mismatch"
  | "invalid_state_transition"
  | "order_not_ready"
  | "amount_out_of_range"
  | "idempotency_conflict"
  | "idempotency_incomplete";

export class MaterialCommandRepositoryError extends Error {
  readonly reason: MaterialCommandFailureReason;
  readonly entityVersion: number | null;

  constructor(reason: MaterialCommandFailureReason, entityVersion: number | null = null) {
    super(reason);
    this.name = "MaterialCommandRepositoryError";
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
};

type MaterialTargetRow = WorkOrderTargetRow & {
  readonly material_line_id: string;
  readonly material_type: string;
  readonly material_status: string;
  readonly line_version: number | string;
  readonly material_id: string | null;
  readonly name: string;
  readonly color_option: string | null;
  readonly usage_area: string | null;
  readonly supplier_partner_id: string | null;
  readonly required_quantity: string | number;
  readonly allowance_quantity: string | number;
  readonly inventory_usage_quantity: string | number;
  readonly order_quantity: string | number;
  readonly unit_code: string;
  readonly unit_price: string | number;
  readonly memo: string | null;
  readonly requested_at: string | Date | null;
  readonly archived_at: string | Date | null;
};

type ReceiptRow = DbQueryResultRow & {
  readonly request_sha256: string;
  readonly work_order_id: string | null;
  readonly result_revision_id: string | null;
  readonly result_entity_version: number | string | null;
};

export type MaterialCommandRepositoryResult = {
  readonly result: MaterialLineCommandResult;
  readonly nextVersion: EntityVersion;
  readonly idempotentReplay: boolean;
  readonly changedFields: readonly string[];
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

type RepositoryContext = {
  statementCount: number;
};

function toInteger(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("MATERIAL_COMMAND_INVALID_INTEGER");
  return parsed;
}

function toMaterialStatus(value: string): MaterialLineStatus {
  if (value !== "editing" && value !== "requested" && value !== "completed" && value !== "cancelled") {
    throw new Error("MATERIAL_COMMAND_INVALID_STATUS");
  }
  return value;
}

function toMaterialType(value: string): MaterialType {
  if (value !== "fabric" && value !== "accessory") throw new Error("MATERIAL_COMMAND_INVALID_TYPE");
  return value;
}

function mapMaterialResult(row: MaterialTargetRow, nextVersion?: number): MaterialLineCommandResult {
  const workOrderVersion = nextVersion ?? toInteger(row.work_order_version);
  return {
    workOrderId: row.work_order_id as WorkOrderId,
    revisionId: row.revision_id as MaterialLineCommandResult["revisionId"],
    materialLineId: row.material_line_id as MaterialLineId,
    materialType: toMaterialType(row.material_type),
    status: toMaterialStatus(row.material_status),
    nextVersion: workOrderVersion as EntityVersion,
    lineVersion: toInteger(row.line_version) as EntityVersion,
    lifecycle: row.archived_at === null ? "active" : "archived",
  };
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function sameDecimal(left: string | number, right: string | undefined): boolean {
  if (right === undefined) return true;
  return Number(left) === Number(right);
}

function assertAmountWithinDatabaseRange(orderQuantity: string | number, unitPrice: string | number) {
  const quantityScaled = BigInt(Math.round(Number(orderQuantity) * 1_000));
  const priceScaled = BigInt(Math.round(Number(unitPrice) * 100));
  const amountCents = (quantityScaled * priceScaled + BigInt(500)) / BigInt(1_000);
  if (amountCents > BigInt("99999999999999")) {
    throw new MaterialCommandRepositoryError("amount_out_of_range");
  }
}

function isForeignKeyReferenceError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  if (String(error.code) !== "23503") return false;
  const constraint = "constraint" in error ? String(error.constraint) : "";
  return constraint.includes("work_order_material_lines_supplier_company_fk")
    || constraint.includes("work_order_material_lines_material_company_fk");
}

async function reserveReceipt(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly commandCode: string;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}): Promise<ReceiptRow | null> {
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
  if (!receipt) throw new MaterialCommandRepositoryError("idempotency_incomplete");
  if (receipt.request_sha256 !== input.requestHash) {
    throw new MaterialCommandRepositoryError(
      "idempotency_conflict",
      receipt.result_entity_version === null ? null : Number(receipt.result_entity_version),
    );
  }
  if (!receipt.work_order_id || !receipt.result_revision_id || receipt.result_entity_version === null) {
    throw new MaterialCommandRepositoryError("idempotency_incomplete");
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

async function lockWorkOrderTarget(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
}): Promise<WorkOrderTargetRow> {
  const target = await input.client.query<WorkOrderTargetRow>(`
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
  const row = target.rows[0];
  if (!row) throw new MaterialCommandRepositoryError("not_found");
  return row;
}

async function lockMaterialTarget(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly materialLineId: MaterialLineId;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
}): Promise<MaterialTargetRow> {
  const target = await input.client.query<MaterialTargetRow>(`
    SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
           w.status AS work_order_status, r.revision_status,
           w.entity_version AS work_order_version,
           m.id AS material_line_id, m.material_type, m.status AS material_status,
           m.entity_version AS line_version, m.material_id, m.name, m.color_option, m.usage_area,
           m.supplier_partner_id, m.required_quantity, m.allowance_quantity,
           m.inventory_usage_quantity, m.order_quantity, m.unit_code,
           m.unit_price, m.memo, m.requested_at, m.archived_at
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.company_id = w.company_id AND r.id = w.current_revision_id
    JOIN work_order_material_lines m
      ON m.company_id = w.company_id AND m.revision_id = r.id
    WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
      AND m.id = $3::uuid
      AND ($4::text IS NULL OR w.assignee_member_id = $4)
    FOR UPDATE OF w, r, m
  `, [input.scope.companyId, input.workOrderId, input.materialLineId, input.assignedCompanyMemberId]);
  input.context.statementCount += 1;
  const row = target.rows[0];
  if (!row) throw new MaterialCommandRepositoryError("not_found");
  return row;
}

function assertCurrentDraft(target: WorkOrderTargetRow, expectedVersion: EntityVersion) {
  const currentVersion = toInteger(target.work_order_version);
  if (currentVersion !== expectedVersion) throw new MaterialCommandRepositoryError("conflict", currentVersion);
  if (target.work_order_status !== "draft") throw new MaterialCommandRepositoryError("locked", currentVersion);
  if (target.revision_status !== "draft") throw new MaterialCommandRepositoryError("revision_mismatch", currentVersion);
}

async function advanceParentVersions(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly target: WorkOrderTargetRow;
  readonly expectedVersion: EntityVersion;
  readonly recalculateMaterialTotals: boolean;
}): Promise<number> {
  const result = await input.client.query<DbQueryResultRow & { readonly entity_version: number | string }>(`
    WITH material_totals AS (
      SELECT COALESCE(sum(amount) FILTER (WHERE material_type = 'fabric'), 0)::numeric(14,2) AS fabric_total,
             COALESCE(sum(amount) FILTER (WHERE material_type = 'accessory'), 0)::numeric(14,2) AS accessory_total
      FROM work_order_material_lines
      WHERE company_id = $1 AND revision_id = $4::uuid AND archived_at IS NULL
    ),
    updated_work_order AS (
      UPDATE work_orders
      SET entity_version = entity_version + 1, updated_at = now()
      WHERE company_id = $1 AND id = $2::uuid AND entity_version = $3
        AND current_revision_id = $4::uuid AND status = 'draft'
      RETURNING entity_version
    ),
    updated_revision AS (
      UPDATE work_order_revisions r
      SET entity_version = entity_version + 1,
          fabric_total = CASE WHEN $5 THEN t.fabric_total ELSE r.fabric_total END,
          accessory_total = CASE WHEN $5 THEN t.accessory_total ELSE r.accessory_total END,
          estimated_total = CASE WHEN $5 THEN t.fabric_total + t.accessory_total + r.process_total ELSE r.estimated_total END,
          updated_at = now()
      FROM material_totals t
      WHERE r.company_id = $1 AND r.id = $4::uuid AND r.revision_status = 'draft'
      RETURNING r.entity_version
    )
    SELECT entity_version FROM updated_work_order
    WHERE EXISTS (SELECT 1 FROM updated_revision)
  `, [
    input.scope.companyId,
    input.target.work_order_id,
    input.expectedVersion,
    input.target.revision_id,
    input.recalculateMaterialTotals,
  ]);
  input.context.statementCount += 1;
  const nextVersion = result.rows[0]?.entity_version;
  if (nextVersion === undefined) throw new MaterialCommandRepositoryError("conflict", Number(input.target.work_order_version));
  return toInteger(nextVersion);
}

async function appendMaterialEvent(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly target: WorkOrderTargetRow;
  readonly materialLineId: string;
  readonly materialType: MaterialType;
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
      materialLineId: input.materialLineId,
      materialType: input.materialType,
      revisionId: input.target.revision_id,
      revisionNumber: toInteger(input.target.revision_no),
      ...input.metadata,
    }),
  ]);
  input.context.statementCount += 1;
}

async function readReplayMaterial(input: {
  readonly client: DbTransactionClient;
  readonly context: RepositoryContext;
  readonly scope: TenantMemberScope;
  readonly receipt: ReceiptRow;
  readonly materialLineId: MaterialLineId;
}): Promise<MaterialTargetRow> {
  const replay = await input.client.query<MaterialTargetRow>(`
    SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
           w.status AS work_order_status, r.revision_status,
           $5::integer AS work_order_version,
           m.id AS material_line_id, m.material_type, m.status AS material_status,
           m.entity_version AS line_version, m.material_id, m.name, m.color_option, m.usage_area,
           m.supplier_partner_id, m.required_quantity, m.allowance_quantity,
           m.inventory_usage_quantity, m.order_quantity, m.unit_code,
           m.unit_price, m.memo, m.requested_at, m.archived_at
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.company_id = w.company_id AND r.id = $3::uuid AND r.work_order_id = w.id
    JOIN work_order_material_lines m
      ON m.company_id = w.company_id AND m.revision_id = r.id AND m.id = $4::uuid
    WHERE w.company_id = $1 AND w.id = $2::uuid
  `, [
    input.scope.companyId,
    input.receipt.work_order_id,
    input.receipt.result_revision_id,
    input.materialLineId,
    input.receipt.result_entity_version,
  ]);
  input.context.statementCount += 1;
  const row = replay.rows[0];
  if (!row) throw new MaterialCommandRepositoryError("idempotency_incomplete");
  return row;
}

function wrapResult(input: {
  readonly result: MaterialLineCommandResult;
  readonly context: RepositoryContext;
  readonly startedAt: number;
  readonly idempotentReplay: boolean;
  readonly changedFields: readonly string[];
}): MaterialCommandRepositoryResult {
  return {
    result: input.result,
    nextVersion: input.result.nextVersion,
    idempotentReplay: input.idempotentReplay,
    changedFields: input.changedFields,
    statementCount: input.context.statementCount,
    transactionCount: 1,
    dbMs: Number((performance.now() - input.startedAt).toFixed(2)),
  };
}

export async function addMaterialLineV2(input: {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly command: AddMaterialLineCommand;
  readonly materialLineId: MaterialLineId;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}): Promise<MaterialCommandRepositoryResult> {
  const startedAt = performance.now();
  const context: RepositoryContext = { statementCount: 0 };
  try {
    const result = await withWaflV2TenantWriteTransaction(async (client) => {
      await installTenantClaims(client, input.scope);
      context.statementCount += 1;
      const receipt = await reserveReceipt({
        client, context, scope: input.scope, commandCode: MATERIAL_CREATE_COMMAND_CODE,
        scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash, requestHash: input.requestHash,
      });
      if (receipt) {
        const replay = await readReplayMaterial({ client, context, scope: input.scope, receipt, materialLineId: input.materialLineId });
        return { row: replay, idempotentReplay: true, changedFields: [] as const };
      }

      const target = await lockWorkOrderTarget({
        client, context, scope: input.scope, workOrderId: input.command.workOrderId,
        assignedCompanyMemberId: input.assignedCompanyMemberId,
      });
      assertCurrentDraft(target, input.command.expectedVersion);

      const inserted = await client.query<MaterialTargetRow>(`
        INSERT INTO work_order_material_lines (
          id, company_id, revision_id, material_id, material_type, name, color_option, usage_area,
          supplier_partner_id, required_quantity, allowance_quantity,
          inventory_usage_quantity, order_quantity, unit_code, unit_price, amount,
          status, memo, display_order, entity_version
        ) VALUES (
          $2::uuid, $1, $3::uuid, $4, $5, $6, $7, $8, $9,
          $10::numeric, $11::numeric, $12::numeric, $13::numeric,
          $14, $15::numeric, round($13::numeric * $15::numeric, 2),
          'editing', $16,
          COALESCE($17::integer, (
            SELECT COALESCE(max(display_order), -1) + 1
            FROM work_order_material_lines
            WHERE company_id = $1 AND revision_id = $3::uuid AND material_type = $5
          )), 1
        )
        RETURNING $18::uuid AS work_order_id, revision_id, $19::integer AS revision_no,
                  'draft'::text AS work_order_status, 'draft'::text AS revision_status,
                  $20::integer AS work_order_version,
                  id AS material_line_id, material_type, status AS material_status,
                  entity_version AS line_version, material_id, name, color_option, usage_area,
                  supplier_partner_id, required_quantity, allowance_quantity,
                  inventory_usage_quantity, order_quantity, unit_code, unit_price, memo, requested_at, archived_at
      `, [
        input.scope.companyId, input.materialLineId, target.revision_id,
        input.command.materialId ?? null, input.command.materialType, input.command.name,
        input.command.colorOption ?? null, input.command.usageArea ?? null, input.command.partnerId ?? null,
        input.command.requiredQuantity, input.command.allowanceQuantity,
        input.command.inventoryUsageQuantity, input.command.orderQuantity,
        input.command.unitCode, input.command.unitPrice, input.command.memo ?? null,
        input.command.displayOrder ?? null, target.work_order_id, target.revision_no,
        target.work_order_version,
      ]);
      context.statementCount += 1;
      const row = inserted.rows[0];
      if (!row) throw new Error("MATERIAL_CREATE_INSERT_FAILED");

      const nextVersion = await advanceParentVersions({
        client, context, scope: input.scope, target,
        expectedVersion: input.command.expectedVersion, recalculateMaterialTotals: true,
      });
      const materialType = toMaterialType(row.material_type);
      await appendMaterialEvent({
        client, context, scope: input.scope, target, materialLineId: row.material_line_id,
        materialType, commandCode: MATERIAL_CREATE_COMMAND_CODE,
        summary: materialType === "fabric" ? "원단 line 생성" : "부자재 line 생성",
        metadata: {
          clientRequestId: input.command.clientRequestId,
          changedFields: ["materialType", "materialId", "name", "partnerId", "colorOption", "usageArea", "requiredQuantity", "allowanceQuantity", "inventoryUsageQuantity", "orderQuantity", "unitCode", "unitPrice", "memo", "displayOrder"],
          statusTransition: { from: null, to: "editing" },
          versionTransition: { from: Number(target.work_order_version), to: nextVersion },
          lineVersionTransition: { from: null, to: 1 },
        },
      });
      await completeReceipt({
        client, context, scope: input.scope, commandCode: MATERIAL_CREATE_COMMAND_CODE,
        scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
        workOrderId: target.work_order_id, revisionId: target.revision_id, nextVersion,
      });
      return { row: { ...row, work_order_version: nextVersion }, idempotentReplay: false, changedFields: ["materialLine"] };
    });

    return wrapResult({
      result: mapMaterialResult(result.row), context, startedAt,
      idempotentReplay: result.idempotentReplay, changedFields: result.changedFields,
    });
  } catch (error) {
    if (isForeignKeyReferenceError(error)) throw new MaterialCommandRepositoryError("not_found");
    throw error;
  }
}

export async function patchMaterialLineV2(input: {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly workOrderId: WorkOrderId;
  readonly materialLineId: MaterialLineId;
  readonly expectedVersion: EntityVersion;
  readonly clientRequestId: string;
  readonly patch: MaterialLinePatch;
}): Promise<MaterialCommandRepositoryResult> {
  const startedAt = performance.now();
  const context: RepositoryContext = { statementCount: 0 };
  try {
    const result = await withWaflV2TenantWriteTransaction(async (client) => {
      await installTenantClaims(client, input.scope);
      context.statementCount += 1;
      const target = await lockMaterialTarget({
        client, context, scope: input.scope, workOrderId: input.workOrderId,
        materialLineId: input.materialLineId, assignedCompanyMemberId: input.assignedCompanyMemberId,
      });
      assertCurrentDraft(target, input.expectedVersion);
      if (target.material_status !== "editing" || target.archived_at !== null) {
        throw new MaterialCommandRepositoryError("locked", Number(target.work_order_version));
      }

      const patch = input.patch;
      assertAmountWithinDatabaseRange(
        patch.orderQuantity ?? target.order_quantity,
        patch.unitPrice ?? target.unit_price,
      );
      const changedFields = [
        hasOwn(patch, "name") && patch.name !== target.name ? "name" : null,
        hasOwn(patch, "materialId") && (patch.materialId ?? null) !== target.material_id ? "materialId" : null,
        hasOwn(patch, "partnerId") && (patch.partnerId ?? null) !== target.supplier_partner_id ? "partnerId" : null,
        hasOwn(patch, "colorOption") && (patch.colorOption ?? null) !== target.color_option ? "colorOption" : null,
        hasOwn(patch, "usageArea") && (patch.usageArea ?? null) !== target.usage_area ? "usageArea" : null,
        hasOwn(patch, "requiredQuantity") && !sameDecimal(target.required_quantity, patch.requiredQuantity) ? "requiredQuantity" : null,
        hasOwn(patch, "allowanceQuantity") && !sameDecimal(target.allowance_quantity, patch.allowanceQuantity) ? "allowanceQuantity" : null,
        hasOwn(patch, "inventoryUsageQuantity") && !sameDecimal(target.inventory_usage_quantity, patch.inventoryUsageQuantity) ? "inventoryUsageQuantity" : null,
        hasOwn(patch, "orderQuantity") && !sameDecimal(target.order_quantity, patch.orderQuantity) ? "orderQuantity" : null,
        hasOwn(patch, "unitCode") && patch.unitCode !== target.unit_code ? "unitCode" : null,
        hasOwn(patch, "unitPrice") && !sameDecimal(target.unit_price, patch.unitPrice) ? "unitPrice" : null,
        hasOwn(patch, "memo") && (patch.memo ?? null) !== target.memo ? "memo" : null,
      ].filter((field): field is string => field !== null);

      if (changedFields.length === 0) {
        return { row: target, changedFields };
      }

      const updated = await client.query<MaterialTargetRow>(`
        UPDATE work_order_material_lines
        SET name = CASE WHEN $4 THEN $5 ELSE name END,
            material_id = CASE WHEN $6 THEN $7 ELSE material_id END,
            supplier_partner_id = CASE WHEN $8 THEN $9 ELSE supplier_partner_id END,
            color_option = CASE WHEN $10 THEN $11 ELSE color_option END,
            usage_area = CASE WHEN $12 THEN $13 ELSE usage_area END,
            required_quantity = CASE WHEN $14 THEN $15::numeric ELSE required_quantity END,
            allowance_quantity = CASE WHEN $16 THEN $17::numeric ELSE allowance_quantity END,
            inventory_usage_quantity = CASE WHEN $18 THEN $19::numeric ELSE inventory_usage_quantity END,
            order_quantity = CASE WHEN $20 THEN $21::numeric ELSE order_quantity END,
            unit_code = CASE WHEN $22 THEN $23 ELSE unit_code END,
            unit_price = CASE WHEN $24 THEN $25::numeric ELSE unit_price END,
            amount = round(
              (CASE WHEN $20 THEN $21::numeric ELSE order_quantity END)
              * (CASE WHEN $24 THEN $25::numeric ELSE unit_price END), 2
            ),
            memo = CASE WHEN $26 THEN $27 ELSE memo END,
            entity_version = entity_version + 1,
            updated_at = now()
        WHERE company_id = $1 AND id = $2::uuid AND revision_id = $3::uuid
          AND status = 'editing' AND entity_version = $28
        RETURNING $29::uuid AS work_order_id, revision_id, $30::integer AS revision_no,
                  'draft'::text AS work_order_status, 'draft'::text AS revision_status,
                  $31::integer AS work_order_version,
                  id AS material_line_id, material_type, status AS material_status,
                  entity_version AS line_version, material_id, name, color_option, usage_area,
                  supplier_partner_id, required_quantity, allowance_quantity,
                  inventory_usage_quantity, order_quantity, unit_code, unit_price, memo, requested_at, archived_at
      `, [
        input.scope.companyId, input.materialLineId, target.revision_id,
        hasOwn(patch, "name"), patch.name ?? null,
        hasOwn(patch, "materialId"), patch.materialId ?? null,
        hasOwn(patch, "partnerId"), patch.partnerId ?? null,
        hasOwn(patch, "colorOption"), patch.colorOption ?? null,
        hasOwn(patch, "usageArea"), patch.usageArea ?? null,
        hasOwn(patch, "requiredQuantity"), patch.requiredQuantity ?? null,
        hasOwn(patch, "allowanceQuantity"), patch.allowanceQuantity ?? null,
        hasOwn(patch, "inventoryUsageQuantity"), patch.inventoryUsageQuantity ?? null,
        hasOwn(patch, "orderQuantity"), patch.orderQuantity ?? null,
        hasOwn(patch, "unitCode"), patch.unitCode ?? null,
        hasOwn(patch, "unitPrice"), patch.unitPrice ?? null,
        hasOwn(patch, "memo"), patch.memo ?? null,
        target.line_version, target.work_order_id, target.revision_no, target.work_order_version,
      ]);
      context.statementCount += 1;
      const row = updated.rows[0];
      if (!row) throw new MaterialCommandRepositoryError("conflict", Number(target.work_order_version));
      const nextVersion = await advanceParentVersions({
        client, context, scope: input.scope, target,
        expectedVersion: input.expectedVersion, recalculateMaterialTotals: true,
      });
      const materialType = toMaterialType(row.material_type);
      await appendMaterialEvent({
        client, context, scope: input.scope, target, materialLineId: row.material_line_id,
        materialType, commandCode: MATERIAL_PATCH_COMMAND_CODE,
        summary: materialType === "fabric" ? "원단 line 수정" : "부자재 line 수정",
        metadata: {
          clientRequestId: input.clientRequestId,
          changedFields,
          statusTransition: { from: "editing", to: "editing" },
          versionTransition: { from: Number(target.work_order_version), to: nextVersion },
          lineVersionTransition: { from: Number(target.line_version), to: Number(row.line_version) },
        },
      });
      return { row: { ...row, work_order_version: nextVersion }, changedFields };
    });
    return wrapResult({
      result: mapMaterialResult(result.row), context, startedAt,
      idempotentReplay: false, changedFields: result.changedFields,
    });
  } catch (error) {
    if (isForeignKeyReferenceError(error)) throw new MaterialCommandRepositoryError("not_found");
    throw error;
  }
}

const TRANSITION_CONFIG = {
  request: {
    commandCode: MATERIAL_ORDER_REQUEST_COMMAND_CODE,
    from: "editing",
    to: "requested",
    summary: "자재 발주 요청",
  },
  cancel: {
    commandCode: MATERIAL_ORDER_CANCEL_COMMAND_CODE,
    from: "requested",
    to: "cancelled",
    summary: "자재 발주 요청 취소",
  },
  complete: {
    commandCode: MATERIAL_ORDER_COMPLETE_COMMAND_CODE,
    from: "requested",
    to: "completed",
    summary: "자재 발주 완료",
  },
} as const;

export async function transitionMaterialOrderV2(input: {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly workOrderId: WorkOrderId;
  readonly materialLineId: MaterialLineId;
  readonly expectedVersion: EntityVersion;
  readonly clientRequestId: string;
  readonly reason?: string;
  readonly kind: MaterialOrderTransitionKind;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}): Promise<MaterialCommandRepositoryResult> {
  const startedAt = performance.now();
  const context: RepositoryContext = { statementCount: 0 };
  const config = TRANSITION_CONFIG[input.kind];
  const result = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const receipt = await reserveReceipt({
      client, context, scope: input.scope, commandCode: config.commandCode,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash, requestHash: input.requestHash,
    });
    if (receipt) {
      const replay = await readReplayMaterial({ client, context, scope: input.scope, receipt, materialLineId: input.materialLineId });
      return { row: replay, idempotentReplay: true };
    }

    const target = await lockMaterialTarget({
      client, context, scope: input.scope, workOrderId: input.workOrderId,
      materialLineId: input.materialLineId, assignedCompanyMemberId: input.assignedCompanyMemberId,
    });
    assertCurrentDraft(target, input.expectedVersion);
    if (target.archived_at !== null || target.material_status !== config.from) {
      throw new MaterialCommandRepositoryError("invalid_state_transition", Number(target.work_order_version));
    }
    if ((input.kind === "request" || input.kind === "complete")
      && (!target.supplier_partner_id || Number(target.order_quantity) <= 0)) {
      throw new MaterialCommandRepositoryError("order_not_ready", Number(target.work_order_version));
    }
    if (input.kind === "complete" && !target.requested_at) {
      throw new MaterialCommandRepositoryError("order_not_ready", Number(target.work_order_version));
    }

    const updated = await client.query<MaterialTargetRow>(`
      UPDATE work_order_material_lines
      SET status = $4,
          requested_at = CASE WHEN $4 = 'requested' THEN now() ELSE requested_at END,
          cancelled_at = CASE WHEN $4 = 'cancelled' THEN now() ELSE cancelled_at END,
          completed_at = CASE WHEN $4 = 'completed' THEN now() ELSE completed_at END,
          entity_version = entity_version + 1,
          updated_at = now()
      WHERE company_id = $1 AND id = $2::uuid AND revision_id = $3::uuid
        AND status = $5 AND entity_version = $6
      RETURNING $7::uuid AS work_order_id, revision_id, $8::integer AS revision_no,
                'draft'::text AS work_order_status, 'draft'::text AS revision_status,
                $9::integer AS work_order_version,
                id AS material_line_id, material_type, status AS material_status,
                entity_version AS line_version, material_id, name, color_option, usage_area,
                supplier_partner_id, required_quantity, allowance_quantity,
                inventory_usage_quantity, order_quantity, unit_code, unit_price, memo, requested_at, archived_at
    `, [
      input.scope.companyId, input.materialLineId, target.revision_id,
      config.to, config.from, target.line_version,
      target.work_order_id, target.revision_no, target.work_order_version,
    ]);
    context.statementCount += 1;
    const row = updated.rows[0];
    if (!row) throw new MaterialCommandRepositoryError("conflict", Number(target.work_order_version));
    const nextVersion = await advanceParentVersions({
      client, context, scope: input.scope, target,
      expectedVersion: input.expectedVersion, recalculateMaterialTotals: false,
    });
    const materialType = toMaterialType(row.material_type);
    await appendMaterialEvent({
      client, context, scope: input.scope, target, materialLineId: row.material_line_id,
      materialType, commandCode: config.commandCode, summary: config.summary,
      metadata: {
        clientRequestId: input.clientRequestId,
        changedFields: ["status"],
        statusTransition: { from: config.from, to: config.to },
        versionTransition: { from: Number(target.work_order_version), to: nextVersion },
        lineVersionTransition: { from: Number(target.line_version), to: Number(row.line_version) },
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
    await completeReceipt({
      client, context, scope: input.scope, commandCode: config.commandCode,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      workOrderId: target.work_order_id, revisionId: target.revision_id, nextVersion,
    });
    return { row: { ...row, work_order_version: nextVersion }, idempotentReplay: false };
  });

  return wrapResult({
    result: mapMaterialResult(result.row), context, startedAt,
    idempotentReplay: result.idempotentReplay,
    changedFields: result.idempotentReplay ? [] : ["status"],
  });
}

export async function transitionMaterialLifecycleV2(input: {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly workOrderId: WorkOrderId;
  readonly materialLineId: MaterialLineId;
  readonly expectedVersion: EntityVersion;
  readonly clientRequestId: string;
  readonly kind: MaterialLifecycleTransitionKind;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}): Promise<MaterialCommandRepositoryResult> {
  const startedAt = performance.now();
  const context: RepositoryContext = { statementCount: 0 };
  const commandCode = input.kind === "archive" ? MATERIAL_ARCHIVE_COMMAND_CODE : MATERIAL_RESTORE_COMMAND_CODE;
  const result = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    context.statementCount += 1;
    const target = await lockMaterialTarget({
      client, context, scope: input.scope, workOrderId: input.workOrderId,
      materialLineId: input.materialLineId, assignedCompanyMemberId: input.assignedCompanyMemberId,
    });
    assertCurrentDraft(target, input.expectedVersion);
    if (target.material_status !== "editing") {
      throw new MaterialCommandRepositoryError("invalid_state_transition", Number(target.work_order_version));
    }
    const currentlyArchived = target.archived_at !== null;
    if ((input.kind === "archive" && currentlyArchived) || (input.kind === "restore" && !currentlyArchived)) {
      throw new MaterialCommandRepositoryError("conflict", Number(target.work_order_version));
    }

    const receipt = await reserveReceipt({
      client, context, scope: input.scope, commandCode,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash, requestHash: input.requestHash,
    });
    if (receipt) {
      throw new MaterialCommandRepositoryError("conflict", Number(target.work_order_version));
    }

    const updated = await client.query<MaterialTargetRow>(`
      UPDATE work_order_material_lines
      SET archived_at = CASE WHEN $4 = 'archive' THEN now() ELSE NULL END,
          archived_by_member_id = CASE WHEN $4 = 'archive' THEN $5 ELSE NULL END,
          entity_version = entity_version + 1,
          updated_at = now()
      WHERE company_id = $1 AND id = $2::uuid AND revision_id = $3::uuid
        AND status = 'editing' AND entity_version = $6
        AND (($4 = 'archive' AND archived_at IS NULL) OR ($4 = 'restore' AND archived_at IS NOT NULL))
      RETURNING $7::uuid AS work_order_id, revision_id, $8::integer AS revision_no,
                'draft'::text AS work_order_status, 'draft'::text AS revision_status,
                $9::integer AS work_order_version,
                id AS material_line_id, material_type, status AS material_status,
                entity_version AS line_version, material_id, name, color_option, usage_area,
                supplier_partner_id, required_quantity, allowance_quantity,
                inventory_usage_quantity, order_quantity, unit_code, unit_price, memo, requested_at, archived_at
    `, [
      input.scope.companyId, input.materialLineId, target.revision_id, input.kind,
      input.scope.companyMemberId, target.line_version,
      target.work_order_id, target.revision_no, target.work_order_version,
    ]);
    context.statementCount += 1;
    const row = updated.rows[0];
    if (!row) throw new MaterialCommandRepositoryError("conflict", Number(target.work_order_version));
    const nextVersion = await advanceParentVersions({
      client, context, scope: input.scope, target,
      expectedVersion: input.expectedVersion, recalculateMaterialTotals: true,
    });
    const materialType = toMaterialType(row.material_type);
    await appendMaterialEvent({
      client, context, scope: input.scope, target, materialLineId: row.material_line_id,
      materialType, commandCode,
      summary: `${materialType === "fabric" ? "원단" : "부자재"} line ${input.kind === "archive" ? "보관" : "복구"}`,
      metadata: {
        clientRequestId: input.clientRequestId,
        changedFields: ["lifecycle"],
        lifecycleTransition: { from: currentlyArchived ? "archived" : "active", to: input.kind === "archive" ? "archived" : "active" },
        versionTransition: { from: Number(target.work_order_version), to: nextVersion },
        lineVersionTransition: { from: Number(target.line_version), to: Number(row.line_version) },
      },
    });
    await completeReceipt({
      client, context, scope: input.scope, commandCode,
      scopedIdempotencyKeyHash: input.scopedIdempotencyKeyHash,
      workOrderId: target.work_order_id, revisionId: target.revision_id, nextVersion,
    });
    return { row: { ...row, work_order_version: nextVersion } };
  });

  return wrapResult({
    result: mapMaterialResult(result.row), context, startedAt,
    idempotentReplay: false, changedFields: ["lifecycle"],
  });
}
