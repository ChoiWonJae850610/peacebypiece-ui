import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import type { WorkflowState } from "@/types/workorder";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";

const INSPECTION_MODAL_WORKFLOW_STATES: WorkflowState[] = ["order_requested", "inspection"];

export type CostSummaryValues = {
  laborCost: number;
  lossCost: number;
  totalCost: number;
  unitCost: number;
};

export function getCostSummaryValues(params: {
  orderItems: OrderEntryState[];
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
}): CostSummaryValues {
  const { orderItems, fabricTotal, subsidiaryTotal, outsourcingTotal } = params;
  const orderTotals = calculateOrderEntryTotals(orderItems);
  const totalCost = fabricTotal + subsidiaryTotal + outsourcingTotal + orderTotals.laborCost + orderTotals.lossCost;
  const unitCost = orderTotals.quantity > 0 ? Math.round(totalCost / orderTotals.quantity) : 0;

  return {
    laborCost: orderTotals.laborCost,
    lossCost: orderTotals.lossCost,
    totalCost,
    unitCost,
  };
}

export function getCanOpenInspectionModal(params: {
  canEditInventory: boolean;
  currentWorkflowState: WorkflowState;
  orderItems: OrderEntryState[];
}): boolean {
  const { canEditInventory, currentWorkflowState, orderItems } = params;

  return canEditInventory
    && INSPECTION_MODAL_WORKFLOW_STATES.includes(currentWorkflowState)
    && orderItems.some((item) => item.inspectionStatus !== "inspection_completed");
}

export function getProductionSectionOpen(materialOpen: boolean, outsourcingOpen: boolean): boolean {
  return materialOpen || outsourcingOpen;
}

