import {
  DEFAULT_FACTORY_OPTION,
  DEFAULT_MATERIAL_STATUS,
  DEFAULT_MATERIAL_TYPE,
  DEFAULT_MATERIAL_UNIT,
  DEFAULT_NEW_MATERIAL_NAME,
  DEFAULT_ORDER_TYPE,
  DEFAULT_OUTSOURCING_PROCESS,
  DEFAULT_OUTSOURCING_STATUS,
  DEFAULT_OUTSOURCING_UNIT,
  PRIORITY_OPTIONS,
} from "@/lib/constants/workorderOptions";
import { recalculateMaterial, recalculateOutsourcing } from "@/lib/workorder/detail/detailCalculations";
import { createId, sanitizeOrderEntry, sanitizeSelectValue, toNumber } from "@/lib/workorder/detail/detailSanitizers";
import type { EditableCell, OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Material, Outsourcing, WorkflowState, WorkOrder } from "@/types/workorder";

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

export function commitMaterialItemsEdit(payload: {
  materialItems: Material[];
  editingCell: Exclude<EditableCell, null>;
  nextValue: string;
}) {
  return payload.materialItems.map((item) => {
    if (item.id !== payload.editingCell.rowId) return item;

    if (payload.editingCell.field === "quantity") {
      return recalculateMaterial({ ...item, quantity: toNumber(payload.nextValue) });
    }
    if (payload.editingCell.field === "unitCost") {
      return recalculateMaterial({ ...item, unitCost: toNumber(payload.nextValue) });
    }
    if (payload.editingCell.field === "type") {
      return { ...item, type: (payload.nextValue || DEFAULT_MATERIAL_TYPE) as Material["type"] };
    }

    return { ...item, [payload.editingCell.field]: payload.nextValue } as Material;
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

export function createNewMaterialItem() {
  return recalculateMaterial({
    id: createId("material"),
    type: DEFAULT_MATERIAL_TYPE,
    name: DEFAULT_NEW_MATERIAL_NAME,
    vendor: "",
    quantity: 0,
    unit: DEFAULT_MATERIAL_UNIT,
    unitCost: 0,
    totalCost: 0,
    status: DEFAULT_MATERIAL_STATUS,
  });
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

export function toMaterialsPatch(materialItems: Material[]): Partial<WorkOrder> {
  return {
    materials: materialItems.map((item) => recalculateMaterial(item)),
  };
}

export function toOutsourcingPatch(outsourcingItems: Outsourcing[]): Partial<WorkOrder> {
  return {
    outsourcing: outsourcingItems.map((item) => recalculateOutsourcing(item)),
  };
}
