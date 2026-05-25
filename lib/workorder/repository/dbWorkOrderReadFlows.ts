import "server-only";

import { queryDb } from "@/lib/db/client";
import type {
  WorkOrderListSort,
  WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";
import type { WorkOrder, WorkOrderSummary } from "@/types/workorder";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
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
import { attachNormalizedDetailRows } from "@/lib/workorder/repository/dbWorkOrderDetailRows";

type WorkOrderSummaryQueryOptions = {
  status?: WorkOrderListStatusFilter;
  sort?: WorkOrderListSort;
};

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

export async function findDbWorkOrderSummaryRecords(
  options: WorkOrderSummaryQueryOptions = {},
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrderSummary[]> {
  const rows = await loadActiveSpecSheetSummaryRows(options, scope);
  return rows.map(mapSpecSheetRowToWorkOrderSummary);
}

export async function findAllDbWorkOrderRecords(
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  const rows = await loadActiveSpecSheetRows(scope);
  return attachNormalizedDetailRows(
    rows.map(mapSpecSheetRowToWorkOrder),
    scope,
  );
}

export async function findDbWorkOrderRecordById(
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
