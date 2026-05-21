import {
  DEFAULT_FACTORY_OPTION,
  DEFAULT_ORDER_TYPE,
  DEFAULT_OUTSOURCING_PROCESS,
  DEFAULT_OUTSOURCING_STATUS,
  DEFAULT_OUTSOURCING_UNIT,
  PRIORITY_OPTIONS,
} from "@/lib/constants/workorderOptions";
import { ORDER_ENTRY_TARGET_TYPE } from "@/lib/constants/workorderDomain";
import { recalculateOutsourcing } from "@/lib/workorder/detail/detailCalculations";
import { normalizeProductionOrderEntries, normalizeProductionOutsourcingRows } from "@/lib/workorder/productionCompositionSnapshot";
import { createId, sanitizeOrderEntry, sanitizeSelectValue, toNumber } from "@/lib/workorder/detail/detailSanitizers";
import { getOrderSubmissionSnapshotFromSources, getRepresentativeOrderEntry } from "@/lib/workorder/orderSubmission";
import type { EditableCell, OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Outsourcing, WorkflowState, WorkOrder } from "@/types/workorder";

export function commitOrderItemsEdit(payload: {
  orderItems: OrderEntryState[];
  editingCell: Exclude<EditableCell, null>;
  nextValue: string;
  currentWorkflowState: WorkflowState;
  factoryOptions: string[];
}) {
  const nextType = payload.editingCell.field === "type" ? (payload.nextValue || DEFAULT_ORDER_TYPE) : null;

  return payload.orderItems.map((item) => {
    if (payload.editingCell.field === "type") {
      return sanitizeOrderEntry({ ...item, type: nextType ?? DEFAULT_ORDER_TYPE }, item, payload.currentWorkflowState);
    }

    if (item.id !== payload.editingCell.rowId) return item;

    if (payload.editingCell.field === "quantity") {
      return sanitizeOrderEntry({ ...item, quantity: toNumber(payload.nextValue) }, item, payload.currentWorkflowState);
    }
    if (payload.editingCell.field === "laborCost") {
      return sanitizeOrderEntry({ ...item, laborCost: toNumber(payload.nextValue) }, item, payload.currentWorkflowState);
    }
    if (payload.editingCell.field === "lossCost") {
      return sanitizeOrderEntry({ ...item, lossCost: toNumber(payload.nextValue) }, item, payload.currentWorkflowState);
    }
    if (payload.editingCell.field === "factory") {
      return sanitizeOrderEntry({ ...item, factory: sanitizeSelectValue(payload.nextValue, payload.factoryOptions, DEFAULT_FACTORY_OPTION) }, item, payload.currentWorkflowState);
    }
    if (payload.editingCell.field === "priority") {
      return sanitizeOrderEntry({ ...item, priority: payload.nextValue || PRIORITY_OPTIONS[0] }, item, payload.currentWorkflowState);
    }
    if (payload.editingCell.field === "dueDate") {
      return sanitizeOrderEntry({ ...item, dueDate: payload.nextValue }, item, payload.currentWorkflowState);
    }

    return item;
  });
}

export function commitOutsourcingItemsEdit(payload: {
  outsourcingItems: Outsourcing[];
  editingCell: Exclude<EditableCell, null>;
  nextValue: string;
}) {
  return payload.outsourcingItems.map((item) => {
    if (item.id !== payload.editingCell.rowId) return item;

    if (payload.editingCell.field === "quantity") {
      return recalculateOutsourcing({ ...item, quantity: toNumber(payload.nextValue) });
    }
    if (payload.editingCell.field === "unitCost") {
      return recalculateOutsourcing({ ...item, unitCost: toNumber(payload.nextValue) });
    }
    if (payload.editingCell.field === "process") {
      const nextProcess = payload.nextValue;
      if (nextProcess !== item.process) {
        return { ...item, process: nextProcess, vendor: "" } as Outsourcing;
      }
      return { ...item, process: nextProcess } as Outsourcing;
    }

    return { ...item, [payload.editingCell.field]: payload.nextValue } as Outsourcing;
  });
}

export function createNewOrderEntry(orderItems: OrderEntryState[], currentWorkflowState: WorkflowState) {
  const representativeEntry = getRepresentativeOrderEntry(orderItems);

  return sanitizeOrderEntry({
    id: createId("order"),
    type: representativeEntry?.type || DEFAULT_ORDER_TYPE,
    targetType: representativeEntry?.targetType ?? ORDER_ENTRY_TARGET_TYPE.factory,
    factory: DEFAULT_FACTORY_OPTION,
    dueDate: representativeEntry?.dueDate || "",
    quantity: 0,
    laborCost: 0,
    lossCost: 0,
  }, undefined, currentWorkflowState);
}

export function createNewOutsourcingItem() {
  return recalculateOutsourcing({
    id: createId("outsourcing"),
    process: DEFAULT_OUTSOURCING_PROCESS,
    vendor: "",
    quantity: 0,
    unitType: DEFAULT_OUTSOURCING_UNIT,
    unitCost: 0,
    totalCost: 0,
    status: DEFAULT_OUTSOURCING_STATUS,
  });
}

export function toOrderEntriesPatch(orderItems: OrderEntryState[], currentWorkflowState: WorkflowState): Partial<WorkOrder> {
  const normalizedOrderEntries = normalizeProductionOrderEntries(orderItems.map((item) => sanitizeOrderEntry(item, undefined, currentWorkflowState)), currentWorkflowState);
  const representativeEntry = getRepresentativeOrderEntry(normalizedOrderEntries);
  const submissionSnapshot = getOrderSubmissionSnapshotFromSources({ representativeEntry });

  return {
    orderEntries: normalizedOrderEntries,
    ...(representativeEntry ? {
      vendor: submissionSnapshot.factoryName || DEFAULT_FACTORY_OPTION,
      dueDate: submissionSnapshot.dueDate,
      quantity: submissionSnapshot.quantity,
      laborCost: submissionSnapshot.laborCost,
      lossCost: submissionSnapshot.lossCost,
      priority: submissionSnapshot.priority,
    } : {
      vendor: DEFAULT_FACTORY_OPTION,
      dueDate: "",
      quantity: 0,
      laborCost: 0,
      lossCost: 0,
      priority: "",
    }),
  };
}

export function toOutsourcingPatch(outsourcingItems: Outsourcing[]): Partial<WorkOrder> {
  return {
    outsourcing: normalizeProductionOutsourcingRows(outsourcingItems.map((item) => recalculateOutsourcing(item))),
  };
}
