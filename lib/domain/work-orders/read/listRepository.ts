import "server-only";

import { performance } from "perf_hooks";

import {
  GENERATED_DOCUMENT_STATUSES,
  WORK_ORDER_STATUSES,
  type CompanyMemberId,
  type CurrencyCode,
  type DecimalString,
  type DisplayDocumentNumber,
  type GeneratedDocumentStatus,
  type ImageId,
  type IsoDate,
  type IsoDateTime,
  type TenantMemberScope,
  type WorkOrderId,
  type WorkOrderListItem,
  type WorkOrderStatus,
} from "@/lib/domain/work-orders/contracts";
import { serializePostgresDateOnly } from "@/lib/domain/work-orders/dateOnly.mjs";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";

// Counts bounded statements inside the repository callback, not all endpoint protocol round trips.
export const WORK_ORDER_V2_LIST_REPOSITORY_QUERY_COUNT = 2;

export const WORK_ORDER_V2_LIST_SQL = `
  WITH page_ids AS MATERIALIZED (
    SELECT w.id, w.updated_at
    FROM work_orders w
    WHERE w.company_id = $1
      AND w.deleted_at IS NULL
      AND ($2::timestamptz IS NULL OR (w.updated_at, w.id) < ($2::timestamptz, $3::uuid))
      AND ($4::text IS NULL OR w.assignee_member_id = $4)
    ORDER BY w.updated_at DESC, w.id DESC
    LIMIT $5
  ), page_rows AS MATERIALIZED (
    SELECT w.id, w.document_number_base, w.product_name, w.status, w.due_date::text AS due_date,
           w.total_quantity, w.current_revision_id, w.representative_image_id,
           w.updated_at, r.revision_no, r.estimated_total
    FROM page_ids p
    JOIN work_orders w ON w.id = p.id AND w.company_id = $1
    LEFT JOIN work_order_revisions r
      ON r.id = w.current_revision_id AND r.company_id = w.company_id
  ), material_counts AS (
    SELECT m.revision_id,
           count(*) FILTER (
             WHERE m.material_type = 'fabric' AND m.status IN ('editing', 'requested')
           )::integer AS incomplete_fabric_count,
           count(*) FILTER (
             WHERE m.material_type = 'accessory' AND m.status IN ('editing', 'requested')
           )::integer AS incomplete_accessory_count
    FROM work_order_material_lines m
    WHERE m.company_id = $1
      AND m.revision_id IN (SELECT current_revision_id FROM page_rows WHERE current_revision_id IS NOT NULL)
    GROUP BY m.revision_id
  ), process_counts AS (
    SELECT p.revision_id, count(*)::integer AS process_count
    FROM work_order_processes p
    WHERE p.company_id = $1
      AND p.revision_id IN (SELECT current_revision_id FROM page_rows WHERE current_revision_id IS NOT NULL)
    GROUP BY p.revision_id
  ), latest_document_candidates AS (
    SELECT d.work_order_id, d.status,
           row_number() OVER (
             PARTITION BY d.work_order_id ORDER BY d.created_at DESC, d.id DESC
           ) AS row_number
    FROM generated_documents d
    WHERE d.company_id = $1
      AND d.work_order_id IN (SELECT id FROM page_rows)
  ), latest_documents AS (
    SELECT work_order_id, status
    FROM latest_document_candidates
    WHERE row_number = 1
  )
  SELECT p.id, p.document_number_base, p.product_name, p.status, p.due_date,
         p.total_quantity, p.revision_no, p.estimated_total, p.updated_at,
         i.id AS image_id, i.title AS image_title,
         COALESCE(m.incomplete_fabric_count, 0)::integer AS incomplete_fabric_count,
         COALESCE(m.incomplete_accessory_count, 0)::integer AS incomplete_accessory_count,
         COALESCE(pc.process_count, 0)::integer AS process_count,
         ld.status AS latest_document_status
  FROM page_rows p
  LEFT JOIN work_order_images i
    ON i.id = p.representative_image_id AND i.company_id = $1 AND i.deleted_at IS NULL
  LEFT JOIN material_counts m ON m.revision_id = p.current_revision_id
  LEFT JOIN process_counts pc ON pc.revision_id = p.current_revision_id
  LEFT JOIN latest_documents ld ON ld.work_order_id = p.id
  ORDER BY p.updated_at DESC, p.id DESC
`;

type WorkOrderListRow = DbQueryResultRow & {
  readonly id: string;
  readonly document_number_base: string | null;
  readonly product_name: string;
  readonly status: string;
  readonly due_date: string | null;
  readonly total_quantity: number | string;
  readonly revision_no: number | string | null;
  readonly estimated_total: string | number | null;
  readonly updated_at: string | Date;
  readonly image_id: string | null;
  readonly image_title: string | null;
  readonly incomplete_fabric_count: number | string;
  readonly incomplete_accessory_count: number | string;
  readonly process_count: number | string;
  readonly latest_document_status: string | null;
};

export type WorkOrderListRepositoryResult = {
  readonly items: readonly WorkOrderListItem[];
  readonly hasMore: boolean;
  readonly lastPosition: { readonly updatedAt: string; readonly workOrderId: WorkOrderId } | null;
  readonly queryCount: number;
  readonly listQueryMs: number;
  readonly transactionMs: number;
};

function toIsoDateTime(value: string | Date): IsoDateTime {
  return (value instanceof Date ? value.toISOString() : new Date(value).toISOString()) as IsoDateTime;
}

function toCount(value: number | string): number {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("WORK_ORDER_LIST_INVALID_COUNT");
  return count;
}

function toWorkOrderStatus(value: string): WorkOrderStatus {
  if (!WORK_ORDER_STATUSES.includes(value as WorkOrderStatus)) throw new Error("WORK_ORDER_LIST_INVALID_STATUS");
  return value as WorkOrderStatus;
}

function toDocumentStatus(value: string | null): GeneratedDocumentStatus | null {
  if (value === null) return null;
  if (!GENERATED_DOCUMENT_STATUSES.includes(value as GeneratedDocumentStatus)) {
    throw new Error("WORK_ORDER_LIST_INVALID_DOCUMENT_STATUS");
  }
  return value as GeneratedDocumentStatus;
}

function mapRow(row: WorkOrderListRow): WorkOrderListItem {
  const workOrderId = row.id as WorkOrderId;
  const revisionNo = row.revision_no === null ? null : toCount(row.revision_no);
  const displayDocumentNumber = row.document_number_base && revisionNo !== null
    ? (`${row.document_number_base}-R${revisionNo}` as DisplayDocumentNumber)
    : null;

  return {
    workOrderId,
    displayDocumentNumber,
    productName: row.product_name,
    status: toWorkOrderStatus(row.status),
    dueDate: serializePostgresDateOnly(row.due_date, "WORK_ORDER_LIST_INVALID_DUE_DATE"),
    totalQuantity: toCount(row.total_quantity),
    estimatedAmountSummary: {
      currency: "KRW" as CurrencyCode,
      estimatedTotal: String(row.estimated_total ?? "0.00") as DecimalString,
    },
    representativeThumbnail: row.image_id
      ? {
          imageId: row.image_id as ImageId,
          thumbnailUrl: null,
          altText: row.image_title?.trim() || `${row.product_name} 대표 이미지`,
        }
      : null,
    incompleteMaterialSummary: {
      incompleteFabricCount: toCount(row.incomplete_fabric_count),
      incompleteAccessoryCount: toCount(row.incomplete_accessory_count),
    },
    processCount: toCount(row.process_count),
    latestDocumentStatus: toDocumentStatus(row.latest_document_status),
    updatedAt: toIsoDateTime(row.updated_at),
  };
}

export async function listWorkOrdersV2(input: {
  readonly scope: TenantMemberScope;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
  readonly cursorUpdatedAt: IsoDateTime | null;
  readonly cursorWorkOrderId: WorkOrderId | null;
  readonly limit: number;
}): Promise<WorkOrderListRepositoryResult> {
  const transactionStartedAt = performance.now();
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await client.query(
      `SELECT set_config('wafl.company_id', $1, true),
              set_config('wafl.company_member_id', $2, true),
              set_config('wafl.access_mode', 'tenant_member', true),
              set_config('wafl.correlation_id', $3, true)`,
      [input.scope.companyId, input.scope.companyMemberId, input.scope.correlationId],
    );

    const listStartedAt = performance.now();
    const result = await client.query<WorkOrderListRow>(WORK_ORDER_V2_LIST_SQL, [
      input.scope.companyId,
      input.cursorUpdatedAt,
      input.cursorWorkOrderId,
      input.assignedCompanyMemberId,
      input.limit + 1,
    ]);
    const listQueryMs = performance.now() - listStartedAt;
    const hasMore = result.rows.length > input.limit;
    const pageRows = result.rows.slice(0, input.limit);
    const items = pageRows.map(mapRow);
    const lastItem = items.at(-1) ?? null;

    return {
      items,
      hasMore,
      lastPosition: lastItem
        ? { updatedAt: lastItem.updatedAt, workOrderId: lastItem.workOrderId }
        : null,
      queryCount: WORK_ORDER_V2_LIST_REPOSITORY_QUERY_COUNT,
      listQueryMs: Number(listQueryMs.toFixed(2)),
      transactionMs: Number((performance.now() - transactionStartedAt).toFixed(2)),
    };
  });
}
