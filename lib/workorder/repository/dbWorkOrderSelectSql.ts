import { DEFAULT_WORKFLOW_STATE, WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import {
  DEFAULT_WORK_ORDER_LIST_SORT,
  DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
  isWorkflowStateStatusFilter,
  type WorkOrderListSort,
  type WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import {
  normalizeWorkOrderVisibilityScope,
  resolveWorkOrderCompanyId,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import type { DbSpecSheetRow, DbSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";

const SPEC_SHEET_TABLE = "spec_sheets";

type WorkOrderSummaryQueryOptions = {
  status?: WorkOrderListStatusFilter;
  sort?: WorkOrderListSort;
};

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

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
export function buildSpecSheetSelectQuery(
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

export function buildSpecSheetSummarySelectQuery(
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
        COALESCE(material_counts.material_summary, '')::text AS material_summary,
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
        SELECT
          COUNT(*)::integer AS material_count,
          STRING_AGG(
            DISTINCT NULLIF(TRIM(COALESCE(m.name, '')), ''),
            ', '
            ORDER BY NULLIF(TRIM(COALESCE(m.name, '')), '')
          ) AS material_summary
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

export function buildSpecSheetSelectByIdQuery(
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
