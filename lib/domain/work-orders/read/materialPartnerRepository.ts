import "server-only";

import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { createDbPartnerRepository } from "@/lib/partners/dbPartnerRepository";

export type WorkOrderMaterialPartnerOption = {
  readonly id: string;
  readonly name: string;
  readonly role: "factory" | "fabric" | "subsidiary" | "outsourcing";
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
  const partners = await createDbPartnerRepository({ companyId: input.scope.companyId }).listPartners({ activeOnly: true });
  return {
    workOrderId: input.workOrderId,
    entityVersion: Number(target.entity_version),
    items: partners.slice(0, 200).map((row): WorkOrderMaterialPartnerOption => ({
      id: String(row.id),
      name: String(row.name),
      role: row.type,
      contactPerson: row.contact_person ?? null,
      contact: row.contact ?? null,
    })),
  };
}
