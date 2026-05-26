import { WORKFLOW_ACTION_TYPE } from "@/lib/constants/workflowActions";
import { DISPLAY_STAGE, WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import { useI18n } from "@/lib/i18n";
import { getStageDotTone, getStageTextTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateDisplayStageLabel, translateWorkflowActionLabel } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { DisplayStage } from "@/types/workflow";
import type { WorkflowAction } from "@/types/workorder";

function getStageStepFillTone(stage: DisplayStage) {
  return stage === DISPLAY_STAGE.completed ? "bg-[var(--pbp-workorder-status-completed-bg)]" : getStageDotTone(stage);
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
}: {
  stages: DisplayStage[];
  currentStage: DisplayStage;
  currentWorkflowState?: string | null;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
  workflowProcessingLabel?: string | null;
  isWorkspaceWriteLocked?: boolean;
  workspaceWriteLockMessage?: string;
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.actionSection;
  const stageGroupsCopy = i18n.workorder.stageGroups;
  const currentIndex = stages.indexOf(currentStage);
  const isWorkflowProcessing = Boolean(workflowProcessingLabel);
  const isActionLocked = isWorkflowProcessing || Boolean(isWorkspaceWriteLocked);
  const primaryActionIndex = actions.findIndex((action) => action.actionType !== WORKFLOW_ACTION_TYPE.rejectReview);
  const doneTrackTone = "bg-[var(--pbp-selected-border)]";
  const stageGroups: Array<{ label: string; stages: DisplayStage[] }> = [
    { label: stageGroupsCopy.making, stages: [DISPLAY_STAGE.draft, DISPLAY_STAGE.reviewRequested, DISPLAY_STAGE.reviewCompleted] },
    { label: stageGroupsCopy.production, stages: [DISPLAY_STAGE.requestOrder] },
    { label: stageGroupsCopy.inspection, stages: [DISPLAY_STAGE.inspection, DISPLAY_STAGE.completed] },
  ];
  const currentGroupIndex = stageGroups.findIndex((group) => group.stages.includes(currentStage));
  const showMaterialOrderPendingBadge = currentWorkflowState === WORKFLOW_STATE.materialOrderPending;

  return (
    <div className="pbp-workflow-panel mt-5 rounded-[24px] border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-900">{copy.title}</div>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-2">
            {actions.map((action, index) => {
              const isPrimary = primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
              const isProcessingTarget = workflowProcessingLabel === action.label;
              return (
                <button
                  key={`${currentStage}-${action.nextState}-${action.label}`}
                  type="button"
                  onClick={() => onAction(action)}
                  disabled={isActionLocked}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    isPrimary
                      ? "pbp-action-primary"
                      : "pbp-action-secondary border"
                  }`}
                >
                  {isProcessingTarget ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
                  <span>{isProcessingTarget ? getProcessingLabel(translateWorkflowActionLabel(action, i18n, locale), copy.processingFormat) : translateWorkflowActionLabel(action, i18n, locale)}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((stage, index) => {
            const isDone = index <= currentIndex;
            const isCurrent = stage === currentStage;
            const isCompletedStage = stage === DISPLAY_STAGE.completed;
            return (
              <div key={stage} className="relative flex flex-col items-center gap-2 text-center">
                {index < stages.length - 1 ? (
                  <div className={`absolute left-1/2 top-3 h-0.5 w-full ${isDone ? doneTrackTone : "bg-[var(--pbp-border)]"}`} aria-hidden="true" />
                ) : null}
                <div
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border ${
                    isDone ? `${getStageStepFillTone(stage)} border-transparent` : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${isDone ? (isCompletedStage ? "bg-white" : "bg-white/90") : "bg-[var(--pbp-text-subtle)]"}`} />
                </div>
                <div className={`text-xs font-medium ${isCurrent ? getStageTextTone(stage) : "text-[var(--pbp-text-muted)]"}`}>
                  {translateDisplayStageLabel(stage, i18n)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--pbp-text-muted)]">
        <span>{stageGroups[currentGroupIndex]?.label ?? copy.fallbackGroup}</span>
        <span>·</span>
        <span>{translateDisplayStageLabel(currentStage, i18n)}</span>
        {showMaterialOrderPendingBadge ? (
          <>
            <span>·</span>
            <span className="rounded-full bg-[var(--pbp-workorder-status-request-order-bg)] px-2 py-0.5 font-semibold text-[var(--pbp-workorder-status-request-order-text)]">{copy.materialOrderPendingBadge}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
