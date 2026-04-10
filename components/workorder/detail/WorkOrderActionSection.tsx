import { getDisplayStageLabel, getStageDotTone, getStageTextTone } from "@/lib/constants/workflow";
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
}: {
  stages: DisplayStage[];
  currentStage: DisplayStage;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
}) {
  const currentIndex = stages.indexOf(currentStage);
  const primaryActionIndex = actions.findIndex((action) => !action.label.includes("반려"));
  const doneTrackTone = "bg-stone-400";
  const stageGroups: Array<{ label: string; stages: DisplayStage[] }> = [
    { label: "제작", stages: ["draft", "review_requested", "review_approved"] },
    { label: "생산", stages: ["order_requested"] },
    { label: "검수", stages: ["inspection", "completed"] },
  ];
  const currentGroupIndex = stageGroups.findIndex((group) => group.stages.includes(currentStage));
  const mobileStageSlots = [-1, 0, 1].map((offset) => {
    const stageIndex = currentIndex + offset;
    if (stageIndex < 0 || stageIndex >= stages.length) return null;
    return {
      index: stageIndex,
      stage: stages[stageIndex],
    };
  });

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3 md:mt-5 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-stone-900 md:text-sm">진행 단계</div>
        </div>
        {actions.length > 0 ? (
          <div className="hidden flex-wrap justify-end gap-2 md:flex">
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

      <div className="mt-3 hidden md:block">
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

      <div className="mt-3 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {mobileStageSlots.map((slot, slotIndex) => {
            if (!slot) return <div key={`empty-${slotIndex}`} className="h-full rounded-2xl border border-dashed border-transparent" />;
            const isCurrent = slot.stage === currentStage;
            const isDone = slot.index <= currentIndex;
            const isCompletedStage = slot.stage === "completed";
            return (
              <div
                key={slot.stage}
                className={`flex min-h-[84px] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center ${
                  isCurrent ? "border-stone-900 bg-white shadow-sm" : "border-stone-200 bg-stone-50"
                }`}
              >
                <div
                  className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full border ${
                    isDone ? `${getStageStepFillTone(slot.stage)} border-transparent` : "border-stone-300 bg-white"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${isDone ? (isCompletedStage ? "bg-white" : "bg-white/90") : "bg-stone-300"}`} />
                </div>
                <div className={`text-[11px] font-semibold leading-4 ${isCurrent ? getStageTextTone(slot.stage) : "text-stone-500"}`}>
                  {getDisplayStageLabel(slot.stage)}
                </div>
              </div>
            );
          })}
        </div>

        {actions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action, index) => {
              const isPrimary = primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
              return (
                <button
                  key={`${currentStage}-mobile-${action.nextState}-${action.label}`}
                  type="button"
                  onClick={() => onAction(action)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
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

      <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
        <span>{stageGroups[currentGroupIndex]?.label ?? "진행"}</span>
        <span>·</span>
        <span>{getDisplayStageLabel(currentStage)}</span>
      </div>
    </div>
  );
}
