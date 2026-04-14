import {
  normalizeStoredOptionalText,
  normalizeStoredPriority,
  normalizeStoredSeason,
} from "@/lib/constants/workorderDefaults";
import { toInventoryStatus } from "@/lib/constants/workorderDomain";
import {
  DEFAULT_FACTORY_OPTION,
  DEFAULT_ORDER_TYPE,
  DEFAULT_PRIORITY_OPTION,
} from "@/lib/constants/workorderOptions";
import { normalizeCategorySelection } from "@/lib/workorder/normalizeRules";
import { sanitizeOrderInspectionStatus } from "@/lib/workorder/workflow";
import type { OrderEntry, OrderInspectionStatus, WorkflowState, WorkOrder } from "@/types/workorder";

function toNonNegativeNumber(value: unknown, fallback = 0) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, numeric);
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
    type: item.type || fallback?.type || DEFAULT_ORDER_TYPE,
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

  return [
    sanitizeWorkOrderOrderEntry(
      {
        id: `${workOrder.id}-legacy-order`,
        type: DEFAULT_ORDER_TYPE,
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

  return {
    ...workOrder,
    ...normalizedCategory,
    season: normalizeStoredSeason(workOrder.season),
    priority: normalizeStoredPriority(workOrder.priority),
    vendor: normalizeStoredOptionalText(workOrder.vendor),
    dueDate: normalizeStoredOptionalText(workOrder.dueDate),
    inventoryStatus: toInventoryStatus(workOrder.inventoryStatus),
    orderEntries: (workOrder.orderEntries ?? []).map((entry) => ({
      ...sanitizeWorkOrderOrderEntry(entry, undefined, workOrder.workflowState),
      id: entry.id,
      dueDate: normalizeStoredOptionalText(entry.dueDate),
      priority: normalizeStoredPriority(entry.priority),
    })),
  };
}
