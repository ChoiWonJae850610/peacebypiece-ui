import "server-only";

import { queryDb } from "@/lib/db/client";
import {
  DEFAULT_WORKFLOW_STATE,
  WORKFLOW_STATE,
} from "@/lib/constants/workorderStates";
import {
  DEFAULT_WORK_ORDER_LIST_SORT,
  DEFAULT_WORK_ORDER_LIST_STATUS_FILTER,
  isWorkflowStateStatusFilter,
  type WorkOrderListSort,
  type WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import type {
  WorkOrder,
  WorkOrderStatePatch,
  WorkOrderSummary,
} from "@/types/workorder";
import {
  normalizeWorkOrderVisibilityScope,
  resolveWorkOrderCompanyScope,
  type WorkOrderCompanyScope,
  type WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import { resolveCategoryIdsForDb } from "@/lib/workorder/repository/dbWorkOrderCategoryResolvers";
import type { DbSpecSheetRow, DbSpecSheetSchema } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import {
  mapSpecSheetRowToWorkOrder,
  mapSpecSheetRowToWorkOrderSummary,
  normalizeWorkOrderForDb,
} from "@/lib/workorder/repository/dbWorkOrderRowMappers";
import {
  assertMinimumSpecSheetSchema,
  loadSpecSheetSchema,
} from "@/lib/workorder/repository/dbWorkOrderSchemaReader";
import {
  buildSpecSheetSelectByIdQuery,
  buildSpecSheetSelectQuery,
  buildSpecSheetSummarySelectQuery,
} from "@/lib/workorder/repository/dbWorkOrderSelectSql";
import {
  buildSpecSheetInsertMutationSql,
  buildSpecSheetStatePatchMutationSql,
  buildSpecSheetUpdateMutationSql,
} from "@/lib/workorder/repository/dbWorkOrderMutationSql";
import { buildWorkOrderStatePatchAssignments } from "@/lib/workorder/repository/dbWorkOrderStatePatchAssignments";
import {
  buildWorkOrderInsertMutationArgs,
  buildWorkOrderUpdateMutationArgs,
} from "@/lib/workorder/repository/dbWorkOrderAssignmentBuilders";
import {
  buildSpecSheetCompanyScopePredicate,
  buildSoftDeleteSpecSheetAssignments,
  softDeleteAttachmentMemoBundleForWorkOrder,
} from "@/lib/workorder/repository/dbWorkOrderDeleteHelpers";
import { attachNormalizedDetailRows } from "@/lib/workorder/repository/dbWorkOrderDetailRows";
import {
  mergeWorkOrderWithExistingProductionDetails,
  shouldSyncProductionCompositionForFullWorkOrderSave,
  syncCreatedWorkOrderProductionComposition,
  syncPatchedWorkOrderProductionComposition,
} from "@/lib/workorder/repository/dbWorkOrderProductionSync";
export type {
  WorkOrderCompanyScope,
  WorkOrderVisibilityScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

const SPEC_SHEET_TABLE = "spec_sheets";
function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}


async function loadActiveSpecSheetRows(
  scope?: WorkOrderCompanyScope | null,
): Promise<DbSpecSheetRow[]> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const query = buildSpecSheetSelectQuery(schema, scope);
  const result = await queryDb<DbSpecSheetRow>(
    query.sql,
    query.values.length > 0 ? query.values : undefined,
  );

  return result.rows;
}

type WorkOrderSummaryQueryOptions = {
  status?: WorkOrderListStatusFilter;
  sort?: WorkOrderListSort;
};

async function loadActiveSpecSheetSummaryRows(
  options: WorkOrderSummaryQueryOptions = {},
  scope?: WorkOrderCompanyScope | null,
): Promise<DbSpecSheetRow[]> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const query = buildSpecSheetSummarySelectQuery(schema, options, scope);
  const result = await queryDb<DbSpecSheetRow>(
    query.sql,
    query.values.length > 0 ? query.values : undefined,
  );

  return result.rows;
}

export async function findDbWorkOrderSummaries(
  options: WorkOrderSummaryQueryOptions = {},
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrderSummary[]> {
  const rows = await loadActiveSpecSheetSummaryRows(options, scope);
  return rows.map(mapSpecSheetRowToWorkOrderSummary);
}

export async function findAllDbWorkOrders(
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  const rows = await loadActiveSpecSheetRows(scope);
  return attachNormalizedDetailRows(rows.map(mapSpecSheetRowToWorkOrder), scope);
}

export async function findDbWorkOrderById(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder | null> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const query = buildSpecSheetSelectByIdQuery(schema, workOrderId, scope);

  const result = await queryDb<DbSpecSheetRow>(
    query.sql,
    query.values,
  );
  const row = result.rows[0] ?? null;
  if (!row) return null;
  const [hydrated] = await attachNormalizedDetailRows([
    mapSpecSheetRowToWorkOrder(row),
  ], scope);
  return hydrated ?? mapSpecSheetRowToWorkOrder(row);
}

export async function createDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedBaseWorkOrder = normalizeWorkOrderForDb(workOrder);
  const resolvedCategoryIds = await resolveCategoryIdsForDb(
    normalizedBaseWorkOrder,
    scope,
  );
  const normalizedWorkOrder = {
    ...normalizedBaseWorkOrder,
    ...resolvedCategoryIds,
  };
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

  const mapped = mapSpecSheetRowToWorkOrder(created);
  const persisted = {
    ...normalizedWorkOrder,
    ...mapped,
    orderEntries: normalizedWorkOrder.orderEntries ?? [],
    materials: normalizedWorkOrder.materials ?? [],
    outsourcing: normalizedWorkOrder.outsourcing ?? [],
  };
  await syncCreatedWorkOrderProductionComposition(persisted, company);
  return persisted;
}

function isNotFoundWorkOrderError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /spec_sheets row not found for id:/i.test(error.message)
  );
}

export async function updateDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedBaseWorkOrder = normalizeWorkOrderForDb(workOrder);
  const resolvedCategoryIds = await resolveCategoryIdsForDb(
    normalizedBaseWorkOrder,
    scope,
  );
  const normalizedWorkOrder = {
    ...normalizedBaseWorkOrder,
    ...resolvedCategoryIds,
  };
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
  const shouldSyncProductionComposition = shouldSyncProductionCompositionForFullWorkOrderSave(normalizedWorkOrder);
  const existingWithDetails = shouldSyncProductionComposition
    ? null
    : await findDbWorkOrderById(normalizedWorkOrder.id, scope);
  const persisted = shouldSyncProductionComposition
    ? {
        ...normalizedWorkOrder,
        ...mapped,
        orderEntries: normalizedWorkOrder.orderEntries ?? [],
        materials: normalizedWorkOrder.materials ?? [],
        outsourcing: normalizedWorkOrder.outsourcing ?? [],
      }
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

export async function updateDbWorkOrderStatePatch(
  patch: WorkOrderStatePatch,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const { assignments, values } = buildWorkOrderStatePatchAssignments(
    schema,
    patch,
  );

  if (assignments.length === 0) {
    const existing = await findDbWorkOrderById(patch.id, scope);
    if (!existing)
      throw new Error(`spec_sheets row not found for id: ${patch.id}`);
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
  const patchedProductionWorkOrder = await syncPatchedWorkOrderProductionComposition({
    patch,
    mappedWorkOrder: mapped,
    company,
    scope,
    findWorkOrderById: findDbWorkOrderById,
  });

  if (patchedProductionWorkOrder) {
    return patchedProductionWorkOrder;
  }

  const existingWithDetails = await findDbWorkOrderById(patch.id, scope);
  return mergeWorkOrderWithExistingProductionDetails(mapped, existingWithDetails);
}

export async function deleteDbWorkOrder(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<string> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  if (schema.isActiveColumn) {
    const assignments = buildSoftDeleteSpecSheetAssignments(schema);
    const companyScopePredicate = buildSpecSheetCompanyScopePredicate(
      schema,
      scope,
    );

    const result = await queryDb<{ id: string }>(
      `
        UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
        SET
          ${assignments.join(",\n          ")}
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

    await softDeleteAttachmentMemoBundleForWorkOrder(deleted.id);
    return deleted.id;
  }

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

  await softDeleteAttachmentMemoBundleForWorkOrder(deleted.id);
  return deleted.id;
}

export async function saveDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  try {
    return await updateDbWorkOrder(workOrder, scope);
  } catch (error) {
    if (!isNotFoundWorkOrderError(error)) {
      throw error;
    }

    return createDbWorkOrder(workOrder, scope);
  }
}

export async function saveDbWorkOrders(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  const savedWorkOrders: WorkOrder[] = [];

  for (const workOrder of workOrders) {
    savedWorkOrders.push(await saveDbWorkOrder(workOrder, scope));
  }

  return savedWorkOrders;
}
