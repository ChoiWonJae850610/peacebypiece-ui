import "server-only";

import { WORK_ORDER_KIND } from "@/lib/constants/workorderIdentity";
import { queryDb } from "@/lib/db/client";
import { normalizeMaterialUnitValue } from "@/lib/constants/material";
import {
  DEFAULT_WORKFLOW_STATE,
  WORKFLOW_STATE,
} from "@/lib/constants/workorderStates";
import {
  DEFAULT_WORK_ORDER_LIST_SORT,
  DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
  isWorkflowStateStatusFilter,
  type WorkOrderListSort,
  type WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import { ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import type { Material } from "@/types/material";
import type {
  OrderEntry,
  Outsourcing,
  WorkOrder,
  WorkOrderStatePatch,
  WorkOrderSummary,
} from "@/types/workorder";
import {
  normalizeWorkOrderVisibilityScope,
  resolveWorkOrderCompanyId,
  resolveWorkOrderCompanyScope,
  type WorkOrderCompanyScope,
  type WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import { resolveCategoryIdsForDb } from "@/lib/workorder/repository/dbWorkOrderCategoryResolvers";
import type { DbSpecSheetRow, DbSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import {
  mapSpecSheetRowToWorkOrder,
  mapSpecSheetRowToWorkOrderSummary,
  normalizeDbWorkflowState,
  normalizeWorkOrderForDb,
  readNumberRowValue,
} from "@/lib/workorder/repository/dbWorkOrderRowMappers";
import {
  assertMinimumSpecSheetSchema,
  loadSpecSheetSchema,
} from "@/lib/workorder/repository/dbWorkOrderSchemaReader";
import {
  buildSpecSheetSelectByIdQuery,
  buildSpecSheetSelectQuery,
  buildSpecSheetSummarySelectQuery,
} from "@/lib/workorder/repository/dbWorkOrderSelectSql";
import {
  appendNormalizedWorkOrderInsertColumns,
  appendNormalizedWorkOrderUpdateAssignments,
} from "@/lib/workorder/repository/dbWorkOrderAssignmentBuilders";
import {
  buildSpecSheetCompanyScopePredicate,
  buildSoftDeleteSpecSheetAssignments,
  softDeleteAttachmentMemoBundleForWorkOrder,
} from "@/lib/workorder/repository/dbWorkOrderDeleteHelpers";
import {
  mergeWorkOrderWithExistingProductionDetails,
  shouldSyncProductionCompositionForFullWorkOrderSave,
  syncCreatedWorkOrderProductionComposition,
  syncPatchedWorkOrderProductionComposition,
} from "@/lib/workorder/repository/dbWorkOrderProductionSync";
export type {
  WorkOrderCompanyScope,
  WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

const SPEC_SHEET_TABLE = "spec_sheets";
function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function buildAliasSelection(
  columnName: string | null,
  alias: keyof DbSpecSheetRow,
  fallbackSql: string,
): string {
  if (!columnName) {
    return `${fallbackSql} AS ${alias}`;
  }

  return `${quoteIdentifier(columnName)} AS ${alias}`;
}

async function loadActiveSpecSheetRows(
  scope?: WorkOrderCompanyScope | null,
): Promise<DbSpecSheetRow[]> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const query = buildSpecSheetSelectQuery(schema, scope);
  const result = await queryDb<DbSpecSheetRow>(
    query.sql,
    query.values.length > 0 ? query.values : undefined,
  );

  return result.rows;
}

type WorkOrderSummaryQueryOptions = {
  status?: WorkOrderListStatusFilter;
  sort?: WorkOrderListSort;
};

async function loadActiveSpecSheetSummaryRows(
  options: WorkOrderSummaryQueryOptions = {},
  scope?: WorkOrderCompanyScope | null,
): Promise<DbSpecSheetRow[]> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const query = buildSpecSheetSummarySelectQuery(schema, options, scope);
  const result = await queryDb<DbSpecSheetRow>(
    query.sql,
    query.values.length > 0 ? query.values : undefined,
  );

  return result.rows;
}

type DbOrderEntryRow = {
  id: string;
  spec_sheet_id: string;
  source_order_entry_id: string | null;
  factory_name: string | null;
  quantity: number | null;
  due_date: string | null;
  labor_cost: number | null;
  loss_cost: number | null;
  status: string | null;
};

type DbMaterialRow = {
  id: string;
  spec_sheet_id: string;
  material_type: Material["type"] | null;
  name: string | null;
  vendor: string | null;
  vendor_partner_id: string | null;
  vendor_partner_name: string | null;
  quantity: number | null;
  unit: Material["unit"] | null;
  unit_cost: number | null;
  total_cost: number | null;
  status: Material["status"] | null;
};

type DbOutsourcingRow = {
  id: string;
  spec_sheet_id: string;
  process: string | null;
  vendor: string | null;
  vendor_partner_id: string | null;
  vendor_partner_name: string | null;
  quantity: number | null;
  unit: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  status: string | null;
};

type WorkOrderDetailRows = {
  orderEntries: OrderEntry[];
  materials: Material[];
  outsourcing: Outsourcing[];
};

function getOrCreateDetailRows(
  map: Map<string, WorkOrderDetailRows>,
  workOrderId: string,
): WorkOrderDetailRows {
  const existing = map.get(workOrderId);
  if (existing) return existing;
  const created = { orderEntries: [], materials: [], outsourcing: [] };
  map.set(workOrderId, created);
  return created;
}

async function loadNormalizedDetailRowsByWorkOrderIds(
  workOrderIds: string[],
  scope?: WorkOrderCompanyScope | null,
): Promise<Map<string, WorkOrderDetailRows>> {
  const uniqueIds = Array.from(new Set(workOrderIds.filter(Boolean)));
  const rowsByWorkOrderId = new Map<string, WorkOrderDetailRows>();
  if (uniqueIds.length === 0) return rowsByWorkOrderId;

  const companyId = resolveWorkOrderCompanyId(scope);

  const [ordersResult, materialsResult, outsourcingResult] = await Promise.all([
    queryDb<DbOrderEntryRow>(
      `SELECT id,
              spec_sheet_id,
              source_order_entry_id,
              factory_name,
              quantity,
              due_date,
              labor_cost,
              loss_cost,
              status
         FROM orders
        WHERE company_id = $1
          AND spec_sheet_id = ANY($2::text[])
        ORDER BY id ASC`,
      [companyId, uniqueIds],
    ),
    queryDb<DbMaterialRow>(
      `SELECT m.id,
              m.spec_sheet_id,
              m.material_type,
              m.name,
              m.vendor,
              m.vendor_partner_id,
              p.name AS vendor_partner_name,
              m.quantity,
              m.unit,
              m.unit_cost,
              m.total_cost,
              m.status
         FROM spec_sheet_materials m
         LEFT JOIN partners p
           ON p.id = m.vendor_partner_id
          AND p.company_id = m.company_id
        WHERE m.company_id = $1
          AND m.spec_sheet_id = ANY($2::text[])
        ORDER BY m.id ASC`,
      [companyId, uniqueIds],
    ),
    queryDb<DbOutsourcingRow>(
      `SELECT ol.id,
              ol.spec_sheet_id,
              ol.process,
              ol.vendor,
              ol.vendor_partner_id,
              p.name AS vendor_partner_name,
              ol.quantity,
              ol.unit,
              ol.unit_cost,
              ol.total_cost,
              ol.status
         FROM spec_sheet_outsourcing_lines ol
         LEFT JOIN partners p
           ON p.id = ol.vendor_partner_id
          AND p.company_id = ol.company_id
        WHERE ol.company_id = $1
          AND ol.spec_sheet_id = ANY($2::text[])
        ORDER BY ol.id ASC`,
      [companyId, uniqueIds],
    ),
  ]);

  for (const row of ordersResult.rows) {
    getOrCreateDetailRows(
      rowsByWorkOrderId,
      row.spec_sheet_id,
    ).orderEntries.push({
      id: row.source_order_entry_id || row.id,
      type: "생산발주",
      targetType: ORDER_ENTRY_TARGET_TYPE.factory,
      factory: row.factory_name || "",
      dueDate: row.due_date || "",
      quantity: readNumberRowValue(row.quantity),
      laborCost: readNumberRowValue(row.labor_cost),
      lossCost: readNumberRowValue(row.loss_cost),
      priority: "",
    });
  }

  for (const row of materialsResult.rows) {
    getOrCreateDetailRows(rowsByWorkOrderId, row.spec_sheet_id).materials.push({
      id: row.id,
      type: row.material_type || "기타",
      name: row.name || "",
      vendor: row.vendor || row.vendor_partner_name || "",
      vendorPartnerId: row.vendor_partner_id ?? null,
      quantity: readNumberRowValue(row.quantity),
      unit: normalizeMaterialUnitValue(row.unit || "개"),
      unitCost: readNumberRowValue(row.unit_cost),
      totalCost: readNumberRowValue(row.total_cost),
      status: row.status || "준비",
    });
  }

  for (const row of outsourcingResult.rows) {
    getOrCreateDetailRows(
      rowsByWorkOrderId,
      row.spec_sheet_id,
    ).outsourcing.push({
      id: row.id,
      process: row.process || "",
      vendor: row.vendor || row.vendor_partner_name || "",
      vendorPartnerId: row.vendor_partner_id ?? null,
      quantity: readNumberRowValue(row.quantity),
      unitType: row.unit || "",
      unitCost: readNumberRowValue(row.unit_cost),
      totalCost: readNumberRowValue(row.total_cost),
      status: row.status || "",
    });
  }

  return rowsByWorkOrderId;
}

async function attachNormalizedDetailRows(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  const rowsByWorkOrderId = await loadNormalizedDetailRowsByWorkOrderIds(
    workOrders.map((workOrder) => workOrder.id),
    scope,
  );

  return workOrders.map((workOrder) => {
    const detailRows = rowsByWorkOrderId.get(workOrder.id);
    if (!detailRows) return workOrder;
    return {
      ...workOrder,
      orderEntries: detailRows.orderEntries,
      materials: detailRows.materials,
      outsourcing: detailRows.outsourcing,
    };
  });
}

export async function findDbWorkOrderSummaries(
  options: WorkOrderSummaryQueryOptions = {},
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrderSummary[]> {
  const rows = await loadActiveSpecSheetSummaryRows(options, scope);
  return rows.map(mapSpecSheetRowToWorkOrderSummary);
}

export async function findAllDbWorkOrders(
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  const rows = await loadActiveSpecSheetRows(scope);
  return attachNormalizedDetailRows(rows.map(mapSpecSheetRowToWorkOrder), scope);
}

export async function findDbWorkOrderById(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder | null> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const query = buildSpecSheetSelectByIdQuery(schema, workOrderId, scope);

  const result = await queryDb<DbSpecSheetRow>(
    query.sql,
    query.values,
  );
  const row = result.rows[0] ?? null;
  if (!row) return null;
  const [hydrated] = await attachNormalizedDetailRows([
    mapSpecSheetRowToWorkOrder(row),
  ], scope);
  return hydrated ?? mapSpecSheetRowToWorkOrder(row);
}

export async function createDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedBaseWorkOrder = normalizeWorkOrderForDb(workOrder);
  const resolvedCategoryIds = await resolveCategoryIdsForDb(
    normalizedBaseWorkOrder,
    scope,
  );
  const normalizedWorkOrder = {
    ...normalizedBaseWorkOrder,
    ...resolvedCategoryIds,
  };
  const columns = ["id", "title"];
  const values: unknown[] = [normalizedWorkOrder.id, normalizedWorkOrder.title];
  const placeholders = ["$1", "$2"];
  const company = resolveWorkOrderCompanyScope(scope);

  if (schema.companyIdColumn) {
    columns.push(schema.companyIdColumn);
    values.push(company.companyId);
    placeholders.push(`$${values.length}`);
  }

  if (schema.companyNameColumn) {
    columns.push(schema.companyNameColumn);
    values.push(company.companyName);
    placeholders.push(`$${values.length}`);
  }

  if (schema.workflowStateColumn) {
    columns.push(schema.workflowStateColumn);
    values.push(normalizedWorkOrder.workflowState);
    placeholders.push(`$${values.length}`);
  }

  if (schema.lastSavedAtColumn) {
    columns.push(schema.lastSavedAtColumn);
    values.push(normalizedWorkOrder.lastSavedAt);
    placeholders.push(`$${values.length}`);
  }

  if (schema.workOrderKindColumn) {
    columns.push(schema.workOrderKindColumn);
    values.push(normalizedWorkOrder.workOrderKind ?? WORK_ORDER_KIND.sample);
    placeholders.push(`$${values.length}`);
  }

  if (schema.reorderGroupIdColumn) {
    columns.push(schema.reorderGroupIdColumn);
    values.push(normalizedWorkOrder.reorderGroupId ?? normalizedWorkOrder.id);
    placeholders.push(`$${values.length}`);
  }

  if (schema.reorderRoundColumn) {
    columns.push(schema.reorderRoundColumn);
    values.push(normalizedWorkOrder.reorderRound ?? 0);
    placeholders.push(`$${values.length}`);
  }

  if (schema.parentSpecSheetIdColumn) {
    columns.push(schema.parentSpecSheetIdColumn);
    values.push(normalizedWorkOrder.parentSpecSheetId ?? null);
    placeholders.push(`$${values.length}`);
  }

  if (schema.isReworkColumn) {
    columns.push(schema.isReworkColumn);
    values.push(Boolean(normalizedWorkOrder.isDefectOrder));
    placeholders.push(`$${values.length}`);
  }

  if (schema.category1IdColumn) {
    columns.push(schema.category1IdColumn);
    values.push(normalizedWorkOrder.category1Id ?? null);
    placeholders.push(`$${values.length}`);
  }

  if (schema.category2IdColumn) {
    columns.push(schema.category2IdColumn);
    values.push(normalizedWorkOrder.category2Id ?? null);
    placeholders.push(`$${values.length}`);
  }

  if (schema.category3IdColumn) {
    columns.push(schema.category3IdColumn);
    values.push(normalizedWorkOrder.category3Id ?? null);
    placeholders.push(`$${values.length}`);
  }

  appendNormalizedWorkOrderInsertColumns(
    schema,
    normalizedWorkOrder,
    columns,
    values,
    placeholders,
  );

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

  const returningColumns = [
    "id",
    "title",
    buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL"),
    buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL"),
    buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL"),
    buildAliasSelection(
      schema.reorderGroupIdColumn,
      "reorder_group_id",
      "NULL",
    ),
    buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL"),
    buildAliasSelection(
      schema.parentSpecSheetIdColumn,
      "parent_spec_sheet_id",
      "NULL",
    ),
    buildAliasSelection(schema.isReworkColumn, "is_rework", "NULL"),
    buildAliasSelection(schema.category1IdColumn, "category1_id", "NULL"),
    buildAliasSelection(schema.category2IdColumn, "category2_id", "NULL"),
    buildAliasSelection(schema.category3IdColumn, "category3_id", "NULL"),
    buildAliasSelection(schema.displayTitleColumn, "display_title", "NULL"),
    buildAliasSelection(schema.baseTitleColumn, "base_title", "NULL"),
    buildAliasSelection(schema.category1Column, "category1", "NULL"),
    buildAliasSelection(schema.category2Column, "category2", "NULL"),
    buildAliasSelection(schema.category3Column, "category3", "NULL"),
    buildAliasSelection(schema.seasonColumn, "season", "NULL"),
    buildAliasSelection(schema.priorityColumn, "priority", "NULL"),
    buildAliasSelection(schema.vendorColumn, "vendor", "NULL"),
    buildAliasSelection(schema.managerColumn, "manager", "NULL"),
    buildAliasSelection(schema.managerIdColumn, "manager_id", "NULL"),
    buildAliasSelection(schema.createdByIdColumn, "created_by_id", "NULL"),
    buildAliasSelection(schema.createdByRoleColumn, "created_by_role", "NULL"),
    buildAliasSelection(schema.dueDateColumn, "due_date", "NULL"),
    buildAliasSelection(schema.quantityColumn, "quantity", "NULL"),
    buildAliasSelection(
      schema.inventoryQuantityColumn,
      "inventory_quantity",
      "NULL",
    ),
    buildAliasSelection(
      schema.inventoryStatusColumn,
      "inventory_status",
      "NULL",
    ),
    buildAliasSelection(schema.memoColumn, "memo", "NULL"),
    buildAliasSelection(schema.rejectionReasonColumn, "rejection_reason", "NULL"),
    buildAliasSelection(schema.rejectedAtColumn, "rejected_at", "NULL"),
    buildAliasSelection(schema.rejectedByUserIdColumn, "rejected_by_user_id", "NULL"),
    buildAliasSelection(schema.rejectedByNameColumn, "rejected_by_name", "NULL"),
    buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE"),
    buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL"),
    buildAliasSelection(schema.createdAtColumn, "created_at", "NULL"),
    buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL"),
  ];

  const result = await queryDb<DbSpecSheetRow>(
    `
      INSERT INTO ${quoteIdentifier(SPEC_SHEET_TABLE)} (
        ${columns.map(quoteIdentifier).join(", ")}
      )
      VALUES (
        ${placeholders.join(", ")}
      )
      RETURNING
        ${returningColumns.join(",\n        ")}
    `,
    values,
  );

  const created = result.rows[0];

  if (!created) {
    throw new Error("Failed to create work order in DB.");
  }

  const mapped = mapSpecSheetRowToWorkOrder(created);
  const persisted = {
    ...normalizedWorkOrder,
    ...mapped,
    orderEntries: normalizedWorkOrder.orderEntries ?? [],
    materials: normalizedWorkOrder.materials ?? [],
    outsourcing: normalizedWorkOrder.outsourcing ?? [],
  };
  await syncCreatedWorkOrderProductionComposition(persisted, company);
  return persisted;
}

function isNotFoundWorkOrderError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /spec_sheets row not found for id:/i.test(error.message)
  );
}

export async function updateDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedBaseWorkOrder = normalizeWorkOrderForDb(workOrder);
  const resolvedCategoryIds = await resolveCategoryIdsForDb(
    normalizedBaseWorkOrder,
    scope,
  );
  const normalizedWorkOrder = {
    ...normalizedBaseWorkOrder,
    ...resolvedCategoryIds,
  };
  const assignments = ["title = $2"];
  const values: unknown[] = [normalizedWorkOrder.id, normalizedWorkOrder.title];
  const company = resolveWorkOrderCompanyScope(scope);

  if (schema.companyIdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.companyIdColumn)} = $${values.length + 1}`,
    );
    values.push(company.companyId);
  }

  if (schema.companyNameColumn) {
    assignments.push(
      `${quoteIdentifier(schema.companyNameColumn)} = $${values.length + 1}`,
    );
    values.push(company.companyName);
  }

  if (schema.workflowStateColumn) {
    assignments.push(
      `${quoteIdentifier(schema.workflowStateColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.workflowState);
  }

  if (schema.lastSavedAtColumn) {
    assignments.push(
      `${quoteIdentifier(schema.lastSavedAtColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.lastSavedAt);
  }

  if (schema.workOrderKindColumn) {
    assignments.push(
      `${quoteIdentifier(schema.workOrderKindColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.workOrderKind ?? WORK_ORDER_KIND.sample);
  }

  if (schema.reorderGroupIdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.reorderGroupIdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.reorderGroupId ?? normalizedWorkOrder.id);
  }

  if (schema.reorderRoundColumn) {
    assignments.push(
      `${quoteIdentifier(schema.reorderRoundColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.reorderRound ?? 0);
  }

  if (schema.parentSpecSheetIdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.parentSpecSheetIdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.parentSpecSheetId ?? null);
  }

  if (schema.isReworkColumn) {
    assignments.push(
      `${quoteIdentifier(schema.isReworkColumn)} = $${values.length + 1}`,
    );
    values.push(Boolean(normalizedWorkOrder.isDefectOrder));
  }

  if (schema.category1IdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.category1IdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.category1Id ?? null);
  }

  if (schema.category2IdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.category2IdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.category2Id ?? null);
  }

  if (schema.category3IdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.category3IdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.category3Id ?? null);
  }

  appendNormalizedWorkOrderUpdateAssignments(
    schema,
    normalizedWorkOrder,
    assignments,
    values,
  );

  if (schema.isActiveColumn) {
    assignments.push(
      `${quoteIdentifier(schema.isActiveColumn)} = $${values.length + 1}`,
    );
    values.push(true);
  }

  if (schema.deletedAtColumn) {
    assignments.push(
      `${quoteIdentifier(schema.deletedAtColumn)} = $${values.length + 1}`,
    );
    values.push(null);
  }

  const returningColumns = [
    "id",
    "title",
    buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL"),
    buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL"),
    buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL"),
    buildAliasSelection(
      schema.reorderGroupIdColumn,
      "reorder_group_id",
      "NULL",
    ),
    buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL"),
    buildAliasSelection(
      schema.parentSpecSheetIdColumn,
      "parent_spec_sheet_id",
      "NULL",
    ),
    buildAliasSelection(schema.isReworkColumn, "is_rework", "NULL"),
    buildAliasSelection(schema.category1IdColumn, "category1_id", "NULL"),
    buildAliasSelection(schema.category2IdColumn, "category2_id", "NULL"),
    buildAliasSelection(schema.category3IdColumn, "category3_id", "NULL"),
    buildAliasSelection(schema.displayTitleColumn, "display_title", "NULL"),
    buildAliasSelection(schema.baseTitleColumn, "base_title", "NULL"),
    buildAliasSelection(schema.category1Column, "category1", "NULL"),
    buildAliasSelection(schema.category2Column, "category2", "NULL"),
    buildAliasSelection(schema.category3Column, "category3", "NULL"),
    buildAliasSelection(schema.seasonColumn, "season", "NULL"),
    buildAliasSelection(schema.priorityColumn, "priority", "NULL"),
    buildAliasSelection(schema.vendorColumn, "vendor", "NULL"),
    buildAliasSelection(schema.managerColumn, "manager", "NULL"),
    buildAliasSelection(schema.managerIdColumn, "manager_id", "NULL"),
    buildAliasSelection(schema.createdByIdColumn, "created_by_id", "NULL"),
    buildAliasSelection(schema.createdByRoleColumn, "created_by_role", "NULL"),
    buildAliasSelection(schema.dueDateColumn, "due_date", "NULL"),
    buildAliasSelection(schema.quantityColumn, "quantity", "NULL"),
    buildAliasSelection(
      schema.inventoryQuantityColumn,
      "inventory_quantity",
      "NULL",
    ),
    buildAliasSelection(
      schema.inventoryStatusColumn,
      "inventory_status",
      "NULL",
    ),
    buildAliasSelection(schema.memoColumn, "memo", "NULL"),
    buildAliasSelection(schema.rejectionReasonColumn, "rejection_reason", "NULL"),
    buildAliasSelection(schema.rejectedAtColumn, "rejected_at", "NULL"),
    buildAliasSelection(schema.rejectedByUserIdColumn, "rejected_by_user_id", "NULL"),
    buildAliasSelection(schema.rejectedByNameColumn, "rejected_by_name", "NULL"),
    buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE"),
    buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL"),
    buildAliasSelection(schema.createdAtColumn, "created_at", "NULL"),
    buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL"),
  ];

  const result = await queryDb<DbSpecSheetRow>(
    `
      UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
      SET
        ${assignments.join(",\n        ")}
      WHERE id = $1
        ${schema.companyIdColumn ? `AND ${quoteIdentifier(schema.companyIdColumn)} = ${quoteLiteral(company.companyId)}` : ""}
      RETURNING
        ${returningColumns.join(",\n        ")}
    `,
    values,
  );

  const updated = result.rows[0];

  if (!updated) {
    throw new Error(
      `spec_sheets row not found for id: ${normalizedWorkOrder.id}`,
    );
  }

  const mapped = mapSpecSheetRowToWorkOrder(updated);
  const shouldSyncProductionComposition = shouldSyncProductionCompositionForFullWorkOrderSave(normalizedWorkOrder);
  const existingWithDetails = shouldSyncProductionComposition
    ? null
    : await findDbWorkOrderById(normalizedWorkOrder.id, scope);
  const persisted = shouldSyncProductionComposition
    ? {
        ...normalizedWorkOrder,
        ...mapped,
        orderEntries: normalizedWorkOrder.orderEntries ?? [],
        materials: normalizedWorkOrder.materials ?? [],
        outsourcing: normalizedWorkOrder.outsourcing ?? [],
      }
    : mergeWorkOrderWithExistingProductionDetails(
        {
          ...normalizedWorkOrder,
          ...mapped,
        },
        existingWithDetails,
      );

  if (shouldSyncProductionComposition) {
    await syncCreatedWorkOrderProductionComposition(persisted, company);
  }

  return persisted;
}

export async function updateDbWorkOrderStatePatch(
  patch: WorkOrderStatePatch,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedWorkflowState = normalizeDbWorkflowState(patch.workflowState);
  const lastSavedAt = patch.lastSavedAt || new Date().toISOString();
  const assignments: string[] = [];
  const values: unknown[] = [patch.id];

  if (schema.workflowStateColumn) {
    assignments.push(
      `${quoteIdentifier(schema.workflowStateColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkflowState);
  }

  if (schema.lastSavedAtColumn) {
    assignments.push(
      `${quoteIdentifier(schema.lastSavedAtColumn)} = $${values.length + 1}`,
    );
    values.push(lastSavedAt);
  }

  if (
    schema.inventoryQuantityColumn &&
    Object.prototype.hasOwnProperty.call(patch, "inventoryQuantity")
  ) {
    assignments.push(
      `${quoteIdentifier(schema.inventoryQuantityColumn)} = $${values.length + 1}`,
    );
    values.push(patch.inventoryQuantity ?? 0);
  }

  if (
    schema.inventoryStatusColumn &&
    Object.prototype.hasOwnProperty.call(patch, "inventoryStatus")
  ) {
    assignments.push(
      `${quoteIdentifier(schema.inventoryStatusColumn)} = $${values.length + 1}`,
    );
    values.push(patch.inventoryStatus ?? "unchecked");
  }


  if (schema.rejectionReasonColumn && Object.prototype.hasOwnProperty.call(patch, "rejectionReason")) {
    assignments.push(`${quoteIdentifier(schema.rejectionReasonColumn)} = $${values.length + 1}`);
    values.push(patch.rejectionReason ?? null);
  }

  if (schema.rejectedAtColumn && Object.prototype.hasOwnProperty.call(patch, "rejectedAt")) {
    assignments.push(`${quoteIdentifier(schema.rejectedAtColumn)} = $${values.length + 1}`);
    values.push(patch.rejectedAt ?? null);
  }

  if (schema.rejectedByUserIdColumn && Object.prototype.hasOwnProperty.call(patch, "rejectedByUserId")) {
    assignments.push(`${quoteIdentifier(schema.rejectedByUserIdColumn)} = $${values.length + 1}`);
    values.push(patch.rejectedByUserId ?? null);
  }

  if (schema.rejectedByNameColumn && Object.prototype.hasOwnProperty.call(patch, "rejectedByName")) {
    assignments.push(`${quoteIdentifier(schema.rejectedByNameColumn)} = $${values.length + 1}`);
    values.push(patch.rejectedByName ?? null);
  }

  if (assignments.length === 0) {
    const existing = await findDbWorkOrderById(patch.id, scope);
    if (!existing)
      throw new Error(`spec_sheets row not found for id: ${patch.id}`);
    return existing;
  }

  const returningColumns = [
    "id",
    "title",
    buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL"),
    buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL"),
    buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL"),
    buildAliasSelection(
      schema.reorderGroupIdColumn,
      "reorder_group_id",
      "NULL",
    ),
    buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL"),
    buildAliasSelection(
      schema.parentSpecSheetIdColumn,
      "parent_spec_sheet_id",
      "NULL",
    ),
    buildAliasSelection(schema.isReworkColumn, "is_rework", "NULL"),
    buildAliasSelection(schema.category1IdColumn, "category1_id", "NULL"),
    buildAliasSelection(schema.category2IdColumn, "category2_id", "NULL"),
    buildAliasSelection(schema.category3IdColumn, "category3_id", "NULL"),
    buildAliasSelection(schema.displayTitleColumn, "display_title", "NULL"),
    buildAliasSelection(schema.baseTitleColumn, "base_title", "NULL"),
    buildAliasSelection(schema.category1Column, "category1", "NULL"),
    buildAliasSelection(schema.category2Column, "category2", "NULL"),
    buildAliasSelection(schema.category3Column, "category3", "NULL"),
    buildAliasSelection(schema.seasonColumn, "season", "NULL"),
    buildAliasSelection(schema.priorityColumn, "priority", "NULL"),
    buildAliasSelection(schema.vendorColumn, "vendor", "NULL"),
    buildAliasSelection(schema.managerColumn, "manager", "NULL"),
    buildAliasSelection(schema.managerIdColumn, "manager_id", "NULL"),
    buildAliasSelection(schema.createdByIdColumn, "created_by_id", "NULL"),
    buildAliasSelection(schema.createdByRoleColumn, "created_by_role", "NULL"),
    buildAliasSelection(schema.dueDateColumn, "due_date", "NULL"),
    buildAliasSelection(schema.quantityColumn, "quantity", "NULL"),
    buildAliasSelection(
      schema.inventoryQuantityColumn,
      "inventory_quantity",
      "NULL",
    ),
    buildAliasSelection(
      schema.inventoryStatusColumn,
      "inventory_status",
      "NULL",
    ),
    buildAliasSelection(schema.memoColumn, "memo", "NULL"),
    buildAliasSelection(schema.rejectionReasonColumn, "rejection_reason", "NULL"),
    buildAliasSelection(schema.rejectedAtColumn, "rejected_at", "NULL"),
    buildAliasSelection(schema.rejectedByUserIdColumn, "rejected_by_user_id", "NULL"),
    buildAliasSelection(schema.rejectedByNameColumn, "rejected_by_name", "NULL"),
    buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE"),
    buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL"),
    buildAliasSelection(schema.createdAtColumn, "created_at", "NULL"),
    buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL"),
  ];

  const company = resolveWorkOrderCompanyScope(scope);
  const result = await queryDb<DbSpecSheetRow>(
    `
      UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
      SET
        ${assignments.join(",\n        ")}
      WHERE id = $1
        ${schema.companyIdColumn ? `AND ${quoteIdentifier(schema.companyIdColumn)} = ${quoteLiteral(company.companyId)}` : ""}
      RETURNING
        ${returningColumns.join(",\n        ")}
    `,
    values,
  );

  const updated = result.rows[0];
  if (!updated) {
    throw new Error(`spec_sheets row not found for id: ${patch.id}`);
  }

  const mapped = mapSpecSheetRowToWorkOrder(updated);
  const patchedProductionWorkOrder = await syncPatchedWorkOrderProductionComposition({
    patch,
    mappedWorkOrder: mapped,
    company,
    scope,
    findWorkOrderById: findDbWorkOrderById,
  });

  if (patchedProductionWorkOrder) {
    return patchedProductionWorkOrder;
  }

  const existingWithDetails = await findDbWorkOrderById(patch.id, scope);
  return mergeWorkOrderWithExistingProductionDetails(mapped, existingWithDetails);
}

export async function deleteDbWorkOrder(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  if (schema.isActiveColumn) {
    const assignments = buildSoftDeleteSpecSheetAssignments(schema);
    const companyScopePredicate = buildSpecSheetCompanyScopePredicate(
      schema,
      scope,
    );

    const result = await queryDb<{ id: string }>(
      `
        UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
        SET
          ${assignments.join(",\n          ")}
        WHERE id = $1
          ${companyScopePredicate}
        RETURNING id
      `,
      [workOrderId],
    );

    const deleted = result.rows[0];
    if (!deleted?.id) {
      throw new Error(`spec_sheets row not found for id: ${workOrderId}`);
    }

    await softDeleteAttachmentMemoBundleForWorkOrder(deleted.id);
    return deleted.id;
  }

  const companyScopePredicate = buildSpecSheetCompanyScopePredicate(
    schema,
    scope,
  );

  const result = await queryDb<{ id: string }>(
    `
      DELETE FROM ${quoteIdentifier(SPEC_SHEET_TABLE)}
      WHERE id = $1
        ${companyScopePredicate}
      RETURNING id
    `,
    [workOrderId],
  );

  const deleted = result.rows[0];

  if (!deleted?.id) {
    throw new Error(`spec_sheets row not found for id: ${workOrderId}`);
  }

  await softDeleteAttachmentMemoBundleForWorkOrder(deleted.id);
  return deleted.id;
}

export async function saveDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  try {
    return await updateDbWorkOrder(workOrder, scope);
  } catch (error) {
    if (!isNotFoundWorkOrderError(error)) {
      throw error;
    }

    return createDbWorkOrder(workOrder, scope);
  }
}

export async function saveDbWorkOrders(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  const savedWorkOrders: WorkOrder[] = [];

  for (const workOrder of workOrders) {
    savedWorkOrders.push(await saveDbWorkOrder(workOrder, scope));
  }

  return savedWorkOrders;
}
