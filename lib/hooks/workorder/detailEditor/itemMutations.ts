import {
  DEFAULT_FACTORY_OPTION,
  DEFAULT_ORDER_TYPE,
  DEFAULT_OUTSOURCING_PROCESS,
  DEFAULT_OUTSOURCING_STATUS,
  DEFAULT_OUTSOURCING_UNIT,
  PRIORITY_OPTIONS,
} from "@/lib/constants/workorderOptions";
import { recalculateOutsourcing } from "@/lib/workorder/detail/detailCalculations";
import { createId, sanitizeOrderEntry, sanitizeSelectValue, toNumber } from "@/lib/workorder/detail/detailSanitizers";
import type { EditableCell, OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Outsourcing, WorkflowState, WorkOrder } from "@/types/workorder";

export function commitOrderItemsEdit(payload: {
  orderItems: OrderEntryState[];
  editingCell: Exclude<EditableCell, null>;
  nextValue: string;
  currentWorkflowState: WorkflowState;
  factoryOptions: string[];
}) {
  return payload.orderItems.map((item) => {
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
    if (payload.editingCell.field === "type") {
      return sanitizeOrderEntry({ ...item, type: payload.nextValue || DEFAULT_ORDER_TYPE }, item, payload.currentWorkflowState);
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

    return { ...item, [payload.editingCell.field]: payload.nextValue } as Outsourcing;
  });
}

export function createNewOrderEntry(orderItems: OrderEntryState[], currentWorkflowState: WorkflowState) {
  return sanitizeOrderEntry({
    id: createId("order"),
    type: DEFAULT_ORDER_TYPE,
    factory: DEFAULT_FACTORY_OPTION,
    dueDate: orderItems[0]?.dueDate || "",
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
  return {
    orderEntries: orderItems.map((item) => sanitizeOrderEntry(item, undefined, currentWorkflowState)),
  };
}

export function toOutsourcingPatch(outsourcingItems: Outsourcing[]): Partial<WorkOrder> {
  return {
    outsourcing: outsourcingItems.map((item) => recalculateOutsourcing(item)),
  };
}
