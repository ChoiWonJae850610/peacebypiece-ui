import "server-only";

import { queryDb } from "@/lib/db/client";
import { getAdminCompanyId, getAdminCompanyScope } from "@/lib/admin/settings/companyScope";
import { LEGACY_WORKFLOW_STATE_MAP, WORKFLOW_STATES } from "@/lib/constants/workorderStates";
import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";
import type { WorkOrder } from "@/types/workorder";
import { applyReorderIdentity } from "@/lib/workorder/reorder/helpers";
import { syncDbFactoryOrdersForSpecSheet } from "@/lib/workorder/repository/dbFactoryOrderRepository";
import { syncDbSpecSheetMaterialsForSpecSheet } from "@/lib/workorder/repository/dbSpecSheetMaterialRepository";
import { syncDbSpecSheetOutsourcingForSpecSheet } from "@/lib/workorder/repository/dbSpecSheetOutsourcingRepository";

const SPEC_SHEET_TABLE = "spec_sheets";
const DEFAULT_WORKFLOW_STATE: WorkOrder["workflowState"] = "draft";

const COMPANY_ID_COLUMN_CANDIDATES = ["company_id"] as const;
const COMPANY_NAME_COLUMN_CANDIDATES = ["company_name"] as const;
const PAYLOAD_COLUMN_CANDIDATES = ["payload", "data", "workorder_payload", "work_order_payload"] as const;
const WORKFLOW_STATE_COLUMN_CANDIDATES = ["workflow_state", "status", "state"] as const;
const LAST_SAVED_AT_COLUMN_CANDIDATES = ["last_saved_at", "saved_at"] as const;
const WORK_ORDER_KIND_COLUMN_CANDIDATES = ["work_order_kind"] as const;
const REORDER_GROUP_ID_COLUMN_CANDIDATES = ["reorder_group_id"] as const;
const REORDER_ROUND_COLUMN_CANDIDATES = ["reorder_round"] as const;
const PARENT_SPEC_SHEET_ID_COLUMN_CANDIDATES = ["parent_spec_sheet_id"] as const;
const IS_REWORK_COLUMN_CANDIDATES = ["is_rework", "is_defect_order"] as const;
const CREATED_AT_COLUMN_CANDIDATES = ["created_at"] as const;
const UPDATED_AT_COLUMN_CANDIDATES = ["updated_at"] as const;
const IS_ACTIVE_COLUMN_CANDIDATES = ["is_active"] as const;
const DELETED_AT_COLUMN_CANDIDATES = ["deleted_at"] as const;

type DbSpecSheetRow = {
  id: string;
  title: string;
  workflow_state: string | null;
  last_saved_at: string | null;
  work_order_kind: WorkOrder["workOrderKind"] | null;
  reorder_group_id: string | null;
  reorder_round: number | null;
  parent_spec_sheet_id: string | null;
  is_rework: boolean | null;
  payload: WorkOrder | string | null;
  is_active?: boolean | null;
  deleted_at?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

type DbColumnInfo = {
  column_name: string;
  data_type: string;
  udt_name: string;
};

type DbPayloadColumnKind = "json" | "jsonb" | "text";

type DbSpecSheetSchema = {
  companyIdColumn: string | null;
  companyNameColumn: string | null;
  payloadColumn: string | null;
  payloadColumnKind: DbPayloadColumnKind | null;
  workflowStateColumn: string | null;
  lastSavedAtColumn: string | null;
  workOrderKindColumn: string | null;
  reorderGroupIdColumn: string | null;
  reorderRoundColumn: string | null;
  parentSpecSheetIdColumn: string | null;
  isReworkColumn: string | null;
  createdAtColumn: string | null;
  updatedAtColumn: string | null;
  isActiveColumn: string | null;
  deletedAtColumn: string | null;
  hasIdColumn: boolean;
  hasTitleColumn: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoString(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

function normalizeDbWorkflowState(value: string | null | undefined): WorkOrder["workflowState"] {
  if (!value) return DEFAULT_WORKFLOW_STATE;
  if ((WORKFLOW_STATES as readonly string[]).includes(value)) {
    return value as WorkOrder["workflowState"];
  }
  if (value in LEGACY_WORKFLOW_STATE_MAP) {
    return LEGACY_WORKFLOW_STATE_MAP[value as keyof typeof LEGACY_WORKFLOW_STATE_MAP] as WorkOrder["workflowState"];
  }
  return DEFAULT_WORKFLOW_STATE;
}

function normalizeWorkOrderForDb(workOrder: WorkOrder): WorkOrder {
  const now = new Date().toISOString();
  const normalizedIdentity = applyReorderIdentity(workOrder);

  return {
    ...normalizedIdentity,
    workflowState: normalizeDbWorkflowState(workOrder.workflowState),
    lastSavedAt: workOrder.lastSavedAt || now,
  };
}

function serializeWorkOrderPayload(workOrder: WorkOrder): Partial<WorkOrder> {
  const normalizedWorkOrder = normalizeWorkOrderForDb(workOrder);
  const {
    id: _id,
    title: _title,
    baseTitle: _baseTitle,
    displayTitle: _displayTitle,
    workOrderKind: _workOrderKind,
    reorderGroupId: _reorderGroupId,
    reorderRound: _reorderRound,
    parentSpecSheetId: _parentSpecSheetId,
    isDefectOrder: _isDefectOrder,
    workflowState: _workflowState,
    lastSavedAt: _lastSavedAt,
    attachments: _attachments,
    memoThreads: _memoThreads,
    ...payload
  } = normalizedWorkOrder;

  void _id;
  void _title;
  void _baseTitle;
  void _displayTitle;
  void _workOrderKind;
  void _reorderGroupId;
  void _reorderRound;
  void _parentSpecSheetId;
  void _isDefectOrder;
  void _workflowState;
  void _lastSavedAt;
  void _attachments;
  void _memoThreads;

  return payload;
}

function parsePayloadValue(payload: DbSpecSheetRow["payload"]): Partial<WorkOrder> {
  if (isObject(payload)) {
    return payload as Partial<WorkOrder>;
  }

  if (typeof payload !== "string") {
    return {};
  }

  const trimmed = payload.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isObject(parsed) ? (parsed as Partial<WorkOrder>) : {};
  } catch {
    return {};
  }
}

function mapSpecSheetRowToWorkOrder(row: DbSpecSheetRow): WorkOrder {
  const payload = parsePayloadValue(row.payload);

  const hydrated = {
    ...(payload as WorkOrder),
    id: row.id,
    title: row.title,
    workOrderKind: row.work_order_kind ?? payload.workOrderKind ?? undefined,
    reorderGroupId: row.reorder_group_id ?? (typeof payload.reorderGroupId === "string" ? payload.reorderGroupId : undefined),
    reorderRound: typeof row.reorder_round === "number" ? row.reorder_round : (typeof payload.reorderRound === "number" ? payload.reorderRound : undefined),
    parentSpecSheetId: row.parent_spec_sheet_id ?? (typeof payload.parentSpecSheetId === "string" ? payload.parentSpecSheetId : undefined),
    isDefectOrder: typeof row.is_rework === "boolean" ? row.is_rework : (typeof payload.isDefectOrder === "boolean" ? payload.isDefectOrder : undefined),
    workflowState:
      row.workflow_state !== null && row.workflow_state !== undefined
        ? normalizeDbWorkflowState(row.workflow_state)
        : (typeof payload.workflowState === "string" ? payload.workflowState : DEFAULT_WORKFLOW_STATE),
    lastSavedAt:
      row.last_saved_at ??
      toIsoString(row.updated_at) ??
      toIsoString(row.created_at) ??
      (typeof payload.lastSavedAt === "string" ? payload.lastSavedAt : ""),
  } satisfies WorkOrder;

  return applyReorderIdentity(hydrated);
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function findFirstMatchingColumn(columnNames: string[], candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    if (columnNames.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

function buildAliasSelection(columnName: string | null, alias: keyof DbSpecSheetRow, fallbackSql: string): string {
  if (!columnName) {
    return `${fallbackSql} AS ${alias}`;
  }

  return `${quoteIdentifier(columnName)} AS ${alias}`;
}

function getPayloadColumnKind(column: DbColumnInfo | undefined): DbPayloadColumnKind | null {
  if (!column) return null;

  if (column.udt_name === "jsonb") return "jsonb";
  if (column.udt_name === "json") return "json";
  if (column.data_type === "text" || column.udt_name === "text" || column.data_type === "character varying" || column.udt_name === "varchar") {
    return "text";
  }

  return null;
}

function buildPayloadInsertPlaceholder(kind: DbPayloadColumnKind | null, placeholderIndex: number): string {
  if (kind === "jsonb") return `$${placeholderIndex}::jsonb`;
  if (kind === "json") return `$${placeholderIndex}::json`;
  return `$${placeholderIndex}`;
}

function buildPayloadValue(kind: DbPayloadColumnKind | null, payload: Partial<WorkOrder>): string {
  const serialized = JSON.stringify(payload);
  return serialized;
}

async function loadSpecSheetSchema(): Promise<DbSpecSheetSchema> {
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
    throw new Error(`relation \"${SPEC_SHEET_TABLE}\" does not exist`);
  }

  const payloadColumn = findFirstMatchingColumn(columnNames, PAYLOAD_COLUMN_CANDIDATES);
  const payloadColumnInfo = payloadColumn ? columns.find((column) => column.column_name === payloadColumn) : undefined;
  const payloadColumnKind = getPayloadColumnKind(payloadColumnInfo);

  if (payloadColumn && !payloadColumnKind) {
    throw new Error(`Unsupported payload column type for ${payloadColumn}: ${payloadColumnInfo?.data_type ?? "unknown"}/${payloadColumnInfo?.udt_name ?? "unknown"}`);
  }

  return {
    companyIdColumn: findFirstMatchingColumn(columnNames, COMPANY_ID_COLUMN_CANDIDATES),
    companyNameColumn: findFirstMatchingColumn(columnNames, COMPANY_NAME_COLUMN_CANDIDATES),
    payloadColumn,
    payloadColumnKind,
    workflowStateColumn: findFirstMatchingColumn(columnNames, WORKFLOW_STATE_COLUMN_CANDIDATES),
    lastSavedAtColumn: findFirstMatchingColumn(columnNames, LAST_SAVED_AT_COLUMN_CANDIDATES),
    workOrderKindColumn: findFirstMatchingColumn(columnNames, WORK_ORDER_KIND_COLUMN_CANDIDATES),
    reorderGroupIdColumn: findFirstMatchingColumn(columnNames, REORDER_GROUP_ID_COLUMN_CANDIDATES),
    reorderRoundColumn: findFirstMatchingColumn(columnNames, REORDER_ROUND_COLUMN_CANDIDATES),
    parentSpecSheetIdColumn: findFirstMatchingColumn(columnNames, PARENT_SPEC_SHEET_ID_COLUMN_CANDIDATES),
    isReworkColumn: findFirstMatchingColumn(columnNames, IS_REWORK_COLUMN_CANDIDATES),
    createdAtColumn: findFirstMatchingColumn(columnNames, CREATED_AT_COLUMN_CANDIDATES),
    updatedAtColumn: findFirstMatchingColumn(columnNames, UPDATED_AT_COLUMN_CANDIDATES),
    isActiveColumn: findFirstMatchingColumn(columnNames, IS_ACTIVE_COLUMN_CANDIDATES),
    deletedAtColumn: findFirstMatchingColumn(columnNames, DELETED_AT_COLUMN_CANDIDATES),
    hasIdColumn: columnNames.includes("id"),
    hasTitleColumn: columnNames.includes("title"),
  };
}

function assertMinimumSpecSheetSchema(schema: DbSpecSheetSchema) {
  const missingColumns = [
    !schema.hasIdColumn ? "id" : null,
    !schema.hasTitleColumn ? "title" : null,
  ].filter((value): value is string => Boolean(value));

  if (missingColumns.length > 0) {
    throw new Error(`spec_sheets table is missing required columns: ${missingColumns.join(", ")}`);
  }
}

export async function findAllDbWorkOrders(): Promise<WorkOrder[]> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const payloadFallbackSql = schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

  const result = await queryDb<DbSpecSheetRow>(
    `
      SELECT
        id,
        title,
        ${buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL")},
        ${buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL")},
        ${buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL")},
        ${buildAliasSelection(schema.reorderGroupIdColumn, "reorder_group_id", "NULL")},
        ${buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL")},
        ${buildAliasSelection(schema.parentSpecSheetIdColumn, "parent_spec_sheet_id", "NULL")},
        ${buildAliasSelection(schema.isReworkColumn, "is_rework", "NULL")},
        ${buildAliasSelection(schema.payloadColumn, "payload", payloadFallbackSql)},
        ${buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE")},
        ${buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL")},
        ${buildAliasSelection(schema.createdAtColumn, "created_at", "NULL")},
        ${buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL")}
      FROM ${quoteIdentifier(SPEC_SHEET_TABLE)}
      ${schema.companyIdColumn ? `WHERE ${quoteIdentifier(schema.companyIdColumn)} = $1` : schema.isActiveColumn ? `WHERE ${quoteIdentifier(schema.isActiveColumn)} = TRUE` : ""}
      ${schema.companyIdColumn && schema.isActiveColumn ? `AND ${quoteIdentifier(schema.isActiveColumn)} = TRUE` : ""}
      ORDER BY ${schema.updatedAtColumn ? `${quoteIdentifier(schema.updatedAtColumn)} DESC NULLS LAST, ` : ""}${schema.createdAtColumn ? `${quoteIdentifier(schema.createdAtColumn)} DESC NULLS LAST, ` : ""}id DESC
    `,
    schema.companyIdColumn ? [getAdminCompanyId()] : undefined,
  );

  return result.rows.map(mapSpecSheetRowToWorkOrder);
}

export async function createDbWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedWorkOrder = normalizeWorkOrderForDb(workOrder);
  const payload = serializeWorkOrderPayload(normalizedWorkOrder);

  const columns = ["id", "title"];
  const values: unknown[] = [normalizedWorkOrder.id, normalizedWorkOrder.title];
  const placeholders = ["$1", "$2"];
  const company = getAdminCompanyScope();

  if (schema.companyIdColumn) {
    columns.push(schema.companyIdColumn);
    values.push(company.companyId);
    placeholders.push(`$${values.length}`);
  }

  if (schema.companyNameColumn) {
    columns.push(schema.companyNameColumn);
    values.push(company.companyName);
    placeholders.push(`$${values.length}`);
  }

  if (schema.workflowStateColumn) {
    columns.push(schema.workflowStateColumn);
    values.push(normalizedWorkOrder.workflowState);
    placeholders.push(`$${values.length}`);
  }

  if (schema.lastSavedAtColumn) {
    columns.push(schema.lastSavedAtColumn);
    values.push(normalizedWorkOrder.lastSavedAt);
    placeholders.push(`$${values.length}`);
  }

  if (schema.workOrderKindColumn) {
    columns.push(schema.workOrderKindColumn);
    values.push(normalizedWorkOrder.workOrderKind ?? "sample");
    placeholders.push(`$${values.length}`);
  }

  if (schema.reorderGroupIdColumn) {
    columns.push(schema.reorderGroupIdColumn);
    values.push(normalizedWorkOrder.reorderGroupId ?? normalizedWorkOrder.id);
    placeholders.push(`$${values.length}`);
  }

  if (schema.reorderRoundColumn) {
    columns.push(schema.reorderRoundColumn);
    values.push(normalizedWorkOrder.reorderRound ?? 0);
    placeholders.push(`$${values.length}`);
  }

  if (schema.parentSpecSheetIdColumn) {
    columns.push(schema.parentSpecSheetIdColumn);
    values.push(normalizedWorkOrder.parentSpecSheetId ?? null);
    placeholders.push(`$${values.length}`);
  }

  if (schema.isReworkColumn) {
    columns.push(schema.isReworkColumn);
    values.push(Boolean(normalizedWorkOrder.isDefectOrder));
    placeholders.push(`$${values.length}`);
  }

  if (schema.payloadColumn) {
    columns.push(schema.payloadColumn);
    values.push(buildPayloadValue(schema.payloadColumnKind, payload));
    placeholders.push(buildPayloadInsertPlaceholder(schema.payloadColumnKind, values.length));
  }

  if (schema.isActiveColumn) {
    columns.push(schema.isActiveColumn);
    values.push(true);
    placeholders.push(`$${values.length}`);
  }

  if (schema.deletedAtColumn) {
    columns.push(schema.deletedAtColumn);
    values.push(null);
    placeholders.push(`$${values.length}`);
  }

  const payloadFallbackSql = schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

  const returningColumns = [
    "id",
    "title",
    buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL"),
    buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL"),
    buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL"),
    buildAliasSelection(schema.reorderGroupIdColumn, "reorder_group_id", "NULL"),
    buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL"),
    buildAliasSelection(schema.parentSpecSheetIdColumn, "parent_spec_sheet_id", "NULL"),
    buildAliasSelection(schema.isReworkColumn, "is_rework", "NULL"),
    buildAliasSelection(schema.payloadColumn, "payload", payloadFallbackSql),
    buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE"),
    buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL"),
    buildAliasSelection(schema.createdAtColumn, "created_at", "NULL"),
    buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL"),
  ];

  const result = await queryDb<DbSpecSheetRow>(
    `
      INSERT INTO ${quoteIdentifier(SPEC_SHEET_TABLE)} (
        ${columns.map(quoteIdentifier).join(", ")}
      )
      VALUES (
        ${placeholders.join(", ")}
      )
      RETURNING
        ${returningColumns.join(",\n        ")}
    `,
    values,
  );

  const created = result.rows[0];

  if (!created) {
    throw new Error("Failed to create work order in DB.");
  }

  const mapped = mapSpecSheetRowToWorkOrder(created);
  await syncDbFactoryOrdersForSpecSheet(mapped);
  await syncDbSpecSheetMaterialsForSpecSheet(mapped);
  await syncDbSpecSheetOutsourcingForSpecSheet(mapped);
  return mapped;
}

function isNotFoundWorkOrderError(error: unknown): boolean {
  return error instanceof Error && /spec_sheets row not found for id:/i.test(error.message);
}

export async function updateDbWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedWorkOrder = normalizeWorkOrderForDb(workOrder);
  const payload = serializeWorkOrderPayload(normalizedWorkOrder);

  const assignments = ["title = $2"];
  const values: unknown[] = [normalizedWorkOrder.id, normalizedWorkOrder.title];
  const company = getAdminCompanyScope();

  if (schema.companyIdColumn) {
    assignments.push(`${quoteIdentifier(schema.companyIdColumn)} = $${values.length + 1}`);
    values.push(company.companyId);
  }

  if (schema.companyNameColumn) {
    assignments.push(`${quoteIdentifier(schema.companyNameColumn)} = $${values.length + 1}`);
    values.push(company.companyName);
  }

  if (schema.workflowStateColumn) {
    assignments.push(`${quoteIdentifier(schema.workflowStateColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkOrder.workflowState);
  }

  if (schema.lastSavedAtColumn) {
    assignments.push(`${quoteIdentifier(schema.lastSavedAtColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkOrder.lastSavedAt);
  }

  if (schema.workOrderKindColumn) {
    assignments.push(`${quoteIdentifier(schema.workOrderKindColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkOrder.workOrderKind ?? "sample");
  }

  if (schema.reorderGroupIdColumn) {
    assignments.push(`${quoteIdentifier(schema.reorderGroupIdColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkOrder.reorderGroupId ?? normalizedWorkOrder.id);
  }

  if (schema.reorderRoundColumn) {
    assignments.push(`${quoteIdentifier(schema.reorderRoundColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkOrder.reorderRound ?? 0);
  }

  if (schema.parentSpecSheetIdColumn) {
    assignments.push(`${quoteIdentifier(schema.parentSpecSheetIdColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkOrder.parentSpecSheetId ?? null);
  }

  if (schema.isReworkColumn) {
    assignments.push(`${quoteIdentifier(schema.isReworkColumn)} = $${values.length + 1}`);
    values.push(Boolean(normalizedWorkOrder.isDefectOrder));
  }

  if (schema.payloadColumn) {
    assignments.push(`${quoteIdentifier(schema.payloadColumn)} = ${buildPayloadInsertPlaceholder(schema.payloadColumnKind, values.length + 1)}`);
    values.push(buildPayloadValue(schema.payloadColumnKind, payload));
  }

  if (schema.isActiveColumn) {
    assignments.push(`${quoteIdentifier(schema.isActiveColumn)} = $${values.length + 1}`);
    values.push(true);
  }

  if (schema.deletedAtColumn) {
    assignments.push(`${quoteIdentifier(schema.deletedAtColumn)} = $${values.length + 1}`);
    values.push(null);
  }

  const payloadFallbackSql = schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

  const returningColumns = [
    "id",
    "title",
    buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL"),
    buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL"),
    buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL"),
    buildAliasSelection(schema.reorderGroupIdColumn, "reorder_group_id", "NULL"),
    buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL"),
    buildAliasSelection(schema.parentSpecSheetIdColumn, "parent_spec_sheet_id", "NULL"),
    buildAliasSelection(schema.isReworkColumn, "is_rework", "NULL"),
    buildAliasSelection(schema.payloadColumn, "payload", payloadFallbackSql),
    buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE"),
    buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL"),
    buildAliasSelection(schema.createdAtColumn, "created_at", "NULL"),
    buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL"),
  ];

  const result = await queryDb<DbSpecSheetRow>(
    `
      UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
      SET
        ${assignments.join(",\n        ")}
      WHERE id = $1
      RETURNING
        ${returningColumns.join(",\n        ")}
    `,
    values,
  );

  const updated = result.rows[0];

  if (!updated) {
    throw new Error(`spec_sheets row not found for id: ${normalizedWorkOrder.id}`);
  }

  const mapped = mapSpecSheetRowToWorkOrder(updated);
  await syncDbFactoryOrdersForSpecSheet(mapped);
  await syncDbSpecSheetMaterialsForSpecSheet(mapped);
  await syncDbSpecSheetOutsourcingForSpecSheet(mapped);
  return mapped;
}


async function softDeleteAttachmentMemoBundleForWorkOrder(workOrderId: string): Promise<void> {
  const trashRetentionDays = COMPANY_FILE_TRASH_RETENTION_DAYS;

  await queryDb(
    `WITH updated_attachments AS (
       UPDATE attachments
          SET is_active = false,
              deleted_at = COALESCE(deleted_at, now()),
              deleted_by = COALESCE(deleted_by, 'workorder-delete'),
              delete_reason = COALESCE(delete_reason, '작업지시서 삭제로 함께 휴지통 이동'),
              purge_after_at = COALESCE(purge_after_at, now() + ($2::integer * interval '1 day')),
              updated_at = now()
        WHERE order_id = $1
          AND is_active = true
          AND deleted_at IS NULL
        RETURNING id,
                  company_id,
                  company_name,
                  order_id,
                  storage_key,
                  thumbnail_key,
                  original_name,
                  mime_type,
                  size_bytes,
                  deleted_by,
                  delete_reason,
                  deleted_at,
                  purge_after_at
     )
     INSERT INTO attachment_trash_items (
       company_id,
       company_name,
       attachment_id,
       order_id,
       storage_key,
       thumbnail_key,
       original_name,
       mime_type,
       size_bytes,
       deleted_by,
       delete_reason,
       deleted_at,
       purge_after_at
     )
     SELECT company_id,
            company_name,
            id,
            order_id,
            storage_key,
            thumbnail_key,
            original_name,
            mime_type,
            COALESCE(size_bytes, 0),
            deleted_by,
            delete_reason,
            COALESCE(deleted_at, now()),
            COALESCE(purge_after_at, now() + ($2::integer * interval '1 day'))
       FROM updated_attachments
     ON CONFLICT DO NOTHING`,
    [workOrderId, trashRetentionDays],
  );

  await queryDb(
    `UPDATE memos
        SET is_active = false,
            deleted_at = COALESCE(deleted_at, now()),
            updated_at = now()
      WHERE order_id = $1
        AND is_active = true
        AND deleted_at IS NULL`,
    [workOrderId],
  );
}

export async function deleteDbWorkOrder(workOrderId: string): Promise<string> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  if (schema.isActiveColumn) {
    const assignments = [`${quoteIdentifier(schema.isActiveColumn)} = FALSE`];
    if (schema.deletedAtColumn) {
      assignments.push(`${quoteIdentifier(schema.deletedAtColumn)} = NOW()`);
    }

    const result = await queryDb<{ id: string }>(
      `
        UPDATE ${quoteIdentifier(SPEC_SHEET_TABLE)}
        SET
          ${assignments.join(",\n          ")}
        WHERE id = $1
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

  const result = await queryDb<{ id: string }>(
    `
      DELETE FROM ${quoteIdentifier(SPEC_SHEET_TABLE)}
      WHERE id = $1
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

export async function saveDbWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
  try {
    return await updateDbWorkOrder(workOrder);
  } catch (error) {
    if (!isNotFoundWorkOrderError(error)) {
      throw error;
    }

    return createDbWorkOrder(workOrder);
  }
}

export async function saveDbWorkOrders(workOrders: WorkOrder[]): Promise<WorkOrder[]> {
  const savedWorkOrders: WorkOrder[] = [];

  for (const workOrder of workOrders) {
    savedWorkOrders.push(await saveDbWorkOrder(workOrder));
  }

  return savedWorkOrders;
}
