import {
  normalizeStoredOptionalText,
  normalizeStoredPriority,
  normalizeStoredSeason,
} from "@/lib/constants/workorderDefaults";
import { ORDER_ENTRY_TARGET_TYPE, toInventoryStatus, toOrderEntryTargetType } from "@/lib/constants/workorderDomain";
import {
  DEFAULT_FACTORY_OPTION,
  DEFAULT_ORDER_TYPE,
  DEFAULT_PRIORITY_OPTION,
  isSupportedOrderType,
} from "@/lib/constants/workorderOptions";
import { normalizeCategorySelection } from "@/lib/workorder/normalizeRules";
import { getOrderTypeFromWorkOrderKind } from "@/lib/workorder/reorder/helpers";
import { sanitizeOrderInspectionStatus } from "@/lib/workorder/workflow";
import type { OrderEntry, OrderInspectionStatus, WorkflowState, WorkOrder } from "@/types/workorder";

function toNonNegativeNumber(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, numeric);
}


function normalizeOrderEntryType(value: string | undefined | null): string {
  const normalizedValue = String(value ?? "").trim();
  if (isSupportedOrderType(normalizedValue)) return normalizedValue;
  return DEFAULT_ORDER_TYPE;
}


function normalizeWorkOrderKind(
  value: WorkOrder["workOrderKind"] | string | undefined | null,
  fallbackTitle?: string | null,
  reorderRound?: number | null,
  displayTitle?: string | null,

): WorkOrder["workOrderKind"] {
  if (value === "sample" || value === "main" || value === "rework") return value;
  const normalizedTitle = String(displayTitle ?? fallbackTitle ?? "").trim();
  if (normalizedTitle.includes("(불량)")) return "rework";
  if (/\d+차\s*(\(불량\))?$/.test(normalizedTitle)) return "main";
  if (normalizedTitle.includes("(샘플)")) return "sample";
  if (Number(reorderRound ?? 1) > 1) return "main";
  return "sample";
}

export function sanitizeWorkOrderInspectionStatus(
  value: string | undefined | null,
  workflowState: WorkflowState,
): OrderInspectionStatus {
  return sanitizeOrderInspectionStatus(value, workflowState);
}

export function sanitizeWorkOrderOrderEntry(
  item: Partial<OrderEntry>,
  fallback?: Partial<OrderEntry>,
  workflowState: WorkflowState = "draft",
): OrderEntry {
  return {
    id: item.id || fallback?.id || "",
    type: normalizeOrderEntryType(item.type ?? fallback?.type),
    targetType: toOrderEntryTargetType(item.targetType ?? fallback?.targetType ?? ORDER_ENTRY_TARGET_TYPE.factory),
    factory: item.factory || fallback?.factory || DEFAULT_FACTORY_OPTION,
    dueDate: item.dueDate || fallback?.dueDate || "",
    quantity: toNonNegativeNumber(item.quantity ?? fallback?.quantity),
    laborCost: toNonNegativeNumber(item.laborCost ?? fallback?.laborCost),
    lossCost: toNonNegativeNumber(item.lossCost ?? fallback?.lossCost),
    priority: item.priority || fallback?.priority || DEFAULT_PRIORITY_OPTION,
    inspectionStatus: sanitizeWorkOrderInspectionStatus(item.inspectionStatus ?? fallback?.inspectionStatus, workflowState),
  };
}

export function buildInitialWorkOrderOrderEntries(workOrder: WorkOrder): OrderEntry[] {
  const entries = (workOrder.orderEntries ?? []).map((item) => sanitizeWorkOrderOrderEntry(item, undefined, workOrder.workflowState));
  if (entries.length > 0) return entries;

  const defaultOrderType = getOrderTypeFromWorkOrderKind(normalizeWorkOrderKind(workOrder.workOrderKind, workOrder.title, workOrder.reorderRound, workOrder.displayTitle));

  return [
    sanitizeWorkOrderOrderEntry(
      {
        id: `${workOrder.id}-legacy-order`,
        type: defaultOrderType,
        factory: workOrder.vendor || DEFAULT_FACTORY_OPTION,
        dueDate: workOrder.dueDate || "",
        quantity: Number.isFinite(workOrder.quantity) ? workOrder.quantity : 0,
        laborCost: toNonNegativeNumber(workOrder.laborCost),
        lossCost: toNonNegativeNumber(workOrder.lossCost),
        priority: workOrder.priority || DEFAULT_PRIORITY_OPTION,
        inspectionStatus: sanitizeWorkOrderInspectionStatus(undefined, workOrder.workflowState),
      },
      undefined,
      workOrder.workflowState,
    ),
  ];
}

export function normalizeWorkOrderScalarFields(workOrder: WorkOrder): WorkOrder {
  const normalizedCategory = normalizeCategorySelection({
    category1: workOrder.category1,
    category2: workOrder.category2,
    category3: workOrder.category3,
  });

  const workOrderKind = normalizeWorkOrderKind(workOrder.workOrderKind, workOrder.title, workOrder.reorderRound, workOrder.displayTitle);

  return {
    ...workOrder,
    ...normalizedCategory,
    workOrderKind,
    isDefectOrder: workOrderKind === "rework" ? Boolean(workOrder.isDefectOrder) : false,
    season: normalizeStoredSeason(workOrder.season),
    priority: normalizeStoredPriority(workOrder.priority),
    vendor: normalizeStoredOptionalText(workOrder.vendor),
    dueDate: normalizeStoredOptionalText(workOrder.dueDate),
    inventoryStatus: toInventoryStatus(workOrder.inventoryStatus),
    orderEntries: (workOrder.orderEntries ?? []).map((entry) => ({
      ...sanitizeWorkOrderOrderEntry(entry, undefined, workOrder.workflowState),
      id: entry.id,
      type: normalizeOrderEntryType(entry.type ?? getOrderTypeFromWorkOrderKind(workOrderKind)),
      dueDate: normalizeStoredOptionalText(entry.dueDate),
      priority: normalizeStoredPriority(entry.priority),
    })),
  };
}
