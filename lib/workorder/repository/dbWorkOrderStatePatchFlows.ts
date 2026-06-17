import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WorkOrder, WorkOrderStatePatch } from "@/types/workorder";
import {
  resolveWorkOrderCompanyScope,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import type { DbSpecSheetRow } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import { buildSpecSheetStatePatchMutationSql } from "@/lib/workorder/repository/dbWorkOrderMutationSql";
import {
  mapSpecSheetRowToWorkOrder,
} from "@/lib/workorder/repository/dbWorkOrderRowMappers";
import {
  assertMinimumSpecSheetSchema,
  loadSpecSheetSchema,
} from "@/lib/workorder/repository/dbWorkOrderSchemaReader";
import { buildWorkOrderStatePatchAssignments } from "@/lib/workorder/repository/dbWorkOrderStatePatchAssignments";
import {
  mergeWorkOrderWithExistingProductionDetails,
  syncPatchedWorkOrderProductionComposition,
} from "@/lib/workorder/repository/dbWorkOrderProductionSync";

export type FindDbWorkOrderById = (
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
) => Promise<WorkOrder | null>;

type UpdateDbWorkOrderStatePatchRecordOptions = {
  patch: WorkOrderStatePatch;
  scope?: WorkOrderCompanyScope | null;
  findWorkOrderById: FindDbWorkOrderById;
};

export async function updateDbWorkOrderStatePatchRecord({
  patch,
  scope,
  findWorkOrderById,
}: UpdateDbWorkOrderStatePatchRecordOptions): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const { assignments, values } = buildWorkOrderStatePatchAssignments(
    schema,
    patch,
  );

  if (assignments.length === 0) {
    const existing = await findWorkOrderById(patch.id, scope);
    if (!existing) {
      throw new Error(`spec_sheets row not found for id: ${patch.id}`);
    }

    return existing;
  }

  const company = resolveWorkOrderCompanyScope(scope);
  const result = await queryDb<DbSpecSheetRow>(
    buildSpecSheetStatePatchMutationSql(schema, assignments, company.companyId),
    values,
  );

  const updated = result.rows[0];
  if (!updated) {
    throw new Error(`spec_sheets row not found for id: ${patch.id}`);
  }

  const mapped = mapSpecSheetRowToWorkOrder(updated);
  const patchedProductionWorkOrder =
    await syncPatchedWorkOrderProductionComposition({
      patch,
      mappedWorkOrder: mapped,
      company,
      scope,
      findWorkOrderById,
    });

  if (patchedProductionWorkOrder) {
    return patchedProductionWorkOrder;
  }

  const hasProductionCompositionPatch =
    Object.prototype.hasOwnProperty.call(patch, "factoryOrderRequest") ||
    Object.prototype.hasOwnProperty.call(patch, "orderEntries") ||
    Object.prototype.hasOwnProperty.call(patch, "materials") ||
    Object.prototype.hasOwnProperty.call(patch, "outsourcing");

  if (!hasProductionCompositionPatch) {
    return mapped;
  }

  const existingWithDetails = await findWorkOrderById(patch.id, scope);
  return mergeWorkOrderWithExistingProductionDetails(
    mapped,
    existingWithDetails,
  );
}
