import { WORKFLOW_STATE, type WorkflowStateValue } from "@/lib/constants/workorderStates";

export const WORK_ORDER_LIST_STATUS_FILTERS = [
  "active",
  "all",
  WORKFLOW_STATE.completed,
  WORKFLOW_STATE.draft,
  WORKFLOW_STATE.reviewRequested,
  WORKFLOW_STATE.reviewCompleted,
  WORKFLOW_STATE.inspection,
  WORKFLOW_STATE.rejected,
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
    { value: WORKFLOW_STATE.reviewRequested, label: copy.statusFilters.reviewRequested },
    { value: WORKFLOW_STATE.reviewCompleted, label: copy.statusFilters.reviewCompleted },
    { value: WORKFLOW_STATE.inspection, label: copy.statusFilters.inspection },
    { value: WORKFLOW_STATE.draft, label: copy.statusFilters.draft },
    { value: WORKFLOW_STATE.rejected, label: copy.statusFilters.rejected },
    { value: WORKFLOW_STATE.completed, label: copy.statusFilters.completed },
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
