import "server-only";

import { queryDb } from "@/lib/db/client";
import {
  COMPANY_ID_COLUMN_CANDIDATES,
  COMPANY_NAME_COLUMN_CANDIDATES,
  WORKFLOW_STATE_COLUMN_CANDIDATES,
  WORKFLOW_PATH_COLUMN_CANDIDATES,
  LAST_SAVED_AT_COLUMN_CANDIDATES,
  WORK_ORDER_KIND_COLUMN_CANDIDATES,
  REORDER_GROUP_ID_COLUMN_CANDIDATES,
  REORDER_ROUND_COLUMN_CANDIDATES,
  PARENT_SPEC_SHEET_ID_COLUMN_CANDIDATES,
  IS_REWORK_COLUMN_CANDIDATES,
  CREATED_AT_COLUMN_CANDIDATES,
  UPDATED_AT_COLUMN_CANDIDATES,
  IS_ACTIVE_COLUMN_CANDIDATES,
  DELETED_AT_COLUMN_CANDIDATES,
  DELETE_STATUS_COLUMN_CANDIDATES,
  PURGE_STATUS_COLUMN_CANDIDATES,
  PURGE_REQUESTED_AT_COLUMN_CANDIDATES,
  PURGED_AT_COLUMN_CANDIDATES,
  PURGED_BY_COLUMN_CANDIDATES,
  PURGE_REQUESTED_BY_COLUMN_CANDIDATES,
  DELETE_SOURCE_COLUMN_CANDIDATES,
  DELETE_SCOPE_COLUMN_CANDIDATES,
  DELETE_PARENT_TYPE_COLUMN_CANDIDATES,
  DELETE_PARENT_ID_COLUMN_CANDIDATES,
  DELETE_BATCH_ID_COLUMN_CANDIDATES,
  CATEGORY1_ID_COLUMN_CANDIDATES,
  CATEGORY2_ID_COLUMN_CANDIDATES,
  CATEGORY3_ID_COLUMN_CANDIDATES,
  DISPLAY_TITLE_COLUMN_CANDIDATES,
  BASE_TITLE_COLUMN_CANDIDATES,
  CATEGORY1_COLUMN_CANDIDATES,
  CATEGORY2_COLUMN_CANDIDATES,
  CATEGORY3_COLUMN_CANDIDATES,
  SEASON_COLUMN_CANDIDATES,
  PRIORITY_COLUMN_CANDIDATES,
  VENDOR_COLUMN_CANDIDATES,
  MANAGER_COLUMN_CANDIDATES,
  MANAGER_ID_COLUMN_CANDIDATES,
  CREATED_BY_ID_COLUMN_CANDIDATES,
  CREATED_BY_ROLE_COLUMN_CANDIDATES,
  DUE_DATE_COLUMN_CANDIDATES,
  QUANTITY_COLUMN_CANDIDATES,
  INVENTORY_QUANTITY_COLUMN_CANDIDATES,
  INVENTORY_STATUS_COLUMN_CANDIDATES,
  MEMO_COLUMN_CANDIDATES,
  REJECTION_REASON_COLUMN_CANDIDATES,
  REJECTED_AT_COLUMN_CANDIDATES,
  REJECTED_BY_USER_ID_COLUMN_CANDIDATES,
  REJECTED_BY_NAME_COLUMN_CANDIDATES,
} from "@/lib/workorder/repository/dbWorkOrderSchemaColumns";
import type {
  DbColumnInfo,
  DbSpecSheetSchema,
} from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";

const SPEC_SHEET_TABLE = "spec_sheets";

function findFirstMatchingColumn(
  columnNames: string[],
  candidates: readonly string[],
): string | null {
  for (const candidate of candidates) {
    if (columnNames.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

let specSheetSchemaCache: Promise<DbSpecSheetSchema> | null = null;

async function readSpecSheetSchema(): Promise<DbSpecSheetSchema> {
  const result = await queryDb<DbColumnInfo>(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
    `,
    [SPEC_SHEET_TABLE],
  );

  const columns = result.rows;
  const columnNames = columns.map((row) => row.column_name);

  if (columnNames.length === 0) {
    throw new Error(`relation "${SPEC_SHEET_TABLE}" does not exist`);
  }

  return {
    companyIdColumn: findFirstMatchingColumn(
      columnNames,
      COMPANY_ID_COLUMN_CANDIDATES,
    ),
    companyNameColumn: findFirstMatchingColumn(
      columnNames,
      COMPANY_NAME_COLUMN_CANDIDATES,
    ),
    workflowStateColumn: findFirstMatchingColumn(
      columnNames,
      WORKFLOW_STATE_COLUMN_CANDIDATES,
    ),
    workflowPathColumn: findFirstMatchingColumn(
      columnNames,
      WORKFLOW_PATH_COLUMN_CANDIDATES,
    ),
    lastSavedAtColumn: findFirstMatchingColumn(
      columnNames,
      LAST_SAVED_AT_COLUMN_CANDIDATES,
    ),
    workOrderKindColumn: findFirstMatchingColumn(
      columnNames,
      WORK_ORDER_KIND_COLUMN_CANDIDATES,
    ),
    reorderGroupIdColumn: findFirstMatchingColumn(
      columnNames,
      REORDER_GROUP_ID_COLUMN_CANDIDATES,
    ),
    reorderRoundColumn: findFirstMatchingColumn(
      columnNames,
      REORDER_ROUND_COLUMN_CANDIDATES,
    ),
    parentSpecSheetIdColumn: findFirstMatchingColumn(
      columnNames,
      PARENT_SPEC_SHEET_ID_COLUMN_CANDIDATES,
    ),
    isReworkColumn: findFirstMatchingColumn(
      columnNames,
      IS_REWORK_COLUMN_CANDIDATES,
    ),
    createdAtColumn: findFirstMatchingColumn(
      columnNames,
      CREATED_AT_COLUMN_CANDIDATES,
    ),
    updatedAtColumn: findFirstMatchingColumn(
      columnNames,
      UPDATED_AT_COLUMN_CANDIDATES,
    ),
    isActiveColumn: findFirstMatchingColumn(
      columnNames,
      IS_ACTIVE_COLUMN_CANDIDATES,
    ),
    deletedAtColumn: findFirstMatchingColumn(
      columnNames,
      DELETED_AT_COLUMN_CANDIDATES,
    ),
    deleteStatusColumn: findFirstMatchingColumn(
      columnNames,
      DELETE_STATUS_COLUMN_CANDIDATES,
    ),
    purgeStatusColumn: findFirstMatchingColumn(
      columnNames,
      PURGE_STATUS_COLUMN_CANDIDATES,
    ),
    purgeRequestedAtColumn: findFirstMatchingColumn(
      columnNames,
      PURGE_REQUESTED_AT_COLUMN_CANDIDATES,
    ),
    purgedAtColumn: findFirstMatchingColumn(
      columnNames,
      PURGED_AT_COLUMN_CANDIDATES,
    ),
    purgedByColumn: findFirstMatchingColumn(
      columnNames,
      PURGED_BY_COLUMN_CANDIDATES,
    ),
    purgeRequestedByColumn: findFirstMatchingColumn(
      columnNames,
      PURGE_REQUESTED_BY_COLUMN_CANDIDATES,
    ),
    deleteSourceColumn: findFirstMatchingColumn(
      columnNames,
      DELETE_SOURCE_COLUMN_CANDIDATES,
    ),
    deleteScopeColumn: findFirstMatchingColumn(
      columnNames,
      DELETE_SCOPE_COLUMN_CANDIDATES,
    ),
    deleteParentTypeColumn: findFirstMatchingColumn(
      columnNames,
      DELETE_PARENT_TYPE_COLUMN_CANDIDATES,
    ),
    deleteParentIdColumn: findFirstMatchingColumn(
      columnNames,
      DELETE_PARENT_ID_COLUMN_CANDIDATES,
    ),
    deleteBatchIdColumn: findFirstMatchingColumn(
      columnNames,
      DELETE_BATCH_ID_COLUMN_CANDIDATES,
    ),
    category1IdColumn: findFirstMatchingColumn(
      columnNames,
      CATEGORY1_ID_COLUMN_CANDIDATES,
    ),
    category2IdColumn: findFirstMatchingColumn(
      columnNames,
      CATEGORY2_ID_COLUMN_CANDIDATES,
    ),
    category3IdColumn: findFirstMatchingColumn(
      columnNames,
      CATEGORY3_ID_COLUMN_CANDIDATES,
    ),
    displayTitleColumn: findFirstMatchingColumn(
      columnNames,
      DISPLAY_TITLE_COLUMN_CANDIDATES,
    ),
    baseTitleColumn: findFirstMatchingColumn(
      columnNames,
      BASE_TITLE_COLUMN_CANDIDATES,
    ),
    category1Column: findFirstMatchingColumn(
      columnNames,
      CATEGORY1_COLUMN_CANDIDATES,
    ),
    category2Column: findFirstMatchingColumn(
      columnNames,
      CATEGORY2_COLUMN_CANDIDATES,
    ),
    category3Column: findFirstMatchingColumn(
      columnNames,
      CATEGORY3_COLUMN_CANDIDATES,
    ),
    seasonColumn: findFirstMatchingColumn(
      columnNames,
      SEASON_COLUMN_CANDIDATES,
    ),
    priorityColumn: findFirstMatchingColumn(
      columnNames,
      PRIORITY_COLUMN_CANDIDATES,
    ),
    vendorColumn: findFirstMatchingColumn(
      columnNames,
      VENDOR_COLUMN_CANDIDATES,
    ),
    managerColumn: findFirstMatchingColumn(
      columnNames,
      MANAGER_COLUMN_CANDIDATES,
    ),
    managerIdColumn: findFirstMatchingColumn(
      columnNames,
      MANAGER_ID_COLUMN_CANDIDATES,
    ),
    createdByIdColumn: findFirstMatchingColumn(
      columnNames,
      CREATED_BY_ID_COLUMN_CANDIDATES,
    ),
    createdByRoleColumn: findFirstMatchingColumn(
      columnNames,
      CREATED_BY_ROLE_COLUMN_CANDIDATES,
    ),
    dueDateColumn: findFirstMatchingColumn(
      columnNames,
      DUE_DATE_COLUMN_CANDIDATES,
    ),
    quantityColumn: findFirstMatchingColumn(
      columnNames,
      QUANTITY_COLUMN_CANDIDATES,
    ),
    inventoryQuantityColumn: findFirstMatchingColumn(
      columnNames,
      INVENTORY_QUANTITY_COLUMN_CANDIDATES,
    ),
    inventoryStatusColumn: findFirstMatchingColumn(
      columnNames,
      INVENTORY_STATUS_COLUMN_CANDIDATES,
    ),
    memoColumn: findFirstMatchingColumn(columnNames, MEMO_COLUMN_CANDIDATES),
    rejectionReasonColumn: findFirstMatchingColumn(columnNames, REJECTION_REASON_COLUMN_CANDIDATES),
    rejectedAtColumn: findFirstMatchingColumn(columnNames, REJECTED_AT_COLUMN_CANDIDATES),
    rejectedByUserIdColumn: findFirstMatchingColumn(columnNames, REJECTED_BY_USER_ID_COLUMN_CANDIDATES),
    rejectedByNameColumn: findFirstMatchingColumn(columnNames, REJECTED_BY_NAME_COLUMN_CANDIDATES),
    hasIdColumn: columnNames.includes("id"),
    hasTitleColumn: columnNames.includes("title"),
  };
}

export function loadSpecSheetSchema(): Promise<DbSpecSheetSchema> {
  if (!specSheetSchemaCache) {
    specSheetSchemaCache = readSpecSheetSchema().catch((error) => {
      specSheetSchemaCache = null;
      throw error;
    });
  }

  return specSheetSchemaCache;
}

export function assertMinimumSpecSheetSchema(schema: DbSpecSheetSchema) {
  const missingColumns = [
    !schema.hasIdColumn ? "id" : null,
    !schema.hasTitleColumn ? "title" : null,
    !schema.companyIdColumn ? "company_id" : null,
  ].filter((value): value is string => Boolean(value));

  if (missingColumns.length > 0) {
    throw new Error(
      `spec_sheets table is missing required columns: ${missingColumns.join(", ")}`,
    );
  }
}
