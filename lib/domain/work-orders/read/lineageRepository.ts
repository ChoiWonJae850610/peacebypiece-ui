import "server-only";

import type { CompanyMemberId, TenantMemberScope, WorkOrderId, WorkOrderSeriesHistoryReadModel, WorkOrderStatus } from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { serializePostgresDateOnly } from "@/lib/domain/work-orders/dateOnly.mjs";

export async function readWorkOrderSeriesHistory(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
}): Promise<WorkOrderSeriesHistoryReadModel | null> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const result = await client.query<DbQueryResultRow>(`
      WITH target AS (
        SELECT id,CASE WHEN derivation_kind='original' THEN id ELSE series_root_work_order_id END AS root_id
        FROM work_orders
        WHERE company_id=$1 AND id=$2::uuid AND deleted_at IS NULL
          AND ($3::text IS NULL OR assignee_member_id=$3)
      )
      , live_items AS (
        SELECT w.id,w.product_name,w.status,w.due_date::text AS due_date,w.total_quantity,w.reorder_round,
               (w.id=t.id) AS current,t.root_id,NULL::timestamptz AS deleted_at
        FROM target t
        JOIN work_orders w ON w.company_id=$1 AND w.deleted_at IS NULL
          AND ((w.id=t.root_id AND w.derivation_kind='original')
            OR (w.series_root_work_order_id=t.root_id AND w.derivation_kind='reorder'))
        WHERE w.is_sample=false AND ($3::text IS NULL OR w.assignee_member_id=$3)
      ), deleted_items AS (
        SELECT NULL::uuid AS id,'삭제된 리오더'::text AS product_name,'deleted'::text AS status,
               NULL::text AS due_date,0::numeric AS total_quantity,
               (e.metadata->>'reorderRound')::integer AS reorder_round,false AS current,t.root_id,e.occurred_at AS deleted_at
        FROM target t
        JOIN domain_events e ON e.company_id=$1 AND e.command_code='work_order.reorder_deleted'
          AND e.metadata->>'seriesRootWorkOrderId'=t.root_id::text
      )
      SELECT * FROM live_items
      UNION ALL
      SELECT * FROM deleted_items
      ORDER BY reorder_round ASC,id ASC NULLS LAST
    `, [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
    if (!result.rows[0]) return null;
    const root = String(result.rows[0].root_id) as WorkOrderId;
    return {
      workOrderId: input.workOrderId,
      seriesRootWorkOrderId: root,
      items: result.rows.map((row) => ({
        workOrderId: row.id ? String(row.id) as WorkOrderId : null,
        productName: String(row.product_name),
        status: String(row.status) as WorkOrderStatus | "deleted",
        dueDate: serializePostgresDateOnly(row.due_date, "LINEAGE_INVALID_DUE_DATE"),
        totalQuantity: Number(row.total_quantity),
        reorderRound: Number(row.reorder_round),
        current: Boolean(row.current),
        deletedAt: row.deleted_at ? new Date(String(row.deleted_at)).toISOString() : null,
      })),
    };
  });
}
