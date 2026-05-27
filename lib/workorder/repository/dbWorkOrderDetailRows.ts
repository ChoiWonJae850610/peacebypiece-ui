import "server-only";

import { normalizeMaterialUnitValue } from "@/lib/constants/material";
import { ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import { queryDb } from "@/lib/db/client";
import { resolveWorkOrderCompanyId, type WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";
import { readNumberRowValue } from "@/lib/workorder/repository/dbWorkOrderRowMappers";
import type { Material } from "@/types/material";
import type { OrderEntry, Outsourcing, WorkOrder } from "@/types/workorder";

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
  vendor_partner_id: string | null;
  vendor_partner_name: string | null;
  quantity: number | null;
  unit: Material["unit"] | null;
  unit_cost: number | null;
  loss_cost: number | null;
  total_cost: number | null;
  status: Material["status"] | null;
};

type DbOutsourcingRow = {
  id: string;
  spec_sheet_id: string;
  process: string | null;
  vendor: string | null;
  vendor_partner_id: string | null;
  vendor_partner_name: string | null;
  quantity: number | null;
  unit: string | null;
  unit_cost: number | null;
  loss_cost: number | null;
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
  scope?: WorkOrderCompanyScope | null,
): Promise<Map<string, WorkOrderDetailRows>> {
  const uniqueIds = Array.from(new Set(workOrderIds.filter(Boolean)));
  const rowsByWorkOrderId = new Map<string, WorkOrderDetailRows>();
  if (uniqueIds.length === 0) return rowsByWorkOrderId;

  const companyId = resolveWorkOrderCompanyId(scope);

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
        WHERE company_id = $1
          AND spec_sheet_id = ANY($2::text[])
        ORDER BY id ASC`,
      [companyId, uniqueIds],
    ),
    queryDb<DbMaterialRow>(
      `SELECT m.id,
              m.spec_sheet_id,
              m.material_type,
              m.name,
              m.vendor,
              m.vendor_partner_id,
              p.name AS vendor_partner_name,
              m.quantity,
              m.unit,
              m.unit_cost,
              m.total_cost,
              m.status
         FROM spec_sheet_materials m
         LEFT JOIN partners p
           ON p.id = m.vendor_partner_id
          AND p.company_id = m.company_id
        WHERE m.company_id = $1
          AND m.spec_sheet_id = ANY($2::text[])
        ORDER BY m.id ASC`,
      [companyId, uniqueIds],
    ),
    queryDb<DbOutsourcingRow>(
      `SELECT ol.id,
              ol.spec_sheet_id,
              ol.process,
              ol.vendor,
              ol.vendor_partner_id,
              p.name AS vendor_partner_name,
              ol.quantity,
              ol.unit,
              ol.unit_cost,
              ol.loss_cost,
              ol.total_cost,
              ol.status
         FROM spec_sheet_outsourcing_lines ol
         LEFT JOIN partners p
           ON p.id = ol.vendor_partner_id
          AND p.company_id = ol.company_id
        WHERE ol.company_id = $1
          AND ol.spec_sheet_id = ANY($2::text[])
        ORDER BY ol.id ASC`,
      [companyId, uniqueIds],
    ),
  ]);

  for (const row of ordersResult.rows) {
    getOrCreateDetailRows(
      rowsByWorkOrderId,
      row.spec_sheet_id,
    ).orderEntries.push({
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
      vendor: row.vendor || row.vendor_partner_name || "",
      vendorPartnerId: row.vendor_partner_id ?? null,
      quantity: readNumberRowValue(row.quantity),
      unit: normalizeMaterialUnitValue(row.unit || "개"),
      unitCost: readNumberRowValue(row.unit_cost),
      lossCost: readNumberRowValue(row.loss_cost),
      totalCost: readNumberRowValue(row.total_cost),
      status: row.status || "준비",
    });
  }

  for (const row of outsourcingResult.rows) {
    getOrCreateDetailRows(
      rowsByWorkOrderId,
      row.spec_sheet_id,
    ).outsourcing.push({
      id: row.id,
      process: row.process || "",
      vendor: row.vendor || row.vendor_partner_name || "",
      vendorPartnerId: row.vendor_partner_id ?? null,
      quantity: readNumberRowValue(row.quantity),
      unitType: row.unit || "",
      unitCost: readNumberRowValue(row.unit_cost),
      lossCost: readNumberRowValue(row.loss_cost),
      totalCost: readNumberRowValue(row.total_cost),
      status: row.status || "",
    });
  }

  return rowsByWorkOrderId;
}

export async function attachNormalizedDetailRows(
  workOrders: WorkOrder[],
  scope?: WorkOrderCompanyScope | null,
): Promise<WorkOrder[]> {
  const rowsByWorkOrderId = await loadNormalizedDetailRowsByWorkOrderIds(
    workOrders.map((workOrder) => workOrder.id),
    scope,
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

