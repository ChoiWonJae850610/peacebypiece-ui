import { getStageDotTone, getStageTextTone } from "@/lib/constants/workflow";
import type { DisplayStage } from "@/types/workflow";
import type { WorkflowAction } from "@/types/workorder";

function getStageStepFillTone(stage: DisplayStage) {
  return stage === "완료" ? "bg-stone-900" : getStageDotTone(stage);
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
    { label: "제작", stages: ["작성중", "검토요청", "검토완료"] },
    { label: "생산", stages: ["발주요청"] },
    { label: "검수", stages: ["검수", "완료"] },
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
                  key={`${currentStage}-${action.nextState}-${action.label}-desktop`}
                  type="button"
                  onClick={() => onAction(action)}
                  className={isPrimary
                    ? "pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 active:bg-black"
                    : "pbp-interactive-button rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200"
                  }
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3 px-1">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1 md:gap-x-5">
          {stageGroups.map((group, index) => {
            const isCurrentGroup = index === currentGroupIndex;
            return (
              <div
                key={group.label}
                className={isCurrentGroup
                  ? "text-base font-semibold leading-none text-stone-900 md:text-lg"
                  : "text-xs font-medium leading-none text-stone-400 md:text-sm"
                }
              >
                {group.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 md:hidden">
        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
          <div className="relative">
            <div className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-4 h-0.5 rounded-full bg-stone-200" />
            {mobileStageSlots.slice(0, -1).map((slot, slotIndex) => {
              if (!slot) return null;
              const nextSlot = mobileStageSlots[slotIndex + 1];
              if (!nextSlot) return null;
              const connectorTone = slot.index < currentIndex ? doneTrackTone : "bg-stone-200";
              return (
                <div
                  key={`mobile-connector-${slotIndex}`}
                  className={`pointer-events-none absolute top-4 h-0.5 rounded-full ${connectorTone}`}
                  style={{ left: `${16.666 + slotIndex * 33.333}%`, width: "33.333%" }}
                />
              );
            })}
            <div className="grid grid-cols-3 gap-2">
              {mobileStageSlots.map((slot, slotIndex) => {
                const stage = slot?.stage;
                const index = slot?.index ?? -1;
                const isPlaceholder = !slot;
                const isCurrent = index === currentIndex;
                const isDone = index >= 0 && index < currentIndex;
                const isCompletedStage = stage === "완료";
                const isCompleted = isDone || (isCompletedStage && isCurrent);
                const isUpcoming = index > currentIndex;

                return (
                  <div key={stage ? `${stage}-mobile` : `placeholder-${slotIndex}`} className={`min-w-0 ${isPlaceholder ? "opacity-0" : ""}`}>
                    <div className="flex min-w-0 flex-col items-center text-center">
                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          isCompleted
                            ? "bg-stone-900 text-white"
                            : isCurrent
                              ? `${getStageStepFillTone(stage!)} text-white ring-2 ring-stone-200`
                              : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        {isPlaceholder ? "" : isCompleted ? "✓" : index + 1}
                      </div>
                      <div className={`mt-2 block min-h-[2rem] w-full min-w-0 break-keep px-1 text-center text-[11px] leading-4 whitespace-normal ${
                        isCurrent
                          ? `font-semibold ${getStageTextTone(stage!)}`
                          : isUpcoming
                            ? "text-stone-400"
                            : "text-stone-600"
                      }`}>
                        {stage ?? ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 hidden pb-1 md:block">
        <div className="flex w-full items-start overflow-hidden">
          {stages.map((stage, index) => {
            const isCurrent = stage === currentStage;
            const isDone = currentIndex >= 0 && index < currentIndex;
            const isCompletedStage = stage === "완료";
            const isCompleted = isDone || (isCompletedStage && isCurrent);
            const isUpcoming = !isCurrent && !isDone;

            return (
              <div key={stage} className="flex min-w-0 flex-1 items-start">
                <div className="flex min-w-0 w-full flex-col items-center text-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isCompleted
                        ? "bg-stone-900 text-white"
                        : isCurrent
                          ? `${getStageStepFillTone(stage)} text-white ring-2 ring-stone-200`
                          : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  <div
                    className={`mt-1.5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-1 text-[11px] leading-4 ${
                      isCurrent
                        ? `font-semibold ${getStageTextTone(stage)}`
                        : isUpcoming
                          ? "text-stone-500"
                          : "text-stone-700"
                    }`}
                  >
                    {stage}
                  </div>
                </div>
                {index < stages.length - 1 ? <div className={`mt-3 h-px min-w-0 flex-1 ${index < currentIndex ? doneTrackTone : "bg-stone-300"}`} /> : null}
              </div>
            );
          })}
        </div>
      </div>

      {actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2 md:hidden">
          {actions.map((action, index) => {
            const isPrimary = primaryActionIndex === -1 ? index === 0 : index === primaryActionIndex;
            return (
              <button
                key={`${currentStage}-${action.nextState}-${action.label}-mobile`}
                type="button"
                onClick={() => onAction(action)}
                className={isPrimary
                  ? "flex-1 pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 active:bg-black sm:flex-none"
                  : "flex-1 pbp-interactive-button rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200 sm:flex-none"
                }
              >
                {action.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
