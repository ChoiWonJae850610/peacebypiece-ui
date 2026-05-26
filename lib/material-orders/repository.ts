import "server-only";

import { queryDb, withDbTransaction, type DbTransactionClient } from "@/lib/db/client";
import type {
  MaterialOrder,
  MaterialOrderAllocation,
  MaterialOrderCreateInput,
  MaterialOrderLine,
  MaterialOrderLineInput,
  MaterialOrderListParams,
  MaterialOrderStatus,
  MaterialOrderStatusUpdateInput,
  MaterialOrderSupplier,
  MaterialOrderSupplierListParams,
  MaterialOrderUpdateInput,
} from "@/lib/material-orders/types";

type MaterialOrderRow = {
  id: string;
  company_id: string;
  supplier_partner_id: string | null;
  supplier_partner_name: string | null;
  status: MaterialOrderStatus;
  requested_by_user_id: string | null;
  approved_by_user_id: string | null;
  ordered_at: Date | string | null;
  total_amount: string | number;
  note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type MaterialOrderLineRow = {
  id: string;
  company_id: string;
  material_order_id: string;
  partner_item_id: string | null;
  item_name: string;
  item_type: "fabric" | "submaterial";
  color: string | null;
  spec: string | null;
  unit: string;
  order_quantity: string | number;
  unit_price: string | number;
  amount: string | number;
  note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};



type MaterialOrderSupplierRow = {
  id: string;
  name: string;
  supplier_type: "fabric" | "submaterial";
  is_active: boolean;
};

type MaterialOrderAllocationRow = {
  id: string;
  company_id: string;
  material_order_line_id: string;
  work_order_id: string;
  allocated_quantity: string | number;
  allocation_note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIsoString(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toIsoStringOrNull(value: Date | string | null): string | null {
  if (value === null) return null;
  return toIsoString(value);
}

function toNumber(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeQuantity(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function normalizeMoney(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function resolveLineAmount(line: MaterialOrderLineInput): number {
  const explicitAmount = normalizeMoney(line.amount);
  if (explicitAmount > 0) return explicitAmount;

  const orderQuantity = normalizeQuantity(line.orderQuantity);
  const unitPrice = normalizeMoney(line.unitPrice);
  return Number((orderQuantity * unitPrice).toFixed(2));
}

function calculateTotalAmount(lines: readonly MaterialOrderLineInput[] = []): number {
  return Number(lines.reduce((sum, line) => sum + resolveLineAmount(line), 0).toFixed(2));
}

function mapAllocationRow(row: MaterialOrderAllocationRow): MaterialOrderAllocation {
  return {
    id: row.id,
    companyId: row.company_id,
    materialOrderLineId: row.material_order_line_id,
    workOrderId: row.work_order_id,
    allocatedQuantity: toNumber(row.allocated_quantity),
    allocationNote: row.allocation_note,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapLineRow(
  row: MaterialOrderLineRow,
  allocationsByLineId: ReadonlyMap<string, MaterialOrderAllocation[]>,
): MaterialOrderLine {
  return {
    id: row.id,
    companyId: row.company_id,
    materialOrderId: row.material_order_id,
    partnerItemId: row.partner_item_id,
    itemName: row.item_name,
    itemType: row.item_type,
    color: row.color,
    spec: row.spec,
    unit: row.unit,
    orderQuantity: toNumber(row.order_quantity),
    unitPrice: toNumber(row.unit_price),
    amount: toNumber(row.amount),
    note: row.note,
    allocations: allocationsByLineId.get(row.id) ?? [],
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapOrderRow(
  row: MaterialOrderRow,
  linesByOrderId: ReadonlyMap<string, MaterialOrderLine[]>,
): MaterialOrder {
  return {
    id: row.id,
    companyId: row.company_id,
    supplierPartnerId: row.supplier_partner_id,
    supplierPartnerName: row.supplier_partner_name,
    status: row.status,
    requestedByUserId: row.requested_by_user_id,
    approvedByUserId: row.approved_by_user_id,
    orderedAt: toIsoStringOrNull(row.ordered_at),
    totalAmount: toNumber(row.total_amount),
    note: row.note,
    lines: linesByOrderId.get(row.id) ?? [],
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function buildRequestedByVisibilityPredicate(
  visibility: MaterialOrderListParams["visibility"],
  values: unknown[],
  columnSql = "orders.requested_by_user_id",
): string {
  if (visibility?.mode !== "assigned") return "";

  const accessibleOwnerIds = Array.from(new Set([visibility.userId, visibility.companyMemberId]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))));

  if (accessibleOwnerIds.length === 0) return "AND FALSE";

  values.push(accessibleOwnerIds);
  return `AND ${columnSql} = ANY($${values.length}::text[])`;
}

function buildOrderWhere(params: MaterialOrderListParams): { sql: string; values: unknown[] } {
  const clauses = ["orders.company_id = $1"];
  const values: unknown[] = [params.companyId];

  const visibilityPredicate = buildRequestedByVisibilityPredicate(params.visibility, values);
  if (visibilityPredicate) clauses.push(visibilityPredicate.replace(/^AND\s+/, ""));

  if (params.status) {
    values.push(params.status);
    clauses.push(`orders.status = $${values.length}`);
  }

  return { sql: clauses.join(" AND "), values };
}

const MATERIAL_ORDER_SELECT_SQL = `
  SELECT
    orders.id,
    orders.company_id,
    orders.supplier_partner_id,
    supplier.name AS supplier_partner_name,
    orders.status,
    orders.requested_by_user_id,
    orders.approved_by_user_id,
    orders.ordered_at,
    orders.total_amount,
    orders.note,
    orders.created_at,
    orders.updated_at
  FROM material_orders orders
  LEFT JOIN partners supplier
    ON supplier.id = orders.supplier_partner_id
    AND supplier.company_id = orders.company_id
`;

async function listOrderRows(params: MaterialOrderListParams): Promise<MaterialOrderRow[]> {
  const where = buildOrderWhere(params);
  const result = await queryDb<MaterialOrderRow>(
    `${MATERIAL_ORDER_SELECT_SQL}
     WHERE ${where.sql}
     ORDER BY orders.created_at DESC, orders.id DESC`,
    where.values,
  );

  return result.rows;
}

async function listLineRows(companyId: string, orderIds: readonly string[]): Promise<MaterialOrderLineRow[]> {
  if (orderIds.length === 0) return [];

  const result = await queryDb<MaterialOrderLineRow>(
    `SELECT
       id,
       company_id,
       material_order_id,
       partner_item_id,
       item_name,
       item_type,
       color,
       spec,
       unit,
       order_quantity,
       unit_price,
       amount,
       note,
       created_at,
       updated_at
     FROM material_order_lines
     WHERE company_id = $1
       AND material_order_id = ANY($2::text[])
     ORDER BY created_at ASC, id ASC`,
    [companyId, orderIds],
  );

  return result.rows;
}

async function listAllocationRows(companyId: string, lineIds: readonly string[]): Promise<MaterialOrderAllocationRow[]> {
  if (lineIds.length === 0) return [];

  const result = await queryDb<MaterialOrderAllocationRow>(
    `SELECT
       id,
       company_id,
       material_order_line_id,
       work_order_id,
       allocated_quantity,
       allocation_note,
       created_at,
       updated_at
     FROM material_order_allocations
     WHERE company_id = $1
       AND material_order_line_id = ANY($2::text[])
     ORDER BY created_at ASC, id ASC`,
    [companyId, lineIds],
  );

  return result.rows;
}

function groupMaterialOrders(
  orderRows: readonly MaterialOrderRow[],
  lineRows: readonly MaterialOrderLineRow[],
  allocationRows: readonly MaterialOrderAllocationRow[],
): MaterialOrder[] {
  const allocationsByLineId = new Map<string, MaterialOrderAllocation[]>();

  for (const row of allocationRows) {
    const allocations = allocationsByLineId.get(row.material_order_line_id) ?? [];
    allocations.push(mapAllocationRow(row));
    allocationsByLineId.set(row.material_order_line_id, allocations);
  }

  const linesByOrderId = new Map<string, MaterialOrderLine[]>();
  for (const row of lineRows) {
    const lines = linesByOrderId.get(row.material_order_id) ?? [];
    lines.push(mapLineRow(row, allocationsByLineId));
    linesByOrderId.set(row.material_order_id, lines);
  }

  return orderRows.map((row) => mapOrderRow(row, linesByOrderId));
}


function mapSupplierItemType(type: MaterialOrderSupplierListParams["type"]): "fabric" | "subsidiary" | null {
  if (type === "fabric") return "fabric";
  if (type === "submaterial") return "subsidiary";
  return null;
}

function mapSupplierRow(row: MaterialOrderSupplierRow): MaterialOrderSupplier {
  return {
    id: row.id,
    name: row.name,
    type: row.supplier_type,
    isActive: row.is_active,
  };
}

export async function listMaterialOrderSuppliersByCompany(
  params: MaterialOrderSupplierListParams,
): Promise<MaterialOrderSupplier[]> {
  const values: unknown[] = [params.companyId];
  const itemType = mapSupplierItemType(params.type);
  const itemTypeFilter = itemType ? "AND pi.item_type = $2" : "AND pi.item_type IN ('fabric', 'subsidiary')";
  if (itemType) values.push(itemType);

  const result = await queryDb<MaterialOrderSupplierRow>(
    `SELECT DISTINCT
       p.id,
       p.name,
       CASE
         WHEN pi.item_type = 'subsidiary' THEN 'submaterial'
         ELSE 'fabric'
       END AS supplier_type,
       p.is_active
     FROM partners p
     INNER JOIN partner_items pi
        ON pi.partner_id = p.id
       AND pi.company_id = p.company_id
     WHERE p.company_id = $1
       AND p.is_active = true
       AND pi.is_active = true
       ${itemTypeFilter}
     ORDER BY p.name ASC`,
    values,
  );

  return result.rows.map(mapSupplierRow);
}

export async function listMaterialOrdersByCompany(params: MaterialOrderListParams): Promise<MaterialOrder[]> {
  const orderRows = await listOrderRows(params);
  const orderIds = orderRows.map((row) => row.id);
  const lineRows = await listLineRows(params.companyId, orderIds);
  const lineIds = lineRows.map((row) => row.id);
  const allocationRows = await listAllocationRows(params.companyId, lineIds);

  return groupMaterialOrders(orderRows, lineRows, allocationRows);
}

export async function getMaterialOrderById(input: {
  companyId: string;
  materialOrderId: string;
}): Promise<MaterialOrder | null> {
  const result = await queryDb<MaterialOrderRow>(
    `${MATERIAL_ORDER_SELECT_SQL}
     WHERE orders.company_id = $1
       AND orders.id = $2
     LIMIT 1`,
    [input.companyId, input.materialOrderId],
  );

  const orderRows = result.rows;
  if (orderRows.length === 0) return null;

  const lineRows = await listLineRows(input.companyId, [input.materialOrderId]);
  const allocationRows = await listAllocationRows(input.companyId, lineRows.map((row) => row.id));
  return groupMaterialOrders(orderRows, lineRows, allocationRows)[0] ?? null;
}

async function insertMaterialOrderLine(
  client: DbTransactionClient,
  companyId: string,
  materialOrderId: string,
  line: MaterialOrderLineInput,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO material_order_lines (
       company_id,
       material_order_id,
       partner_item_id,
       item_name,
       item_type,
       color,
       spec,
       unit,
       order_quantity,
       unit_price,
       amount,
       note
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      companyId,
      materialOrderId,
      normalizeText(line.partnerItemId),
      line.itemName.trim(),
      line.itemType,
      normalizeText(line.color),
      normalizeText(line.spec),
      line.unit.trim(),
      normalizeQuantity(line.orderQuantity),
      normalizeMoney(line.unitPrice),
      resolveLineAmount(line),
      normalizeText(line.note),
    ],
  );

  return result.rows[0]?.id ?? "";
}

async function insertMaterialOrderAllocations(
  client: DbTransactionClient,
  companyId: string,
  materialOrderLineId: string,
  line: MaterialOrderLineInput,
): Promise<void> {
  for (const allocation of line.allocations ?? []) {
    const workOrderId = allocation.workOrderId.trim();
    if (!workOrderId) continue;

    await client.query(
      `INSERT INTO material_order_allocations (
         company_id,
         material_order_line_id,
         work_order_id,
         allocated_quantity,
         allocation_note
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        companyId,
        materialOrderLineId,
        workOrderId,
        normalizeQuantity(allocation.allocatedQuantity),
        normalizeText(allocation.allocationNote),
      ],
    );
  }
}

export async function createMaterialOrderForCompany(input: MaterialOrderCreateInput): Promise<MaterialOrder | null> {
  const materialOrderId = await withDbTransaction(async (client) => {
    const orderResult = await client.query<{ id: string }>(
      `INSERT INTO material_orders (
         company_id,
         supplier_partner_id,
         status,
         requested_by_user_id,
         total_amount,
         note
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        input.companyId,
        normalizeText(input.supplierPartnerId),
        input.status ?? "draft",
        input.requestedByUserId,
        calculateTotalAmount(input.lines),
        normalizeText(input.note),
      ],
    );

    const orderId = orderResult.rows[0]?.id;
    if (!orderId) throw new Error("MATERIAL_ORDER_CREATE_FAILED");

    for (const line of input.lines ?? []) {
      if (!line.itemName.trim() || !line.unit.trim()) continue;
      const lineId = await insertMaterialOrderLine(client, input.companyId, orderId, line);
      if (lineId) await insertMaterialOrderAllocations(client, input.companyId, lineId, line);
    }

    return orderId;
  });

  return getMaterialOrderById({
    companyId: input.companyId,
    materialOrderId,
  });
}

export async function updateMaterialOrderDetailForCompany(input: MaterialOrderUpdateInput): Promise<MaterialOrder | null> {
  const materialOrderId = await withDbTransaction(async (client) => {
    const updateValues: unknown[] = [
      input.companyId,
      input.materialOrderId,
      normalizeText(input.supplierPartnerId),
      calculateTotalAmount(input.lines),
      normalizeText(input.note),
    ];
    const visibilityPredicate = buildRequestedByVisibilityPredicate(input.visibility, updateValues);

    const orderResult = await client.query<{ id: string }>(
      `UPDATE material_orders
       SET supplier_partner_id = $3,
           total_amount = $4,
           note = $5,
           updated_at = now()
       WHERE company_id = $1
         AND id = $2
         AND status = 'draft'
         ${visibilityPredicate}
       RETURNING id`,
      updateValues,
    );

    const orderId = orderResult.rows[0]?.id;
    if (!orderId) throw new Error("MATERIAL_ORDER_DRAFT_NOT_FOUND_OR_LOCKED");

    await client.query(
      `DELETE FROM material_order_allocations
       WHERE company_id = $1
         AND material_order_line_id IN (
           SELECT id
           FROM material_order_lines
           WHERE company_id = $1
             AND material_order_id = $2
         )`,
      [input.companyId, orderId],
    );

    await client.query(
      `DELETE FROM material_order_lines
       WHERE company_id = $1
         AND material_order_id = $2`,
      [input.companyId, orderId],
    );

    for (const line of input.lines) {
      if (!line.itemName.trim() || !line.unit.trim()) continue;
      const lineId = await insertMaterialOrderLine(client, input.companyId, orderId, line);
      if (lineId) await insertMaterialOrderAllocations(client, input.companyId, lineId, line);
    }

    return orderId;
  });

  return getMaterialOrderById({
    companyId: input.companyId,
    materialOrderId,
  });
}

export async function updateMaterialOrderStatusForCompany(
  input: MaterialOrderStatusUpdateInput,
): Promise<MaterialOrder | null> {
  const approvedByUserId = input.status === "approved" ? input.actorUserId : null;
  const orderedAtSql = input.status === "order_placed" ? "now()" : "ordered_at";
  const updateValues: unknown[] = [
    input.companyId,
    input.materialOrderId,
    input.status,
    approvedByUserId,
  ];
  const visibilityPredicate = buildRequestedByVisibilityPredicate(input.visibility, updateValues);

  const result = await queryDb<{ id: string }>(
    `UPDATE material_orders
     SET status = $3,
         approved_by_user_id = COALESCE($4, approved_by_user_id),
         ordered_at = ${orderedAtSql},
         updated_at = now()
     WHERE company_id = $1
       AND id = $2
       ${visibilityPredicate}
     RETURNING id`,
    updateValues,
  );

  if (!result.rows[0]?.id) throw new Error("MATERIAL_ORDER_STATUS_NOT_FOUND_OR_FORBIDDEN");

  return getMaterialOrderById({
    companyId: input.companyId,
    materialOrderId: input.materialOrderId,
  });
}
