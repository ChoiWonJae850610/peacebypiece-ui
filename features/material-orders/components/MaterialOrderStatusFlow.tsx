import { WorkflowProgressPanel, type WorkflowProgressPanelAction, type WorkflowProgressPanelStep } from "@/components/common/workflow/WorkflowProgressPanel";
import { WORKFLOW_PATH } from "@/lib/constants/workflowPaths";
import { formatMaterialOrderStatusLabel } from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder, MaterialOrderStatus } from "@/lib/material-orders/types";

type MaterialOrderStatusFlowProps = {
  status: MaterialOrderStatus;
  workflowPath: MaterialOrder["workflowPath"];
  changing: boolean;
  message: string | null;
  onChangeStatus: (status: MaterialOrderStatus) => void;
};

const MATERIAL_ORDER_STATUS_STEPS: Array<{
  status: MaterialOrderStatus;
  label: string;
}> = [
  { status: "draft", label: "작성중" },
  { status: "review_requested", label: "검토요청" },
  { status: "approved", label: "발주요청" },
  { status: "order_placed", label: "발주완료" },
];

export function MaterialOrderStatusFlow({
  status,
  workflowPath,
  changing,
  message,
  onChangeStatus,
}: MaterialOrderStatusFlowProps) {
  const currentIndex = Math.max(
    0,
    MATERIAL_ORDER_STATUS_STEPS.findIndex((step) => step.status === status),
  );
  const actions = resolveMaterialOrderStatusActions(status);
  const primaryActionIndex = actions.length > 0 ? actions.length - 1 : -1;
  const progressSteps: WorkflowProgressPanelStep[] = MATERIAL_ORDER_STATUS_STEPS.map(
    (step, index) => ({
      key: step.status,
      label: step.label,
      isDone: index <= currentIndex,
      isCurrent: step.status === status,
    }),
  );
  const progressActions: WorkflowProgressPanelAction[] = actions.map(
    (action, index) => ({
      key: `${status}-${action.nextStatus}`,
      label: action.label,
      onClick: () => onChangeStatus(action.nextStatus),
      disabled: changing,
      isPrimary: index === primaryActionIndex,
    }),
  );

  return (
    <WorkflowProgressPanel
      title="진행 단계"
      steps={progressSteps}
      actions={progressActions}
      pathMode={workflowPath === WORKFLOW_PATH.directOrder ? "directOrder" : "standard"}
      directPath={{
        fromKey: "draft",
        toKey: "approved",
        isVisible: true,
        isActive: workflowPath === WORKFLOW_PATH.directOrder,
      }}
      footer={
        <>
          <span>자재 발주</span>
          <span>·</span>
          <span>{message ?? formatMaterialOrderStatusLabel(status)}</span>
        </>
      }
    />
  );
}

function resolveMaterialOrderStatusActions(
  status: MaterialOrderStatus,
): Array<{ label: string; nextStatus: MaterialOrderStatus }> {
  switch (status) {
    case "draft":
      return [
        { label: "검토 요청", nextStatus: "review_requested" },
        { label: "발주 요청", nextStatus: "approved" },
      ];
    case "review_requested":
      return [{ label: "검토 취소", nextStatus: "draft" }];
    case "approved":
      return [{ label: "발주 완료", nextStatus: "order_placed" }];
    default:
      return [];
  }
}
