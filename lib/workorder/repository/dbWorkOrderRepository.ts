import "server-only";

import { queryDb } from "@/lib/db/client";
import {
  type WorkOrderListSort,
  type WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import type {
  WorkOrder,
  WorkOrderStatePatch,
  WorkOrderSummary,
} from "@/types/workorder";
import {
  resolveWorkOrderCompanyScope,
  type WorkOrderCompanyScope,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import type { DbSpecSheetRow } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";
import {
  mapSpecSheetRowToWorkOrder,
  mapSpecSheetRowToWorkOrderSummary,
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
import { buildSpecSheetStatePatchMutationSql } from "@/lib/workorder/repository/dbWorkOrderMutationSql";
import { buildWorkOrderStatePatchAssignments } from "@/lib/workorder/repository/dbWorkOrderStatePatchAssignments";
import {
  buildSpecSheetCompanyScopePredicate,
  buildSoftDeleteSpecSheetAssignments,
  softDeleteAttachmentMemoBundleForWorkOrder,
} from "@/lib/workorder/repository/dbWorkOrderDeleteHelpers";
import { attachNormalizedDetailRows } from "@/lib/workorder/repository/dbWorkOrderDetailRows";
import {
  createDbWorkOrderRecord,
  updateDbWorkOrderRecord,
} from "@/lib/workorder/repository/dbWorkOrderMutationFlows";
import {
  saveDbWorkOrderRecord,
  saveDbWorkOrderRecords,
} from "@/lib/workorder/repository/dbWorkOrderSaveFlows";
import {
  mergeWorkOrderWithExistingProductionDetails,
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
  return attachNormalizedDetailRows(
    rows.map(mapSpecSheetRowToWorkOrder),
    scope,
  );
}

export async function findDbWorkOrderById(
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder | null> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const query = buildSpecSheetSelectByIdQuery(schema, workOrderId, scope);

  const result = await queryDb<DbSpecSheetRow>(query.sql, query.values);
  const row = result.rows[0] ?? null;
  if (!row) return null;
  const [hydrated] = await attachNormalizedDetailRows(
    [mapSpecSheetRowToWorkOrder(row)],
    scope,
  );
  return hydrated ?? mapSpecSheetRowToWorkOrder(row);
}

export async function createDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return createDbWorkOrderRecord(workOrder, scope);
}

export async function updateDbWorkOrder(
  workOrder: WorkOrder,
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder> {
  return updateDbWorkOrderRecord(workOrder, scope, findDbWorkOrderById);
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
  const patchedProductionWorkOrder =
    await syncPatchedWorkOrderProductionComposition({
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
  return mergeWorkOrderWithExistingProductionDetails(
    mapped,
    existingWithDetails,
  );
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
  return saveDbWorkOrderRecord({
    workOrder,
    scope,
    createWorkOrder: createDbWorkOrder,
    updateWorkOrder: updateDbWorkOrder,
  });
}

export async function saveDbWorkOrders(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  return saveDbWorkOrderRecords({
    workOrders,
    scope,
    saveWorkOrder: saveDbWorkOrder,
  });
}
