import "server-only";

import { performance } from "perf_hooks";

import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import type { TenantMemberScope, WorkOrderId, WorkOrderRevisionId } from "@/lib/domain/work-orders/contracts";

export type PreviewTargetResult = {
  readonly data: { readonly workOrderId: WorkOrderId; readonly revisionId: WorkOrderRevisionId } | null;
  readonly queryCount: 2;
  readonly queryMs: number;
  readonly transactionMs: number;
};

export async function resolveIssuedPreviewTargetV2(input: {
  readonly scope: TenantMemberScope;
  readonly documentNumberBase: string;
  readonly revisionNumber: number;
  readonly assignedCompanyMemberId: string | null;
}): Promise<PreviewTargetResult> {
  const transactionStarted = performance.now();
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await client.query(`SELECT set_config('wafl.company_id',$1,true), set_config('wafl.company_member_id',$2,true), set_config('wafl.access_mode','tenant_member',true), set_config('wafl.correlation_id',$3,true)`, [input.scope.companyId, input.scope.companyMemberId, input.scope.correlationId]);
    const queryStarted = performance.now();
    const result = await client.query<DbQueryResultRow>(`
      SELECT w.id AS work_order_id, r.id AS revision_id
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.work_order_id = w.id
      WHERE w.company_id = $1
        AND w.document_number_base = $2
        AND r.revision_no = $3
        AND w.status IN ('issued','revised','completed')
        AND r.revision_status IN ('finalized','superseded')
        AND w.deleted_at IS NULL
        AND ($4::text IS NULL OR w.assignee_member_id = $4)
      LIMIT 1
    `, [input.scope.companyId, input.documentNumberBase, input.revisionNumber, input.assignedCompanyMemberId]);
    const row = result.rows[0];
    return {
      data: row ? { workOrderId: String(row.work_order_id) as WorkOrderId, revisionId: String(row.revision_id) as WorkOrderRevisionId } : null,
      queryCount: 2,
      queryMs: Number((performance.now() - queryStarted).toFixed(2)),
      transactionMs: Number((performance.now() - transactionStarted).toFixed(2)),
    };
  });
}
