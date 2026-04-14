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
import { normalizeWorkOrderCollectionsForStorage } from "@/lib/workorder/structure";

export function normalizeWorkOrderData(workOrder: WorkOrder): WorkOrder {
  const normalizedCollections = normalizeWorkOrderCollectionsForStorage(workOrder);

  return {
    ...normalizedCollections,
    category1: normalizeStoredCategory(normalizedCollections.category1, DEFAULT_WORKORDER_CATEGORY1),
    category2: normalizeStoredCategory(normalizedCollections.category2, DEFAULT_WORKORDER_CATEGORY2),
    category3: normalizeStoredCategory(normalizedCollections.category3, DEFAULT_WORKORDER_CATEGORY3),
    season: normalizeStoredSeason(normalizedCollections.season),
    priority: normalizeStoredPriority(normalizedCollections.priority),
    vendor: normalizeStoredOptionalText(normalizedCollections.vendor),
    dueDate: normalizeStoredOptionalText(normalizedCollections.dueDate),
    inventoryStatus: toInventoryStatus(normalizedCollections.inventoryStatus),
    orderEntries: (normalizedCollections.orderEntries ?? []).map((entry) => ({
      ...entry,
      dueDate: normalizeStoredOptionalText(entry.dueDate),
      priority: normalizeStoredPriority(entry.priority),
    })),
  };
}

export function normalizeWorkOrderDataList(workOrders: WorkOrder[]) {
  return workOrders.map(normalizeWorkOrderData);
}
