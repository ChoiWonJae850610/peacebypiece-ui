import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WorkOrder } from "@/types/workorder";

const WORK_ORDER_TABLE = "work_orders";
const DEFAULT_WORKFLOW_STATE: WorkOrder["workflowState"] = "draft";

type DbWorkOrderRow = {
  id: string;
  title: string;
  workflow_state: string | null;
  last_saved_at: string | null;
  payload: WorkOrder | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoString(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

function mapRowToWorkOrder(row: DbWorkOrderRow): WorkOrder {
  const payload = isObject(row.payload) ? row.payload : {};

  return {
    ...(payload as WorkOrder),
    id: typeof payload.id === "string" ? payload.id : row.id,
    title: typeof payload.title === "string" ? payload.title : row.title,
    workflowState:
      typeof payload.workflowState === "string"
        ? payload.workflowState
        : ((row.workflow_state ?? "draft") as WorkOrder["workflowState"]),
    lastSavedAt:
      typeof payload.lastSavedAt === "string"
        ? payload.lastSavedAt
        : row.last_saved_at ?? toIsoString(row.updated_at) ?? toIsoString(row.created_at),
  } satisfies WorkOrder;
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

export async function findAllDbWorkOrders(): Promise<WorkOrder[]> {
  const result = await queryDb<DbWorkOrderRow>(
    `
      SELECT
        id,
        title,
        workflow_state,
        last_saved_at,
        payload,
        created_at,
        updated_at
      FROM ${WORK_ORDER_TABLE}
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    `,
  );

  return result.rows.map(mapRowToWorkOrder);
}

export async function createDbWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
  const normalizedWorkOrder = normalizeWorkOrderForDb(workOrder);
  const payload = serializeWorkOrderPayload(normalizedWorkOrder);

  const result = await queryDb<DbWorkOrderRow>(
    `
      INSERT INTO ${WORK_ORDER_TABLE} (
        id,
        title,
        workflow_state,
        last_saved_at,
        payload
      )
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING
        id,
        title,
        workflow_state,
        last_saved_at,
        payload,
        created_at,
        updated_at
    `,
    [normalizedWorkOrder.id, normalizedWorkOrder.title, normalizedWorkOrder.workflowState, normalizedWorkOrder.lastSavedAt, JSON.stringify(payload)],
  );

  const created = result.rows[0];

  if (!created) {
    throw new Error("Failed to create work order in DB.");
  }

  return mapRowToWorkOrder(created);
}
