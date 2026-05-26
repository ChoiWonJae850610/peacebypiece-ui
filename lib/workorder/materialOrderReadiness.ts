import { WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import type { Material } from "@/types/material";
import type { WorkOrder, WorkOrderSummary } from "@/types/workorder";
import type { WorkflowState } from "@/types/workflow";

export type WorkOrderMaterialRequestItem = NonNullable<WorkOrderSummary["materialItems"]>[number];

export function hasRequiredMaterialItems(workOrder: Pick<WorkOrder, "materials"> | Pick<WorkOrderSummary, "materialItems">): boolean {
  if ("materials" in workOrder) return hasWorkOrderMaterials(workOrder.materials);
  return hasWorkOrderMaterialSummaryItems(workOrder.materialItems);
}

export function hasWorkOrderMaterials(materials: Material[] | null | undefined): boolean {
  return Array.isArray(materials) && materials.some((material) => material.name.trim().length > 0 && material.quantity > 0);
}

export function hasWorkOrderMaterialSummaryItems(materialItems: WorkOrderSummary["materialItems"] | null | undefined): boolean {
  return Array.isArray(materialItems) && materialItems.some((item) => item.itemName.trim().length > 0 && item.quantity > 0);
}

export function resolveOrderRequestWorkflowState(workOrder: Pick<WorkOrder, "materials">): WorkflowState {
  return hasWorkOrderMaterials(workOrder.materials)
    ? WORKFLOW_STATE.materialOrderPending
    : WORKFLOW_STATE.inspection;
}

export function shouldCreateWorkOrderPdfAfterOrderRequest(workOrder: Pick<WorkOrder, "workflowState">): boolean {
  return workOrder.workflowState === WORKFLOW_STATE.inspection;
}

export function isMaterialOrderPendingWorkOrder(workOrder: Pick<WorkOrderSummary, "workflowState" | "materialItems">): boolean {
  return workOrder.workflowState === WORKFLOW_STATE.materialOrderPending && hasWorkOrderMaterialSummaryItems(workOrder.materialItems);
}

export function toWorkOrderMaterialRequestItems(materials: Material[] | null | undefined): WorkOrderMaterialRequestItem[] {
  if (!Array.isArray(materials)) return [];
  return materials
    .filter((material) => material.name.trim().length > 0 && material.quantity > 0)
    .map((material, index) => ({
      key: material.id || `${material.type}-${material.name}-${index}`,
      itemName: material.name,
      itemType: String(material.type).trim() === "부자재" ? "submaterial" : "fabric",
      quantity: material.quantity,
      unit: material.unit,
      unitCost: material.unitCost,
    }));
}
