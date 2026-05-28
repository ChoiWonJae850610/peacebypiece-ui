import {
  WorkflowProgressPanel,
  type WorkflowProgressPanelAction,
  type WorkflowProgressPanelStep,
} from "@/components/common/workflow/WorkflowProgressPanel";
import { WORKFLOW_ACTION_TYPE } from "@/lib/constants/workflowActions";
import { DISPLAY_STAGE, WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import { useI18n } from "@/lib/i18n";
import {
  getStageDotTone,
  getStageTextTone,
} from "@/lib/workorder/presentation/statusPresentation";
import {
  translateDisplayStageLabel,
  translateWorkflowActionLabel,
} from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { DisplayStage } from "@/types/workflow";
import type { WorkflowAction } from "@/types/workorder";

function getStageStepFillTone(stage: DisplayStage) {
  return stage === DISPLAY_STAGE.completed
    ? "bg-[var(--pbp-workorder-status-completed-bg)]"
    : getStageDotTone(stage);
}

function getProcessingLabel(label: string, format: string) {
  const compactLabel = label.replace(/\s+/g, "");
  return format.replace("{label}", compactLabel);
}

export default function WorkOrderActionSection({
  stages,
  currentStage,
  currentWorkflowState,
  actions,
  onAction,
  workflowProcessingLabel = null,
  isWorkspaceWriteLocked = false,
  canOpenInspectionModal = false,
  onOpenInspectionModal,
}: {
  stages: DisplayStage[];
  currentStage: DisplayStage;
  currentWorkflowState?: string | null;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
  workflowProcessingLabel?: string | null;
  isWorkspaceWriteLocked?: boolean;
  workspaceWriteLockMessage?: string;
  canOpenInspectionModal?: boolean;
  onOpenInspectionModal?: () => void;
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.actionSection;
  const stageGroupsCopy = i18n.workorder.stageGroups;
  const currentIndex = stages.indexOf(currentStage);
  const isWorkflowProcessing = Boolean(workflowProcessingLabel);
  const isActionLocked =
    isWorkflowProcessing || Boolean(isWorkspaceWriteLocked);
  const showInspectionAction =
    canOpenInspectionModal && Boolean(onOpenInspectionModal);
  const primaryActionIndex = actions.findIndex(
    (action) => action.actionType !== WORKFLOW_ACTION_TYPE.rejectReview,
  );
  const stageGroups: Array<{ label: string; stages: DisplayStage[] }> = [
    {
      label: stageGroupsCopy.making,
      stages: [
        DISPLAY_STAGE.draft,
        DISPLAY_STAGE.reviewRequested,
        DISPLAY_STAGE.reviewCompleted,
      ],
    },
    { label: stageGroupsCopy.production, stages: [DISPLAY_STAGE.requestOrder] },
    {
      label: stageGroupsCopy.inspection,
      stages: [DISPLAY_STAGE.inspection, DISPLAY_STAGE.completed],
    },
  ];
  const currentGroupIndex = stageGroups.findIndex((group) =>
    group.stages.includes(currentStage),
  );
  const showMaterialOrderPendingBadge =
    currentWorkflowState === WORKFLOW_STATE.materialOrderPending;

  const progressSteps: WorkflowProgressPanelStep[] = stages.map(
    (stage, index) => ({
      key: stage,
      label: translateDisplayStageLabel(stage, i18n),
      isDone: index <= currentIndex,
      isCurrent: stage === currentStage,
      isCompleted: stage === DISPLAY_STAGE.completed,
      fillClassName: getStageStepFillTone(stage),
      currentTextClassName: getStageTextTone(stage),
    }),
  );

  const progressActions: WorkflowProgressPanelAction[] = actions.map(
    (action, index) => {
      const isPrimary =
        primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
      const translatedLabel = translateWorkflowActionLabel(
        action,
        i18n,
        locale,
      );
      const isProcessingTarget = workflowProcessingLabel === action.label;
      return {
        key: `${currentStage}-${action.nextState}-${action.label}`,
        label: isProcessingTarget
          ? getProcessingLabel(translatedLabel, copy.processingFormat)
          : translatedLabel,
        onClick: () => onAction(action),
        disabled: isActionLocked,
        isPrimary,
        isProcessing: isProcessingTarget,
      };
    },
  );

  if (showInspectionAction) {
    progressActions.push({
      key: `${currentStage}-inspection-action`,
      label: copy.inspectionAction,
      onClick: () => onOpenInspectionModal?.(),
      disabled: isActionLocked,
      isPrimary: progressActions.length === 0,
    });
  }

  const directOrderPath = stages.includes(DISPLAY_STAGE.draft) &&
    stages.includes(DISPLAY_STAGE.requestOrder)
      ? {
          fromKey: DISPLAY_STAGE.draft,
          toKey: DISPLAY_STAGE.requestOrder,
          isVisible: true,
          isActive: false,
        }
      : undefined;

  return (
    <WorkflowProgressPanel
      title={copy.title}
      steps={progressSteps}
      actions={progressActions}
      className="mt-5"
      directPath={directOrderPath}
      footer={
        <>
          <span>
            {stageGroups[currentGroupIndex]?.label ?? copy.fallbackGroup}
          </span>
          <span>·</span>
          <span>{translateDisplayStageLabel(currentStage, i18n)}</span>
          {showMaterialOrderPendingBadge ? (
            <>
              <span>·</span>
              <span className="rounded-full bg-[var(--pbp-workorder-status-request-order-bg)] px-2 py-0.5 font-semibold text-[var(--pbp-workorder-status-request-order-text)]">
                {copy.materialOrderPendingBadge}
              </span>
            </>
          ) : null}
        </>
      }
    />
  );
}
