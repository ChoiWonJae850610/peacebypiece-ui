import { useI18n } from "@/lib/i18n";
import { getStageDotTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateDisplayStageLabel, translateWorkflowActionLabel, translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ActionProps = WorkOrderDetailViewModel["actionProps"];

function getProcessingLabel(label: string, format: string) {
  const compactLabel = label.replace(/\s+/g, "");
  return format.replace("{label}", compactLabel);
}

export default function WorkOrderDetailTabletActionSection({
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
    <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-stone-900">{copy.title}</div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap justify-end gap-2">
            {actions.map((action, index) => {
              const isProcessingTarget = workflowProcessingLabel === action.label;
              return (
                <button
                  key={`${currentStage}-${action.nextState}-${action.label}`}
                  type="button"
                  onClick={() => onAction(action)}
                  disabled={isActionLocked}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${
                    index === 0 ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-700"
                  }`}
                >
                  {isProcessingTarget ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
                  <span>{isProcessingTarget ? getProcessingLabel(translateWorkflowActionLabel(action, i18n, locale), copy.processingFormat) : translateWorkflowActionLabel(action, i18n, locale)}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {processingMessage ? (
        <div className="mt-4 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700">
          {processingMessage}
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stages.map((stage) => {
          const isCurrent = stage === currentStage;
          return (
            <div key={stage} className={`rounded-2xl border px-3 py-3 ${isCurrent ? "border-stone-900 bg-white" : "border-stone-200 bg-white"}`}>
              <div className="flex items-center gap-2 text-sm font-medium text-stone-900">
                <span className={`h-2.5 w-2.5 rounded-full ${isCurrent ? getStageDotTone(stage) : "bg-stone-300"}`} />
                <span>{translateDisplayStageLabel(stage, i18n)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
