import {
  DEFAULT_UNASSIGNED_FACTORY_LABEL,
  DEFAULT_UNSELECTED_OPTION,
  ORDER_FACTORY_UNSELECTABLE_VALUES,
  type OrderFactoryUnselectableValue,
} from "@/lib/constants/workorderDomain";
import type { OrderEntry, WorkOrder } from "@/types/workorder";

export type OrderSubmissionSnapshot = {
  representativeEntry: OrderEntry | null;
  factoryName: string;
  dueDate: string;
  quantity: number;
  laborCost: number;
  lossCost: number;
  priority: string;
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNonNegativeNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

function normalizeComparableSelection(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "").toLocaleLowerCase("ko-KR");
}

export function getRepresentativeOrderEntry(orderEntries?: OrderEntry[] | null): OrderEntry | null {
  return orderEntries?.find((entry) => Boolean(entry)) ?? null;
}

export function getRepresentativeOrderEntryFromWorkOrder(workOrder: WorkOrder): OrderEntry | null {
  return getRepresentativeOrderEntry(workOrder.orderEntries);
}

export function isOrderFactoryUnselectableValue(value: unknown): value is OrderFactoryUnselectableValue {
  const comparable = normalizeComparableSelection(value);
  if (!comparable) return true;
  return ORDER_FACTORY_UNSELECTABLE_VALUES.some((candidate) => normalizeComparableSelection(candidate) === comparable);
}

export function normalizeOrderFactoryName(value: unknown) {
  const normalized = normalizeText(value);
  if (isOrderFactoryUnselectableValue(normalized)) return "";
  return normalized;
}

export function hasValidOrderFactoryName(value: unknown) {
  return Boolean(normalizeOrderFactoryName(value));
}

export function getOrderSubmissionSnapshotFromSources(payload: {
  representativeEntry?: OrderEntry | null;
  vendor?: unknown;
  dueDate?: unknown;
  quantity?: unknown;
  laborCost?: unknown;
  lossCost?: unknown;
  priority?: unknown;
}): OrderSubmissionSnapshot {
  return {
    representativeEntry: payload.representativeEntry ?? null,
    factoryName: normalizeOrderFactoryName(payload.representativeEntry?.factory ?? payload.vendor),
    dueDate: normalizeText(payload.representativeEntry?.dueDate ?? payload.dueDate),
    quantity: normalizeNonNegativeNumber(payload.representativeEntry?.quantity ?? payload.quantity),
    laborCost: normalizeNonNegativeNumber(payload.representativeEntry?.laborCost ?? payload.laborCost),
    lossCost: normalizeNonNegativeNumber(payload.representativeEntry?.lossCost ?? payload.lossCost),
    priority: normalizeText(payload.representativeEntry?.priority ?? payload.priority),
  };
}

export function getOrderSubmissionSnapshot(workOrder: WorkOrder): OrderSubmissionSnapshot {
  const representativeEntry = getRepresentativeOrderEntryFromWorkOrder(workOrder);
  return getOrderSubmissionSnapshotFromSources({
    representativeEntry,
    vendor: workOrder.vendor,
    dueDate: workOrder.dueDate,
    quantity: workOrder.quantity,
    laborCost: workOrder.laborCost,
    lossCost: workOrder.lossCost,
    priority: workOrder.priority,
  });
}

export function syncWorkOrderOrderSnapshot(workOrder: WorkOrder, orderEntries?: OrderEntry[] | null): WorkOrder {
  const representativeEntry = getRepresentativeOrderEntry(orderEntries ?? workOrder.orderEntries);
  if (!representativeEntry) {
    return {
      ...workOrder,
      orderEntries: orderEntries ?? workOrder.orderEntries,
    };
  }

  return {
    ...workOrder,
    orderEntries: orderEntries ?? workOrder.orderEntries,
    vendor: normalizeText(representativeEntry.factory) || DEFAULT_UNSELECTED_OPTION,
    dueDate: normalizeText(representativeEntry.dueDate),
    quantity: normalizeNonNegativeNumber(representativeEntry.quantity),
    laborCost: normalizeNonNegativeNumber(representativeEntry.laborCost),
    lossCost: normalizeNonNegativeNumber(representativeEntry.lossCost),
    priority: normalizeText(representativeEntry.priority),
  };
}

export const ORDER_SUBMISSION_FALLBACKS = {
  unselectedFactory: DEFAULT_UNSELECTED_OPTION,
  unassignedFactory: DEFAULT_UNASSIGNED_FACTORY_LABEL,
} as const;
