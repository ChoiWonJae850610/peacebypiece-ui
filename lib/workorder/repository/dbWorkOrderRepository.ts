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
import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";
import { ADMIN_FILE_TRASH_ACTOR_IDS } from "@/lib/admin/files/trashPolicy";
import { ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import type { Material } from "@/types/material";
import type {
  OrderEntry,
  Outsourcing,
  WorkOrder,
  WorkOrderStatePatch,
  WorkOrderSummary,
} from "@/types/workorder";
import { syncDbFactoryOrdersForSpecSheet } from "@/lib/workorder/repository/dbFactoryOrderRepository";
import { syncDbSpecSheetMaterialsForSpecSheet } from "@/lib/workorder/repository/dbSpecSheetMaterialRepository";
import { syncDbSpecSheetOutsourcingForSpecSheet } from "@/lib/workorder/repository/dbSpecSheetOutsourcingRepository";
import { canServiceReplaceProductionComposition } from "@/lib/workorder/serviceCodeGuards";
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
export type {
  WorkOrderCompanyScope,
  WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

const SPEC_SHEET_TABLE = "spec_sheets";
function appendAssignedWorkOrderVisibilityPredicate(
  schema: DbSpecSheetSchema,
  predicates: string[],
  values: unknown[],
  scope?: WorkOrderCompanyScope | null,
): void {
  const visibility = normalizeWorkOrderVisibilityScope(scope);
  if (visibility.mode !== "assigned") return;

  const accessibleOwnerIds = Array.from(
    new Set(
      [visibility.userId, visibility.companyMemberId]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (accessibleOwnerIds.length === 0) {
    predicates.push("FALSE");
    return;
  }

  if (!schema.managerIdColumn) {
    predicates.push("FALSE");
    return;
  }

  values.push(accessibleOwnerIds);
  predicates.push(
    `spec_sheet.${quoteIdentifier(schema.managerIdColumn)} = ANY($${values.length}::text[])`,
  );
}


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

function buildSourceAliasSelection(
  sourceAlias: string,
  columnName: string | null,
  alias: keyof DbSpecSheetRow,
  fallbackSql: string,
): string {
  if (!columnName) {
    return `${fallbackSql} AS ${alias}`;
  }

  return `${sourceAlias}.${quoteIdentifier(columnName)} AS ${alias}`;
}

function buildCategoryNameSourceSelection(
  sourceAlias: string,
  sourceColumnName: string | null,
  idColumnName: string | null,
  categoryAlias: string,
  alias: keyof DbSpecSheetRow,
): string {
  const sourceValueSql = sourceColumnName
    ? `NULLIF(${sourceAlias}.${quoteIdentifier(sourceColumnName)}::text, '')`
    : "NULL";
  const categoryNameSql = idColumnName
    ? `NULLIF(${categoryAlias}.name::text, '')`
    : "NULL";

  return `COALESCE(${categoryNameSql}, ${sourceValueSql}) AS ${alias}`;
}

function buildCategoryNameJoinSql(
  sourceAlias: string,
  categoryAlias: string,
  idColumnName: string | null,
  companyIdColumnName: string | null,
): string {
  if (!idColumnName) return "";

  const companyPredicate = companyIdColumnName
    ? `\n        AND ${categoryAlias}.company_id = ${sourceAlias}.${quoteIdentifier(companyIdColumnName)}`
    : "";

  return `
      LEFT JOIN item_categories ${categoryAlias}
        ON ${categoryAlias}.id = ${sourceAlias}.${quoteIdentifier(idColumnName)}${companyPredicate}`;
}

function buildManagerNameSourceSelection(
  schema: DbSpecSheetSchema,
  sourceAlias: string,
): string {
  if (!schema.managerIdColumn) {
    return buildSourceAliasSelection(sourceAlias, schema.managerColumn, "manager", "NULL");
  }

  const storedManagerNameSql = schema.managerColumn
    ? `NULLIF(${sourceAlias}.${quoteIdentifier(schema.managerColumn)}, '')`
    : "NULL";

  return `COALESCE(NULLIF(manager_member.display_name, ''), NULLIF(manager_user.name, ''), NULLIF(manager_user.email, ''), ${storedManagerNameSql}) AS manager`;
}

function buildManagerDisplayJoinSql(
  schema: DbSpecSheetSchema,
  sourceAlias: string,
): string {
  if (!schema.managerIdColumn) return "";

  const companyPredicate = schema.companyIdColumn
    ? `AND manager_member.company_id = ${sourceAlias}.${quoteIdentifier(schema.companyIdColumn)}`
    : "";

  return `
      LEFT JOIN users manager_user
        ON manager_user.id = ${sourceAlias}.${quoteIdentifier(schema.managerIdColumn)}
      LEFT JOIN company_members manager_member
        ON manager_member.user_id = manager_user.id
       ${companyPredicate}`;
}

function pushInsertColumn(
  columns: string[],
  values: unknown[],
  placeholders: string[],
  columnName: string | null,
  value: unknown,
) {
  if (!columnName) return;
  columns.push(columnName);
  values.push(value);
  placeholders.push(`$${values.length}`);
}

function pushUpdateAssignment(
  assignments: string[],
  values: unknown[],
  columnName: string | null,
  value: unknown,
) {
  if (!columnName) return;
  assignments.push(`${quoteIdentifier(columnName)} = $${values.length + 1}`);
  values.push(value);
}

function appendNormalizedWorkOrderInsertColumns(
  schema: DbSpecSheetSchema,
  workOrder: WorkOrder,
  columns: string[],
  values: unknown[],
  placeholders: string[],
) {
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.displayTitleColumn,
    workOrder.displayTitle ?? workOrder.title,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.baseTitleColumn,
    workOrder.baseTitle ?? workOrder.title,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.category1Column,
    workOrder.category1 || null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.category2Column,
    workOrder.category2 || null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.category3Column,
    workOrder.category3 || null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.seasonColumn,
    workOrder.season || null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.priorityColumn,
    workOrder.priority || null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.vendorColumn,
    workOrder.vendor || null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.managerColumn,
    workOrder.manager || null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.managerIdColumn,
    workOrder.managerId ?? null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.createdByIdColumn,
    workOrder.createdById || "system",
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.createdByRoleColumn,
    workOrder.createdByRole || "admin",
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.dueDateColumn,
    workOrder.dueDate || null,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.quantityColumn,
    workOrder.quantity ?? 0,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.inventoryQuantityColumn,
    workOrder.inventoryQuantity ?? 0,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.inventoryStatusColumn,
    workOrder.inventoryStatus || "unchecked",
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.memoColumn,
    workOrder.memo || null,
  );
}

function appendNormalizedWorkOrderUpdateAssignments(
  schema: DbSpecSheetSchema,
  workOrder: WorkOrder,
  assignments: string[],
  values: unknown[],
) {
  pushUpdateAssignment(
    assignments,
    values,
    schema.displayTitleColumn,
    workOrder.displayTitle ?? workOrder.title,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.baseTitleColumn,
    workOrder.baseTitle ?? workOrder.title,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.category1Column,
    workOrder.category1 || null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.category2Column,
    workOrder.category2 || null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.category3Column,
    workOrder.category3 || null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.seasonColumn,
    workOrder.season || null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.priorityColumn,
    workOrder.priority || null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.vendorColumn,
    workOrder.vendor || null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.managerColumn,
    workOrder.manager || null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.managerIdColumn,
    workOrder.managerId ?? null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.createdByIdColumn,
    workOrder.createdById || "system",
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.createdByRoleColumn,
    workOrder.createdByRole || "admin",
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.dueDateColumn,
    workOrder.dueDate || null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.quantityColumn,
    workOrder.quantity ?? 0,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.inventoryQuantityColumn,
    workOrder.inventoryQuantity ?? 0,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.inventoryStatusColumn,
    workOrder.inventoryStatus || "unchecked",
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.memoColumn,
    workOrder.memo || null,
  );
  pushUpdateAssignment(assignments, values, schema.rejectionReasonColumn, workOrder.rejectionReason ?? null);
  pushUpdateAssignment(assignments, values, schema.rejectedAtColumn, workOrder.rejectedAt ?? null);
  pushUpdateAssignment(assignments, values, schema.rejectedByUserIdColumn, workOrder.rejectedByUserId ?? null);
  pushUpdateAssignment(assignments, values, schema.rejectedByNameColumn, workOrder.rejectedByName ?? null);
}

function buildSpecSheetSelectBaseSql(schema: DbSpecSheetSchema): string {
  const sourceAlias = "spec_sheet";

  return `
      SELECT
        ${sourceAlias}.id,
        ${sourceAlias}.title,
        ${buildSourceAliasSelection(sourceAlias, schema.companyIdColumn, "company_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.companyNameColumn, "company_name", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.workflowStateColumn, "workflow_state", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.lastSavedAtColumn, "last_saved_at", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.workOrderKindColumn, "work_order_kind", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.reorderGroupIdColumn, "reorder_group_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.reorderRoundColumn, "reorder_round", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.parentSpecSheetIdColumn, "parent_spec_sheet_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.isReworkColumn, "is_rework", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.category1IdColumn, "category1_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.category2IdColumn, "category2_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.category3IdColumn, "category3_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.displayTitleColumn, "display_title", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.baseTitleColumn, "base_title", "NULL")},
        ${buildCategoryNameSourceSelection(sourceAlias, schema.category1Column, schema.category1IdColumn, "category1_item", "category1")},
        ${buildCategoryNameSourceSelection(sourceAlias, schema.category2Column, schema.category2IdColumn, "category2_item", "category2")},
        ${buildCategoryNameSourceSelection(sourceAlias, schema.category3Column, schema.category3IdColumn, "category3_item", "category3")},
        ${buildSourceAliasSelection(sourceAlias, schema.seasonColumn, "season", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.priorityColumn, "priority", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.vendorColumn, "vendor", "NULL")},
        ${buildManagerNameSourceSelection(schema, sourceAlias)},
        ${buildSourceAliasSelection(sourceAlias, schema.managerIdColumn, "manager_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.createdByIdColumn, "created_by_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.createdByRoleColumn, "created_by_role", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.dueDateColumn, "due_date", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.quantityColumn, "quantity", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.inventoryQuantityColumn, "inventory_quantity", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.inventoryStatusColumn, "inventory_status", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.memoColumn, "memo", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.rejectionReasonColumn, "rejection_reason", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.rejectedAtColumn, "rejected_at", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.rejectedByUserIdColumn, "rejected_by_user_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.rejectedByNameColumn, "rejected_by_name", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.isActiveColumn, "is_active", "TRUE")},
        ${buildSourceAliasSelection(sourceAlias, schema.deletedAtColumn, "deleted_at", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.createdAtColumn, "created_at", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.updatedAtColumn, "updated_at", "NULL")}
      FROM ${quoteIdentifier(SPEC_SHEET_TABLE)} ${sourceAlias}
      ${buildCategoryNameJoinSql(sourceAlias, "category1_item", schema.category1IdColumn, schema.companyIdColumn)}
      ${buildCategoryNameJoinSql(sourceAlias, "category2_item", schema.category2IdColumn, schema.companyIdColumn)}
      ${buildCategoryNameJoinSql(sourceAlias, "category3_item", schema.category3IdColumn, schema.companyIdColumn)}
      ${buildManagerDisplayJoinSql(schema, sourceAlias)}
    `;
}

function buildSpecSheetSummarySelectBaseSql(schema: DbSpecSheetSchema): string {
  const sourceAlias = "spec_sheet";

  return `
      SELECT
        ${sourceAlias}.id,
        ${sourceAlias}.title,
        ${buildSourceAliasSelection(sourceAlias, schema.companyIdColumn, "company_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.companyNameColumn, "company_name", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.workflowStateColumn, "workflow_state", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.lastSavedAtColumn, "last_saved_at", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.workOrderKindColumn, "work_order_kind", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.reorderGroupIdColumn, "reorder_group_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.reorderRoundColumn, "reorder_round", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.parentSpecSheetIdColumn, "parent_spec_sheet_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.isReworkColumn, "is_rework", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.category1IdColumn, "category1_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.category2IdColumn, "category2_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.category3IdColumn, "category3_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.displayTitleColumn, "display_title", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.baseTitleColumn, "base_title", "NULL")},
        ${buildCategoryNameSourceSelection(sourceAlias, schema.category1Column, schema.category1IdColumn, "category1_item", "category1")},
        ${buildCategoryNameSourceSelection(sourceAlias, schema.category2Column, schema.category2IdColumn, "category2_item", "category2")},
        ${buildCategoryNameSourceSelection(sourceAlias, schema.category3Column, schema.category3IdColumn, "category3_item", "category3")},
        ${buildSourceAliasSelection(sourceAlias, schema.seasonColumn, "season", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.priorityColumn, "priority", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.vendorColumn, "vendor", "NULL")},
        ${buildManagerNameSourceSelection(schema, sourceAlias)},
        ${buildSourceAliasSelection(sourceAlias, schema.managerIdColumn, "manager_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.createdByIdColumn, "created_by_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.createdByRoleColumn, "created_by_role", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.dueDateColumn, "due_date", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.quantityColumn, "quantity", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.inventoryQuantityColumn, "inventory_quantity", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.inventoryStatusColumn, "inventory_status", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.memoColumn, "memo", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.rejectionReasonColumn, "rejection_reason", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.rejectedAtColumn, "rejected_at", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.rejectedByUserIdColumn, "rejected_by_user_id", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.rejectedByNameColumn, "rejected_by_name", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.isActiveColumn, "is_active", "TRUE")},
        ${buildSourceAliasSelection(sourceAlias, schema.deletedAtColumn, "deleted_at", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.createdAtColumn, "created_at", "NULL")},
        ${buildSourceAliasSelection(sourceAlias, schema.updatedAtColumn, "updated_at", "NULL")}
      FROM ${quoteIdentifier(SPEC_SHEET_TABLE)} ${sourceAlias}
      ${buildCategoryNameJoinSql(sourceAlias, "category1_item", schema.category1IdColumn, schema.companyIdColumn)}
      ${buildCategoryNameJoinSql(sourceAlias, "category2_item", schema.category2IdColumn, schema.companyIdColumn)}
      ${buildCategoryNameJoinSql(sourceAlias, "category3_item", schema.category3IdColumn, schema.companyIdColumn)}
      ${buildManagerDisplayJoinSql(schema, sourceAlias)}
    `;
}

function buildSpecSheetSelectQuery(
  schema: DbSpecSheetSchema,
  scope?: WorkOrderCompanyScope | null,
): { sql: string; values: unknown[] } {
  const predicates: string[] = [];
  const values: unknown[] = [];

  if (schema.companyIdColumn) {
    values.push(resolveWorkOrderCompanyId(scope));
    predicates.push(
      `spec_sheet.${quoteIdentifier(schema.companyIdColumn)} = $${values.length}`,
    );
  }

  if (schema.isActiveColumn) {
    predicates.push(`spec_sheet.${quoteIdentifier(schema.isActiveColumn)} = TRUE`);
  }

  appendAssignedWorkOrderVisibilityPredicate(schema, predicates, values, scope);

  return {
    sql: `
      ${buildSpecSheetSelectBaseSql(schema)}
      ${predicates.length > 0 ? `WHERE ${predicates.join("\n        AND ")}` : ""}
      ORDER BY ${schema.updatedAtColumn ? `spec_sheet.${quoteIdentifier(schema.updatedAtColumn)} DESC NULLS LAST, ` : ""}${schema.createdAtColumn ? `spec_sheet.${quoteIdentifier(schema.createdAtColumn)} DESC NULLS LAST, ` : ""}spec_sheet.id DESC
    `,
    values,
  };
}

const DB_WORKFLOW_STATE_FILTER_VALUES: Record<
  Exclude<WorkOrderListStatusFilter, "active" | "all">,
  readonly string[]
> = {
  draft: ["draft", "작성중"],
  review_requested: ["review_requested", "검토요청"],
  review_completed: ["review_completed", "review_approved", "검토완료"],
  inspection: [
    "inspection",
    "order_requested",
    "in_production",
    "in_inspection",
    "발주요청",
    "생산중",
    "검수중",
  ],
  rejected: ["rejected", "반려"],
  completed: ["completed", "완료"],
};

function quoteSqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildWorkflowStateInSql(
  column: string,
  values: readonly string[],
): string {
  return `${column} IN (${values.map(quoteSqlLiteral).join(", ")})`;
}

function buildSpecSheetSummaryWhereSql(
  schema: DbSpecSheetSchema,
  status: WorkOrderListStatusFilter,
  values: unknown[],
  scope?: WorkOrderCompanyScope | null,
): string {
  const predicates: string[] = [];

  if (schema.companyIdColumn) {
    values.push(resolveWorkOrderCompanyId(scope));
    predicates.push(
      `spec_sheet.${quoteIdentifier(schema.companyIdColumn)} = $${values.length}`,
    );
  }

  if (schema.isActiveColumn) {
    predicates.push(`spec_sheet.${quoteIdentifier(schema.isActiveColumn)} = TRUE`);
  }

  if (schema.deletedAtColumn) {
    predicates.push(`spec_sheet.${quoteIdentifier(schema.deletedAtColumn)} IS NULL`);
  }

  appendAssignedWorkOrderVisibilityPredicate(schema, predicates, values, scope);

  if (schema.workflowStateColumn) {
    const workflowColumn = `COALESCE(spec_sheet.${quoteIdentifier(schema.workflowStateColumn)}, ${quoteLiteral(DEFAULT_WORKFLOW_STATE)})`;
    if (status === "active") {
      predicates.push(
        `NOT (${buildWorkflowStateInSql(workflowColumn, DB_WORKFLOW_STATE_FILTER_VALUES.completed)})`,
      );
    } else if (status === WORKFLOW_STATE.completed) {
      predicates.push(
        buildWorkflowStateInSql(
          workflowColumn,
          DB_WORKFLOW_STATE_FILTER_VALUES.completed,
        ),
      );
    } else if (isWorkflowStateStatusFilter(status)) {
      predicates.push(
        buildWorkflowStateInSql(
          workflowColumn,
          DB_WORKFLOW_STATE_FILTER_VALUES[status],
        ),
      );
    }
  } else if (status === WORKFLOW_STATE.completed) {
    predicates.push("FALSE");
  }

  return predicates.length > 0
    ? `WHERE ${predicates.join("\n        AND ")}`
    : "";
}

function buildSpecSheetSummaryOrderBySql(
  schema: DbSpecSheetSchema,
  sort: WorkOrderListSort,
): string {
  if (sort === "createdDesc") {
    return `ORDER BY ${schema.createdAtColumn ? `s.created_at DESC NULLS LAST, ` : ""}${schema.updatedAtColumn ? `s.updated_at DESC NULLS LAST, ` : ""}s.id DESC`;
  }

  if (sort === "dueDateAsc") {
    return `ORDER BY ${schema.dueDateColumn ? `NULLIF(s.due_date::text, '') ASC NULLS LAST, ` : ""}${schema.updatedAtColumn ? `s.updated_at DESC NULLS LAST, ` : ""}s.id DESC`;
  }

  if (sort === "titleAsc") {
    return "ORDER BY LOWER(s.title) ASC, s.id DESC";
  }

  if (sort === "vendorAsc") {
    return `ORDER BY ${schema.vendorColumn ? `LOWER(COALESCE(s.vendor, '')) ASC, ` : ""}LOWER(s.title) ASC, s.id DESC`;
  }

  return `ORDER BY ${schema.updatedAtColumn ? `s.updated_at DESC NULLS LAST, ` : ""}${schema.createdAtColumn ? `s.created_at DESC NULLS LAST, ` : ""}s.id DESC`;
}

function buildSpecSheetSummarySelectQuery(
  schema: DbSpecSheetSchema,
  options: WorkOrderSummaryQueryOptions = {},
  scope?: WorkOrderCompanyScope | null,
): { sql: string; values: unknown[] } {
  const status = options.status ?? DEFAULT_WORK_ORDER_LIST_STATUS_FILTER;
  const sort = options.sort ?? DEFAULT_WORK_ORDER_LIST_SORT;
  const values: unknown[] = [];

  return {
    sql: `
      WITH spec_sheet_summaries AS (
        ${buildSpecSheetSummarySelectBaseSql(schema)}
        ${buildSpecSheetSummaryWhereSql(schema, status, values, scope)}
      )
      SELECT
        s.*,
        COALESCE(order_counts.order_entry_count, 0)::integer AS order_entry_count,
        COALESCE(material_counts.material_count, 0)::integer AS material_count,
        COALESCE(outsourcing_counts.outsourcing_count, 0)::integer AS outsourcing_count,
        COALESCE(attachment_counts.attachment_count, 0)::integer AS attachment_count,
        COALESCE(memo_counts.memo_thread_count, 0)::integer AS memo_thread_count
      FROM spec_sheet_summaries s
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS order_entry_count
        FROM orders o
        WHERE o.company_id = s.company_id
          AND o.spec_sheet_id = s.id
      ) order_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS material_count
        FROM spec_sheet_materials m
        WHERE m.company_id = s.company_id
          AND m.spec_sheet_id = s.id
      ) material_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS outsourcing_count
        FROM spec_sheet_outsourcing_lines ol
        WHERE ol.company_id = s.company_id
          AND ol.spec_sheet_id = s.id
      ) outsourcing_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS attachment_count
        FROM attachments a
        WHERE a.order_id = s.id
          AND COALESCE(a.is_active, true) = true
          AND a.deleted_at IS NULL
      ) attachment_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS memo_thread_count
        FROM memos memo
        WHERE memo.order_id = s.id
          AND memo.parent_id IS NULL
          AND COALESCE(memo.is_active, true) = true
          AND memo.deleted_at IS NULL
      ) memo_counts ON true
      ${buildSpecSheetSummaryOrderBySql(schema, sort)}
    `,
    values,
  };
}

function buildSpecSheetSelectByIdQuery(
  schema: DbSpecSheetSchema,
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): { sql: string; values: unknown[] } {
  const values: unknown[] = [workOrderId];
  const predicates = [`spec_sheet.id = $${values.length}`];

  if (schema.companyIdColumn) {
    values.push(resolveWorkOrderCompanyId(scope));
    predicates.push(
      `spec_sheet.${quoteIdentifier(schema.companyIdColumn)} = $${values.length}`,
    );
  }

  if (schema.isActiveColumn) {
    predicates.push(`spec_sheet.${quoteIdentifier(schema.isActiveColumn)} = TRUE`);
  }

  appendAssignedWorkOrderVisibilityPredicate(schema, predicates, values, scope);

  return {
    sql: `
      ${buildSpecSheetSelectBaseSql(schema)}
      WHERE ${predicates.join("\n        AND ")}
      LIMIT 1
    `,
    values,
  };
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
  await syncDbFactoryOrdersForSpecSheet(persisted, company);
  await syncDbSpecSheetMaterialsForSpecSheet(persisted, company);
  await syncDbSpecSheetOutsourcingForSpecSheet(persisted, company);
  return persisted;
}

function shouldSyncProductionCompositionForFullWorkOrderSave(_workOrder: WorkOrder): boolean {
  // Full work-order saves are used by immediate/basic field updates such as
  // manager, title, category, and inventory changes. They must not mutate
  // production-composition detail tables. Production rows are replaced only
  // through serviceCode-guarded state patch saves.
  return false;
}

function mergeWorkOrderWithExistingProductionDetails(
  baseWorkOrder: WorkOrder,
  existingWorkOrder: WorkOrder | null | undefined,
): WorkOrder {
  if (!existingWorkOrder) return baseWorkOrder;

  return {
    ...existingWorkOrder,
    ...baseWorkOrder,
    factoryOrderRequest: existingWorkOrder.factoryOrderRequest ?? null,
    orderEntries: existingWorkOrder.orderEntries ?? [],
    materials: existingWorkOrder.materials ?? [],
    outsourcing: existingWorkOrder.outsourcing ?? [],
    hasDetailSnapshot: existingWorkOrder.hasDetailSnapshot ?? baseWorkOrder.hasDetailSnapshot,
  };
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
        ${schema.companyIdColumn ? `AND ${quoteIdentifier(schema.companyIdColumn)} = ${quoteSqlLiteral(company.companyId)}` : ""}
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
    await syncDbFactoryOrdersForSpecSheet(persisted, company);
    await syncDbSpecSheetMaterialsForSpecSheet(persisted, company);
    await syncDbSpecSheetOutsourcingForSpecSheet(persisted, company);
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
        ${schema.companyIdColumn ? `AND ${quoteIdentifier(schema.companyIdColumn)} = ${quoteSqlLiteral(company.companyId)}` : ""}
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
  const hasOrderEntriesPatch = Object.prototype.hasOwnProperty.call(
    patch,
    "orderEntries",
  );
  const hasFactoryOrderRequestPatch = Object.prototype.hasOwnProperty.call(
    patch,
    "factoryOrderRequest",
  );
  const hasMaterialsPatch = Object.prototype.hasOwnProperty.call(
    patch,
    "materials",
  );
  const hasOutsourcingPatch = Object.prototype.hasOwnProperty.call(
    patch,
    "outsourcing",
  );
  const hasProductionCompositionPatch =
    hasOrderEntriesPatch ||
    hasFactoryOrderRequestPatch ||
    hasMaterialsPatch ||
    hasOutsourcingPatch;
  const canSyncProductionComposition = canServiceReplaceProductionComposition(patch.serviceCode ?? null);

  if (hasProductionCompositionPatch && canSyncProductionComposition) {
    const existing = await findDbWorkOrderById(patch.id, scope);
    const patchedWorkOrder: WorkOrder = {
      ...(existing ?? mapped),
      ...mapped,
      orderEntries: hasOrderEntriesPatch
        ? (patch.orderEntries ?? [])
        : (existing?.orderEntries ?? []),
      materials: hasMaterialsPatch
        ? (patch.materials ?? [])
        : (existing?.materials ?? []),
      outsourcing: hasOutsourcingPatch
        ? (patch.outsourcing ?? [])
        : (existing?.outsourcing ?? []),
      factoryOrderRequest: hasFactoryOrderRequestPatch
        ? (patch.factoryOrderRequest ?? null)
        : (existing?.factoryOrderRequest ?? null),
    };

    if (hasOrderEntriesPatch || hasFactoryOrderRequestPatch) {
      await syncDbFactoryOrdersForSpecSheet(patchedWorkOrder, company);
    }
    if (hasMaterialsPatch) {
      await syncDbSpecSheetMaterialsForSpecSheet(patchedWorkOrder, company);
    }
    if (hasOutsourcingPatch) {
      await syncDbSpecSheetOutsourcingForSpecSheet(patchedWorkOrder, company);
    }

    return patchedWorkOrder;
  }

  const existingWithDetails = await findDbWorkOrderById(patch.id, scope);
  return mergeWorkOrderWithExistingProductionDetails(mapped, existingWithDetails);
}

async function softDeleteAttachmentMemoBundleForWorkOrder(
  workOrderId: string,
): Promise<void> {
  const trashRetentionDays = COMPANY_FILE_TRASH_RETENTION_DAYS;

  await queryDb(
    `WITH updated_attachments AS (
       UPDATE attachments
          SET is_active = false,
              deleted_at = COALESCE(deleted_at, now()),
              deleted_by = COALESCE(deleted_by, $3),
              delete_source = COALESCE(delete_source, 'workorder_bundle'),
              delete_scope = COALESCE(delete_scope, 'bundle'),
              delete_parent_type = COALESCE(delete_parent_type, 'workorder'),
              delete_parent_id = COALESCE(delete_parent_id, $1),
              delete_batch_id = COALESCE(delete_batch_id, $1),
              purge_after_at = COALESCE(purge_after_at, now() + ($2::integer * interval '1 day')),
              updated_at = now()
        WHERE order_id = $1
          AND is_active = true
          AND deleted_at IS NULL
        RETURNING id,
                  company_id,
                  company_name,
                  order_id,
                  storage_key,
                  thumbnail_key,
                  original_name,
                  mime_type,
                  size_bytes,
                  deleted_by,
                  delete_source,
                  delete_scope,
                  delete_parent_type,
                  delete_parent_id,
                  delete_batch_id,
                  deleted_at,
                  purge_after_at
     )
     INSERT INTO attachment_trash_items (
       company_id,
       company_name,
       attachment_id,
       order_id,
       storage_key,
       thumbnail_key,
       original_name,
       mime_type,
       size_bytes,
       deleted_by,
       delete_source,
       delete_scope,
       delete_parent_type,
       delete_parent_id,
       delete_batch_id,
       deleted_at,
       purge_after_at
     )
     SELECT company_id,
            company_name,
            id,
            order_id,
            storage_key,
            thumbnail_key,
            original_name,
            mime_type,
            COALESCE(size_bytes, 0),
            deleted_by,
            delete_source,
            delete_scope,
            delete_parent_type,
            delete_parent_id,
            delete_batch_id,
            COALESCE(deleted_at, now()),
            COALESCE(purge_after_at, now() + ($2::integer * interval '1 day'))
       FROM updated_attachments
     ON CONFLICT DO NOTHING`,
    [
      workOrderId,
      trashRetentionDays,
      ADMIN_FILE_TRASH_ACTOR_IDS.workorderDelete,
    ],
  );

  await queryDb(
    `UPDATE memos
        SET is_active = false,
            delete_status = 'trashed',
            purge_status = 'pending',
            purge_requested_at = NULL,
            purge_requested_by = NULL,
            delete_source = 'workorder_bundle',
            delete_scope = 'bundle',
            delete_parent_type = 'workorder',
            delete_parent_id = $1,
            delete_batch_id = COALESCE(delete_batch_id, $1),
            purged_at = NULL,
            purged_by = NULL,
            deleted_at = COALESCE(deleted_at, now()),
            updated_at = now()
      WHERE order_id = $1
        AND is_active = true
        AND deleted_at IS NULL`,
    [workOrderId],
  );
}

export async function deleteDbWorkOrder(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  if (schema.isActiveColumn) {
    const assignments = [`${quoteIdentifier(schema.isActiveColumn)} = FALSE`];
    if (schema.deletedAtColumn) {
      assignments.push(`${quoteIdentifier(schema.deletedAtColumn)} = NOW()`);
    }
    if (schema.deleteStatusColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteStatusColumn)} = 'trashed'`,
      );
    }
    if (schema.purgeStatusColumn) {
      assignments.push(
        `${quoteIdentifier(schema.purgeStatusColumn)} = 'pending'`,
      );
    }
    if (schema.purgeRequestedAtColumn) {
      assignments.push(
        `${quoteIdentifier(schema.purgeRequestedAtColumn)} = NULL`,
      );
    }
    if (schema.purgeRequestedByColumn) {
      assignments.push(
        `${quoteIdentifier(schema.purgeRequestedByColumn)} = NULL`,
      );
    }
    if (schema.deleteSourceColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteSourceColumn)} = 'manual'`,
      );
    }
    if (schema.deleteScopeColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteScopeColumn)} = 'bundle'`,
      );
    }
    if (schema.deleteParentTypeColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteParentTypeColumn)} = 'workorder'`,
      );
    }
    if (schema.deleteParentIdColumn) {
      assignments.push(`${quoteIdentifier(schema.deleteParentIdColumn)} = id`);
    }
    if (schema.deleteBatchIdColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteBatchIdColumn)} = COALESCE(${quoteIdentifier(schema.deleteBatchIdColumn)}, id)`,
      );
    }
    if (schema.purgedAtColumn) {
      assignments.push(`${quoteIdentifier(schema.purgedAtColumn)} = NULL`);
    }
    if (schema.purgedByColumn) {
      assignments.push(`${quoteIdentifier(schema.purgedByColumn)} = NULL`);
    }

    const result = await queryDb<{ id: string }>(
      `
        UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
        SET
          ${assignments.join(",\n          ")}
        WHERE id = $1
          ${schema.companyIdColumn ? `AND ${quoteIdentifier(schema.companyIdColumn)} = ${quoteSqlLiteral(resolveWorkOrderCompanyId(scope))}` : ""}
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

  const result = await queryDb<{ id: string }>(
    `
      DELETE FROM ${quoteIdentifier(SPEC_SHEET_TABLE)}
      WHERE id = $1
        ${schema.companyIdColumn ? `AND ${quoteIdentifier(schema.companyIdColumn)} = ${quoteSqlLiteral(resolveWorkOrderCompanyId(scope))}` : ""}
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
