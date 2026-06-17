import type { WorkOrderStatePatch } from "@/types/workorder";
import { hasDefinedWaflPatchProperty } from "@/lib/mutations/waflPatchResult";
import type { DbSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import { normalizeDbWorkflowState } from "@/lib/workorder/repository/dbWorkOrderRowMappers";

type WorkOrderStatePatchAssignmentResult = {
  assignments: string[];
  values: unknown[];
};

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function hasPatchProperty(
  patch: WorkOrderStatePatch,
  propertyName: keyof WorkOrderStatePatch,
): boolean {
  return hasDefinedWaflPatchProperty(patch, propertyName);
}

function pushStatePatchAssignment(
  assignments: string[],
  values: unknown[],
  columnName: string | null,
  value: unknown,
) {
  if (!columnName) return;
  assignments.push(`${quoteIdentifier(columnName)} = $${values.length + 1}`);
  values.push(value);
}

export function buildWorkOrderStatePatchAssignments(
  schema: DbSpecSheetSchema,
  patch: WorkOrderStatePatch,
): WorkOrderStatePatchAssignmentResult {
  const assignments: string[] = [];
  const values: unknown[] = [patch.id];

  if (hasPatchProperty(patch, "workflowState")) {
    pushStatePatchAssignment(
      assignments,
      values,
      schema.workflowStateColumn,
      normalizeDbWorkflowState(patch.workflowState),
    );
  }

  if (hasPatchProperty(patch, "workflowPath")) {
    pushStatePatchAssignment(
      assignments,
      values,
      schema.workflowPathColumn,
      patch.workflowPath ?? "standard_review",
    );
  }

  pushStatePatchAssignment(
    assignments,
    values,
    schema.lastSavedAtColumn,
    patch.lastSavedAt || new Date().toISOString(),
  );


  if (hasPatchProperty(patch, "title")) {
    pushStatePatchAssignment(assignments, values, "title", patch.title ?? "");
  }
  if (hasPatchProperty(patch, "displayTitle")) {
    pushStatePatchAssignment(assignments, values, schema.displayTitleColumn, patch.displayTitle ?? null);
  }
  if (hasPatchProperty(patch, "baseTitle")) {
    pushStatePatchAssignment(assignments, values, schema.baseTitleColumn, patch.baseTitle ?? null);
  }
  if (hasPatchProperty(patch, "workOrderKind")) {
    pushStatePatchAssignment(assignments, values, schema.workOrderKindColumn, patch.workOrderKind ?? null);
  }
  if (hasPatchProperty(patch, "category1")) {
    pushStatePatchAssignment(assignments, values, schema.category1Column, patch.category1 ?? "");
  }
  if (hasPatchProperty(patch, "category2")) {
    pushStatePatchAssignment(assignments, values, schema.category2Column, patch.category2 ?? "");
  }
  if (hasPatchProperty(patch, "category3")) {
    pushStatePatchAssignment(assignments, values, schema.category3Column, patch.category3 ?? "");
  }
  if (hasPatchProperty(patch, "category1Id")) {
    pushStatePatchAssignment(assignments, values, schema.category1IdColumn, patch.category1Id ?? null);
  }
  if (hasPatchProperty(patch, "category2Id")) {
    pushStatePatchAssignment(assignments, values, schema.category2IdColumn, patch.category2Id ?? null);
  }
  if (hasPatchProperty(patch, "category3Id")) {
    pushStatePatchAssignment(assignments, values, schema.category3IdColumn, patch.category3Id ?? null);
  }
  if (hasPatchProperty(patch, "season")) {
    pushStatePatchAssignment(assignments, values, schema.seasonColumn, patch.season ?? "");
  }
  if (hasPatchProperty(patch, "manager")) {
    pushStatePatchAssignment(assignments, values, schema.managerColumn, patch.manager ?? "");
  }
  if (hasPatchProperty(patch, "managerId")) {
    pushStatePatchAssignment(assignments, values, schema.managerIdColumn, patch.managerId ?? null);
  }
  if (hasPatchProperty(patch, "dueDate")) {
    pushStatePatchAssignment(assignments, values, schema.dueDateColumn, patch.dueDate || null);
  }
  if (hasPatchProperty(patch, "quantity")) {
    pushStatePatchAssignment(assignments, values, schema.quantityColumn, patch.quantity ?? 0);
  }

  if (hasPatchProperty(patch, "inventoryQuantity")) {
    pushStatePatchAssignment(
      assignments,
      values,
      schema.inventoryQuantityColumn,
      patch.inventoryQuantity ?? 0,
    );
  }

  if (hasPatchProperty(patch, "inventoryStatus")) {
    pushStatePatchAssignment(
      assignments,
      values,
      schema.inventoryStatusColumn,
      patch.inventoryStatus ?? "unchecked",
    );
  }

  if (hasPatchProperty(patch, "rejectionReason")) {
    pushStatePatchAssignment(
      assignments,
      values,
      schema.rejectionReasonColumn,
      patch.rejectionReason ?? null,
    );
  }

  if (hasPatchProperty(patch, "rejectedAt")) {
    pushStatePatchAssignment(
      assignments,
      values,
      schema.rejectedAtColumn,
      patch.rejectedAt ?? null,
    );
  }

  if (hasPatchProperty(patch, "rejectedByUserId")) {
    pushStatePatchAssignment(
      assignments,
      values,
      schema.rejectedByUserIdColumn,
      patch.rejectedByUserId ?? null,
    );
  }

  if (hasPatchProperty(patch, "rejectedByName")) {
    pushStatePatchAssignment(
      assignments,
      values,
      schema.rejectedByNameColumn,
      patch.rejectedByName ?? null,
    );
  }

  return { assignments, values };
}
