import "server-only";

import { withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";

export class CompanyMeasurementTemplateError extends Error {
  constructor(readonly reason: "not_found" | "validation") {
    super(reason);
  }
}

export type CompanyMeasurementTemplate = {
  readonly id: string;
  readonly name: string;
  readonly templateVersion: number;
  readonly isActive: boolean;
  readonly categoryCode: string | null;
  readonly genderCode: string | null;
  readonly sizeSetCode: string | null;
};

function normalizeName(value: unknown) {
  const text = typeof value === "string" ? value.normalize("NFKC").trim() : "";
  if (!text || text.length > 120) throw new CompanyMeasurementTemplateError("validation");
  return text;
}

export async function patchCompanyMeasurementTemplate(input: {
  readonly scope: TenantMemberScope;
  readonly id: string;
  readonly name?: unknown;
  readonly isActive?: unknown;
}): Promise<CompanyMeasurementTemplate> {
  return withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const nextName = input.name === undefined ? null : normalizeName(input.name);
    const nextActive = input.isActive === undefined
      ? null
      : typeof input.isActive === "boolean"
        ? input.isActive
        : (() => { throw new CompanyMeasurementTemplateError("validation"); })();
    const result = await client.query<DbQueryResultRow & {
      id: string;
      name: string;
      template_version: number | string;
      is_active: boolean;
      category_code: string | null;
      gender_code: string | null;
      size_set_code: string | null;
    }>(`
      UPDATE size_spec_templates
      SET name = COALESCE($3, name), is_active = COALESCE($4, is_active), updated_at = now()
      WHERE id = $1::uuid AND company_id = $2 AND source_kind = 'company'
      RETURNING id::text, name, template_version, is_active, category_code, gender_code, size_set_code
    `, [input.id, input.scope.companyId, nextName, nextActive]);
    const row = result.rows[0];
    if (!row) throw new CompanyMeasurementTemplateError("not_found");
    return {
      id: row.id,
      name: row.name,
      templateVersion: Number(row.template_version),
      isActive: row.is_active,
      categoryCode: row.category_code,
      genderCode: row.gender_code,
      sizeSetCode: row.size_set_code,
    };
  });
}
