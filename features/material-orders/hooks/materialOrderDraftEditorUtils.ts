import type { WorkflowValidationIssue } from "@/lib/workorder/workflowValidationIssues";
import type { MaterialOrder, MaterialOrderStatus } from "@/lib/material-orders/types";
import { applyWaflResourcePatch } from "@/lib/mutations/waflResourceState";
import type { WaflPatchResult } from "@/types/waflMutation";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrderDraftLine, MaterialOrderDraftSelectionType, MaterialOrderDraftType } from "@/lib/material-orders/materialOrderDraftCalculator";

export type SelectedOrderDetailPayload = {
  materialOrderId: string;
  supplierPartnerId: string | null;
  note: string;
  dueDate: string | null;
  lines: Array<{
    itemName: string;
    itemType: MaterialOrderDraftType;
    unit: string;
    orderQuantity: number;
    unitPrice: number;
    allocations: Array<{
      workOrderId: string;
      sourceMaterialKey: string | null;
      allocatedQuantity: number;
      allocationNote: string;
    }>;
  }>;
};


export function applyMaterialOrderPatchResult(
  orders: MaterialOrder[],
  result: WaflPatchResult<Partial<MaterialOrder>>,
): MaterialOrder[] {
  return applyWaflResourcePatch(orders, result.resourceId, {
    ...result.patch,
    updatedAt: result.updatedAt,
  });
}

export function replaceMaterialOrderInList(
  orders: MaterialOrder[],
  updatedOrder: MaterialOrder | null,
): MaterialOrder[] {
  if (!updatedOrder) return orders;
  let replaced = false;
  const nextOrders = orders.map((order) => {
    if (order.id !== updatedOrder.id) return order;
    replaced = true;
    return updatedOrder;
  });
  return replaced ? nextOrders : [updatedOrder, ...nextOrders];
}

export function getMaterialOrderStatusValidationIssues({
  materialType,
  supplierPartnerId,
  lines,
  dueDate,
}: {
  materialType: MaterialOrderDraftSelectionType;
  supplierPartnerId: string | null;
  lines: MaterialOrderDraftLine[];
  dueDate: string;
}): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  if (!materialType) issues.push({ id: "missing_material_type", level: "blocking", message: "자재 종류를 선택한 뒤 진행해주세요." });
  if (!supplierPartnerId) issues.push({ id: "missing_supplier", level: "blocking", message: "공급처를 선택한 뒤 진행해주세요." });
  if (lines.length === 0) issues.push({ id: "missing_order_lines", level: "blocking", message: "발주 품목을 추가한 뒤 진행해주세요." });
  if (lines.some((line) => Number(line.orderQuantity) <= 0)) issues.push({ id: "invalid_order_quantity", level: "blocking", message: "수량이 0 이하인 발주 품목을 수정해주세요." });
  if (!dueDate) issues.push({ id: "missing_due_date", level: "warning", message: "납기일이 입력되지 않았습니다. 필요하면 날짜를 선택한 뒤 진행해주세요." });
  if (lines.some((line) => Number(line.unitPrice) <= 0)) issues.push({ id: "zero_unit_price", level: "warning", message: "단가가 0원인 발주 품목이 있습니다. 필요하면 단가를 입력한 뒤 진행해주세요." });
  return issues;
}

export function createDraftLineFromMaterial(
  currentLineCount: number,
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
  material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  orderQuantity: number,
  allocatedQuantity = orderQuantity,
  unitPrice = material.unitCost ?? 0,
): MaterialOrderDraftLine {
  return {
    id: `draft-line-${Date.now()}-${currentLineCount + 1}`,
    itemName: material.itemName,
    unit: material.unit || "마",
    orderQuantity,
    unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
    sourceWorkOrderId: workOrder.id,
    sourceMaterialKey: material.key,
    allocations: [{
      workOrderId: workOrder.id,
      sourceMaterialKey: material.key,
      allocatedQuantity,
      allocationNote: "",
    }],
  };
}

export function mapSelectedOrderToDraftLines(selectedOrder: MaterialOrder): MaterialOrderDraftLine[] {
  return selectedOrder.lines.map((line) => {
    const primaryAllocation = line.allocations[0] ?? null;
    return {
      id: line.id,
      itemName: line.itemName,
      unit: line.unit,
      orderQuantity: line.orderQuantity,
      unitPrice: line.unitPrice,
      sourceWorkOrderId: primaryAllocation?.workOrderId,
      sourceMaterialKey: primaryAllocation?.sourceMaterialKey ?? undefined,
      allocations: line.allocations.map((allocation) => ({
        workOrderId: allocation.workOrderId,
        sourceMaterialKey: allocation.sourceMaterialKey,
        allocatedQuantity: allocation.allocatedQuantity,
        allocationNote: allocation.allocationNote ?? "",
      })),
    };
  });
}

export type PendingMaterialOrderStatusValidation = {
  nextStatus: MaterialOrderStatus;
  issues: WorkflowValidationIssue[];
};
