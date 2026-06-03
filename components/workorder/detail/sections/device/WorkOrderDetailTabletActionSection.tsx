import { WORKFLOW_ACTION_TYPE } from "@/lib/constants/workflowActions";
import { WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import { useI18n } from "@/lib/i18n";
import { getStageDotTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateDisplayStageLabel, translateWorkflowActionLabel } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ActionProps = WorkOrderDetailViewModel["actionProps"];

function getProcessingLabel(label: string, format: string) {
  const compactLabel = label.replace(/\s+/g, "");
  return format.replace("{label}", compactLabel);
}

function formatActionCopy(format: string, label: string) {
  return format.replace("{label}", label);
}

export default function WorkOrderDetailTabletActionSection({
  stages,
  currentStage,
  currentWorkflowState,
  actions,
  onAction,
  workflowProcessingLabel = null,
  isWorkspaceWriteLocked = false,
  workspaceWriteLockMessage,
}: ActionProps) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.actionSection;
  const isWorkflowProcessing = Boolean(workflowProcessingLabel);
  const isActionLocked = isWorkflowProcessing || Boolean(isWorkspaceWriteLocked);
  const lockedReason = isWorkflowProcessing
    ? copy.processingLockedReason
    : isWorkspaceWriteLocked
      ? workspaceWriteLockMessage || copy.workspaceLockedReason
      : null;
  const primaryActionIndex = actions.findIndex(
    (action) => action.actionType !== WORKFLOW_ACTION_TYPE.rejectReview,
  );
  const showMaterialOrderPendingBadge = currentWorkflowState === WORKFLOW_STATE.materialOrderPending;

  return (
    <section className="pbp-workflow-panel rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-stone-900">{copy.title}</div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-2">
            {actions.map((action, index) => {
              const isProcessingTarget = workflowProcessingLabel === action.label;
              const translatedLabel = translateWorkflowActionLabel(action, i18n, locale);
              const isPrimary = primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
              const helperId = isActionLocked
                ? `workorder-${currentStage}-${action.nextState}-${index}-reason`
                : undefined;
              return (
                <div key={`${currentStage}-${action.nextState}-${action.label}`} className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => onAction(action)}
                    disabled={isActionLocked}
                    title={isActionLocked ? formatActionCopy(copy.disabledActionTitleFormat, translatedLabel) : formatActionCopy(copy.actionTitleFormat, translatedLabel)}
                    aria-label={formatActionCopy(copy.actionAriaFormat, translatedLabel)}
                    aria-describedby={helperId}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${
                      isPrimary ? "pbp-action-primary" : "pbp-action-secondary border"
                    }`}
                  >
                    {isProcessingTarget ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
                    <span>{isProcessingTarget ? getProcessingLabel(translatedLabel, copy.processingFormat) : translatedLabel}</span>
                  </button>
                  {isActionLocked && lockedReason ? (
                    <span id={helperId} className="text-right text-[11px] font-medium leading-snug text-[var(--pbp-text-muted)]">
                      {lockedReason}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      {showMaterialOrderPendingBadge ? (
        <div className="mt-3 inline-flex w-fit rounded-full bg-[var(--pbp-workorder-status-request-order-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--pbp-workorder-status-request-order-text)]">
          {copy.materialOrderPendingBadge}
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stages.map((stage) => {
          const isCurrent = stage === currentStage;
          return (
            <div key={stage} className={`rounded-2xl border px-3 py-3 ${isCurrent ? "pbp-workflow-step-current" : "pbp-workflow-step-idle"}`}>
              <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
                <span className={`h-2.5 w-2.5 rounded-full ${isCurrent ? getStageDotTone(stage) : "bg-[var(--pbp-text-subtle)]"}`} />
                <span>{translateDisplayStageLabel(stage, i18n)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
