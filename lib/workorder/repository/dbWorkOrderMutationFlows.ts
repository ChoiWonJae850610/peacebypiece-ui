import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WorkOrder } from "@/types/workorder";
import { resolveCategoryIdsForDb } from "@/lib/workorder/repository/dbWorkOrderCategoryResolvers";
import {
  resolveWorkOrderCompanyScope,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import type { DbSpecSheetRow } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import {
  mapSpecSheetRowToWorkOrder,
  normalizeWorkOrderForDb,
} from "@/lib/workorder/repository/dbWorkOrderRowMappers";
import {
  assertMinimumSpecSheetSchema,
  loadSpecSheetSchema,
} from "@/lib/workorder/repository/dbWorkOrderSchemaReader";
import {
  buildSpecSheetInsertMutationSql,
  buildSpecSheetUpdateMutationSql,
} from "@/lib/workorder/repository/dbWorkOrderMutationSql";
import {
  buildWorkOrderInsertMutationArgs,
  buildWorkOrderUpdateMutationArgs,
} from "@/lib/workorder/repository/dbWorkOrderAssignmentBuilders";
import {
  mergeWorkOrderWithExistingProductionDetails,
  shouldSyncProductionCompositionForFullWorkOrderSave,
  syncCreatedWorkOrderProductionComposition,
} from "@/lib/workorder/repository/dbWorkOrderProductionSync";

export type FindDbWorkOrderById = (
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
) => Promise<WorkOrder | null>;

function mergeCreatedWorkOrder(
  normalizedWorkOrder: WorkOrder,
  row: DbSpecSheetRow,
): WorkOrder {
  const mapped = mapSpecSheetRowToWorkOrder(row);
  return {
    ...normalizedWorkOrder,
    ...mapped,
    orderEntries: normalizedWorkOrder.orderEntries ?? [],
    materials: normalizedWorkOrder.materials ?? [],
    outsourcing: normalizedWorkOrder.outsourcing ?? [],
  };
}

async function normalizeMutationWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  const normalizedBaseWorkOrder = normalizeWorkOrderForDb(workOrder);
  const resolvedCategoryIds = await resolveCategoryIdsForDb(
    normalizedBaseWorkOrder,
    scope,
  );

  return {
    ...normalizedBaseWorkOrder,
    ...resolvedCategoryIds,
  };
}

export async function createDbWorkOrderRecord(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedWorkOrder = await normalizeMutationWorkOrder(
    workOrder,
    scope,
  );
  const company = resolveWorkOrderCompanyScope(scope);
  const { columns, values, placeholders } = buildWorkOrderInsertMutationArgs(
    schema,
    normalizedWorkOrder,
    company,
  );

  const result = await queryDb<DbSpecSheetRow>(
    buildSpecSheetInsertMutationSql(schema, columns, placeholders),
    values,
  );

  const created = result.rows[0];
  if (!created) {
    throw new Error("Failed to create work order in DB.");
  }

  const persisted = mergeCreatedWorkOrder(normalizedWorkOrder, created);
  await syncCreatedWorkOrderProductionComposition(persisted, company);
  return persisted;
}

export async function updateDbWorkOrderRecord(
  workOrder: WorkOrder,
  scope: WorkOrderCompanyScope | null | undefined,
  findWorkOrderById: FindDbWorkOrderById,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedWorkOrder = await normalizeMutationWorkOrder(
    workOrder,
    scope,
  );
  const company = resolveWorkOrderCompanyScope(scope);
  const { assignments, values } = buildWorkOrderUpdateMutationArgs(
    schema,
    normalizedWorkOrder,
    company,
  );

  const result = await queryDb<DbSpecSheetRow>(
    buildSpecSheetUpdateMutationSql(schema, assignments, company.companyId),
    values,
  );

  const updated = result.rows[0];
  if (!updated) {
    throw new Error(
      `spec_sheets row not found for id: ${normalizedWorkOrder.id}`,
    );
  }

  const mapped = mapSpecSheetRowToWorkOrder(updated);
  const shouldSyncProductionComposition =
    shouldSyncProductionCompositionForFullWorkOrderSave(normalizedWorkOrder);
  const existingWithDetails = shouldSyncProductionComposition
    ? null
    : await findWorkOrderById(normalizedWorkOrder.id, scope);
  const persisted = shouldSyncProductionComposition
    ? mergeCreatedWorkOrder(normalizedWorkOrder, updated)
    : mergeWorkOrderWithExistingProductionDetails(
        {
          ...normalizedWorkOrder,
          ...mapped,
        },
        existingWithDetails,
      );

  if (shouldSyncProductionComposition) {
    await syncCreatedWorkOrderProductionComposition(persisted, company);
  }

  return persisted;
}
