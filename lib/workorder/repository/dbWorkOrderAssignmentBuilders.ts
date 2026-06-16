import { WORK_ORDER_KIND } from "@/lib/constants/workorderIdentity";
import type { WorkOrder } from "@/types/workorder";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
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

export type WorkOrderMutationCompanyScope = Pick<
  WorkOrderCompanyScope,
  "companyId" | "companyName"
>;

export type WorkOrderInsertMutationArgs = {
  columns: string[];
  values: unknown[];
  placeholders: string[];
};

export type WorkOrderUpdateMutationArgs = {
  assignments: string[];
  values: unknown[];
};

export function buildWorkOrderInsertMutationArgs(
  schema: DbSpecSheetSchema,
  workOrder: WorkOrder,
  company: WorkOrderMutationCompanyScope,
): WorkOrderInsertMutationArgs {
  const columns = ["id", "title"];
  const values: unknown[] = [workOrder.id, workOrder.title];
  const placeholders = ["$1", "$2"];

  pushInsertColumn(columns, values, placeholders, schema.companyIdColumn, company.companyId);
  pushInsertColumn(columns, values, placeholders, schema.companyNameColumn, company.companyName);
  pushInsertColumn(columns, values, placeholders, schema.workflowStateColumn, workOrder.workflowState);
  pushInsertColumn(columns, values, placeholders, schema.workflowPathColumn, workOrder.workflowPath ?? "standard_review");
  pushInsertColumn(columns, values, placeholders, schema.lastSavedAtColumn, workOrder.lastSavedAt);
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.workOrderKindColumn,
    workOrder.workOrderKind ?? WORK_ORDER_KIND.sample,
  );
  pushInsertColumn(
    columns,
    values,
    placeholders,
    schema.reorderGroupIdColumn,
    workOrder.reorderGroupId ?? workOrder.id,
  );
  pushInsertColumn(columns, values, placeholders, schema.reorderRoundColumn, workOrder.reorderRound ?? 0);
  pushInsertColumn(columns, values, placeholders, schema.parentSpecSheetIdColumn, workOrder.parentSpecSheetId ?? null);
  pushInsertColumn(columns, values, placeholders, schema.isReworkColumn, Boolean(workOrder.isDefectOrder));
  pushInsertColumn(columns, values, placeholders, schema.category1IdColumn, workOrder.category1Id ?? null);
  pushInsertColumn(columns, values, placeholders, schema.category2IdColumn, workOrder.category2Id ?? null);
  pushInsertColumn(columns, values, placeholders, schema.category3IdColumn, workOrder.category3Id ?? null);

  appendNormalizedWorkOrderInsertColumns(schema, workOrder, columns, values, placeholders);

  pushInsertColumn(columns, values, placeholders, schema.isActiveColumn, true);
  pushInsertColumn(columns, values, placeholders, schema.deletedAtColumn, null);

  return { columns, values, placeholders };
}

export function buildWorkOrderUpdateMutationArgs(
  schema: DbSpecSheetSchema,
  workOrder: WorkOrder,
  company: WorkOrderMutationCompanyScope,
): WorkOrderUpdateMutationArgs {
  const assignments = ["title = $2"];
  const values: unknown[] = [workOrder.id, workOrder.title];

  pushUpdateAssignment(assignments, values, schema.companyIdColumn, company.companyId);
  pushUpdateAssignment(assignments, values, schema.companyNameColumn, company.companyName);
  pushUpdateAssignment(assignments, values, schema.workflowStateColumn, workOrder.workflowState);
  pushUpdateAssignment(assignments, values, schema.workflowPathColumn, workOrder.workflowPath ?? "standard_review");
  pushUpdateAssignment(assignments, values, schema.lastSavedAtColumn, workOrder.lastSavedAt);
  pushUpdateAssignment(
    assignments,
    values,
    schema.workOrderKindColumn,
    workOrder.workOrderKind ?? WORK_ORDER_KIND.sample,
  );
  pushUpdateAssignment(
    assignments,
    values,
    schema.reorderGroupIdColumn,
    workOrder.reorderGroupId ?? workOrder.id,
  );
  pushUpdateAssignment(assignments, values, schema.reorderRoundColumn, workOrder.reorderRound ?? 0);
  pushUpdateAssignment(assignments, values, schema.parentSpecSheetIdColumn, workOrder.parentSpecSheetId ?? null);
  pushUpdateAssignment(assignments, values, schema.isReworkColumn, Boolean(workOrder.isDefectOrder));
  pushUpdateAssignment(assignments, values, schema.category1IdColumn, workOrder.category1Id ?? null);
  pushUpdateAssignment(assignments, values, schema.category2IdColumn, workOrder.category2Id ?? null);
  pushUpdateAssignment(assignments, values, schema.category3IdColumn, workOrder.category3Id ?? null);

  appendNormalizedWorkOrderUpdateAssignments(schema, workOrder, assignments, values);

  pushUpdateAssignment(assignments, values, schema.isActiveColumn, true);
  pushUpdateAssignment(assignments, values, schema.deletedAtColumn, null);

  return { assignments, values };
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
