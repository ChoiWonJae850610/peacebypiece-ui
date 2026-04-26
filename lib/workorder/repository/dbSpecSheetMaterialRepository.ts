import "server-only";

import { queryDb } from "@/lib/db/client";
import type { Material } from "@/types/material";
import type { WorkOrder } from "@/types/workorder";

const SPEC_SHEET_MATERIAL_TABLE = "spec_sheet_materials";

const SPEC_SHEET_ID_COLUMN_CANDIDATES = ["spec_sheet_id", "work_order_id"] as const;
const MATERIAL_TYPE_COLUMN_CANDIDATES = ["material_type", "type"] as const;
const NAME_COLUMN_CANDIDATES = ["name", "material_name"] as const;
const VENDOR_COLUMN_CANDIDATES = ["vendor", "vendor_name"] as const;
const QUANTITY_COLUMN_CANDIDATES = ["quantity"] as const;
const UNIT_COLUMN_CANDIDATES = ["unit"] as const;
const UNIT_COST_COLUMN_CANDIDATES = ["unit_cost"] as const;
const TOTAL_COST_COLUMN_CANDIDATES = ["total_cost"] as const;
const STATUS_COLUMN_CANDIDATES = ["status"] as const;
const PAYLOAD_COLUMN_CANDIDATES = ["payload", "data"] as const;
const IS_ACTIVE_COLUMN_CANDIDATES = ["is_active"] as const;
const DELETED_AT_COLUMN_CANDIDATES = ["deleted_at"] as const;
const CREATED_AT_COLUMN_CANDIDATES = ["created_at"] as const;
const UPDATED_AT_COLUMN_CANDIDATES = ["updated_at"] as const;

type DbColumnInfo = {
  column_name: string;
  data_type: string;
  udt_name: string;
};

type DbSpecSheetMaterialSchema = {
  hasTable: boolean;
  hasIdColumn: boolean;
  specSheetIdColumn: string | null;
  materialTypeColumn: string | null;
  nameColumn: string | null;
  vendorColumn: string | null;
  quantityColumn: string | null;
  unitColumn: string | null;
  unitCostColumn: string | null;
  totalCostColumn: string | null;
  statusColumn: string | null;
  payloadColumn: string | null;
  isActiveColumn: string | null;
  deletedAtColumn: string | null;
  createdAtColumn: string | null;
  updatedAtColumn: string | null;
};

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function findFirstMatchingColumn(columnNames: string[], candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    if (columnNames.includes(candidate)) return candidate;
  }
  return null;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown): number {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

function calculateMaterialTotalCost(material: Material): number {
  return normalizeNumber(material.quantity) * normalizeNumber(material.unitCost);
}

function normalizeMaterialForDb(material: Material): Material {
  return {
    ...material,
    quantity: normalizeNumber(material.quantity),
    unitCost: normalizeNumber(material.unitCost),
    totalCost: calculateMaterialTotalCost(material),
  };
}

function toMaterialRows(workOrder: WorkOrder): Material[] {
  return (workOrder.materials ?? []).map(normalizeMaterialForDb).filter((material) => {
    if (!material) return false;
    return Boolean(
      normalizeText(material.type) ||
      normalizeText(material.name) ||
      normalizeText(material.vendor) ||
      normalizeNumber(material.quantity) > 0 ||
      normalizeNumber(material.unitCost) > 0 ||
      normalizeNumber(material.totalCost) > 0,
    );
  });
}

async function loadSpecSheetMaterialSchema(): Promise<DbSpecSheetMaterialSchema> {
  const result = await queryDb<DbColumnInfo>(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
    `,
    [SPEC_SHEET_MATERIAL_TABLE],
  );

  const columns = result.rows;
  const columnNames = columns.map((row) => row.column_name);

  if (columnNames.length === 0) {
    return {
      hasTable: false,
      hasIdColumn: false,
      specSheetIdColumn: null,
      materialTypeColumn: null,
      nameColumn: null,
      vendorColumn: null,
      quantityColumn: null,
      unitColumn: null,
      unitCostColumn: null,
      totalCostColumn: null,
      statusColumn: null,
      payloadColumn: null,
      isActiveColumn: null,
      deletedAtColumn: null,
      createdAtColumn: null,
      updatedAtColumn: null,
    };
  }

  return {
    hasTable: true,
    hasIdColumn: columnNames.includes("id"),
    specSheetIdColumn: findFirstMatchingColumn(columnNames, SPEC_SHEET_ID_COLUMN_CANDIDATES),
    materialTypeColumn: findFirstMatchingColumn(columnNames, MATERIAL_TYPE_COLUMN_CANDIDATES),
    nameColumn: findFirstMatchingColumn(columnNames, NAME_COLUMN_CANDIDATES),
    vendorColumn: findFirstMatchingColumn(columnNames, VENDOR_COLUMN_CANDIDATES),
    quantityColumn: findFirstMatchingColumn(columnNames, QUANTITY_COLUMN_CANDIDATES),
    unitColumn: findFirstMatchingColumn(columnNames, UNIT_COLUMN_CANDIDATES),
    unitCostColumn: findFirstMatchingColumn(columnNames, UNIT_COST_COLUMN_CANDIDATES),
    totalCostColumn: findFirstMatchingColumn(columnNames, TOTAL_COST_COLUMN_CANDIDATES),
    statusColumn: findFirstMatchingColumn(columnNames, STATUS_COLUMN_CANDIDATES),
    payloadColumn: findFirstMatchingColumn(columnNames, PAYLOAD_COLUMN_CANDIDATES),
    isActiveColumn: findFirstMatchingColumn(columnNames, IS_ACTIVE_COLUMN_CANDIDATES),
    deletedAtColumn: findFirstMatchingColumn(columnNames, DELETED_AT_COLUMN_CANDIDATES),
    createdAtColumn: findFirstMatchingColumn(columnNames, CREATED_AT_COLUMN_CANDIDATES),
    updatedAtColumn: findFirstMatchingColumn(columnNames, UPDATED_AT_COLUMN_CANDIDATES),
  };
}

function canSyncSpecSheetMaterials(schema: DbSpecSheetMaterialSchema): boolean {
  return schema.hasTable && schema.hasIdColumn && Boolean(schema.specSheetIdColumn);
}

function buildSpecSheetMaterialId(workOrderId: string, material: Material, index: number): string {
  return `${workOrderId}:material:${material.id || index + 1}`;
}

export async function syncDbSpecSheetMaterialsForSpecSheet(workOrder: WorkOrder): Promise<void> {
  const schema = await loadSpecSheetMaterialSchema();
  if (!canSyncSpecSheetMaterials(schema)) return;

  const specSheetIdColumn = schema.specSheetIdColumn!;
  const materials = toMaterialRows(workOrder);
  const activeIds = materials.map((material, index) => buildSpecSheetMaterialId(workOrder.id, material, index));

  if (materials.length === 0) {
    await queryDb(
      `
        ${schema.isActiveColumn
          ? `UPDATE ${quoteIdentifier(SPEC_SHEET_MATERIAL_TABLE)} SET ${quoteIdentifier(schema.isActiveColumn)} = FALSE${schema.deletedAtColumn ? `, ${quoteIdentifier(schema.deletedAtColumn)} = NOW()` : ""} WHERE ${quoteIdentifier(specSheetIdColumn)} = $1`
          : `DELETE FROM ${quoteIdentifier(SPEC_SHEET_MATERIAL_TABLE)} WHERE ${quoteIdentifier(specSheetIdColumn)} = $1`}
      `,
      [workOrder.id],
    );
    return;
  }

  for (const [index, material] of materials.entries()) {
    const id = buildSpecSheetMaterialId(workOrder.id, material, index);
    const columns = ["id", specSheetIdColumn];
    const values: unknown[] = [id, workOrder.id];
    const placeholders = ["$1", "$2"];

    if (schema.materialTypeColumn) {
      columns.push(schema.materialTypeColumn);
      values.push(normalizeText(material.type) || null);
      placeholders.push(`$${values.length}`);
    }

    if (schema.nameColumn) {
      columns.push(schema.nameColumn);
      values.push(normalizeText(material.name) || null);
      placeholders.push(`$${values.length}`);
    }

    if (schema.vendorColumn) {
      columns.push(schema.vendorColumn);
      values.push(normalizeText(material.vendor) || null);
      placeholders.push(`$${values.length}`);
    }

    if (schema.quantityColumn) {
      columns.push(schema.quantityColumn);
      values.push(normalizeNumber(material.quantity));
      placeholders.push(`$${values.length}`);
    }

    if (schema.unitColumn) {
      columns.push(schema.unitColumn);
      values.push(normalizeText(material.unit) || null);
      placeholders.push(`$${values.length}`);
    }

    if (schema.unitCostColumn) {
      columns.push(schema.unitCostColumn);
      values.push(normalizeNumber(material.unitCost));
      placeholders.push(`$${values.length}`);
    }

    if (schema.totalCostColumn) {
      columns.push(schema.totalCostColumn);
      values.push(calculateMaterialTotalCost(material));
      placeholders.push(`$${values.length}`);
    }

    if (schema.statusColumn) {
      columns.push(schema.statusColumn);
      values.push(normalizeText(material.status) || null);
      placeholders.push(`$${values.length}`);
    }

    if (schema.payloadColumn) {
      columns.push(schema.payloadColumn);
      values.push(JSON.stringify(normalizeMaterialForDb(material)));
      placeholders.push(`$${values.length}::jsonb`);
    }

    if (schema.isActiveColumn) {
      columns.push(schema.isActiveColumn);
      values.push(true);
      placeholders.push(`$${values.length}`);
    }

    if (schema.deletedAtColumn) {
      columns.push(schema.deletedAtColumn);
      values.push(null);
      placeholders.push(`$${values.length}`);
    }

    const updateAssignments = columns
      .filter((column) => column !== "id")
      .map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`);

    if (schema.updatedAtColumn && !columns.includes(schema.updatedAtColumn)) {
      updateAssignments.push(`${quoteIdentifier(schema.updatedAtColumn)} = NOW()`);
    }

    await queryDb(
      `
        INSERT INTO ${quoteIdentifier(SPEC_SHEET_MATERIAL_TABLE)} (
          ${columns.map(quoteIdentifier).join(", ")}
        )
        VALUES (
          ${placeholders.join(", ")}
        )
        ON CONFLICT (id) DO UPDATE SET
          ${updateAssignments.join(",\n          ")}
      `,
      values,
    );
  }

  await queryDb(
    `
      ${schema.isActiveColumn
        ? `UPDATE ${quoteIdentifier(SPEC_SHEET_MATERIAL_TABLE)} SET ${quoteIdentifier(schema.isActiveColumn)} = FALSE${schema.deletedAtColumn ? `, ${quoteIdentifier(schema.deletedAtColumn)} = NOW()` : ""} WHERE ${quoteIdentifier(specSheetIdColumn)} = $1 AND NOT (id = ANY($2::text[]))`
        : `DELETE FROM ${quoteIdentifier(SPEC_SHEET_MATERIAL_TABLE)} WHERE ${quoteIdentifier(specSheetIdColumn)} = $1 AND NOT (id = ANY($2::text[]))`}
    `,
    [workOrder.id, activeIds],
  );
}
