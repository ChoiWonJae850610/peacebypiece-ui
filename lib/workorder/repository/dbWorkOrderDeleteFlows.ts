import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import {
  buildSpecSheetCompanyScopePredicate,
  buildSoftDeleteSpecSheetAssignments,
  softDeleteAttachmentMemoBundleForWorkOrder,
} from "@/lib/workorder/repository/dbWorkOrderDeleteHelpers";
import {
  assertMinimumSpecSheetSchema,
  loadSpecSheetSchema,
} from "@/lib/workorder/repository/dbWorkOrderSchemaReader";

const SPEC_SHEET_TABLE = "spec_sheets";

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function softDeleteSpecSheetRow(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  if (!schema.isActiveColumn) {
    return hardDeleteSpecSheetRow(workOrderId, scope);
  }

  const assignments = buildSoftDeleteSpecSheetAssignments(schema);
  const companyScopePredicate = buildSpecSheetCompanyScopePredicate(
    schema,
    scope,
  );

  const result = await queryDb<{ id: string }>(
    `
      UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
      SET
        ${assignments.join(",\n        ")}
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

  return deleted.id;
}

async function hardDeleteSpecSheetRow(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);
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

  return deleted.id;
}

export async function deleteDbWorkOrderRecord(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  const deletedId = await softDeleteSpecSheetRow(workOrderId, scope);
  await softDeleteAttachmentMemoBundleForWorkOrder(deletedId);
  return deletedId;
}
