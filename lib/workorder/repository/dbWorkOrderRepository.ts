import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WorkOrder } from "@/types/workorder";

const WORK_ORDER_TABLE = "work_orders";
const DEFAULT_WORKFLOW_STATE: WorkOrder["workflowState"] = "draft";

const PAYLOAD_COLUMN_CANDIDATES = ["payload", "data", "workorder_payload", "work_order_payload"] as const;
const WORKFLOW_STATE_COLUMN_CANDIDATES = ["workflow_state", "status", "state"] as const;
const LAST_SAVED_AT_COLUMN_CANDIDATES = ["last_saved_at", "saved_at"] as const;
const CREATED_AT_COLUMN_CANDIDATES = ["created_at"] as const;
const UPDATED_AT_COLUMN_CANDIDATES = ["updated_at"] as const;
const IS_ACTIVE_COLUMN_CANDIDATES = ["is_active"] as const;
const DELETED_AT_COLUMN_CANDIDATES = ["deleted_at"] as const;

type DbWorkOrderRow = {
  id: string;
  title: string;
  workflow_state: string | null;
  last_saved_at: string | null;
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

type DbWorkOrderSchema = {
  payloadColumn: string | null;
  payloadColumnKind: DbPayloadColumnKind | null;
  workflowStateColumn: string | null;
  lastSavedAtColumn: string | null;
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

function normalizeWorkOrderForDb(workOrder: WorkOrder): WorkOrder {
  const now = new Date().toISOString();

  return {
    ...workOrder,
    workflowState: workOrder.workflowState ?? DEFAULT_WORKFLOW_STATE,
    lastSavedAt: workOrder.lastSavedAt || now,
  };
}

function serializeWorkOrderPayload(workOrder: WorkOrder): WorkOrder {
  const normalizedWorkOrder = normalizeWorkOrderForDb(workOrder);

  return {
    ...normalizedWorkOrder,
    id: normalizedWorkOrder.id,
    title: normalizedWorkOrder.title,
    workflowState: normalizedWorkOrder.workflowState,
    lastSavedAt: normalizedWorkOrder.lastSavedAt,
  };
}

function parsePayloadValue(payload: DbWorkOrderRow["payload"]): Partial<WorkOrder> {
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

function mapRowToWorkOrder(row: DbWorkOrderRow): WorkOrder {
  const payload = parsePayloadValue(row.payload);

  return {
    ...(payload as WorkOrder),
    id: typeof payload.id === "string" ? payload.id : row.id,
    title: typeof payload.title === "string" ? payload.title : row.title,
    workflowState:
      typeof payload.workflowState === "string"
        ? payload.workflowState
        : ((row.workflow_state ?? DEFAULT_WORKFLOW_STATE) as WorkOrder["workflowState"]),
    lastSavedAt:
      typeof payload.lastSavedAt === "string"
        ? payload.lastSavedAt
        : (row.last_saved_at ?? toIsoString(row.updated_at) ?? toIsoString(row.created_at)),
  } satisfies WorkOrder;
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

function buildAliasSelection(columnName: string | null, alias: keyof DbWorkOrderRow, fallbackSql: string): string {
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

function buildPayloadValue(kind: DbPayloadColumnKind | null, payload: WorkOrder): string {
  const serialized = JSON.stringify(payload);
  return serialized;
}

async function loadWorkOrderSchema(): Promise<DbWorkOrderSchema> {
  const result = await queryDb<DbColumnInfo>(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1
    `,
    [WORK_ORDER_TABLE],
  );

  const columns = result.rows;
  const columnNames = columns.map((row) => row.column_name);

  if (columnNames.length === 0) {
    throw new Error(`relation \"${WORK_ORDER_TABLE}\" does not exist`);
  }

  const payloadColumn = findFirstMatchingColumn(columnNames, PAYLOAD_COLUMN_CANDIDATES);
  const payloadColumnInfo = payloadColumn ? columns.find((column) => column.column_name === payloadColumn) : undefined;
  const payloadColumnKind = getPayloadColumnKind(payloadColumnInfo);

  if (payloadColumn && !payloadColumnKind) {
    throw new Error(`Unsupported payload column type for ${payloadColumn}: ${payloadColumnInfo?.data_type ?? "unknown"}/${payloadColumnInfo?.udt_name ?? "unknown"}`);
  }

  return {
    payloadColumn,
    payloadColumnKind,
    workflowStateColumn: findFirstMatchingColumn(columnNames, WORKFLOW_STATE_COLUMN_CANDIDATES),
    lastSavedAtColumn: findFirstMatchingColumn(columnNames, LAST_SAVED_AT_COLUMN_CANDIDATES),
    createdAtColumn: findFirstMatchingColumn(columnNames, CREATED_AT_COLUMN_CANDIDATES),
    updatedAtColumn: findFirstMatchingColumn(columnNames, UPDATED_AT_COLUMN_CANDIDATES),
    isActiveColumn: findFirstMatchingColumn(columnNames, IS_ACTIVE_COLUMN_CANDIDATES),
    deletedAtColumn: findFirstMatchingColumn(columnNames, DELETED_AT_COLUMN_CANDIDATES),
    hasIdColumn: columnNames.includes("id"),
    hasTitleColumn: columnNames.includes("title"),
  };
}

function assertMinimumSchema(schema: DbWorkOrderSchema) {
  const missingColumns = [
    !schema.hasIdColumn ? "id" : null,
    !schema.hasTitleColumn ? "title" : null,
  ].filter((value): value is string => Boolean(value));

  if (missingColumns.length > 0) {
    throw new Error(`work_orders table is missing required columns: ${missingColumns.join(", ")}`);
  }
}

export async function findAllDbWorkOrders(): Promise<WorkOrder[]> {
  const schema = await loadWorkOrderSchema();
  assertMinimumSchema(schema);

  const payloadFallbackSql = schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

  const result = await queryDb<DbWorkOrderRow>(
    `
      SELECT
        id,
        title,
        ${buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL")},
        ${buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL")},
        ${buildAliasSelection(schema.payloadColumn, "payload", payloadFallbackSql)},
        ${buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE")},
        ${buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL")},
        ${buildAliasSelection(schema.createdAtColumn, "created_at", "NULL")},
        ${buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL")}
      FROM ${quoteIdentifier(WORK_ORDER_TABLE)}
      ${schema.isActiveColumn ? `WHERE ${quoteIdentifier(schema.isActiveColumn)} = TRUE` : ""}
      ORDER BY ${schema.updatedAtColumn ? `${quoteIdentifier(schema.updatedAtColumn)} DESC NULLS LAST, ` : ""}${schema.createdAtColumn ? `${quoteIdentifier(schema.createdAtColumn)} DESC NULLS LAST, ` : ""}id DESC
    `,
  );

  return result.rows.map(mapRowToWorkOrder);
}

export async function createDbWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
  const schema = await loadWorkOrderSchema();
  assertMinimumSchema(schema);

  const normalizedWorkOrder = normalizeWorkOrderForDb(workOrder);
  const payload = serializeWorkOrderPayload(normalizedWorkOrder);

  const columns = ["id", "title"];
  const values: unknown[] = [normalizedWorkOrder.id, normalizedWorkOrder.title];
  const placeholders = ["$1", "$2"];

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
    buildAliasSelection(schema.payloadColumn, "payload", payloadFallbackSql),
    buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE"),
    buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL"),
    buildAliasSelection(schema.createdAtColumn, "created_at", "NULL"),
    buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL"),
  ];

  const result = await queryDb<DbWorkOrderRow>(
    `
      INSERT INTO ${quoteIdentifier(WORK_ORDER_TABLE)} (
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

  return mapRowToWorkOrder(created);
}

export async function updateDbWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
  const schema = await loadWorkOrderSchema();
  assertMinimumSchema(schema);

  const normalizedWorkOrder = normalizeWorkOrderForDb(workOrder);
  const payload = serializeWorkOrderPayload(normalizedWorkOrder);

  const assignments = ["title = $2"];
  const values: unknown[] = [normalizedWorkOrder.id, normalizedWorkOrder.title];

  if (schema.workflowStateColumn) {
    assignments.push(`${quoteIdentifier(schema.workflowStateColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkOrder.workflowState);
  }

  if (schema.lastSavedAtColumn) {
    assignments.push(`${quoteIdentifier(schema.lastSavedAtColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkOrder.lastSavedAt);
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
    buildAliasSelection(schema.payloadColumn, "payload", payloadFallbackSql),
    buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE"),
    buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL"),
    buildAliasSelection(schema.createdAtColumn, "created_at", "NULL"),
    buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL"),
  ];

  const result = await queryDb<DbWorkOrderRow>(
    `
      UPDATE ${quoteIdentifier(WORK_ORDER_TABLE)}
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
    throw new Error(`work_orders row not found for id: ${normalizedWorkOrder.id}`);
  }

  return mapRowToWorkOrder(updated);
}


export async function deleteDbWorkOrder(workOrderId: string): Promise<string> {
  const schema = await loadWorkOrderSchema();
  assertMinimumSchema(schema);

  if (schema.isActiveColumn) {
    const assignments = [`${quoteIdentifier(schema.isActiveColumn)} = FALSE`];
    if (schema.deletedAtColumn) {
      assignments.push(`${quoteIdentifier(schema.deletedAtColumn)} = NOW()`);
    }

    const result = await queryDb<{ id: string }>(
      `
        UPDATE ${quoteIdentifier(WORK_ORDER_TABLE)}
        SET
          ${assignments.join(",\n          ")}
        WHERE id = $1
        RETURNING id
      `,
      [workOrderId],
    );

    const deleted = result.rows[0];
    if (!deleted?.id) {
      throw new Error(`work_orders row not found for id: ${workOrderId}`);
    }
    return deleted.id;
  }

  const result = await queryDb<{ id: string }>(
    `
      DELETE FROM ${quoteIdentifier(WORK_ORDER_TABLE)}
      WHERE id = $1
      RETURNING id
    `,
    [workOrderId],
  );

  const deleted = result.rows[0];

  if (!deleted?.id) {
    throw new Error(`work_orders row not found for id: ${workOrderId}`);
  }

  return deleted.id;
}
