import "server-only";

import { queryDb, withDbTransaction } from "@/lib/db/client";
import { canEditMaterialOrderOnServer } from "@/lib/material-orders/serverPolicy";
import type {
  MaterialOrder,
  MaterialOrderAllocation,
  MaterialOrderLine,
  MaterialOrderCreateInput,
  MaterialOrderHeaderUpdateInput,
  MaterialOrderLineInput,
  MaterialOrderListParams,
  MaterialOrderStatus,
  MaterialOrderStatusUpdateInput,
  MaterialOrderSupplier,
  MaterialOrderSupplierListParams,
  MaterialOrderUpdateInput,
} from "@/lib/material-orders/types";
import { WORKFLOW_PATH } from "@/lib/constants/workflowPaths";
import { isMaterialOrderStatusTransitionAllowed } from "@/lib/material-orders/statusFlow";

import type { MaterialOrderAllocationRow, MaterialOrderLineRow, MaterialOrderRow, MaterialOrderSupplierRow } from "@/lib/material-orders/repository/rows";
import { mapMaterialOrderAllocationRow, mapMaterialOrderLineRow, mapMaterialOrderRow, mapMaterialOrderSupplierRow } from "@/lib/material-orders/repository/mappers";
import { buildMaterialOrderVisibilityPredicate, buildMaterialOrderWhere, MATERIAL_ORDER_SELECT_SQL } from "@/lib/material-orders/repository/queryHelpers";
import { calculateMaterialOrderTotalAmount, normalizeMaterialOrderText } from "@/lib/material-orders/repository/normalizers";
import { insertMaterialOrderAllocations, insertMaterialOrderLine } from "@/lib/material-orders/repository/lineWriter";
import { MATERIAL_ORDER_STATUS } from "@/lib/material-orders/types";

async function listOrderRows(params: MaterialOrderListParams): Promise<MaterialOrderRow[]> {
  const where = buildMaterialOrderWhere(params);
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
       source_material_key,
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
    allocations.push(mapMaterialOrderAllocationRow(row));
    allocationsByLineId.set(row.material_order_line_id, allocations);
  }

  const linesByOrderId = new Map<string, MaterialOrderLine[]>();
  for (const row of lineRows) {
    const lines = linesByOrderId.get(row.material_order_id) ?? [];
    lines.push(mapMaterialOrderLineRow(row, allocationsByLineId));
    linesByOrderId.set(row.material_order_id, lines);
  }

  return orderRows.map((row) => mapMaterialOrderRow(row, linesByOrderId));
}

function mapSupplierItemType(type: MaterialOrderSupplierListParams["type"]): "fabric" | "subsidiary" | null {
  if (type === "fabric") return "fabric";
  if (type === "submaterial") return "subsidiary";
  return null;
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

  return result.rows.map(mapMaterialOrderSupplierRow);
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

export async function createMaterialOrderForCompany(input: MaterialOrderCreateInput): Promise<MaterialOrder | null> {
  const materialOrderId = await withDbTransaction(async (client) => {
    const orderResult = await client.query<{ id: string }>(
      `INSERT INTO material_orders (
         company_id,
         supplier_partner_id,
         material_type,
         status,
         workflow_path,
         requested_by_user_id,
         total_amount,
         note,
         due_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        input.companyId,
        normalizeMaterialOrderText(input.supplierPartnerId),
        input.lines?.[0]?.itemType ?? null,
        input.status ?? MATERIAL_ORDER_STATUS.draft,
        WORKFLOW_PATH.standardReview,
        input.requestedByUserId,
        calculateMaterialOrderTotalAmount(input.lines),
        normalizeMaterialOrderText(input.note),
        normalizeMaterialOrderText(input.dueDate),
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

export async function updateMaterialOrderHeaderForCompany(
  input: MaterialOrderHeaderUpdateInput,
): Promise<MaterialOrder | null> {
  const materialOrderId = await withDbTransaction(async (client) => {
    const currentValues: unknown[] = [input.companyId, input.materialOrderId];
    const visibilityPredicate = buildMaterialOrderVisibilityPredicate(
      input.visibility,
      currentValues,
      "requested_by_user_id",
    );
    const currentResult = await client.query<{
      id: string;
      status: MaterialOrderStatus;
      material_type: "fabric" | "submaterial" | null;
    }>(
      `SELECT id, status, material_type
       FROM material_orders
       WHERE company_id = $1
         AND id = $2
         ${visibilityPredicate}
       FOR UPDATE`,
      currentValues,
    );

    const current = currentResult.rows[0];
    if (!current) throw new Error("MATERIAL_ORDER_NOT_FOUND_OR_FORBIDDEN");

    const changesHeader =
      Object.prototype.hasOwnProperty.call(input, "materialType") ||
      Object.prototype.hasOwnProperty.call(input, "supplierPartnerId") ||
      Object.prototype.hasOwnProperty.call(input, "dueDate");
    const headerEditable = canEditMaterialOrderOnServer({
      status: current.status,
      isAdmin: Boolean(input.isAdmin),
    });

    if (changesHeader && !headerEditable) {
      throw new Error("MATERIAL_ORDER_HEADER_LOCKED_BY_STATUS");
    }

    const nextMaterialType = Object.prototype.hasOwnProperty.call(input, "materialType")
      ? input.materialType ?? null
      : current.material_type;
    const materialTypeChanged =
      Object.prototype.hasOwnProperty.call(input, "materialType") &&
      nextMaterialType !== current.material_type;

    const hasSupplierPartnerId = Object.prototype.hasOwnProperty.call(
      input,
      "supplierPartnerId",
    );
    const hasDueDate = Object.prototype.hasOwnProperty.call(input, "dueDate");
    const values: unknown[] = [
      input.companyId,
      input.materialOrderId,
      nextMaterialType,
      hasSupplierPartnerId,
      normalizeMaterialOrderText(input.supplierPartnerId),
      hasDueDate,
      normalizeMaterialOrderText(input.dueDate),
    ];

    await client.query(
      `UPDATE material_orders
       SET material_type = $3,
           supplier_partner_id = CASE
             WHEN $4::boolean THEN $5::text
             WHEN ${materialTypeChanged ? "TRUE" : "FALSE"} THEN NULL
             ELSE supplier_partner_id
           END,
           due_date = CASE
             WHEN $6::boolean THEN $7::text::date
             ELSE due_date
           END,
           total_amount = CASE WHEN ${materialTypeChanged ? "TRUE" : "FALSE"} THEN 0 ELSE total_amount END,
           updated_at = now()
       WHERE company_id = $1
         AND id = $2`,
      values,
    );

    if (materialTypeChanged) {
      await client.query(
        `DELETE FROM material_order_allocations
         WHERE company_id = $1
           AND material_order_line_id IN (
             SELECT id
             FROM material_order_lines
             WHERE company_id = $1
               AND material_order_id = $2
           )`,
        [input.companyId, input.materialOrderId],
      );
      await client.query(
        `DELETE FROM material_order_lines
         WHERE company_id = $1
           AND material_order_id = $2`,
        [input.companyId, input.materialOrderId],
      );
    }

    return input.materialOrderId;
  });

  return getMaterialOrderById({
    companyId: input.companyId,
    materialOrderId,
  });
}

export async function updateMaterialOrderDetailForCompany(input: MaterialOrderUpdateInput): Promise<MaterialOrder | null> {
  const materialOrderId = await withDbTransaction(async (client) => {
    const currentResult = await client.query<{ status: MaterialOrderStatus }>(
      `SELECT status
       FROM material_orders
       WHERE company_id = $1
         AND id = $2
       FOR UPDATE`,
      [input.companyId, input.materialOrderId],
    );
    const current = currentResult.rows[0];
    if (
      !current ||
      !canEditMaterialOrderOnServer({
        status: current.status,
        isAdmin: Boolean(input.isAdmin),
      })
    ) {
      throw new Error("MATERIAL_ORDER_DETAIL_LOCKED_BY_STATUS");
    }

    const updateValues: unknown[] = [
      input.companyId,
      input.materialOrderId,
      normalizeMaterialOrderText(input.supplierPartnerId),
      calculateMaterialOrderTotalAmount(input.lines),
      normalizeMaterialOrderText(input.note),
      normalizeMaterialOrderText(input.dueDate),
    ];
    const visibilityPredicate = buildMaterialOrderVisibilityPredicate(
      input.visibility,
      updateValues,
      "requested_by_user_id",
    );

    const orderResult = await client.query<{ id: string }>(
      `UPDATE material_orders
       SET supplier_partner_id = $3,
           total_amount = $4,
           note = $5,
           due_date = $6,
           updated_at = now()
       WHERE company_id = $1
         AND id = $2
         ${visibilityPredicate}
       RETURNING id`,
      updateValues,
    );

    const orderId = orderResult.rows[0]?.id;
    if (!orderId) throw new Error("MATERIAL_ORDER_DETAIL_NOT_FOUND_OR_FORBIDDEN");

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
  const approvedByUserId = input.status === MATERIAL_ORDER_STATUS.approved ? input.actorUserId : null;
  const orderedAtSql = input.status === MATERIAL_ORDER_STATUS.orderPlaced ? "now()" : "ordered_at";
  const currentOrder = await getMaterialOrderById({
    companyId: input.companyId,
    materialOrderId: input.materialOrderId,
  });

  if (!currentOrder) throw new Error("MATERIAL_ORDER_STATUS_NOT_FOUND_OR_FORBIDDEN");
  if (!isMaterialOrderStatusTransitionAllowed(currentOrder.status, input.status)) {
    throw new Error("MATERIAL_ORDER_STATUS_TRANSITION_NOT_ALLOWED");
  }

  const workflowPath =
    input.status === MATERIAL_ORDER_STATUS.approved
      ? currentOrder?.status === MATERIAL_ORDER_STATUS.draft
        ? WORKFLOW_PATH.directOrder
        : WORKFLOW_PATH.standardReview
      : currentOrder?.workflowPath ?? WORKFLOW_PATH.standardReview;
  const updateValues: unknown[] = [
    input.companyId,
    input.materialOrderId,
    input.status,
    approvedByUserId,
    workflowPath,
  ];
  const visibilityPredicate = buildMaterialOrderVisibilityPredicate(
    input.visibility,
    updateValues,
    "requested_by_user_id",
  );

  const result = await queryDb<{ id: string }>(
    `UPDATE material_orders
     SET status = $3,
         approved_by_user_id = COALESCE($4, approved_by_user_id),
         workflow_path = $5,
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
