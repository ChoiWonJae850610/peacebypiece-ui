import {
  CATEGORY_TREE,
  DEFAULT_CATEGORY1,
  DEFAULT_CATEGORY2,
  DEFAULT_CATEGORY3,
  DEFAULT_FACTORY_OPTION,
  DEFAULT_ORDER_TYPE,
  DEFAULT_PARTNER_OPTION,
  DEFAULT_PRIORITY_OPTION,
} from "@/lib/constants/workorderOptions";
import { isEditorNumericField } from "@/lib/workorder/detail/detailFields";
import { sanitizeOrderInspectionStatus } from "@/lib/workorder/workflow";
import type { OrderEntry, OrderInspectionStatus, WorkflowState, WorkOrder } from "@/types/workorder";
import {
  appendUniqueOption,
  buildInitialBasicInfoFromWorkOrder,
  normalizeCategorySelection,
  sanitizeOptionValue,
  type CategoryOptionTree,
} from "@/lib/workorder/normalizeRules";

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toNumber(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const isNumericField = isEditorNumericField;

export function normalizeEditingValue(field: string, value: string) {
  if (!isEditorNumericField(field)) return value;
  const sanitized = value.replace(/[^\d.,-]/g, "");
  const hasMinus = sanitized.startsWith("-");
  const unsigned = sanitized.replace(/-/g, "");
  const normalized = unsigned.replace(/,/g, "").replace(/(\..*)\./g, "$1");
  return `${hasMinus ? "-" : ""}${normalized}`;
}

export function getDefaultInspectionStatus(workflowState: WorkflowState): OrderInspectionStatus {
  return sanitizeOrderInspectionStatus(undefined, workflowState);
}

export function sanitizeInspectionStatus(value: string | undefined | null, workflowState: WorkflowState): OrderInspectionStatus {
  return sanitizeOrderInspectionStatus(value, workflowState);
}

export function sanitizeOrderEntry(item: Partial<OrderEntry>, fallback?: Partial<OrderEntry>, workflowState: WorkflowState = "draft"): OrderEntry {
  return {
    id: item.id || fallback?.id || createId("order"),
    type: item.type || fallback?.type || DEFAULT_ORDER_TYPE,
    factory: item.factory || fallback?.factory || DEFAULT_FACTORY_OPTION,
    dueDate: item.dueDate || fallback?.dueDate || "",
    quantity: Math.max(0, Number(item.quantity ?? fallback?.quantity) || 0),
    laborCost: Math.max(0, Number(item.laborCost ?? fallback?.laborCost) || 0),
    lossCost: Math.max(0, Number(item.lossCost ?? fallback?.lossCost) || 0),
    priority: item.priority || fallback?.priority || DEFAULT_PRIORITY_OPTION,
    inspectionStatus: sanitizeInspectionStatus(item.inspectionStatus ?? fallback?.inspectionStatus, workflowState),
  };
}

export function getInitialOrderEntries(workOrder: WorkOrder): OrderEntry[] {
  const entries = (workOrder.orderEntries ?? []).map((item) => sanitizeOrderEntry(item, undefined, workOrder.workflowState));
  if (entries.length > 0) return entries;

  return [
    sanitizeOrderEntry(
      {
        id: `${workOrder.id}-legacy-order`,
        type: DEFAULT_ORDER_TYPE,
        factory: workOrder.vendor || DEFAULT_FACTORY_OPTION,
        dueDate: workOrder.dueDate || "",
        quantity: Number.isFinite(workOrder.quantity) ? workOrder.quantity : 0,
        laborCost: Math.max(0, Number(workOrder.laborCost) || 0),
        lossCost: Math.max(0, Number(workOrder.lossCost) || 0),
        priority: workOrder.priority || DEFAULT_PRIORITY_OPTION,
        inspectionStatus: getDefaultInspectionStatus(workOrder.workflowState),
      },
      undefined,
      workOrder.workflowState,
    ),
  ];
}

export function getCategory2Options(category1: string) {
  const tree = CATEGORY_TREE as CategoryOptionTree;
  const normalized = normalizeCategorySelection({ category1, category2: "", category3: "" }, tree);
  return Object.keys(tree[normalized.category1] ?? tree[DEFAULT_CATEGORY1] ?? {});
}

export function getCategory3Options(category2: string, category1: string = DEFAULT_CATEGORY1) {
  const tree = CATEGORY_TREE as CategoryOptionTree;
  const normalized = normalizeCategorySelection({ category1, category2, category3: "" }, tree);
  return [...(tree[normalized.category1]?.[normalized.category2] ?? tree[DEFAULT_CATEGORY1]?.[DEFAULT_CATEGORY2] ?? [DEFAULT_CATEGORY3])];
}








export function sanitizeSelectValue(value: string, options: readonly string[], fallback?: string) {
  return sanitizeOptionValue(value, options, fallback);
}

export function appendOption(options: string[], value: string) {
  return appendUniqueOption(options, value);
}

export function getInitialBasicInfo(workOrder: WorkOrder) {
  return {
    ...buildInitialBasicInfoFromWorkOrder(workOrder),
    partner: DEFAULT_PARTNER_OPTION,
  };
}
