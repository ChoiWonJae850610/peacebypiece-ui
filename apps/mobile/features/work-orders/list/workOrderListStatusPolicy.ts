import type {
  WorkOrderListStatusFilter,
  WorkOrderStatus,
} from "../../../domain/mobileContract";

export type WorkOrderWorkflowBadgeVariant =
  | "draft"
  | "delivery"
  | "progress"
  | "completed"
  | "hold";

type WorkOrderWorkflowPresentation = {
  readonly filter: Exclude<WorkOrderListStatusFilter, "all">;
  readonly label: string;
  readonly variant: WorkOrderWorkflowBadgeVariant;
};

export const WORK_ORDER_STATUS_FILTER_OPTIONS: readonly {
  readonly id: WorkOrderListStatusFilter;
  readonly label: string;
}[] = [
  { id: "all", label: "전체" },
  { id: "draft", label: "작성 중" },
  { id: "delivery", label: "전달·발행" },
  { id: "progress", label: "진행 중" },
  { id: "completed", label: "완료" },
  { id: "hold_cancel", label: "보류·취소" },
];

export const WORK_ORDER_STATUS_LABEL: Readonly<Record<WorkOrderStatus, string>> = {
  draft: "작성 중",
  ready_to_issue: "전달·발행",
  issued: "진행 중",
  revised: "작성 중",
  completed: "완료",
  cancelled: "보류·취소",
};

const WORK_ORDER_WORKFLOW_PRESENTATION: Readonly<Record<WorkOrderStatus, WorkOrderWorkflowPresentation>> = {
  draft: { filter: "draft", label: WORK_ORDER_STATUS_LABEL.draft, variant: "draft" },
  ready_to_issue: { filter: "delivery", label: WORK_ORDER_STATUS_LABEL.ready_to_issue, variant: "delivery" },
  issued: { filter: "progress", label: WORK_ORDER_STATUS_LABEL.issued, variant: "progress" },
  revised: { filter: "draft", label: WORK_ORDER_STATUS_LABEL.revised, variant: "draft" },
  completed: { filter: "completed", label: WORK_ORDER_STATUS_LABEL.completed, variant: "completed" },
  cancelled: { filter: "hold_cancel", label: WORK_ORDER_STATUS_LABEL.cancelled, variant: "hold" },
};

export function getWorkOrderWorkflowPresentation(status: WorkOrderStatus): WorkOrderWorkflowPresentation {
  return WORK_ORDER_WORKFLOW_PRESENTATION[status];
}

export function matchesWorkOrderStatusFilter(
  status: WorkOrderStatus,
  filter: WorkOrderListStatusFilter,
): boolean {
  return filter === "all" || WORK_ORDER_WORKFLOW_PRESENTATION[status].filter === filter;
}
