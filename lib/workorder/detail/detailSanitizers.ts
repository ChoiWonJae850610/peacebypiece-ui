import {
  CATEGORY_TREE,
  DEFAULT_CATEGORY1,
  DEFAULT_CATEGORY2,
  DEFAULT_CATEGORY3,
  DEFAULT_BASIC_YEAR,
  DEFAULT_FACTORY_OPTION,
  DEFAULT_ORDER_TYPE,
  DEFAULT_PARTNER_OPTION,
  DEFAULT_PRIORITY_OPTION,
  SEASON_OPTIONS,
} from "@/lib/constants/workorderOptions";
import { getCategory2OptionsFromTree, getCategory3OptionsFromTree } from "@/lib/utils/categoryOptions";
import { isEditorNumericField } from "@/lib/workorder/detail/detailFields";
import { sanitizeOrderInspectionStatus } from "@/lib/workorder/workflow";
import type { OrderEntry, OrderInspectionStatus, WorkflowState, WorkOrder } from "@/types/workorder";

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
  return getCategory2OptionsFromTree(CATEGORY_TREE, category1) ?? getCategory2OptionsFromTree(CATEGORY_TREE, DEFAULT_CATEGORY1);
}

export function getCategory3Options(category2: string, category1: string = DEFAULT_CATEGORY1) {
  return getCategory3OptionsFromTree(CATEGORY_TREE, category1, category2)
    ?? getCategory3OptionsFromTree(CATEGORY_TREE, DEFAULT_CATEGORY1, DEFAULT_CATEGORY2)
    ?? [DEFAULT_CATEGORY3];
}

export function sanitizeSelectValue(value: string, options: readonly string[], fallback?: string) {
  if (value && options.includes(value)) return value;
  return fallback ?? options[0] ?? "";
}

export function appendOption(options: string[], value: string) {
  const trimmed = value.trim();
  if (!trimmed) return options;
  if (options.includes(trimmed)) return options;
  return [...options, trimmed];
}

export function parseSeasonYear(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(SS|FW|NOS|ALL)(?:\s+(\d{4}))?$/i);
  if (match) {
    return {
      season: match[1].toUpperCase(),
      year: match[2] ?? DEFAULT_BASIC_YEAR,
    };
  }

  const [first = "", second = ""] = trimmed.split(/\s+/);
  return {
    season: first || SEASON_OPTIONS[0],
    year: second || DEFAULT_BASIC_YEAR,
  };
}

export function getInitialBasicInfo(workOrder: WorkOrder) {
  const parsedSeason = parseSeasonYear(workOrder.season);
  const category1 = workOrder.category1 || DEFAULT_CATEGORY1;
  const category2Options = getCategory2Options(category1);
  const category2 = workOrder.category2 || category2Options[0] || "";
  const category3Options = getCategory3Options(category2, category1);
  const category3 = workOrder.category3 || category3Options[0] || "";

  return {
    category1,
    category2,
    category3,
    partner: DEFAULT_PARTNER_OPTION,
    season: parsedSeason.season || SEASON_OPTIONS[0],
    year: parsedSeason.year || DEFAULT_BASIC_YEAR,
  };
}
