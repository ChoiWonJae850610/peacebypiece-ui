import type { WorkflowStateValue } from "@/lib/constants/workorderStates";

export const WORK_ORDER_LIST_STATUS_FILTERS = [
  "active",
  "all",
  "completed",
  "draft",
  "review_requested",
  "review_completed",
  "inspection",
  "rejected",
] as const;

export const WORK_ORDER_LIST_SORTS = [
  "updatedDesc",
  "createdDesc",
  "dueDateAsc",
  "titleAsc",
  "vendorAsc",
] as const;

export type WorkOrderListStatusFilter = (typeof WORK_ORDER_LIST_STATUS_FILTERS)[number];
export type WorkOrderListSort = (typeof WORK_ORDER_LIST_SORTS)[number];

export const DEFAULT_WORK_ORDER_LIST_STATUS_FILTER: WorkOrderListStatusFilter = "active";
export const DEFAULT_WORK_ORDER_LIST_SORT: WorkOrderListSort = "updatedDesc";

export function normalizeWorkOrderListStatusFilter(value: string | null | undefined): WorkOrderListStatusFilter {
  return WORK_ORDER_LIST_STATUS_FILTERS.includes(value as WorkOrderListStatusFilter)
    ? (value as WorkOrderListStatusFilter)
    : DEFAULT_WORK_ORDER_LIST_STATUS_FILTER;
}

export function normalizeWorkOrderListSort(value: string | null | undefined): WorkOrderListSort {
  return WORK_ORDER_LIST_SORTS.includes(value as WorkOrderListSort)
    ? (value as WorkOrderListSort)
    : DEFAULT_WORK_ORDER_LIST_SORT;
}

export function isWorkflowStateStatusFilter(value: WorkOrderListStatusFilter): value is WorkflowStateValue {
  return value !== "active" && value !== "all";
}
