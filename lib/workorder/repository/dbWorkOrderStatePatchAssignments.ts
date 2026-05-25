import type { WorkOrderStatePatch } from "@/types/workorder";
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
  return Object.prototype.hasOwnProperty.call(patch, propertyName);
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

  pushStatePatchAssignment(
    assignments,
    values,
    schema.workflowStateColumn,
    normalizeDbWorkflowState(patch.workflowState),
  );

  pushStatePatchAssignment(
    assignments,
    values,
    schema.lastSavedAtColumn,
    patch.lastSavedAt || new Date().toISOString(),
  );

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
