import "server-only";

import { performance } from "perf_hooks";

import type {
  CompanyMemberId,
  CreateWorkOrderDraftCommand,
  EntityVersion,
  IsoDate,
  PatchWorkOrderBasicInfoCommand,
  RevisionNumber,
  TenantMemberScope,
  WorkOrderDraftCommandResult,
  WorkOrderId,
  WorkOrderRevisionId,
} from "@/lib/domain/work-orders/contracts";
import { serializePostgresDateOnly } from "@/lib/domain/work-orders/dateOnly.mjs";
import {
  withWaflV2TenantWriteTransaction,
  type DbQueryResultRow,
  type DbTransactionClient,
} from "@/lib/db/client";

export const WORK_ORDER_CREATE_COMMAND_CODE = "work_order.create_draft";
export const WORK_ORDER_PATCH_BASIC_COMMAND_CODE = "work_order.patch_basic_info";

type CommandRepositoryFailureReason =
  | "not_found"
  | "conflict"
  | "locked"
  | "revision_mismatch"
  | "idempotency_conflict"
  | "idempotency_incomplete";

export class WorkOrderCommandRepositoryError extends Error {
  readonly reason: CommandRepositoryFailureReason;
  readonly entityVersion: number | null;

  constructor(reason: CommandRepositoryFailureReason, entityVersion: number | null = null) {
    super(reason);
    this.name = "WorkOrderCommandRepositoryError";
    this.reason = reason;
    this.entityVersion = entityVersion;
  }
}

type WorkOrderCommandRow = DbQueryResultRow & {
  readonly work_order_id: string;
  readonly revision_id: string;
  readonly revision_no: number | string;
  readonly work_order_status: string;
  readonly revision_status: string;
  readonly entity_version: number | string;
  readonly product_name: string;
  readonly product_type_code: string | null;
  readonly season_code: string | null;
  readonly item_code: string | null;
  readonly due_date: string | null;
  readonly total_quantity: number | string;
  readonly memo: string | null;
  readonly factory_delivery_memo: string | null;
};

type CommandReceiptRow = DbQueryResultRow & {
  readonly request_sha256: string;
  readonly work_order_id: string | null;
  readonly result_revision_id: string | null;
  readonly result_entity_version: number | string | null;
};

type PatchTargetRow = WorkOrderCommandRow & {
  readonly work_order_status: string;
  readonly revision_status: string;
};

export type WorkOrderCommandRepositoryResult = {
  readonly result: WorkOrderDraftCommandResult;
  readonly nextVersion: EntityVersion;
  readonly idempotentReplay: boolean;
  readonly changedFields: readonly string[];
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

function toInteger(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("WORK_ORDER_COMMAND_INVALID_INTEGER");
  return parsed;
}

function mapCommandRow(row: WorkOrderCommandRow): WorkOrderDraftCommandResult {
  if (row.work_order_status !== "draft" || row.revision_status !== "draft") {
    throw new Error("WORK_ORDER_COMMAND_RESULT_NOT_DRAFT");
  }
  return {
    workOrderId: row.work_order_id as WorkOrderId,
    revisionId: row.revision_id as WorkOrderRevisionId,
    revisionNumber: toInteger(row.revision_no) as RevisionNumber,
    status: "draft",
    revisionStatus: "draft",
    displayDocumentNumber: null,
    productName: row.product_name,
    productTypeCode: row.product_type_code,
    seasonCode: row.season_code,
    itemCode: row.item_code,
    dueDate: serializePostgresDateOnly(row.due_date, "WORK_ORDER_COMMAND_INVALID_DUE_DATE"),
    totalQuantity: toInteger(row.total_quantity),
    memo: row.memo,
    factoryDeliveryMemo: row.factory_delivery_memo,
  };
}

export async function installTenantClaims(
  client: DbTransactionClient,
  scope: TenantMemberScope,
) {
  await client.query(
    `SELECT set_config('wafl.company_id', $1, true),
            set_config('wafl.company_member_id', $2, true),
            set_config('wafl.access_mode', 'tenant_member', true),
            set_config('wafl.correlation_id', $3, true)`,
    [scope.companyId, scope.companyMemberId, scope.correlationId],
  );
}

export async function createWorkOrderDraftV2(input: {
  readonly scope: TenantMemberScope;
  readonly command: CreateWorkOrderDraftCommand;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}): Promise<WorkOrderCommandRepositoryResult> {
  const startedAt = performance.now();
  let statementCount = 0;
  const result = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    statementCount += 1;

    const receiptInsert = await client.query<CommandReceiptRow>(`
      INSERT INTO work_order_command_receipts (
        company_id, command_code, idempotency_key, request_sha256, correlation_id
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING
      RETURNING request_sha256, work_order_id, result_revision_id, result_entity_version
    `, [
      input.scope.companyId,
      WORK_ORDER_CREATE_COMMAND_CODE,
      input.scopedIdempotencyKeyHash,
      input.requestHash,
      input.scope.correlationId,
    ]);
    statementCount += 1;

    if (receiptInsert.rowCount === 0) {
      const receipt = await client.query<CommandReceiptRow>(`
        SELECT request_sha256, work_order_id, result_revision_id, result_entity_version
        FROM work_order_command_receipts
        WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
      `, [input.scope.companyId, WORK_ORDER_CREATE_COMMAND_CODE, input.scopedIdempotencyKeyHash]);
      statementCount += 1;
      const existing = receipt.rows[0];
      if (!existing) throw new WorkOrderCommandRepositoryError("idempotency_incomplete");
      if (existing.request_sha256 !== input.requestHash) {
        throw new WorkOrderCommandRepositoryError(
          "idempotency_conflict",
          existing.result_entity_version === null ? null : Number(existing.result_entity_version),
        );
      }
      if (!existing.work_order_id || !existing.result_revision_id || existing.result_entity_version === null) {
        throw new WorkOrderCommandRepositoryError("idempotency_incomplete");
      }

      const replay = await client.query<WorkOrderCommandRow>(`
        SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
               w.status AS work_order_status, r.revision_status,
               w.entity_version, w.product_name, w.product_type_code,
               w.season_code, w.item_code, w.due_date, w.total_quantity, r.memo, r.factory_delivery_memo
        FROM work_orders w
        JOIN work_order_revisions r
          ON r.company_id = w.company_id AND r.id = w.current_revision_id
        WHERE w.company_id = $1 AND w.id = $2::uuid AND r.id = $3::uuid
      `, [input.scope.companyId, existing.work_order_id, existing.result_revision_id]);
      statementCount += 1;
      if (!replay.rows[0]) throw new WorkOrderCommandRepositoryError("idempotency_incomplete");
      return {
        result: mapCommandRow(replay.rows[0]),
        nextVersion: Number(existing.result_entity_version) as EntityVersion,
        idempotentReplay: true,
        changedFields: [] as const,
      };
    }

    const workOrder = await client.query<DbQueryResultRow & { readonly id: string }>(`
      INSERT INTO work_orders (
        company_id, product_name, product_type_code, season_code, item_code,
        status, due_date, total_quantity, created_by_member_id, entity_version
      ) VALUES ($1, $2, $3, $4, $5, 'draft', $6::date, $7, $8, 1)
      RETURNING id
    `, [
      input.scope.companyId,
      input.command.productName,
      input.command.productTypeCode ?? null,
      input.command.seasonCode ?? null,
      input.command.itemCode ?? null,
      input.command.dueDate ?? null,
      input.command.totalQuantity ?? 0,
      input.scope.companyMemberId,
    ]);
    statementCount += 1;
    const workOrderId = workOrder.rows[0]?.id;
    if (!workOrderId) throw new Error("WORK_ORDER_CREATE_INSERT_FAILED");

    const revision = await client.query<DbQueryResultRow & { readonly id: string }>(`
      INSERT INTO work_order_revisions (
        company_id, work_order_id, revision_no, revision_status,
        product_name_snapshot, product_type_code_snapshot, season_code_snapshot,
        item_code_snapshot, due_date_snapshot, total_quantity_snapshot,
        memo, factory_delivery_memo, author_member_id, entity_version
      ) VALUES ($1, $2::uuid, 0, 'draft', $3, $4, $5, $6, $7::date, $8, $9, $10, $11, 1)
      RETURNING id
    `, [
      input.scope.companyId,
      workOrderId,
      input.command.productName,
      input.command.productTypeCode ?? null,
      input.command.seasonCode ?? null,
      input.command.itemCode ?? null,
      input.command.dueDate ?? null,
      input.command.totalQuantity ?? 0,
      input.command.memo ?? null,
      input.command.factoryDeliveryMemo ?? null,
      input.scope.companyMemberId,
    ]);
    statementCount += 1;
    const revisionId = revision.rows[0]?.id;
    if (!revisionId) throw new Error("WORK_ORDER_REVISION_CREATE_FAILED");

    const linked = await client.query<WorkOrderCommandRow>(`
      UPDATE work_orders
      SET current_revision_id = $3::uuid, updated_at = now()
      WHERE company_id = $1 AND id = $2::uuid AND current_revision_id IS NULL
      RETURNING id AS work_order_id, $3::uuid AS revision_id, 0 AS revision_no,
                status AS work_order_status, 'draft'::text AS revision_status,
                entity_version, product_name, product_type_code, season_code,
                item_code, due_date::text AS due_date, total_quantity, $4::text AS memo, $5::text AS factory_delivery_memo
    `, [input.scope.companyId, workOrderId, revisionId, input.command.memo ?? null, input.command.factoryDeliveryMemo ?? null]);
    statementCount += 1;
    if (!linked.rows[0]) throw new Error("WORK_ORDER_CURRENT_REVISION_LINK_FAILED");

    await client.query(`
      INSERT INTO domain_events (
        company_id, entity_type, entity_id, command_code, actor_member_id,
        correlation_id, change_summary, metadata, schema_version
      ) VALUES ($1, 'work_order', $2, $3, $4, $5, $6, $7::jsonb, 1)
    `, [
      input.scope.companyId,
      workOrderId,
      WORK_ORDER_CREATE_COMMAND_CODE,
      input.scope.companyMemberId,
      input.scope.correlationId,
      "draft WorkOrder와 R0 revision 생성",
      JSON.stringify({
        clientRequestId: input.command.clientRequestId,
        changedFields: ["productName", "productTypeCode", "seasonCode", "itemCode", "dueDate", "totalQuantity", "memo", "factoryDeliveryMemo"],
        versionTransition: { from: null, to: 1 },
        revisionNumber: 0,
      }),
    ]);
    statementCount += 1;

    await client.query(`
      UPDATE work_order_command_receipts
      SET work_order_id = $4::uuid, result_revision_id = $5::uuid, result_entity_version = 1
      WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
    `, [
      input.scope.companyId,
      WORK_ORDER_CREATE_COMMAND_CODE,
      input.scopedIdempotencyKeyHash,
      workOrderId,
      revisionId,
    ]);
    statementCount += 1;

    return {
      result: mapCommandRow(linked.rows[0]),
      nextVersion: 1 as EntityVersion,
      idempotentReplay: false,
      changedFields: ["productName", "productTypeCode", "seasonCode", "itemCode", "dueDate", "totalQuantity", "memo", "factoryDeliveryMemo"],
    };
  });

  return {
    ...result,
    statementCount,
    transactionCount: 1,
    dbMs: Number((performance.now() - startedAt).toFixed(2)),
  };
}

function datesEqual(left: string | null, right: IsoDate | null | undefined): boolean {
  return serializePostgresDateOnly(left, "WORK_ORDER_COMMAND_INVALID_DUE_DATE") === (right ?? null);
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export async function patchWorkOrderBasicInfoV2(input: {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly command: PatchWorkOrderBasicInfoCommand;
}): Promise<WorkOrderCommandRepositoryResult> {
  const startedAt = performance.now();
  let statementCount = 0;
  const result = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    statementCount += 1;

    const target = await client.query<PatchTargetRow>(`
      SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
             w.status AS work_order_status, r.revision_status,
             w.entity_version, w.product_name, w.product_type_code,
             w.season_code, w.item_code, w.due_date::text AS due_date, w.total_quantity, r.memo, r.factory_delivery_memo
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
        AND ($3::text IS NULL OR w.assignee_member_id = $3)
      FOR UPDATE OF w, r
    `, [input.scope.companyId, input.command.workOrderId, input.assignedCompanyMemberId]);
    statementCount += 1;
    const current = target.rows[0];
    if (!current) throw new WorkOrderCommandRepositoryError("not_found");

    const currentVersion = toInteger(current.entity_version);
    if (currentVersion !== input.command.expectedVersion) {
      throw new WorkOrderCommandRepositoryError("conflict", currentVersion);
    }
    if (current.work_order_status !== "draft") {
      throw new WorkOrderCommandRepositoryError("locked", currentVersion);
    }
    if (current.revision_status !== "draft") {
      throw new WorkOrderCommandRepositoryError("revision_mismatch", currentVersion);
    }

    const patch = input.command.patch;
    const nextQuantity = hasOwn(patch, "totalQuantity") ? (patch.totalQuantity ?? 0) : toInteger(current.total_quantity);
    const changedFields = [
      hasOwn(patch, "productName") && patch.productName !== current.product_name ? "productName" : null,
      hasOwn(patch, "productTypeCode") && (patch.productTypeCode ?? null) !== current.product_type_code ? "productTypeCode" : null,
      hasOwn(patch, "seasonCode") && (patch.seasonCode ?? null) !== current.season_code ? "seasonCode" : null,
      hasOwn(patch, "itemCode") && (patch.itemCode ?? null) !== current.item_code ? "itemCode" : null,
      hasOwn(patch, "dueDate") && !datesEqual(current.due_date, patch.dueDate) ? "dueDate" : null,
      hasOwn(patch, "totalQuantity") && nextQuantity !== toInteger(current.total_quantity) ? "totalQuantity" : null,
      hasOwn(patch, "memo") && (patch.memo ?? null) !== current.memo ? "memo" : null,
      hasOwn(patch, "factoryDeliveryMemo") && (patch.factoryDeliveryMemo ?? null) !== current.factory_delivery_memo ? "factoryDeliveryMemo" : null,
    ].filter((field): field is string => field !== null);

    if (changedFields.length === 0) {
      return {
        result: mapCommandRow(current),
        nextVersion: currentVersion as EntityVersion,
        idempotentReplay: false,
        changedFields,
      };
    }

    const workOrderUpdate = await client.query<DbQueryResultRow & { readonly entity_version: number | string }>(`
      UPDATE work_orders
      SET product_name = CASE WHEN $5 THEN $6 ELSE product_name END,
          product_type_code = CASE WHEN $7 THEN $8 ELSE product_type_code END,
          season_code = CASE WHEN $9 THEN $10 ELSE season_code END,
          item_code = CASE WHEN $11 THEN $12 ELSE item_code END,
          due_date = CASE WHEN $13 THEN $14::date ELSE due_date END,
          total_quantity = CASE WHEN $15 THEN $16 ELSE total_quantity END,
          entity_version = entity_version + 1,
          updated_at = now()
      WHERE company_id = $1 AND id = $2::uuid AND entity_version = $3
        AND current_revision_id = $4::uuid AND status = 'draft'
      RETURNING entity_version
    `, [
      input.scope.companyId,
      input.command.workOrderId,
      input.command.expectedVersion,
      current.revision_id,
      hasOwn(patch, "productName"), patch.productName ?? null,
      hasOwn(patch, "productTypeCode"), patch.productTypeCode ?? null,
      hasOwn(patch, "seasonCode"), patch.seasonCode ?? null,
      hasOwn(patch, "itemCode"), patch.itemCode ?? null,
      hasOwn(patch, "dueDate"), patch.dueDate ?? null,
      hasOwn(patch, "totalQuantity"), nextQuantity,
    ]);
    statementCount += 1;
    if (!workOrderUpdate.rows[0]) {
      throw new WorkOrderCommandRepositoryError("conflict", currentVersion);
    }
    const nextVersion = toInteger(workOrderUpdate.rows[0].entity_version);

    const revisionUpdate = await client.query<WorkOrderCommandRow>(`
      UPDATE work_order_revisions
      SET product_name_snapshot = CASE WHEN $4 THEN $5 ELSE product_name_snapshot END,
          product_type_code_snapshot = CASE WHEN $6 THEN $7 ELSE product_type_code_snapshot END,
          season_code_snapshot = CASE WHEN $8 THEN $9 ELSE season_code_snapshot END,
          item_code_snapshot = CASE WHEN $10 THEN $11 ELSE item_code_snapshot END,
          due_date_snapshot = CASE WHEN $12 THEN $13::date ELSE due_date_snapshot END,
          total_quantity_snapshot = CASE WHEN $14 THEN $15 ELSE total_quantity_snapshot END,
          memo = CASE WHEN $16 THEN $17 ELSE memo END,
          factory_delivery_memo = CASE WHEN $18 THEN $19 ELSE factory_delivery_memo END,
          entity_version = entity_version + 1,
          updated_at = now()
      WHERE company_id = $1 AND id = $2::uuid AND revision_status = 'draft'
      RETURNING $3::uuid AS work_order_id, id AS revision_id, revision_no,
                'draft'::text AS work_order_status, revision_status,
                $20::integer AS entity_version, product_name_snapshot AS product_name,
                product_type_code_snapshot AS product_type_code,
                season_code_snapshot AS season_code, item_code_snapshot AS item_code,
                due_date_snapshot::text AS due_date, total_quantity_snapshot AS total_quantity, memo, factory_delivery_memo
    `, [
      input.scope.companyId,
      current.revision_id,
      input.command.workOrderId,
      hasOwn(patch, "productName"), patch.productName ?? null,
      hasOwn(patch, "productTypeCode"), patch.productTypeCode ?? null,
      hasOwn(patch, "seasonCode"), patch.seasonCode ?? null,
      hasOwn(patch, "itemCode"), patch.itemCode ?? null,
      hasOwn(patch, "dueDate"), patch.dueDate ?? null,
      hasOwn(patch, "totalQuantity"), nextQuantity,
      hasOwn(patch, "memo"), patch.memo ?? null,
      hasOwn(patch, "factoryDeliveryMemo"), patch.factoryDeliveryMemo ?? null,
      nextVersion,
    ]);
    statementCount += 1;
    if (!revisionUpdate.rows[0]) {
      throw new WorkOrderCommandRepositoryError("revision_mismatch", nextVersion);
    }

    await client.query(`
      INSERT INTO domain_events (
        company_id, entity_type, entity_id, command_code, actor_member_id,
        correlation_id, change_summary, metadata, schema_version
      ) VALUES ($1, 'work_order', $2, $3, $4, $5, $6, $7::jsonb, 1)
    `, [
      input.scope.companyId,
      input.command.workOrderId,
      WORK_ORDER_PATCH_BASIC_COMMAND_CODE,
      input.scope.companyMemberId,
      input.scope.correlationId,
      "draft WorkOrder 기본정보 수정",
      JSON.stringify({
        clientRequestId: input.command.clientRequestId,
        changedFields,
        versionTransition: { from: currentVersion, to: nextVersion },
        revisionNumber: toInteger(current.revision_no),
      }),
    ]);
    statementCount += 1;

    return {
      result: mapCommandRow(revisionUpdate.rows[0]),
      nextVersion: nextVersion as EntityVersion,
      idempotentReplay: false,
      changedFields,
    };
  });

  return {
    ...result,
    statementCount,
    transactionCount: 1,
    dbMs: Number((performance.now() - startedAt).toFixed(2)),
  };
}
