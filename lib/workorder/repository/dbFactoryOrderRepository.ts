import "server-only";

import { queryDb } from "@/lib/db/client";
import { ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import { WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import { normalizeProductionOrderEntries } from "@/lib/workorder/productionCompositionSnapshot";
import type { OrderEntry, WorkOrder } from "@/types/workorder";

const FACTORY_ORDER_TABLE = "orders";

const SOURCE_ORDER_ENTRY_ID_COLUMN_CANDIDATES = ["source_order_entry_id", "order_entry_id"] as const;
const COMPANY_ID_COLUMN_CANDIDATES = ["company_id"] as const;
const SPEC_SHEET_ID_COLUMN_CANDIDATES = ["spec_sheet_id", "work_order_id"] as const;
const FACTORY_PARTNER_ID_COLUMN_CANDIDATES = ["factory_partner_id", "factory_id"] as const;
const FACTORY_NAME_COLUMN_CANDIDATES = ["factory_name", "factory"] as const;
const QUANTITY_COLUMN_CANDIDATES = ["quantity"] as const;
const DUE_DATE_COLUMN_CANDIDATES = ["due_date"] as const;
const STATUS_COLUMN_CANDIDATES = ["status", "workflow_state", "state"] as const;
const LABOR_COST_COLUMN_CANDIDATES = ["labor_cost", "laborCost"] as const;
const LOSS_COST_COLUMN_CANDIDATES = ["loss_cost", "lossCost"] as const;

const FACTORY_ORDER_STATUS = {
  draft: WORKFLOW_STATE.draft,
  requested: "requested",
  inspection: WORKFLOW_STATE.inspection,
  completed: WORKFLOW_STATE.completed,
} as const;

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

type DbFactoryOrderSchema = {
  hasTable: boolean;
  hasIdColumn: boolean;
  companyIdColumn: string | null;
  specSheetIdColumn: string | null;
  sourceOrderEntryIdColumn: string | null;
  factoryPartnerIdColumn: string | null;
  factoryNameColumn: string | null;
  quantityColumn: string | null;
  dueDateColumn: string | null;
  dueDateColumnKind: "date" | "text" | null;
  statusColumn: string | null;
  laborCostColumn: string | null;
  lossCostColumn: string | null;
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

function normalizeQuantity(value: unknown): number {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.trunc(numeric));
}

type FactoryPartnerResolution = {
  id: string;
  name: string;
};

async function resolveActiveFactoryPartnerByIdOrName(
  payload: { factoryId?: string | null; factoryName?: string | null },
  companyScope: WorkOrderCompanyContext,
): Promise<FactoryPartnerResolution | null> {
  const factoryId = normalizeText(payload.factoryId);
  const factoryName = normalizeText(payload.factoryName);

  if (!factoryId && !factoryName) return null;

  const company = resolveWorkOrderCompanyContext(companyScope);
  const conditions: string[] = [
    "p.company_id = $1",
    "pi.company_id = $1",
    "p.is_active = true",
    "pi.is_active = true",
    "pi.item_type = 'factory'",
  ];
  const params: unknown[] = [company.companyId];

  if (factoryId) {
    params.push(factoryId);
    conditions.push(`p.id = $${params.length}`);
  }

  if (factoryName) {
    params.push(factoryName);
    conditions.push(`p.name = $${params.length}`);
  }

  const result = await queryDb<FactoryPartnerResolution>(
    `SELECT p.id, p.name
     FROM partners p
     INNER JOIN partner_items pi ON pi.partner_id = p.id
     WHERE ${conditions.join(" AND ")}
     LIMIT 1`,
    params,
  );

  return result.rows[0] ?? null;
}

function normalizeDateValue(value: unknown, kind: DbFactoryOrderSchema["dueDateColumnKind"]): string | null {
  const text = normalizeText(value);
  if (!text) return null;
  if (kind !== "date") return text;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return null;
}

function resolveFactoryOrderStatus(workOrder: WorkOrder, entry: OrderEntry): string {
  if (workOrder.workflowState === WORKFLOW_STATE.completed || entry.inspectionStatus === "inspection_completed") return FACTORY_ORDER_STATUS.completed;
  if (workOrder.workflowState === WORKFLOW_STATE.inspection) return FACTORY_ORDER_STATUS.inspection;
  if (workOrder.factoryOrderRequest) return FACTORY_ORDER_STATUS.requested;
  return FACTORY_ORDER_STATUS.draft;
}

function toFactoryOrderEntries(workOrder: WorkOrder): OrderEntry[] {
  return normalizeProductionOrderEntries(workOrder.orderEntries, workOrder.workflowState).filter((entry) => {
    if (!entry) return false;
    const targetType = entry.targetType ?? ORDER_ENTRY_TARGET_TYPE.factory;
    if (targetType !== ORDER_ENTRY_TARGET_TYPE.factory) return false;

    return Boolean(normalizeText(entry.factory) || normalizeText(entry.dueDate) || normalizeQuantity(entry.quantity) > 0);
  });
}

let factoryOrderSchemaCache: Promise<DbFactoryOrderSchema> | null = null;

async function readFactoryOrderSchema(): Promise<DbFactoryOrderSchema> {
  const result = await queryDb<DbColumnInfo>(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
    `,
    [FACTORY_ORDER_TABLE],
  );

  const columns = result.rows;
  const columnNames = columns.map((row) => row.column_name);

  if (columnNames.length === 0) {
    return {
      hasTable: false,
      hasIdColumn: false,
      companyIdColumn: null,
      specSheetIdColumn: null,
      sourceOrderEntryIdColumn: null,
      factoryPartnerIdColumn: null,
      factoryNameColumn: null,
      quantityColumn: null,
      dueDateColumn: null,
      dueDateColumnKind: null,
      statusColumn: null,
      laborCostColumn: null,
      lossCostColumn: null,
    };
  }

  const dueDateColumn = findFirstMatchingColumn(columnNames, DUE_DATE_COLUMN_CANDIDATES);
  const dueDateColumnInfo = dueDateColumn ? columns.find((column) => column.column_name === dueDateColumn) : undefined;
  const dueDateColumnKind = dueDateColumnInfo?.udt_name === "date" ? "date" : dueDateColumn ? "text" : null;

  return {
    hasTable: true,
    hasIdColumn: columnNames.includes("id"),
    companyIdColumn: findFirstMatchingColumn(columnNames, COMPANY_ID_COLUMN_CANDIDATES),
    specSheetIdColumn: findFirstMatchingColumn(columnNames, SPEC_SHEET_ID_COLUMN_CANDIDATES),
    sourceOrderEntryIdColumn: findFirstMatchingColumn(columnNames, SOURCE_ORDER_ENTRY_ID_COLUMN_CANDIDATES),
    factoryPartnerIdColumn: findFirstMatchingColumn(columnNames, FACTORY_PARTNER_ID_COLUMN_CANDIDATES),
    factoryNameColumn: findFirstMatchingColumn(columnNames, FACTORY_NAME_COLUMN_CANDIDATES),
    quantityColumn: findFirstMatchingColumn(columnNames, QUANTITY_COLUMN_CANDIDATES),
    dueDateColumn,
    dueDateColumnKind,
    statusColumn: findFirstMatchingColumn(columnNames, STATUS_COLUMN_CANDIDATES),
    laborCostColumn: findFirstMatchingColumn(columnNames, LABOR_COST_COLUMN_CANDIDATES),
    lossCostColumn: findFirstMatchingColumn(columnNames, LOSS_COST_COLUMN_CANDIDATES),
  };
}

function loadFactoryOrderSchema(): Promise<DbFactoryOrderSchema> {
  if (!factoryOrderSchemaCache) {
    factoryOrderSchemaCache = readFactoryOrderSchema().catch((error) => {
      factoryOrderSchemaCache = null;
      throw error;
    });
  }

  return factoryOrderSchemaCache;
}

function canSyncFactoryOrders(schema: DbFactoryOrderSchema): boolean {
  return schema.hasTable && schema.hasIdColumn && Boolean(schema.specSheetIdColumn);
}

function buildFactoryOrderId(workOrderId: string, entry: OrderEntry, index: number): string {
  return `${workOrderId}:factory:${entry.id || index + 1}`;
}

export async function syncDbFactoryOrdersForSpecSheet(
  workOrder: WorkOrder,
  companyScope: WorkOrderCompanyContext,
): Promise<void> {
  const schema = await loadFactoryOrderSchema();
  if (!canSyncFactoryOrders(schema)) return;

  const specSheetIdColumn = schema.specSheetIdColumn!;
  const entries = toFactoryOrderEntries(workOrder);
  const company = resolveWorkOrderCompanyContext(companyScope);
  const requestedFactory = workOrder.factoryOrderRequest
    ? await resolveActiveFactoryPartnerByIdOrName(
        {
          factoryId: workOrder.factoryOrderRequest.factoryId,
          factoryName: workOrder.factoryOrderRequest.factoryName,
        },
        company,
      )
    : null;

  if (workOrder.factoryOrderRequest && !requestedFactory) {
    throw new Error("FACTORY_PARTNER_ID_NOT_FOUND");
  }

  await queryDb("BEGIN");

  try {
    await queryDb(
      `DELETE FROM ${quoteIdentifier(FACTORY_ORDER_TABLE)}
        WHERE ${quoteIdentifier(specSheetIdColumn)} = $1
          ${schema.companyIdColumn ? `AND ${quoteIdentifier(schema.companyIdColumn)} = $2` : ""}`,
      schema.companyIdColumn ? [workOrder.id, company.companyId] : [workOrder.id],
    );

    for (const [index, entry] of entries.entries()) {
    const id = buildFactoryOrderId(workOrder.id, entry, index);
    const columns = ["id", specSheetIdColumn];
    const values: unknown[] = [id, workOrder.id];
    const placeholders = ["$1", "$2"];
    if (schema.companyIdColumn) {
      columns.push(schema.companyIdColumn);
      values.push(company.companyId);
      placeholders.push(`$${values.length}`);
    }


    if (schema.sourceOrderEntryIdColumn) {
      columns.push(schema.sourceOrderEntryIdColumn);
      values.push(entry.id);
      placeholders.push(`$${values.length}`);
    }

    if (schema.factoryPartnerIdColumn) {
      columns.push(schema.factoryPartnerIdColumn);
      values.push(requestedFactory?.id ?? null);
      placeholders.push(`$${values.length}`);
    }

    if (schema.factoryNameColumn) {
      columns.push(schema.factoryNameColumn);
      values.push(normalizeText(entry.factory) || requestedFactory?.name || normalizeText(workOrder.factoryOrderRequest?.factoryName) || null);
      placeholders.push(`$${values.length}`);
    }

    if (schema.quantityColumn) {
      columns.push(schema.quantityColumn);
      values.push(normalizeQuantity(entry.quantity));
      placeholders.push(`$${values.length}`);
    }

    if (schema.dueDateColumn) {
      columns.push(schema.dueDateColumn);
      values.push(normalizeDateValue(entry.dueDate, schema.dueDateColumnKind));
      placeholders.push(`$${values.length}`);
    }

    if (schema.statusColumn) {
      columns.push(schema.statusColumn);
      values.push(resolveFactoryOrderStatus(workOrder, entry));
      placeholders.push(`$${values.length}`);
    }

    if (schema.laborCostColumn) {
      columns.push(schema.laborCostColumn);
      values.push(normalizeQuantity(entry.laborCost));
      placeholders.push(`$${values.length}`);
    }

    if (schema.lossCostColumn) {
      columns.push(schema.lossCostColumn);
      values.push(normalizeQuantity(entry.lossCost));
      placeholders.push(`$${values.length}`);
    }


    await queryDb(
      `
        INSERT INTO ${quoteIdentifier(FACTORY_ORDER_TABLE)} (
          ${columns.map(quoteIdentifier).join(", ")}
        )
        VALUES (
          ${placeholders.join(", ")}
        )
      `,
      values,
    );
    }

    await queryDb("COMMIT");
  } catch (error) {
    await queryDb("ROLLBACK");
    throw error;
  }
}
