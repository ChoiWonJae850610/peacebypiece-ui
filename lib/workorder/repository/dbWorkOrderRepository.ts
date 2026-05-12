import "server-only";

import { queryDb } from "@/lib/db/client";
import {
  getAdminCompanyId,
  getAdminCompanyScope,
} from "@/lib/admin/settings/companyScope";
import {
  LEGACY_WORKFLOW_STATE_MAP,
  WORKFLOW_STATES,
} from "@/lib/constants/workorderStates";
import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";
import { ADMIN_FILE_TRASH_ACTOR_IDS } from "@/lib/admin/files/trashPolicy";
import { ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import type { Material } from "@/types/material";
import type { OrderEntry, Outsourcing, WorkOrder, WorkOrderStatePatch, WorkOrderSummary } from "@/types/workorder";
import { applyReorderIdentity } from "@/lib/workorder/reorder/helpers";
import { syncDbFactoryOrdersForSpecSheet } from "@/lib/workorder/repository/dbFactoryOrderRepository";
import { syncDbSpecSheetMaterialsForSpecSheet } from "@/lib/workorder/repository/dbSpecSheetMaterialRepository";
import { syncDbSpecSheetOutsourcingForSpecSheet } from "@/lib/workorder/repository/dbSpecSheetOutsourcingRepository";

const SPEC_SHEET_TABLE = "spec_sheets";
const DEFAULT_WORKFLOW_STATE: WorkOrder["workflowState"] = "draft";

const COMPANY_ID_COLUMN_CANDIDATES = ["company_id"] as const;
const COMPANY_NAME_COLUMN_CANDIDATES = ["company_name"] as const;
const PAYLOAD_COLUMN_CANDIDATES = [
  "payload",
  "data",
  "workorder_payload",
  "work_order_payload",
] as const;
const WORKFLOW_STATE_COLUMN_CANDIDATES = [
  "workflow_state",
  "status",
  "state",
] as const;
const LAST_SAVED_AT_COLUMN_CANDIDATES = ["last_saved_at", "saved_at"] as const;
const WORK_ORDER_KIND_COLUMN_CANDIDATES = ["work_order_kind"] as const;
const REORDER_GROUP_ID_COLUMN_CANDIDATES = ["reorder_group_id"] as const;
const REORDER_ROUND_COLUMN_CANDIDATES = ["reorder_round"] as const;
const PARENT_SPEC_SHEET_ID_COLUMN_CANDIDATES = [
  "parent_spec_sheet_id",
] as const;
const IS_REWORK_COLUMN_CANDIDATES = ["is_rework", "is_defect_order"] as const;
const CREATED_AT_COLUMN_CANDIDATES = ["created_at"] as const;
const UPDATED_AT_COLUMN_CANDIDATES = ["updated_at"] as const;
const IS_ACTIVE_COLUMN_CANDIDATES = ["is_active"] as const;
const DELETED_AT_COLUMN_CANDIDATES = ["deleted_at"] as const;
const DELETE_STATUS_COLUMN_CANDIDATES = ["delete_status"] as const;
const PURGE_STATUS_COLUMN_CANDIDATES = ["purge_status"] as const;
const PURGE_REQUESTED_AT_COLUMN_CANDIDATES = ["purge_requested_at"] as const;
const PURGED_AT_COLUMN_CANDIDATES = ["purged_at"] as const;
const PURGED_BY_COLUMN_CANDIDATES = ["purged_by"] as const;
const PURGE_REQUESTED_BY_COLUMN_CANDIDATES = ["purge_requested_by"] as const;
const DELETE_SOURCE_COLUMN_CANDIDATES = ["delete_source"] as const;
const DELETE_SCOPE_COLUMN_CANDIDATES = ["delete_scope"] as const;
const DELETE_PARENT_TYPE_COLUMN_CANDIDATES = ["delete_parent_type"] as const;
const DELETE_PARENT_ID_COLUMN_CANDIDATES = ["delete_parent_id"] as const;
const DELETE_BATCH_ID_COLUMN_CANDIDATES = ["delete_batch_id"] as const;
const CATEGORY1_ID_COLUMN_CANDIDATES = ["category1_id"] as const;
const CATEGORY2_ID_COLUMN_CANDIDATES = ["category2_id"] as const;
const CATEGORY3_ID_COLUMN_CANDIDATES = ["category3_id"] as const;
const DISPLAY_TITLE_COLUMN_CANDIDATES = ["display_title"] as const;
const BASE_TITLE_COLUMN_CANDIDATES = ["base_title"] as const;
const CATEGORY1_COLUMN_CANDIDATES = ["category1"] as const;
const CATEGORY2_COLUMN_CANDIDATES = ["category2"] as const;
const CATEGORY3_COLUMN_CANDIDATES = ["category3"] as const;
const SEASON_COLUMN_CANDIDATES = ["season"] as const;
const PRIORITY_COLUMN_CANDIDATES = ["priority"] as const;
const VENDOR_COLUMN_CANDIDATES = ["vendor"] as const;
const MANAGER_COLUMN_CANDIDATES = ["manager"] as const;
const MANAGER_ID_COLUMN_CANDIDATES = ["manager_id"] as const;
const CREATED_BY_ID_COLUMN_CANDIDATES = ["created_by_id"] as const;
const CREATED_BY_ROLE_COLUMN_CANDIDATES = ["created_by_role"] as const;
const DUE_DATE_COLUMN_CANDIDATES = ["due_date"] as const;
const QUANTITY_COLUMN_CANDIDATES = ["quantity"] as const;
const INVENTORY_QUANTITY_COLUMN_CANDIDATES = ["inventory_quantity"] as const;
const INVENTORY_STATUS_COLUMN_CANDIDATES = ["inventory_status"] as const;
const MEMO_COLUMN_CANDIDATES = ["memo"] as const;

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
  category1_id?: string | null;
  category2_id?: string | null;
  category3_id?: string | null;
  display_title?: string | null;
  base_title?: string | null;
  category1?: string | null;
  category2?: string | null;
  category3?: string | null;
  season?: string | null;
  priority?: string | null;
  vendor?: string | null;
  manager?: string | null;
  manager_id?: string | null;
  created_by_id?: string | null;
  created_by_role?: WorkOrder["createdByRole"] | null;
  due_date?: string | null;
  quantity?: number | null;
  inventory_quantity?: number | null;
  inventory_status?: WorkOrder["inventoryStatus"] | null;
  memo?: string | null;
  payload: WorkOrder | string | null;
  order_entry_count?: number | null;
  material_count?: number | null;
  outsourcing_count?: number | null;
  attachment_count?: number | null;
  memo_thread_count?: number | null;
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
  deleteStatusColumn: string | null;
  purgeStatusColumn: string | null;
  purgeRequestedAtColumn: string | null;
  purgedAtColumn: string | null;
  purgedByColumn: string | null;
  purgeRequestedByColumn: string | null;
  deleteSourceColumn: string | null;
  deleteScopeColumn: string | null;
  deleteParentTypeColumn: string | null;
  deleteParentIdColumn: string | null;
  deleteBatchIdColumn: string | null;
  category1IdColumn: string | null;
  category2IdColumn: string | null;
  category3IdColumn: string | null;
  displayTitleColumn: string | null;
  baseTitleColumn: string | null;
  category1Column: string | null;
  category2Column: string | null;
  category3Column: string | null;
  seasonColumn: string | null;
  priorityColumn: string | null;
  vendorColumn: string | null;
  managerColumn: string | null;
  managerIdColumn: string | null;
  createdByIdColumn: string | null;
  createdByRoleColumn: string | null;
  dueDateColumn: string | null;
  quantityColumn: string | null;
  inventoryQuantityColumn: string | null;
  inventoryStatusColumn: string | null;
  memoColumn: string | null;
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

function normalizeDbWorkflowState(
  value: string | null | undefined,
): WorkOrder["workflowState"] {
  if (!value) return DEFAULT_WORKFLOW_STATE;
  if ((WORKFLOW_STATES as readonly string[]).includes(value)) {
    return value as WorkOrder["workflowState"];
  }
  if (value in LEGACY_WORKFLOW_STATE_MAP) {
    return LEGACY_WORKFLOW_STATE_MAP[
      value as keyof typeof LEGACY_WORKFLOW_STATE_MAP
    ] as WorkOrder["workflowState"];
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

async function resolveCategoryIdsForDb(
  workOrder: WorkOrder,
): Promise<Pick<WorkOrder, "category1Id" | "category2Id" | "category3Id">> {
  if (workOrder.category1Id || workOrder.category2Id || workOrder.category3Id) {
    return {
      category1Id: workOrder.category1Id ?? null,
      category2Id: workOrder.category2Id ?? null,
      category3Id: workOrder.category3Id ?? null,
    };
  }

  const companyId = getAdminCompanyId();
  const result = await queryDb<{
    id: string;
    parent_id: string | null;
    level: number;
    name: string;
  }>(
    `SELECT id, parent_id, level, name
       FROM item_categories
      WHERE (company_id = $1 OR company_id IS NULL)
        AND is_active = true
      ORDER BY level ASC, sort_order ASC, name ASC`,
    [companyId],
  );

  const category1 =
    result.rows.find(
      (item) => item.level === 1 && item.name === workOrder.category1,
    ) ?? null;
  const category2 =
    result.rows.find(
      (item) =>
        item.level === 2 &&
        item.name === workOrder.category2 &&
        (!category1 || item.parent_id === category1.id),
    ) ?? null;
  const category3 =
    result.rows.find(
      (item) =>
        item.level === 3 &&
        item.name === workOrder.category3 &&
        (!category2 || item.parent_id === category2.id),
    ) ?? null;

  return {
    category1Id: category1?.id ?? null,
    category2Id: category2?.id ?? null,
    category3Id: category3?.id ?? null,
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

function parsePayloadValue(
  payload: DbSpecSheetRow["payload"],
): Partial<WorkOrder> {
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

function readRoleValue(value: unknown, fallback: WorkOrder["createdByRole"] = "admin"): WorkOrder["createdByRole"] {
  if (value === "admin" || value === "designer" || value === "inspector") return value;
  return fallback;
}

function readInventoryStatusValue(value: unknown, fallback: WorkOrder["inventoryStatus"] = "unchecked"): WorkOrder["inventoryStatus"] {
  if (value === "unchecked" || value === "normal" || value === "shortage") return value;
  return fallback;
}

function readStringRowValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function readNumberRowValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapSpecSheetRowToWorkOrder(row: DbSpecSheetRow): WorkOrder {
  const payload = parsePayloadValue(row.payload);
  const normalizedWorkflowState =
    row.workflow_state !== null && row.workflow_state !== undefined
      ? normalizeDbWorkflowState(row.workflow_state)
      : typeof payload.workflowState === "string"
        ? normalizeDbWorkflowState(payload.workflowState)
        : DEFAULT_WORKFLOW_STATE;
  const lastSavedAt =
    row.last_saved_at ??
    toIsoString(row.updated_at) ??
    toIsoString(row.created_at) ??
    readStringPayloadValue(payload.lastSavedAt);

  const hydrated: WorkOrder = {
    id: row.id,
    title: row.title,
    displayTitle: readStringRowValue(row.display_title, readStringPayloadValue(payload.displayTitle, row.title)),
    baseTitle: readStringRowValue(row.base_title, readStringPayloadValue(payload.baseTitle, row.title)),
    workOrderKind: row.work_order_kind ?? payload.workOrderKind ?? undefined,
    reorderGroupId:
      row.reorder_group_id ??
      (typeof payload.reorderGroupId === "string" ? payload.reorderGroupId : undefined),
    reorderRound:
      typeof row.reorder_round === "number"
        ? row.reorder_round
        : typeof payload.reorderRound === "number"
          ? payload.reorderRound
          : undefined,
    parentSpecSheetId:
      row.parent_spec_sheet_id ??
      (typeof payload.parentSpecSheetId === "string" ? payload.parentSpecSheetId : undefined),
    isDefectOrder:
      typeof row.is_rework === "boolean"
        ? row.is_rework
        : typeof payload.isDefectOrder === "boolean"
          ? payload.isDefectOrder
          : undefined,
    category1: readStringRowValue(row.category1, readStringPayloadValue(payload.category1)),
    category2: readStringRowValue(row.category2, readStringPayloadValue(payload.category2)),
    category3: readStringRowValue(row.category3, readStringPayloadValue(payload.category3)),
    category1Id:
      row.category1_id ??
      (typeof payload.category1Id === "string" ? payload.category1Id : null),
    category2Id:
      row.category2_id ??
      (typeof payload.category2Id === "string" ? payload.category2Id : null),
    category3Id:
      row.category3_id ??
      (typeof payload.category3Id === "string" ? payload.category3Id : null),
    season: readStringRowValue(row.season, readStringPayloadValue(payload.season)),
    priority: readStringRowValue(row.priority, readStringPayloadValue(payload.priority)),
    vendor: readStringRowValue(row.vendor, readStringPayloadValue(payload.vendor)),
    manager: readStringRowValue(row.manager, readStringPayloadValue(payload.manager)),
    managerId:
      row.manager_id ??
      (typeof payload.managerId === "string" ? payload.managerId : null),
    createdById: readStringRowValue(row.created_by_id, readStringPayloadValue(payload.createdById, "system")),
    createdByRole: readRoleValue(row.created_by_role, readRoleValue(payload.createdByRole)),
    dueDate: readStringRowValue(row.due_date, readStringPayloadValue(payload.dueDate)),
    quantity: readNumberRowValue(row.quantity, readNumberPayloadValue(payload.quantity)),
    inventoryQuantity: readNumberRowValue(row.inventory_quantity, readNumberPayloadValue(payload.inventoryQuantity)),
    inventoryStatus: readInventoryStatusValue(row.inventory_status, readInventoryStatusValue(payload.inventoryStatus)),
    memo: readStringRowValue(row.memo, readStringPayloadValue(payload.memo)),
    materials: Array.isArray(payload.materials) ? payload.materials : [],
    outsourcing: Array.isArray(payload.outsourcing) ? payload.outsourcing : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    memoThreads: Array.isArray(payload.memoThreads) ? payload.memoThreads : [],
    orderEntries: Array.isArray(payload.orderEntries) ? payload.orderEntries : [],
    workflowState: normalizedWorkflowState,
    lastSavedAt,
    factoryOrderRequest: payload.factoryOrderRequest ?? null,
  };

  return applyReorderIdentity(hydrated);
}

function countPayloadItems(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function readCountValue(value: number | null | undefined, fallbackValue: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : countPayloadItems(fallbackValue);
}

function readStringPayloadValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNumberPayloadValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapSpecSheetRowToWorkOrderSummary(row: DbSpecSheetRow): WorkOrderSummary {
  const payload = parsePayloadValue(row.payload);
  const normalizedWorkflowState =
    row.workflow_state !== null && row.workflow_state !== undefined
      ? normalizeDbWorkflowState(row.workflow_state)
      : typeof payload.workflowState === "string"
        ? normalizeDbWorkflowState(payload.workflowState)
        : DEFAULT_WORKFLOW_STATE;
  const lastSavedAt =
    row.last_saved_at ??
    toIsoString(row.updated_at) ??
    toIsoString(row.created_at) ??
    readStringPayloadValue(payload.lastSavedAt);

  return {
    id: row.id,
    title: row.title,
    displayTitle: readStringRowValue(row.display_title, readStringPayloadValue(payload.displayTitle, row.title)),
    baseTitle: readStringRowValue(row.base_title, readStringPayloadValue(payload.baseTitle, row.title)),
    workOrderKind: row.work_order_kind ?? payload.workOrderKind,
    reorderGroupId:
      row.reorder_group_id ??
      (typeof payload.reorderGroupId === "string" ? payload.reorderGroupId : undefined),
    reorderRound:
      typeof row.reorder_round === "number"
        ? row.reorder_round
        : typeof payload.reorderRound === "number"
          ? payload.reorderRound
          : undefined,
    parentSpecSheetId:
      row.parent_spec_sheet_id ??
      (typeof payload.parentSpecSheetId === "string" ? payload.parentSpecSheetId : undefined),
    isDefectOrder:
      typeof row.is_rework === "boolean"
        ? row.is_rework
        : typeof payload.isDefectOrder === "boolean"
          ? payload.isDefectOrder
          : undefined,
    category1: readStringRowValue(row.category1, readStringPayloadValue(payload.category1)),
    category2: readStringRowValue(row.category2, readStringPayloadValue(payload.category2)),
    category3: readStringRowValue(row.category3, readStringPayloadValue(payload.category3)),
    category1Id:
      row.category1_id ??
      (typeof payload.category1Id === "string" ? payload.category1Id : null),
    category2Id:
      row.category2_id ??
      (typeof payload.category2Id === "string" ? payload.category2Id : null),
    category3Id:
      row.category3_id ??
      (typeof payload.category3Id === "string" ? payload.category3Id : null),
    season: readStringRowValue(row.season, readStringPayloadValue(payload.season)),
    priority: readStringRowValue(row.priority, readStringPayloadValue(payload.priority)),
    vendor: readStringRowValue(row.vendor, readStringPayloadValue(payload.vendor)),
    manager: readStringRowValue(row.manager, readStringPayloadValue(payload.manager)),
    managerId:
      row.manager_id ??
      (typeof payload.managerId === "string" ? payload.managerId : null),
    createdById: readStringRowValue(row.created_by_id, readStringPayloadValue(payload.createdById, "system")),
    createdByRole: readRoleValue(row.created_by_role, readRoleValue(payload.createdByRole)),
    dueDate: readStringRowValue(row.due_date, readStringPayloadValue(payload.dueDate)),
    quantity: readNumberRowValue(row.quantity, readNumberPayloadValue(payload.quantity)),
    inventoryQuantity: readNumberRowValue(row.inventory_quantity, readNumberPayloadValue(payload.inventoryQuantity)),
    inventoryStatus: readInventoryStatusValue(row.inventory_status, readInventoryStatusValue(payload.inventoryStatus)),
    workflowState: normalizedWorkflowState,
    lastSavedAt,
    orderEntryCount: readCountValue(row.order_entry_count, payload.orderEntries),
    materialCount: readCountValue(row.material_count, payload.materials),
    outsourcingCount: readCountValue(row.outsourcing_count, payload.outsourcing),
    attachmentCount: readCountValue(row.attachment_count, payload.attachments),
    memoThreadCount: readCountValue(row.memo_thread_count, payload.memoThreads),
    hasDetailSnapshot: false,
    createdAt: toIsoString(row.created_at) || undefined,
    updatedAt: toIsoString(row.updated_at) || undefined,
  };
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

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

function buildAliasSelection(
  columnName: string | null,
  alias: keyof DbSpecSheetRow,
  fallbackSql: string,
): string {
  if (!columnName) {
    return `${fallbackSql} AS ${alias}`;
  }

  return `${quoteIdentifier(columnName)} AS ${alias}`;
}

function getPayloadColumnKind(
  column: DbColumnInfo | undefined,
): DbPayloadColumnKind | null {
  if (!column) return null;

  if (column.udt_name === "jsonb") return "jsonb";
  if (column.udt_name === "json") return "json";
  if (
    column.data_type === "text" ||
    column.udt_name === "text" ||
    column.data_type === "character varying" ||
    column.udt_name === "varchar"
  ) {
    return "text";
  }

  return null;
}


function buildPayloadPatchExpression(
  columnName: string,
  kind: DbPayloadColumnKind | null,
  patchEntries: Array<{ key: keyof WorkOrder; value: unknown }>,
  values: unknown[],
): string | null {
  if (!kind || patchEntries.length === 0) return null;

  const columnSql = quoteIdentifier(columnName);
  let expression = kind === "text"
    ? `COALESCE(NULLIF(${columnSql}, '')::jsonb, '{}'::jsonb)`
    : `COALESCE(${columnSql}::jsonb, '{}'::jsonb)`;

  for (const entry of patchEntries) {
    values.push(JSON.stringify(entry.value ?? null));
    expression = `jsonb_set(${expression}, '{${String(entry.key)}}', $${values.length}::jsonb, true)`;
  }

  if (kind === "json") return `(${expression})::json`;
  if (kind === "text") return `(${expression})::text`;
  return expression;
}

function buildPayloadInsertPlaceholder(
  kind: DbPayloadColumnKind | null,
  placeholderIndex: number,
): string {
  if (kind === "jsonb") return `$${placeholderIndex}::jsonb`;
  if (kind === "json") return `$${placeholderIndex}::json`;
  return `$${placeholderIndex}`;
}

function buildPayloadValue(
  kind: DbPayloadColumnKind | null,
  payload: Partial<WorkOrder>,
): string {
  const serialized = JSON.stringify(payload);
  return serialized;
}

function pushInsertColumn(
  columns: string[],
  values: unknown[],
  placeholders: string[],
  columnName: string | null,
  value: unknown,
) {
  if (!columnName) return;
  columns.push(columnName);
  values.push(value);
  placeholders.push(`$${values.length}`);
}

function pushUpdateAssignment(
  assignments: string[],
  values: unknown[],
  columnName: string | null,
  value: unknown,
) {
  if (!columnName) return;
  assignments.push(`${quoteIdentifier(columnName)} = $${values.length + 1}`);
  values.push(value);
}

function appendNormalizedWorkOrderInsertColumns(
  schema: DbSpecSheetSchema,
  workOrder: WorkOrder,
  columns: string[],
  values: unknown[],
  placeholders: string[],
) {
  pushInsertColumn(columns, values, placeholders, schema.displayTitleColumn, workOrder.displayTitle ?? workOrder.title);
  pushInsertColumn(columns, values, placeholders, schema.baseTitleColumn, workOrder.baseTitle ?? workOrder.title);
  pushInsertColumn(columns, values, placeholders, schema.category1Column, workOrder.category1 || null);
  pushInsertColumn(columns, values, placeholders, schema.category2Column, workOrder.category2 || null);
  pushInsertColumn(columns, values, placeholders, schema.category3Column, workOrder.category3 || null);
  pushInsertColumn(columns, values, placeholders, schema.seasonColumn, workOrder.season || null);
  pushInsertColumn(columns, values, placeholders, schema.priorityColumn, workOrder.priority || null);
  pushInsertColumn(columns, values, placeholders, schema.vendorColumn, workOrder.vendor || null);
  pushInsertColumn(columns, values, placeholders, schema.managerColumn, workOrder.manager || null);
  pushInsertColumn(columns, values, placeholders, schema.managerIdColumn, workOrder.managerId ?? null);
  pushInsertColumn(columns, values, placeholders, schema.createdByIdColumn, workOrder.createdById || "system");
  pushInsertColumn(columns, values, placeholders, schema.createdByRoleColumn, workOrder.createdByRole || "admin");
  pushInsertColumn(columns, values, placeholders, schema.dueDateColumn, workOrder.dueDate || null);
  pushInsertColumn(columns, values, placeholders, schema.quantityColumn, workOrder.quantity ?? 0);
  pushInsertColumn(columns, values, placeholders, schema.inventoryQuantityColumn, workOrder.inventoryQuantity ?? 0);
  pushInsertColumn(columns, values, placeholders, schema.inventoryStatusColumn, workOrder.inventoryStatus || "unchecked");
  pushInsertColumn(columns, values, placeholders, schema.memoColumn, workOrder.memo || null);
}

function appendNormalizedWorkOrderUpdateAssignments(
  schema: DbSpecSheetSchema,
  workOrder: WorkOrder,
  assignments: string[],
  values: unknown[],
) {
  pushUpdateAssignment(assignments, values, schema.displayTitleColumn, workOrder.displayTitle ?? workOrder.title);
  pushUpdateAssignment(assignments, values, schema.baseTitleColumn, workOrder.baseTitle ?? workOrder.title);
  pushUpdateAssignment(assignments, values, schema.category1Column, workOrder.category1 || null);
  pushUpdateAssignment(assignments, values, schema.category2Column, workOrder.category2 || null);
  pushUpdateAssignment(assignments, values, schema.category3Column, workOrder.category3 || null);
  pushUpdateAssignment(assignments, values, schema.seasonColumn, workOrder.season || null);
  pushUpdateAssignment(assignments, values, schema.priorityColumn, workOrder.priority || null);
  pushUpdateAssignment(assignments, values, schema.vendorColumn, workOrder.vendor || null);
  pushUpdateAssignment(assignments, values, schema.managerColumn, workOrder.manager || null);
  pushUpdateAssignment(assignments, values, schema.managerIdColumn, workOrder.managerId ?? null);
  pushUpdateAssignment(assignments, values, schema.createdByIdColumn, workOrder.createdById || "system");
  pushUpdateAssignment(assignments, values, schema.createdByRoleColumn, workOrder.createdByRole || "admin");
  pushUpdateAssignment(assignments, values, schema.dueDateColumn, workOrder.dueDate || null);
  pushUpdateAssignment(assignments, values, schema.quantityColumn, workOrder.quantity ?? 0);
  pushUpdateAssignment(assignments, values, schema.inventoryQuantityColumn, workOrder.inventoryQuantity ?? 0);
  pushUpdateAssignment(assignments, values, schema.inventoryStatusColumn, workOrder.inventoryStatus || "unchecked");
  pushUpdateAssignment(assignments, values, schema.memoColumn, workOrder.memo || null);
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

  const payloadColumn = findFirstMatchingColumn(
    columnNames,
    PAYLOAD_COLUMN_CANDIDATES,
  );
  const payloadColumnInfo = payloadColumn
    ? columns.find((column) => column.column_name === payloadColumn)
    : undefined;
  const payloadColumnKind = getPayloadColumnKind(payloadColumnInfo);

  if (payloadColumn && !payloadColumnKind) {
    throw new Error(
      `Unsupported payload column type for ${payloadColumn}: ${payloadColumnInfo?.data_type ?? "unknown"}/${payloadColumnInfo?.udt_name ?? "unknown"}`,
    );
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
    payloadColumn,
    payloadColumnKind,
    workflowStateColumn: findFirstMatchingColumn(
      columnNames,
      WORKFLOW_STATE_COLUMN_CANDIDATES,
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
    displayTitleColumn: findFirstMatchingColumn(columnNames, DISPLAY_TITLE_COLUMN_CANDIDATES),
    baseTitleColumn: findFirstMatchingColumn(columnNames, BASE_TITLE_COLUMN_CANDIDATES),
    category1Column: findFirstMatchingColumn(columnNames, CATEGORY1_COLUMN_CANDIDATES),
    category2Column: findFirstMatchingColumn(columnNames, CATEGORY2_COLUMN_CANDIDATES),
    category3Column: findFirstMatchingColumn(columnNames, CATEGORY3_COLUMN_CANDIDATES),
    seasonColumn: findFirstMatchingColumn(columnNames, SEASON_COLUMN_CANDIDATES),
    priorityColumn: findFirstMatchingColumn(columnNames, PRIORITY_COLUMN_CANDIDATES),
    vendorColumn: findFirstMatchingColumn(columnNames, VENDOR_COLUMN_CANDIDATES),
    managerColumn: findFirstMatchingColumn(columnNames, MANAGER_COLUMN_CANDIDATES),
    managerIdColumn: findFirstMatchingColumn(columnNames, MANAGER_ID_COLUMN_CANDIDATES),
    createdByIdColumn: findFirstMatchingColumn(columnNames, CREATED_BY_ID_COLUMN_CANDIDATES),
    createdByRoleColumn: findFirstMatchingColumn(columnNames, CREATED_BY_ROLE_COLUMN_CANDIDATES),
    dueDateColumn: findFirstMatchingColumn(columnNames, DUE_DATE_COLUMN_CANDIDATES),
    quantityColumn: findFirstMatchingColumn(columnNames, QUANTITY_COLUMN_CANDIDATES),
    inventoryQuantityColumn: findFirstMatchingColumn(columnNames, INVENTORY_QUANTITY_COLUMN_CANDIDATES),
    inventoryStatusColumn: findFirstMatchingColumn(columnNames, INVENTORY_STATUS_COLUMN_CANDIDATES),
    memoColumn: findFirstMatchingColumn(columnNames, MEMO_COLUMN_CANDIDATES),
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
    throw new Error(
      `spec_sheets table is missing required columns: ${missingColumns.join(", ")}`,
    );
  }
}

function buildSpecSheetSelectBaseSql(schema: DbSpecSheetSchema): string {
  const payloadFallbackSql =
    schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

  return `
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
        ${buildAliasSelection(schema.category1IdColumn, "category1_id", "NULL")},
        ${buildAliasSelection(schema.category2IdColumn, "category2_id", "NULL")},
        ${buildAliasSelection(schema.category3IdColumn, "category3_id", "NULL")},
        ${buildAliasSelection(schema.displayTitleColumn, "display_title", "NULL")},
        ${buildAliasSelection(schema.baseTitleColumn, "base_title", "NULL")},
        ${buildAliasSelection(schema.category1Column, "category1", "NULL")},
        ${buildAliasSelection(schema.category2Column, "category2", "NULL")},
        ${buildAliasSelection(schema.category3Column, "category3", "NULL")},
        ${buildAliasSelection(schema.seasonColumn, "season", "NULL")},
        ${buildAliasSelection(schema.priorityColumn, "priority", "NULL")},
        ${buildAliasSelection(schema.vendorColumn, "vendor", "NULL")},
        ${buildAliasSelection(schema.managerColumn, "manager", "NULL")},
        ${buildAliasSelection(schema.managerIdColumn, "manager_id", "NULL")},
        ${buildAliasSelection(schema.createdByIdColumn, "created_by_id", "NULL")},
        ${buildAliasSelection(schema.createdByRoleColumn, "created_by_role", "NULL")},
        ${buildAliasSelection(schema.dueDateColumn, "due_date", "NULL")},
        ${buildAliasSelection(schema.quantityColumn, "quantity", "NULL")},
        ${buildAliasSelection(schema.inventoryQuantityColumn, "inventory_quantity", "NULL")},
        ${buildAliasSelection(schema.inventoryStatusColumn, "inventory_status", "NULL")},
        ${buildAliasSelection(schema.memoColumn, "memo", "NULL")},
        ${buildAliasSelection(schema.payloadColumn, "payload", payloadFallbackSql)},
        ${buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE")},
        ${buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL")},
        ${buildAliasSelection(schema.createdAtColumn, "created_at", "NULL")},
        ${buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL")}
      FROM ${quoteIdentifier(SPEC_SHEET_TABLE)}
    `;
}

function buildSpecSheetSummaryPayloadSelection(schema: DbSpecSheetSchema): string {
  const payloadFallbackSql =
    schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

  if (!schema.payloadColumn) {
    return `${payloadFallbackSql} AS payload`;
  }

  if (schema.payloadColumnKind === "text") {
    return `${quoteIdentifier(schema.payloadColumn)} AS payload`;
  }

  const payloadSql = `COALESCE(${quoteIdentifier(schema.payloadColumn)}::jsonb, '{}'::jsonb)`;
  const summaryKeys = [
    "displayTitle",
    "baseTitle",
    "workOrderKind",
    "reorderGroupId",
    "reorderRound",
    "parentSpecSheetId",
    "isDefectOrder",
    "category1",
    "category2",
    "category3",
    "category1Id",
    "category2Id",
    "category3Id",
    "season",
    "priority",
    "vendor",
    "manager",
    "managerId",
    "createdById",
    "createdByRole",
    "dueDate",
    "quantity",
    "inventoryQuantity",
    "inventoryStatus",
    "workflowState",
    "lastSavedAt",
  ];
  const keyExpressions = summaryKeys
    .map((key) => `'${key}', ${payloadSql}->'${key}'`)
    .join(",\n          ");

  return `jsonb_strip_nulls(jsonb_build_object(
          ${keyExpressions}
        )) AS payload`;
}

function buildSpecSheetSummarySelectBaseSql(schema: DbSpecSheetSchema): string {
  return `
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
        ${buildAliasSelection(schema.category1IdColumn, "category1_id", "NULL")},
        ${buildAliasSelection(schema.category2IdColumn, "category2_id", "NULL")},
        ${buildAliasSelection(schema.category3IdColumn, "category3_id", "NULL")},
        ${buildAliasSelection(schema.displayTitleColumn, "display_title", "NULL")},
        ${buildAliasSelection(schema.baseTitleColumn, "base_title", "NULL")},
        ${buildAliasSelection(schema.category1Column, "category1", "NULL")},
        ${buildAliasSelection(schema.category2Column, "category2", "NULL")},
        ${buildAliasSelection(schema.category3Column, "category3", "NULL")},
        ${buildAliasSelection(schema.seasonColumn, "season", "NULL")},
        ${buildAliasSelection(schema.priorityColumn, "priority", "NULL")},
        ${buildAliasSelection(schema.vendorColumn, "vendor", "NULL")},
        ${buildAliasSelection(schema.managerColumn, "manager", "NULL")},
        ${buildAliasSelection(schema.managerIdColumn, "manager_id", "NULL")},
        ${buildAliasSelection(schema.createdByIdColumn, "created_by_id", "NULL")},
        ${buildAliasSelection(schema.createdByRoleColumn, "created_by_role", "NULL")},
        ${buildAliasSelection(schema.dueDateColumn, "due_date", "NULL")},
        ${buildAliasSelection(schema.quantityColumn, "quantity", "NULL")},
        ${buildAliasSelection(schema.inventoryQuantityColumn, "inventory_quantity", "NULL")},
        ${buildAliasSelection(schema.inventoryStatusColumn, "inventory_status", "NULL")},
        ${buildAliasSelection(schema.memoColumn, "memo", "NULL")},
        ${buildSpecSheetSummaryPayloadSelection(schema)},
        ${buildAliasSelection(schema.isActiveColumn, "is_active", "TRUE")},
        ${buildAliasSelection(schema.deletedAtColumn, "deleted_at", "NULL")},
        ${buildAliasSelection(schema.createdAtColumn, "created_at", "NULL")},
        ${buildAliasSelection(schema.updatedAtColumn, "updated_at", "NULL")}
      FROM ${quoteIdentifier(SPEC_SHEET_TABLE)}
    `;
}

function buildSpecSheetSelectSql(schema: DbSpecSheetSchema): string {
  return `
      ${buildSpecSheetSelectBaseSql(schema)}
      ${schema.companyIdColumn ? `WHERE ${quoteIdentifier(schema.companyIdColumn)} = $1` : schema.isActiveColumn ? `WHERE ${quoteIdentifier(schema.isActiveColumn)} = TRUE` : ""}
      ${schema.companyIdColumn && schema.isActiveColumn ? `AND ${quoteIdentifier(schema.isActiveColumn)} = TRUE` : ""}
      ORDER BY ${schema.updatedAtColumn ? `${quoteIdentifier(schema.updatedAtColumn)} DESC NULLS LAST, ` : ""}${schema.createdAtColumn ? `${quoteIdentifier(schema.createdAtColumn)} DESC NULLS LAST, ` : ""}id DESC
    `;
}

function buildSpecSheetSummarySelectSql(schema: DbSpecSheetSchema): string {
  return `
      WITH spec_sheet_summaries AS (
        ${buildSpecSheetSummarySelectBaseSql(schema)}
        ${schema.companyIdColumn ? `WHERE ${quoteIdentifier(schema.companyIdColumn)} = $1` : schema.isActiveColumn ? `WHERE ${quoteIdentifier(schema.isActiveColumn)} = TRUE` : ""}
        ${schema.companyIdColumn && schema.isActiveColumn ? `AND ${quoteIdentifier(schema.isActiveColumn)} = TRUE` : ""}
      )
      SELECT
        s.*,
        COALESCE(order_counts.order_entry_count, 0)::integer AS order_entry_count,
        COALESCE(material_counts.material_count, 0)::integer AS material_count,
        COALESCE(outsourcing_counts.outsourcing_count, 0)::integer AS outsourcing_count,
        COALESCE(attachment_counts.attachment_count, 0)::integer AS attachment_count,
        COALESCE(memo_counts.memo_thread_count, 0)::integer AS memo_thread_count
      FROM spec_sheet_summaries s
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS order_entry_count
        FROM orders o
        WHERE o.spec_sheet_id = s.id
          AND COALESCE(o.is_active, true) = true
          AND o.deleted_at IS NULL
      ) order_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS material_count
        FROM spec_sheet_materials m
        WHERE m.spec_sheet_id = s.id
          AND COALESCE(m.is_active, true) = true
          AND m.deleted_at IS NULL
      ) material_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS outsourcing_count
        FROM spec_sheet_outsourcing_lines ol
        WHERE ol.spec_sheet_id = s.id
          AND COALESCE(ol.is_active, true) = true
          AND ol.deleted_at IS NULL
      ) outsourcing_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS attachment_count
        FROM attachments a
        WHERE a.order_id = s.id
          AND COALESCE(a.is_active, true) = true
          AND a.deleted_at IS NULL
      ) attachment_counts ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer AS memo_thread_count
        FROM memos memo
        WHERE memo.order_id = s.id
          AND memo.parent_id IS NULL
          AND COALESCE(memo.is_active, true) = true
          AND memo.deleted_at IS NULL
      ) memo_counts ON true
      ORDER BY ${schema.updatedAtColumn ? `s.updated_at DESC NULLS LAST, ` : ""}${schema.createdAtColumn ? `s.created_at DESC NULLS LAST, ` : ""}s.id DESC
    `;
}

function buildSpecSheetSelectByIdSql(schema: DbSpecSheetSchema): string {
  const predicates = ["id = $1"];

  if (schema.companyIdColumn) {
    predicates.push(`${quoteIdentifier(schema.companyIdColumn)} = $2`);
  }

  if (schema.isActiveColumn) {
    predicates.push(`${quoteIdentifier(schema.isActiveColumn)} = TRUE`);
  }

  return `
      ${buildSpecSheetSelectBaseSql(schema)}
      WHERE ${predicates.join("\n        AND ")}
      LIMIT 1
    `;
}

async function loadActiveSpecSheetRows(): Promise<DbSpecSheetRow[]> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const result = await queryDb<DbSpecSheetRow>(
    buildSpecSheetSelectSql(schema),
    schema.companyIdColumn ? [getAdminCompanyId()] : undefined,
  );

  return result.rows;
}

async function loadActiveSpecSheetSummaryRows(): Promise<DbSpecSheetRow[]> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const result = await queryDb<DbSpecSheetRow>(
    buildSpecSheetSummarySelectSql(schema),
    schema.companyIdColumn ? [getAdminCompanyId()] : undefined,
  );

  return result.rows;
}

type DbOrderEntryRow = {
  id: string;
  spec_sheet_id: string;
  source_order_entry_id: string | null;
  factory_name: string | null;
  quantity: number | null;
  due_date: string | null;
  labor_cost: number | null;
  loss_cost: number | null;
  status: string | null;
};

type DbMaterialRow = {
  id: string;
  spec_sheet_id: string;
  material_type: Material["type"] | null;
  name: string | null;
  vendor: string | null;
  quantity: number | null;
  unit: Material["unit"] | null;
  unit_cost: number | null;
  total_cost: number | null;
  status: Material["status"] | null;
};

type DbOutsourcingRow = {
  id: string;
  spec_sheet_id: string;
  process: string | null;
  vendor: string | null;
  quantity: number | null;
  unit: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  status: string | null;
};

type WorkOrderDetailRows = {
  orderEntries: OrderEntry[];
  materials: Material[];
  outsourcing: Outsourcing[];
};

function getOrCreateDetailRows(
  map: Map<string, WorkOrderDetailRows>,
  workOrderId: string,
): WorkOrderDetailRows {
  const existing = map.get(workOrderId);
  if (existing) return existing;
  const created = { orderEntries: [], materials: [], outsourcing: [] };
  map.set(workOrderId, created);
  return created;
}

async function loadNormalizedDetailRowsByWorkOrderIds(
  workOrderIds: string[],
): Promise<Map<string, WorkOrderDetailRows>> {
  const uniqueIds = Array.from(new Set(workOrderIds.filter(Boolean)));
  const rowsByWorkOrderId = new Map<string, WorkOrderDetailRows>();
  if (uniqueIds.length === 0) return rowsByWorkOrderId;

  const [ordersResult, materialsResult, outsourcingResult] = await Promise.all([
    queryDb<DbOrderEntryRow>(
      `SELECT id,
              spec_sheet_id,
              source_order_entry_id,
              factory_name,
              quantity,
              due_date,
              labor_cost,
              loss_cost,
              status
         FROM orders
        WHERE spec_sheet_id = ANY($1::text[])
          AND COALESCE(is_active, true) = true
          AND deleted_at IS NULL
        ORDER BY created_at ASC, id ASC`,
      [uniqueIds],
    ),
    queryDb<DbMaterialRow>(
      `SELECT id,
              spec_sheet_id,
              material_type,
              name,
              vendor,
              quantity,
              unit,
              unit_cost,
              total_cost,
              status
         FROM spec_sheet_materials
        WHERE spec_sheet_id = ANY($1::text[])
          AND COALESCE(is_active, true) = true
          AND deleted_at IS NULL
        ORDER BY created_at ASC, id ASC`,
      [uniqueIds],
    ),
    queryDb<DbOutsourcingRow>(
      `SELECT id,
              spec_sheet_id,
              process,
              vendor,
              quantity,
              unit,
              unit_cost,
              total_cost,
              status
         FROM spec_sheet_outsourcing_lines
        WHERE spec_sheet_id = ANY($1::text[])
          AND COALESCE(is_active, true) = true
          AND deleted_at IS NULL
        ORDER BY created_at ASC, id ASC`,
      [uniqueIds],
    ),
  ]);

  for (const row of ordersResult.rows) {
    getOrCreateDetailRows(rowsByWorkOrderId, row.spec_sheet_id).orderEntries.push({
      id: row.source_order_entry_id || row.id,
      type: "생산발주",
      targetType: ORDER_ENTRY_TARGET_TYPE.factory,
      factory: row.factory_name || "",
      dueDate: row.due_date || "",
      quantity: readNumberRowValue(row.quantity),
      laborCost: readNumberRowValue(row.labor_cost),
      lossCost: readNumberRowValue(row.loss_cost),
      priority: "",
    });
  }

  for (const row of materialsResult.rows) {
    getOrCreateDetailRows(rowsByWorkOrderId, row.spec_sheet_id).materials.push({
      id: row.id,
      type: row.material_type || "기타",
      name: row.name || "",
      vendor: row.vendor || "",
      quantity: readNumberRowValue(row.quantity),
      unit: row.unit || "개",
      unitCost: readNumberRowValue(row.unit_cost),
      totalCost: readNumberRowValue(row.total_cost),
      status: row.status || "준비",
    });
  }

  for (const row of outsourcingResult.rows) {
    getOrCreateDetailRows(rowsByWorkOrderId, row.spec_sheet_id).outsourcing.push({
      id: row.id,
      process: row.process || "",
      vendor: row.vendor || "",
      quantity: readNumberRowValue(row.quantity),
      unitType: row.unit || "",
      unitCost: readNumberRowValue(row.unit_cost),
      totalCost: readNumberRowValue(row.total_cost),
      status: row.status || "",
    });
  }

  return rowsByWorkOrderId;
}

async function attachNormalizedDetailRows(workOrders: WorkOrder[]): Promise<WorkOrder[]> {
  const rowsByWorkOrderId = await loadNormalizedDetailRowsByWorkOrderIds(
    workOrders.map((workOrder) => workOrder.id),
  );

  return workOrders.map((workOrder) => {
    const detailRows = rowsByWorkOrderId.get(workOrder.id);
    if (!detailRows) return workOrder;
    return {
      ...workOrder,
      orderEntries: detailRows.orderEntries,
      materials: detailRows.materials,
      outsourcing: detailRows.outsourcing,
    };
  });
}

export async function findDbWorkOrderSummaries(): Promise<WorkOrderSummary[]> {
  const rows = await loadActiveSpecSheetSummaryRows();
  return rows.map(mapSpecSheetRowToWorkOrderSummary);
}

export async function findAllDbWorkOrders(): Promise<WorkOrder[]> {
  const rows = await loadActiveSpecSheetRows();
  return attachNormalizedDetailRows(rows.map(mapSpecSheetRowToWorkOrder));
}

export async function findDbWorkOrderById(workOrderId: string): Promise<WorkOrder | null> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const values: unknown[] = [workOrderId];
  if (schema.companyIdColumn) {
    values.push(getAdminCompanyId());
  }

  const result = await queryDb<DbSpecSheetRow>(
    buildSpecSheetSelectByIdSql(schema),
    values,
  );
  const row = result.rows[0] ?? null;
  if (!row) return null;
  const [hydrated] = await attachNormalizedDetailRows([mapSpecSheetRowToWorkOrder(row)]);
  return hydrated ?? mapSpecSheetRowToWorkOrder(row);
}

export async function createDbWorkOrder(
  workOrder: WorkOrder,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedBaseWorkOrder = normalizeWorkOrderForDb(workOrder);
  const resolvedCategoryIds = await resolveCategoryIdsForDb(
    normalizedBaseWorkOrder,
  );
  const normalizedWorkOrder = {
    ...normalizedBaseWorkOrder,
    ...resolvedCategoryIds,
  };
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

  if (schema.category1IdColumn) {
    columns.push(schema.category1IdColumn);
    values.push(normalizedWorkOrder.category1Id ?? null);
    placeholders.push(`$${values.length}`);
  }

  if (schema.category2IdColumn) {
    columns.push(schema.category2IdColumn);
    values.push(normalizedWorkOrder.category2Id ?? null);
    placeholders.push(`$${values.length}`);
  }

  if (schema.category3IdColumn) {
    columns.push(schema.category3IdColumn);
    values.push(normalizedWorkOrder.category3Id ?? null);
    placeholders.push(`$${values.length}`);
  }

  appendNormalizedWorkOrderInsertColumns(schema, normalizedWorkOrder, columns, values, placeholders);

  if (schema.payloadColumn) {
    columns.push(schema.payloadColumn);
    values.push(buildPayloadValue(schema.payloadColumnKind, payload));
    placeholders.push(
      buildPayloadInsertPlaceholder(schema.payloadColumnKind, values.length),
    );
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

  const payloadFallbackSql =
    schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

  const returningColumns = [
    "id",
    "title",
    buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL"),
    buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL"),
    buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL"),
    buildAliasSelection(
      schema.reorderGroupIdColumn,
      "reorder_group_id",
      "NULL",
    ),
    buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL"),
    buildAliasSelection(
      schema.parentSpecSheetIdColumn,
      "parent_spec_sheet_id",
      "NULL",
    ),
    buildAliasSelection(schema.isReworkColumn, "is_rework", "NULL"),
    buildAliasSelection(schema.category1IdColumn, "category1_id", "NULL"),
    buildAliasSelection(schema.category2IdColumn, "category2_id", "NULL"),
    buildAliasSelection(schema.category3IdColumn, "category3_id", "NULL"),
    buildAliasSelection(schema.displayTitleColumn, "display_title", "NULL"),
    buildAliasSelection(schema.baseTitleColumn, "base_title", "NULL"),
    buildAliasSelection(schema.category1Column, "category1", "NULL"),
    buildAliasSelection(schema.category2Column, "category2", "NULL"),
    buildAliasSelection(schema.category3Column, "category3", "NULL"),
    buildAliasSelection(schema.seasonColumn, "season", "NULL"),
    buildAliasSelection(schema.priorityColumn, "priority", "NULL"),
    buildAliasSelection(schema.vendorColumn, "vendor", "NULL"),
    buildAliasSelection(schema.managerColumn, "manager", "NULL"),
    buildAliasSelection(schema.managerIdColumn, "manager_id", "NULL"),
    buildAliasSelection(schema.createdByIdColumn, "created_by_id", "NULL"),
    buildAliasSelection(schema.createdByRoleColumn, "created_by_role", "NULL"),
    buildAliasSelection(schema.dueDateColumn, "due_date", "NULL"),
    buildAliasSelection(schema.quantityColumn, "quantity", "NULL"),
    buildAliasSelection(schema.inventoryQuantityColumn, "inventory_quantity", "NULL"),
    buildAliasSelection(schema.inventoryStatusColumn, "inventory_status", "NULL"),
    buildAliasSelection(schema.memoColumn, "memo", "NULL"),
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
  const persisted = {
    ...normalizedWorkOrder,
    ...mapped,
    orderEntries: normalizedWorkOrder.orderEntries ?? [],
    materials: normalizedWorkOrder.materials ?? [],
    outsourcing: normalizedWorkOrder.outsourcing ?? [],
  };
  await syncDbFactoryOrdersForSpecSheet(persisted);
  await syncDbSpecSheetMaterialsForSpecSheet(persisted);
  await syncDbSpecSheetOutsourcingForSpecSheet(persisted);
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
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedBaseWorkOrder = normalizeWorkOrderForDb(workOrder);
  const resolvedCategoryIds = await resolveCategoryIdsForDb(
    normalizedBaseWorkOrder,
  );
  const normalizedWorkOrder = {
    ...normalizedBaseWorkOrder,
    ...resolvedCategoryIds,
  };
  const payload = serializeWorkOrderPayload(normalizedWorkOrder);

  const assignments = ["title = $2"];
  const values: unknown[] = [normalizedWorkOrder.id, normalizedWorkOrder.title];
  const company = getAdminCompanyScope();

  if (schema.companyIdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.companyIdColumn)} = $${values.length + 1}`,
    );
    values.push(company.companyId);
  }

  if (schema.companyNameColumn) {
    assignments.push(
      `${quoteIdentifier(schema.companyNameColumn)} = $${values.length + 1}`,
    );
    values.push(company.companyName);
  }

  if (schema.workflowStateColumn) {
    assignments.push(
      `${quoteIdentifier(schema.workflowStateColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.workflowState);
  }

  if (schema.lastSavedAtColumn) {
    assignments.push(
      `${quoteIdentifier(schema.lastSavedAtColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.lastSavedAt);
  }

  if (schema.workOrderKindColumn) {
    assignments.push(
      `${quoteIdentifier(schema.workOrderKindColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.workOrderKind ?? "sample");
  }

  if (schema.reorderGroupIdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.reorderGroupIdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.reorderGroupId ?? normalizedWorkOrder.id);
  }

  if (schema.reorderRoundColumn) {
    assignments.push(
      `${quoteIdentifier(schema.reorderRoundColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.reorderRound ?? 0);
  }

  if (schema.parentSpecSheetIdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.parentSpecSheetIdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.parentSpecSheetId ?? null);
  }

  if (schema.isReworkColumn) {
    assignments.push(
      `${quoteIdentifier(schema.isReworkColumn)} = $${values.length + 1}`,
    );
    values.push(Boolean(normalizedWorkOrder.isDefectOrder));
  }

  if (schema.category1IdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.category1IdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.category1Id ?? null);
  }

  if (schema.category2IdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.category2IdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.category2Id ?? null);
  }

  if (schema.category3IdColumn) {
    assignments.push(
      `${quoteIdentifier(schema.category3IdColumn)} = $${values.length + 1}`,
    );
    values.push(normalizedWorkOrder.category3Id ?? null);
  }

  appendNormalizedWorkOrderUpdateAssignments(schema, normalizedWorkOrder, assignments, values);

  if (schema.payloadColumn) {
    assignments.push(
      `${quoteIdentifier(schema.payloadColumn)} = ${buildPayloadInsertPlaceholder(schema.payloadColumnKind, values.length + 1)}`,
    );
    values.push(buildPayloadValue(schema.payloadColumnKind, payload));
  }

  if (schema.isActiveColumn) {
    assignments.push(
      `${quoteIdentifier(schema.isActiveColumn)} = $${values.length + 1}`,
    );
    values.push(true);
  }

  if (schema.deletedAtColumn) {
    assignments.push(
      `${quoteIdentifier(schema.deletedAtColumn)} = $${values.length + 1}`,
    );
    values.push(null);
  }

  const payloadFallbackSql =
    schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

  const returningColumns = [
    "id",
    "title",
    buildAliasSelection(schema.workflowStateColumn, "workflow_state", "NULL"),
    buildAliasSelection(schema.lastSavedAtColumn, "last_saved_at", "NULL"),
    buildAliasSelection(schema.workOrderKindColumn, "work_order_kind", "NULL"),
    buildAliasSelection(
      schema.reorderGroupIdColumn,
      "reorder_group_id",
      "NULL",
    ),
    buildAliasSelection(schema.reorderRoundColumn, "reorder_round", "NULL"),
    buildAliasSelection(
      schema.parentSpecSheetIdColumn,
      "parent_spec_sheet_id",
      "NULL",
    ),
    buildAliasSelection(schema.isReworkColumn, "is_rework", "NULL"),
    buildAliasSelection(schema.category1IdColumn, "category1_id", "NULL"),
    buildAliasSelection(schema.category2IdColumn, "category2_id", "NULL"),
    buildAliasSelection(schema.category3IdColumn, "category3_id", "NULL"),
    buildAliasSelection(schema.displayTitleColumn, "display_title", "NULL"),
    buildAliasSelection(schema.baseTitleColumn, "base_title", "NULL"),
    buildAliasSelection(schema.category1Column, "category1", "NULL"),
    buildAliasSelection(schema.category2Column, "category2", "NULL"),
    buildAliasSelection(schema.category3Column, "category3", "NULL"),
    buildAliasSelection(schema.seasonColumn, "season", "NULL"),
    buildAliasSelection(schema.priorityColumn, "priority", "NULL"),
    buildAliasSelection(schema.vendorColumn, "vendor", "NULL"),
    buildAliasSelection(schema.managerColumn, "manager", "NULL"),
    buildAliasSelection(schema.managerIdColumn, "manager_id", "NULL"),
    buildAliasSelection(schema.createdByIdColumn, "created_by_id", "NULL"),
    buildAliasSelection(schema.createdByRoleColumn, "created_by_role", "NULL"),
    buildAliasSelection(schema.dueDateColumn, "due_date", "NULL"),
    buildAliasSelection(schema.quantityColumn, "quantity", "NULL"),
    buildAliasSelection(schema.inventoryQuantityColumn, "inventory_quantity", "NULL"),
    buildAliasSelection(schema.inventoryStatusColumn, "inventory_status", "NULL"),
    buildAliasSelection(schema.memoColumn, "memo", "NULL"),
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
    throw new Error(
      `spec_sheets row not found for id: ${normalizedWorkOrder.id}`,
    );
  }

  const mapped = mapSpecSheetRowToWorkOrder(updated);
  const persisted = {
    ...normalizedWorkOrder,
    ...mapped,
    orderEntries: normalizedWorkOrder.orderEntries ?? [],
    materials: normalizedWorkOrder.materials ?? [],
    outsourcing: normalizedWorkOrder.outsourcing ?? [],
  };
  await syncDbFactoryOrdersForSpecSheet(persisted);
  await syncDbSpecSheetMaterialsForSpecSheet(persisted);
  await syncDbSpecSheetOutsourcingForSpecSheet(persisted);
  return persisted;
}


export async function updateDbWorkOrderStatePatch(
  patch: WorkOrderStatePatch,
): Promise<WorkOrder> {
  const schema = await loadSpecSheetSchema();
  assertMinimumSpecSheetSchema(schema);

  const normalizedWorkflowState = normalizeDbWorkflowState(patch.workflowState);
  const lastSavedAt = patch.lastSavedAt || new Date().toISOString();
  const assignments: string[] = [];
  const values: unknown[] = [patch.id];

  if (schema.workflowStateColumn) {
    assignments.push(`${quoteIdentifier(schema.workflowStateColumn)} = $${values.length + 1}`);
    values.push(normalizedWorkflowState);
  }

  if (schema.lastSavedAtColumn) {
    assignments.push(`${quoteIdentifier(schema.lastSavedAtColumn)} = $${values.length + 1}`);
    values.push(lastSavedAt);
  }

  if (schema.inventoryQuantityColumn && Object.prototype.hasOwnProperty.call(patch, "inventoryQuantity")) {
    assignments.push(`${quoteIdentifier(schema.inventoryQuantityColumn)} = $${values.length + 1}`);
    values.push(patch.inventoryQuantity ?? 0);
  }

  if (schema.inventoryStatusColumn && Object.prototype.hasOwnProperty.call(patch, "inventoryStatus")) {
    assignments.push(`${quoteIdentifier(schema.inventoryStatusColumn)} = $${values.length + 1}`);
    values.push(patch.inventoryStatus ?? "unchecked");
  }

  if (schema.payloadColumn) {
    const payloadPatchEntries: Array<{ key: keyof WorkOrder; value: unknown }> = [
      { key: "workflowState", value: normalizedWorkflowState },
      { key: "lastSavedAt", value: lastSavedAt },
    ];

    if (Object.prototype.hasOwnProperty.call(patch, "inventoryQuantity")) {
      payloadPatchEntries.push({ key: "inventoryQuantity", value: patch.inventoryQuantity });
    }
    if (Object.prototype.hasOwnProperty.call(patch, "inventoryStatus")) {
      payloadPatchEntries.push({ key: "inventoryStatus", value: patch.inventoryStatus });
    }
    if (Object.prototype.hasOwnProperty.call(patch, "factoryOrderRequest")) {
      payloadPatchEntries.push({ key: "factoryOrderRequest", value: patch.factoryOrderRequest ?? null });
    }
    if (Object.prototype.hasOwnProperty.call(patch, "orderEntries")) {
      payloadPatchEntries.push({ key: "orderEntries", value: patch.orderEntries ?? [] });
    }

    const payloadExpression = buildPayloadPatchExpression(
      schema.payloadColumn,
      schema.payloadColumnKind,
      payloadPatchEntries,
      values,
    );

    if (payloadExpression) {
      assignments.push(`${quoteIdentifier(schema.payloadColumn)} = ${payloadExpression}`);
    }
  }

  if (assignments.length === 0) {
    const existing = await findDbWorkOrderById(patch.id);
    if (!existing) throw new Error(`spec_sheets row not found for id: ${patch.id}`);
    return existing;
  }

  const payloadFallbackSql =
    schema.payloadColumnKind === "text" ? "NULL::text" : "NULL::jsonb";

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
    buildAliasSelection(schema.category1IdColumn, "category1_id", "NULL"),
    buildAliasSelection(schema.category2IdColumn, "category2_id", "NULL"),
    buildAliasSelection(schema.category3IdColumn, "category3_id", "NULL"),
    buildAliasSelection(schema.displayTitleColumn, "display_title", "NULL"),
    buildAliasSelection(schema.baseTitleColumn, "base_title", "NULL"),
    buildAliasSelection(schema.category1Column, "category1", "NULL"),
    buildAliasSelection(schema.category2Column, "category2", "NULL"),
    buildAliasSelection(schema.category3Column, "category3", "NULL"),
    buildAliasSelection(schema.seasonColumn, "season", "NULL"),
    buildAliasSelection(schema.priorityColumn, "priority", "NULL"),
    buildAliasSelection(schema.vendorColumn, "vendor", "NULL"),
    buildAliasSelection(schema.managerColumn, "manager", "NULL"),
    buildAliasSelection(schema.managerIdColumn, "manager_id", "NULL"),
    buildAliasSelection(schema.createdByIdColumn, "created_by_id", "NULL"),
    buildAliasSelection(schema.createdByRoleColumn, "created_by_role", "NULL"),
    buildAliasSelection(schema.dueDateColumn, "due_date", "NULL"),
    buildAliasSelection(schema.quantityColumn, "quantity", "NULL"),
    buildAliasSelection(schema.inventoryQuantityColumn, "inventory_quantity", "NULL"),
    buildAliasSelection(schema.inventoryStatusColumn, "inventory_status", "NULL"),
    buildAliasSelection(schema.memoColumn, "memo", "NULL"),
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
    throw new Error(`spec_sheets row not found for id: ${patch.id}`);
  }

  return mapSpecSheetRowToWorkOrder(updated);
}

async function softDeleteAttachmentMemoBundleForWorkOrder(
  workOrderId: string,
): Promise<void> {
  const trashRetentionDays = COMPANY_FILE_TRASH_RETENTION_DAYS;

  await queryDb(
    `WITH updated_attachments AS (
       UPDATE attachments
          SET is_active = false,
              deleted_at = COALESCE(deleted_at, now()),
              deleted_by = COALESCE(deleted_by, $3),
              delete_source = COALESCE(delete_source, 'workorder_bundle'),
              delete_scope = COALESCE(delete_scope, 'bundle'),
              delete_parent_type = COALESCE(delete_parent_type, 'workorder'),
              delete_parent_id = COALESCE(delete_parent_id, $1),
              delete_batch_id = COALESCE(delete_batch_id, $1),
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
                  delete_source,
                  delete_scope,
                  delete_parent_type,
                  delete_parent_id,
                  delete_batch_id,
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
       delete_source,
       delete_scope,
       delete_parent_type,
       delete_parent_id,
       delete_batch_id,
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
            delete_source,
            delete_scope,
            delete_parent_type,
            delete_parent_id,
            delete_batch_id,
            COALESCE(deleted_at, now()),
            COALESCE(purge_after_at, now() + ($2::integer * interval '1 day'))
       FROM updated_attachments
     ON CONFLICT DO NOTHING`,
    [workOrderId, trashRetentionDays, ADMIN_FILE_TRASH_ACTOR_IDS.workorderDelete],
  );

  await queryDb(
    `UPDATE memos
        SET is_active = false,
            delete_status = 'trashed',
            purge_status = 'pending',
            purge_requested_at = NULL,
            purge_requested_by = NULL,
            delete_source = 'workorder_bundle',
            delete_scope = 'bundle',
            delete_parent_type = 'workorder',
            delete_parent_id = $1,
            delete_batch_id = COALESCE(delete_batch_id, $1),
            purged_at = NULL,
            purged_by = NULL,
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
    if (schema.deleteStatusColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteStatusColumn)} = 'trashed'`,
      );
    }
    if (schema.purgeStatusColumn) {
      assignments.push(
        `${quoteIdentifier(schema.purgeStatusColumn)} = 'pending'`,
      );
    }
    if (schema.purgeRequestedAtColumn) {
      assignments.push(
        `${quoteIdentifier(schema.purgeRequestedAtColumn)} = NULL`,
      );
    }
    if (schema.purgeRequestedByColumn) {
      assignments.push(
        `${quoteIdentifier(schema.purgeRequestedByColumn)} = NULL`,
      );
    }
    if (schema.deleteSourceColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteSourceColumn)} = 'manual'`,
      );
    }
    if (schema.deleteScopeColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteScopeColumn)} = 'bundle'`,
      );
    }
    if (schema.deleteParentTypeColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteParentTypeColumn)} = 'workorder'`,
      );
    }
    if (schema.deleteParentIdColumn) {
      assignments.push(`${quoteIdentifier(schema.deleteParentIdColumn)} = id`);
    }
    if (schema.deleteBatchIdColumn) {
      assignments.push(
        `${quoteIdentifier(schema.deleteBatchIdColumn)} = COALESCE(${quoteIdentifier(schema.deleteBatchIdColumn)}, id)`,
      );
    }
    if (schema.purgedAtColumn) {
      assignments.push(`${quoteIdentifier(schema.purgedAtColumn)} = NULL`);
    }
    if (schema.purgedByColumn) {
      assignments.push(`${quoteIdentifier(schema.purgedByColumn)} = NULL`);
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

export async function saveDbWorkOrder(
  workOrder: WorkOrder,
): Promise<WorkOrder> {
  try {
    return await updateDbWorkOrder(workOrder);
  } catch (error) {
    if (!isNotFoundWorkOrderError(error)) {
      throw error;
    }

    return createDbWorkOrder(workOrder);
  }
}

export async function saveDbWorkOrders(
  workOrders: WorkOrder[],
): Promise<WorkOrder[]> {
  const savedWorkOrders: WorkOrder[] = [];

  for (const workOrder of workOrders) {
    savedWorkOrders.push(await saveDbWorkOrder(workOrder));
  }

  return savedWorkOrders;
}
