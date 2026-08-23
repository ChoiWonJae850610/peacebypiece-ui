import "server-only";

import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { getWaflBasicSpecTemplate } from "@/lib/domain/work-orders/measurement/waflBasicSpecV1";
import { filterMakerVisibleMeasurementTemplates } from "@/lib/domain/work-orders/measurement/measurementTemplateVisibilityPolicy";
import type { WorkOrderMajorCategoryCode } from "@/lib/domain/work-orders/catalog/workOrderCategoryPolicy";

export type MeasurementTemplateSummary = {
  readonly id: string;
  readonly sourceKind: "system" | "company";
  readonly name: string;
  readonly templateVersion: number;
  readonly categoryCode: string | null;
  readonly genderCode: string | null;
  readonly sizeSetCode: string | null;
  readonly sizeCount: number;
  readonly pomCount: number;
  readonly valueCount: number;
};

export async function listCompatibleMeasurementTemplates(input: {
  readonly scope: TenantMemberScope;
  readonly categoryCode: string | null;
  readonly genderCode: string | null;
}): Promise<readonly MeasurementTemplateSummary[]> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const result = await client.query<DbQueryResultRow & {
      id: string; source_kind: "system" | "company"; name: string; template_version: number | string;
      category_code: string | null; gender_code: string | null; size_set_code: string | null;
      size_count:number|string; pom_count:number|string; value_count:number|string;
    }>(`
      SELECT id, source_kind, name, template_version, category_code, gender_code, size_set_code,
        (SELECT count(*)::integer FROM size_spec_template_sizes s WHERE s.template_id=size_spec_templates.id) size_count,
        (SELECT count(*)::integer FROM size_spec_template_poms p WHERE p.template_id=size_spec_templates.id) pom_count,
        (SELECT count(*)::integer FROM size_spec_template_values v WHERE v.template_id=size_spec_templates.id) value_count
      FROM size_spec_templates
      WHERE is_active
        AND (company_id IS NULL OR company_id = $1)
        AND (category_code IS NULL OR category_code = $2)
        AND (gender_code IS NULL OR gender_code = $3)
      ORDER BY source_kind, name, template_version DESC, id
    `, [input.scope.companyId, input.categoryCode, input.genderCode]);
    const persisted = result.rows.map((row) => ({
      id: row.id, sourceKind: row.source_kind, name: row.name, templateVersion: Number(row.template_version),
      categoryCode: row.category_code, genderCode: row.gender_code, sizeSetCode: row.size_set_code,
      sizeCount:Number(row.size_count),pomCount:Number(row.pom_count),valueCount:Number(row.value_count),
    }));
    const basic = getWaflBasicSpecTemplate(input.categoryCode as WorkOrderMajorCategoryCode | null);
    const currentBasicSummary = basic ? {
      id: basic.id, sourceKind: "system" as const, name: basic.name, templateVersion: basic.templateVersion,
      categoryCode: basic.categoryCode, genderCode: null, sizeSetCode: "WAFL_BASIC_SPEC_V1",
      sizeCount: basic.sizes.length, pomCount: basic.poms.length,
      valueCount: basic.sizes.length * basic.poms.length,
    } : null;
    return filterMakerVisibleMeasurementTemplates(
      [
        ...(currentBasicSummary ? [currentBasicSummary] : []),
        ...persisted.filter((template) => template.id !== currentBasicSummary?.id),
      ],
      currentBasicSummary?.id ?? null,
    );
  });
}
