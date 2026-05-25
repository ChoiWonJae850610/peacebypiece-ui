import type { WorkOrder } from "@/types/workorder";
import type { DbSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
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

export function appendNormalizedWorkOrderInsertColumns(
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

export function appendNormalizedWorkOrderUpdateAssignments(
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
  pushUpdateAssignment(
    assignments,
    values,
    schema.rejectionReasonColumn,
    workOrder.rejectionReason ?? null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.rejectedAtColumn,
    workOrder.rejectedAt ?? null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.rejectedByUserIdColumn,
    workOrder.rejectedByUserId ?? null,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.rejectedByNameColumn,
    workOrder.rejectedByName ?? null,
  );
}
