import "server-only";

import { withWaflV2TenantReadOnlyTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { getWaflBasicSpecTemplate } from "@/lib/domain/work-orders/measurement/waflBasicSpecV1";
import { filterMakerVisibleMeasurementTemplates } from "@/lib/domain/work-orders/measurement/measurementTemplateVisibilityPolicy";
import type { WorkOrderMajorCategoryCode } from "@/lib/domain/work-orders/catalog/workOrderCategoryPolicy";
import { decodeWorkOrderMajorCategoryCode } from "@/lib/domain/work-orders/catalog/workOrderCategoryPolicy";

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

export type MeasurementTemplateContent = {
  readonly templateId: string;
  readonly templateVersion: number;
  readonly sizes: readonly { readonly code: string; readonly displayLabel: string }[];
  readonly poms: readonly { readonly code: string; readonly displayName: string }[];
  readonly values: readonly { readonly sizeCode: string; readonly pomCode: string; readonly decimalValue: string }[];
};

export async function listCompatibleMeasurementTemplates(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly genderCode: string | null;
}): Promise<readonly MeasurementTemplateSummary[]> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const target = (await client.query<DbQueryResultRow & { product_type_code: string | null; item_code: string | null }>(`
      SELECT r.product_type_code_snapshot product_type_code,r.item_code_snapshot item_code
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id=w.company_id AND r.id=w.current_revision_id
      WHERE w.company_id=$1 AND w.id=$2::uuid AND w.deleted_at IS NULL
    `, [input.scope.companyId, input.workOrderId])).rows[0];
    const categoryCode = decodeWorkOrderMajorCategoryCode(target?.product_type_code ?? null);
    const itemCode = target?.item_code ?? null;
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
    `, [input.scope.companyId, categoryCode, input.genderCode]);
    const persisted = result.rows.map((row) => ({
      id: row.id, sourceKind: row.source_kind, name: row.name, templateVersion: Number(row.template_version),
      categoryCode: row.category_code, genderCode: row.gender_code, sizeSetCode: row.size_set_code,
      sizeCount:Number(row.size_count),pomCount:Number(row.pom_count),valueCount:Number(row.value_count),
    }));
    const basic = getWaflBasicSpecTemplate(categoryCode as WorkOrderMajorCategoryCode | null, itemCode);
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

export async function readCompatibleMeasurementTemplateContent(input: {
  readonly scope: TenantMemberScope;
  readonly workOrderId: string;
  readonly templateId: string;
  readonly genderCode: string | null;
}): Promise<MeasurementTemplateContent | null> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const target = (await client.query<DbQueryResultRow & { product_type_code: string | null; item_code: string | null }>(`
      SELECT revision.product_type_code_snapshot product_type_code, revision.item_code_snapshot item_code
      FROM work_orders work_order
      JOIN work_order_revisions revision
        ON revision.company_id=work_order.company_id AND revision.id=work_order.current_revision_id
      WHERE work_order.company_id=$1 AND work_order.id=$2::uuid AND work_order.deleted_at IS NULL
    `, [input.scope.companyId, input.workOrderId])).rows[0];
    if (!target) return null;
    const categoryCode = decodeWorkOrderMajorCategoryCode(target.product_type_code);
    const basic = getWaflBasicSpecTemplate(categoryCode as WorkOrderMajorCategoryCode | null, target.item_code);
    if (basic?.id === input.templateId) {
      return {
        templateId: basic.id,
        templateVersion: basic.templateVersion,
        sizes: basic.sizes.map((code) => ({ code, displayLabel: code })),
        poms: basic.poms.map((pom) => ({ code: pom.code, displayName: pom.name })),
        values: Object.entries(basic.valuesCm).flatMap(([sizeCode, values]) => Object.entries(values).flatMap(([name, decimalValue]) => {
          const pom = basic.poms.find((candidate) => candidate.name === name);
          return pom ? [{ sizeCode, pomCode: pom.code, decimalValue: String(decimalValue) }] : [];
        })),
      };
    }
    const template = (await client.query<DbQueryResultRow & { id: string; template_version: number | string }>(`
      SELECT id, template_version
      FROM size_spec_templates
      WHERE id=$1::uuid AND is_active
        AND (company_id IS NULL OR company_id=$2)
        AND (category_code IS NULL OR category_code=$3)
        AND (gender_code IS NULL OR gender_code=$4)
    `, [input.templateId, input.scope.companyId, categoryCode, input.genderCode])).rows[0];
    if (!template) return null;
    const [sizes, poms, values] = await Promise.all([
      client.query<DbQueryResultRow & { size_code: string; display_label: string }>(`
        SELECT size_code, display_label FROM size_spec_template_sizes
        WHERE template_id=$1::uuid ORDER BY display_order,id
      `, [input.templateId]),
      client.query<DbQueryResultRow & { pom_code: string; display_name: string }>(`
        SELECT pom_code, display_name FROM size_spec_template_poms
        WHERE template_id=$1::uuid ORDER BY display_order,id
      `, [input.templateId]),
      client.query<DbQueryResultRow & { size_code: string; pom_code: string; decimal_value: string | number }>(`
        SELECT template_size.size_code, template_pom.pom_code, template_value.decimal_value
        FROM size_spec_template_values template_value
        JOIN size_spec_template_sizes template_size ON template_size.id=template_value.size_row_id
        JOIN size_spec_template_poms template_pom ON template_pom.id=template_value.pom_column_id
        WHERE template_value.template_id=$1::uuid
      `, [input.templateId]),
    ]);
    return {
      templateId: template.id,
      templateVersion: Number(template.template_version),
      sizes: sizes.rows.map((row) => ({ code: row.size_code, displayLabel: row.display_label })),
      poms: poms.rows.map((row) => ({ code: row.pom_code, displayName: row.display_name })),
      values: values.rows.map((row) => ({ sizeCode: row.size_code, pomCode: row.pom_code, decimalValue: String(row.decimal_value) })),
    };
  });
}
