import { normalizePbpLocalDateValue } from "@/lib/date/localDate";
import { normalizeWorkflowPath } from "@/lib/constants/workflowPaths";
import type { MaterialOrder, MaterialOrderAllocation, MaterialOrderLine, MaterialOrderSupplier } from "@/lib/material-orders/types";
import type { MaterialOrderAllocationRow, MaterialOrderLineRow, MaterialOrderRow, MaterialOrderSupplierRow } from "@/lib/material-orders/repository/rows";
import { toIsoString, toIsoStringOrNull, toNumber } from "@/lib/material-orders/repository/normalizers";

export function mapMaterialOrderAllocationRow(row: MaterialOrderAllocationRow): MaterialOrderAllocation {
  return {
    id: row.id,
    companyId: row.company_id,
    materialOrderLineId: row.material_order_line_id,
    workOrderId: row.work_order_id,
    sourceMaterialKey: row.source_material_key,
    allocatedQuantity: toNumber(row.allocated_quantity),
    allocationNote: row.allocation_note,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export function mapMaterialOrderLineRow(
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

export function mapMaterialOrderRow(
  row: MaterialOrderRow,
  linesByOrderId: ReadonlyMap<string, MaterialOrderLine[]>,
): MaterialOrder {
  return {
    id: row.id,
    companyId: row.company_id,
    supplierPartnerId: row.supplier_partner_id,
    supplierPartnerName: row.supplier_partner_name,
    materialType: row.material_type,
    status: row.status,
    workflowPath: normalizeWorkflowPath(row.workflow_path),
    requestedByUserId: row.requested_by_user_id,
    requestedByDisplayName: row.requested_by_display_name,
    approvedByUserId: row.approved_by_user_id,
    orderedAt: toIsoStringOrNull(row.ordered_at),
    dueDate: normalizePbpLocalDateValue(row.due_date) || null,
    totalAmount: toNumber(row.total_amount),
    note: row.note,
    lines: linesByOrderId.get(row.id) ?? [],
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

export function mapMaterialOrderSupplierRow(row: MaterialOrderSupplierRow): MaterialOrderSupplier {
  return { id: row.id, name: row.name, type: row.supplier_type, isActive: row.is_active };
}
