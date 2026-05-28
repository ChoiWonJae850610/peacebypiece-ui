import type { DbSpecSheetRow, DbSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
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

export function buildSpecSheetReturningColumns(
  schema: DbSpecSheetSchema,
): string[] {
  return [
    "id",
    "title",
    buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL"),
    buildAliasSelection(schema.workflowPathColumn, "workflow_path", "NULL"),
    buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL"),
    buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL"),
    buildAliasSelection(schema.reorderGroupIdColumn, "reorder_group_id", "NULL"),
    buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL"),
    buildAliasSelection(schema.parentSpecSheetIdColumn, "parent_spec_sheet_id", "NULL"),
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
    buildAliasSelection(schema.inventoryQuantityColumn, "inventory_quantity", "NULL"),
    buildAliasSelection(schema.inventoryStatusColumn, "inventory_status", "NULL"),
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
}
