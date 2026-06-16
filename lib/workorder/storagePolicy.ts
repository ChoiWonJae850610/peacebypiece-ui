import type { WorkOrder } from "@/types/workorder";

export const WORKORDER_IMMEDIATE_DB_FIELDS = [
  "title",
  "manager",
  "managerId",
  "workflowState",
  "category1",
  "category2",
  "category3",
  "category1Id",
  "category2Id",
  "category3Id",
  "season",
  "inventoryQuantity",
  "inventoryStatus",
  "dueDate",
  "lastSavedAt",
] as const satisfies readonly (keyof WorkOrder)[];

export const WORKORDER_DRAFT_ONLY_DB_FIELDS = [
  "factoryOrderRequest",
  "workOrderKind",
  "priority",
  "vendor",
  "quantity",
  "laborCost",
  "lossCost",
  "orderEntries",
  "memo",
  "materials",
  "outsourcing",
  "attachments",
  "memoThreads",
] as const satisfies readonly (keyof WorkOrder)[];

const immediateFieldSet = new Set<keyof WorkOrder>(WORKORDER_IMMEDIATE_DB_FIELDS);
const draftOnlyFieldSet = new Set<keyof WorkOrder>(WORKORDER_DRAFT_ONLY_DB_FIELDS);

type DraftComparableWorkOrder = Omit<WorkOrder, (typeof WORKORDER_IMMEDIATE_DB_FIELDS)[number]>;

export function isImmediateDbField(field: keyof WorkOrder): boolean {
  return immediateFieldSet.has(field);
}

export function isDraftOnlyDbField(field: keyof WorkOrder): boolean {
  return draftOnlyFieldSet.has(field);
}

export function getDraftComparableWorkOrder(workOrder: WorkOrder | null | undefined): DraftComparableWorkOrder | null {
  if (!workOrder) return null;

  const {
    title: _title,
    manager: _manager,
    managerId: _managerId,
    workflowState: _workflowState,
    category1: _category1,
    category2: _category2,
    category3: _category3,
    category1Id: _category1Id,
    category2Id: _category2Id,
    category3Id: _category3Id,
    season: _season,
    inventoryQuantity: _inventoryQuantity,
    inventoryStatus: _inventoryStatus,
    dueDate: _dueDate,
    lastSavedAt: _lastSavedAt,
    ...draftComparable
  } = workOrder;

  return draftComparable;
}

export function hasWorkOrderDraftChangesByStoragePolicy(current: WorkOrder | null | undefined, persisted: WorkOrder | null | undefined): boolean {
  const currentComparable = getDraftComparableWorkOrder(current);
  const persistedComparable = getDraftComparableWorkOrder(persisted);

  if (!currentComparable || !persistedComparable) {
    return false;
  }

  return JSON.stringify(currentComparable) !== JSON.stringify(persistedComparable);
}

export function mergeImmediateDbFields(base: WorkOrder, source: WorkOrder, fields: readonly (keyof WorkOrder)[]): WorkOrder {
  return fields.reduce<WorkOrder>((next, field) => {
    if (!isImmediateDbField(field)) return next;
    return { ...next, [field]: source[field] };
  }, base);
}
