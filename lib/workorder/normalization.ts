import {
  DEFAULT_WORKORDER_CATEGORY1,
  DEFAULT_WORKORDER_CATEGORY2,
  DEFAULT_WORKORDER_CATEGORY3,
  normalizeStoredCategory,
  normalizeStoredOptionalText,
  normalizeStoredPriority,
  normalizeStoredSeason,
} from "@/lib/constants/workorderDefaults";
import { toInventoryStatus } from "@/lib/constants/workorderDomain";
import type { WorkOrder } from "@/types/workorder";

export function normalizeWorkOrderData(workOrder: WorkOrder): WorkOrder {
  return {
    ...workOrder,
    category1: normalizeStoredCategory(workOrder.category1, DEFAULT_WORKORDER_CATEGORY1),
    category2: normalizeStoredCategory(workOrder.category2, DEFAULT_WORKORDER_CATEGORY2),
    category3: normalizeStoredCategory(workOrder.category3, DEFAULT_WORKORDER_CATEGORY3),
    season: normalizeStoredSeason(workOrder.season),
    priority: normalizeStoredPriority(workOrder.priority),
    vendor: normalizeStoredOptionalText(workOrder.vendor),
    dueDate: normalizeStoredOptionalText(workOrder.dueDate),
    inventoryStatus: toInventoryStatus(workOrder.inventoryStatus),
    orderEntries: (workOrder.orderEntries ?? []).map((entry) => ({
      ...entry,
      dueDate: normalizeStoredOptionalText(entry.dueDate),
      priority: normalizeStoredPriority(entry.priority),
    })),
  };
}

export function normalizeWorkOrderDataList(workOrders: WorkOrder[]) {
  return workOrders.map(normalizeWorkOrderData);
}
