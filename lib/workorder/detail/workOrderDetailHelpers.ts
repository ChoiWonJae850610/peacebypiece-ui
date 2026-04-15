import { listActiveMaterialPartnerNames, listActiveOutsourcingPartnerNamesByProcess } from "@/lib/admin/partnerMasterPersistence";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import type { Material, Outsourcing, WorkflowState } from "@/types/workorder";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";

const INSPECTION_MODAL_WORKFLOW_STATES: WorkflowState[] = ["in_production", "in_inspection"];

export type CostSummaryValues = {
  laborCost: number;
  lossCost: number;
  totalCost: number;
  unitCost: number;
};

function mergeOptionLists(...sources: ReadonlyArray<ReadonlyArray<string>>): string[] {
  return sources.flat().reduce<string[]>((options, value) => {
    const normalized = value.trim();
    if (!normalized || options.includes(normalized)) {
      return options;
    }
    options.push(normalized);
    return options;
  }, []);
}

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

export function getMaterialVendorOptionsById(materialItems: Material[]): Record<string, string[]> {
  return Object.fromEntries(
    materialItems.map((item) => [
      item.id,
      mergeOptionLists(
        listActiveMaterialPartnerNames(item.type),
        item.vendor ? [item.vendor] : [],
      ),
    ]),
  );
}

export function getOutsourcingVendorOptionsById(outsourcingItems: Outsourcing[]): Record<string, string[]> {
  return Object.fromEntries(
    outsourcingItems.map((item) => [
      item.id,
      mergeOptionLists(
        listActiveOutsourcingPartnerNamesByProcess(item.process),
        item.vendor ? [item.vendor] : [],
      ),
    ]),
  );
}
