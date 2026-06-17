import "server-only";

import { withDbTransaction } from "@/lib/db/client";
import { buildSpecSheetStatePatchMutationSql } from "@/lib/workorder/repository/dbWorkOrderMutationSql";
import { assertMinimumSpecSheetSchema, loadSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderSchemaReader";
import { buildWorkOrderStatePatchAssignments } from "@/lib/workorder/repository/dbWorkOrderStatePatchAssignments";
import type { DbSpecSheetRow } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import { mapSpecSheetRowToWorkOrder } from "@/lib/workorder/repository/dbWorkOrderRowMappers";
import { resolveWorkOrderCompanyScope, type WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import type { WorkOrderInventoryGroupPatchRequest, WorkOrderInventoryGroupPatchResult, WorkOrderStatePatch } from "@/types/workorder";

export async function updateDbWorkOrderInventoryGroup(
  payload: WorkOrderInventoryGroupPatchRequest,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrderInventoryGroupPatchResult> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);
  const company = resolveWorkOrderCompanyScope(scope);
  const uniqueIds = Array.from(new Set(payload.workOrderIds.map((id) => id.trim()).filter(Boolean)));
  if (uniqueIds.length === 0) throw new Error("workOrderIds is required.");

  const savedAt = payload.lastSavedAt?.trim() || new Date().toISOString();

  return withDbTransaction(async (client) => {
    const results: WorkOrderInventoryGroupPatchResult = [];

    for (const workOrderId of uniqueIds) {
      const patch: WorkOrderStatePatch = {
        id: workOrderId,
        inventoryQuantity: payload.inventoryQuantity,
        inventoryStatus: payload.inventoryStatus,
        lastSavedAt: savedAt,
      };
      const { assignments, values } = buildWorkOrderStatePatchAssignments(schema, patch);
      const result = await client.query<DbSpecSheetRow>(
        buildSpecSheetStatePatchMutationSql(schema, assignments, company.companyId),
        values,
      );
      const row = result.rows[0];
      if (!row) throw new Error(`spec_sheets row not found for id: ${workOrderId}`);
      const mapped = mapSpecSheetRowToWorkOrder(row);
      results.push({
        resourceId: mapped.id,
        patch: {
          inventoryQuantity: mapped.inventoryQuantity,
          inventoryStatus: mapped.inventoryStatus,
          lastSavedAt: mapped.lastSavedAt,
        },
        updatedAt: mapped.lastSavedAt,
      });
    }

    return results;
  });
}
