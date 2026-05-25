import type {
  WorkOrderListSort,
  WorkOrderListStatusFilter,
} from "@/lib/workorder/list/workOrderListControls";

export type WorkOrderSummaryQueryOptions = {
  status: WorkOrderListStatusFilter;
  sort: WorkOrderListSort;
};

export type WorkOrderListOptions = Partial<WorkOrderSummaryQueryOptions>;
