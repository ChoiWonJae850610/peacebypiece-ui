import { useI18n } from "@/lib/i18n";
import { getDisplayStageLabel, getStageDotTone, getStageTextTone } from "@/lib/workorder/presentation/statusPresentation";
import type { DisplayStage } from "@/types/workflow";
import type { WorkflowAction } from "@/types/workorder";

function getStageStepFillTone(stage: DisplayStage) {
  return stage === "completed" ? "bg-stone-900" : getStageDotTone(stage);
}

export default function WorkOrderActionSection({
  stages,
  currentStage,
  actions,
  onAction,
  onSave,
}: {
  stages: DisplayStage[];
  currentStage: DisplayStage;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
  onSave?: (() => void) | null;
}) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.actionSection;
  const stageGroupsCopy = i18n.workorder.stageGroups;
  const currentIndex = stages.indexOf(currentStage);
  const primaryActionIndex = actions.findIndex((action) => !action.label.includes(copy.rejectKeyword));
  const doneTrackTone = "bg-stone-400";
  const stageGroups: Array<{ label: string; stages: DisplayStage[] }> = [
    { label: stageGroupsCopy.making, stages: ["draft", "review_requested", "review_approved"] },
    { label: stageGroupsCopy.production, stages: ["order_requested"] },
    { label: stageGroupsCopy.inspection, stages: ["inspection", "completed"] },
  ];
  const currentGroupIndex = stageGroups.findIndex((group) => group.stages.includes(currentStage));

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 md:mt-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-900">{copy.title}</div>
        </div>
        {actions.length > 0 || (currentStage === "draft" && onSave) ? (
          <div className="flex flex-wrap justify-end gap-2">
            {currentStage === "draft" && onSave ? (
              <button
                type="button"
                onClick={onSave}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                title={copy.saveDraftHint}
              >
                {copy.saveDraftLabel}
              </button>
            ) : null}
            {actions.map((action, index) => {
              const isPrimary = primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
              return (
                <button
                  key={`${currentStage}-${action.nextState}-${action.label}`}
                  type="button"
                  onClick={() => onAction(action)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isPrimary
                      ? "bg-stone-900 text-white hover:bg-stone-800"
                      : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="grid grid-cols-6 gap-2">
          {stages.map((stage, index) => {
            const isDone = index <= currentIndex;
            const isCurrent = stage === currentStage;
            const isCompletedStage = stage === "completed";
            return (
              <div key={stage} className="relative flex flex-col items-center gap-2 text-center">
                {index < stages.length - 1 ? (
                  <div className={`absolute left-1/2 top-3 h-0.5 w-full ${isDone ? doneTrackTone : "bg-stone-200"}`} aria-hidden="true" />
                ) : null}
                <div
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border ${
                    isDone ? `${getStageStepFillTone(stage)} border-transparent` : "border-stone-300 bg-white"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${isDone ? (isCompletedStage ? "bg-white" : "bg-white/90") : "bg-stone-300"}`} />
                </div>
                <div className={`text-xs font-medium ${isCurrent ? getStageTextTone(stage) : "text-stone-500"}`}>
                  {getDisplayStageLabel(stage)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
        <span>{stageGroups[currentGroupIndex]?.label ?? copy.fallbackGroup}</span>
        <span>·</span>
        <span>{getDisplayStageLabel(currentStage)}</span>
      </div>
    </div>
  );
}
