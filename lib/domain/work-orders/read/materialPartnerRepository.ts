import "server-only";

import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { queryDb, withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";

export type WorkOrderMaterialPartnerOption = {
  readonly id: string;
  readonly name: string;
  readonly role: "factory" | "fabric" | "subsidiary" | "outsourcing";
  readonly capabilityTypes: readonly ("factory" | "fabric" | "subsidiary" | "outsourcing")[];
  readonly processCodes: readonly string[];
  readonly contactPerson: string | null;
  readonly contact: string | null;
};

export async function listWorkOrderMaterialPartnerOptions(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly assignedCompanyMemberId: string | null;
}) {
  const target = await withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const target = await client.query<DbQueryResultRow>(`
      SELECT w.id, w.entity_version
      FROM work_orders w
      WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
        AND ($3::text IS NULL OR w.assignee_member_id = $3)
    `, [input.scope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
    return target.rows[0] ?? null;
  });
  if (!target) return null;
  const partners = await queryDb<DbQueryResultRow>(`
    SELECT p.id,p.name,p.contact_person,p.contact,
           array_agg(DISTINCT pi.item_type ORDER BY pi.item_type) FILTER (WHERE pi.item_type IS NOT NULL) AS capability_types,
           array_agg(DISTINCT COALESCE(s.code,s.id,pi.outsourcing_process_id) ORDER BY COALESCE(s.code,s.id,pi.outsourcing_process_id))
             FILTER (WHERE pi.item_type='outsourcing' AND pi.outsourcing_process_id IS NOT NULL) AS process_codes
    FROM partners p
    JOIN partner_items pi ON pi.company_id=p.company_id AND pi.partner_id=p.id AND pi.is_active=true
    LEFT JOIN system_outsourcing_process_standards s
      ON s.id=pi.outsourcing_process_id OR s.code=pi.outsourcing_process_id
    WHERE p.company_id=$1 AND p.is_active=true
    GROUP BY p.id
    ORDER BY p.name,p.id
  `, [input.scope.companyId]);
  return {
    workOrderId: input.workOrderId,
    entityVersion: Number(target.entity_version),
    items: partners.rows.slice(0, 200).map((row): WorkOrderMaterialPartnerOption => ({
      id: String(row.id),
      name: String(row.name),
      role: ((row.capability_types as string[] | null)?.[0] ?? "factory") as WorkOrderMaterialPartnerOption["role"],
      capabilityTypes: ((row.capability_types as string[] | null) ?? []) as WorkOrderMaterialPartnerOption["capabilityTypes"],
      processCodes: ((row.process_codes as string[] | null) ?? []).map(String),
      contactPerson: row.contact_person == null ? null : String(row.contact_person),
      contact: row.contact == null ? null : String(row.contact),
    })),
  };
}
