import { WORKFLOW_ACTION_TYPE } from "@/lib/constants/workflowActions";
import { WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import { AppBadge, WaflButton, WaflSurface } from "@/components/common/ui";
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

export default function WorkOrderDetailMobileActionSection({
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
    <WaflSurface as="section" component="workflow-panel" tone="muted" className="pbp-workflow-panel overflow-hidden p-3.5 sm:p-4">
      <div className="text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.title}</div>
      <ol className="mt-3 grid min-w-0 gap-2">
        {stages.map((stage, index) => {
          const isCurrent = stage === currentStage;
          const isDone = stages.indexOf(currentStage) >= index;
          return (
            <li
              key={stage}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 wafl-shape-control border px-3 py-2.5 text-xs font-medium ${
                isCurrent ? "pbp-workflow-step-current" : "pbp-workflow-step-idle"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  isCurrent
                    ? `${getStageDotTone(stage)} text-white`
                    : isDone
                      ? "bg-[var(--pbp-selected-border)] text-white"
                      : "bg-[var(--pbp-surface-soft)] text-[var(--pbp-text-muted)]"
                }`}
              >
                {index + 1}
              </span>
              <span className="min-w-0 break-keep">{translateDisplayStageLabel(stage, i18n)}</span>
            </li>
          );
        })}
      </ol>
      {showMaterialOrderPendingBadge ? (
        <AppBadge tone="warning" size="sm" className="mt-3">
          {copy.materialOrderPendingBadge}
        </AppBadge>
      ) : null}
      {actions.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {actions.map((action, index) => {
            const isProcessingTarget = workflowProcessingLabel === action.label;
            const translatedLabel = translateWorkflowActionLabel(action, i18n, locale);
            const isPrimary = primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
            const helperId = isActionLocked
              ? `workorder-${currentStage}-${action.nextState}-${index}-reason`
              : undefined;
            return (
              <div key={`${currentStage}-${action.nextState}-${action.label}`} className="grid gap-1">
                <WaflButton
                  onClick={() => onAction(action)}
                  disabled={isActionLocked}
                  title={isActionLocked ? formatActionCopy(copy.disabledActionTitleFormat, translatedLabel) : formatActionCopy(copy.actionTitleFormat, translatedLabel)}
                  aria-label={formatActionCopy(copy.actionAriaFormat, translatedLabel)}
                  aria-describedby={helperId}
                  variant={isPrimary ? "primary" : "secondary"}
                  size="lg"
                  width="full"
                  className="min-w-0 px-3 text-center text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isProcessingTarget ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
                  <span className="min-w-0 break-keep">{isProcessingTarget ? getProcessingLabel(translatedLabel, copy.processingFormat) : translatedLabel}</span>
                </WaflButton>
                {isActionLocked && lockedReason ? (
                  <span id={helperId} className="text-center text-[11px] font-medium leading-snug text-[var(--pbp-text-muted)]">
                    {lockedReason}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </WaflSurface>
  );
}
