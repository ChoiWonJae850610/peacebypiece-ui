import "server-only";

import { queryDb, withDbTransaction, type DbTransactionClient } from "@/lib/db/client";
import { canonicalPomDisplayName } from "@/lib/catalog/systemCatalogPolicy";

const MEASUREMENT_TYPES = ["circumference", "half_flat", "quarter_pattern_reference", "length"] as const;
type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

export type SystemSizeSpecTemplate = {
  readonly id: string;
  readonly name: string;
  readonly templateVersion: number;
  readonly categoryCode: string | null;
  readonly genderCode: string | null;
  readonly sizeSetCode: string | null;
  readonly isActive: boolean;
  readonly sizes: readonly { readonly id: string; readonly code: string; readonly label: string; readonly order: number }[];
  readonly poms: readonly { readonly id: string; readonly code: string; readonly name: string; readonly measurementType: string; readonly instruction: string | null; readonly order: number }[];
  readonly values: readonly { readonly sizeRowId: string; readonly pomColumnId: string; readonly decimalValue: string | null; readonly displayFraction: string | null }[];
};

export type SystemSizeSpecStructure = {
  readonly sizes: readonly { readonly code: string; readonly label: string; readonly order: number }[];
  readonly poms: readonly { readonly code: string; readonly name: string; readonly measurementType: MeasurementType; readonly instruction?: string | null; readonly order: number }[];
  readonly values: readonly { readonly sizeCode: string; readonly pomCode: string; readonly decimalValue: number | null; readonly displayFraction?: string | null }[];
};

type TemplateMetadata = {
  readonly name: string;
  readonly categoryCode: string | null;
  readonly genderCode: string | null;
  readonly sizeSetCode: string | null;
  readonly isActive: boolean;
};

function text(value: unknown, max: number, nullable = false): string | null {
  if (value === null && nullable) return null;
  const normalized = typeof value === "string" ? value.normalize("NFKC").trim() : "";
  if (!normalized && nullable) return null;
  if (!normalized || normalized.length > max) throw new Error("SYSTEM_SIZE_SPEC_TEMPLATE_VALIDATION_FAILED");
  return normalized;
}

function normalizeStructure(input: SystemSizeSpecStructure): SystemSizeSpecStructure {
  if (!Array.isArray(input.sizes) || !Array.isArray(input.poms) || !Array.isArray(input.values)) throw new Error("SYSTEM_SIZE_SPEC_TEMPLATE_VALIDATION_FAILED");
  if (input.sizes.length > 64 || input.poms.length > 64 || input.values.length > 4096) throw new Error("SYSTEM_SIZE_SPEC_TEMPLATE_VALIDATION_FAILED");
  const sizes = input.sizes.map((item, index) => ({ code: text(item.code, 64)!, label: text(item.label, 120)!, order: Number.isSafeInteger(item.order) && item.order >= 0 ? item.order : index }));
  const poms = input.poms.map((item, index) => {
    if (!MEASUREMENT_TYPES.includes(item.measurementType)) throw new Error("SYSTEM_SIZE_SPEC_TEMPLATE_VALIDATION_FAILED");
    return { code: text(item.code, 64)!, name: text(item.name, 120)!, measurementType: item.measurementType, instruction: text(item.instruction ?? null, 500, true), order: Number.isSafeInteger(item.order) && item.order >= 0 ? item.order : index };
  });
  if (new Set(sizes.map((item) => item.code)).size !== sizes.length || new Set(poms.map((item) => item.code)).size !== poms.length) throw new Error("SYSTEM_SIZE_SPEC_TEMPLATE_VALIDATION_FAILED");
  const sizeCodes = new Set(sizes.map((item) => item.code));
  const pomCodes = new Set(poms.map((item) => item.code));
  const keys = new Set<string>();
  const values = input.values.map((item) => {
    const sizeCode = text(item.sizeCode, 64)!;
    const pomCode = text(item.pomCode, 64)!;
    const key = JSON.stringify([sizeCode, pomCode]);
    const decimalValue = item.decimalValue === null ? null : Number(item.decimalValue);
    if (!sizeCodes.has(sizeCode) || !pomCodes.has(pomCode) || keys.has(key) || (decimalValue !== null && (!Number.isFinite(decimalValue) || decimalValue < 0 || decimalValue > 1000))) throw new Error("SYSTEM_SIZE_SPEC_TEMPLATE_VALIDATION_FAILED");
    keys.add(key);
    return { sizeCode, pomCode, decimalValue, displayFraction: text(item.displayFraction ?? null, 16, true) };
  });
  return { sizes, poms, values };
}

async function loadSystemTemplate(id?: string): Promise<readonly SystemSizeSpecTemplate[]> {
  const templates = await queryDb<{ id: string; name: string; template_version: number | string; category_code: string | null; gender_code: string | null; size_set_code: string | null; is_active: boolean }>(`SELECT id::text,name,template_version,category_code,gender_code,size_set_code,is_active FROM size_spec_templates WHERE source_kind='system' AND ($1::uuid IS NULL OR id=$1::uuid) ORDER BY is_active DESC,name,template_version DESC,id`, [id ?? null]);
  return Promise.all(templates.rows.map(async (template) => {
    const [sizes, poms, values] = await Promise.all([
      queryDb<{ id: string; size_code: string; display_label: string; display_order: number }>(`SELECT id::text,size_code,display_label,display_order FROM size_spec_template_sizes WHERE template_id=$1::uuid ORDER BY display_order,id`, [template.id]),
      queryDb<{ id: string; pom_code: string; display_name: string; measurement_type: string; instruction: string | null; display_order: number }>(`SELECT id::text,pom_code,display_name,measurement_type,instruction,display_order FROM size_spec_template_poms WHERE template_id=$1::uuid ORDER BY display_order,id`, [template.id]),
      queryDb<{ size_row_id: string; pom_column_id: string; decimal_value: string | null; display_fraction: string | null }>(`SELECT size_row_id::text,pom_column_id::text,decimal_value::text,display_fraction FROM size_spec_template_values WHERE template_id=$1::uuid ORDER BY size_row_id,pom_column_id`, [template.id]),
    ]);
    return { id: template.id, name: template.name, templateVersion: Number(template.template_version), categoryCode: template.category_code, genderCode: template.gender_code, sizeSetCode: template.size_set_code, isActive: template.is_active, sizes: sizes.rows.map((row) => ({ id: row.id, code: row.size_code, label: row.display_label, order: row.display_order })), poms: poms.rows.map((row) => ({ id: row.id, code: row.pom_code, name: canonicalPomDisplayName(row.pom_code, row.display_name), measurementType: row.measurement_type, instruction: row.instruction, order: row.display_order })), values: values.rows.map((row) => ({ sizeRowId: row.size_row_id, pomColumnId: row.pom_column_id, decimalValue: row.decimal_value, displayFraction: row.display_fraction })) };
  }));
}

export function listSystemSizeSpecTemplates(): Promise<readonly SystemSizeSpecTemplate[]> { return loadSystemTemplate(); }

async function replaceStructure(client: DbTransactionClient, id: string, structure: SystemSizeSpecStructure): Promise<void> {
  const normalized = normalizeStructure(structure);
  await client.query(`DELETE FROM size_spec_template_values WHERE template_id=$1::uuid`, [id]);
  await client.query(`DELETE FROM size_spec_template_sizes WHERE template_id=$1::uuid`, [id]);
  await client.query(`DELETE FROM size_spec_template_poms WHERE template_id=$1::uuid`, [id]);
  for (const item of normalized.sizes) await client.query(`INSERT INTO size_spec_template_sizes(template_id,size_code,display_label,display_order) VALUES($1::uuid,$2,$3,$4)`, [id, item.code, item.label, item.order]);
  for (const item of normalized.poms) await client.query(`INSERT INTO size_spec_template_poms(template_id,pom_code,display_name,measurement_type,instruction,display_order) VALUES($1::uuid,$2,$3,$4,$5,$6)`, [id, item.code, item.name, item.measurementType, item.instruction, item.order]);
  for (const item of normalized.values) await client.query(`INSERT INTO size_spec_template_values(template_id,size_row_id,pom_column_id,decimal_value,display_fraction) SELECT $1::uuid,s.id,p.id,$4,$5 FROM size_spec_template_sizes s JOIN size_spec_template_poms p ON p.template_id=s.template_id WHERE s.template_id=$1::uuid AND s.size_code=$2 AND p.pom_code=$3`, [id, item.sizeCode, item.pomCode, item.decimalValue, item.displayFraction]);
}

export async function createSystemSizeSpecTemplate(input: TemplateMetadata & { readonly structure: SystemSizeSpecStructure }): Promise<SystemSizeSpecTemplate> {
  const id = await withDbTransaction(async (client) => {
    const row = (await client.query<{ id: string }>(`INSERT INTO size_spec_templates(company_id,source_kind,name,category_code,gender_code,size_set_code,is_active) VALUES(NULL,'system',$1,$2,$3,$4,$5) RETURNING id::text`, [text(input.name, 120), text(input.categoryCode, 80, true), text(input.genderCode, 80, true), text(input.sizeSetCode, 80, true), input.isActive])).rows[0];
    await replaceStructure(client, row.id, input.structure);
    return row.id;
  });
  return (await loadSystemTemplate(id))[0]!;
}

export async function updateSystemSizeSpecTemplate(input: { readonly id: string; readonly name?: string; readonly categoryCode?: string | null; readonly genderCode?: string | null; readonly sizeSetCode?: string | null; readonly isActive?: boolean; readonly structure?: SystemSizeSpecStructure }): Promise<SystemSizeSpecTemplate> {
  await withDbTransaction(async (client) => {
    const result = await client.query<{ id: string }>(`UPDATE size_spec_templates SET name=CASE WHEN $2 THEN $3 ELSE name END,category_code=CASE WHEN $4 THEN $5 ELSE category_code END,gender_code=CASE WHEN $6 THEN $7 ELSE gender_code END,size_set_code=CASE WHEN $8 THEN $9 ELSE size_set_code END,is_active=CASE WHEN $10 THEN $11 ELSE is_active END,template_version=template_version+1,updated_at=now() WHERE id=$1::uuid AND source_kind='system' RETURNING id::text`, [input.id, input.name !== undefined, input.name === undefined ? null : text(input.name, 120), input.categoryCode !== undefined, input.categoryCode === undefined ? null : text(input.categoryCode, 80, true), input.genderCode !== undefined, input.genderCode === undefined ? null : text(input.genderCode, 80, true), input.sizeSetCode !== undefined, input.sizeSetCode === undefined ? null : text(input.sizeSetCode, 80, true), input.isActive !== undefined, input.isActive ?? null]);
    if (!result.rows[0]) throw new Error("SYSTEM_SIZE_SPEC_TEMPLATE_NOT_FOUND");
    if (input.structure) await replaceStructure(client, input.id, input.structure);
  });
  return (await loadSystemTemplate(input.id))[0]!;
}
