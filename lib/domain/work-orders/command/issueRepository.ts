import "server-only";

import { performance } from "perf_hooks";

import type {
  CompanyMemberId,
  DisplayDocumentNumber,
  EntityVersion,
  IssueWorkOrderCommand,
  IssueWorkOrderCommandResult,
  RevisionNumber,
  TenantMemberScope,
  WorkOrderId,
  WorkOrderRevisionId,
} from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";

export const WORK_ORDER_ISSUE_COMMAND_CODE = "work_order.revision.issue";

type IssueFailureReason =
  | "not_found"
  | "conflict"
  | "locked"
  | "revision_mismatch"
  | "precondition_failed"
  | "idempotency_conflict"
  | "idempotency_incomplete";

export class WorkOrderIssueRepositoryError extends Error {
  readonly reason: IssueFailureReason;
  readonly entityVersion: number | null;

  constructor(reason: IssueFailureReason, entityVersion: number | null = null) {
    super(reason);
    this.name = "WorkOrderIssueRepositoryError";
    this.reason = reason;
    this.entityVersion = entityVersion;
  }
}

type ReceiptRow = DbQueryResultRow & {
  readonly request_sha256: string;
  readonly work_order_id: string | null;
  readonly result_revision_id: string | null;
  readonly result_entity_version: number | string | null;
};

type IssueTargetRow = DbQueryResultRow & {
  readonly work_order_id: string;
  readonly revision_id: string;
  readonly revision_no: number | string;
  readonly work_order_status: string;
  readonly revision_status: string;
  readonly work_order_version: number | string;
  readonly revision_version: number | string;
  readonly product_name: string;
  readonly product_type_code: string | null;
  readonly season_code: string | null;
  readonly item_code: string | null;
  readonly due_date: string | Date | null;
  readonly total_quantity: number | string;
  readonly document_number_base: string | null;
  readonly company_code: string | null;
  readonly business_timezone: string;
  readonly business_date: string | Date;
  readonly fabric_count: number | string;
  readonly accessory_count: number | string;
};

type IssuedRow = DbQueryResultRow & {
  readonly work_order_id: string;
  readonly revision_id: string;
  readonly revision_no: number | string;
  readonly document_number_base: string;
  readonly work_order_version: number | string;
  readonly revision_version: number | string;
  readonly finalized_at: string | Date;
};

export type WorkOrderIssueRepositoryResult = {
  readonly result: IssueWorkOrderCommandResult;
  readonly nextVersion: EntityVersion;
  readonly idempotentReplay: boolean;
  readonly statementCount: number;
  readonly transactionCount: 1;
  readonly dbMs: number;
};

function integer(value: number | string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("WORK_ORDER_ISSUE_INVALID_INTEGER");
  return parsed;
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapIssued(row: IssuedRow): IssueWorkOrderCommandResult {
  const revisionNumber = integer(row.revision_no);
  const nextVersion = integer(row.work_order_version);
  return {
    workOrderId: row.work_order_id as WorkOrderId,
    issuedRevisionId: row.revision_id as WorkOrderRevisionId,
    revisionNumber: revisionNumber as RevisionNumber,
    status: "issued",
    revisionStatus: "finalized",
    displayDocumentNumber: `${row.document_number_base}-R${revisionNumber}` as DisplayDocumentNumber,
    issuedAt: iso(row.finalized_at),
    nextVersion: nextVersion as EntityVersion,
    nextRevisionVersion: integer(row.revision_version) as EntityVersion,
    nextDraftCreated: false,
  };
}

function normalizedCode(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized || null;
}

export async function issueWorkOrderRevisionV2(input: {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly command: IssueWorkOrderCommand;
  readonly scopedIdempotencyKeyHash: string;
  readonly requestHash: string;
}): Promise<WorkOrderIssueRepositoryResult> {
  const startedAt = performance.now();
  let statementCount = 0;
  const transactionResult = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    statementCount += 1;

    const receiptInsert = await client.query<ReceiptRow>(`
      INSERT INTO work_order_command_receipts (
        company_id, command_code, idempotency_key, request_sha256, correlation_id
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING
      RETURNING request_sha256, work_order_id, result_revision_id, result_entity_version
    `, [input.scope.companyId, WORK_ORDER_ISSUE_COMMAND_CODE, input.scopedIdempotencyKeyHash, input.requestHash, input.scope.correlationId]);
    statementCount += 1;

    if (!receiptInsert.rows[0]) {
      const receiptResult = await client.query<ReceiptRow>(`
        SELECT request_sha256, work_order_id, result_revision_id, result_entity_version
        FROM work_order_command_receipts
        WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
      `, [input.scope.companyId, WORK_ORDER_ISSUE_COMMAND_CODE, input.scopedIdempotencyKeyHash]);
      statementCount += 1;
      const receipt = receiptResult.rows[0];
      if (!receipt) throw new WorkOrderIssueRepositoryError("idempotency_incomplete");
      if (receipt.request_sha256 !== input.requestHash) {
        throw new WorkOrderIssueRepositoryError("idempotency_conflict", receipt.result_entity_version === null ? null : Number(receipt.result_entity_version));
      }
      if (!receipt.work_order_id || !receipt.result_revision_id || receipt.result_entity_version === null) {
        throw new WorkOrderIssueRepositoryError("idempotency_incomplete");
      }
      const replay = await client.query<IssuedRow>(`
        SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
               w.document_number_base, w.entity_version AS work_order_version,
               r.entity_version AS revision_version, r.finalized_at
        FROM work_orders w
        JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = $3::uuid
        WHERE w.company_id = $1 AND w.id = $2::uuid
          AND w.status = 'issued' AND r.revision_status = 'finalized'
      `, [input.scope.companyId, receipt.work_order_id, receipt.result_revision_id]);
      statementCount += 1;
      if (!replay.rows[0]?.document_number_base || !replay.rows[0].finalized_at) {
        throw new WorkOrderIssueRepositoryError("idempotency_incomplete");
      }
      return { result: mapIssued(replay.rows[0]), idempotentReplay: true };
    }

    const targetResult = await client.query<IssueTargetRow>(`
      SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
             w.status AS work_order_status, r.revision_status,
             w.entity_version AS work_order_version, r.entity_version AS revision_version,
             w.product_name, w.product_type_code, w.season_code, w.item_code,
             w.due_date, w.total_quantity, w.document_number_base,
             settings.document_code AS company_code,
             settings.business_timezone,
             timezone(settings.business_timezone, now())::date AS business_date,
             (SELECT count(*) FROM work_order_material_lines m
              WHERE m.company_id = w.company_id AND m.revision_id = r.id
                AND m.material_type = 'fabric') AS fabric_count,
             (SELECT count(*) FROM work_order_material_lines m
              WHERE m.company_id = w.company_id AND m.revision_id = r.id
                AND m.material_type = 'accessory') AS accessory_count
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      CROSS JOIN LATERAL public.wafl_v2_document_number_settings() AS settings
      WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
        AND ($3::text IS NULL OR w.assignee_member_id = $3)
      FOR UPDATE OF w, r
    `, [input.scope.companyId, input.command.workOrderId, input.assignedCompanyMemberId]);
    statementCount += 1;
    const target = targetResult.rows[0];
    if (!target) throw new WorkOrderIssueRepositoryError("not_found");
    const workOrderVersion = integer(target.work_order_version);
    const revisionVersion = integer(target.revision_version);
    if (workOrderVersion !== input.command.expectedVersion || revisionVersion !== input.command.expectedRevisionVersion) {
      throw new WorkOrderIssueRepositoryError("conflict", workOrderVersion);
    }
    if (target.revision_id !== input.command.revisionId) {
      throw new WorkOrderIssueRepositoryError("revision_mismatch", workOrderVersion);
    }
    if (!new Set(["draft", "ready_to_issue"]).has(target.work_order_status)) {
      throw new WorkOrderIssueRepositoryError("locked", workOrderVersion);
    }
    if (target.revision_status !== "draft" || target.document_number_base) {
      throw new WorkOrderIssueRepositoryError("revision_mismatch", workOrderVersion);
    }

    const companyCode = normalizedCode(target.company_code);
    const seasonCode = normalizedCode(target.season_code);
    const itemCode = normalizedCode(target.item_code);
    if (!target.product_name.trim() || !target.product_type_code?.trim() || !target.due_date
      || integer(target.total_quantity) < 1 || !companyCode || !seasonCode || !itemCode
      || integer(target.fabric_count) < 1 || integer(target.accessory_count) < 1) {
      throw new WorkOrderIssueRepositoryError("precondition_failed", workOrderVersion);
    }

    const sequenceResult = await client.query<DbQueryResultRow & { readonly sequence: number | string }>(
      "SELECT allocate_work_order_document_sequence($1, $2::date) AS sequence",
      [input.scope.companyId, target.business_date],
    );
    statementCount += 1;
    const sequence = integer(sequenceResult.rows[0]?.sequence ?? 0);
    const businessDate = target.business_date instanceof Date
      ? target.business_date.toISOString().slice(0, 10)
      : String(target.business_date).slice(0, 10);
    const compactDate = businessDate.replaceAll("-", "").slice(2);
    const documentNumberBase = `${companyCode}-${seasonCode}-${itemCode}-${compactDate}-${String(sequence).padStart(3, "0")}`;

    const issuedResult = await client.query<IssuedRow>(`
      WITH finalized_revision AS (
        UPDATE work_order_revisions
        SET revision_status = 'finalized', finalized_by_member_id = $5,
            finalized_at = now(), company_code_snapshot = $6,
            entity_version = entity_version + 1, updated_at = now()
        WHERE company_id = $1 AND id = $4::uuid AND work_order_id = $2::uuid
          AND revision_status = 'draft' AND entity_version = $7
        RETURNING id, revision_no, entity_version, finalized_at
      ), issued_work_order AS (
        UPDATE work_orders
        SET status = 'issued', document_number_base = $8,
            document_business_date = $9::date, document_sequence = $10,
            entity_version = entity_version + 1, updated_at = now()
        WHERE company_id = $1 AND id = $2::uuid AND entity_version = $3
          AND current_revision_id = $4::uuid AND status IN ('draft', 'ready_to_issue')
          AND EXISTS (SELECT 1 FROM finalized_revision)
        RETURNING id, entity_version, document_number_base
      )
      SELECT w.id AS work_order_id, r.id AS revision_id, r.revision_no,
             w.document_number_base, w.entity_version AS work_order_version,
             r.entity_version AS revision_version, r.finalized_at
      FROM issued_work_order w CROSS JOIN finalized_revision r
    `, [
      input.scope.companyId, input.command.workOrderId, input.command.expectedVersion,
      input.command.revisionId, input.scope.companyMemberId, companyCode,
      input.command.expectedRevisionVersion, documentNumberBase, businessDate, sequence,
    ]);
    statementCount += 1;
    const issued = issuedResult.rows[0];
    if (!issued) throw new WorkOrderIssueRepositoryError("conflict", workOrderVersion);
    const mapped = mapIssued(issued);

    await client.query(`
      INSERT INTO domain_events (
        company_id, entity_type, entity_id, command_code, actor_member_id,
        correlation_id, change_summary, metadata, schema_version
      ) VALUES ($1, 'work_order', $2, $3, $4, $5, $6, $7::jsonb, 1)
    `, [
      input.scope.companyId, input.command.workOrderId, WORK_ORDER_ISSUE_COMMAND_CODE,
      input.scope.companyMemberId, input.scope.correlationId, "current revision issued",
      JSON.stringify({
        clientRequestId: input.command.clientRequestId,
        issuedRevisionId: input.command.revisionId,
        revisionNumber: mapped.revisionNumber,
        displayDocumentNumber: mapped.displayDocumentNumber,
        statusTransition: { from: target.work_order_status, to: "issued" },
        revisionStatusTransition: { from: "draft", to: "finalized" },
        workOrderVersionTransition: { from: workOrderVersion, to: mapped.nextVersion },
        revisionVersionTransition: { from: revisionVersion, to: mapped.nextRevisionVersion },
        issuedAt: mapped.issuedAt,
        nextDraftCreated: false,
        issueNote: input.command.issueNote ?? null,
      }),
    ]);
    statementCount += 1;

    await client.query(`
      UPDATE work_order_command_receipts
      SET work_order_id = $4::uuid, result_revision_id = $5::uuid, result_entity_version = $6
      WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
    `, [input.scope.companyId, WORK_ORDER_ISSUE_COMMAND_CODE, input.scopedIdempotencyKeyHash, input.command.workOrderId, input.command.revisionId, mapped.nextVersion]);
    statementCount += 1;
    return { result: mapped, idempotentReplay: false };
  });

  return {
    ...transactionResult,
    nextVersion: transactionResult.result.nextVersion,
    statementCount,
    transactionCount: 1,
    dbMs: Number((performance.now() - startedAt).toFixed(2)),
  };
}
