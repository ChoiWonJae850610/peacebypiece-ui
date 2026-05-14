import { useI18n } from "@/lib/i18n";
import { getStageDotTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateDisplayStageLabel, translateWorkflowActionLabel, translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ActionProps = WorkOrderDetailViewModel["actionProps"];

function getProcessingLabel(label: string, format: string) {
  const compactLabel = label.replace(/\s+/g, "");
  return format.replace("{label}", compactLabel);
}

export default function WorkOrderDetailMobileActionSection({
  stages,
  currentStage,
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
  const processingAction = workflowProcessingLabel
    ? actions.find((action) => action.label === workflowProcessingLabel)
    : undefined;
  const processingMessage = workflowProcessingLabel
    ? getProcessingLabel(
        processingAction
          ? translateWorkflowActionLabel(processingAction, i18n, locale)
          : translateWorkOrderDisplayText(workflowProcessingLabel, locale),
        copy.processingFormat,
      )
    : workspaceWriteLockMessage;

  return (
    <section className="pbp-workflow-panel min-w-0 overflow-hidden rounded-2xl border p-3.5 sm:p-4">
      <div className="text-sm font-semibold text-stone-900">{copy.title}</div>
      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        {stages.map((stage) => {
          const isCurrent = stage === currentStage;
          return (
            <div
              key={stage}
              className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                isCurrent ? "pbp-workflow-step-current" : "pbp-workflow-step-idle"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isCurrent ? getStageDotTone(stage) : "bg-[var(--pbp-text-subtle)]"}`} />
              <span className="min-w-0 break-keep">{translateDisplayStageLabel(stage, i18n)}</span>
            </div>
          );
        })}
      </div>
      {processingMessage ? (
        <div className="pbp-workflow-message mt-4 rounded-xl border px-3 py-2 text-xs font-medium">
          {processingMessage}
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {actions.map((action, index) => {
            const isProcessingTarget = workflowProcessingLabel === action.label;
            return (
              <button
                key={`${currentStage}-${action.nextState}-${action.label}`}
                type="button"
                onClick={() => onAction(action)}
                disabled={isActionLocked}
                className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${
                  index === 0 ? "pbp-action-primary" : "pbp-action-secondary border"
                }`}
              >
                {isProcessingTarget ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
                <span className="min-w-0 break-keep">{isProcessingTarget ? getProcessingLabel(translateWorkflowActionLabel(action, i18n, locale), copy.processingFormat) : translateWorkflowActionLabel(action, i18n, locale)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
