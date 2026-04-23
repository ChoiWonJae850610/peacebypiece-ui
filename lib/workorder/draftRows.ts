import { isEmptySelectionValue } from "@/lib/constants/workorderDomain";
import type { WorkflowState } from "@/types/workflow";
import type { WorkOrder } from "@/types/workorder";

export const WORKFLOW_ROW_PRUNE_STATES: readonly WorkflowState[] = ["review_requested", "inspection"];

export function shouldPruneDraftRowsForWorkflowState(nextState: WorkflowState) {
  return WORKFLOW_ROW_PRUNE_STATES.includes(nextState);
}

export function isUnselectedValue(value: string | undefined | null) {
  const normalized = String(value ?? "").trim();
  return !normalized || isEmptySelectionValue(normalized);
}

export function isEmptyOrderEntry(entry: NonNullable<WorkOrder["orderEntries"]>[number]) {
  return (Number(entry.quantity) || 0) === 0;
}

export function isEmptyMaterialRow(material: WorkOrder["materials"][number]) {
  return (Number(material.quantity) || 0) === 0;
}

export function isEmptyOutsourcingRow(item: WorkOrder["outsourcing"][number]) {
  return (Number(item.quantity) || 0) === 0;
}

export function pruneDraftRows(workOrder: WorkOrder): WorkOrder {
  return {
    ...workOrder,
    orderEntries: (workOrder.orderEntries ?? []).filter((entry) => !isEmptyOrderEntry(entry)),
    materials: (workOrder.materials ?? []).filter((item) => !isEmptyMaterialRow(item)),
    outsourcing: (workOrder.outsourcing ?? []).filter((item) => !isEmptyOutsourcingRow(item)),
  };
}
