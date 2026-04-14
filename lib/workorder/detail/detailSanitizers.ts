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
import type { OrderEntry, OrderInspectionStatus, WorkflowState, WorkOrder } from "@/types/workorder";
import {
  appendUniqueOption,
  buildInitialBasicInfoFromWorkOrder,
  normalizeCategorySelection,
  sanitizeOptionValue,
  type CategoryOptionTree,
} from "@/lib/workorder/normalizeRules";
import {
  buildInitialWorkOrderOrderEntries,
  sanitizeWorkOrderInspectionStatus,
  sanitizeWorkOrderOrderEntry,
} from "@/lib/workorder/workOrderDataRules";

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
  return sanitizeWorkOrderInspectionStatus(undefined, workflowState);
}

export function sanitizeInspectionStatus(value: string | undefined | null, workflowState: WorkflowState): OrderInspectionStatus {
  return sanitizeWorkOrderInspectionStatus(value, workflowState);
}

export function sanitizeOrderEntry(item: Partial<OrderEntry>, fallback?: Partial<OrderEntry>, workflowState: WorkflowState = "draft"): OrderEntry {
  const sanitized = sanitizeWorkOrderOrderEntry(item, fallback, workflowState);
  return {
    ...sanitized,
    id: sanitized.id || item.id || fallback?.id || createId("order"),
  };
}

export function getInitialOrderEntries(workOrder: WorkOrder): OrderEntry[] {
  return buildInitialWorkOrderOrderEntries(workOrder).map((item) => ({
    ...item,
    id: item.id || createId("order"),
  }));
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
