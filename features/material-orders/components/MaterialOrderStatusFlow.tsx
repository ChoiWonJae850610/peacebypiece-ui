import { WorkflowProgressPanel, type WorkflowProgressPanelAction, type WorkflowProgressPanelLayout, type WorkflowProgressPanelStep } from "@/components/common/workflow/WorkflowProgressPanel";
import { WORKFLOW_PATH } from "@/lib/constants/workflowPaths";
import { formatMaterialOrderStatusLabel } from "@/lib/material-orders/materialOrderWorkspaceClient";
import {
  MATERIAL_ORDER_STATUS_STEPS,
  resolveMaterialOrderStatusActions,
} from "@/lib/material-orders/statusFlow";
import type { MaterialOrder, MaterialOrderStatus } from "@/lib/material-orders/types";

type MaterialOrderStatusFlowProps = {
  status: MaterialOrderStatus;
  workflowPath: MaterialOrder["workflowPath"];
  changing: boolean;
  onChangeStatus: (status: MaterialOrderStatus) => void;
  compact?: boolean;
  layout?: WorkflowProgressPanelLayout;
};

export function MaterialOrderStatusFlow({
  status,
  workflowPath,
  changing,
  onChangeStatus,
  compact = false,
  layout = "horizontal",
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
      disabledReason: changing ? "발주 상태 변경 처리 중입니다." : undefined,
      title: changing ? "발주 상태 변경 처리 중입니다." : `${action.label} 단계로 변경`,
      ariaLabel: `${formatMaterialOrderStatusLabel(status)}에서 ${action.label} 단계로 변경`,
      isPrimary: index === primaryActionIndex,
      isProcessing: changing,
    }),
  );

  return (
    <WorkflowProgressPanel
      title="발주 진행 단계"
      steps={progressSteps}
      actions={progressActions}
      density={compact ? "compact" : "default"}
      layout={layout}
      className={compact || layout === "vertical" ? "rounded-[var(--pbp-radius-wafl)] shadow-none" : undefined}
      pathMode={workflowPath === WORKFLOW_PATH.directOrder ? "directOrder" : "standard"}
      directPath={{
        fromKey: "draft",
        toKey: "approved",
        isVisible: true,
        isActive: workflowPath === WORKFLOW_PATH.directOrder,
      }}
      footer={
        <>
          <span>원단·부자재 발주</span>
          <span>·</span>
          <span>{formatMaterialOrderStatusLabel(status)}</span>
          {changing ? (
            <>
              <span>·</span>
              <span>상태 변경 처리 중</span>
            </>
          ) : null}
        </>
      }
    />
  );
}

