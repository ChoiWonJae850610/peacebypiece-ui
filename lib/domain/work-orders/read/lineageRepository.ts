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
      SELECT w.id,w.product_name,w.status,w.due_date::text AS due_date,w.total_quantity,w.reorder_round,
             (w.id=t.id) AS current,t.root_id
      FROM target t
      JOIN work_orders w ON w.company_id=$1 AND w.deleted_at IS NULL
        AND ((w.id=t.root_id AND w.derivation_kind='original')
          OR (w.series_root_work_order_id=t.root_id AND w.derivation_kind='reorder'))
      WHERE w.is_sample=false AND ($3::text IS NULL OR w.assignee_member_id=$3)
      ORDER BY w.reorder_round ASC,w.id ASC
    `, [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
    if (!result.rows[0]) return null;
    const root = String(result.rows[0].root_id) as WorkOrderId;
    return {
      workOrderId: input.workOrderId,
      seriesRootWorkOrderId: root,
      items: result.rows.map((row) => ({
        workOrderId: String(row.id) as WorkOrderId,
        productName: String(row.product_name),
        status: String(row.status) as WorkOrderStatus,
        dueDate: serializePostgresDateOnly(row.due_date, "LINEAGE_INVALID_DUE_DATE"),
        totalQuantity: Number(row.total_quantity),
        reorderRound: Number(row.reorder_round),
        current: Boolean(row.current),
      })),
    };
  });
}
