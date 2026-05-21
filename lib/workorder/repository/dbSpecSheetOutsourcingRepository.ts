import "server-only";

import { queryDb, withDbTransaction } from "@/lib/db/client";
import { normalizeProductionOutsourcingRows } from "@/lib/workorder/productionCompositionSnapshot";
import type { Outsourcing, WorkOrder } from "@/types/workorder";

const SPEC_SHEET_OUTSOURCING_TABLE = "spec_sheet_outsourcing_lines";

const COMPANY_ID_COLUMN_CANDIDATES = ["company_id"] as const;
const SPEC_SHEET_ID_COLUMN_CANDIDATES = ["spec_sheet_id", "work_order_id"] as const;
const SOURCE_OUTSOURCING_ID_COLUMN_CANDIDATES = ["source_outsourcing_id", "outsourcing_id"] as const;
const PROCESS_COLUMN_CANDIDATES = ["process", "process_type", "outsourcing_process"] as const;
const VENDOR_COLUMN_CANDIDATES = ["vendor", "vendor_name"] as const;
const QUANTITY_COLUMN_CANDIDATES = ["quantity"] as const;
const UNIT_COLUMN_CANDIDATES = ["unit"] as const;
const UNIT_COST_COLUMN_CANDIDATES = ["unit_cost"] as const;
const TOTAL_COST_COLUMN_CANDIDATES = ["total_cost"] as const;
const STATUS_COLUMN_CANDIDATES = ["status"] as const;

type WorkOrderCompanyContext = {
  companyId: string;
};

function resolveWorkOrderCompanyContext(scope: WorkOrderCompanyContext): {
  companyId: string;
} {
  const companyId = scope.companyId.trim();
  if (!companyId) {
    throw new Error("COMPANY_SESSION_REQUIRED");
  }

  return {
    companyId,
  };
}

type DbColumnInfo = {
  column_name: string;
  data_type: string;
  udt_name: string;
};

type DbSpecSheetOutsourcingSchema = {
  hasTable: boolean;
  hasIdColumn: boolean;
  companyIdColumn: string | null;
  specSheetIdColumn: string | null;
  sourceOutsourcingIdColumn: string | null;
  processColumn: string | null;
  vendorColumn: string | null;
  quantityColumn: string | null;
  unitColumn: string | null;
  unitCostColumn: string | null;
  totalCostColumn: string | null;
  statusColumn: string | null;
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

function calculateOutsourcingTotalCost(item: Outsourcing): number {
  return normalizeNumber(item.quantity) * normalizeNumber(item.unitCost);
}

function normalizeOutsourcingForDb(item: Outsourcing): Outsourcing {
  return {
    ...item,
    quantity: normalizeNumber(item.quantity),
    unitCost: normalizeNumber(item.unitCost),
    totalCost: calculateOutsourcingTotalCost(item),
  };
}

function toOutsourcingRows(workOrder: WorkOrder): Outsourcing[] {
  return normalizeProductionOutsourcingRows(workOrder.outsourcing).map(normalizeOutsourcingForDb).filter((item) => {
    if (!item) return false;
    return Boolean(
      normalizeText(item.process) ||
      normalizeText(item.vendor) ||
      normalizeText(item.unitType) ||
      normalizeText(item.status) ||
      normalizeNumber(item.quantity) > 0 ||
      normalizeNumber(item.unitCost) > 0 ||
      normalizeNumber(item.totalCost) > 0,
    );
  });
}

let specSheetOutsourcingSchemaCache: Promise<DbSpecSheetOutsourcingSchema> | null = null;

async function readSpecSheetOutsourcingSchema(): Promise<DbSpecSheetOutsourcingSchema> {
  const result = await queryDb<DbColumnInfo>(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
    `,
    [SPEC_SHEET_OUTSOURCING_TABLE],
  );

  const columns = result.rows;
  const columnNames = columns.map((row) => row.column_name);

  if (columnNames.length === 0) {
    return {
      hasTable: false,
      hasIdColumn: false,
      companyIdColumn: null,
      specSheetIdColumn: null,
      sourceOutsourcingIdColumn: null,
      processColumn: null,
      vendorColumn: null,
      quantityColumn: null,
      unitColumn: null,
      unitCostColumn: null,
      totalCostColumn: null,
      statusColumn: null,
    };
  }

  return {
    hasTable: true,
    hasIdColumn: columnNames.includes("id"),
    companyIdColumn: findFirstMatchingColumn(columnNames, COMPANY_ID_COLUMN_CANDIDATES),
    specSheetIdColumn: findFirstMatchingColumn(columnNames, SPEC_SHEET_ID_COLUMN_CANDIDATES),
    sourceOutsourcingIdColumn: findFirstMatchingColumn(columnNames, SOURCE_OUTSOURCING_ID_COLUMN_CANDIDATES),
    processColumn: findFirstMatchingColumn(columnNames, PROCESS_COLUMN_CANDIDATES),
    vendorColumn: findFirstMatchingColumn(columnNames, VENDOR_COLUMN_CANDIDATES),
    quantityColumn: findFirstMatchingColumn(columnNames, QUANTITY_COLUMN_CANDIDATES),
    unitColumn: findFirstMatchingColumn(columnNames, UNIT_COLUMN_CANDIDATES),
    unitCostColumn: findFirstMatchingColumn(columnNames, UNIT_COST_COLUMN_CANDIDATES),
    totalCostColumn: findFirstMatchingColumn(columnNames, TOTAL_COST_COLUMN_CANDIDATES),
    statusColumn: findFirstMatchingColumn(columnNames, STATUS_COLUMN_CANDIDATES),
  };
}

function loadSpecSheetOutsourcingSchema(): Promise<DbSpecSheetOutsourcingSchema> {
  if (!specSheetOutsourcingSchemaCache) {
    specSheetOutsourcingSchemaCache = readSpecSheetOutsourcingSchema().catch((error) => {
      specSheetOutsourcingSchemaCache = null;
      throw error;
    });
  }

  return specSheetOutsourcingSchemaCache;
}

function canSyncSpecSheetOutsourcing(schema: DbSpecSheetOutsourcingSchema): boolean {
  return schema.hasTable && schema.hasIdColumn && Boolean(schema.specSheetIdColumn);
}

function buildSpecSheetOutsourcingId(workOrderId: string, item: Outsourcing, index: number): string {
  return `${workOrderId}:outsourcing:${item.id || index + 1}`;
}

export async function syncDbSpecSheetOutsourcingForSpecSheet(
  workOrder: WorkOrder,
  companyScope: WorkOrderCompanyContext,
): Promise<void> {
  const schema = await loadSpecSheetOutsourcingSchema();
  if (!canSyncSpecSheetOutsourcing(schema)) return;

  const specSheetIdColumn = schema.specSheetIdColumn!;
  const items = toOutsourcingRows(workOrder);
  const company = resolveWorkOrderCompanyContext(companyScope);

  await withDbTransaction(async (client) => {
    await client.query(
      `
        DELETE FROM ${quoteIdentifier(SPEC_SHEET_OUTSOURCING_TABLE)}
        WHERE ${quoteIdentifier(specSheetIdColumn)} = $1
      `,
      [workOrder.id],
    );

    for (const [index, item] of items.entries()) {
      const id = buildSpecSheetOutsourcingId(workOrder.id, item, index);
      const columns = ["id", specSheetIdColumn];
      const values: unknown[] = [id, workOrder.id];
      const placeholders = ["$1", "$2"];

      if (schema.companyIdColumn) {
        columns.push(schema.companyIdColumn);
        values.push(company.companyId);
        placeholders.push(`$${values.length}`);
      }


      if (schema.sourceOutsourcingIdColumn) {
        columns.push(schema.sourceOutsourcingIdColumn);
        values.push(item.id);
        placeholders.push(`$${values.length}`);
      }

      if (schema.processColumn) {
        columns.push(schema.processColumn);
        values.push(normalizeText(item.process) || null);
        placeholders.push(`$${values.length}`);
      }

      if (schema.vendorColumn) {
        columns.push(schema.vendorColumn);
        values.push(normalizeText(item.vendor) || null);
        placeholders.push(`$${values.length}`);
      }

      if (schema.quantityColumn) {
        columns.push(schema.quantityColumn);
        values.push(normalizeNumber(item.quantity));
        placeholders.push(`$${values.length}`);
      }

      if (schema.unitColumn) {
        columns.push(schema.unitColumn);
        values.push(normalizeText(item.unitType) || null);
        placeholders.push(`$${values.length}`);
      }

      if (schema.unitCostColumn) {
        columns.push(schema.unitCostColumn);
        values.push(normalizeNumber(item.unitCost));
        placeholders.push(`$${values.length}`);
      }

      if (schema.totalCostColumn) {
        columns.push(schema.totalCostColumn);
        values.push(calculateOutsourcingTotalCost(item));
        placeholders.push(`$${values.length}`);
      }

      if (schema.statusColumn) {
        columns.push(schema.statusColumn);
        values.push(normalizeText(item.status) || null);
        placeholders.push(`$${values.length}`);
      }


      await client.query(
        `
          INSERT INTO ${quoteIdentifier(SPEC_SHEET_OUTSOURCING_TABLE)} (
            ${columns.map(quoteIdentifier).join(", ")}
          )
          VALUES (
            ${placeholders.join(", ")}
          )
        `,
        values,
      );
    }
  });
}
