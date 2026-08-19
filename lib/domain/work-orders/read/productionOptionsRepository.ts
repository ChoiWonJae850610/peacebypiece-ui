import "server-only";

import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { PartnerId, TenantMemberScope, WorkOrderId, WorkOrderProductionOptionsReadModel } from "@/lib/domain/work-orders/contracts";
import { queryDb, withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";

export async function listWorkOrderProductionOptions(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: WorkOrderId;
  readonly assignedCompanyMemberId: string | null;
}): Promise<WorkOrderProductionOptionsReadModel | null> {
  const target = await withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    return client.query<DbQueryResultRow>(`
      SELECT w.id, w.entity_version, w.total_quantity, w.status, r.revision_status
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.id=$2::uuid AND w.deleted_at IS NULL
        AND ($3::text IS NULL OR w.assignee_member_id=$3)
    `, [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
  });
  const row = target.rows[0];
  if (!row) return null;

  // partners/partner_items are preserved v1-owned catalogs without grants to the
  // v2 tenant role. The API guard above and every predicate below enforce the
  // application authorization boundary while the WorkOrder target stays RLS-read.
  const [factoryPartners, standards, processPartners] = await Promise.all([
    queryDb<DbQueryResultRow>(`
      SELECT DISTINCT p.id, p.name
      FROM partners p
      JOIN partner_items pi ON pi.company_id=p.company_id AND pi.partner_id=p.id
      WHERE p.company_id=$1 AND p.is_active=true AND pi.is_active=true AND pi.item_type='factory'
      ORDER BY p.name, p.id
    `, [input.scope.companyId]),
    queryDb<DbQueryResultRow>(`
      SELECT s.id, s.code, s.name
      FROM system_outsourcing_process_standards s
      LEFT JOIN company_enabled_process_standards e
        ON e.process_standard_id=s.id AND e.company_id=$1
      WHERE s.is_active=true AND COALESCE(e.is_enabled,true)=true
      ORDER BY COALESCE(e.sort_order,s.sort_order), s.name, s.id
    `, [input.scope.companyId]),
    queryDb<DbQueryResultRow>(`
      SELECT DISTINCT COALESCE(s.code, s.id) AS process_code, p.id AS partner_id, p.name AS partner_name
      FROM partner_items pi
      JOIN partners p ON p.company_id=pi.company_id AND p.id=pi.partner_id AND p.is_active=true
      LEFT JOIN outsourcing_processes o ON o.company_id=pi.company_id AND o.id=pi.outsourcing_process_id
      JOIN system_outsourcing_process_standards s
        ON s.is_active=true AND (s.id=pi.outsourcing_process_id OR s.code=pi.outsourcing_process_id OR s.name=o.name OR s.name=pi.item_name)
      LEFT JOIN company_enabled_process_standards e
        ON e.process_standard_id=s.id AND e.company_id=pi.company_id
      WHERE pi.company_id=$1 AND pi.item_type='outsourcing' AND pi.is_active=true
        AND COALESCE(e.is_enabled,true)=true
      ORDER BY process_code, p.name, p.id
    `, [input.scope.companyId]),
  ]);
  return {
    workOrderId: String(row.id) as WorkOrderId,
    entityVersion: Number(row.entity_version) as never,
    totalQuantity: String(row.total_quantity) as never,
    editable: row.status === "draft" && row.revision_status === "draft",
    factoryPartners: factoryPartners.rows.map((partner) => ({ id: String(partner.id) as PartnerId, name: String(partner.name) })),
    processStandards: standards.rows.map((standard) => ({ id: String(standard.id), code: String(standard.code ?? standard.id), name: String(standard.name) })),
    processPartners: processPartners.rows.map((partner) => ({ processCode: String(partner.process_code), partnerId: String(partner.partner_id) as PartnerId, partnerName: String(partner.partner_name) })),
  };
}
