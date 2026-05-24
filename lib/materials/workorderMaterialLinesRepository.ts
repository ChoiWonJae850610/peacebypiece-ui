import "server-only";

import { queryDb } from "@/lib/db/client";
import type {
  MaterialKind,
  MaterialLifecycleStatus,
  MaterialOrderStatus,
  MaterialUnit,
  WorkorderMaterialLineRole,
  WorkorderMaterialLineMutationInput,
  WorkorderMaterialLineWithMaterial,
} from "@/lib/materials/types";

type WorkorderMaterialLineRow = {
  id: string;
  company_id: string;
  workorder_id: string;
  material_id: string;
  role: WorkorderMaterialLineRole;
  required_quantity: string | number | null;
  unit: MaterialUnit;
  order_status: MaterialOrderStatus;
  memo: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  material_company_id: string;
  material_kind: MaterialKind;
  material_code: string;
  material_name: string;
  material_category_id: string | null;
  material_partner_id: string | null;
  material_unit: MaterialUnit;
  material_lifecycle_status: MaterialLifecycleStatus;
  material_memo: string | null;
  material_created_at: Date | string;
  material_updated_at: Date | string;
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

function mapWorkorderMaterialLineRow(row: WorkorderMaterialLineRow): WorkorderMaterialLineWithMaterial {
  const materialBase = {
    id: row.material_id,
    companyId: row.material_company_id,
    kind: row.material_kind,
    code: row.material_code,
    name: row.material_name,
    categoryId: row.material_category_id,
    partnerId: row.material_partner_id,
    unit: row.material_unit,
    lifecycleStatus: row.material_lifecycle_status,
    memo: row.material_memo,
    createdAt: toIsoString(row.material_created_at),
    updatedAt: toIsoString(row.material_updated_at),
  };

  const material = row.material_kind === "fabric"
    ? {
        ...materialBase,
        kind: "fabric" as const,
        attributes: {
          composition: row.composition,
          widthValue: toNumberOrNull(row.width_value),
          widthUnit: row.width_unit,
          weightValue: toNumberOrNull(row.weight_value),
          weightUnit: row.weight_unit,
          colorName: row.fabric_color_name,
        },
      }
    : {
        ...materialBase,
        kind: "submaterial" as const,
        attributes: {
          specification: row.specification,
          colorName: row.submaterial_color_name,
          sizeLabel: row.size_label,
        },
      };

  return {
    id: row.id,
    companyId: row.company_id,
    workorderId: row.workorder_id,
    materialId: row.material_id,
    role: row.role,
    requiredQuantity: toNumberOrNull(row.required_quantity),
    unit: row.unit,
    orderStatus: row.order_status,
    memo: row.memo,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    material,
  };
}

const WORKORDER_MATERIAL_LINE_SELECT_SQL = `
  SELECT
    line.id,
    line.company_id,
    line.workorder_id,
    line.material_id,
    line.role,
    line.required_quantity,
    line.unit,
    line.order_status,
    line.memo,
    line.created_at,
    line.updated_at,
    material.company_id AS material_company_id,
    material.kind AS material_kind,
    material.code AS material_code,
    material.name AS material_name,
    material.category_id AS material_category_id,
    material.partner_id AS material_partner_id,
    material.unit AS material_unit,
    material.lifecycle_status AS material_lifecycle_status,
    material.memo AS material_memo,
    material.created_at AS material_created_at,
    material.updated_at AS material_updated_at,
    fabric.composition,
    fabric.width_value,
    fabric.width_unit,
    fabric.weight_value,
    fabric.weight_unit,
    fabric.color_name AS fabric_color_name,
    submaterial.specification,
    submaterial.color_name AS submaterial_color_name,
    submaterial.size_label
  FROM workorder_material_lines line
  INNER JOIN materials material
    ON material.company_id = line.company_id
   AND material.id = line.material_id
  LEFT JOIN material_attributes_fabric fabric
    ON fabric.material_id = material.id
  LEFT JOIN material_attributes_submaterial submaterial
    ON submaterial.material_id = material.id
`;

export async function listWorkorderMaterialLinesByCompany(input: {
  companyId: string;
  workorderId: string;
}): Promise<WorkorderMaterialLineWithMaterial[]> {
  const result = await queryDb<WorkorderMaterialLineRow>(
    `${WORKORDER_MATERIAL_LINE_SELECT_SQL}
     WHERE line.company_id = $1
       AND line.workorder_id = $2
     ORDER BY line.created_at ASC, material.kind ASC, material.name ASC`,
    [input.companyId, input.workorderId],
  );

  return result.rows.map(mapWorkorderMaterialLineRow);
}

export async function createWorkorderMaterialLineForCompany(input: WorkorderMaterialLineMutationInput): Promise<void> {
  await queryDb(
    `INSERT INTO workorder_material_lines (
       company_id,
       workorder_id,
       material_id,
       role,
       required_quantity,
       unit,
       order_status,
       memo
     )
     SELECT $1, sheet.id, material.id, $4, $5, $6, $7, $8
       FROM spec_sheets sheet
       INNER JOIN materials material
         ON material.company_id = sheet.company_id
        AND material.id = $3
      WHERE sheet.company_id = $1
        AND sheet.id = $2
      LIMIT 1`,
    [
      input.companyId,
      input.workorderId,
      input.materialId,
      input.role,
      input.requiredQuantity ?? null,
      input.unit,
      input.orderStatus ?? "not_requested",
      input.memo?.trim() || null,
    ],
  );
}

export async function deleteWorkorderMaterialLineForCompany(input: {
  companyId: string;
  workorderId: string;
  lineId: string;
}): Promise<void> {
  await queryDb(
    `DELETE FROM workorder_material_lines
      WHERE company_id = $1
        AND workorder_id = $2
        AND id = $3`,
    [input.companyId, input.workorderId, input.lineId],
  );
}

export async function updateWorkorderMaterialLineOrderStatusForCompany(input: {
  companyId: string;
  workorderId: string;
  lineId: string;
  orderStatus: MaterialOrderStatus;
}): Promise<void> {
  await queryDb(
    `UPDATE workorder_material_lines
        SET order_status = $4,
            updated_at = now()
      WHERE company_id = $1
        AND workorder_id = $2
        AND id = $3`,
    [input.companyId, input.workorderId, input.lineId, input.orderStatus],
  );
}
