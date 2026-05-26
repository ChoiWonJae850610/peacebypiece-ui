import {
  DEFAULT_WORKFLOW_STATE,
  LEGACY_WORKFLOW_STATE_MAP,
  WORKFLOW_STATES,
} from "@/lib/constants/workorderStates";
import type { WorkOrder, WorkOrderSummary } from "@/types/workorder";
import { applyReorderIdentity } from "@/lib/workorder/reorder/helpers";
import type { DbSpecSheetRow } from "@/lib/workorder/repository/dbWorkOrderRepositoryTypes";

function toIsoString(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function normalizeDbWorkflowState(
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

export function normalizeWorkOrderForDb(workOrder: WorkOrder): WorkOrder {
  const now = new Date().toISOString();
  const normalizedIdentity = applyReorderIdentity(workOrder);

  return {
    ...normalizedIdentity,
    workflowState: normalizeDbWorkflowState(workOrder.workflowState),
    lastSavedAt: workOrder.lastSavedAt || now,
  };
}

function readRoleValue(
  value: unknown,
  fallback: WorkOrder["createdByRole"] = "admin",
): WorkOrder["createdByRole"] {
  if (value === "admin" || value === "designer" || value === "inspector")
    return value;
  return fallback;
}

function readInventoryStatusValue(
  value: unknown,
  fallback: WorkOrder["inventoryStatus"] = "unchecked",
): WorkOrder["inventoryStatus"] {
  if (value === "unchecked" || value === "normal" || value === "shortage")
    return value;
  return fallback;
}

function readStringRowValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

export function readNumberRowValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);

  if (typeof value === "string") {
    const normalized = value.trim().replace(/,/g, "");
    if (!normalized) return fallback;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  }

  if (typeof value === "bigint") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  }

  return fallback;
}

export function mapSpecSheetRowToWorkOrder(row: DbSpecSheetRow): WorkOrder {
  const normalizedWorkflowState = normalizeDbWorkflowState(row.workflow_state);
  const lastSavedAt =
    row.last_saved_at ??
    toIsoString(row.updated_at) ??
    toIsoString(row.created_at);

  const hydrated: WorkOrder = {
    id: row.id,
    title: row.title,
    displayTitle: readStringRowValue(row.display_title, row.title),
    baseTitle: readStringRowValue(row.base_title, row.title),
    workOrderKind: row.work_order_kind ?? undefined,
    reorderGroupId: row.reorder_group_id ?? undefined,
    reorderRound:
      typeof row.reorder_round === "number" ? row.reorder_round : undefined,
    parentSpecSheetId: row.parent_spec_sheet_id ?? undefined,
    isDefectOrder:
      typeof row.is_rework === "boolean" ? row.is_rework : undefined,
    category1: readStringRowValue(row.category1),
    category2: readStringRowValue(row.category2),
    category3: readStringRowValue(row.category3),
    category1Id: row.category1_id ?? null,
    category2Id: row.category2_id ?? null,
    category3Id: row.category3_id ?? null,
    season: readStringRowValue(row.season),
    priority: readStringRowValue(row.priority),
    vendor: readStringRowValue(row.vendor),
    manager: readStringRowValue(row.manager),
    managerId: row.manager_id ?? null,
    createdById: readStringRowValue(row.created_by_id, "system"),
    createdByRole: readRoleValue(row.created_by_role),
    dueDate: readStringRowValue(row.due_date),
    quantity: readNumberRowValue(row.quantity),
    inventoryQuantity: readNumberRowValue(row.inventory_quantity),
    inventoryStatus: readInventoryStatusValue(row.inventory_status),
    memo: readStringRowValue(row.memo),
    rejectionReason: row.rejection_reason ?? null,
    rejectedAt: toIsoString(row.rejected_at) || null,
    rejectedByUserId: row.rejected_by_user_id ?? null,
    rejectedByName: row.rejected_by_name ?? null,
    materials: [],
    outsourcing: [],
    attachments: [],
    memoThreads: [],
    orderEntries: [],
    workflowState: normalizedWorkflowState,
    lastSavedAt,
    factoryOrderRequest: null,
  };

  return applyReorderIdentity(hydrated);
}

function readCountValue(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

export function mapSpecSheetRowToWorkOrderSummary(
  row: DbSpecSheetRow,
): WorkOrderSummary {
  const normalizedWorkflowState = normalizeDbWorkflowState(row.workflow_state);
  const lastSavedAt =
    row.last_saved_at ??
    toIsoString(row.updated_at) ??
    toIsoString(row.created_at);

  return {
    id: row.id,
    title: row.title,
    displayTitle: readStringRowValue(row.display_title, row.title),
    baseTitle: readStringRowValue(row.base_title, row.title),
    workOrderKind: row.work_order_kind ?? undefined,
    reorderGroupId: row.reorder_group_id ?? undefined,
    reorderRound:
      typeof row.reorder_round === "number" ? row.reorder_round : undefined,
    parentSpecSheetId: row.parent_spec_sheet_id ?? undefined,
    isDefectOrder:
      typeof row.is_rework === "boolean" ? row.is_rework : undefined,
    category1: readStringRowValue(row.category1),
    category2: readStringRowValue(row.category2),
    category3: readStringRowValue(row.category3),
    category1Id: row.category1_id ?? null,
    category2Id: row.category2_id ?? null,
    category3Id: row.category3_id ?? null,
    season: readStringRowValue(row.season),
    priority: readStringRowValue(row.priority),
    vendor: readStringRowValue(row.vendor),
    manager: readStringRowValue(row.manager),
    managerId: row.manager_id ?? null,
    createdById: readStringRowValue(row.created_by_id, "system"),
    createdByRole: readRoleValue(row.created_by_role),
    dueDate: readStringRowValue(row.due_date),
    quantity: readNumberRowValue(row.quantity),
    inventoryQuantity: readNumberRowValue(row.inventory_quantity),
    inventoryStatus: readInventoryStatusValue(row.inventory_status),
    workflowState: normalizedWorkflowState,
    lastSavedAt,
    orderEntryCount: readCountValue(row.order_entry_count),
    materialCount: readCountValue(row.material_count),
    materialSummary: readStringRowValue(row.material_summary),
    outsourcingCount: readCountValue(row.outsourcing_count),
    attachmentCount: readCountValue(row.attachment_count),
    memoThreadCount: readCountValue(row.memo_thread_count),
    hasDetailSnapshot: false,
    createdAt: toIsoString(row.created_at) || undefined,
    updatedAt: toIsoString(row.updated_at) || undefined,
  };
}
