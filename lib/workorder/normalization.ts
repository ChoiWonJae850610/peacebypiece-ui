import {
  normalizeStoredOptionalText,
  normalizeStoredPriority,
  normalizeStoredSeason,
} from "@/lib/constants/workorderDefaults";
import { toInventoryStatus } from "@/lib/constants/workorderDomain";
import type { WorkOrder } from "@/types/workorder";
import { normalizeWorkOrderCollectionsForStorage } from "@/lib/workorder/structure";
import { normalizeCategorySelection } from "@/lib/workorder/normalizeRules";

export function normalizeWorkOrderData(workOrder: WorkOrder): WorkOrder {
  const normalizedCollections = normalizeWorkOrderCollectionsForStorage(workOrder);

  const normalizedCategory = normalizeCategorySelection({
    category1: normalizedCollections.category1,
    category2: normalizedCollections.category2,
    category3: normalizedCollections.category3,
  });

  return {
    ...normalizedCollections,
    ...normalizedCategory,
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
