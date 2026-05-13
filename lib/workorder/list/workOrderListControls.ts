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

export type WorkOrderListControlOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type WorkOrderListControlCopy = {
  statusFilters: {
    active: string;
    all: string;
    completed: string;
    draft: string;
    reviewRequested: string;
    reviewCompleted: string;
    inspection: string;
    rejected: string;
  };
  sorts: {
    updatedDesc: string;
    createdDesc: string;
    dueDateAsc: string;
    titleAsc: string;
    vendorAsc: string;
  };
};

export function getWorkOrderListStatusFilterOptions(
  copy: WorkOrderListControlCopy,
): WorkOrderListControlOption<WorkOrderListStatusFilter>[] {
  return [
    { value: "active", label: copy.statusFilters.active },
    { value: "review_requested", label: copy.statusFilters.reviewRequested },
    { value: "review_completed", label: copy.statusFilters.reviewCompleted },
    { value: "inspection", label: copy.statusFilters.inspection },
    { value: "draft", label: copy.statusFilters.draft },
    { value: "rejected", label: copy.statusFilters.rejected },
    { value: "completed", label: copy.statusFilters.completed },
    { value: "all", label: copy.statusFilters.all },
  ];
}

export function getWorkOrderListSortOptions(
  copy: WorkOrderListControlCopy,
): WorkOrderListControlOption<WorkOrderListSort>[] {
  return [
    { value: "updatedDesc", label: copy.sorts.updatedDesc },
    { value: "createdDesc", label: copy.sorts.createdDesc },
    { value: "dueDateAsc", label: copy.sorts.dueDateAsc },
    { value: "titleAsc", label: copy.sorts.titleAsc },
    { value: "vendorAsc", label: copy.sorts.vendorAsc },
  ];
}

export function isDefaultWorkOrderListControls(params: {
  statusFilter: WorkOrderListStatusFilter;
  sort: WorkOrderListSort;
  searchQuery: string;
}): boolean {
  return (
    params.statusFilter === DEFAULT_WORK_ORDER_LIST_STATUS_FILTER &&
    params.sort === DEFAULT_WORK_ORDER_LIST_SORT &&
    params.searchQuery.trim().length === 0
  );
}

export function isWorkflowStateStatusFilter(value: WorkOrderListStatusFilter): value is WorkflowStateValue {
  return value !== "active" && value !== "all";
}
