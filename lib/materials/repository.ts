import "server-only";

import { queryDb } from "@/lib/db/client";
import type {
  Material,
  MaterialKind,
  MaterialLifecycleStatus,
  MaterialMutationInput,
  MaterialRepositoryListParams,
  MaterialUnit,
} from "@/lib/materials/types";

type MaterialRow = {
  id: string;
  company_id: string;
  kind: MaterialKind;
  code: string;
  name: string;
  category_id: string | null;
  partner_id: string | null;
  unit: MaterialUnit;
  lifecycle_status: MaterialLifecycleStatus;
  memo: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  composition: string | null;
  width_value: string | number | null;
  width_unit: "inch" | "cm" | null;
  weight_value: string | number | null;
  weight_unit: "gsm" | null;
  fabric_color_name: string | null;
  specification: string | null;
  submaterial_color_name: string | null;
  size_label: string | null;
};

function toIsoString(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toNumberOrNull(value: string | number | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapMaterialRow(row: MaterialRow): Material {
  const base = {
    id: row.id,
    companyId: row.company_id,
    kind: row.kind,
    code: row.code,
    name: row.name,
    categoryId: row.category_id,
    partnerId: row.partner_id,
    unit: row.unit,
    lifecycleStatus: row.lifecycle_status,
    memo: row.memo,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };

  if (row.kind === "fabric") {
    return {
      ...base,
      kind: "fabric",
      attributes: {
        composition: row.composition,
        widthValue: toNumberOrNull(row.width_value),
        widthUnit: row.width_unit,
        weightValue: toNumberOrNull(row.weight_value),
        weightUnit: row.weight_unit,
        colorName: row.fabric_color_name,
      },
    };
  }

  return {
    ...base,
    kind: "submaterial",
    attributes: {
      specification: row.specification,
      colorName: row.submaterial_color_name,
      sizeLabel: row.size_label,
    },
  };
}

function buildMaterialListWhere(params: MaterialRepositoryListParams): { sql: string; values: unknown[] } {
  const clauses = ["m.company_id = $1"];
  const values: unknown[] = [params.companyId];

  if (params.kind) {
    values.push(params.kind);
    clauses.push(`m.kind = $${values.length}`);
  }

  if (params.status) {
    values.push(params.status);
    clauses.push(`m.lifecycle_status = $${values.length}`);
  }

  const keyword = params.keyword?.trim();
  if (keyword) {
    values.push(`%${keyword.toLowerCase()}%`);
    clauses.push(`(lower(m.name) LIKE $${values.length} OR lower(m.code) LIKE $${values.length})`);
  }

  return { sql: clauses.join(" AND "), values };
}

const MATERIAL_SELECT_SQL = `
  SELECT
    m.id,
    m.company_id,
    m.kind,
    m.code,
    m.name,
    m.category_id,
    m.partner_id,
    m.unit,
    m.lifecycle_status,
    m.memo,
    m.created_at,
    m.updated_at,
    fabric.composition,
    fabric.width_value,
    fabric.width_unit,
    fabric.weight_value,
    fabric.weight_unit,
    fabric.color_name AS fabric_color_name,
    submaterial.specification,
    submaterial.color_name AS submaterial_color_name,
    submaterial.size_label
  FROM materials m
  LEFT JOIN material_attributes_fabric fabric
    ON fabric.material_id = m.id
  LEFT JOIN material_attributes_submaterial submaterial
    ON submaterial.material_id = m.id
`;

export async function listMaterialsByCompany(params: MaterialRepositoryListParams): Promise<Material[]> {
  const where = buildMaterialListWhere(params);
  const result = await queryDb<MaterialRow>(
    `${MATERIAL_SELECT_SQL}
     WHERE ${where.sql}
     ORDER BY m.kind ASC, m.updated_at DESC, m.created_at DESC, m.name ASC`,
    where.values,
  );

  return result.rows.map(mapMaterialRow);
}

export async function createMaterialForCompany(input: MaterialMutationInput): Promise<Material> {
  const id = crypto.randomUUID();
  const lifecycleStatus = input.lifecycleStatus ?? "active";

  await queryDb(
    `INSERT INTO materials (
       id,
       company_id,
       kind,
       code,
       name,
       category_id,
       partner_id,
       unit,
       lifecycle_status,
       memo
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      input.companyId,
      input.kind,
      input.code.trim(),
      input.name.trim(),
      input.categoryId ?? null,
      input.partnerId ?? null,
      input.unit,
      lifecycleStatus,
      input.memo?.trim() || null,
    ],
  );

  await queryDb(
    input.kind === "fabric"
      ? "INSERT INTO material_attributes_fabric (material_id) VALUES ($1)"
      : "INSERT INTO material_attributes_submaterial (material_id) VALUES ($1)",
    [id],
  );

  return getMaterialByCompany({ companyId: input.companyId, materialId: id });
}

export async function updateMaterialForCompany(materialId: string, input: MaterialMutationInput): Promise<Material> {
  await queryDb(
    `UPDATE materials
        SET kind = $3,
            code = $4,
            name = $5,
            category_id = $6,
            partner_id = $7,
            unit = $8,
            lifecycle_status = $9,
            memo = $10,
            updated_at = now()
      WHERE company_id = $1
        AND id = $2`,
    [
      input.companyId,
      materialId,
      input.kind,
      input.code.trim(),
      input.name.trim(),
      input.categoryId ?? null,
      input.partnerId ?? null,
      input.unit,
      input.lifecycleStatus ?? "active",
      input.memo?.trim() || null,
    ],
  );

  if (input.kind === "fabric") {
    await queryDb("DELETE FROM material_attributes_submaterial WHERE material_id = $1", [materialId]);
    await queryDb(
      `INSERT INTO material_attributes_fabric (material_id)
       VALUES ($1)
       ON CONFLICT (material_id) DO NOTHING`,
      [materialId],
    );
  } else {
    await queryDb("DELETE FROM material_attributes_fabric WHERE material_id = $1", [materialId]);
    await queryDb(
      `INSERT INTO material_attributes_submaterial (material_id)
       VALUES ($1)
       ON CONFLICT (material_id) DO NOTHING`,
      [materialId],
    );
  }

  return getMaterialByCompany({ companyId: input.companyId, materialId });
}

export async function deleteMaterialForCompany(input: { companyId: string; materialId: string }): Promise<void> {
  await queryDb("DELETE FROM materials WHERE company_id = $1 AND id = $2", [input.companyId, input.materialId]);
}

export async function getMaterialByCompany(input: { companyId: string; materialId: string }): Promise<Material> {
  const result = await queryDb<MaterialRow>(
    `${MATERIAL_SELECT_SQL}
     WHERE m.company_id = $1
       AND m.id = $2
     LIMIT 1`,
    [input.companyId, input.materialId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("MATERIAL_NOT_FOUND");
  }

  return mapMaterialRow(row);
}
